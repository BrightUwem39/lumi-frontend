import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CartStatus, Prisma, ProductStatus } from '../generated/prisma/client.js'
import {
  publicProductSelect,
  toPublicProduct,
  type PublicProductRecord,
} from '../catalog/catalog.service.js'
import { hashToken } from '../auth/auth.crypto.js'
import { PrismaService } from '../database/prisma.service.js'

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string | undefined, guestToken: string) {
    const cart = await this.resolveCart(userId, hashToken(guestToken))
    const record = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      select: {
        id: true,
        items: {
          where: {
            product: {
              status: ProductStatus.PUBLISHED,
              publishedAt: { lte: new Date() },
            },
          },
          select: {
            id: true,
            size: true,
            quantity: true,
            product: { select: publicProductSelect },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    return this.toCartResponse(record.items)
  }

  async setItem(
    userId: string | undefined,
    guestToken: string,
    productSlug: string,
    quantity: number,
    requestedSize?: string,
  ) {
    const [cart, product] = await Promise.all([
      this.resolveCart(userId, hashToken(guestToken)),
      this.prisma.product.findFirst({
        where: {
          slug: productSlug,
          status: ProductStatus.PUBLISHED,
          publishedAt: { lte: new Date() },
        },
        select: publicProductSelect,
      }),
    ])
    if (!product) throw new NotFoundException('Product not found')

    const size = requestedSize ?? product.sizes[0]
    if (!size || !product.sizes.includes(size)) {
      throw new BadRequestException('The selected size is unavailable.')
    }
    const available = product.inventory
      ? Math.max(0, product.inventory.onHand - product.inventory.reserved)
      : 0
    if (quantity > available) {
      throw new BadRequestException('The requested quantity is unavailable.')
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.cartItem.deleteMany({
        where: { cartId: cart.id, productId: product.id, size: { not: size } },
      })
      await transaction.cartItem.upsert({
        where: {
          cartId_productId_size: { cartId: cart.id, productId: product.id, size },
        },
        create: { cartId: cart.id, productId: product.id, size, quantity },
        update: { quantity },
      })
    })

    return this.get(userId, guestToken)
  }

  async removeItem(userId: string | undefined, guestToken: string, productSlug: string) {
    const cart = await this.resolveCart(userId, hashToken(guestToken))
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, product: { slug: productSlug } },
    })
  }

  async clear(userId: string | undefined, guestToken: string) {
    const cart = await this.resolveCart(userId, hashToken(guestToken))
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  async resolveCart(userId: string | undefined, guestTokenHash: string) {
    if (!userId) {
      return this.prisma.cart.upsert({
        where: { guestTokenHash },
        create: { guestTokenHash, status: CartStatus.ACTIVE },
        update: {},
        select: { id: true },
      })
    }

    return this.prisma.$transaction(async (transaction) => {
      const [userCart, guestCart] = await Promise.all([
        transaction.cart.findFirst({
          where: { userId, status: CartStatus.ACTIVE },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        }),
        transaction.cart.findUnique({
          where: { guestTokenHash },
          select: {
            id: true,
            userId: true,
            status: true,
            items: { select: { productId: true, size: true, quantity: true } },
          },
        }),
      ])

      if (!userCart && guestCart?.status === CartStatus.ACTIVE && !guestCart.userId) {
        return transaction.cart.update({
          where: { id: guestCart.id },
          data: { userId, guestTokenHash: null },
          select: { id: true },
        })
      }

      const resolvedUserCart = userCart ?? await transaction.cart.create({
        data: { userId, status: CartStatus.ACTIVE },
        select: { id: true },
      })

      if (
        guestCart?.status === CartStatus.ACTIVE &&
        !guestCart.userId &&
        guestCart.id !== resolvedUserCart.id
      ) {
        for (const item of guestCart.items) {
          const existing = await transaction.cartItem.findFirst({
            where: {
              cartId: resolvedUserCart.id,
              productId: item.productId,
            },
            select: { quantity: true, size: true },
          })
          const quantity = Math.min(10, (existing?.quantity ?? 0) + item.quantity)
          if (existing && existing.size !== item.size) {
            await transaction.cartItem.deleteMany({
              where: { cartId: resolvedUserCart.id, productId: item.productId },
            })
          }
          await transaction.cartItem.upsert({
            where: {
              cartId_productId_size: {
                cartId: resolvedUserCart.id,
                productId: item.productId,
                size: item.size,
              },
            },
            create: {
              cartId: resolvedUserCart.id,
              productId: item.productId,
              size: item.size,
              quantity,
            },
            update: { quantity },
          })
        }
        await transaction.cartItem.deleteMany({ where: { cartId: guestCart.id } })
        await transaction.cart.update({
          where: { id: guestCart.id },
          data: { status: CartStatus.CONVERTED, guestTokenHash: null },
        })
      }

      return resolvedUserCart
    })
  }

  private toCartResponse(
    items: Array<{
      id: string
      size: string
      quantity: number
      product: PublicProductRecord
    }>,
  ) {
    const subtotal = items.reduce(
      (total, item) => total.add(item.product.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    )
    const currencies = new Set(items.map((item) => item.product.currency))

    return {
      items: items.map((item) => ({
        id: item.id,
        size: item.size,
        quantity: item.quantity,
        available:
          (item.product.inventory?.onHand ?? 0) -
            (item.product.inventory?.reserved ?? 0) >= item.quantity,
        product: toPublicProduct(item.product),
      })),
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
      currency: currencies.size === 1 ? [...currencies][0] : null,
    }
  }
}
