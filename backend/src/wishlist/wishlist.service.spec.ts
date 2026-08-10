import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { Prisma, ProductStatus } from '../generated/prisma/client.js'
import type { PrismaService } from '../database/prisma.service.js'
import { WishlistService } from './wishlist.service.js'

const customerId = '22922b6f-32ab-43e8-9929-51472e9c9325'
const otherCustomerId = 'c921f2dd-a571-4b8e-86fa-b1acf982da2b'
const productId = '3c91c2f1-0bc5-4bed-a78e-544fa342a7d0'
const product = {
  id: productId,
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

function setup(productLookup: { id: string } | null = { id: productId }) {
  const prisma = {
    product: { findFirst: vi.fn().mockResolvedValue(productLookup) },
    wishlistItem: {
      findMany: vi.fn().mockResolvedValue([{ product }]),
      upsert: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  }
  return {
    prisma,
    service: new WishlistService(prisma as unknown as PrismaService),
  }
}

describe('WishlistService', () => {
  it('filters wishlist rows by the authenticated customer at query time', async () => {
    const { prisma, service } = setup()
    const result = await service.list(customerId)

    expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: customerId,
          product: {
            status: ProductStatus.PUBLISHED,
            publishedAt: { lte: expect.any(Date) },
          },
        },
      }),
    )
    expect(result.items[0]).not.toHaveProperty('inventory')
  })

  it('idempotently adds a published product for the session owner', async () => {
    const { prisma, service } = setup()
    await expect(service.add(customerId, product.slug)).resolves.toEqual({
      productSlug: product.slug,
    })

    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: {
        slug: product.slug,
        status: ProductStatus.PUBLISHED,
        publishedAt: { lte: expect.any(Date) },
      },
      select: { id: true },
    })
    expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith({
      where: { userId_productId: { userId: customerId, productId } },
      create: { userId: customerId, productId },
      update: {},
    })
  })

  it('does not save a missing, draft, or future product', async () => {
    const { service } = setup(null)
    await expect(service.add(customerId, 'private-draft')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('cannot remove another customer\'s row because deletion includes session ownership', async () => {
    const { prisma, service } = setup()
    await service.remove(customerId, product.slug)

    expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: customerId, product: { slug: product.slug } },
    })
    expect(prisma.wishlistItem.deleteMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: otherCustomerId } }),
    )
  })
})
