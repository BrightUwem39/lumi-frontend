// Shared product data contract used by cards, quick view, cart, and future pages.
export type Product = {
  id: string
  name: string
  category: string
  image: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  badge?: string
}

// Shop-specific fields shared by API products and the curated local fallback.
export type ShopProduct = Product & {
  available: boolean
  sizes: string[]
  color: string
  brand: string
  description?: string
  gallery?: string[]
  source?: 'curated' | 'dummyjson'
}
