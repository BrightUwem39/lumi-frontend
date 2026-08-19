import { ConfigService } from '@nestjs/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrevoEmailService } from './brevo-email.service.js'

const settings = {
  EMAIL_ENABLED: true,
  BREVO_API_KEY: 'xkeysib-test-secret-value',
  EMAIL_FROM_ADDRESS: 'sender@example.com',
  EMAIL_FROM_NAME: 'Lumi',
  PUBLIC_APP_URL: 'https://shop.example.com',
  VERIFICATION_TTL_MINUTES: 10,
  RESET_TTL_MINUTES: 30,
}

describe('BrevoEmailService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends a six-digit verification code without exposing the API key', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(new ConfigService(settings))

    await service.sendVerification('customer@example.com', '042731')

    expect(request).toHaveBeenCalledOnce()
    const [url, options] = request.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.headers).toMatchObject({ 'api-key': settings.BREVO_API_KEY })
    expect(options.body).toContain('042731')
    expect(options.body).toContain('6-digit verification code')
    expect(options.body).not.toContain(settings.BREVO_API_KEY)
  })

  it('does not contact Brevo when email delivery is disabled', async () => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(
      new ConfigService({ ...settings, EMAIL_ENABLED: false }),
    )

    await service.sendVerification('customer@example.com', 'verification-token')

    expect(request).not.toHaveBeenCalled()
  })

  it('sends an escaped paid-order and low-stock operational alert', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(new ConfigService(settings))

    await service.sendOperationalOrderAlert('admin@example.com', {
      orderNumber: 'LM-123',
      customerName: '<Bright>',
      customerEmail: 'bright@example.com',
      total: '125000.00',
      currency: 'NGN',
      lowStock: [{ name: 'Lumi & Tee', sku: 'TEE-1', available: 2 }],
    })

    const [, options] = request.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(options.body)) as { subject: string; htmlContent: string }
    expect(body.subject).toContain('Paid order LM-123')
    expect(body.htmlContent).toContain('&lt;Bright&gt;')
    expect(body.htmlContent).toContain('Lumi &amp; Tee')
    expect(body.htmlContent).not.toContain('<Bright>')
  })

  it('sends an escaped customer return-status notification', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(new ConfigService(settings))

    await service.sendReturnStatus('customer@example.com', {
      orderNumber: 'LM-123',
      returnId: 'abcdef12-0000-0000-0000-000000000000',
      status: 'APPROVED',
      customerName: '<Bright>',
      reason: 'Wrong <size>',
      resolutionNote: 'Send to Lumi & Co',
      items: [{ name: 'Lumi <Tee>', sku: 'TEE&1', size: 'L', quantity: 1 }],
    })

    const [, options] = request.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(options.body)) as { subject: string; htmlContent: string; textContent: string }
    expect(body.subject).toContain('ABCDEF12 approved')
    expect(body.htmlContent).toContain('&lt;Bright&gt;')
    expect(body.htmlContent).toContain('Lumi &lt;Tee&gt;')
    expect(body.htmlContent).not.toContain('<Bright>')
    expect(body.textContent).toContain('Your return request has been approved.')
  })

  it('renders customer order and refund updates through the transactional sender', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(new ConfigService(settings))

    await service.sendOrderStatus('customer@example.com', {
      orderNumber: 'LM-123', status: 'SHIPPED', customerName: '<Bright>',
      total: '125000.00', currency: 'NGN', note: 'Carrier & tracking',
      items: [{ name: 'Lumi <Tee>', size: 'L', quantity: 1 }],
    })
    await service.sendRefundStatus('customer@example.com', {
      orderNumber: 'LM-123', status: 'PROCESSED', customerName: '<Bright>',
      amount: '25000.00', currency: 'NGN', reason: 'Wrong <size>',
    })

    const orderRequest = request.mock.calls.at(0) as unknown as [string, RequestInit]
    const refundRequest = request.mock.calls.at(1) as unknown as [string, RequestInit]
    const orderBody = JSON.parse(String(orderRequest[1].body)) as { subject: string; htmlContent: string }
    const refundBody = JSON.parse(String(refundRequest[1].body)) as { subject: string; htmlContent: string }
    expect(orderBody.subject).toContain('Order shipped LM-123')
    expect(orderBody.htmlContent).toContain('Lumi &lt;Tee&gt;')
    expect(refundBody.subject).toContain('Refund completed LM-123')
    expect(refundBody.htmlContent).toContain('Wrong &lt;size&gt;')
  })

  it('returns a generic service error when Brevo rejects delivery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    const service = new BrevoEmailService(new ConfigService(settings))

    await expect(
      service.sendPasswordReset('customer@example.com', 'reset-token'),
    ).rejects.toThrow('Email delivery is temporarily unavailable.')
  })
})
