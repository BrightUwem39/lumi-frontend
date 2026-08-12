import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { CategorySection } from './components/CategorySection'
import { CartExperience } from './components/CartExperience'
import { CommerceTools } from './components/CommerceTools'
import { FeaturedProducts } from './components/FeaturedProducts'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { NewsletterSection } from './components/NewsletterSection'
import { ScrollFadeSection } from './components/ScrollFadeSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { PaymentReturnPage } from './pages/PaymentReturnPage'
import { JournalPage } from './pages/JournalPage'
import { PolicyPage } from './pages/PolicyPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { WishlistPage } from './pages/WishlistPage'
import { useWishlistSync } from './hooks/useWishlistSync'
import { useCartSync } from './hooks/useCartSync'
import { useAuthStore } from './store/useAuthStore'

function HomePage() {
  return (
    <main aria-label="Store content">
      <ScrollFadeSection>
        <Hero />
      </ScrollFadeSection>
      <ScrollFadeSection>
        <FeaturedProducts />
      </ScrollFadeSection>
      <ScrollFadeSection>
        <CategorySection />
      </ScrollFadeSection>
      <ScrollFadeSection>
        <TestimonialsSection />
      </ScrollFadeSection>
      <ScrollFadeSection>
        <NewsletterSection />
      </ScrollFadeSection>
    </main>
  )
}

// Route parameters keep every product detail URL bookmarkable and shareable.
function ProductRoute() {
  const { productId = '' } = useParams()
  return <ProductDetailsPage productId={productId} />
}

// Route changes start at the top, while homepage hash links retain smooth scrolling.
function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView()
      })
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location])

  return null
}

function App() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const routeKey = `${location.pathname}${location.search}`
  const initializeAuthentication = useAuthStore((state) => state.initialize)
  useWishlistSync()
  useCartSync()

  useEffect(() => {
    void initializeAuthentication()
  }, [initializeAuthentication])

  return (
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-300">
      <ScrollManager />
      <Navbar />
      <CartExperience />

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
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/policies/:policyId" element={<PolicyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      <CommerceTools />
      <Footer />
    </div>
  )
}

export default App
