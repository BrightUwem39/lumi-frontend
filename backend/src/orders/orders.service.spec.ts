import { BadRequestException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrderStatus, Prisma } from '../generated/prisma/client.js'
import type { PrismaService } from '../database/prisma.service.js'
import type { ReturnsService } from '../admin/returns.service.js'
import type { BrevoEmailService } from '../auth/brevo-email.service.js'
import { OrdersService } from './orders.service.js'

describe('OrdersService authorization', () => {
  it('filters order history by the session owner at query time', async () => {
    const prisma = { order: { findMany: vi.fn().mockResolvedValue([]) } }
    const service = new OrdersService(prisma as unknown as PrismaService, {} as ReturnsService)
    await service.list('customer-a')
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'customer-a' }, take: 50 }),
    )
  })

  it('returns not found rather than exposing another customer order', async () => {
    const prisma = { order: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = new OrdersService(prisma as unknown as PrismaService, {} as ReturnsService)
    await expect(service.get('LM-2026-ABCDEF123456', 'customer-b', null))
      .rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { number: 'LM-2026-ABCDEF123456', OR: [{ userId: 'customer-b' }] },
      }),
    )
  })

  it('refuses cancellation after the draft state', async () => {
    const prisma = {
      order: { findFirst: vi.fn().mockResolvedValue({ status: OrderStatus.PAID }) },
    }
    const service = new OrdersService(prisma as unknown as PrismaService, {} as ReturnsService)
    await expect(service.cancel('LM-2026-ABCDEF123456', 'customer-a', null))
      .rejects.toBeInstanceOf(BadRequestException)
  })

  it('filters customer return details by the authenticated owner', async () => {
    const prisma = { order: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = new OrdersService(prisma as unknown as PrismaService, {} as ReturnsService)

    await expect(service.getReturns('LM-2026-ABCDEF123456', 'customer-a'))
      .rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { number: 'LM-2026-ABCDEF123456', userId: 'customer-a' },
    }))
  })

  it('emails only after an unpaid draft cancellation commits', async () => {
    const draft = {
      id: 'order-1', number: 'LM-2026-ABCDEF123456', status: OrderStatus.DRAFT,
      couponId: null, email: 'customer@example.com', shippingName: 'Customer', shippingAddress: {},
      currency: 'NGN', subtotal: new Prisma.Decimal(1000),
      discountTotal: new Prisma.Decimal(0), taxTotal: new Prisma.Decimal(0),
      shippingTotal: new Prisma.Decimal(0), total: new Prisma.Decimal(1000),
      createdAt: new Date(), items: [{ productName: 'Tee', imageUrl: null, size: 'M', quantity: 1,
        unitPrice: new Prisma.Decimal(1000), lineTotal: new Prisma.Decimal(1000) }], coupon: null,
    }
    const cancelled = { ...draft, status: OrderStatus.CANCELLED }
    const transaction = { order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } }
    const prisma = {
      order: { findFirst: vi.fn().mockResolvedValueOnce(draft).mockResolvedValueOnce(cancelled) },
      $transaction: vi.fn((operation) => operation(transaction)),
    }
    const sendOrderStatus = vi.fn().mockResolvedValue(undefined)
    const service = new OrdersService(
      prisma as unknown as PrismaService, {} as ReturnsService,
      { sendOrderStatus } as unknown as BrevoEmailService,
    )

    await service.cancel(draft.number, 'customer-a', null)
    expect(sendOrderStatus).toHaveBeenCalledWith(draft.email, expect.objectContaining({ status: 'CANCELLED' }))
  })
})
