import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { PrismaService } from '../database/prisma.service.js'
import {
  OrderStatus,
  ProductStatus,
  UserRole,
  UserStatus,
  type Prisma,
} from '../generated/prisma/client.js'
import type {
  AdminListQueryDto,
  AdminOrderQueryDto,
  AdminProductQueryDto,
  UpdateFulfillmentStatusDto,
  UpdateInventoryDto,
} from './dto/admin.dto.js'

const fulfillmentStatuses = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
] as const

const revenueStatuses = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(actor: AuthenticatedUser, userAgent?: string) {
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      publishedProducts,
      lowStockProducts,
      totalOrders,
      awaitingFulfillment,
      revenue,
      recentOrders,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, status: UserStatus.ACTIVE },
      }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
      this.prisma.product.count({
        where: { inventory: { is: { onHand: { lte: 5 } } } },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: { in: [...fulfillmentStatuses] } } }),
      this.prisma.order.aggregate({
        where: { status: { in: [...revenueStatuses] } },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          number: true,
          email: true,
          shippingName: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
        },
      }),
    ])

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.role,
        action: 'ADMIN_DASHBOARD_VIEW',
        resourceType: 'ADMIN_DASHBOARD',
        result: 'SUCCESS',
        metadata: userAgent ? { userAgent: userAgent.slice(0, 500) } : undefined,
        userAgent: userAgent?.slice(0, 500),
      },
    })

    return {
      customers: { total: totalCustomers, active: activeCustomers },
      products: {
        total: totalProducts,
        published: publishedProducts,
        lowStock: lowStockProducts,
      },
      orders: { total: totalOrders, awaitingFulfillment },
      revenue: {
        amount: revenue._sum.total?.toFixed(2) ?? '0.00',
        currency: 'NGN',
      },
      recentOrders: recentOrders.map((order) => ({
        ...order,
        total: order.total.toFixed(2),
      })),
    }
  }

  async listProducts(query: AdminProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    }
    const skip = (query.page - 1) * query.limit
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          category: true,
          price: true,
          currency: true,
          status: true,
          updatedAt: true,
          inventory: { select: { onHand: true, reserved: true, version: true } },
          images: { select: { url: true, altText: true }, orderBy: { position: 'asc' }, take: 1 },
        },
      }),
    ])
    return paginated(
      products.map((product) => ({
        ...product,
        price: product.price.toFixed(2),
        available: Math.max(0, (product.inventory?.onHand ?? 0) - (product.inventory?.reserved ?? 0)),
      })),
      query,
      total,
    )
  }

  async updateInventory(actor: AuthenticatedUser, productId: string, input: UpdateInventoryDto) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          sku: true,
          name: true,
          inventory: { select: { onHand: true, reserved: true, version: true } },
        },
      })
      if (!product) throw new NotFoundException('Product not found.')
      if (input.onHand < (product.inventory?.reserved ?? 0)) {
        throw new ConflictException('On-hand inventory cannot be lower than reserved inventory.')
      }

      const inventory = await transaction.inventory.upsert({
        where: { productId },
        create: { productId, onHand: input.onHand },
        update: { onHand: input.onHand, version: { increment: 1 } },
        select: { onHand: true, reserved: true, version: true, updatedAt: true },
      })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'INVENTORY_SET',
          resourceType: 'PRODUCT',
          resourceId: product.id,
          result: 'SUCCESS',
          reason: input.reason,
          metadata: {
            sku: product.sku,
            previousOnHand: product.inventory?.onHand ?? 0,
            newOnHand: inventory.onHand,
            reserved: inventory.reserved,
          },
        },
      })
      return { product: { id: product.id, sku: product.sku, name: product.name }, inventory }
    })
  }

  async listCustomers(query: AdminListQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.CUSTOMER,
      ...(query.search ? {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    }
    const skip = (query.page - 1) * query.limit
    const [total, customers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ])
    return paginated(
      customers.map(({ _count, ...customer }) => ({ ...customer, orderCount: _count.orders })),
      query,
      total,
    )
  }

  async listOrders(query: AdminOrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? {
        OR: [
          { number: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { shippingName: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    }
    const skip = (query.page - 1) * query.limit
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          number: true,
          email: true,
          shippingName: true,
          status: true,
          total: true,
          currency: true,
          paidAt: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
    ])
    return paginated(
      orders.map(({ _count, ...order }) => ({
        ...order,
        total: order.total.toFixed(2),
        lineCount: _count.items,
      })),
      query,
      total,
    )
  }

  async updateFulfillmentStatus(
    actor: AuthenticatedUser,
    orderNumber: string,
    input: UpdateFulfillmentStatusDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { number: orderNumber },
        select: { id: true, number: true, status: true, updatedAt: true },
      })
      if (!order) throw new NotFoundException('Order not found.')
      const expectedStatus = previousFulfillmentStatus[input.status]
      if (order.status !== expectedStatus) {
        throw new BadRequestException(
          `Order must be ${expectedStatus.toLowerCase()} before it can move to ${input.status.toLowerCase()}.`,
        )
      }

      const updated = await transaction.order.updateMany({
        where: { id: order.id, status: expectedStatus, updatedAt: order.updatedAt },
        data: { status: input.status },
      })
      if (updated.count !== 1) {
        throw new ConflictException('The order changed while it was being updated. Refresh and try again.')
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'ORDER_FULFILLMENT_STATUS_CHANGED',
          resourceType: 'ORDER',
          resourceId: order.id,
          result: 'SUCCESS',
          reason: input.reason,
          metadata: { orderNumber: order.number, from: order.status, to: input.status },
        },
      })
      return { number: order.number, status: input.status }
    })
  }
}

const previousFulfillmentStatus: Record<UpdateFulfillmentStatusDto['status'], OrderStatus> = {
  [OrderStatus.PROCESSING]: OrderStatus.PAID,
  [OrderStatus.SHIPPED]: OrderStatus.PROCESSING,
  [OrderStatus.DELIVERED]: OrderStatus.SHIPPED,
}

function paginated<T>(items: T[], query: AdminListQueryDto, total: number) {
  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  }
}
