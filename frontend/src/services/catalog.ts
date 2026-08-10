import type { ShopProduct } from '../types/product'

type ApiProduct = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  color: string
  sizes: string[]
  price: string
  compareAtPrice: string | null
  currency: string
  available: boolean
  images: Array<{ url: string; altText: string; position: number }>
}

type ApiCatalogResponse = {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export async function fetchFashionProducts(signal?: AbortSignal) {
  const response = await fetch('/api/v1/products?limit=50&sort=newest', {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
  const data = (await response.json()) as ApiCatalogResponse
  return data.items.map(normalizeProduct)
}

function normalizeProduct(product: ApiProduct): ShopProduct {
  const [primaryImage, ...galleryImages] = product.images

  return {
    // Slugs keep product routes stable across database resets and offline fallback.
    id: product.slug,
    name: product.name,
    category: product.category,
    image: primaryImage?.url ?? '',
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    originalPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : undefined,
    rating: 0,
    reviewCount: 0,
    available: product.available,
    sizes: product.sizes,
    color: product.color,
    brand: 'Lumi',
    gallery: galleryImages.map((image) => image.url),
    source: 'api',
  }
}
