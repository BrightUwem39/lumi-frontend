import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

type TransactionalEmail = {
  recipient: string
  subject: string
  text: string
  html: string
}

@Injectable()
export class BrevoEmailService {
  constructor(private readonly config: ConfigService) {}

  isEnabled() {
    return this.config.get<boolean>('EMAIL_ENABLED') === true
  }

  async sendVerification(recipient: string, token: string) {
    if (!this.isEnabled()) return

    const profileUrl = `${this.config.getOrThrow<string>('PUBLIC_APP_URL')}/profile`
    const expiresInMinutes = this.config.getOrThrow<number>('VERIFICATION_TTL_MINUTES')
    await this.send({
      recipient,
      subject: 'Verify your Lumi account',
      text: [
        'Welcome to Lumi.',
        '',
        'Enter this single-use 6-digit verification code on the Lumi profile page:',
        token,
        '',
        `Profile: ${profileUrl}`,
        `This token expires in ${expiresInMinutes} minutes.`,
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),
      html: `
        <h1>Verify your Lumi account</h1>
        <p>Enter this single-use 6-digit verification code on the Lumi profile page:</p>
        <p><code style="font-size:24px;letter-spacing:6px;font-weight:700">${token}</code></p>
        <p><a href="${profileUrl}">Open your Lumi profile</a></p>
        <p>This token expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      `,
    })
  }

  async sendPasswordReset(recipient: string, token: string) {
    if (!this.isEnabled()) return

    const profileUrl = `${this.config.getOrThrow<string>('PUBLIC_APP_URL')}/profile`
    const expiresInMinutes = this.config.getOrThrow<number>('RESET_TTL_MINUTES')
    await this.send({
      recipient,
      subject: 'Reset your Lumi password',
      text: [
        'A password reset was requested for your Lumi account.',
        '',
        'Paste this single-use reset token on the Lumi profile page:',
        token,
        '',
        `Profile: ${profileUrl}`,
        `This token expires in ${expiresInMinutes} minutes.`,
        'If you did not request this reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <h1>Reset your Lumi password</h1>
        <p>Paste this single-use reset token on the Lumi profile page:</p>
        <p><code style="font-size:16px;word-break:break-all">${token}</code></p>
        <p><a href="${profileUrl}">Open your Lumi profile</a></p>
        <p>This token expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      `,
    })
  }

  private async send(email: TransactionalEmail) {
    let response: Response
    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.config.getOrThrow<string>('BREVO_API_KEY'),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: this.config.getOrThrow<string>('EMAIL_FROM_NAME'),
            email: this.config.getOrThrow<string>('EMAIL_FROM_ADDRESS'),
          },
          to: [{ email: email.recipient }],
          subject: email.subject,
          textContent: email.text,
          htmlContent: email.html,
        }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw new ServiceUnavailableException('Email delivery is temporarily unavailable.')
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Email delivery is temporarily unavailable.')
    }
  }
}
