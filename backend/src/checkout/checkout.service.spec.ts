import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrderStatus, Prisma } from '../generated/prisma/client.js'
import type { CartService } from '../cart/cart.service.js'
import type { PrismaService } from '../database/prisma.service.js'
import { CheckoutService, shippingTerms } from './checkout.service.js'

const input = {
  email: 'customer@example.com', firstName: 'Amara', lastName: 'Okafor',
  phone: '+2348012345678', line1: '18 Kingsway', city: 'Lagos',
  region: 'Lagos', country: 'NG',
}

describe('CheckoutService', () => {
  it('uses NGN shipping terms aligned with the storefront', () => {
    expect(shippingTerms('NGN')).toEqual({ price: 25_000, freeThreshold: 345_000 })
    expect(shippingTerms('USD')).toEqual({ price: 18, freeThreshold: 250 })
  })

  it('requires a bounded idempotency key before accessing the cart', async () => {
    const prisma = { order: { findUnique: vi.fn() } }
    const carts = { resolveCart: vi.fn() }
    const service = new CheckoutService(
      prisma as unknown as PrismaService,
      carts as unknown as CartService,
    )
    await expect(service.createDraft(undefined, 'guest', 'short', input))
      .rejects.toBeInstanceOf(BadRequestException)
    expect(carts.resolveCart).not.toHaveBeenCalled()
  })

  it('replays the original server snapshot for a repeated idempotency key', async () => {
    const existing = {
      number: 'LM-2026-ABCDEF123456', status: OrderStatus.DRAFT,
      email: input.email, shippingName: 'Amara Okafor', shippingAddress: input,
      currency: 'USD', subtotal: new Prisma.Decimal(189),
      shippingTotal: new Prisma.Decimal(18), total: new Prisma.Decimal(207),
      createdAt: new Date('2026-08-10T00:00:00Z'),
      items: [{ productName: 'Luna Silk Dress', imageUrl: '/luna.jpg', size: 'M',
        quantity: 1, unitPrice: new Prisma.Decimal(189), lineTotal: new Prisma.Decimal(189) }],
    }
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue(existing) } }
    const carts = { resolveCart: vi.fn() }
    const service = new CheckoutService(
      prisma as unknown as PrismaService,
      carts as unknown as CartService,
    )
    const result = await service.createDraft(
      undefined,
      'guest',
      'idempotency_key_1234567890',
      input,
    )
    expect(result).toMatchObject({
      number: existing.number,
      subtotal: '189.00',
      shippingTotal: '18.00',
      total: '207.00',
      payable: false,
    })
    expect(carts.resolveCart).not.toHaveBeenCalled()
  })
})
