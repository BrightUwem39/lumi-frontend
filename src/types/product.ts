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
