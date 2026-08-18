import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { PrismaService } from '../database/prisma.service.js'
import { OrderStatus, Prisma, ReturnStatus } from '../generated/prisma/client.js'
import type {
  CompleteAdminReturnDto,
  CreateAdminReturnDto,
  UpdateAdminReturnStatusDto,
} from './dto/admin-return.dto.js'

const returnEligibleStatuses: OrderStatus[] = [
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.PARTIALLY_REFUNDED,
  OrderStatus.REFUNDED,
]

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: AuthenticatedUser, orderNumber: string, input: CreateAdminReturnDto) {
    if (new Set(input.items.map((item) => item.orderItemId)).size !== input.items.length) {
      throw new BadRequestException('Each order item can appear only once in a return.')
    }
    const returnId = await this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { number: orderNumber },
        select: {
          id: true,
          number: true,
          status: true,
          items: { select: { id: true, quantity: true } },
        },
      })
      if (!order) throw new NotFoundException('Order not found.')
      if (!returnEligibleStatuses.includes(order.status)) {
        throw new BadRequestException('Returns can only be opened for shipped, delivered, or refunded orders.')
      }
      const orderItems = new Map(order.items.map((item) => [item.id, item]))
      if (input.items.some((item) => !orderItems.has(item.orderItemId))) {
        throw new BadRequestException('One or more return items do not belong to this order.')
      }
      const committed = await transaction.returnItem.groupBy({
        by: ['orderItemId'],
        where: {
          orderItemId: { in: input.items.map((item) => item.orderItemId) },
          productReturn: { status: { not: ReturnStatus.REJECTED } },
        },
        _sum: { quantity: true },
      })
      const committedByItem = new Map(committed.map((item) => [item.orderItemId, item._sum.quantity ?? 0]))
      for (const item of input.items) {
        const purchased = orderItems.get(item.orderItemId)!.quantity
        const remaining = purchased - (committedByItem.get(item.orderItemId) ?? 0)
        if (item.quantity > remaining) {
          throw new BadRequestException(`Return quantity cannot exceed the ${remaining} remaining unit${remaining === 1 ? '' : 's'} for an item.`)
        }
      }
      const productReturn = await transaction.productReturn.create({
        data: {
          orderId: order.id,
          reason: input.reason,
          createdByUserId: actor.id,
          items: { create: input.items },
        },
        select: { id: true },
      })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'RETURN_OPENED',
          resourceType: 'PRODUCT_RETURN',
          resourceId: productReturn.id,
          result: 'SUCCESS',
          reason: input.reason,
          metadata: { orderNumber: order.number, itemCount: input.items.length },
        },
      })
      return productReturn.id
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    return this.get(returnId)
  }

  async updateStatus(
    actor: AuthenticatedUser,
    returnId: string,
    input: UpdateAdminReturnStatusDto,
  ) {
    const previousStatuses: Record<UpdateAdminReturnStatusDto['status'], ReturnStatus> = {
      [ReturnStatus.APPROVED]: ReturnStatus.REQUESTED,
      [ReturnStatus.REJECTED]: ReturnStatus.REQUESTED,
      [ReturnStatus.RECEIVED]: ReturnStatus.APPROVED,
    }
    const previousStatus = previousStatuses[input.status]
    await this.prisma.$transaction(async (transaction) => {
      const changedAt = new Date()
      const updated = await transaction.productReturn.updateMany({
        where: { id: returnId, status: previousStatus },
        data: {
          status: input.status,
          resolutionNote: input.resolutionNote,
          ...(input.status === ReturnStatus.APPROVED ? { approvedAt: changedAt } : {}),
          ...(input.status === ReturnStatus.REJECTED ? { rejectedAt: changedAt } : {}),
          ...(input.status === ReturnStatus.RECEIVED ? { receivedAt: changedAt } : {}),
        },
      })
      if (updated.count !== 1) {
        const exists = await transaction.productReturn.findUnique({ where: { id: returnId }, select: { id: true } })
        if (!exists) throw new NotFoundException('Return not found.')
        throw new ConflictException(`Return must be ${previousStatus.toLowerCase()} before it can move to ${input.status.toLowerCase()}.`)
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: `RETURN_${input.status}`,
          resourceType: 'PRODUCT_RETURN',
          resourceId: returnId,
          result: 'SUCCESS',
          reason: input.resolutionNote,
          metadata: { from: previousStatus, to: input.status },
        },
      })
    })
    return this.get(returnId)
  }

  async complete(actor: AuthenticatedUser, returnId: string, input: CompleteAdminReturnDto) {
    if (new Set(input.items.map((item) => item.returnItemId)).size !== input.items.length) {
      throw new BadRequestException('Each returned item can appear only once in a restock decision.')
    }
    await this.prisma.$transaction(async (transaction) => {
      const productReturn = await transaction.productReturn.findUnique({
        where: { id: returnId },
        select: {
          id: true,
          status: true,
          items: {
            select: {
              id: true,
              quantity: true,
              orderItem: { select: { productId: true, sku: true } },
            },
          },
        },
      })
      if (!productReturn) throw new NotFoundException('Return not found.')
      if (productReturn.status !== ReturnStatus.RECEIVED) {
        throw new ConflictException('Only a received return can be completed and restocked.')
      }
      const decisions = new Map(input.items.map((item) => [item.returnItemId, item.quantity]))
      if (decisions.size !== productReturn.items.length || productReturn.items.some((item) => !decisions.has(item.id))) {
        throw new BadRequestException('Record a restock quantity for every item in the return.')
      }
      for (const item of productReturn.items) {
        const quantity = decisions.get(item.id)!
        if (quantity > item.quantity) {
          throw new BadRequestException(`Restock quantity for ${item.orderItem.sku} exceeds the received quantity.`)
        }
        if (quantity > 0 && !item.orderItem.productId) {
          throw new BadRequestException(`${item.orderItem.sku} is no longer linked to an inventory record.`)
        }
      }
      const completedAt = new Date()
      const claimed = await transaction.productReturn.updateMany({
        where: { id: returnId, status: ReturnStatus.RECEIVED },
        data: { status: ReturnStatus.COMPLETED, resolutionNote: input.resolutionNote, completedAt },
      })
      if (claimed.count !== 1) throw new ConflictException('The return changed while it was being completed.')
      let totalRestocked = 0
      for (const item of productReturn.items) {
        const quantity = decisions.get(item.id)!
        await transaction.returnItem.update({
          where: { id: item.id },
          data: { restockedQuantity: quantity },
        })
        if (quantity === 0) continue
        const restocked = await transaction.$executeRaw`
          UPDATE "inventory"
          SET "on_hand" = "on_hand" + ${quantity},
              "version" = "version" + 1,
              "updated_at" = NOW()
          WHERE "product_id" = ${item.orderItem.productId}::uuid
        `
        if (restocked !== 1) throw new Error('Returned inventory restock invariant failed.')
        totalRestocked += quantity
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'RETURN_COMPLETED',
          resourceType: 'PRODUCT_RETURN',
          resourceId: returnId,
          result: 'SUCCESS',
          reason: input.resolutionNote,
          metadata: { totalRestocked },
        },
      })
    })
    return this.get(returnId)
  }

  get(returnId: string) {
    return this.prisma.productReturn.findUnique({
      where: { id: returnId },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            orderItem: {
              select: { id: true, productName: true, sku: true, size: true, productId: true },
            },
          },
        },
      },
    }).then((productReturn) => {
      if (!productReturn) throw new NotFoundException('Return not found.')
      return productReturn
    })
  }
}
