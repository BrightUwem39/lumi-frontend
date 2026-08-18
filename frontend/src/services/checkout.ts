import { apiRequest, jsonBody } from './api'
import { cartCsrfHeaders } from './cart'

export type OrderDraft = {
  number: string
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' |
    'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  email: string
  shippingName: string
  shippingAddress: {
    line1: string
    line2: string | null
    city: string
    region: string
    postalCode: string | null
    country: string
  }
  currency: string
  subtotal: string
  discountTotal: string
  couponCode: string | null
  taxTotal: string
  shippingTotal: string
  total: string
  createdAt: string
  payable: boolean
  items: Array<{
    name: string
    image: string | null
    size: string
    quantity: number
    unitPrice: string
    lineTotal: string
  }>
}

export function createOrderDraft(
  input: {
    email: string
    firstName: string
    lastName: string
    phone: string
    line1: string
    line2?: string
    city: string
    region: string
    postalCode?: string
    country: string
    couponCode?: string
  },
  idempotencyKey: string,
) {
  return apiRequest<OrderDraft>('/checkout/orders', {
    method: 'POST',
    ...jsonBody(input),
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...cartCsrfHeaders(),
    },
  })
}

export type CouponValidation = {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: string
  currency: string
  subtotal: string
  discountTotal: string
  taxTotal: string
  taxLabel: string
  pricesIncludeTax: boolean
  shippingTotal: string
  total: string
}

export type TaxTerms = {
  currency: string
  enabled: boolean
  rate: number
  label: string
  pricesIncludeTax: boolean
}

export function fetchTaxTerms(currency = 'NGN') {
  return apiRequest<TaxTerms>(`/checkout/tax-terms?currency=${encodeURIComponent(currency)}`)
}

export type ShippingTerms = {
  currency: string
  enabled: boolean
  price: number
  freeThreshold: number
  deliveryMinDays: number
  deliveryMaxDays: number
}

export function fetchShippingTerms(currency = 'NGN') {
  return apiRequest<ShippingTerms>(`/checkout/shipping-terms?currency=${encodeURIComponent(currency)}`)
}

export function validateCoupon(couponCode: string) {
  return apiRequest<CouponValidation>('/checkout/coupons/validate', {
    method: 'POST',
    ...jsonBody({ couponCode }),
    headers: {
      'Content-Type': 'application/json',
      ...cartCsrfHeaders(),
    },
  })
}
