import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { OrderStatus } from '../generated/prisma/client.js'
import { hashToken } from '../auth/auth.crypto.js'
import { toOrderResponse } from '../checkout/checkout.service.js'
import { PrismaService } from '../database/prisma.service.js'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { ReturnsService } from '../admin/returns.service.js'
import type { CreateCustomerReturnDto } from './dto/create-customer-return.dto.js'

const returnEligibleStatuses: OrderStatus[] = [
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.PARTIALLY_REFUNDED,
  OrderStatus.REFUNDED,
]

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly returns: ReturnsService) {}

  async list(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        number: true, status: true, currency: true, total: true,
        createdAt: true, _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { items: orders.map((order) => ({
      number: order.number, status: order.status, currency: order.currency,
      total: order.total.toFixed(2), createdAt: order.createdAt,
      lineCount: order._count.items,
    })) }
  }

  async get(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    const order = await this.findOwned(orderNumber, userId, guestToken)
    if (!order) throw new NotFoundException('Order not found')
    return toOrderResponse(order)
  }

  async getReturns(orderNumber: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { number: orderNumber, userId },
      select: {
        number: true,
        status: true,
        items: {
          orderBy: { id: 'asc' },
          select: { id: true, productName: true, sku: true, size: true, imageUrl: true, quantity: true },
        },
        returns: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, reason: true, resolutionNote: true,
            approvedAt: true, rejectedAt: true, receivedAt: true, completedAt: true, createdAt: true,
            items: {
              orderBy: { id: 'asc' },
              select: {
                id: true, orderItemId: true, quantity: true, restockedQuantity: true,
                orderItem: { select: { productName: true, sku: true, size: true } },
              },
            },
          },
        },
      },
    })
    if (!order) throw new NotFoundException('Order not found')
    const returnedByItem = new Map<string, number>()
    for (const productReturn of order.returns) {
      if (productReturn.status === 'REJECTED') continue
      for (const item of productReturn.items) {
        returnedByItem.set(item.orderItemId, (returnedByItem.get(item.orderItemId) ?? 0) + item.quantity)
      }
    }
    return {
      number: order.number,
      status: order.status,
      returnEligible: returnEligibleStatuses.includes(order.status),
      items: order.items.map((item) => ({
        ...item,
        returnableQuantity: Math.max(0, item.quantity - (returnedByItem.get(item.id) ?? 0)),
      })),
      returns: order.returns,
    }
  }

  requestReturn(actor: AuthenticatedUser, orderNumber: string, input: CreateCustomerReturnDto) {
    return this.returns.createForCustomer(actor, orderNumber, input)
  }

  async cancel(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    const order = await this.findOwned(orderNumber, userId, guestToken)
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only an unpaid order draft can be cancelled.')
    }
    await this.prisma.$transaction(async (transaction) => {
      const cancelled = await transaction.order.updateMany({
        where: { id: order.id, status: OrderStatus.DRAFT },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      })
      if (cancelled.count !== 1) {
        throw new BadRequestException('Only an unpaid order draft can be cancelled.')
      }
      if (order.couponId) {
        await transaction.coupon.updateMany({
          where: { id: order.couponId, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        })
      }
    })
    const updated = await this.findOwned(orderNumber, userId, guestToken)
    if (!updated) throw new NotFoundException('Order not found')
    return toOrderResponse(updated)
  }

  private findOwned(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    const ownership = [
      ...(userId ? [{ userId }] : []),
      ...(guestToken ? [{ cart: { guestTokenHash: hashToken(guestToken) } }] : []),
    ]
    if (!ownership.length) return null
    return this.prisma.order.findFirst({
      where: { number: orderNumber, OR: ownership },
      include: { items: true, coupon: { select: { code: true } } },
    })
  }
}
