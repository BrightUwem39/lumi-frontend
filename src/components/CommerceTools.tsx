import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LuCheck as FiCheck,
  LuLayers as FiLayers,
  LuShoppingBag as FiShoppingBag,
  LuStar as FiStar,
  LuX as FiX,
} from 'react-icons/lu'
import { Link, useLocation } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'
import { createCartFlight, useCartUiStore } from '../store/useCartUiStore'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

// Fixed commerce tools stay available without competing with primary navigation.
export function CommerceTools() {
  const { pathname } = useLocation()
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const cartCount = useShopStore((state) => state.cartCount)
  const openCartDrawer = useCartUiStore((state) => state.openDrawer)
  const cartPulseKey = useCartUiStore((state) => state.pulseKey)
  const comparisonItems = useShopStore((state) => state.comparisonItems)
  const clearComparison = useShopStore((state) => state.clearComparison)
  const { products } = useCatalog()
  const comparedProducts = products.filter((product) =>
    comparisonItems.includes(product.id),
  )
  const isShoppingRoute =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname.startsWith('/product/')

  // Measure the real button position on scroll. This is more dependable than an
  // intersection threshold when route and footer animations change page height.
  useEffect(() => {
    const backToTop = document.getElementById('footer-back-to-top')
    if (!backToTop) return

    let frameId = 0

    const updateVisibility = () => {
      const rect = backToTop.getBoundingClientRect()
      // Allow the cart's fade transition to finish just before the button appears.
      const cartClearance = 80
      setFooterVisible(
        rect.top < window.innerHeight + cartClearance && rect.bottom > 0,
      )
    }

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  // Floating commerce controls should not cover legal, account, or checkout content.
  if (!isShoppingRoute) return null

  return (
    <>
      {/* Floating cart shifts upward while the comparison tray is visible. */}
      <Link
        to="/cart"
        data-cart-target="floating"
        onClick={(event) => {
          event.preventDefault()
          openCartDrawer()
        }}
        aria-hidden={footerVisible}
        tabIndex={footerVisible ? -1 : undefined}
        aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        className={`fixed right-3 z-30 size-11 items-center justify-center rounded-full bg-ink text-canvas shadow-xl transition-all duration-300 sm:right-6 sm:size-12 ${
          comparedProducts.length ? 'bottom-24 sm:bottom-20' : 'bottom-5 sm:bottom-6'
        } ${cartCount === 0 || pathname === '/' ? 'hidden sm:flex' : 'flex'} ${footerVisible ? 'pointer-events-none translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <motion.span
          key={cartPulseKey}
          className="grid place-items-center"
          initial={cartPulseKey > 0 ? { scale: 0.78, rotate: 0 } : false}
          animate={cartPulseKey > 0 ? { scale: [0.78, 1.3, 0.94, 1], rotate: [0, -9, 6, 0] } : undefined}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          <FiShoppingBag size={17} />
        </motion.span>
      </Link>

      <AnimatePresence>
        {!footerVisible && comparedProducts.length > 0 && (
          <motion.aside
            aria-label="Product comparison"
            className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl items-center gap-2 border border-line bg-canvas p-2.5 text-ink shadow-2xl min-[380px]:gap-3 min-[380px]:p-3 sm:inset-x-6 sm:bottom-4 sm:px-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-ink text-canvas min-[380px]:grid">
              <FiLayers size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em]">
                Compare products
              </p>
              <p className="mt-0.5 text-[9px] text-ink/45">
                {comparedProducts.length} of 3 selected
              </p>
            </div>
            <div className="hidden -space-x-2 min-[440px]:flex">
              {comparedProducts.map((product) => (
                <img
                  key={product.id}
                  src={product.image}
                  alt=""
                  className="size-9 rounded-full border-2 border-canvas object-cover"
                />
              ))}
            </div>
            <button
              type="button"
              disabled={comparedProducts.length < 2}
              onClick={() => setComparisonOpen(true)}
              className="min-h-10 shrink-0 bg-ink px-3 text-[8px] font-medium uppercase tracking-[0.13em] text-canvas disabled:cursor-not-allowed disabled:opacity-35 sm:px-5 sm:text-[9px]"
            >
              Compare
            </button>
            <button
              type="button"
              aria-label="Clear comparison"
              onClick={clearComparison}
              className="grid size-9 shrink-0 place-items-center"
            >
              <FiX size={17} />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <ComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />
    </>
  )
}

function ComparisonModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const comparisonItems = useShopStore((state) => state.comparisonItems)
  const { products } = useCatalog()
  const toggleComparison = useShopStore((state) => state.toggleComparison)
  const addToCart = useShopStore((state) => state.addToCart)
  const launchCartFlight = useCartUiStore((state) => state.launchFlight)
  const comparedProducts = products.filter((product) =>
    comparisonItems.includes(product.id),
  )

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-2 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close product comparison"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-title"
            className="relative z-10 max-h-[94svh] w-full max-w-5xl overflow-y-auto bg-canvas p-4 text-ink sm:p-7"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-ink/45">
                  Side by side
                </p>
                <h2 id="comparison-title" className="mt-1 text-2xl sm:text-3xl">
                  Product comparison
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close comparison"
                onClick={onClose}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line"
              >
                <FiX size={19} />
              </button>
            </div>

            {/* Horizontal scrolling preserves readable columns on small screens. */}
            <div className="no-scrollbar mt-6 overflow-x-auto">
              <div
                className="grid min-w-[620px] gap-px bg-line"
                style={{
                  gridTemplateColumns: `120px repeat(${comparedProducts.length}, minmax(160px, 1fr))`,
                }}
              >
                <div className="bg-canvas p-3" />
                {comparedProducts.map((product) => (
                  <div key={product.id} className="relative bg-canvas p-3">
                    <button
                      type="button"
                      aria-label={`Remove ${product.name} from comparison`}
                      onClick={() => toggleComparison(product.id)}
                      className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full bg-white text-[#171713]"
                    >
                      <FiX size={14} />
                    </button>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <h3 className="mt-3 text-sm">{product.name}</h3>
                  </div>
                ))}
                <CompareLabel>Price</CompareLabel>
                {comparedProducts.map((product) => (
                  <CompareValue key={product.id}>
                    {currency.format(product.price)}
                  </CompareValue>
                ))}
                <CompareLabel>Category</CompareLabel>
                {comparedProducts.map((product) => (
                  <CompareValue key={product.id}>{product.category}</CompareValue>
                ))}
                <CompareLabel>Rating</CompareLabel>
                {comparedProducts.map((product) => (
                  <CompareValue key={product.id}>
                    <span className="flex items-center gap-1.5">
                      <FiStar size={12} fill="currentColor" />
                      {product.rating} ({product.reviewCount})
                    </span>
                  </CompareValue>
                ))}
                <CompareLabel>Availability</CompareLabel>
                {comparedProducts.map((product) => (
                  <CompareValue key={product.id}>
                    <span className="flex items-center gap-1.5">
                      {product.available && <FiCheck size={12} />}
                      {product.available ? 'In stock' : 'Out of stock'}
                    </span>
                  </CompareValue>
                ))}
                <div className="bg-canvas p-3" />
                {comparedProducts.map((product) => (
                  <div key={product.id} className="bg-canvas p-3">
                    <button
                      type="button"
                      disabled={!product.available}
                      onClick={(event) => {
                        addToCart(product.id)
                        launchCartFlight(
                          createCartFlight(
                            product.image,
                            product.name,
                            event.currentTarget,
                          ),
                        )
                        onClose()
                      }}
                      className="min-h-11 w-full bg-ink px-3 text-[8px] uppercase tracking-[0.13em] text-canvas disabled:opacity-35"
                    >
                      Add to cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  )
}

function CompareLabel({ children }: { children: string }) {
  return (
    <div className="bg-canvas p-3 text-[8px] font-medium uppercase tracking-[0.13em] text-ink/45">
      {children}
    </div>
  )
}

function CompareValue({ children }: { children: React.ReactNode }) {
  return <div className="bg-canvas p-3 text-xs">{children}</div>
}
