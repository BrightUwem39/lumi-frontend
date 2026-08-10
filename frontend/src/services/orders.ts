import { apiRequest } from './api'
import { cartCsrfHeaders } from './cart'
import type { OrderDraft } from './checkout'

export function fetchOrder(orderNumber: string) {
  return apiRequest<OrderDraft>(`/orders/${encodeURIComponent(orderNumber)}`)
}

export type OrderSummary = {
  number: string
  status: string
  currency: string
  total: string
  createdAt: string
  lineCount: number
}

export function fetchOrders() {
  return apiRequest<{ items: OrderSummary[] }>('/orders')
}

export function cancelOrder(orderNumber: string) {
  return apiRequest<OrderDraft>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: 'POST', headers: cartCsrfHeaders(),
  })
}
