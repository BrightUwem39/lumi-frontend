import { apiRequest } from './api'
import { cartCsrfHeaders } from './cart'

export type PaymentAvailability = { provider: 'PAYSTACK'; enabled: boolean }

export type PaymentSession = {
  provider: 'PAYSTACK'
  reference: string
  authorizationUrl: string
  expiresAt: string
}

export type PaymentStatus = {
  provider: 'PAYSTACK'
  reference: string
  paymentStatus: string
  orderNumber: string
  orderStatus: string
}

export function fetchPaymentAvailability() {
  return apiRequest<PaymentAvailability>('/payments/paystack/availability')
}

export function initializePayment(orderNumber: string) {
  return apiRequest<PaymentSession>(
    `/payments/paystack/initialize/${encodeURIComponent(orderNumber)}`,
    { method: 'POST', headers: cartCsrfHeaders() },
  )
}

export function fetchPaymentStatus(reference: string) {
  return apiRequest<PaymentStatus>(
    `/payments/paystack/status/${encodeURIComponent(reference)}`,
  )
}
