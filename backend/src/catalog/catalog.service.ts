import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductStatus, type Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../database/prisma.service.js'
import type { CatalogQueryDto, CatalogSort } from './dto/catalog-query.dto.js'

export const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  category: true,
  color: true,
  sizes: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  publishedAt: true,
  images: {
    select: { url: true, altText: true, position: true },
    orderBy: { position: 'asc' as const },
  },
  inventory: { select: { onHand: true, reserved: true } },
} satisfies Prisma.ProductSelect

export type PublicProductRecord = Prisma.ProductGetPayload<{
  select: typeof publicProductSelect
}>

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CatalogQueryDto) {
    const now = new Date()
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      publishedAt: { lte: now },
      ...(query.category
        ? { category: { equals: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const skip = (query.page - 1) * query.limit

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        select: publicProductSelect,
        orderBy: orderByFor(query.sort),
        skip,
        take: query.limit,
      }),
    ])

    return {
      items: products.map(toPublicProduct),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    }
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      select: publicProductSelect,
    })

    if (!product) throw new NotFoundException('Product not found')
    return toPublicProduct(product)
  }
}

function orderByFor(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc':
      return [{ price: 'asc' }, { id: 'asc' }]
    case 'price-desc':
      return [{ price: 'desc' }, { id: 'asc' }]
    case 'name':
      return [{ name: 'asc' }, { id: 'asc' }]
    default:
      return [{ publishedAt: 'desc' }, { id: 'asc' }]
  }
}

export function toPublicProduct(product: PublicProductRecord) {
  const availableQuantity = product.inventory
    ? Math.max(0, product.inventory.onHand - product.inventory.reserved)
    : 0

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    color: product.color,
    sizes: product.sizes,
    price: product.price.toFixed(2),
    compareAtPrice: product.compareAtPrice?.toFixed(2) ?? null,
    currency: product.currency,
    available: availableQuantity > 0,
    publishedAt: product.publishedAt,
    images: product.images,
  }
}
