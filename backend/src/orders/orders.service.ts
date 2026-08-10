import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { OrderStatus } from '../generated/prisma/client.js'
import { hashToken } from '../auth/auth.crypto.js'
import { toOrderResponse } from '../checkout/checkout.service.js'
import { PrismaService } from '../database/prisma.service.js'

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async cancel(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    const order = await this.findOwned(orderNumber, userId, guestToken)
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only an unpaid order draft can be cancelled.')
    }
    await this.prisma.order.updateMany({
      where: { id: order.id, status: OrderStatus.DRAFT },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
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
      include: { items: true },
    })
  }
}
