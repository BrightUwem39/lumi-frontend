import { createHmac } from 'node:crypto'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { PaymentEventStatus, PaymentProvider, PaymentStatus, Prisma } from '../generated/prisma/client.js'
import type { PrismaService } from '../database/prisma.service.js'
import type { PaystackClient } from './paystack.client.js'
import type { BrevoEmailService } from '../auth/brevo-email.service.js'
import { PaymentsService } from './payments.service.js'

const secret = 'sk_test_payment-webhook-secret'

describe('PaymentsService webhook boundary', () => {
  it('reports provider availability without exposing configuration', () => {
    expect(createService({}, false).availability()).toEqual({ provider: 'PAYSTACK', enabled: false })
  })

  it('applies order ownership while resolving a payment return reference', async () => {
    const prisma = { payment: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = createService(prisma, true)
    await expect(service.status('LM-reference', 'customer-a', null))
      .rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.payment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        providerReference: 'LM-reference',
        order: { OR: [{ userId: 'customer-a' }] },
      }),
    }))
  })

  it('hides the webhook when the provider is disabled', async () => {
    const service = createService({}, false)
    await expect(service.processWebhook(Buffer.from('{}'), 'signature'))
      .rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects a webhook whose raw body signature is invalid', async () => {
    const service = createService({}, true)
    await expect(service.processWebhook(Buffer.from('{}'), 'invalid'))
      .rejects.toBeInstanceOf(ForbiddenException)
  })

  it('records a correctly signed unknown event without changing payment state', async () => {
    const raw = Buffer.from(JSON.stringify({ event: 'customeridentification.success', data: {} }))
    const signature = createHmac('sha512', secret).update(raw).digest('hex')
    const prisma = {
      paymentEvent: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    }
    const service = createService(prisma, true)
    await expect(service.processWebhook(raw, signature)).resolves.toEqual({ received: true })
    expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: PaymentProvider.PAYSTACK,
        eventType: 'customeridentification.success',
        status: PaymentEventStatus.IGNORED,
      }),
    })
  })

  it('keeps non-terminal verification results pending for a later retry', async () => {
    const payment = {
      id: 'payment-1',
      orderId: 'order-1',
      providerReference: 'LM-reference',
      provider: PaymentProvider.PAYSTACK,
      status: PaymentStatus.PENDING,
      amount: new Prisma.Decimal('150.00'),
      currency: 'NGN',
      expiresAt: new Date(0),
      nextReconcileAt: null,
      providerMetadata: null,
      paidAt: null,
      reconciliationAttempts: 0,
      lastReconciledAt: null,
      reconciliationError: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      order: { status: 'PENDING_PAYMENT', items: [] },
    }
    const prisma = {
      payment: {
        findMany: vi.fn().mockResolvedValue([payment]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    }
    const service = createService(prisma, true, {
      verify: vi.fn().mockResolvedValue({
        status: 'pending', reference: 'LM-reference', amount: 15000, currency: 'NGN',
      }),
    })
    await expect(service.reconcileBatch(10)).resolves.toEqual({ examined: 1, settled: 0, released: 0 })
    expect(prisma.payment.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ reconciliationError: 'Provider status is pending.' }),
    }))
  })
})

function createService(prisma: object, enabled: boolean, overrides: object = {}) {
  const paystack = {
    isEnabled: () => enabled,
    secret: () => secret,
    ...overrides,
  }
  return new PaymentsService(
    prisma as PrismaService,
    paystack as PaystackClient,
    { sendOperationalOrderAlert: vi.fn() } as unknown as BrevoEmailService,
  )
}
