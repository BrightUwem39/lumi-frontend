import type { ShopProduct } from '../types/product'

const categoryMap: Record<string, ShopProduct['category']> = {
  'mens-shirts': 'Men',
  'mens-shoes': 'Shoes',
  'mens-watches': 'Accessories',
  sunglasses: 'Accessories',
  tops: 'Women',
  'womens-bags': 'Accessories',
  'womens-dresses': 'Women',
  'womens-jewellery': 'Accessories',
  'womens-shoes': 'Shoes',
  'womens-watches': 'Accessories',
}

type DummyProduct = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  thumbnail: string
  images: string[]
  reviews?: Array<{ rating: number }>
}

type DummyProductsResponse = { products: DummyProduct[] }

// DummyJSON is normalized once so the rest of the app stays API-agnostic.
export async function fetchFashionProducts(signal?: AbortSignal) {
  const fields = [
    'id', 'title', 'description', 'category', 'price', 'discountPercentage',
    'rating', 'stock', 'thumbnail', 'images', 'reviews',
  ].join(',')
  const response = await fetch(
    `https://dummyjson.com/products?limit=0&select=${fields}`,
    { signal },
  )

  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
  const data = (await response.json()) as DummyProductsResponse

  return data.products
    .filter((product) => Boolean(categoryMap[product.category]))
    .map(normalizeProduct)
}

function normalizeProduct(product: DummyProduct): ShopProduct {
  const category = categoryMap[product.category]
  const hasDiscount = product.discountPercentage >= 5
  const originalPrice = hasDiscount
    ? Number((product.price / (1 - product.discountPercentage / 100)).toFixed(2))
    : undefined
  const palette = ['Black', 'White', 'Brown', 'Grey']
  const isShoe = product.category.includes('shoes')

  return {
    id: `dj-${product.id}`,
    name: product.title,
    category,
    image: product.thumbnail || product.images[0],
    gallery: product.images,
    description: product.description,
    price: product.price,
    originalPrice,
    rating: product.rating,
    reviewCount: product.reviews?.length ?? 0,
    badge: product.stock < 10 ? 'Limited' : hasDiscount ? 'Sale' : undefined,
    available: product.stock > 0,
    sizes: isShoe ? ['38', '39', '40', '41'] : category === 'Accessories' ? ['One size'] : ['XS', 'S', 'M', 'L', 'XL'],
    color: palette[product.id % palette.length],
    // DummyJSON supplies the inventory; LUMI remains the customer-facing brand.
    brand: 'Lumi',
    source: 'dummyjson',
  }
}
