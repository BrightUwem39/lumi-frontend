import { randomBytes } from 'node:crypto'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { CartStatus, OrderStatus, Prisma, ProductStatus } from '../generated/prisma/client.js'
import { hashToken } from '../auth/auth.crypto.js'
import { CartService } from '../cart/cart.service.js'
import { PrismaService } from '../database/prisma.service.js'
import type { CreateOrderDto } from './dto/create-order.dto.js'

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carts: CartService,
  ) {}

  async createDraft(
    userId: string | undefined,
    guestToken: string,
    idempotencyKey: string,
    input: CreateOrderDto,
  ) {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      throw new BadRequestException('A valid Idempotency-Key header is required.')
    }
    const keyHash = hashToken(idempotencyKey)
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKeyHash: keyHash },
      include: { items: true },
    })
    if (existing) return toOrderResponse(existing)

    const cart = await this.carts.resolveCart(userId, hashToken(guestToken))

    try {
      const order = await this.prisma.$transaction(async (transaction) => {
        const cartRecord = await transaction.cart.findUniqueOrThrow({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                product: { include: { inventory: true, images: { orderBy: { position: 'asc' } } } },
              },
            },
          },
        })
        if (cartRecord.status !== CartStatus.ACTIVE || cartRecord.items.length === 0) {
          throw new BadRequestException('The cart is empty or unavailable.')
        }

        const now = new Date()
        for (const item of cartRecord.items) {
          const available = (item.product.inventory?.onHand ?? 0) -
            (item.product.inventory?.reserved ?? 0)
          if (
            item.product.status !== ProductStatus.PUBLISHED ||
            !item.product.publishedAt ||
            item.product.publishedAt > now ||
            !item.product.sizes.includes(item.size) ||
            available < item.quantity
          ) {
            throw new BadRequestException('One or more cart items are unavailable.')
          }
        }

        const currencies = new Set(cartRecord.items.map((item) => item.product.currency))
        if (currencies.size !== 1) throw new BadRequestException('Cart currencies do not match.')
        const currency = [...currencies][0]!
        const subtotal = cartRecord.items.reduce(
          (sum, item) => sum.add(item.product.price.mul(item.quantity)),
          new Prisma.Decimal(0),
        )
        const shipping = shippingTerms(currency)
        const shippingTotal = subtotal.greaterThanOrEqualTo(shipping.freeThreshold)
          ? new Prisma.Decimal(0)
          : new Prisma.Decimal(shipping.price)
        const total = subtotal.add(shippingTotal)

        const created = await transaction.order.create({
          data: {
            number: `LM-${now.getUTCFullYear()}-${randomBytes(6).toString('hex').toUpperCase()}`,
            userId,
            cartId: cart.id,
            status: OrderStatus.DRAFT,
            email: input.email,
            shippingName: `${input.firstName} ${input.lastName}`,
            shippingPhone: input.phone,
            shippingAddress: {
              line1: input.line1,
              line2: input.line2 ?? null,
              city: input.city,
              region: input.region,
              postalCode: input.postalCode ?? null,
              country: input.country,
            },
            currency,
            subtotal,
            shippingTotal,
            total,
            idempotencyKeyHash: keyHash,
            items: {
              create: cartRecord.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                sku: item.product.sku,
                imageUrl: item.product.images[0]?.url,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.product.price,
                lineTotal: item.product.price.mul(item.quantity),
              })),
            },
          },
          include: { items: true },
        })
        await transaction.cart.update({
          where: { id: cart.id },
          data: { status: CartStatus.CONVERTED },
        })
        return created
      })
      return toOrderResponse(order)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        const replay = await this.prisma.order.findUnique({
          where: { idempotencyKeyHash: keyHash },
          include: { items: true },
        })
        if (replay) return toOrderResponse(replay)
        throw new ConflictException('This cart already has an order draft.')
      }
      throw error
    }
  }

}

export function shippingTerms(currency: string) {
  return currency === 'NGN'
    ? { price: 25_000, freeThreshold: 345_000 }
    : { price: 18, freeThreshold: 250 }
}

export function toOrderResponse(order: {
    number: string
    status: OrderStatus
    email: string
    shippingName: string
    shippingAddress: Prisma.JsonValue
    currency: string
    subtotal: Prisma.Decimal
    shippingTotal: Prisma.Decimal
    total: Prisma.Decimal
    createdAt: Date
    items: Array<{
      productName: string
      imageUrl: string | null
      size: string
      quantity: number
      unitPrice: Prisma.Decimal
      lineTotal: Prisma.Decimal
    }>
  }) {
    return {
      number: order.number,
      status: order.status,
      email: order.email,
      shippingName: order.shippingName,
      shippingAddress: order.shippingAddress,
      currency: order.currency,
      subtotal: order.subtotal.toFixed(2),
      shippingTotal: order.shippingTotal.toFixed(2),
      total: order.total.toFixed(2),
      createdAt: order.createdAt,
      payable: false,
      items: order.items.map((item) => ({
        name: item.productName,
        image: item.imageUrl,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: item.lineTotal.toFixed(2),
      })),
    }
}
