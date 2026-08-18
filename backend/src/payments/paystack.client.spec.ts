import { ConfigService } from '@nestjs/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaystackClient, PaystackRefundException } from './paystack.client.js'

const settings = {
  PAYSTACK_ENABLED: true,
  PAYSTACK_SECRET_KEY: 'sk_test_secret',
  PAYSTACK_ALLOWED_CURRENCIES: 'NGN',
  PAYSTACK_CALLBACK_URL: 'https://shop.example.com/payment/return',
}

describe('PaystackClient refunds', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends refund amounts in subunits and validates the queued response', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: true,
      data: { id: 3018284, amount: 5000000, currency: 'NGN', status: 'pending', expected_at: null },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', request)
    const client = new PaystackClient(new ConfigService(settings))

    await expect(client.createRefund({
      transaction: 'LM-payment', amount: 5000000, currency: 'NGN', merchantNote: 'Approved return',
    })).resolves.toMatchObject({ providerRefundId: '3018284', status: 'pending', amount: 5000000 })

    const [url, options] = request.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.paystack.co/refund')
    expect(options.headers).toMatchObject({ Authorization: 'Bearer sk_test_secret' })
    expect(JSON.parse(String(options.body))).toEqual({
      transaction: 'LM-payment', amount: 5000000, currency: 'NGN', merchant_note: 'Approved return',
    })
  })

  it('marks a provider validation rejection as definitive', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: false, message: 'Insufficient balance',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })))
    const client = new PaystackClient(new ConfigService(settings))

    const result = client.createRefund({
      transaction: 'LM-payment', amount: 5000000, currency: 'NGN', merchantNote: 'Approved return',
    })
    await expect(result).rejects.toBeInstanceOf(PaystackRefundException)
    await expect(result).rejects.toMatchObject({ definitive: true })
  })
})
