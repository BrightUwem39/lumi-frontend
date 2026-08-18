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
import type {
  CreateAdminProductDto,
  DeleteAdminProductDto,
  UpdateAdminProductDto,
} from './dto/admin-product.dto.js'

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

const adminProductSelect = {
  id: true,
  slug: true,
  sku: true,
  name: true,
  description: true,
  category: true,
  color: true,
  sizes: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  inventory: { select: { onHand: true, reserved: true, version: true } },
  images: {
    select: { url: true, altText: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.ProductSelect

type AdminProductRecord = Prisma.ProductGetPayload<{ select: typeof adminProductSelect }>

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
        where: { status: { in: [...revenueStatuses] }, currency: 'NGN' },
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

  async revenueAnalytics(actor: AuthenticatedUser, days: number, userAgent?: string) {
    const endExclusive = startOfUtcDay(new Date())
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
    const start = new Date(endExclusive)
    start.setUTCDate(start.getUTCDate() - days)
    const previousStart = new Date(start)
    previousStart.setUTCDate(previousStart.getUTCDate() - days)

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [...revenueStatuses] },
        currency: 'NGN',
        paidAt: { gte: previousStart, lt: endExclusive },
      },
      select: { total: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    })

    const currentOrders = orders.filter((order) => order.paidAt && order.paidAt >= start)
    const previousOrders = orders.filter((order) => order.paidAt && order.paidAt < start)
    const currentAmount = sumOrderTotals(currentOrders)
    const previousAmount = sumOrderTotals(previousOrders)
    const dailyTotals = new Map<string, { amount: number; orderCount: number }>()

    for (const order of currentOrders) {
      const date = order.paidAt!.toISOString().slice(0, 10)
      const current = dailyTotals.get(date) ?? { amount: 0, orderCount: 0 }
      current.amount += Number(order.total)
      current.orderCount += 1
      dailyTotals.set(date, current)
    }

    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start)
      date.setUTCDate(date.getUTCDate() + index)
      const key = date.toISOString().slice(0, 10)
      const total = dailyTotals.get(key) ?? { amount: 0, orderCount: 0 }
      return { date: key, amount: total.amount.toFixed(2), orderCount: total.orderCount }
    })

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        actorRole: actor.role,
        action: 'ADMIN_REVENUE_ANALYTICS_VIEW',
        resourceType: 'ADMIN_ANALYTICS',
        result: 'SUCCESS',
        metadata: { days },
        userAgent: userAgent?.slice(0, 500),
      },
    })

    return {
      range: {
        days,
        from: start.toISOString(),
        to: endExclusive.toISOString(),
        timezone: 'UTC',
      },
      revenue: {
        amount: currentAmount.toFixed(2),
        previousAmount: previousAmount.toFixed(2),
        changePercent: previousAmount > 0
          ? Number((((currentAmount - previousAmount) / previousAmount) * 100).toFixed(1))
          : null,
        currency: 'NGN',
      },
      orders: {
        total: currentOrders.length,
        previousTotal: previousOrders.length,
      },
      series,
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
        select: adminProductSelect,
      }),
    ])
    return paginated(
      products.map(toAdminProduct),
      query,
      total,
    )
  }

  async createProduct(actor: AuthenticatedUser, input: CreateAdminProductDto) {
    return this.prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.product.findFirst({
        where: { OR: [{ slug: input.slug }, { sku: input.sku }] },
        select: { slug: true, sku: true },
      })
      if (duplicate) {
        throw new ConflictException(
          duplicate.slug === input.slug ? 'A product already uses this slug.' : 'A product already uses this SKU.',
        )
      }
      validateProductValues(input.price, input.compareAtPrice, input.status, input.images.length)
      const { images, onHand, reason, ...productInput } = input
      const product = await transaction.product.create({
        data: {
          ...productInput,
          currency: 'NGN',
          publishedAt: input.status === ProductStatus.PUBLISHED ? new Date() : null,
          images: {
            create: images.map((image, position) => ({ ...image, position })),
          },
          inventory: { create: { onHand, reserved: 0 } },
        },
        select: adminProductSelect,
      })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'PRODUCT_CREATED',
          resourceType: 'PRODUCT',
          resourceId: product.id,
          result: 'SUCCESS',
          reason,
          metadata: { sku: product.sku, slug: product.slug, status: product.status },
        },
      })
      return toAdminProduct(product)
    })
  }

  async updateProduct(actor: AuthenticatedUser, productId: string, input: UpdateAdminProductDto) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.product.findUnique({
        where: { id: productId },
        select: adminProductSelect,
      })
      if (!existing) throw new NotFoundException('Product not found.')

      if (input.slug || input.sku) {
        const duplicate = await transaction.product.findFirst({
          where: {
            id: { not: productId },
            OR: [
              ...(input.slug ? [{ slug: input.slug }] : []),
              ...(input.sku ? [{ sku: input.sku }] : []),
            ],
          },
          select: { slug: true, sku: true },
        })
        if (duplicate) {
          throw new ConflictException(
            input.slug && duplicate.slug === input.slug
              ? 'A product already uses this slug.'
              : 'A product already uses this SKU.',
          )
        }
      }

      const nextPrice = input.price ?? Number(existing.price)
      const nextCompareAtPrice = input.compareAtPrice === undefined
        ? existing.compareAtPrice ? Number(existing.compareAtPrice) : null
        : input.compareAtPrice
      const nextStatus = input.status ?? existing.status
      const nextImageCount = input.images?.length ?? existing.images.length
      validateProductValues(nextPrice, nextCompareAtPrice, nextStatus, nextImageCount)
      if (input.onHand !== undefined && input.onHand < (existing.inventory?.reserved ?? 0)) {
        throw new ConflictException('On-hand inventory cannot be lower than reserved inventory.')
      }

      const product = await transaction.product.update({
        where: { id: productId },
        data: {
          slug: input.slug,
          sku: input.sku,
          name: input.name,
          description: input.description,
          category: input.category,
          color: input.color,
          sizes: input.sizes,
          price: input.price,
          ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice } : {}),
          status: input.status,
          ...(input.status !== undefined ? {
            publishedAt: input.status === ProductStatus.PUBLISHED
              ? existing.publishedAt ?? new Date()
              : null,
          } : {}),
          ...(input.images ? {
            images: {
              deleteMany: {},
              create: input.images.map((image, position) => ({ ...image, position })),
            },
          } : {}),
          ...(input.onHand !== undefined ? {
            inventory: {
              upsert: {
                create: { onHand: input.onHand, reserved: 0 },
                update: { onHand: input.onHand, version: { increment: 1 } },
              },
            },
          } : {}),
        },
        select: adminProductSelect,
      })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'PRODUCT_UPDATED',
          resourceType: 'PRODUCT',
          resourceId: product.id,
          result: 'SUCCESS',
          reason: input.reason,
          metadata: {
            sku: product.sku,
            status: product.status,
            fields: Object.keys(input).filter((field) => field !== 'reason'),
          },
        },
      })
      return toAdminProduct(product)
    })
  }

  async deleteProduct(actor: AuthenticatedUser, productId: string, input: DeleteAdminProductDto) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          sku: true,
          slug: true,
          status: true,
          inventory: { select: { reserved: true } },
        },
      })
      if (!product) throw new NotFoundException('Product not found.')
      if (product.status !== ProductStatus.ARCHIVED) {
        throw new BadRequestException('Archive the product before permanently deleting it.')
      }
      if ((product.inventory?.reserved ?? 0) > 0) {
        throw new ConflictException('This product has reserved inventory and cannot be deleted.')
      }
      await transaction.product.delete({ where: { id: productId } })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'PRODUCT_DELETED',
          resourceType: 'PRODUCT',
          resourceId: product.id,
          result: 'SUCCESS',
          reason: input.reason,
          metadata: { sku: product.sku, slug: product.slug },
        },
      })
      return { id: product.id, deleted: true }
    })
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

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function sumOrderTotals(orders: Array<{ total: { toString(): string } }>) {
  return orders.reduce((sum, order) => sum + Number(order.total), 0)
}

function toAdminProduct(product: AdminProductRecord) {
  return {
    ...product,
    price: product.price.toFixed(2),
    compareAtPrice: product.compareAtPrice?.toFixed(2) ?? null,
    available: Math.max(0, (product.inventory?.onHand ?? 0) - (product.inventory?.reserved ?? 0)),
  }
}

function validateProductValues(
  price: number,
  compareAtPrice: number | null | undefined,
  status: ProductStatus,
  imageCount: number,
) {
  if (compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice <= price) {
    throw new BadRequestException('Compare-at price must be higher than the selling price.')
  }
  if (status === ProductStatus.PUBLISHED && imageCount === 0) {
    throw new BadRequestException('Published products must have at least one image.')
  }
}
