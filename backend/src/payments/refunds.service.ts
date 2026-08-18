import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/auth.types.js'
import { PrismaService } from '../database/prisma.service.js'
import {
  OrderStatus,
  PaymentEventStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RefundStatus,
} from '../generated/prisma/client.js'
import { PaystackClient, PaystackRefundException } from './paystack.client.js'

const refundableOrderStatuses: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.PARTIALLY_REFUNDED,
]

const committedRefundStatuses = [
  RefundStatus.REQUESTING,
  RefundStatus.PENDING,
  RefundStatus.PROCESSING,
  RefundStatus.NEEDS_ATTENTION,
  RefundStatus.PROCESSED,
]

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackClient,
  ) {}

  async initiate(actor: AuthenticatedUser, orderNumber: string, input: { amount?: number; reason: string }) {
    if (!this.paystack.isEnabled()) {
      throw new BadRequestException('Paystack refunds are not configured.')
    }
    const refund = await this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { number: orderNumber },
        select: {
          id: true,
          number: true,
          status: true,
          payments: {
            where: {
              provider: PaymentProvider.PAYSTACK,
              status: { in: [PaymentStatus.SUCCEEDED, PaymentStatus.PARTIALLY_REFUNDED] },
            },
            take: 1,
            select: { id: true, providerReference: true, amount: true, currency: true },
          },
        },
      })
      if (!order) throw new NotFoundException('Order not found.')
      if (!refundableOrderStatuses.includes(order.status)) {
        throw new BadRequestException('This order is not eligible for a refund.')
      }
      const payment = order.payments[0]
      if (!payment) throw new BadRequestException('A refundable Paystack payment was not found.')
      const existing = await transaction.refund.aggregate({
        where: { paymentId: payment.id, status: { in: committedRefundStatuses } },
        _sum: { amount: true },
      })
      const remaining = payment.amount.minus(existing._sum.amount ?? 0)
      const amount = input.amount === undefined ? remaining : new Prisma.Decimal(input.amount)
      if (amount.lessThanOrEqualTo(0) || amount.greaterThan(remaining)) {
        throw new BadRequestException(`Refund amount cannot exceed ${payment.currency} ${remaining.toFixed(2)}.`)
      }
      const created = await transaction.refund.create({
        data: {
          paymentId: payment.id,
          amount,
          currency: payment.currency,
          reason: input.reason,
          initiatedByUserId: actor.id,
        },
      })
      await transaction.auditLog.create({
        data: {
          actorUserId: actor.id,
          actorRole: actor.role,
          action: 'REFUND_REQUESTED',
          resourceType: 'REFUND',
          resourceId: created.id,
          result: 'PENDING_PROVIDER',
          reason: input.reason,
          metadata: { orderNumber: order.number, amount: amount.toFixed(2), currency: payment.currency },
        },
      })
      return { ...created, providerReference: payment.providerReference }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    try {
      const provider = await this.paystack.createRefund({
        transaction: refund.providerReference,
        amount: toSubunit(refund.amount),
        currency: refund.currency,
        merchantNote: input.reason,
      })
      const updated = await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          providerRefundId: provider.providerRefundId,
          providerRefundReference: provider.providerRefundReference,
          status: provider.status === 'processing' ? RefundStatus.PROCESSING : RefundStatus.PENDING,
          expectedAt: provider.expectedAt,
          failureReason: null,
          providerMetadata: {
            providerRefundId: provider.providerRefundId,
            providerRefundReference: provider.providerRefundReference,
          },
        },
      })
      return toRefundResponse(updated)
    } catch (error) {
      const definitive = error instanceof PaystackRefundException && error.definitive
      await this.prisma.$transaction([
        this.prisma.refund.update({
          where: { id: refund.id },
          data: definitive ? {
            status: RefundStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'Paystack rejected the refund request.',
          } : {
            failureReason: 'Provider response is unknown; webhook reconciliation is required.',
          },
        }),
        this.prisma.auditLog.create({
          data: {
            actorUserId: actor.id,
            actorRole: actor.role,
            action: 'REFUND_PROVIDER_REQUEST_FAILED',
            resourceType: 'REFUND',
            resourceId: refund.id,
            result: definitive ? 'FAILED' : 'UNKNOWN',
            reason: input.reason,
          },
        }),
      ])
      throw error
    }
  }

  async processWebhook(input: {
    eventId: string
    eventType: string
    payloadHash: string
    paymentId: string
    amount: unknown
    currency: unknown
    providerRefundReference: unknown
    providerStatus: unknown
  }) {
    const subunit = typeof input.amount === 'string' ? Number(input.amount) : input.amount
    const currency = typeof input.currency === 'string' ? input.currency.toUpperCase() : null
    if (typeof subunit !== 'number' || !Number.isSafeInteger(subunit) || subunit <= 0 || !currency) {
      await this.recordEvent(input, PaymentEventStatus.FAILED, 'Refund amount or currency was invalid.')
      return
    }
    const amount = new Prisma.Decimal(subunit).dividedBy(100)
    const refundReference = typeof input.providerRefundReference === 'string'
      ? input.providerRefundReference
      : null
    const refund = await this.prisma.refund.findFirst({
      where: {
        paymentId: input.paymentId,
        amount,
        currency,
        status: { in: committedRefundStatuses },
        ...(refundReference ? {
          OR: [
            { providerRefundReference: refundReference },
            { providerRefundReference: null },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'asc' },
    })
    if (!refund) {
      await this.recordEvent(input, PaymentEventStatus.IGNORED, 'Matching refund request was not found.')
      return
    }
    const nextStatus = webhookStatus(input.eventType, input.providerStatus)
    if (!nextStatus) {
      await this.recordEvent(input, PaymentEventStatus.IGNORED, 'Unsupported refund state.')
      return
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.paymentEvent.create({
        data: paymentEventData(input, PaymentEventStatus.PROCESSED, refund.paymentId),
      })
      const updated = await transaction.refund.updateMany({
        where: { id: refund.id, status: { in: allowedPreviousStatuses(nextStatus) } },
        data: {
          status: nextStatus,
          ...(refundReference ? { providerRefundReference: refundReference } : {}),
          ...(nextStatus === RefundStatus.PROCESSED ? { processedAt: new Date(), failureReason: null } : {}),
          ...(nextStatus === RefundStatus.FAILED ? { failedAt: new Date(), failureReason: 'Paystack could not process the refund.' } : {}),
        },
      })
      if (updated.count !== 1) return
      if (nextStatus === RefundStatus.PROCESSED) {
        const payment = await transaction.payment.findUniqueOrThrow({
          where: { id: refund.paymentId },
          select: { id: true, orderId: true, amount: true },
        })
        const processed = await transaction.refund.aggregate({
          where: { paymentId: refund.paymentId, status: RefundStatus.PROCESSED },
          _sum: { amount: true },
        })
        const fullyRefunded = (processed._sum.amount ?? new Prisma.Decimal(0)).greaterThanOrEqualTo(payment.amount)
        await transaction.payment.update({
          where: { id: payment.id },
          data: { status: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED },
        })
        await transaction.order.update({
          where: { id: payment.orderId },
          data: { status: fullyRefunded ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED },
        })
      }
      await transaction.auditLog.create({
        data: {
          action: 'REFUND_PROVIDER_STATUS_CHANGED',
          resourceType: 'REFUND',
          resourceId: refund.id,
          result: nextStatus,
          metadata: { eventType: input.eventType },
        },
      })
    })
  }

  private recordEvent(
    input: { eventId: string; eventType: string; payloadHash: string; paymentId: string },
    status: PaymentEventStatus,
    failureReason: string,
  ) {
    return this.prisma.paymentEvent.create({
      data: paymentEventData(input, status, input.paymentId, failureReason),
    })
  }
}

function webhookStatus(eventType: string, providerStatus: unknown) {
  const raw = eventType.replace('refund.', '').replace('-', '_').toUpperCase()
  if (typeof providerStatus === 'string' && providerStatus.replace('-', '_').toUpperCase() !== raw) return null
  return ({
    PENDING: RefundStatus.PENDING,
    PROCESSING: RefundStatus.PROCESSING,
    NEEDS_ATTENTION: RefundStatus.NEEDS_ATTENTION,
    PROCESSED: RefundStatus.PROCESSED,
    FAILED: RefundStatus.FAILED,
  } as Record<string, RefundStatus | undefined>)[raw]
}

function allowedPreviousStatuses(next: RefundStatus) {
  if (next === RefundStatus.PENDING) return [RefundStatus.REQUESTING, RefundStatus.PENDING]
  if (next === RefundStatus.PROCESSING) return [RefundStatus.REQUESTING, RefundStatus.PENDING, RefundStatus.PROCESSING]
  return [RefundStatus.REQUESTING, RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.NEEDS_ATTENTION]
}

function paymentEventData(
  input: { eventId: string; eventType: string; payloadHash: string },
  status: PaymentEventStatus,
  paymentId: string,
  failureReason?: string,
) {
  return {
    paymentId,
    provider: PaymentProvider.PAYSTACK,
    providerEventId: input.eventId,
    eventType: input.eventType,
    payloadHash: input.payloadHash,
    status,
    failureReason,
    processedAt: new Date(),
  }
}

function toSubunit(amount: Prisma.Decimal) {
  const subunit = amount.mul(100)
  if (!subunit.isInteger() || subunit.lessThan(1) || subunit.greaterThan(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException('The refund amount is invalid.')
  }
  return subunit.toNumber()
}

function toRefundResponse(refund: {
  id: string
  status: RefundStatus
  amount: Prisma.Decimal
  currency: string
  expectedAt: Date | null
  createdAt: Date
}) {
  return {
    id: refund.id,
    status: refund.status,
    amount: refund.amount.toFixed(2),
    currency: refund.currency,
    expectedAt: refund.expectedAt,
    createdAt: refund.createdAt,
  }
}
