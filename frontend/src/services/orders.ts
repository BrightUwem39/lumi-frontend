import { apiRequest, csrfHeaders } from './api'
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

export type CustomerReturn = {
  id: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'COMPLETED'
  reason: string
  resolutionNote: string | null
  approvedAt: string | null
  rejectedAt: string | null
  receivedAt: string | null
  completedAt: string | null
  createdAt: string
  items: Array<{
    id: string
    orderItemId: string
    quantity: number
    restockedQuantity: number
    orderItem: { productName: string; sku: string; size: string }
  }>
}

export type CustomerReturnOrder = {
  number: string
  status: string
  returnEligible: boolean
  items: Array<{
    id: string
    productName: string
    sku: string
    size: string
    imageUrl: string | null
    quantity: number
    returnableQuantity: number
  }>
  returns: CustomerReturn[]
}

export function fetchOrderReturns(orderNumber: string) {
  return apiRequest<CustomerReturnOrder>(`/orders/${encodeURIComponent(orderNumber)}/returns`)
}

export function requestOrderReturn(orderNumber: string, input: {
  items: Array<{ orderItemId: string; quantity: number }>
  reason: string
}) {
  return apiRequest<CustomerReturn>(`/orders/${encodeURIComponent(orderNumber)}/returns`, {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
