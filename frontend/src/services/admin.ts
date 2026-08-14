import { apiRequest, csrfHeaders, jsonBody } from './api'

export type AdminDashboard = {
  customers: { total: number; active: number }
  products: { total: number; published: number; lowStock: number }
  orders: { total: number; awaitingFulfillment: number }
  revenue: { amount: string; currency: string }
  recentOrders: AdminRecentOrder[]
}

export type AdminRecentOrder = {
  number: string
  email: string
  shippingName: string
  status: string
  total: string
  currency: string
  createdAt: string
}

export type AdminProduct = {
  id: string
  slug: string
  sku: string
  name: string
  category: string
  price: string
  currency: string
  status: string
  updatedAt: string
  inventory: { onHand: number; reserved: number; version: number } | null
  images: { url: string; altText: string }[]
  available: number
}

export type AdminCustomer = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  orderCount: number
}

export type AdminOrder = AdminRecentOrder & {
  paidAt: string | null
  lineCount: number
}

type Page<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function fetchAdminDashboard() {
  return apiRequest<AdminDashboard>('/admin/dashboard')
}

export function fetchAdminProducts() {
  return apiRequest<Page<AdminProduct>>('/admin/products?limit=50')
}

export function fetchAdminCustomers() {
  return apiRequest<Page<AdminCustomer>>('/admin/customers?limit=50')
}

export function fetchAdminOrders() {
  return apiRequest<Page<AdminOrder>>('/admin/orders?limit=50')
}

export function setAdminInventory(productId: string, onHand: number, reason: string) {
  return apiRequest(`/admin/products/${productId}/inventory`, {
    method: 'PATCH',
    headers: { ...csrfHeaders(), ...jsonBody({}).headers },
    body: JSON.stringify({ onHand, reason }),
  })
}

export function setAdminOrderStatus(orderNumber: string, status: string, reason: string) {
  return apiRequest<{ number: string; status: string }>(
    `/admin/orders/${orderNumber}/status`,
    {
      method: 'PATCH',
      headers: { ...csrfHeaders(), ...jsonBody({}).headers },
      body: JSON.stringify({ status, reason }),
    },
  )
}
