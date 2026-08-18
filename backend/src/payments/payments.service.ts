import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  OrderStatus,
  PaymentEventStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '../generated/prisma/client.js'
import { hashToken } from '../auth/auth.crypto.js'
import { BrevoEmailService } from '../auth/brevo-email.service.js'
import { PrismaService } from '../database/prisma.service.js'
import { PaystackClient, PaystackInitializationException } from './paystack.client.js'

const RESERVATION_MINUTES = 30

type PaystackEvent = {
  event?: unknown
  data?: {
    reference?: unknown
    amount?: unknown
    currency?: unknown
    status?: unknown
  }
}

type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: { order: { include: { items: true } } }
}>

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackClient,
    private readonly email: BrevoEmailService,
  ) {}

  availability() {
    return { provider: 'PAYSTACK', enabled: this.paystack.isEnabled() }
  }

  async status(reference: string, userId: string | undefined, guestToken: string | null) {
    if (!/^[A-Za-z0-9.=-]{1,200}$/.test(reference)) {
      throw new NotFoundException('Payment not found')
    }
    const ownership = [
      ...(userId ? [{ userId }] : []),
      ...(guestToken ? [{ cart: { guestTokenHash: hashToken(guestToken) } }] : []),
    ]
    if (!ownership.length) throw new NotFoundException('Payment not found')
    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: PaymentProvider.PAYSTACK,
        providerReference: reference,
        order: { OR: ownership },
      },
      select: {
        providerReference: true,
        status: true,
        order: { select: { number: true, status: true } },
      },
    })
    if (!payment) throw new NotFoundException('Payment not found')
    return {
      provider: 'PAYSTACK',
      reference: payment.providerReference,
      paymentStatus: payment.status,
      orderNumber: payment.order.number,
      orderStatus: payment.order.status,
    }
  }

  async initialize(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    if (!this.paystack.isEnabled()) {
      // Fail before changing order or inventory state.
      return this.paystack.initialize({
        email: '', amount: 0, currency: '', reference: '', metadata: {},
      })
    }
    const order = await this.findOwned(orderNumber, userId, guestToken)
    if (!order) throw new NotFoundException('Order not found')
    if (!this.paystack.supportsCurrency(order.currency)) {
      throw new BadRequestException(`Online payment is unavailable for ${order.currency} orders.`)
    }

    const existing = await this.prisma.payment.findUnique({
      where: { orderId_provider: { orderId: order.id, provider: PaymentProvider.PAYSTACK } },
    })
    if (existing?.status === PaymentStatus.PENDING && existing.expiresAt > new Date()) {
      const metadata = asMetadata(existing.providerMetadata)
      if (metadata.authorizationUrl) {
        return paymentSession(existing.providerReference, existing.expiresAt, metadata.authorizationUrl)
      }
      throw new BadRequestException('Payment initialization is already in progress.')
    }
    if (existing?.status === PaymentStatus.PENDING) {
      throw new BadRequestException(
        existing.expiresAt > new Date()
          ? 'This order already has a payment attempt.'
          : 'This payment attempt requires provider reconciliation.',
      )
    } else if (existing && existing.status !== PaymentStatus.FAILED) {
      throw new BadRequestException('This order already has a payment attempt.')
    }
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only an unpaid order draft can be paid.')
    }

    const reference = `LM-${randomBytes(16).toString('hex')}`
    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000)
    const amount = toSubunit(order.total)
    const payment = await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.order.updateMany({
        where: { id: order.id, status: OrderStatus.DRAFT },
        data: { status: OrderStatus.PENDING_PAYMENT },
      })
      if (claimed.count !== 1) throw new BadRequestException('Payment is already in progress.')
      for (const item of order.items) {
        if (!item.productId) throw new BadRequestException('An order item is unavailable.')
        const reserved = await transaction.$executeRaw`
          UPDATE "inventory"
          SET "reserved" = "reserved" + ${item.quantity},
              "version" = "version" + 1,
              "updated_at" = NOW()
          WHERE "product_id" = ${item.productId}::uuid
            AND "on_hand" - "reserved" >= ${item.quantity}
        `
        if (reserved !== 1) throw new BadRequestException('One or more items are out of stock.')
      }
      return transaction.payment.upsert({
        where: { orderId_provider: { orderId: order.id, provider: PaymentProvider.PAYSTACK } },
        create: {
          orderId: order.id,
          provider: PaymentProvider.PAYSTACK,
          providerReference: reference,
          amount: order.total,
          currency: order.currency,
          expiresAt,
        },
        update: {
          providerReference: reference,
          status: PaymentStatus.PENDING,
          amount: order.total,
          currency: order.currency,
          providerMetadata: Prisma.DbNull,
          expiresAt,
          reconciliationAttempts: 0,
          nextReconcileAt: null,
          lastReconciledAt: null,
          reconciliationError: null,
          paidAt: null,
        },
      })
    })

    try {
      const initialized = await this.paystack.initialize({
        email: order.email,
        amount,
        currency: order.currency,
        reference,
        metadata: { orderNumber: order.number },
      })
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerMetadata: {
            authorizationUrl: initialized.authorizationUrl,
            accessCode: initialized.accessCode,
          },
        },
      })
      return paymentSession(reference, expiresAt, initialized.authorizationUrl)
    } catch (error) {
      if (error instanceof PaystackInitializationException && error.definitive) {
        await this.releaseReservation(payment.id, order.id, order.items)
      }
      throw error
    }
  }

  async processWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!this.paystack.isEnabled()) throw new NotFoundException()
    if (!rawBody || !signature || !this.validSignature(rawBody, signature)) {
      throw new ForbiddenException('Invalid webhook signature.')
    }
    const payloadHash = createHash('sha256').update(rawBody).digest('hex')
    let payload: PaystackEvent
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as PaystackEvent
    } catch {
      throw new BadRequestException('Invalid webhook payload.')
    }
    const eventType = typeof payload.event === 'string' ? payload.event : 'unknown'
    const reference = typeof payload.data?.reference === 'string' ? payload.data.reference : null
    const eventId = `${eventType}:${reference ?? payloadHash}`
    const duplicate = await this.prisma.paymentEvent.findUnique({
      where: { provider_providerEventId: { provider: PaymentProvider.PAYSTACK, providerEventId: eventId } },
    })
    if (duplicate) return { received: true }

    const payment = reference ? await this.prisma.payment.findUnique({
      where: { providerReference: reference },
      include: { order: { include: { items: true } } },
    }) : null
    if (eventType !== 'charge.success' || !payment) {
      await this.recordEvent(eventId, eventType, payloadHash, payment?.id, PaymentEventStatus.IGNORED)
      return { received: true }
    }
    const amountMatches = payload.data?.amount === toSubunit(payment.amount)
    const currencyMatches = typeof payload.data?.currency === 'string' &&
      payload.data.currency.toUpperCase() === payment.currency.toUpperCase()
    if (!amountMatches || !currencyMatches || payload.data?.status !== 'success') {
      await this.recordEvent(
        eventId, eventType, payloadHash, payment.id, PaymentEventStatus.FAILED,
        'Provider amount, currency, or status did not match the payment.',
      )
      return { received: true }
    }

    await this.settlePayment(payment, eventId, eventType, payloadHash)
    return { received: true }
  }

  async reconcileBatch(limit: number) {
    if (!this.paystack.isEnabled()) return { examined: 0, settled: 0, released: 0 }
    const now = new Date()
    const candidates = await this.prisma.payment.findMany({
      where: {
        provider: PaymentProvider.PAYSTACK,
        status: PaymentStatus.PENDING,
        expiresAt: { lte: now },
        OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }],
      },
      include: { order: { include: { items: true } } },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    })
    let settled = 0
    let released = 0
    for (const payment of candidates) {
      const claimed = await this.prisma.payment.updateMany({
        where: {
          id: payment.id,
          status: PaymentStatus.PENDING,
          OR: [{ nextReconcileAt: null }, { nextReconcileAt: { lte: now } }],
        },
        data: {
          reconciliationAttempts: { increment: 1 },
          nextReconcileAt: new Date(Date.now() + 5 * 60_000),
          lastReconciledAt: now,
          reconciliationError: null,
        },
      })
      if (claimed.count !== 1) continue
      try {
        const result = await this.paystack.verify(payment.providerReference)
        if (
          result.amount !== toSubunit(payment.amount) ||
          result.currency !== payment.currency.toUpperCase()
        ) {
          await this.deferReconciliation(payment.id, 'Provider amount or currency did not match.')
          continue
        }
        const payloadHash = createHash('sha256').update(JSON.stringify(result)).digest('hex')
        if (result.status === 'success') {
          const didSettle = await this.settlePayment(
            payment,
            `verification.success:${payment.providerReference}`,
            'verification.success',
            payloadHash,
          )
          if (didSettle) settled += 1
        } else if (result.status === 'failed' || result.status === 'abandoned') {
          const didRelease = await this.releaseReservation(payment.id, payment.orderId, payment.order.items, {
            eventId: `verification.${result.status}:${payment.providerReference}`,
            eventType: `verification.${result.status}`,
            payloadHash,
          })
          if (didRelease) released += 1
        } else {
          await this.deferReconciliation(payment.id, `Provider status is ${result.status}.`)
        }
      } catch (error) {
        await this.deferReconciliation(
          payment.id,
          error instanceof Error ? error.message : 'Provider verification failed.',
        )
      }
    }
    return { examined: candidates.length, settled, released }
  }

  private async settlePayment(
    payment: PaymentWithOrder,
    eventId: string,
    eventType: string,
    payloadHash: string,
  ) {
    const settled = await this.prisma.$transaction(async (transaction) => {
      await transaction.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider: PaymentProvider.PAYSTACK,
          providerEventId: eventId,
          eventType,
          payloadHash,
          status: PaymentEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      })
      const claimed = await transaction.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
          lastReconciledAt: new Date(),
          nextReconcileAt: null,
          reconciliationError: null,
        },
      })
      if (claimed.count !== 1) {
        return false
      }
      for (const item of payment.order.items) {
        if (!item.productId) throw new Error('Reserved product is missing.')
        const fulfilled = await transaction.$executeRaw`
          UPDATE "inventory"
          SET "on_hand" = "on_hand" - ${item.quantity},
              "reserved" = "reserved" - ${item.quantity},
              "version" = "version" + 1,
              "updated_at" = NOW()
          WHERE "product_id" = ${item.productId}::uuid
            AND "on_hand" >= ${item.quantity}
            AND "reserved" >= ${item.quantity}
        `
        if (fulfilled !== 1) throw new Error('Reserved inventory invariant failed.')
      }
      const paidAt = new Date()
      const orderClaimed = await transaction.order.updateMany({
        where: { id: payment.orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAID, paidAt },
      })
      if (orderClaimed.count !== 1) throw new Error('Pending order invariant failed.')
      return true
    })
    if (settled) await this.sendSettlementNotification(payment)
    return settled
  }

  private async sendSettlementNotification(payment: PaymentWithOrder) {
    try {
      const settings = await this.prisma.storeSetting.findUnique({
        where: { id: 'primary' },
        select: {
          notificationEmail: true,
          orderPaidAlerts: true,
          lowStockAlerts: true,
          lowStockThreshold: true,
        },
      })
      if (!settings || (!settings.orderPaidAlerts && !settings.lowStockAlerts)) return

      const productIds = [...new Set(payment.order.items.flatMap((item) => item.productId ? [item.productId] : []))]
      const products = settings.lowStockAlerts && productIds.length ? await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          name: true,
          sku: true,
          inventory: { select: { onHand: true, reserved: true } },
        },
      }) : []
      const lowStock = products.flatMap((product) => {
        const available = Math.max(0, (product.inventory?.onHand ?? 0) - (product.inventory?.reserved ?? 0))
        return available <= settings.lowStockThreshold
          ? [{ name: product.name, sku: product.sku, available }]
          : []
      })
      if (!settings.orderPaidAlerts && lowStock.length === 0) return

      await this.email.sendOperationalOrderAlert(settings.notificationEmail, {
        ...(settings.orderPaidAlerts ? {
          orderNumber: payment.order.number,
          customerName: payment.order.shippingName,
          customerEmail: payment.order.email,
          total: payment.order.total.toFixed(2),
          currency: payment.order.currency,
        } : {}),
        lowStock,
      })
    } catch {
      // A notification outage must never roll back a confirmed provider payment.
    }
  }

  private async deferReconciliation(paymentId: string, reason: string) {
    await this.prisma.payment.updateMany({
      where: { id: paymentId, status: PaymentStatus.PENDING },
      data: {
        reconciliationError: reason.slice(0, 500),
        nextReconcileAt: new Date(Date.now() + 5 * 60_000),
      },
    })
  }

  private validSignature(rawBody: Buffer, signature: string) {
    const expected = createHmac('sha512', this.paystack.secret()).update(rawBody).digest('hex')
    const supplied = Buffer.from(signature, 'utf8')
    const wanted = Buffer.from(expected, 'utf8')
    return supplied.length === wanted.length && timingSafeEqual(supplied, wanted)
  }

  private async releaseReservation(
    paymentId: string,
    orderId: string,
    items: Array<{ productId: string | null; quantity: number }>,
    event?: { eventId: string; eventType: string; payloadHash: string },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.payment.updateMany({
        where: { id: paymentId, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.FAILED,
          lastReconciledAt: new Date(),
          nextReconcileAt: null,
          reconciliationError: null,
        },
      })
      if (claimed.count !== 1) return false
      for (const item of items) {
        if (!item.productId) continue
        const released = await transaction.$executeRaw`
          UPDATE "inventory"
          SET "reserved" = "reserved" - ${item.quantity},
              "version" = "version" + 1,
              "updated_at" = NOW()
          WHERE "product_id" = ${item.productId}::uuid
            AND "reserved" >= ${item.quantity}
        `
        if (released !== 1) throw new Error('Reserved inventory release invariant failed.')
      }
      await transaction.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.DRAFT },
      })
      if (event) {
        await transaction.paymentEvent.create({
          data: {
            paymentId,
            provider: PaymentProvider.PAYSTACK,
            providerEventId: event.eventId,
            eventType: event.eventType,
            payloadHash: event.payloadHash,
            status: PaymentEventStatus.PROCESSED,
            processedAt: new Date(),
          },
        })
      }
      return true
    })
  }

  private findOwned(orderNumber: string, userId: string | undefined, guestToken: string | null) {
    const ownership = [
      ...(userId ? [{ userId }] : []),
      ...(guestToken ? [{ cart: { guestTokenHash: hashToken(guestToken) } }] : []),
    ]
    if (!ownership.length) return null
    return this.prisma.order.findFirst({
      where: { number: orderNumber, OR: ownership },
      include: { items: true },
    })
  }

  private recordEvent(
    providerEventId: string,
    eventType: string,
    payloadHash: string,
    paymentId: string | undefined,
    status: PaymentEventStatus,
    failureReason?: string,
  ) {
    return this.prisma.paymentEvent.create({
      data: {
        paymentId,
        provider: PaymentProvider.PAYSTACK,
        providerEventId,
        eventType,
        payloadHash,
        status,
        failureReason,
        processedAt: new Date(),
      },
    })
  }
}

function toSubunit(amount: Prisma.Decimal) {
  const subunit = amount.mul(100)
  if (!subunit.isInteger() || subunit.lessThan(1) || subunit.greaterThan(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException('The payment amount is invalid.')
  }
  return subunit.toNumber()
}

function asMetadata(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function paymentSession(reference: string, expiresAt: Date, authorizationUrl: unknown) {
  if (typeof authorizationUrl !== 'string') throw new BadRequestException('Payment session is unavailable.')
  return { provider: 'PAYSTACK', reference, authorizationUrl, expiresAt }
}
