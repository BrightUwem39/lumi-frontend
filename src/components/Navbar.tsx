import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
import { SearchModal } from './SearchModal'

// Navigation data lives outside the component so it is not recreated on render.
const navigation = [
  { label: 'New in', to: '/shop?sort=latest' },
  { label: 'Collections', to: '/shop' },
  { label: 'Journal', to: '/journal' },
]

const categories = [
  { label: 'Women', to: '/shop?category=Women' },
  { label: 'Men', to: '/shop?category=Men' },
  { label: 'Accessories', to: '/shop?category=Accessories' },
  { label: 'Shoes', to: '/shop?category=Shoes' },
]

// Shared props for cart and wishlist icons that can display a count badge.
type CountIconProps = {
  count: number
  label: string
  href?: string
  children: ReactNode
}

// Reusable accessible icon link with an optional item counter.
function CountIcon({ count, label, href = '#', children }: CountIconProps) {
  return (
    <Link
      to={href}
      aria-label={`${label}${count ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative grid size-10 place-items-center transition-opacity hover:opacity-55"
    >
      {children}
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] font-medium text-canvas">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function Navbar() {
  // Local UI state controls temporary interfaces such as menus and search.
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
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

  return (
    <>
      {/* The header contains the promotion bar and the responsive main navbar. */}
      <header className="sticky top-0 z-40 bg-canvas text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        {/* Shorter phone copy prevents the promotion from wrapping. */}
        <Link to="/shop" className="flex h-7 w-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap bg-ink px-3 text-center text-[8px] font-medium uppercase tracking-[0.16em] text-canvas transition-opacity hover:opacity-90 sm:h-8 sm:px-4 sm:text-[10px] sm:tracking-[0.24em]">
          <span className="min-w-0 truncate sm:hidden">Free shipping over $250</span>
          <span className="hidden min-w-0 truncate sm:inline">
            Complimentary shipping on orders over $250
          </span>
        </Link>

        <div className="border-b border-line">
          <div className="relative mx-auto flex h-16 max-w-[1440px] items-center px-3 min-[360px]:px-4 sm:h-[76px] sm:px-7 lg:px-10 xl:h-[88px]">
            {/* Phone and tablet use a deliberately minimal two-item header:
                menu control on the left and wordmark on the right. */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              onClick={() => setMobileOpen((open) => !open)}
              className="order-1 grid size-10 shrink-0 place-items-center min-[360px]:size-11 sm:size-10 xl:hidden"
            >
              {mobileOpen ? <FiX size={21} /> : <FiMenu size={22} />}
            </button>

            {/* The wordmark remains visible at every width and returns to the
                full desktop navigation flow at the xl breakpoint. */}
            <Link
              to="/"
              aria-label="Lumi home"
              className="order-2 ml-auto block shrink-0 font-display text-[24px] leading-none tracking-[0.14em] sm:text-[27px] xl:order-none xl:ml-0 xl:text-[32px]"
            >
              LUMI
            </Link>

            {/* Full navigation appears at 1280px and above. */}
            <nav aria-label="Primary navigation" className="ml-10 hidden items-center gap-7 xl:flex xl:gap-9">
              <Link
                to="/shop?sort=latest"
                className="group relative py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
              >
                New in
                <span className="absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
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
                        <Link
                          key={category.label}
                          to={category.to}
                          onClick={() => setCategoriesOpen(false)}
                          className="block px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-canvas"
                        >
                          {category.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {navigation.slice(1).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group relative py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>

            {/* Desktop utilities move into the drawer below 1280px. */}
            <div className="ml-auto hidden shrink-0 items-center gap-1 xl:flex">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls="site-search-modal"
                onClick={() => setSearchOpen(true)}
                className="grid size-10 place-items-center transition-opacity hover:opacity-55"
              >
                <FiSearch size={19} strokeWidth={1.5} />
              </button>
              <Link
                to="/profile"
                aria-label="Account"
                className="grid size-10 place-items-center transition-opacity hover:opacity-55"
              >
                <FiUser size={19} strokeWidth={1.5} />
              </Link>
              <span>
                <CountIcon
                  count={wishlistCount}
                  label="Wishlist"
                  href="/wishlist"
                >
                  <FiHeart size={19} strokeWidth={1.5} />
                </CountIcon>
              </span>
              <span className="[&>a]:size-10">
                <CountIcon count={cartCount} label="Shopping bag" href="/cart">
                  <FiShoppingBag size={19} strokeWidth={1.5} />
                </CountIcon>
              </span>
              <button
                type="button"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                aria-pressed={darkMode}
                onClick={toggleDarkMode}
                className="grid size-10 place-items-center transition-opacity hover:opacity-55"
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

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
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  setSearchOpen(true)
                }}
                className="mb-5 flex min-h-12 w-full items-center gap-3 border border-line px-4 text-left text-[9px] font-medium uppercase tracking-[0.16em] sm:mb-7"
              >
                <FiSearch size={17} />
                Search the collection
              </button>

              {/* Primary mobile links use larger touch-friendly typography. */}
              <nav className="flex flex-col" aria-label="Mobile primary navigation">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="border-b border-line"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + index * 0.05 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3.5 font-display text-[25px] sm:py-4 sm:text-[28px]"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Category shortcuts remain visible without opening another submenu. */}
              <div className="py-5 sm:py-7">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/50">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-x-5">
                  {categories.map((category) => (
                    <Link
                      key={category.label}
                      to={category.to}
                      onClick={() => setMobileOpen(false)}
                      className="border-b border-line py-3 text-xs uppercase tracking-[0.12em]"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account, wishlist, cart, and theme actions remain available when
                  their header icons are hidden at smaller breakpoints. */}
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2 sm:gap-3">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiUser size={16} /> Account
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiHeart size={16} /> Wishlist
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  <FiShoppingBag size={16} /> Cart
                </Link>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex min-w-0 items-center gap-2 border border-line px-3 py-3 text-left text-[9px] font-medium uppercase tracking-[0.12em] sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                >
                  {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
              <a
                href="tel:+2348005864000"
                className="pt-5 text-[9px] uppercase tracking-[0.12em] text-ink/50 transition-colors hover:text-ink sm:pt-6 sm:text-[10px] sm:tracking-[0.16em]"
              >
                Client services · +234 800 LUMI 000
              </a>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
