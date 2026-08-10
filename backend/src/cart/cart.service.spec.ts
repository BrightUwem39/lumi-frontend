import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { CartStatus, Prisma } from '../generated/prisma/client.js'
import { hashToken } from '../auth/auth.crypto.js'
import type { PrismaService } from '../database/prisma.service.js'
import { CartService } from './cart.service.js'

const cartId = '7f6de6d8-7948-4b22-b16b-6440e2f030cd'
const guestCartId = 'bb988fef-0b80-43f5-a768-8ae13cf90651'
const userId = '22922b6f-32ab-43e8-9929-51472e9c9325'
const guestToken = 'test-guest-cart-token-with-sufficient-entropy-value'
const product = {
  id: '3c91c2f1-0bc5-4bed-a78e-544fa342a7d0',
  slug: 'luna-silk-dress',
  name: 'Luna Silk Dress',
  description: 'Bias-cut silk dress',
  category: 'Women',
  color: 'White',
  sizes: ['XS', 'S', 'M'],
  price: new Prisma.Decimal('189.00'),
  compareAtPrice: new Prisma.Decimal('240.00'),
  currency: 'USD',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  images: [{ url: '/luna.jpg', altText: 'Luna silk dress', position: 0 }],
  inventory: { onHand: 8, reserved: 3 },
}

function setup(productRecord = product) {
  const prisma = {
    cart: {
      upsert: vi.fn().mockResolvedValue({ id: cartId }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: cartId,
        items: [{ id: 'line-1', size: 'S', quantity: 2, product }],
      }),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: { findFirst: vi.fn().mockResolvedValue(productRecord) },
    cartItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn(async (operation: unknown) => {
      if (typeof operation === 'function') return operation(prisma)
      return operation
    }),
  }
  return {
    prisma,
    service: new CartService(prisma as unknown as PrismaService),
  }
}

describe('CartService', () => {
  it('uses only a hash of the opaque guest token and hides inventory counts', async () => {
    const { prisma, service } = setup()
    const result = await service.get(undefined, guestToken)

    expect(prisma.cart.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { guestTokenHash: hashToken(guestToken) } }),
    )
    expect(result).toMatchObject({ itemCount: 2, subtotal: '378.00', currency: 'USD' })
    expect(result.items[0]?.product).not.toHaveProperty('inventory')
  })

  it('rejects a size outside the server-owned product sizes', async () => {
    const { service } = setup()
    await expect(
      service.setItem(undefined, guestToken, product.slug, 1, 'XXL'),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects a quantity above unreserved inventory', async () => {
    const { service } = setup()
    await expect(
      service.setItem(undefined, guestToken, product.slug, 6, 'S'),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('scopes removal to the cart resolved from the caller cookie', async () => {
    const { prisma, service } = setup()
    await service.removeItem(undefined, guestToken, product.slug)
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId, product: { slug: product.slug } },
    })
  })

  it('merges a guest cart into the authenticated cart and retires the guest cart', async () => {
    const { prisma, service } = setup()
    prisma.cart.findFirst.mockResolvedValue({ id: cartId })
    prisma.cart.findUnique.mockResolvedValue({
      id: guestCartId,
      userId: null,
      status: CartStatus.ACTIVE,
      items: [{ productId: product.id, size: 'S', quantity: 3 }],
    })
    prisma.cartItem.findFirst.mockResolvedValue({ quantity: 2, size: 'S' })
    prisma.cartItem.upsert.mockResolvedValue({})
    prisma.cart.update.mockResolvedValue({})

    await service.get(userId, guestToken)

    expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { quantity: 5 } }),
    )
    expect(prisma.cart.update).toHaveBeenCalledWith({
      where: { id: guestCartId },
      data: { status: CartStatus.CONVERTED, guestTokenHash: null },
    })
  })
})
