import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowRight,
  FiClock,
  FiSearch,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'

type SearchProduct = {
  id: string
  name: string
  category: string
  image: string
}

const featuredSearchProducts: SearchProduct[] = [
  {
    id: 'luna-silk-dress',
    name: 'Luna Silk Dress',
    category: 'Women · Dresses',
    image: '/images/products/luna-silk-dress.webp',
  },
  {
    id: 'relaxed-wool-blazer',
    name: 'Relaxed Wool Blazer',
    category: 'Men · Tailoring',
    image: '/images/products/charcoal-wool-blazer.webp',
  },
  {
    id: 'crescent-leather-bag',
    name: 'Crescent Leather Bag',
    category: 'Accessories · Bags',
    image: '/images/products/crescent-leather-bag.webp',
  },
  {
    id: 'column-ankle-boots',
    name: 'Column Ankle Boots',
    category: 'Women · Shoes',
    image: '/images/products/column-ankle-boots.webp',
  },
  {
    id: 'solstice-wool-coat',
    name: 'Solstice Wool Coat',
    category: 'Women · Outerwear',
    image: '/images/products/solstice-wool-coat.png',
  },
  {
    id: 'fine-rib-knit-top',
    name: 'Fine-Rib Knit Top',
    category: 'Women · Knitwear',
    image: '/images/products/fine-rib-knit-top.png',
  },
  {
    id: 'atelier-wide-leg-trouser',
    name: 'Atelier Wide-Leg Trouser',
    category: 'Women · Tailoring',
    image: '/images/products/atelier-wide-leg-trouser.png',
  },
  {
    id: 'arc-frame-sunglasses',
    name: 'Arc Frame Sunglasses',
    category: 'Accessories · Eyewear',
    image: '/images/products/arc-frame-sunglasses.png',
  },
]

const popularSearches = ['Coat', 'Knitwear', 'Tailoring', 'Eyewear']
const curatedSuggestions = [
  'Solstice Wool Coat',
  'Fine-Rib Knit Top',
  'Atelier Wide-Leg Trouser',
  'Arc Frame Sunglasses',
]

type SearchModalProps = {
  open: boolean
  onClose: () => void
}

// Search owns its query and discovery content while Navbar only controls visibility.
export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { products: catalogProducts } = useCatalog()
  const searchProducts = useMemo<SearchProduct[]>(
    () => {
      const normalized = catalogProducts.map(({ id, name, category, image }) => ({ id, name, category, image }))
      return normalized.length ? normalized : featuredSearchProducts
    },
    [catalogProducts],
  )
  const normalizedQuery = query.trim().toLowerCase()

  const results = useMemo(
    () =>
      normalizedQuery
        ? searchProducts.filter(
            (product) =>
              product.name.toLowerCase().includes(normalizedQuery) ||
              product.category.toLowerCase().includes(normalizedQuery),
          )
        : [],
    [normalizedQuery, searchProducts],
  )

  const suggestions = normalizedQuery
    ? results.map((product) => product.name).slice(0, 4)
    : curatedSuggestions

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (results[0]) navigate(`/product/${results[0].id}`)
    else if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
    }
    onClose()
  }

  const chooseSearch = (value: string) => setQuery(value)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            id="site-search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            className="fixed inset-x-0 top-0 z-50 max-h-[100svh] overflow-y-auto overscroll-contain bg-canvas px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-ink shadow-2xl min-[380px]:px-4 min-[380px]:pb-7 min-[380px]:pt-4 sm:max-h-[92svh] sm:px-7 sm:pb-10 sm:pt-6 lg:px-10"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-[1200px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-ink/45">
                    Find your next piece
                  </p>
                  <h2
                    id="search-modal-title"
                    className="mt-1 text-xl sm:text-2xl"
                  >
                    Search Lumi
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={onClose}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* The large search field remains compact enough for phone screens. */}
              <form
                role="search"
                onSubmit={submitSearch}
                className="mt-5 flex min-w-0 items-center border-b border-ink pb-3 sm:mt-7"
              >
                <FiSearch
                  size={21}
                  className="mr-3 shrink-0 text-ink/45 sm:mr-4"
                />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the collection"
                  aria-label="Search products"
                  className="min-w-0 flex-1 bg-transparent font-display text-lg placeholder:text-ink/30 min-[380px]:text-xl sm:text-3xl"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="shrink-0 px-2 text-[8px] uppercase tracking-[0.13em] text-ink/45 hover:text-ink sm:px-3"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="grid size-10 shrink-0 place-items-center sm:size-11"
                >
                  <FiArrowRight size={18} />
                </button>
              </form>

              <div className="mt-5 grid min-w-0 gap-7 min-[380px]:mt-6 min-[380px]:gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
                <div className="min-w-0">
                  {/* Popular searches double as fast, touch-friendly query chips. */}
                  <SearchGroupTitle icon={<FiTrendingUp />} title="Popular searches" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {popularSearches.map((search) => (
                      <button
                        key={search}
                        type="button"
                        onClick={() => chooseSearch(search)}
                        className="min-h-10 border border-line px-3 text-[8px] uppercase tracking-[0.12em] transition-colors hover:border-ink hover:bg-ink hover:text-canvas sm:px-4 sm:text-[9px]"
                      >
                        {search}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7">
                    <SearchGroupTitle icon={<FiSearch />} title="Suggestions" />
                    <div className="mt-2 divide-y divide-line border-y border-line">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => chooseSearch(suggestion)}
                          className="flex min-h-10 w-full items-center justify-between gap-3 py-2 text-left text-xs text-ink/65 hover:text-ink"
                        >
                          <span className="truncate">{suggestion}</span>
                          <FiArrowRight size={13} className="shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  {normalizedQuery ? (
                    <SearchResults
                      query={query}
                      results={results}
                      onClose={onClose}
                    />
                  ) : (
                    <RecentlyViewed products={searchProducts} onClose={onClose} />
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}

function RecentlyViewed({ products, onClose }: { products: SearchProduct[]; onClose: () => void }) {
  const recentlyViewedIds = useShopStore((state) => state.recentlyViewedItems)
  const recentlyViewed = recentlyViewedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is SearchProduct => Boolean(product))

  return (
    <div>
      <SearchGroupTitle icon={<FiClock />} title="Recently viewed" />
      {recentlyViewed.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
          {recentlyViewed.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              onClick={onClose}
              className="group min-w-0"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#e8e5df]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-2 truncate text-[10px] sm:text-xs">
                {product.name}
              </p>
              <p className="mt-1 truncate text-[8px] uppercase tracking-[0.1em] text-ink/40">
                {product.category}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3 border border-line p-5">
          <p className="text-xs leading-5 text-ink/50">
            Products you open will appear here for an easy return.
          </p>
        </div>
      )}
    </div>
  )
}

function SearchResults({
  query,
  results,
  onClose,
}: {
  query: string
  results: SearchProduct[]
  onClose: () => void
}) {
  return (
    <div aria-live="polite">
      <p className="text-[9px] uppercase tracking-[0.16em] text-ink/45">
        {results.length} {results.length === 1 ? 'result' : 'results'} for “
        {query.trim()}”
      </p>
      {results.length ? (
        <div className="mt-3 divide-y divide-line border-y border-line">
          {results.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              onClick={onClose}
              className="group flex min-w-0 items-center gap-3 py-3"
            >
              <div className="aspect-[4/5] w-14 shrink-0 overflow-hidden bg-[#e8e5df]">
                <img
                  src={product.image}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{product.name}</p>
                <p className="mt-1 truncate text-[8px] uppercase tracking-[0.12em] text-ink/45">
                  {product.category}
                </p>
              </div>
              <FiArrowRight
                size={15}
                className="shrink-0 transition-transform group-hover:translate-x-1"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3 border border-line p-5">
          <p className="text-sm">Nothing matched that search.</p>
          <p className="mt-2 text-xs leading-5 text-ink/50">
            Try a product type, material, or category.
          </p>
        </div>
      )}
    </div>
  )
}

function SearchGroupTitle({
  icon,
  title,
}: {
  icon: ReactNode
  title: string
}) {
  return (
    <h3 className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.17em]">
      <span className="text-sm">{icon}</span>
      {title}
    </h3>
  )
}
