import { Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { PrismaService } from '../database/prisma.service.js'
import { OrderStatus, ProductStatus, UserRole, UserStatus } from '../generated/prisma/client.js'

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
}
