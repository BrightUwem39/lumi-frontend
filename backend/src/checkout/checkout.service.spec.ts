import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { OrderStatus, Prisma } from '../generated/prisma/client.js'
import type { CartService } from '../cart/cart.service.js'
import type { PrismaService } from '../database/prisma.service.js'
import { CheckoutService, shippingTerms, taxTerms } from './checkout.service.js'

const input = {
  email: 'customer@example.com', firstName: 'Amara', lastName: 'Okafor',
  phone: '+2348012345678', line1: '18 Kingsway', city: 'Lagos',
  region: 'Lagos', country: 'NG',
}

describe('CheckoutService', () => {
  it('uses NGN shipping terms aligned with the storefront', () => {
    expect(shippingTerms('NGN')).toEqual({ enabled: true, price: 25_000, freeThreshold: 345_000, deliveryMinDays: 2, deliveryMaxDays: 5 })
    expect(shippingTerms('USD')).toEqual({ enabled: true, price: 18, freeThreshold: 250, deliveryMinDays: 5, deliveryMaxDays: 12 })
    expect(shippingTerms('NGN', {
      shippingEnabled: true,
      shippingFee: new Prisma.Decimal(30000),
      freeShippingThreshold: new Prisma.Decimal(400000),
      deliveryMinDays: 3,
      deliveryMaxDays: 7,
    })).toEqual({ enabled: true, price: 30000, freeThreshold: 400000, deliveryMinDays: 3, deliveryMaxDays: 7 })
    expect(taxTerms({
      taxEnabled: true,
      taxRate: new Prisma.Decimal(7.5),
      taxLabel: 'VAT',
      pricesIncludeTax: false,
    })).toEqual({ enabled: true, rate: 7.5, label: 'VAT', pricesIncludeTax: false })
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
      discountTotal: new Prisma.Decimal(0),
      taxTotal: new Prisma.Decimal(0),
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

  it('validates an active percentage code against authoritative cart prices', async () => {
    const now = new Date()
    const prisma = {
      storeSetting: { findUnique: vi.fn().mockResolvedValue(null) },
      cart: { findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: 'cart-1', status: 'ACTIVE', items: [{
          productId: 'product-1', size: 'M', quantity: 1,
          product: {
            name: 'Lumi Shirt', sku: 'LUMI-001', currency: 'NGN',
            price: new Prisma.Decimal(100000), status: 'PUBLISHED',
            publishedAt: new Date(now.getTime() - 1000), sizes: ['M'],
            inventory: { onHand: 5, reserved: 0 }, images: [],
          },
        }],
      }) },
      coupon: { findUnique: vi.fn().mockResolvedValue({
        id: 'coupon-1', code: 'LUMI10', type: 'PERCENTAGE',
        value: new Prisma.Decimal(10), minimumSubtotal: null,
        maximumDiscount: null, usageLimit: 100, usageCount: 2,
        startsAt: null, expiresAt: null, active: true,
        createdAt: now, updatedAt: now,
      }) },
    }
    const carts = { resolveCart: vi.fn().mockResolvedValue({ id: 'cart-1' }) }
    const service = new CheckoutService(
      prisma as unknown as PrismaService,
      carts as unknown as CartService,
    )

    const result = await service.validateCoupon(undefined, 'guest-token', 'LUMI10')

    expect(result).toMatchObject({
      code: 'LUMI10', subtotal: '100000.00', discountTotal: '10000.00',
      shippingTotal: '25000.00', total: '115000.00',
    })
  })

  it('rejects an unknown discount code instead of silently ignoring it', async () => {
    const prisma = {
      storeSetting: { findUnique: vi.fn().mockResolvedValue(null) },
      cart: { findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: 'cart-1', status: 'ACTIVE', items: [{
          productId: 'product-1', size: 'M', quantity: 1,
          product: {
            name: 'Lumi Shirt', sku: 'LUMI-001', currency: 'NGN',
            price: new Prisma.Decimal(100000), status: 'PUBLISHED',
            publishedAt: new Date('2026-01-01'), sizes: ['M'],
            inventory: { onHand: 5, reserved: 0 }, images: [],
          },
        }],
      }) },
      coupon: { findUnique: vi.fn().mockResolvedValue(null) },
    }
    const carts = { resolveCart: vi.fn().mockResolvedValue({ id: 'cart-1' }) }
    const service = new CheckoutService(
      prisma as unknown as PrismaService,
      carts as unknown as CartService,
    )

    await expect(service.validateCoupon(undefined, 'guest-token', 'NOTREAL'))
      .rejects.toBeInstanceOf(BadRequestException)
  })

  it('stores the verified discount and reserves one use on the order draft', async () => {
    const now = new Date()
    const cartRecord = {
      id: 'cart-1', status: 'ACTIVE', items: [{
        productId: 'product-1', size: 'M', quantity: 1,
        product: {
          name: 'Lumi Shirt', sku: 'LUMI-001', currency: 'NGN',
          price: new Prisma.Decimal(100000), status: 'PUBLISHED',
          publishedAt: new Date(now.getTime() - 1000), sizes: ['M'],
          inventory: { onHand: 5, reserved: 0 }, images: [],
        },
      }],
    }
    const coupon = {
      id: 'coupon-1', code: 'LUMI10', type: 'PERCENTAGE',
      value: new Prisma.Decimal(10), minimumSubtotal: null,
      maximumDiscount: null, usageLimit: 100, usageCount: 2,
      startsAt: null, expiresAt: null, active: true,
      createdAt: now, updatedAt: now,
    }
    const transaction = {
      storeSetting: { findUnique: vi.fn().mockResolvedValue({
        shippingEnabled: true,
        shippingFee: new Prisma.Decimal(25000),
        freeShippingThreshold: new Prisma.Decimal(345000),
        deliveryMinDays: 2,
        deliveryMaxDays: 5,
        taxEnabled: true,
        taxRate: new Prisma.Decimal(7.5),
        taxLabel: 'VAT',
        pricesIncludeTax: false,
      }) },
      cart: {
        findUniqueOrThrow: vi.fn().mockResolvedValue(cartRecord),
        update: vi.fn().mockResolvedValue({}),
      },
      coupon: {
        findUnique: vi.fn().mockResolvedValue(coupon),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      order: { create: vi.fn().mockImplementation(({ data }) => ({
        number: 'LM-2026-ABCDEF123456', status: OrderStatus.DRAFT,
        email: data.email, shippingName: data.shippingName,
        shippingAddress: data.shippingAddress, currency: data.currency,
        subtotal: data.subtotal, discountTotal: data.discountTotal, taxTotal: data.taxTotal,
        shippingTotal: data.shippingTotal, total: data.total, createdAt: now,
        coupon: { code: coupon.code },
        items: [{ productName: 'Lumi Shirt', imageUrl: null, size: 'M', quantity: 1,
          unitPrice: new Prisma.Decimal(100000), lineTotal: new Prisma.Decimal(100000) }],
      })) },
    }
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn((operation) => operation(transaction)),
    }
    const carts = { resolveCart: vi.fn().mockResolvedValue({ id: 'cart-1' }) }
    const service = new CheckoutService(
      prisma as unknown as PrismaService,
      carts as unknown as CartService,
    )

    const result = await service.createDraft(
      undefined, 'guest-token', 'idempotency_key_1234567890',
      { ...input, couponCode: 'LUMI10' },
    )

    expect(result).toMatchObject({
      couponCode: 'LUMI10', discountTotal: '10000.00', taxTotal: '6750.00', total: '121750.00',
    })
    expect(transaction.coupon.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { usageCount: { increment: 1 } },
    }))
    expect(transaction.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ couponId: 'coupon-1', discountTotal: new Prisma.Decimal(10000) }),
    }))
  })
})
