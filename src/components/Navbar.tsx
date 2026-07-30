import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiChevronDown,
  FiHeart,
  FiMenu,
  FiMoon,
  FiSearch,
  FiShoppingBag,
  FiSun,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useShopStore } from '../store/useShopStore'

// Navigation data lives outside the component so it is not recreated on render.
const navigation = [
  { label: 'New in', href: '#new-in' },
  { label: 'Collections', href: '#collections' },
  { label: 'Journal', href: '#journal' },
]

const categories = [
  { label: 'Women', href: '#women' },
  { label: 'Men', href: '#men' },
  { label: 'Accessories', href: '#accessories' },
  { label: 'Shoes', href: '#shoes' },
]

// Temporary frontend catalog data powers search until the backend is connected.
const searchableProducts = [
  { name: 'Sculpted Wool Coat', category: 'Women', href: '#sculpted-wool-coat' },
  { name: 'Luna Silk Dress', category: 'Women', href: '#luna-silk-dress' },
  { name: 'Tailored Evening Blazer', category: 'Men', href: '#evening-blazer' },
  { name: 'Leather Crescent Bag', category: 'Accessories', href: '#crescent-bag' },
  { name: 'Column Ankle Boots', category: 'Shoes', href: '#ankle-boots' },
]

const popularSearches = ['Women', 'Silk', 'Leather']

// Shared props for cart and wishlist icons that can display a count badge.
type CountIconProps = {
  count: number
  label: string
  children: ReactNode
}

// Reusable accessible icon link with an optional item counter.
function CountIcon({ count, label, children }: CountIconProps) {
  return (
    <a
      href="#"
      aria-label={`${label}${count ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative grid size-10 place-items-center transition-opacity hover:opacity-55"
    >
      {children}
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] font-medium text-canvas">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </a>
  )
}

export function Navbar() {
  // Local UI state controls temporary interfaces such as menus and search.
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('lumi-theme')
    return savedTheme
      ? savedTheme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const cartCount = useShopStore((state) => state.cartCount)
  const wishlistCount = useShopStore((state) => state.wishlistCount)
  const mobileMenuId = useId()
  const searchId = useId()

  // Escape closes any open overlay for keyboard users.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setSearchOpen(false)
        setCategoriesOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Lock background scrolling while a drawer or search panel is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, searchOpen])

  // Apply and remember the chosen theme across browser sessions.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('lumi-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((isDark) => !isDark)

  // Search is currently performed locally. This can be replaced with an API
  // request without changing the search interface.
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchResults = normalizedQuery
    ? searchableProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery),
      )
    : []

  // Pressing Enter opens the first matching product in the current prototype.
  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstResult = searchResults[0]
    if (firstResult) {
      window.location.hash = firstResult.href
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* The header contains the promotion bar and the responsive main navbar. */}
      <header className="relative z-40 bg-canvas text-ink">
        {/* Shorter phone copy prevents the promotion from wrapping. */}
        <div className="flex h-7 items-center justify-center overflow-hidden whitespace-nowrap bg-ink px-3 text-center text-[8px] font-medium uppercase tracking-[0.16em] text-canvas sm:h-8 sm:px-4 sm:text-[10px] sm:tracking-[0.24em]">
          <span className="sm:hidden">Free shipping over $250</span>
          <span className="hidden sm:inline">
            Complimentary shipping on orders over $250
          </span>
        </div>

        <div className="border-b border-line">
          <div className="relative mx-auto flex h-16 max-w-[1440px] items-center px-3 min-[360px]:px-4 sm:h-[76px] sm:px-7 lg:px-10 xl:h-[88px]">
            {/* Keeping the menu trigger first in the DOM prevents auto margins
                from pushing phone utility icons beyond the viewport. */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              onClick={() => setMobileOpen((open) => !open)}
              className="grid size-10 shrink-0 place-items-center min-[360px]:size-11 sm:size-10 xl:hidden"
            >
              {mobileOpen ? <FiX size={21} /> : <FiMenu size={22} />}
            </button>

            {/* The wordmark is hidden on phones, centered on tablets, and placed
                first beside navigation on wide desktop screens. */}
            <a
              href="/"
              aria-label="Lumi home"
              className="hidden shrink-0 font-display text-[29px] leading-none tracking-[0.14em] sm:absolute sm:left-1/2 sm:block sm:-translate-x-1/2 xl:static xl:translate-x-0 xl:text-[32px]"
            >
              LUMI
            </a>

            {/* Full navigation appears at 1280px and above. */}
            <nav aria-label="Primary navigation" className="ml-10 hidden items-center gap-7 xl:flex xl:gap-9">
              <a
                href="#new-in"
                className="group relative py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
              >
                New in
                <span className="absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
              </a>
              {/* Categories uses an animated dropdown on desktop. */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
              >
                <button
                  type="button"
                  aria-expanded={categoriesOpen}
                  aria-controls="desktop-categories"
                  onClick={() => setCategoriesOpen((open) => !open)}
                  className="flex items-center gap-1.5 py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
                >
                  Categories
                  <FiChevronDown
                    size={13}
                    className={`transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      id="desktop-categories"
                      className="absolute left-0 top-full w-52 border border-line bg-canvas p-2 shadow-xl"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {categories.map((category) => (
                        <a
                          key={category.label}
                          href={category.href}
                          className="block px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-canvas"
                        >
                          {category.label}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {navigation.slice(1).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group relative py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </nav>

            {/* Utility controls stay on the right at every breakpoint. */}
            <div className="ml-auto flex shrink-0 items-center sm:gap-1 xl:ml-auto">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls={searchId}
                onClick={() => setSearchOpen(true)}
                className="grid size-10 place-items-center transition-opacity hover:opacity-55 min-[360px]:size-11 sm:size-10"
              >
                <FiSearch size={19} strokeWidth={1.5} />
              </button>
              <a
                href="#account"
                aria-label="Account"
                className="grid size-10 place-items-center transition-opacity hover:opacity-55 min-[360px]:size-11 sm:size-10"
              >
                <FiUser size={19} strokeWidth={1.5} />
              </a>
              <span className="hidden xl:block">
                <CountIcon count={wishlistCount} label="Wishlist">
                  <FiHeart size={19} strokeWidth={1.5} />
                </CountIcon>
              </span>
              <span className="[&>a]:size-10 min-[360px]:[&>a]:size-11 sm:[&>a]:size-10">
                <CountIcon count={cartCount} label="Shopping bag">
                  <FiShoppingBag size={19} strokeWidth={1.5} />
                </CountIcon>
              </span>
              <button
                type="button"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                aria-pressed={darkMode}
                onClick={toggleDarkMode}
                className="hidden size-10 place-items-center transition-opacity hover:opacity-55 sm:grid"
              >
                {darkMode ? (
                  <FiSun size={19} strokeWidth={1.5} />
                ) : (
                  <FiMoon size={19} strokeWidth={1.5} />
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Search uses a backdrop plus a compact animated panel. */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close search"
              className="fixed inset-0 z-40 cursor-default bg-black/25 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              id={searchId}
              role="search"
              className="fixed inset-x-0 top-0 z-50 max-h-[58svh] overflow-y-auto bg-canvas px-5 py-4 text-ink shadow-xl sm:px-8 sm:py-6"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto max-w-4xl">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
                    Search the collection
                  </p>
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setSearchOpen(false)}
                    className="grid size-10 place-items-center"
                  >
                    <FiX size={22} />
                  </button>
                </div>
                {/* Controlled input provides live filtering and Enter submission. */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center border-b border-ink pb-3"
                >
                  <input
                    autoFocus
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search products"
                    placeholder="What are you looking for?"
                    className="min-w-0 flex-1 bg-transparent font-display text-xl outline-none placeholder:text-ink/35 sm:text-3xl"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    disabled={!searchResults.length}
                    className="grid size-11 shrink-0 place-items-center disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <FiSearch size={24} strokeWidth={1.25} />
                  </button>
                </form>

                {/* aria-live announces result changes without moving keyboard focus. */}
                <div aria-live="polite" className="pt-4">
                  {!normalizedQuery ? (
                    <div>
                      <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
                        Popular searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((search) => (
                          <button
                            key={search}
                            type="button"
                            onClick={() => setSearchQuery(search)}
                            className="border border-line px-3 py-2 text-[9px] uppercase tracking-[0.13em] transition-colors hover:bg-ink hover:text-canvas sm:px-4 sm:text-[10px]"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
                        {searchResults.length}{' '}
                        {searchResults.length === 1 ? 'result' : 'results'} for “
                        {searchQuery.trim()}”
                      </p>
                      {searchResults.length > 0 ? (
                        <div className="divide-y divide-line border-t border-line">
                          {searchResults.map((product) => (
                            <a
                              key={product.name}
                              href={product.href}
                              onClick={() => setSearchOpen(false)}
                              className="group flex items-center justify-between gap-4 py-2.5 sm:py-3"
                            >
                              <span className="font-display text-base sm:text-lg">
                                {product.name}
                              </span>
                              <span className="text-[9px] uppercase tracking-[0.16em] text-ink/50 group-hover:text-ink">
                                {product.category}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="py-3 font-display text-base text-ink/60 sm:text-lg">
                          No products found. Try a category such as Women, Men,
                          Accessories, or Shoes.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile navigation is rendered as an off-canvas drawer with its own
          category and account shortcuts. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-20 cursor-default bg-black/30 xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              id={mobileMenuId}
              aria-label="Mobile navigation"
              className="fixed bottom-0 left-0 top-[92px] z-30 flex w-full max-w-sm flex-col overflow-y-auto overscroll-contain bg-canvas px-5 pb-6 pt-6 text-ink sm:top-[108px] sm:w-[88%] sm:px-6 sm:pb-8 sm:pt-8 xl:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Primary mobile links use larger touch-friendly typography. */}
              <nav className="flex flex-col" aria-label="Mobile primary navigation">
                {navigation.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="border-b border-line py-3.5 font-display text-[25px] sm:py-4 sm:text-[28px]"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + index * 0.05 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>

              {/* Category shortcuts remain visible without opening another submenu. */}
              <div className="py-5 sm:py-7">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-x-5">
                  {categories.map((category) => (
                    <a
                      key={category.label}
                      href={category.href}
                      onClick={() => setMobileOpen(false)}
                      className="border-b border-line py-3 text-xs uppercase tracking-[0.12em]"
                    >
                      {category.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Account, wishlist, cart, and theme actions remain available when
                  their header icons are hidden at smaller breakpoints. */}
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2 sm:gap-3">
                <a
                  href="#account"
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiUser size={16} /> Account
                </a>
                <a
                  href="#wishlist"
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiHeart size={16} /> Wishlist
                </a>
                <a
                  href="#cart"
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiShoppingBag size={16} /> Cart
                </a>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-left text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
              <p className="pt-5 text-[9px] uppercase tracking-[0.12em] text-ink/50 sm:pt-6 sm:text-[10px] sm:tracking-[0.16em]">
                Client services · +1 800 555 0148
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
