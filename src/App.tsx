import { useEffect } from 'react'
import { CategorySection } from './components/CategorySection'
import { FeaturedProducts } from './components/FeaturedProducts'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { NewsletterSection } from './components/NewsletterSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { ShopPage } from './pages/ShopPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'

function App() {
  const isShopPage = window.location.pathname === '/shop'
  const productMatch = window.location.pathname.match(/^\/product\/([^/]+)$/)

  // Restore direct links to page sections after React has rendered the content.
  useEffect(() => {
    if (!window.location.hash) return
    const target = document.querySelector(window.location.hash)
    if (!target) return

    // Direct page loads should land immediately; regular in-page links still
    // use the smooth scrolling rule from index.css.
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    target.scrollIntoView()
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior
    })
  }, [])

  return (
    // This wrapper provides the shared page background and theme colors.
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-300">
      {/* Global navigation is kept outside main so assistive technology
          can distinguish site navigation from page content. */}
      <Navbar />

      {productMatch ? (
        <ProductDetailsPage productId={decodeURIComponent(productMatch[1])} />
      ) : isShopPage ? (
        <ShopPage />
      ) : (
        /* Each homepage section is composed in this main content area. */
        <main aria-label="Store content">
          <Hero />
          <FeaturedProducts />
          <CategorySection />
          <TestimonialsSection />
          <NewsletterSection />
        </main>
      )}
      <Footer />
    </div>
  )
}

export default App
