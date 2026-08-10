import { apiRequest, jsonBody } from './api'

type CartResponse = {
  items: Array<{
    quantity: number
    size: string
    product: { slug: string }
  }>
  itemCount: number
  subtotal: string
  currency: string | null
}

let mutationsReady = false

export function setCartMutationsReady(ready: boolean) {
  mutationsReady = ready
}

export function cartMutationsReady() {
  return mutationsReady
}

export async function fetchCart() {
  const response = await apiRequest<CartResponse>('/cart')
  return {
    items: Object.fromEntries(
      response.items.map((item) => [item.product.slug, item.quantity]),
    ),
    sizes: Object.fromEntries(
      response.items.map((item) => [item.product.slug, item.size]),
    ),
  }
}

export function setCartProduct(productSlug: string, quantity: number, size?: string) {
  return apiRequest<CartResponse>(`/cart/items/${encodeURIComponent(productSlug)}`, {
    method: 'PUT',
    ...jsonBody({ quantity, ...(size ? { size } : {}) }),
    headers: {
      'Content-Type': 'application/json',
      ...cartCsrfHeaders(),
    },
  })
}

export function removeCartProduct(productSlug: string) {
  return apiRequest<void>(`/cart/items/${encodeURIComponent(productSlug)}`, {
    method: 'DELETE',
    headers: cartCsrfHeaders(),
  })
}

export function clearServerCart() {
  return apiRequest<void>('/cart', {
    method: 'DELETE',
    headers: cartCsrfHeaders(),
  })
}

export function cartCsrfHeaders(): Record<string, string> {
  const token = document.cookie
    .split('; ')
    .find((entry) =>
      entry.startsWith('lumi_cart_csrf=') ||
      entry.startsWith('__Host-lumi_cart_csrf='),
    )
    ?.split('=')
    .slice(1)
    .join('=')

  return token ? { 'X-Cart-CSRF-Token': decodeURIComponent(token) } : {}
}
