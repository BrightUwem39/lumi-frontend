import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

type TransactionalEmail = {
  recipient: string
  subject: string
  text: string
  html: string
}

export type OperationalOrderAlert = {
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  total?: string
  currency?: string
  lowStock: Array<{ name: string; sku: string; available: number }>
}

export type ReturnStatusEmail = {
  orderNumber: string
  returnId: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'COMPLETED'
  customerName: string
  reason: string
  resolutionNote: string | null
  items: Array<{ name: string; sku: string; size: string; quantity: number }>
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

  async sendOperationalOrderAlert(recipient: string, alert: OperationalOrderAlert) {
    if (!this.isEnabled()) return

    const orderLines = alert.orderNumber ? [
      `Paid order: ${alert.orderNumber}`,
      `Customer: ${alert.customerName} (${alert.customerEmail})`,
      `Total: ${alert.currency} ${alert.total}`,
    ] : []
    const stockLines = alert.lowStock.map(
      (product) => `${product.name} (${product.sku}): ${product.available} available`,
    )
    const sections = [
      ...orderLines,
      ...(stockLines.length ? ['', 'Low-stock products:', ...stockLines] : []),
    ]
    const orderHtml = alert.orderNumber ? `
      <h1>New paid Lumi order</h1>
      <p><strong>Order:</strong> ${escapeHtml(alert.orderNumber)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(alert.customerName ?? '')} (${escapeHtml(alert.customerEmail ?? '')})</p>
      <p><strong>Total:</strong> ${escapeHtml(alert.currency ?? '')} ${escapeHtml(alert.total ?? '')}</p>
    ` : ''
    const stockHtml = alert.lowStock.length ? `
      <h2>Low-stock products</h2>
      <ul>${alert.lowStock.map((product) => `<li>${escapeHtml(product.name)} (${escapeHtml(product.sku)}): ${product.available} available</li>`).join('')}</ul>
    ` : ''
    await this.send({
      recipient,
      subject: alert.orderNumber ? `Paid order ${alert.orderNumber} · Lumi` : 'Lumi low-stock alert',
      text: sections.join('\n'),
      html: `${orderHtml}${stockHtml}`,
    })
  }

  async sendReturnStatus(recipient: string, alert: ReturnStatusEmail) {
    if (!this.isEnabled()) return

    const profileUrl = `${this.config.getOrThrow<string>('PUBLIC_APP_URL')}/profile`
    const reference = alert.returnId.slice(0, 8).toUpperCase()
    const statusLabel = alert.status.toLowerCase().replaceAll('_', ' ')
    const statusMessage = returnStatusMessage(alert.status)
    const itemLines = alert.items.map(
      (item) => `${item.name} (${item.sku}, size ${item.size}) × ${item.quantity}`,
    )
    await this.send({
      recipient,
      subject: `Return ${reference} ${statusLabel} · Lumi`,
      text: [
        `Hello ${alert.customerName},`,
        '',
        statusMessage,
        `Order: ${alert.orderNumber}`,
        `Return: ${reference}`,
        '',
        'Items:',
        ...itemLines,
        '',
        `Reason: ${alert.reason}`,
        ...(alert.resolutionNote ? [`Lumi note: ${alert.resolutionNote}`] : []),
        '',
        `View your order history: ${profileUrl}`,
      ].join('\n'),
      html: `
        <h1>Return ${escapeHtml(reference)} ${escapeHtml(statusLabel)}</h1>
        <p>Hello ${escapeHtml(alert.customerName)},</p>
        <p>${escapeHtml(statusMessage)}</p>
        <p><strong>Order:</strong> ${escapeHtml(alert.orderNumber)}<br><strong>Return:</strong> ${escapeHtml(reference)}</p>
        <ul>${alert.items.map((item) => `<li>${escapeHtml(item.name)} (${escapeHtml(item.sku)}, size ${escapeHtml(item.size)}) &times; ${item.quantity}</li>`).join('')}</ul>
        <p><strong>Reason:</strong> ${escapeHtml(alert.reason)}</p>
        ${alert.resolutionNote ? `<p><strong>Lumi note:</strong> ${escapeHtml(alert.resolutionNote)}</p>` : ''}
        <p><a href="${profileUrl}">View your Lumi order history</a></p>
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]!)
}

function returnStatusMessage(status: ReturnStatusEmail['status']) {
  if (status === 'REQUESTED') return 'We received your return request and will review it shortly.'
  if (status === 'APPROVED') return 'Your return request has been approved.'
  if (status === 'REJECTED') return 'Your return request was not approved.'
  if (status === 'RECEIVED') return 'Your returned parcel has arrived and is being inspected.'
  return 'Your return has been inspected and completed.'
}
