import { apiRequest, csrfHeaders, jsonBody } from './api'

type WishlistResponse = { items: Array<{ slug: string }> }

export async function fetchWishlist() {
  const response = await apiRequest<WishlistResponse>('/wishlist')
  return response.items.map((product) => product.slug)
}

export function saveWishlistProduct(productSlug: string) {
  return apiRequest<{ productSlug: string }>('/wishlist', {
    method: 'POST',
    body: jsonBody({ productSlug }).body,
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
  })
}

export function removeWishlistProduct(productSlug: string) {
  return apiRequest<void>(`/wishlist/${encodeURIComponent(productSlug)}`, {
    method: 'DELETE',
    headers: csrfHeaders(),
  })
}
