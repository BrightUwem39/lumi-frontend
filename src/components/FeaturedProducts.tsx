import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import { ProductCard } from './ProductCard'
import type { Product } from '../types/product'

type ProductFilter = 'all' | 'trending' | 'popular' | 'latest'

type FeaturedProduct = Product & {
  filters: ProductFilter[]
}

const tabs: { label: string; value: ProductFilter }[] = [
  { label: 'All products', value: 'all' },
  { label: 'Trending', value: 'trending' },
  { label: 'Popular', value: 'popular' },
  { label: 'Latest', value: 'latest' },
]

// Filter metadata controls the tabs without leaking presentation into ProductCard.
const products: FeaturedProduct[] = [
  {
    id: 'solstice-wool-coat',
    name: 'Solstice Wool Coat',
    category: 'Women · Outerwear',
    image: '/images/products/solstice-wool-coat.png',
    price: 295,
    rating: 4.9,
    reviewCount: 42,
    badge: 'New',
    filters: ['trending', 'latest'],
  },
  {
    id: 'fine-rib-knit-top',
    name: 'Fine-Rib Knit Top',
    category: 'Women · Knitwear',
    image: '/images/products/fine-rib-knit-top.png',
    price: 115,
    rating: 4.8,
    reviewCount: 31,
    badge: 'New',
    filters: ['popular', 'latest'],
  },
  {
    id: 'atelier-wide-leg-trouser',
    name: 'Atelier Wide-Leg Trouser',
    category: 'Women · Tailoring',
    image: '/images/products/atelier-wide-leg-trouser.png',
    price: 175,
    originalPrice: 210,
    rating: 4.7,
    reviewCount: 26,
    badge: 'Trending',
    filters: ['trending'],
  },
  {
    id: 'arc-frame-sunglasses',
    name: 'Arc Frame Sunglasses',
    category: 'Accessories · Eyewear',
    image: '/images/products/arc-frame-sunglasses.png',
    price: 98,
    rating: 4.8,
    reviewCount: 54,
    badge: 'Best seller',
    filters: ['popular', 'latest'],
  },
]

// Featured products reuses ProductCard and only owns filtering and section layout.
export function FeaturedProducts() {
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('all')
  const visibleProducts =
    activeFilter === 'all'
      ? products
      : products.filter((product) => product.filters.includes(activeFilter))

  return (
    <section
      id="products"
      aria-labelledby="featured-products-heading"
      className="scroll-mt-[92px] bg-canvas px-4 pb-5 pt-12 text-ink min-[380px]:pt-14 sm:scroll-mt-[108px] sm:px-7 sm:pb-8 sm:pt-20 lg:px-10 lg:pb-10 lg:pt-24 xl:scroll-mt-[120px]"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
              Curated for you
            </p>
            <h2 id="featured-products-heading" className="text-3xl sm:text-4xl">
              Featured products
            </h2>
          </div>

          {/* Native tab semantics make the product filters keyboard accessible. */}
          <div
            role="tablist"
            aria-label="Filter featured products"
            className="no-scrollbar -mx-4 flex max-w-[calc(100%+2rem)] gap-5 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:max-w-full sm:gap-7 sm:px-0"
          >
            {tabs.map((tab) => {
              const isActive = activeFilter === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`relative shrink-0 pb-3 text-[9px] font-medium uppercase tracking-[0.16em] transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-45 hover:opacity-75'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId="featured-tab-indicator"
                      className="absolute inset-x-0 bottom-[-1px] h-px bg-ink"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mb-3 flex items-center justify-end gap-1.5 text-[8px] font-medium uppercase tracking-[0.12em] text-ink/45 sm:hidden">
          Swipe products <FiArrowRight size={12} />
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
          >
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="w-[76vw] max-w-[320px] shrink-0 snap-start min-[430px]:w-[62vw] sm:w-auto sm:max-w-none"
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
