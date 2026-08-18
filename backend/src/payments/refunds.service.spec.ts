import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  RefundStatus,
  UserRole,
} from '../generated/prisma/client.js'
import type { PaystackClient } from './paystack.client.js'
import { RefundsService } from './refunds.service.js'

const actor = {
  id: 'admin-1', email: 'admin@example.com', firstName: null, lastName: null,
  role: UserRole.ADMINISTRATOR,
}

describe('RefundsService', () => {
  it('durably records a refund before asking Paystack to queue it', async () => {
    const createdAt = new Date()
    const refund = {
      id: 'refund-1', paymentId: 'payment-1', providerRefundId: null,
      providerRefundReference: null, status: RefundStatus.REQUESTING,
      amount: new Prisma.Decimal(50000), currency: 'NGN', reason: 'Customer return approved',
      initiatedByUserId: actor.id, providerMetadata: null, failureReason: null,
      expectedAt: null, processedAt: null, failedAt: null, createdAt, updatedAt: createdAt,
    }
    const transaction = {
      order: { findUnique: vi.fn().mockResolvedValue({
        id: 'order-1', number: 'LM-2026-ABCDEF123456', status: OrderStatus.PAID,
        payments: [{ id: 'payment-1', providerReference: 'LM-payment', amount: new Prisma.Decimal(100000), currency: 'NGN' }],
      }) },
      refund: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal(0) } }),
        create: vi.fn().mockResolvedValue(refund),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }
    const prisma = {
      $transaction: vi.fn((operation) => operation(transaction)),
      refund: { update: vi.fn().mockResolvedValue({ ...refund, status: RefundStatus.PENDING }) },
    }
    const paystack = {
      isEnabled: () => true,
      createRefund: vi.fn().mockResolvedValue({
        providerRefundId: '123', providerRefundReference: null, status: 'pending',
        amount: 5_000_000, currency: 'NGN', expectedAt: null,
      }),
    }
    const service = new RefundsService(prisma as unknown as PrismaService, paystack as unknown as PaystackClient)

    await expect(service.initiate(actor, 'LM-2026-ABCDEF123456', {
      amount: 50000, reason: 'Customer return approved',
    })).resolves.toMatchObject({ id: 'refund-1', status: RefundStatus.PENDING, amount: '50000.00' })
    expect(transaction.refund.create).toHaveBeenCalledBefore(paystack.createRefund)
    expect(paystack.createRefund).toHaveBeenCalledWith(expect.objectContaining({ amount: 5_000_000 }))
  })

  it('rejects a refund above the uncommitted payment balance', async () => {
    const transaction = {
      order: { findUnique: vi.fn().mockResolvedValue({
        id: 'order-1', number: 'LM-2026-ABCDEF123456', status: OrderStatus.PAID,
        payments: [{ id: 'payment-1', providerReference: 'LM-payment', amount: new Prisma.Decimal(100000), currency: 'NGN' }],
      }) },
      refund: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal(75000) } }),
        create: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    }
    const prisma = { $transaction: vi.fn((operation) => operation(transaction)) }
    const paystack = { isEnabled: () => true, createRefund: vi.fn() }
    const service = new RefundsService(prisma as unknown as PrismaService, paystack as unknown as PaystackClient)

    await expect(service.initiate(actor, 'LM-2026-ABCDEF123456', {
      amount: 30000, reason: 'Partial refund request',
    })).rejects.toBeInstanceOf(BadRequestException)
    expect(transaction.refund.create).not.toHaveBeenCalled()
    expect(paystack.createRefund).not.toHaveBeenCalled()
  })

  it('marks payment and order refunded only after a processed webhook', async () => {
    const refund = {
      id: 'refund-1', paymentId: 'payment-1', status: RefundStatus.PENDING,
      amount: new Prisma.Decimal(100000), currency: 'NGN', createdAt: new Date(),
    }
    const transaction = {
      paymentEvent: { create: vi.fn().mockResolvedValue({}) },
      refund: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: new Prisma.Decimal(100000) } }),
      },
      payment: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'payment-1', orderId: 'order-1', amount: new Prisma.Decimal(100000) }),
        update: vi.fn().mockResolvedValue({}),
      },
      order: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }
    const prisma = {
      refund: { findFirst: vi.fn().mockResolvedValue(refund) },
      $transaction: vi.fn((operation) => operation(transaction)),
    }
    const service = new RefundsService(prisma as unknown as PrismaService, {} as PaystackClient)

    await service.processWebhook({
      eventId: 'refund.processed:hash', eventType: 'refund.processed', payloadHash: 'a'.repeat(64),
      paymentId: 'payment-1', amount: '10000000', currency: 'NGN',
      providerRefundReference: null, providerStatus: 'processed',
    })

    expect(transaction.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: PaymentStatus.REFUNDED },
    }))
    expect(transaction.order.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: OrderStatus.REFUNDED },
    }))
  })
})
