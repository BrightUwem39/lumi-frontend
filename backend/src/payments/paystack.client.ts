import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

type InitializeInput = {
  email: string
  amount: number
  currency: string
  reference: string
  metadata: Record<string, string>
}

type InitializeResponse = {
  status: boolean
  data?: { authorization_url?: string; access_code?: string; reference?: string }
}

type VerifyResponse = {
  status: boolean
  data?: {
    status?: string
    reference?: string
    amount?: number
    currency?: string
  }
}

type RefundResponse = {
  status: boolean
  data?: {
    id?: number | string
    amount?: number
    currency?: string
    status?: string
    refund_reference?: string | null
    expected_at?: string | null
  }
}

export class PaystackInitializationException extends BadGatewayException {
  constructor(readonly definitive: boolean) {
    super('The payment provider could not initialize payment.')
  }
}

export class PaystackRefundException extends BadGatewayException {
  constructor(readonly definitive: boolean) {
    super('The payment provider could not initiate the refund.')
  }
}

@Injectable()
export class PaystackClient {
  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return this.config.get<boolean>('PAYSTACK_ENABLED') === true
  }

  secret() {
    return this.config.get<string>('PAYSTACK_SECRET_KEY') ?? ''
  }

  supportsCurrency(currency: string) {
    return (this.config.get<string>('PAYSTACK_ALLOWED_CURRENCIES') ?? 'NGN')
      .split(',')
      .includes(currency.toUpperCase())
  }

  async initialize(input: InitializeInput) {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Online payments are not configured.')
    }
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        callback_url: this.config.getOrThrow<string>('PAYSTACK_CALLBACK_URL'),
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {
      throw new PaystackInitializationException(false)
    })
    const result = await response.json().catch(() => null) as InitializeResponse | null
    if (
      !response.ok || !result?.status || !result.data?.authorization_url ||
      result.data.reference !== input.reference
    ) {
      // A 4xx response definitively rejected this request. Timeouts, malformed
      // responses, and provider 5xx responses may still have created a session.
      throw new PaystackInitializationException(response.status >= 400 && response.status < 500)
    }
    const authorizationUrl = new URL(result.data.authorization_url)
    if (
      authorizationUrl.protocol !== 'https:' ||
      !(authorizationUrl.hostname === 'paystack.com' || authorizationUrl.hostname.endsWith('.paystack.com'))
    ) {
      throw new PaystackInitializationException(false)
    }
    return {
      authorizationUrl: authorizationUrl.toString(),
      accessCode: result.data.access_code ?? null,
      reference: input.reference,
    }
  }

  async verify(reference: string) {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Online payments are not configured.')
    }
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${this.secret()}` },
        signal: AbortSignal.timeout(10_000),
      },
    ).catch(() => {
      throw new BadGatewayException('Payment verification is temporarily unavailable.')
    })
    const result = await response.json().catch(() => null) as VerifyResponse | null
    if (
      !response.ok || !result?.status || !result.data?.status ||
      result.data.reference !== reference || typeof result.data.amount !== 'number' ||
      typeof result.data.currency !== 'string'
    ) {
      throw new BadGatewayException('Payment verification returned an invalid response.')
    }
    return {
      status: result.data.status.toLowerCase(),
      reference,
      amount: result.data.amount,
      currency: result.data.currency.toUpperCase(),
    }
  }

  async createRefund(input: {
    transaction: string
    amount: number
    currency: string
    merchantNote: string
  }) {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Online payments are not configured.')
    }
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: input.transaction,
        amount: input.amount,
        currency: input.currency,
        merchant_note: input.merchantNote,
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {
      throw new PaystackRefundException(false)
    })
    const result = await response.json().catch(() => null) as RefundResponse | null
    const status = result?.data?.status?.toLowerCase()
    if (
      !response.ok || !result?.status || result.data?.id === undefined ||
      result.data.amount !== input.amount ||
      result.data.currency?.toUpperCase() !== input.currency.toUpperCase() ||
      !status || !['pending', 'processing'].includes(status)
    ) {
      throw new PaystackRefundException(response.status >= 400 && response.status < 500)
    }
    const expectedAt = result.data.expected_at ? new Date(result.data.expected_at) : null
    if (expectedAt && Number.isNaN(expectedAt.getTime())) {
      throw new PaystackRefundException(false)
    }
    return {
      providerRefundId: String(result.data.id),
      providerRefundReference: result.data.refund_reference ?? null,
      status,
      amount: result.data.amount,
      currency: result.data.currency.toUpperCase(),
      expectedAt,
    }
  }
}
