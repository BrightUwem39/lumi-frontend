import { BadRequestException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrderStatus } from '../generated/prisma/client.js'
import type { PrismaService } from '../database/prisma.service.js'
import { OrdersService } from './orders.service.js'

describe('OrdersService authorization', () => {
  it('filters order history by the session owner at query time', async () => {
    const prisma = { order: { findMany: vi.fn().mockResolvedValue([]) } }
    const service = new OrdersService(prisma as unknown as PrismaService)
    await service.list('customer-a')
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'customer-a' }, take: 50 }),
    )
  })

  it('returns not found rather than exposing another customer order', async () => {
    const prisma = { order: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = new OrdersService(prisma as unknown as PrismaService)
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
    const service = new OrdersService(prisma as unknown as PrismaService)
    await expect(service.cancel('LM-2026-ABCDEF123456', 'customer-a', null))
      .rejects.toBeInstanceOf(BadRequestException)
  })
})
