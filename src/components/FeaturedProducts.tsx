import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { MotionReveal } from './MotionReveal'
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

// The grid reveals once as a group, then hands each card a short staggered delay.
const productGridVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
}

const productItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

// Filter metadata controls the tabs without leaking presentation into ProductCard.
const products: FeaturedProduct[] = [
  {
    id: 'solstice-wool-coat',
    name: 'Solstice Wool Coat',
    category: 'Women · Outerwear',
    image: '/images/editorial/solstice-coat-atelier-v2.jpg',
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
    image: '/images/editorial/fine-rib-window-v2.jpg',
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
    image: '/images/editorial/atelier-trouser-street-v2.jpg',
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
    image: '/images/editorial/arc-sunglasses-cafe-v2.jpg',
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
  const reduceMotion = useReducedMotion()
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
        <MotionReveal className="mb-6 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
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
        </MotionReveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            role="tabpanel"
            variants={productGridVariants}
            initial={reduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            exit={{ opacity: 0, y: -8 }}
            className="no-scrollbar flex w-full snap-x snap-mandatory items-stretch gap-3 overflow-x-auto overscroll-x-contain pb-4 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:pb-0 lg:grid-cols-4"
          >
            {visibleProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={productItemVariants}
                className="w-full min-w-0 shrink-0 snap-center self-stretch sm:w-auto sm:shrink"
              >
                <ProductCard product={product} viewportReveal={false} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
