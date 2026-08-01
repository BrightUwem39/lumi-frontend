import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import {
  ProductFilters,
  type PriceFilter,
  type ProductFilterProps,
} from '../components/ProductFilters'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../hooks/useCatalog'
import type { ShopProduct } from '../types/product'

type SortOption = 'featured' | 'latest' | 'price-low' | 'price-high' | 'rating'


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
      <header className="border-b border-line px-4 py-9 min-[380px]:py-10 sm:px-7 sm:py-16 lg:px-10">
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

      <section aria-label="Shop products" className="px-3 py-6 min-[380px]:px-4 min-[380px]:py-8 sm:px-7 lg:px-10 lg:py-10">
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
              className="flex min-h-12 items-center justify-center gap-2 border border-line px-5 text-[9px] font-medium uppercase tracking-[0.16em] lg:hidden"
            >
              <FiFilter size={15} />
              Filters
            </button>

            <div className="relative">
              <button
                type="button"
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((open) => !open)}
                className="flex min-h-12 w-full items-center justify-between gap-4 border border-line px-5 text-[9px] font-medium uppercase tracking-[0.14em] sm:w-auto"
              >
                {sortOptions.find((option) => option.value === sortBy)?.label}
                <FiChevronDown
                  size={14}
                  className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    className="absolute right-0 top-[calc(100%+6px)] z-30 w-full min-w-52 border border-line bg-canvas p-1 shadow-xl"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value)
                          setSortOpen(false)
                        }}
                        className="block w-full px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hover:bg-ink hover:text-canvas"
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid min-w-0 gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-12">
            <aside className="hidden lg:block">
              <div className="sticky top-6">
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
                className="grid grid-cols-1 gap-x-3 gap-y-8 min-[340px]:grid-cols-2 sm:gap-x-4 sm:gap-y-10 xl:grid-cols-3"
                >
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
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
                  className="mt-12 flex items-center justify-center gap-2 border-t border-line pt-8"
                >
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        aria-current={page === pageNumber ? 'page' : undefined}
                        onClick={() => {
                          setPage(pageNumber)
                          window.scrollTo({ top: 300, behavior: 'smooth' })
                        }}
                        className={`grid size-10 place-items-center border text-xs ${
                          page === pageNumber
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-line hover:border-ink'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ),
                  )}
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
              className="fixed inset-y-0 left-0 z-[60] w-[92%] max-w-sm overflow-y-auto overscroll-contain bg-canvas p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink min-[380px]:p-5 sm:w-[88%] sm:p-6 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-7 flex justify-end">
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFiltersOpen(false)}
                  className="grid size-10 place-items-center"
                >
                  <FiX size={21} />
                </button>
              </div>
              <ProductFilters {...filterProps} />
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
