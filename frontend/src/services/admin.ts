import { apiRequest, csrfHeaders, downloadApiFile, jsonBody } from './api'

export type AdminDashboard = {
  customers: { total: number; active: number }
  products: { total: number; published: number; lowStock: number }
  orders: { total: number; awaitingFulfillment: number }
  revenue: { amount: string; currency: string }
  recentOrders: AdminRecentOrder[]
}

export type AdminNotifications = {
  total: number
  counts: { returns: number; refunds: number; emailFailures: number; lowStock: number }
  items: Array<{
    id: string
    type: 'RETURN_REQUEST' | 'REFUND_ATTENTION' | 'EMAIL_FAILURE' | 'LOW_STOCK'
    severity: 'ACTION' | 'WARNING' | 'CRITICAL'
    title: string
    detail: string
    href: string
    createdAt: string
  }>
}

export type AdminAuditCategory = 'SECURITY' | 'ORDERS' | 'REFUNDS' | 'RETURNS' | 'INVENTORY' | 'NOTIFICATIONS'

export type AdminAuditEvent = {
  id: string
  action: string
  result: string
  reason: string | null
  resourceType: string
  resourceId: string | null
  actorRole: string | null
  actorUser: { email: string; firstName: string | null; lastName: string | null } | null
  createdAt: string
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

export type AdminRevenueAnalytics = {
  range: { days: 7 | 30 | 90; from: string; to: string; timezone: string }
  revenue: {
    amount: string
    previousAmount: string
    changePercent: number | null
    currency: string
  }
  orders: { total: number; previousTotal: number }
  series: Array<{ date: string; amount: string; orderCount: number }>
}

export type AdminProduct = {
  id: string
  slug: string
  sku: string
  name: string
  description: string
  category: string
  color: string
  sizes: string[]
  price: string
  compareAtPrice: string | null
  currency: string
  status: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  inventory: { onHand: number; reserved: number; version: number } | null
  images: { url: string; altText: string; position: number }[]
  available: number
}

export type AdminProductInput = {
  slug: string
  sku: string
  name: string
  description: string
  category: string
  color: string
  sizes: string[]
  price: number
  compareAtPrice: number | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  images: Array<{ url: string; altText: string }>
  onHand: number
  reason: string
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

export type AdminReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'COMPLETED'

export type AdminReturn = {
  id: string
  status: AdminReturnStatus
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
    orderItem: {
      productName: string
      sku: string
      size: string
      productId: string | null
    }
  }>
}

export type AdminOrderDetail = AdminOrder & {
  shippingPhone: string
  shippingAddress: {
    line1: string
    line2: string | null
    city: string
    region: string
    postalCode: string | null
    country: string
  }
  subtotal: string
  discountTotal: string
  shippingTotal: string
  taxTotal: string
  cancelledAt: string | null
  updatedAt: string
  refundableAmount: string
  refunds: Array<{
    id: string
    status: 'REQUESTING' | 'PENDING' | 'PROCESSING' | 'NEEDS_ATTENTION' | 'PROCESSED' | 'FAILED'
    amount: string
    currency: string
    reason: string
    expectedAt: string | null
    processedAt: string | null
    failedAt: string | null
    failureReason: string | null
    createdAt: string
  }>
  returns: AdminReturn[]
  items: Array<{
    id: string
    productId: string | null
    productName: string
    sku: string
    imageUrl: string | null
    size: string
    quantity: number
    unitPrice: string
    discountTotal: string
    lineTotal: string
    returnableQuantity: number
  }>
}

export type AdminCoupon = {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: string
  minimumSubtotal: string | null
  maximumDiscount: string | null
  usageLimit: number | null
  usageCount: number
  startsAt: string | null
  expiresAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type AdminCouponInput = {
  code: string
  type: AdminCoupon['type']
  value: number
  minimumSubtotal?: number
  maximumDiscount?: number
  usageLimit?: number
  startsAt?: string
  expiresAt?: string
  active: boolean
  reason: string
}

export type AdminStoreProfile = {
  storeName: string
  tagline: string
  supportEmail: string
  supportPhone: string
  addressLine: string
  city: string
  countryCode: string
  defaultCurrency: string
}

export type AdminShippingSettings = {
  shippingEnabled: boolean
  shippingFee: string
  freeShippingThreshold: string
  deliveryMinDays: number
  deliveryMaxDays: number
}

export type AdminTaxSettings = {
  taxEnabled: boolean
  taxRate: string
  taxLabel: string
  pricesIncludeTax: boolean
}

export type AdminNotificationSettings = {
  notificationEmail: string
  orderPaidAlerts: boolean
  lowStockAlerts: boolean
  lowStockThreshold: number
}

export type AdminSettings = {
  storeProfile: AdminStoreProfile
  shipping: AdminShippingSettings
  tax: AdminTaxSettings
  notifications: AdminNotificationSettings
}

export type AdminSecurity = {
  sessions: Array<{
    id: string
    userAgent: string | null
    createdAt: string
    lastSeenAt: string
    expiresAt: string
    revokedAt: string | null
    current: boolean
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  }>
  activity: Array<{
    id: string
    action: string
    result: string
    reason: string | null
    createdAt: string
  }>
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

export function fetchAdminNotifications() {
  return apiRequest<AdminNotifications>('/admin/notifications')
}

export function dismissAdminNotification(notificationKey: string) {
  return apiRequest<{ notificationKey: string; dismissed: true }>('/admin/notifications/dismiss', {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationKey }),
  })
}

export function retryAdminNotificationEmail(notificationKey: string) {
  return apiRequest<{ notificationKey: string; retried: true }>('/admin/notifications/email-retry', {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationKey }),
  })
}

export function fetchAdminAuditLog(input: {
  page?: number
  limit?: number
  category?: AdminAuditCategory
  result?: string
  search?: string
}) {
  const query = new URLSearchParams()
  query.set('page', String(input.page ?? 1))
  query.set('limit', String(input.limit ?? 20))
  if (input.category) query.set('category', input.category)
  if (input.result) query.set('result', input.result)
  if (input.search) query.set('search', input.search)
  return apiRequest<Page<AdminAuditEvent>>(`/admin/audit-log?${query.toString()}`)
}

export function downloadAdminAuditLog(input: {
  category?: AdminAuditCategory
  result?: string
  search?: string
}) {
  const query = new URLSearchParams()
  if (input.category) query.set('category', input.category)
  if (input.result) query.set('result', input.result)
  if (input.search) query.set('search', input.search)
  const suffix = query.size ? `?${query.toString()}` : ''
  return downloadApiFile(`/admin/audit-log/export${suffix}`, `lumi-audit-log-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function downloadAdminReport(type: 'ORDERS' | 'INVENTORY' | 'RETURNS' | 'REFUNDS', days: 7 | 30 | 90 | 365) {
  return downloadApiFile(
    `/admin/reports/export?type=${type}&days=${days}`,
    `lumi-${type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}

export function fetchAdminRevenueAnalytics(days: 7 | 30 | 90 = 30) {
  return apiRequest<AdminRevenueAnalytics>(`/admin/analytics/revenue?days=${days}`)
}

export function fetchAdminProducts() {
  return apiRequest<Page<AdminProduct>>('/admin/products?limit=50')
}

export function createAdminProduct(input: AdminProductInput) {
  return apiRequest<AdminProduct>('/admin/products', {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateAdminProduct(productId: string, input: AdminProductInput) {
  return apiRequest<AdminProduct>(`/admin/products/${productId}`, {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function deleteAdminProduct(productId: string, reason: string) {
  return apiRequest<{ id: string; deleted: true }>(`/admin/products/${productId}`, {
    method: 'DELETE',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function fetchAdminCustomers() {
  return apiRequest<Page<AdminCustomer>>('/admin/customers?limit=50')
}

export function fetchAdminOrders() {
  return apiRequest<Page<AdminOrder>>('/admin/orders?limit=50')
}

export function fetchAdminOrder(orderNumber: string) {
  return apiRequest<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(orderNumber)}`)
}

export function createAdminRefund(orderNumber: string, input: { amount?: number; reason: string }) {
  return apiRequest<{
    id: string
    status: string
    amount: string
    currency: string
    expectedAt: string | null
    createdAt: string
  }>(`/admin/orders/${encodeURIComponent(orderNumber)}/refunds`, {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function createAdminReturn(orderNumber: string, input: {
  items: Array<{ orderItemId: string; quantity: number }>
  reason: string
}) {
  return apiRequest<AdminReturn>(`/admin/orders/${encodeURIComponent(orderNumber)}/returns`, {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateAdminReturnStatus(
  returnId: string,
  input: { status: 'APPROVED' | 'REJECTED' | 'RECEIVED'; resolutionNote: string },
) {
  return apiRequest<AdminReturn>(`/admin/returns/${returnId}/status`, {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function completeAdminReturn(returnId: string, input: {
  items: Array<{ returnItemId: string; quantity: number }>
  resolutionNote: string
}) {
  return apiRequest<AdminReturn>(`/admin/returns/${returnId}/complete`, {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function fetchAdminCoupons() {
  return apiRequest<AdminCoupon[]>('/admin/discounts')
}

export function createAdminCoupon(input: AdminCouponInput) {
  return apiRequest<AdminCoupon>('/admin/discounts', {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function setAdminCouponStatus(couponId: string, active: boolean, reason: string) {
  return apiRequest<AdminCoupon>(`/admin/discounts/${couponId}/status`, {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ active, reason }),
  })
}

export function fetchAdminSettings() {
  return apiRequest<AdminSettings>('/admin/settings')
}

export function fetchAdminSecurity() {
  return apiRequest<AdminSecurity>('/admin/settings/security')
}

export function revokeAdminSession(sessionId: string, reason: string) {
  return apiRequest<{ revoked: number }>(`/admin/settings/security/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function revokeOtherAdminSessions(reason: string) {
  return apiRequest<{ revoked: number }>('/admin/settings/security/sessions/revoke-others', {
    method: 'POST',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}

export function updateAdminStoreProfile(input: AdminStoreProfile & { reason: string }) {
  return apiRequest<{ storeProfile: AdminStoreProfile }>('/admin/settings/store-profile', {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateAdminShippingSettings(input: {
  shippingEnabled: boolean
  shippingFee: number
  freeShippingThreshold: number
  deliveryMinDays: number
  deliveryMaxDays: number
  reason: string
}) {
  return apiRequest<{ shipping: AdminShippingSettings }>('/admin/settings/shipping', {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateAdminTaxSettings(input: {
  taxEnabled: boolean
  taxRate: number
  taxLabel: string
  pricesIncludeTax: boolean
  reason: string
}) {
  return apiRequest<{ tax: AdminTaxSettings }>('/admin/settings/tax', {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateAdminNotificationSettings(input: AdminNotificationSettings & { reason: string }) {
  return apiRequest<{ notifications: AdminNotificationSettings }>('/admin/settings/notifications', {
    method: 'PATCH',
    headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
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
