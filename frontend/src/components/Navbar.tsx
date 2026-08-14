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

// The same complete mark appears at every width and scales with the header.
function LumiLogo() {
  return (
    <span className="flex items-center gap-1 sm:gap-2.5" aria-hidden="true">
      <svg
        viewBox="0 0 32 32"
        className="size-4 shrink-0 sm:size-8"
        fill="none"
      >
        <circle cx="16" cy="16" r="14.5" stroke="currentColor" />
        <path
          d="M10.25 8.75v14.5h11.5M15.5 8.75v9.25h6.25"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="square"
        />
        <circle cx="22" cy="9" r="1.35" fill="currentColor" />
      </svg>
      <span className="font-display text-[12px] leading-none tracking-[0.11em] sm:text-[28px] sm:tracking-[0.18em] xl:text-[31px]">
        LUMI
      </span>
    </span>
  )
}

// Reusable accessible icon link with an optional item counter.
function CountIcon({ count, label, href = '#', children, onClick, cartTarget = false, pulseKey = 0 }: CountIconProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      data-cart-target={cartTarget ? 'navbar' : undefined}
      aria-label={`${label}${count ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative grid size-6 place-items-center transition-opacity hover:opacity-55 sm:size-10"
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
          <div className="relative mx-auto flex h-[50px] max-w-[1440px] items-center px-1 min-[360px]:px-2 sm:h-[60px] sm:px-5 lg:px-8 xl:h-[70px] xl:px-10">
            {/* Navigation links live in the drawer at every breakpoint. */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              onClick={() => setMobileOpen((open) => !open)}
              className="grid size-8 shrink-0 place-items-center transition-opacity hover:opacity-55 min-[360px]:size-9 sm:size-10"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={21} />}
            </button>

            {/* Absolute positioning keeps the logo centered independently of
                the unequal controls on either side. */}
            <Link
              to="/"
              aria-label="Lumi home"
              onClick={() => setMobileOpen(false)}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
            >
              <LumiLogo />
            </Link>

            {/* Existing utility actions remain on the right at every width. */}
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-0.5">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls="site-search-modal"
                onClick={() => setSearchOpen(true)}
                className="grid size-6 place-items-center transition-opacity hover:opacity-55 sm:size-10"
              >
                <FiSearch size={18} strokeWidth={1.5} />
              </button>
              <Link
                to="/profile"
                aria-label="Account"
                className="grid size-6 place-items-center transition-opacity hover:opacity-55 sm:size-10"
              >
                <FiUser size={18} strokeWidth={1.5} />
              </Link>
              <span className="hidden sm:block">
                <CountIcon
                  count={wishlistCount}
                  label="Wishlist"
                  href="/wishlist"
                >
                  <FiHeart size={19} strokeWidth={1.5} />
                </CountIcon>
              </span>
              <span>
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
                className="hidden size-6 place-items-center transition-opacity hover:opacity-55 sm:grid sm:size-10"
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

      {/* Site navigation is rendered as an off-canvas drawer at every width. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-20 cursor-default bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              id={mobileMenuId}
              aria-label="Site navigation"
              className="fixed bottom-0 left-0 top-[78px] z-30 flex w-full flex-col overflow-y-auto overscroll-contain bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 text-ink min-[380px]:px-5 sm:top-[92px] sm:w-[88%] sm:max-w-[420px] sm:px-6 sm:pb-8 sm:pt-8 xl:top-[102px]"
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
              {/* Primary links use large, touch-friendly typography. */}
              <nav className="flex flex-col" aria-label="Primary navigation">
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
                <div className="flex flex-col">
                  {categories.map((category) => (
                    <Link
                      key={category.label}
                      to={category.to}
                      onClick={() => setMobileOpen(false)}
                      className="border-b border-line py-3.5 text-xs uppercase tracking-[0.12em]"
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* On phones, favorites and appearance controls live here
                  instead of being duplicated in the navbar. */}
              <div className="mt-auto flex flex-col border-t border-line pt-5 sm:hidden">
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 min-w-0 items-center gap-3 border-b border-line px-1 text-[9px] font-medium uppercase tracking-[0.12em]"
                >
                  <FiHeart size={16} />
                  Favorites{wishlistCount > 0 ? ` (${wishlistCount})` : ''}
                </Link>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex min-h-12 min-w-0 items-center gap-3 border-b border-line px-1 text-left text-[9px] font-medium uppercase tracking-[0.12em]"
                >
                  {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>

              <a
                href="tel:+2348005864000"
                className="pt-6 text-[9px] uppercase tracking-[0.12em] text-ink/50 transition-colors hover:text-ink sm:mt-auto sm:pt-8 sm:text-[10px] sm:tracking-[0.16em]"
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
