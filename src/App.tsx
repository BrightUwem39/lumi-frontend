import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { CategorySection } from './components/CategorySection'
import { CommerceTools } from './components/CommerceTools'
import { FeaturedProducts } from './components/FeaturedProducts'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { NewsletterSection } from './components/NewsletterSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { JournalPage } from './pages/JournalPage'
import { PolicyPage } from './pages/PolicyPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { WishlistPage } from './pages/WishlistPage'

function HomePage() {
  return (
    <main aria-label="Store content">
      <Hero />
      <FeaturedProducts />
      <CategorySection />
      <TestimonialsSection />
      <NewsletterSection />
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

  return (
    <div className="min-h-screen overflow-x-clip bg-canvas text-ink transition-colors duration-300">
      <ScrollManager />
      <Navbar />

      {/* Route content fades gently without delaying navigation or feeling theatrical. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${location.pathname}${location.search}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
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
