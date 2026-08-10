import { useEffect, useState } from 'react'
import { curatedProducts } from '../data/curatedProducts'
import { fetchFashionProducts } from '../services/catalog'
import type { ShopProduct } from '../types/product'

type CatalogStatus = 'loading' | 'ready' | 'fallback'
type CatalogSnapshot = { products: ShopProduct[]; status: CatalogStatus }

let snapshot: CatalogSnapshot = { products: curatedProducts, status: 'loading' }
let catalogRequest: Promise<CatalogSnapshot> | null = null
const listeners = new Set<(value: CatalogSnapshot) => void>()

function publish(value: CatalogSnapshot) {
  snapshot = value
  listeners.forEach((listener) => listener(value))
}

function loadCatalog() {
  if (!catalogRequest) {
    catalogRequest = fetchFashionProducts()
      .then((apiProducts) => {
        const products = apiProducts.map((product) => {
          const editorial = curatedProducts.find((item) => item.id === product.id)
          return editorial
            ? {
                ...editorial,
                ...product,
                rating: editorial.rating,
                reviewCount: editorial.reviewCount,
                badge: editorial.badge,
              }
            : product
        })
        const value = {
          products,
          status: 'ready' as const,
        }
        publish(value)
        return value
      })
      .catch(() => {
        const value = { products: curatedProducts, status: 'fallback' as const }
        publish(value)
        return value
      })
  }
  return catalogRequest
}

// All commerce pages subscribe to the same in-memory catalog request and fallback.
export function useCatalog() {
  const [catalog, setCatalog] = useState(snapshot)

  useEffect(() => {
    listeners.add(setCatalog)
    void loadCatalog()
    return () => {
      listeners.delete(setCatalog)
    }
  }, [])

  return catalog
}
