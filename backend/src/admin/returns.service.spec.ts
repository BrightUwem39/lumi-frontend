import { BadRequestException, ConflictException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import { OrderStatus, ReturnStatus, UserRole } from '../generated/prisma/client.js'
import { ReturnsService } from './returns.service.js'

const actor = {
  id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
  role: UserRole.ADMINISTRATOR,
}

describe('ReturnsService', () => {
  it('does not let active returns exceed the purchased quantity', async () => {
    const transaction = {
      order: { findUnique: vi.fn().mockResolvedValue({
        id: 'order-1', number: 'LM-2026-ABCDEF123456', status: OrderStatus.DELIVERED,
        items: [{ id: 'order-item-1', quantity: 2 }],
      }) },
      returnItem: { groupBy: vi.fn().mockResolvedValue([{
        orderItemId: 'order-item-1', _sum: { quantity: 1 },
      }]) },
      productReturn: { create: vi.fn() },
      auditLog: { create: vi.fn() },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new ReturnsService(prisma as unknown as PrismaService)

    await expect(service.create(actor, 'LM-2026-ABCDEF123456', {
      items: [{ orderItemId: 'order-item-1', quantity: 2 }],
      reason: 'Customer requested a return',
    })).rejects.toBeInstanceOf(BadRequestException)
    expect(transaction.productReturn.create).not.toHaveBeenCalled()
  })

  it('enforces the forward-only return status lifecycle', async () => {
    const transaction = {
      productReturn: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue({ id: 'return-1' }),
      },
      auditLog: { create: vi.fn() },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const service = new ReturnsService(prisma as unknown as PrismaService)

    await expect(service.updateStatus(actor, 'return-1', {
      status: ReturnStatus.RECEIVED,
      resolutionNote: 'Parcel arrived at the warehouse',
    })).rejects.toBeInstanceOf(ConflictException)
    expect(transaction.productReturn.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'return-1', status: ReturnStatus.APPROVED },
    }))
  })

  it('restocks only the explicitly accepted quantities when completing a received return', async () => {
    const returnedItems = [
      { id: 'return-item-1', quantity: 2, orderItem: { productId: 'product-1', sku: 'SKU-1' } },
      { id: 'return-item-2', quantity: 1, orderItem: { productId: 'product-2', sku: 'SKU-2' } },
    ]
    const transaction = {
      productReturn: {
        findUnique: vi.fn().mockResolvedValue({ id: 'return-1', status: ReturnStatus.RECEIVED, items: returnedItems }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      returnItem: { update: vi.fn().mockResolvedValue({}) },
      $executeRaw: vi.fn().mockResolvedValue(1),
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }
    const completedReturn = { id: 'return-1', status: ReturnStatus.COMPLETED, items: [] }
    const prisma = {
      $transaction: vi.fn((operation) => operation(transaction)),
      productReturn: { findUnique: vi.fn().mockResolvedValue(completedReturn) },
    }
    const service = new ReturnsService(prisma as unknown as PrismaService)

    await expect(service.complete(actor, 'return-1', {
      items: [
        { returnItemId: 'return-item-1', quantity: 1 },
        { returnItemId: 'return-item-2', quantity: 0 },
      ],
      resolutionNote: 'One item passed inspection; the other was damaged',
    })).resolves.toEqual(completedReturn)

    expect(transaction.returnItem.update).toHaveBeenCalledTimes(2)
    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1)
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'RETURN_COMPLETED', metadata: { totalRestocked: 1 },
      }),
    })
  })
})
