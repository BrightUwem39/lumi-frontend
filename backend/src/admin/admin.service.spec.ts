import { BadRequestException, ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import { OrderStatus, UserRole } from '../generated/prisma/client.js'
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
})
