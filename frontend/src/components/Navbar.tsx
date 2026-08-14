import {
  useEffect,
  useId,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  LuChevronDown as FiChevronDown,
  LuHeart as FiHeart,
  LuMenu as FiMenu,
  LuMoon as FiMoon,
  LuSearch as FiSearch,
  LuShoppingBag as FiShoppingBag,
  LuSun as FiSun,
  LuUser as FiUser,
  LuX as FiX,
} from 'react-icons/lu'
import { useShopStore } from '../store/useShopStore'
import { useCartUiStore } from '../store/useCartUiStore'
import { SearchModal } from './SearchModal'
import { commerceTerms, formatMoney } from '../lib/currency'

const freeShippingThreshold = formatMoney(
  commerceTerms('NGN').freeShippingThreshold,
)

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
  onClick?: MouseEventHandler<HTMLAnchorElement>
  cartTarget?: boolean
  pulseKey?: number
}

// Reusable accessible icon link with an optional item counter.
function CountIcon({ count, label, href = '#', children, onClick, cartTarget = false, pulseKey = 0 }: CountIconProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      data-cart-target={cartTarget ? 'navbar' : undefined}
      aria-label={`${label}${count ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative grid size-10 place-items-center transition-opacity hover:opacity-55"
    >
      <motion.span
        key={cartTarget ? pulseKey : 'static-icon'}
        className="grid place-items-center"
        initial={cartTarget && pulseKey > 0 ? { scale: 0.8, y: 0, rotate: 0 } : false}
        animate={cartTarget && pulseKey > 0 ? { scale: [0.8, 1.22, 0.94, 1], y: [0, -4, 1, 0], rotate: [0, -8, 5, 0] } : undefined}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.45, opacity: 0 }}
          animate={{ scale: [0.45, 1.25, 1], opacity: 1 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] font-medium text-canvas"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
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
  const openCartDrawer = useCartUiStore((state) => state.openDrawer)
  const cartPulseKey = useCartUiStore((state) => state.pulseKey)
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
      <header className="fixed inset-x-0 top-0 z-40 bg-canvas/95 text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
        {/* Shorter phone copy prevents the promotion from wrapping. */}
        <Link
          to="/shop"
          className="flex h-7 w-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap bg-ink px-3 text-center text-[8px] font-medium uppercase tracking-[0.16em] text-canvas transition-opacity hover:opacity-90 sm:h-8 sm:px-4 sm:text-[10px] sm:tracking-[0.24em]"
        >
          <span className="min-w-0 truncate sm:hidden">Free shipping from {freeShippingThreshold}</span>
          <span className="hidden min-w-0 truncate sm:inline">
            Complimentary shipping from {freeShippingThreshold}
          </span>
        </Link>

        <div className="border-b border-line">
          <div className="relative mx-auto flex h-[50px] max-w-[1440px] items-center px-3 min-[360px]:px-4 sm:h-[60px] sm:px-7 lg:px-10 xl:h-[70px]">
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
              className="order-2 ml-auto shrink-0 font-display text-[24px] leading-none tracking-[0.14em] sm:text-[27px] xl:order-none xl:ml-0 xl:text-[32px]"
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
                <CountIcon
                  count={cartCount}
                  label="Shopping bag"
                  href="/cart"
                  cartTarget
                  pulseKey={cartPulseKey}
                  onClick={(event) => {
                    event.preventDefault()
                    openCartDrawer()
                  }}
                >
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

      {/* A fixed header needs an equal-height spacer so page content starts
          below it at every responsive navbar height. */}
      <div aria-hidden="true" className="h-[78px] sm:h-[92px] xl:h-[102px]" />

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
              className="fixed bottom-0 left-0 top-[78px] z-30 flex w-full flex-col overflow-y-auto overscroll-contain bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 text-ink min-[380px]:px-5 sm:top-[92px] sm:w-[88%] sm:max-w-sm sm:px-6 sm:pb-8 sm:pt-8 xl:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: -180, right: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) {
                  setMobileOpen(false)
                }
              }}
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
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:gap-3">
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
                  onClick={(event) => {
                    event.preventDefault()
                    setMobileOpen(false)
                    openCartDrawer()
                  }}
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
