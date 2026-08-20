import { BadRequestException, ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import type { BrevoEmailService } from '../auth/brevo-email.service.js'
import { CouponType, OrderStatus, Prisma, ProductStatus, UserRole } from '../generated/prisma/client.js'
import { AdminService } from './admin.service.js'

describe('AdminService dashboard', () => {
  it('returns operational totals and writes an administrator audit event', async () => {
    const userCount = vi.fn()
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(10)
    const productCount = vi.fn()
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
    const orderCount = vi.fn()
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(3)
    const prisma = {
      user: { count: userCount },
      product: { count: productCount },
      order: {
        count: orderCount,
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: 725000 } }),
        findMany: vi.fn().mockResolvedValue([
          {
            number: 'LM-2026-ABCDEF123456',
            email: 'customer@example.com',
            shippingName: 'Lumi Customer',
            status: 'PAID',
            total: 159000,
            currency: 'NGN',
            createdAt: new Date('2026-08-14T10:00:00.000Z'),
          },
        ]),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.dashboard(
      {
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Lumi',
        lastName: 'Admin',
        role: UserRole.ADMINISTRATOR,
      },
      'Admin Browser',
    )

    expect(result).toEqual(expect.objectContaining({
      customers: { total: 12, active: 10 },
      products: { total: 8, published: 7, lowStock: 2 },
      orders: { total: 20, awaitingFulfillment: 3 },
      revenue: { amount: '725000.00', currency: 'NGN' },
    }))
    expect(result.recentOrders[0]?.total).toBe('159000.00')
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actorRole: UserRole.ADMINISTRATOR,
        action: 'ADMIN_DASHBOARD_VIEW',
        result: 'SUCCESS',
      }),
    })
  })

  it('combines unresolved operational work into live notifications', async () => {
    const prisma = {
      storeSetting: { findUnique: vi.fn().mockResolvedValue({ lowStockThreshold: 10 }) },
      productReturn: { findMany: vi.fn().mockResolvedValue([{
        id: 'return-1', reason: 'Wrong size', createdAt: new Date('2026-08-20T10:00:00Z'),
        order: { number: 'LM-RETURN', shippingName: 'Return Customer' }, _count: { items: 1 },
      }]) },
      refund: { findMany: vi.fn().mockResolvedValue([{
        id: 'refund-1', amount: new Prisma.Decimal(25000), currency: 'NGN', reason: 'Damaged item',
        createdAt: new Date('2026-08-20T11:00:00Z'),
        payment: { order: { number: 'LM-REFUND', shippingName: 'Refund Customer' } },
      }]) },
      auditLog: { findMany: vi.fn().mockResolvedValue([{
        id: 'audit-1', action: 'ORDER_EMAIL_FAILED', reason: 'Delivery failed',
        resourceType: 'ORDER', resourceId: 'order-12345678', createdAt: new Date('2026-08-20T09:00:00Z'),
      }]) },
      product: { findMany: vi.fn().mockResolvedValue([{
        id: 'product-1', name: 'Lumi Tee', sku: 'TEE-1',
        inventory: { onHand: 8, reserved: 2, updatedAt: new Date('2026-08-20T08:00:00Z') },
      }]) },
      adminNotificationState: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.notifications()

    expect(result.total).toBe(4)
    expect(result.counts).toEqual({ returns: 1, refunds: 1, emailFailures: 1, lowStock: 1 })
    expect(result.items[0]).toEqual(expect.objectContaining({ type: 'REFUND_ATTENTION', href: '/admin/orders/LM-REFUND' }))
    expect(result.items.map((item) => item.type)).toEqual(expect.arrayContaining([
      'RETURN_REQUEST', 'REFUND_ATTENTION', 'EMAIL_FAILURE', 'LOW_STOCK',
    ]))
  })

  it('persists and audits a notification dismissal', async () => {
    const upsert = vi.fn().mockResolvedValue({})
    const auditCreate = vi.fn().mockResolvedValue({})
    const prisma = {
      adminNotificationState: { upsert },
      auditLog: { create: auditCreate },
      $transaction: vi.fn().mockResolvedValue([]),
    }
    const service = new AdminService(prisma as unknown as PrismaService)
    const actor = { id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null, role: UserRole.ADMINISTRATOR }

    await expect(service.dismissNotification(actor, 'return:return-1')).resolves.toEqual({
      notificationKey: 'return:return-1', dismissed: true,
    })
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { notificationKey: 'return:return-1' },
      create: expect.objectContaining({ dismissedByUserId: actor.id }),
    }))
    expect(auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'ADMIN_NOTIFICATION_DISMISSED' }) })
  })

  it('reconstructs a failed order email and dismisses it only after a successful retry', async () => {
    const notificationKey = 'email:11111111-1111-4111-8111-111111111111'
    const sendOrderStatus = vi.fn().mockResolvedValue(undefined)
    const prisma = {
      auditLog: {
        findUnique: vi.fn().mockResolvedValue({
          id: notificationKey.slice(6), action: 'ORDER_EMAIL_FAILED', resourceId: 'order-1',
          metadata: { status: 'SHIPPED' },
        }),
        create: vi.fn().mockResolvedValue({}),
      },
      order: { findUnique: vi.fn().mockResolvedValue({
        number: 'LM-2026-ABCDEF123456', email: 'customer@example.com', shippingName: 'Customer',
        total: new Prisma.Decimal(125000), currency: 'NGN', status: OrderStatus.SHIPPED,
        items: [{ productName: 'Lumi Tee', size: 'M', quantity: 1 }],
      }) },
      adminNotificationState: { upsert: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn().mockResolvedValue([]),
    }
    const service = new AdminService(prisma as unknown as PrismaService, {
      isEnabled: () => true, sendOrderStatus,
    } as unknown as BrevoEmailService)
    const actor = { id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null, role: UserRole.ADMINISTRATOR }

    await expect(service.retryNotificationEmail(actor, notificationKey)).resolves.toEqual({ notificationKey, retried: true })
    expect(sendOrderStatus).toHaveBeenCalledWith('customer@example.com', expect.objectContaining({ status: 'SHIPPED' }))
    expect(prisma.adminNotificationState.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { notificationKey } }))
  })

  it('returns a paginated read-only audit trail with category and search filters', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: 'audit-1', action: 'REFUND_REQUESTED', result: 'PENDING_PROVIDER', reason: 'Customer request',
      resourceType: 'REFUND', resourceId: 'refund-1', actorRole: UserRole.ADMINISTRATOR,
      actorUser: { email: 'admin@example.com', firstName: 'Lumi', lastName: 'Admin' }, createdAt: new Date(),
    }])
    const prisma = { auditLog: { count: vi.fn().mockResolvedValue(21), findMany } }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.auditLog({ page: 2, limit: 20, category: 'REFUNDS', search: 'customer' })

    expect(result).toEqual(expect.objectContaining({ page: 2, limit: 20, total: 21, totalPages: 2 }))
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [{ resourceType: 'REFUND' }, { OR: expect.any(Array) }] },
      skip: 20, take: 20,
    }))
  })

  it('returns a complete revenue series independent of the recent-order list', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-18T12:00:00.000Z'))
    try {
      const findMany = vi.fn().mockResolvedValue([
        { total: 75000, paidAt: new Date('2026-08-11T08:00:00.000Z') },
        { total: 50000, paidAt: new Date('2026-08-12T10:00:00.000Z') },
        { total: 100000, paidAt: new Date('2026-08-18T11:00:00.000Z') },
      ])
      const auditCreate = vi.fn().mockResolvedValue({ id: 'audit-analytics' })
      const prisma = {
        order: { findMany },
        auditLog: { create: auditCreate },
      }
      const service = new AdminService(prisma as unknown as PrismaService)

      const result = await service.revenueAnalytics(
        {
          id: 'admin-1', email: 'admin@example.com', firstName: 'Lumi', lastName: 'Admin',
          role: UserRole.ADMINISTRATOR,
        },
        7,
        'Admin Browser',
      )

      expect(result.series).toHaveLength(7)
      expect(result.series[0]).toEqual({ date: '2026-08-12', amount: '50000.00', orderCount: 1 })
      expect(result.series[6]).toEqual({ date: '2026-08-18', amount: '100000.00', orderCount: 1 })
      expect(result.revenue).toEqual({
        amount: '150000.00',
        previousAmount: '75000.00',
        changePercent: 100,
        currency: 'NGN',
      })
      expect(result.orders).toEqual({ total: 2, previousTotal: 1 })
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ currency: 'NGN', paidAt: expect.any(Object) }),
      }))
      expect(auditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ADMIN_REVENUE_ANALYTICS_VIEW',
          metadata: { days: 7 },
        }),
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('filters the product collection at query time and exposes authoritative stock', async () => {
    const prisma = {
      product: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{
          id: 'product-1',
          slug: 'luna-silk-dress',
          sku: 'LUMI-001',
          name: 'Luna Silk Dress',
          category: 'Women',
          price: 159000,
          currency: 'NGN',
          status: 'PUBLISHED',
          updatedAt: new Date(),
          inventory: { onHand: 10, reserved: 3, version: 2 },
          images: [],
        }]),
      },
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.listProducts({
      page: 1,
      limit: 20,
      search: 'luna',
    })

    expect(result.items[0]).toEqual(expect.objectContaining({
      sku: 'LUMI-001',
      price: '159000.00',
      available: 7,
    }))
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: expect.any(Array) },
      skip: 0,
      take: 20,
    }))
  })

  it('creates a complete draft product and records the reason', async () => {
    const createdAt = new Date('2026-08-18T10:00:00.000Z')
    const transaction = {
      product: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'product-new', slug: 'new-silk-shirt', sku: 'LUMI-NEW-SHIRT',
          name: 'New Silk Shirt', description: 'A softly tailored silk shirt.', category: 'Women',
          color: 'Ivory', sizes: ['S', 'M'], price: 185000, compareAtPrice: 210000,
          currency: 'NGN', status: ProductStatus.DRAFT, publishedAt: null,
          createdAt, updatedAt: createdAt, inventory: { onHand: 12, reserved: 0, version: 0 },
          images: [{ url: '/images/new-shirt.jpg', altText: 'New Silk Shirt', position: 0 }],
        }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-product-create' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.createProduct(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        slug: 'new-silk-shirt', sku: 'LUMI-NEW-SHIRT', name: 'New Silk Shirt',
        description: 'A softly tailored silk shirt.', category: 'Women', color: 'Ivory',
        sizes: ['S', 'M'], price: 185000, compareAtPrice: 210000,
        status: ProductStatus.DRAFT, onHand: 12,
        images: [{ url: '/images/new-shirt.jpg', altText: 'New Silk Shirt' }],
        reason: 'Preparing the autumn catalog',
      },
    )

    expect(result).toEqual(expect.objectContaining({
      id: 'product-new', price: '185000.00', compareAtPrice: '210000.00', available: 12,
    }))
    expect(transaction.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        currency: 'NGN',
        images: { create: [{ url: '/images/new-shirt.jpg', altText: 'New Silk Shirt', position: 0 }] },
        inventory: { create: { onHand: 12, reserved: 0 } },
      }),
    }))
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PRODUCT_CREATED', reason: 'Preparing the autumn catalog' }),
    })
  })

  it('updates product content, publication state, images, and inventory together', async () => {
    const createdAt = new Date('2026-08-01T00:00:00.000Z')
    const existing = {
      id: 'product-1', slug: 'silk-shirt', sku: 'LUMI-SHIRT', name: 'Silk Shirt',
      description: 'An original silk shirt description.', category: 'Women', color: 'White',
      sizes: ['S'], price: 150000, compareAtPrice: null, currency: 'NGN',
      status: ProductStatus.DRAFT, publishedAt: null, createdAt, updatedAt: createdAt,
      inventory: { onHand: 5, reserved: 1, version: 1 },
      images: [{ url: '/images/old.jpg', altText: 'Old shirt', position: 0 }],
    }
    const transaction = {
      product: {
        findUnique: vi.fn().mockResolvedValue(existing),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({
          ...existing, name: 'Refined Silk Shirt', price: 175000,
          status: ProductStatus.PUBLISHED, publishedAt: new Date(),
          inventory: { onHand: 9, reserved: 1, version: 2 },
          images: [{ url: '/images/new.jpg', altText: 'Refined Silk Shirt', position: 0 }],
        }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-product-update' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.updateProduct(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'product-1',
      {
        name: 'Refined Silk Shirt', price: 175000, status: ProductStatus.PUBLISHED,
        images: [{ url: '/images/new.jpg', altText: 'Refined Silk Shirt' }],
        onHand: 9, reason: 'Approved for storefront publication',
      },
    )

    expect(result.status).toBe(ProductStatus.PUBLISHED)
    expect(result.available).toBe(8)
    expect(transaction.product.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: ProductStatus.PUBLISHED,
        images: expect.objectContaining({ deleteMany: {} }),
        inventory: expect.objectContaining({ upsert: expect.any(Object) }),
      }),
    }))
  })

  it('only permanently deletes archived products without reserved stock', async () => {
    const transaction = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-1', sku: 'LUMI-SHIRT', slug: 'silk-shirt',
          status: ProductStatus.ARCHIVED, inventory: { reserved: 0 },
        }),
        delete: vi.fn().mockResolvedValue({ id: 'product-1' }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-product-delete' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.deleteProduct(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'product-1',
      { reason: 'Duplicate archived catalog entry' },
    )).resolves.toEqual({ id: 'product-1', deleted: true })
    expect(transaction.product.delete).toHaveBeenCalledWith({ where: { id: 'product-1' } })
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PRODUCT_DELETED' }),
    })
  })

  it('refuses inventory totals that would consume reserved units', async () => {
    const transaction = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-1',
          sku: 'LUMI-001',
          name: 'Luna Silk Dress',
          inventory: { onHand: 10, reserved: 4, version: 2 },
        }),
      },
      inventory: { upsert: vi.fn() },
      auditLog: { create: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn((operation) => operation(transaction)),
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.updateInventory(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'product-1',
      { onHand: 3, reason: 'Stock count correction' },
    )).rejects.toBeInstanceOf(ConflictException)
    expect(transaction.inventory.upsert).not.toHaveBeenCalled()
    expect(transaction.auditLog.create).not.toHaveBeenCalled()
  })

  it('returns complete order detail with serialized money values', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          number: 'LM-2026-ABCDEF123456',
          email: 'customer@example.com',
          shippingName: 'Lumi Customer',
          shippingPhone: '+2348000000000',
          shippingAddress: { line1: '1 Lumi Street', city: 'Lagos', region: 'Lagos', country: 'NG' },
          status: OrderStatus.PAID,
          currency: 'NGN',
          subtotal: new Prisma.Decimal(200000),
          discountTotal: new Prisma.Decimal(10000),
          shippingTotal: new Prisma.Decimal(25000),
          taxTotal: new Prisma.Decimal(0),
          total: new Prisma.Decimal(215000),
          paidAt: new Date(),
          cancelledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
          returns: [],
          items: [{
            id: 'item-1', productId: 'product-1', productName: 'Lumi Shirt',
            sku: 'LUMI-001', imageUrl: '/shirt.jpg', size: 'M', quantity: 2,
            unitPrice: new Prisma.Decimal(100000), discountTotal: new Prisma.Decimal(0),
            lineTotal: new Prisma.Decimal(200000),
          }],
        }),
      },
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.getOrder('LM-2026-ABCDEF123456')

    expect(result).toMatchObject({
      number: 'LM-2026-ABCDEF123456', total: '215000.00', refundableAmount: '0.00', lineCount: 1,
      items: [{ unitPrice: '100000.00', lineTotal: '200000.00', returnableQuantity: 2 }],
    })
    expect(prisma.order.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { number: 'LM-2026-ABCDEF123456' },
    }))
  })

  it('creates an audited percentage discount with serialized values', async () => {
    const transaction = {
      coupon: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'coupon-1', code: 'LUMI10', type: CouponType.PERCENTAGE,
          value: new Prisma.Decimal(10), minimumSubtotal: new Prisma.Decimal(50000),
          maximumDiscount: new Prisma.Decimal(20000), usageLimit: 100, usageCount: 0,
          startsAt: null, expiresAt: null, active: true,
          createdAt: new Date(), updatedAt: new Date(),
        }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-coupon' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)
    const actor = {
      id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
      role: UserRole.ADMINISTRATOR,
    }

    const result = await service.createCoupon(actor, {
      code: 'LUMI10', type: CouponType.PERCENTAGE, value: 10,
      minimumSubtotal: 50000, maximumDiscount: 20000, usageLimit: 100,
      active: true, reason: 'Launch campaign',
    })

    expect(result).toMatchObject({ code: 'LUMI10', value: '10.00', maximumDiscount: '20000.00' })
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'COUPON_CREATED', reason: 'Launch campaign' }),
    })
  })

  it('rejects percentage discounts above 100 percent', async () => {
    const prisma = { $transaction: vi.fn() }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.createCoupon(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        code: 'TOO-MUCH', type: CouponType.PERCENTAGE, value: 101,
        active: true, reason: 'Invalid campaign test',
      },
    )).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('returns safe store-profile defaults before settings are first saved', async () => {
    const prisma = { storeSetting: { findUnique: vi.fn().mockResolvedValue(null) } }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.getSettings()).resolves.toMatchObject({
      storeProfile: {
        storeName: 'Lumi', supportEmail: 'hello@lumi.com',
        countryCode: 'NG', defaultCurrency: 'NGN',
      },
    })
  })

  it('saves an audited store-profile update', async () => {
    const profile = {
      storeName: 'Lumi', tagline: 'Considered clothing for everyday life.',
      supportEmail: 'support@lumi.com', supportPhone: '+2348005864000',
      addressLine: '18 Kingsway', city: 'Lagos', countryCode: 'NG',
      defaultCurrency: 'NGN',
    }
    const transaction = {
      storeSetting: { upsert: vi.fn().mockResolvedValue(profile) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-settings' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.updateStoreProfile(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      { ...profile, reason: 'Updated customer support address' },
    )

    expect(result).toEqual({ storeProfile: profile })
    expect(transaction.storeSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'primary' }, update: profile,
    }))
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'STORE_PROFILE_UPDATED', reason: 'Updated customer support address',
      }),
    })
  })

  it('saves audited shipping terms and serializes the monetary values', async () => {
    const transaction = {
      storeSetting: { upsert: vi.fn().mockResolvedValue({
        shippingEnabled: true,
        shippingFee: new Prisma.Decimal(30000),
        freeShippingThreshold: new Prisma.Decimal(400000),
        deliveryMinDays: 3,
        deliveryMaxDays: 7,
      }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-shipping' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.updateShippingSettings(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        shippingEnabled: true, shippingFee: 30000, freeShippingThreshold: 400000,
        deliveryMinDays: 3, deliveryMaxDays: 7, reason: 'Updated courier pricing',
      },
    )

    expect(result).toEqual({ shipping: {
      shippingEnabled: true, shippingFee: '30000.00', freeShippingThreshold: '400000.00',
      deliveryMinDays: 3, deliveryMaxDays: 7,
    } })
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'SHIPPING_SETTINGS_UPDATED', reason: 'Updated courier pricing' }),
    })
  })

  it('rejects a delivery window whose maximum is lower than its minimum', async () => {
    const prisma = { $transaction: vi.fn() }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.updateShippingSettings(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        shippingEnabled: true, shippingFee: 25000, freeShippingThreshold: 345000,
        deliveryMinDays: 8, deliveryMaxDays: 4, reason: 'Invalid delivery window test',
      },
    )).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('saves audited tax settings with a serialized percentage rate', async () => {
    const transaction = {
      storeSetting: { upsert: vi.fn().mockResolvedValue({
        taxEnabled: true,
        taxRate: new Prisma.Decimal(7.5),
        taxLabel: 'VAT',
        pricesIncludeTax: false,
      }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-tax' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.updateTaxSettings(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        taxEnabled: true, taxRate: 7.5, taxLabel: 'VAT', pricesIncludeTax: false,
        reason: 'Configured statutory VAT',
      },
    )

    expect(result).toEqual({ tax: {
      taxEnabled: true, taxRate: '7.50', taxLabel: 'VAT', pricesIncludeTax: false,
    } })
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'TAX_SETTINGS_UPDATED', reason: 'Configured statutory VAT' }),
    })
  })

  it('requires a positive tax rate when tax calculation is enabled', async () => {
    const prisma = { $transaction: vi.fn() }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.updateTaxSettings(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      {
        taxEnabled: true, taxRate: 0, taxLabel: 'VAT', pricesIncludeTax: true,
        reason: 'Invalid zero-rate test',
      },
    )).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('saves audited operational notification preferences', async () => {
    const notifications = {
      notificationEmail: 'orders@lumi.com',
      orderPaidAlerts: true,
      lowStockAlerts: true,
      lowStockThreshold: 8,
    }
    const transaction = {
      storeSetting: { upsert: vi.fn().mockResolvedValue(notifications) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-notifications' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.updateNotificationSettings(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      { ...notifications, reason: 'Send alerts to the fulfilment inbox' },
    )

    expect(result).toEqual({ notifications })
    expect(transaction.storeSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'primary' }, update: notifications,
    }))
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'NOTIFICATION_SETTINGS_UPDATED',
        reason: 'Send alerts to the fulfilment inbox',
      }),
    })
  })

  it('marks the current administrator session without exposing private hashes', async () => {
    const session = {
      id: 'session-current', userAgent: 'Browser', createdAt: new Date(0),
      lastSeenAt: new Date(0), expiresAt: new Date(Date.now() + 60_000), revokedAt: null,
    }
    const prisma = {
      session: { findMany: vi.fn().mockResolvedValue([session]) },
      auditLog: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    const result = await service.getAccountSecurity(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'session-current',
    )

    expect(result.sessions[0]).toMatchObject({ id: 'session-current', current: true, status: 'ACTIVE' })
    expect(result.sessions[0]).not.toHaveProperty('tokenHash')
    expect(result.sessions[0]).not.toHaveProperty('ipHash')
  })

  it('revokes only other active sessions and records the reason', async () => {
    const transaction = {
      session: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-security' }) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.revokeOtherSessions(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'session-current',
      'Removed access from old devices',
    )).resolves.toEqual({ revoked: 2 })

    expect(transaction.session.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'admin-1', id: { not: 'session-current' } }),
    }))
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ADMIN_OTHER_SESSIONS_REVOKED',
        reason: 'Removed access from old devices',
        metadata: { revokedCount: 2 },
      }),
    })
  })

  it('does not revoke the current session through session management', async () => {
    const prisma = { $transaction: vi.fn() }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.revokeSession(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'session-current',
      'session-current',
      'Accidental current-session request',
    )).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('enforces forward-only fulfilment transitions', async () => {
    const transaction = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'order-1',
          number: 'LM-2026-ABCDEF123456',
          status: OrderStatus.PAID,
          updatedAt: new Date(),
        }),
        updateMany: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    }
    const prisma = {
      $transaction: vi.fn((operation) => operation(transaction)),
    }
    const service = new AdminService(prisma as unknown as PrismaService)

    await expect(service.updateFulfillmentStatus(
      {
        id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
        role: UserRole.ADMINISTRATOR,
      },
      'LM-2026-ABCDEF123456',
      { status: OrderStatus.SHIPPED, reason: 'Handed to carrier' },
    )).rejects.toBeInstanceOf(BadRequestException)
    expect(transaction.order.updateMany).not.toHaveBeenCalled()
  })

  it('emails the customer after a shipping transition commits', async () => {
    const transaction = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'order-1', number: 'LM-2026-ABCDEF123456', status: OrderStatus.PROCESSING,
          updatedAt: new Date(), email: 'customer@example.com', shippingName: 'Customer',
          total: new Prisma.Decimal(125000), currency: 'NGN',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const sendOrderStatus = vi.fn().mockResolvedValue(undefined)
    const service = new AdminService(
      prisma as unknown as PrismaService,
      { sendOrderStatus } as unknown as BrevoEmailService,
    )

    await expect(service.updateFulfillmentStatus(
      { id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null, role: UserRole.ADMINISTRATOR },
      'LM-2026-ABCDEF123456',
      { status: OrderStatus.SHIPPED, reason: 'Handed to carrier' },
    )).resolves.toEqual({ number: 'LM-2026-ABCDEF123456', status: OrderStatus.SHIPPED })
    expect(sendOrderStatus).toHaveBeenCalledWith('customer@example.com', expect.objectContaining({
      status: OrderStatus.SHIPPED, note: 'Handed to carrier',
    }))
  })
})
