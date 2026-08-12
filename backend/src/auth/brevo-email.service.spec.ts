import { ConfigService } from '@nestjs/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrevoEmailService } from './brevo-email.service.js'

const settings = {
  EMAIL_ENABLED: true,
  BREVO_API_KEY: 'xkeysib-test-secret-value',
  EMAIL_FROM_ADDRESS: 'sender@example.com',
  EMAIL_FROM_NAME: 'Lumi',
  PUBLIC_APP_URL: 'https://shop.example.com',
  VERIFICATION_TTL_MINUTES: 1440,
  RESET_TTL_MINUTES: 30,
}

describe('BrevoEmailService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends a verification token without exposing the API key in the body', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const service = new BrevoEmailService(new ConfigService(settings))

    await service.sendVerification('customer@example.com', 'verification-token')

    expect(request).toHaveBeenCalledOnce()
    const [url, options] = request.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.headers).toMatchObject({ 'api-key': settings.BREVO_API_KEY })
    expect(options.body).toContain('verification-token')
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

  it('returns a generic service error when Brevo rejects delivery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    const service = new BrevoEmailService(new ConfigService(settings))

    await expect(
      service.sendPasswordReset('customer@example.com', 'reset-token'),
    ).rejects.toThrow('Email delivery is temporarily unavailable.')
  })
})
