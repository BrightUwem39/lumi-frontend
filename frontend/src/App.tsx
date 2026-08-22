import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { CartExperience } from './components/CartExperience'
import { CommerceTools } from './components/CommerceTools'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { useWishlistSync } from './hooks/useWishlistSync'
import { useCartSync } from './hooks/useCartSync'
import { useAuthStore } from './store/useAuthStore'

// Route-level chunks keep the storefront entry small and avoid loading the
// administrator workspace until an administrator actually opens it.
const CartPage = lazy(async () => ({ default: (await import('./pages/CartPage')).CartPage }))
const HomePage = lazy(async () => ({ default: (await import('./pages/HomePage')).HomePage }))
const CheckoutPage = lazy(async () => ({ default: (await import('./pages/CheckoutPage')).CheckoutPage }))
const OrderConfirmationPage = lazy(async () => ({ default: (await import('./pages/OrderConfirmationPage')).OrderConfirmationPage }))
const PaymentReturnPage = lazy(async () => ({ default: (await import('./pages/PaymentReturnPage')).PaymentReturnPage }))
const JournalPage = lazy(async () => ({ default: (await import('./pages/JournalPage')).JournalPage }))
const PolicyPage = lazy(async () => ({ default: (await import('./pages/PolicyPage')).PolicyPage }))
const ProductDetailsPage = lazy(async () => ({ default: (await import('./pages/ProductDetailsPage')).ProductDetailsPage }))
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }))
const ShopPage = lazy(async () => ({ default: (await import('./pages/ShopPage')).ShopPage }))
const WishlistPage = lazy(async () => ({ default: (await import('./pages/WishlistPage')).WishlistPage }))
const AdminPage = lazy(async () => ({ default: (await import('./pages/AdminPage')).AdminPage }))

// Route parameters keep every product detail URL bookmarkable and shareable.
function ProductRoute() {
  const { productId = '' } = useParams()
  return <ProductDetailsPage productId={productId} />
}

// Route changes start at the top, while homepage hash links retain smooth scrolling.
function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    let settleTimer: number | undefined

    if (location.hash) {
      settleTimer = window.setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView()
      }, 380)
    } else {
      const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'auto' })
      scrollToTop()
      // AnimatePresence renders the incoming route after the outgoing route exits.
      // Reset once more when that transition has settled so short pages do not
      // inherit the previous page's scroll position.
      settleTimer = window.setTimeout(scrollToTop, 380)
    }

    return () => window.clearTimeout(settleTimer)
  }, [location.hash, location.pathname, location.search])

  return null
}

function App() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const routeKey = `${location.pathname}${location.search}`
  const initializeAuthentication = useAuthStore((state) => state.initialize)
  const authStatus = useAuthStore((state) => state.status)
  const isGuestAccountRoute =
    location.pathname === '/profile' && authStatus !== 'authenticated'
  const isAdminRoute = location.pathname.startsWith('/admin')
  useWishlistSync()
  useCartSync()

  useEffect(() => {
    void initializeAuthentication()
  }, [initializeAuthentication])

  return (
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-300">
      <ScrollManager />
      {!isGuestAccountRoute && !isAdminRoute && <Navbar />}
      {!isGuestAccountRoute && !isAdminRoute && <CartExperience />}

      {/* An NProgress-style bar advances in stages before completing and fading. */}
      <div
        key={`progress-${routeKey}`}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden"
      >
        <motion.div
          className="relative h-full origin-left bg-ink"
          initial={reduceMotion ? false : { scaleX: 0.04, opacity: 1 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { scaleX: [0.04, 0.62, 0.84, 1], opacity: [1, 1, 1, 0] }
          }
          transition={{
            duration: reduceMotion ? 0 : 0.92,
            times: [0, 0.28, 0.72, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="absolute right-0 top-0 h-full w-20 translate-x-1/3 bg-gradient-to-r from-transparent to-ink opacity-80 blur-[2px]" />
        </motion.div>
      </div>

      {/* Route content fades and travels horizontally so navigation never feels like a hard cut. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeKey}
          className="min-w-0 w-full overflow-x-clip"
          initial={reduceMotion ? false : { opacity: 0, x: 18, y: 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12, y: -5 }}
          transition={{
            duration: reduceMotion ? 0 : 0.34,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Suspense fallback={<RouteLoading />}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:productId" element={<ProductRoute />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/order-confirmation/:orderNumber"
                element={<OrderConfirmationPage />}
              />
              <Route path="/payment-return" element={<PaymentReturnPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin/*" element={<AdminPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/policies/:policyId" element={<PolicyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {!isGuestAccountRoute && !isAdminRoute && <CommerceTools />}
      {!isGuestAccountRoute && !isAdminRoute && <Footer />}
    </div>
  )
}

function RouteLoading() {
  return <main role="status" className="grid min-h-[65svh] place-items-center bg-canvas px-4 text-center text-ink"><p className="text-[9px] font-medium uppercase tracking-[0.18em]">Loading Lumi…</p></main>
}

export default App
