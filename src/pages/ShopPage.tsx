import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  LuChevronLeft as FiChevronLeft,
  LuChevronDown as FiChevronDown,
  LuChevronRight as FiChevronRight,
  LuArrowUpDown as FiArrowUpDown,
  LuCheck as FiCheck,
  LuListFilter as FiFilter,
  LuSearch as FiSearch,
  LuX as FiX,
} from 'react-icons/lu'
import {
  ProductFilters,
  type PriceFilter,
  type ProductFilterProps,
} from '../components/ProductFilters'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../hooks/useCatalog'
import type { ShopProduct } from '../types/product'

type SortOption = 'featured' | 'latest' | 'price-low' | 'price-high' | 'rating'

const productGridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.075, delayChildren: 0.05 } },
}

const productItemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
}


const categories = ['All', 'Women', 'Men', 'Accessories', 'Shoes']
const sizes = ['XS', 'S', 'M', 'L', 'XL', '38', '39', '40', '41', 'One size']
const colors = [
  { name: 'Black', hex: '#171713' },
  { name: 'White', hex: '#f5f3ee' },
  { name: 'Brown', hex: '#765846' },
  { name: 'Grey', hex: '#a6a5a0' },
]
export function ShopPage() {
  const { products, status: catalogStatus } = useCatalog()
  const reduceMotion = useReducedMotion()
  const initialParams = new URLSearchParams(window.location.search)
  const [query, setQuery] = useState(() => initialParams.get('search') ?? '')
  const [category, setCategory] = useState(() => {
    const requestedCategory = initialParams.get('category')
    return requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : 'All'
  })
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [availability, setAvailability] =
    useState<'all' | 'in-stock' | 'out-of-stock'>('all')
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const requestedSort = initialParams.get('sort')
    return requestedSort === 'latest' ? 'latest' : 'featured'
  })
  const [sortOpen, setSortOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const productsPerPage = 6
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.color.toLowerCase().includes(normalizedQuery)
      const matchesCategory =
        category === 'All' || product.category === category
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === '10-50' && product.price >= 10 && product.price <= 50) ||
        (priceFilter === '50-150' && product.price > 50 && product.price <= 150) ||
        (priceFilter === '150-250' && product.price > 150 && product.price <= 250) ||
        (priceFilter === 'over-250' && product.price > 250)
      const matchesSize =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => product.sizes.includes(size))
      const matchesColor =
        selectedColors.length === 0 || selectedColors.includes(product.color)
      const matchesAvailability =
        availability === 'all' ||
        (availability === 'in-stock' && product.available) ||
        (availability === 'out-of-stock' && !product.available)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesSize &&
        matchesColor &&
        product.rating >= minRating &&
        matchesAvailability
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'latest') {
        const newRank = (product: ShopProduct) => product.badge === 'New' ? 0 : 1
        return newRank(a) - newRank(b) || products.indexOf(a) - products.indexOf(b)
      }
      return products.indexOf(a) - products.indexOf(b)
    })
  }, [
    availability,
    category,
    minRating,
    priceFilter,
    products,
    query,
    selectedColors,
    selectedSizes,
    sortBy,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  )
  const visibleProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage,
  )

  // Any filter change returns the grid to its first page.
  useEffect(() => {
    setPage(1)
  }, [
    availability,
    category,
    minRating,
    priceFilter,
    query,
    selectedColors,
    selectedSizes,
    sortBy,
  ])

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

  // Pointer presses outside the sort control dismiss its menu without forcing
  // customers to select an option first.
  useEffect(() => {
    if (!sortOpen) return

    const closeSortMenu = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeSortMenu)
    return () => document.removeEventListener('pointerdown', closeSortMenu)
  }, [sortOpen])

  const resetFilters = () => {
    setCategory('All')
    setPriceFilter('all')
    setSelectedSizes([])
    setSelectedColors([])
    setMinRating(0)
    setAvailability('all')
    setQuery('')
  }

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    )
  }

  const filterProps: ProductFilterProps = {
    category,
    categories,
    setCategory,
    price: priceFilter,
    setPrice: setPriceFilter,
    sizes,
    selectedSizes,
    toggleSize: (value) => toggleSelection(value, setSelectedSizes),
    colors,
    selectedColors,
    toggleColor: (value) => toggleSelection(value, setSelectedColors),
    minRating,
    setMinRating,
    availability,
    setAvailability,
    resetFilters,
  }

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Featured', value: 'featured' },
    { label: 'Latest arrivals', value: 'latest' },
    { label: 'Price: low to high', value: 'price-low' },
    { label: 'Price: high to low', value: 'price-high' },
    { label: 'Highest rated', value: 'rating' },
  ]

  return (
    <main className="bg-canvas text-ink">
      <header className="border-b border-line px-4 py-7 min-[380px]:py-8 sm:px-7 sm:py-10 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
            Lumi collection
          </p>
          <h1 className="text-4xl min-[380px]:text-5xl sm:text-6xl">Shop all</h1>
          <p className="mt-4 max-w-[32ch] text-sm leading-6 text-ink/60 sm:max-w-lg">
            Everyday pieces, considered details, and the latest from our
            studio.
          </p>
        </div>
      </header>

      <section aria-label="Shop products" className="px-4 py-6 min-[380px]:py-8 sm:px-7 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          {/* Search, mobile filter, result count, and sort controls. */}
          <div className="mb-6 grid grid-cols-2 gap-2.5 border-b border-line pb-5 sm:mb-8 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3 sm:pb-6">
            <label className="col-span-2 flex min-h-12 items-center gap-3 bg-ink/[0.04] px-4 sm:col-span-1">
              <FiSearch size={17} className="shrink-0 text-ink/55" />
              <span className="sr-only">Search products</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35 focus-visible:outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-12 min-w-0 items-center justify-center gap-2 border border-line px-3 text-[9px] font-medium uppercase tracking-[0.14em] min-[380px]:px-5 min-[380px]:tracking-[0.16em] lg:hidden"
            >
              <FiFilter size={15} />
              Filters
            </button>

            <div ref={sortMenuRef} className="relative min-w-0">
              <button
                type="button"
                aria-label="Sort products"
                aria-expanded={sortOpen}
                aria-controls="shop-sort-menu"
                onClick={() => setSortOpen((open) => !open)}
                className={`flex min-h-12 w-full min-w-0 items-center gap-2 border px-3 text-left transition-colors min-[380px]:gap-3 min-[380px]:px-4 sm:w-auto sm:min-w-48 ${sortOpen ? 'border-ink' : 'border-line hover:border-ink'}`}
              >
                <FiArrowUpDown size={14} className="shrink-0 text-ink/55" />
                <span className="min-w-0 flex-1">
                  <span className="hidden text-[7px] font-medium uppercase tracking-[0.14em] text-ink/38 min-[400px]:block">
                    Sort by
                  </span>
                  <span className="block truncate text-[9px] font-medium uppercase tracking-[0.11em] min-[400px]:mt-0.5 min-[400px]:tracking-[0.13em]">
                    {sortOptions.find((option) => option.value === sortBy)?.label}
                  </span>
                </span>
                <FiChevronDown
                  size={14}
                  className={`shrink-0 transition-transform duration-300 ${sortOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    id="shop-sort-menu"
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(82vw,280px)] overflow-hidden border border-line bg-canvas p-2 shadow-[0_24px_70px_rgba(0,0,0,0.18)]"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.985 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between border-b border-line px-2 pb-3 pt-1">
                      <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-ink/45">Sort collection</span>
                      <span className="text-[8px] text-ink/35">{sortOptions.length} options</span>
                    </div>
                    <div className="pt-1">
                      {sortOptions.map((option, index) => {
                        const selected = option.value === sortBy
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={selected}
                            onClick={() => {
                              setSortBy(option.value)
                              setSortOpen(false)
                            }}
                            className={`flex min-h-12 w-full items-center gap-3 px-3 text-left transition-colors ${selected ? 'bg-ink text-canvas' : 'hover:bg-ink/[0.05]'}`}
                          >
                            <span className={`text-[8px] ${selected ? 'text-canvas/55' : 'text-ink/35'}`}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1 text-[9px] font-medium uppercase tracking-[0.12em]">
                              {option.label}
                            </span>
                            {selected && <FiCheck size={14} className="shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <ProductFilters {...filterProps} />
              </div>
            </aside>

            <div className="min-w-0">
              <p className="mb-5 text-[9px] uppercase tracking-[0.16em] text-ink/50">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
                {catalogStatus === 'loading' && ' · Updating catalog'}
                {catalogStatus === 'fallback' && ' · Offline collection'}
              </p>

              {visibleProducts.length > 0 ? (
                <motion.div
                  layout
                  variants={productGridVariants}
                  initial={reduceMotion ? false : 'hidden'}
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.08 }}
                  className="mx-auto grid w-full min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-x-3 gap-y-6 px-1 min-[420px]:px-0 sm:gap-x-4 sm:gap-y-8 xl:grid-cols-3"
                >
                  {visibleProducts.map((product) => (
                    <motion.div key={product.id} variants={productItemVariants} layout>
                      <ProductCard product={product} viewportReveal={false} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="grid min-h-80 place-items-center border border-line p-8 text-center">
                  <div>
                    <h2 className="text-2xl">Nothing matched that search.</h2>
                    <p className="mt-3 text-sm text-ink/55">
                      Try another term or clear the filters.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-6 border-b border-ink pb-1 text-[9px] uppercase tracking-[0.16em]"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination only appears when the filtered result has multiple pages. */}
              {totalPages > 1 && (
                <nav
                  aria-label="Product pagination"
                  className="mt-9 flex items-center justify-center gap-2 border-t border-line pt-6"
                >
                  <button
                    type="button"
                    aria-label="Previous product page"
                    disabled={page === 1}
                    onClick={() => {
                      setPage((current) => Math.max(1, current - 1))
                      window.scrollTo({ top: 300, behavior: 'smooth' })
                    }}
                    className="grid size-10 place-items-center border border-line transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next product page"
                    disabled={page === totalPages}
                    onClick={() => {
                      setPage((current) => Math.min(totalPages, current + 1))
                      window.scrollTo({ top: 300, behavior: 'smooth' })
                    }}
                    className="grid size-10 place-items-center border border-line transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Off-canvas filters keep the product grid wide enough on small screens. */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-50 bg-black/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.aside
              aria-label="Product filters"
              className="fixed inset-y-0 left-0 z-[60] w-[92%] max-w-sm origin-left overflow-y-auto overscroll-contain bg-canvas p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink min-[380px]:p-5 sm:w-[88%] sm:p-6 lg:hidden"
              initial={reduceMotion ? { opacity: 0 } : { x: '-104%', opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '-104%', opacity: 0.7 }}
              transition={{
                duration: reduceMotion ? 0 : 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              drag="x"
              dragConstraints={{ left: -180, right: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) {
                  setFiltersOpen(false)
                }
              }}
            >
              <div className="mb-7 flex items-center justify-between gap-4">
                <span className="text-[8px] uppercase tracking-[0.13em] text-ink/40">Swipe left to close</span>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="grid size-10 place-items-center"
                >
                  <FiX size={21} />
                </button>
              </div>
              <ProductFilters {...filterProps} animated />
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="mt-4 min-h-12 w-full bg-ink px-5 text-[9px] font-medium uppercase tracking-[0.18em] text-canvas"
              >
                Show {filteredProducts.length} products
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
