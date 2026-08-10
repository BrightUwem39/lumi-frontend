import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductStatus } from '../generated/prisma/client.js'
import {
  publicProductSelect,
  toPublicProduct,
} from '../catalog/catalog.service.js'
import { PrismaService } from '../database/prisma.service.js'

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: {
        userId,
        product: {
          status: ProductStatus.PUBLISHED,
          publishedAt: { lte: new Date() },
        },
      },
      select: { product: { select: publicProductSelect } },
      orderBy: { createdAt: 'desc' },
    })

    return { items: items.map(({ product }) => toPublicProduct(product)) }
  }

  async add(userId: string, productSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug: productSlug,
        status: ProductStatus.PUBLISHED,
        publishedAt: { lte: new Date() },
      },
      select: { id: true },
    })
    if (!product) throw new NotFoundException('Product not found')

    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      create: { userId, productId: product.id },
      update: {},
    })

    return { productSlug }
  }

  async remove(userId: string, productSlug: string) {
    // deleteMany keeps removal idempotent and scopes the mutation to the session owner.
    await this.prisma.wishlistItem.deleteMany({
      where: { userId, product: { slug: productSlug } },
    })
  }
}
