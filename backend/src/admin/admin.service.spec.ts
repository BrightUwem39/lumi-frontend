import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import { UserRole } from '../generated/prisma/client.js'
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
})
