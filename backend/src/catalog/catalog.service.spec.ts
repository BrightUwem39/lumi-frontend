import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { Prisma, ProductStatus } from '../generated/prisma/client.js'
import type { PrismaService } from '../database/prisma.service.js'
import { CatalogService } from './catalog.service.js'

const product = {
  id: '3c91c2f1-0bc5-4bed-a78e-544fa342a7d0',
  slug: 'luna-silk-dress',
  name: 'Luna Silk Dress',
  description: 'Bias-cut silk dress',
  category: 'Women',
  color: 'Ivory',
  sizes: ['XS', 'S', 'M'],
  price: new Prisma.Decimal('189.00'),
  compareAtPrice: new Prisma.Decimal('240.00'),
  currency: 'NGN',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  images: [{ url: '/luna.jpg', altText: 'Luna silk dress', position: 0 }],
  inventory: { onHand: 8, reserved: 3 },
}

function setup(overrides?: {
  count?: number
  products?: typeof product[]
  detail?: typeof product | null
}) {
  const prisma = {
    product: {
      count: vi.fn().mockResolvedValue(overrides?.count ?? 1),
      findMany: vi.fn().mockResolvedValue(overrides?.products ?? [product]),
      findFirst: vi.fn().mockResolvedValue(
        overrides && 'detail' in overrides ? overrides.detail : product,
      ),
    },
  }
  return {
    prisma,
    service: new CatalogService(prisma as unknown as PrismaService),
  }
}

describe('CatalogService', () => {
  it('lists only currently published products with bounded pagination inputs', async () => {
    const { prisma, service } = setup()

    const result = await service.list({
      page: 2,
      limit: 12,
      category: 'Women',
      search: 'silk',
      sort: 'price-asc',
    })

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ProductStatus.PUBLISHED,
          publishedAt: { lte: expect.any(Date) },
          category: { equals: 'Women', mode: 'insensitive' },
        }),
        skip: 12,
        take: 12,
        orderBy: [{ price: 'asc' }, { id: 'asc' }],
      }),
    )
    expect(result).toMatchObject({ page: 2, limit: 12, total: 1, totalPages: 1 })
  })

  it('returns money as exact strings and exposes availability without stock counts', async () => {
    const { service } = setup()
    const result = await service.findBySlug(product.slug)

    expect(result).toMatchObject({
      price: '189.00',
      compareAtPrice: '240.00',
      currency: 'NGN',
      available: true,
    })
    expect(result).not.toHaveProperty('inventory')
    expect(result).not.toHaveProperty('sku')
  })

  it('treats fully reserved inventory as unavailable', async () => {
    const reservedProduct = { ...product, inventory: { onHand: 4, reserved: 4 } }
    const { service } = setup({ detail: reservedProduct })

    await expect(service.findBySlug(product.slug)).resolves.toMatchObject({ available: false })
  })

  it('does not reveal whether an unpublished or missing slug exists', async () => {
    const { service } = setup({ detail: null })
    await expect(service.findBySlug('private-draft')).rejects.toBeInstanceOf(NotFoundException)
  })
})
