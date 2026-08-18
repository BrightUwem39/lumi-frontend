import { randomBytes } from 'node:crypto'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { CartStatus, CouponType, OrderStatus, Prisma, ProductStatus } from '../generated/prisma/client.js'
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

  async getShippingTerms(currencyInput: string) {
    const currency = currencyInput.trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) throw new BadRequestException('A valid currency is required.')
    const settings = currency === 'NGN' ? await this.prisma.storeSetting.findUnique({
      where: { id: 'primary' },
      select: {
        shippingEnabled: true,
        shippingFee: true,
        freeShippingThreshold: true,
        deliveryMinDays: true,
        deliveryMaxDays: true,
      },
    }) : null
    const terms = shippingTerms(currency, settings ?? undefined)
    return { currency, ...terms }
  }

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
      include: { items: true, coupon: { select: { code: true } } },
    })
    if (existing) return toOrderResponse(existing)

    const cart = await this.carts.resolveCart(userId, hashToken(guestToken))

    try {
      const order = await this.prisma.$transaction(async (transaction) => {
        const pricing = await this.calculatePricing(transaction, cart.id, input.couponCode)
        const { cartRecord, currency, subtotal, shippingTotal, discountTotal, total, coupon } = pricing
        const now = new Date()
        if (coupon) {
          const reservation = await transaction.coupon.updateMany({
            where: {
              id: coupon.id,
              active: true,
              ...(coupon.usageLimit === null ? {} : { usageCount: { lt: coupon.usageLimit } }),
            },
            data: { usageCount: { increment: 1 } },
          })
          if (reservation.count !== 1) {
            throw new ConflictException('This discount reached its usage limit. Try another code.')
          }
        }

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
            couponId: coupon?.id,
            discountTotal,
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
          include: { items: true, coupon: { select: { code: true } } },
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
          include: { items: true, coupon: { select: { code: true } } },
        })
        if (replay) return toOrderResponse(replay)
        throw new ConflictException('This cart already has an order draft.')
      }
      throw error
    }
  }

  async validateCoupon(userId: string | undefined, guestToken: string, couponCode: string) {
    const cart = await this.carts.resolveCart(userId, hashToken(guestToken))
    const pricing = await this.calculatePricing(
      this.prisma as unknown as Prisma.TransactionClient,
      cart.id,
      couponCode,
    )
    return {
      code: pricing.coupon!.code,
      type: pricing.coupon!.type,
      value: pricing.coupon!.value.toFixed(2),
      currency: pricing.currency,
      subtotal: pricing.subtotal.toFixed(2),
      discountTotal: pricing.discountTotal.toFixed(2),
      shippingTotal: pricing.shippingTotal.toFixed(2),
      total: pricing.total.toFixed(2),
    }
  }

  private async calculatePricing(
    database: Prisma.TransactionClient,
    cartId: string,
    couponCode?: string,
  ) {
    const cartRecord = await database.cart.findUniqueOrThrow({
      where: { id: cartId },
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
    const configuredShipping = currency === 'NGN' ? await database.storeSetting.findUnique({
      where: { id: 'primary' },
      select: {
        shippingEnabled: true,
        shippingFee: true,
        freeShippingThreshold: true,
        deliveryMinDays: true,
        deliveryMaxDays: true,
      },
    }) : null
    const shipping = shippingTerms(currency, configuredShipping ?? undefined)
    if (!shipping.enabled) throw new BadRequestException('Shipping is temporarily unavailable.')
    const shippingTotal = subtotal.greaterThanOrEqualTo(shipping.freeThreshold)
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(shipping.price)
    const coupon = couponCode ? await database.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    }) : null
    if (couponCode && !coupon) throw new BadRequestException('This discount code is not valid.')
    const discountTotal = coupon
      ? calculateCouponDiscount(coupon, subtotal, currency, now)
      : new Prisma.Decimal(0)
    const total = subtotal.sub(discountTotal).add(shippingTotal)
    return { cartRecord, currency, subtotal, discountTotal, shippingTotal, total, coupon }
  }

}

export function shippingTerms(currency: string, settings?: {
  shippingEnabled: boolean
  shippingFee: { toString(): string }
  freeShippingThreshold: { toString(): string }
  deliveryMinDays: number
  deliveryMaxDays: number
}) {
  return currency === 'NGN'
    ? {
        enabled: settings?.shippingEnabled ?? true,
        price: settings ? Number(settings.shippingFee) : 25_000,
        freeThreshold: settings ? Number(settings.freeShippingThreshold) : 345_000,
        deliveryMinDays: settings?.deliveryMinDays ?? 2,
        deliveryMaxDays: settings?.deliveryMaxDays ?? 5,
      }
    : { enabled: true, price: 18, freeThreshold: 250, deliveryMinDays: 5, deliveryMaxDays: 12 }
}

function calculateCouponDiscount(
  coupon: Prisma.CouponGetPayload<object>,
  subtotal: Prisma.Decimal,
  currency: string,
  now: Date,
) {
  if (!coupon.active) throw new BadRequestException('This discount code is inactive.')
  if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('This discount code has not started yet.')
  if (coupon.expiresAt && coupon.expiresAt <= now) throw new BadRequestException('This discount code has expired.')
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new BadRequestException('This discount code has reached its usage limit.')
  }
  if (coupon.minimumSubtotal && subtotal.lessThan(coupon.minimumSubtotal)) {
    throw new BadRequestException(`This discount requires a minimum subtotal of ${coupon.minimumSubtotal.toFixed(2)} ${currency}.`)
  }
  if (currency !== 'NGN') throw new BadRequestException('Discount codes currently apply to NGN orders only.')

  const calculated = coupon.type === CouponType.PERCENTAGE
    ? subtotal.mul(coupon.value).div(100)
    : coupon.value
  const capped = coupon.maximumDiscount && calculated.greaterThan(coupon.maximumDiscount)
    ? coupon.maximumDiscount
    : calculated
  return (capped.greaterThan(subtotal) ? subtotal : capped).toDecimalPlaces(2)
}

export function toOrderResponse(order: {
    number: string
    status: OrderStatus
    email: string
    shippingName: string
    shippingAddress: Prisma.JsonValue
    currency: string
    subtotal: Prisma.Decimal
    discountTotal: Prisma.Decimal
    shippingTotal: Prisma.Decimal
    total: Prisma.Decimal
    createdAt: Date
    coupon?: { code: string } | null
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
      discountTotal: order.discountTotal.toFixed(2),
      couponCode: order.coupon?.code ?? null,
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
