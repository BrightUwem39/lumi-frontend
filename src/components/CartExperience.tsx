import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LuArrowRight as FiArrowRight, LuMinus as FiMinus, LuPlus as FiPlus, LuShoppingBag as FiShoppingBag, LuTrash2 as FiTrash2, LuX as FiX } from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useCartUiStore, type CartFlight } from '../store/useCartUiStore'
import { useShopStore } from '../store/useShopStore'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

// The flight, cart feedback, and drawer share one body-level presentation layer.
export function CartExperience() {
  return createPortal(
    <>
      <FlyToCart />
      <CartDrawer />
    </>,
    document.body,
  )
}

function FlyToCart() {
  const flight = useCartUiStore((state) => state.flight)
  const completeFlight = useCartUiStore((state) => state.completeFlight)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!flight || !reduceMotion) return
    completeFlight(flight.id)
  }, [completeFlight, flight, reduceMotion])

  return (
    <AnimatePresence>
      {flight && !reduceMotion && (
        <FlightImage
          key={flight.id}
          flight={flight}
          onComplete={() => completeFlight(flight.id)}
        />
      )}
    </AnimatePresence>
  )
}

function FlightImage({ flight, onComplete }: { flight: CartFlight; onComplete: () => void }) {
  const target = findVisibleCartTarget()
  const startWidth = Math.min(88, Math.max(42, flight.from.width * 0.32))
  const startHeight = startWidth * 1.25
  const startX = flight.from.left + (flight.from.width - startWidth) / 2
  const startY = flight.from.top + (flight.from.height - startHeight) / 2
  const endX = target.left + target.width / 2 - 10
  const endY = target.top + target.height / 2 - 13

  return (
    <motion.img
      src={flight.image}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[120] rounded-sm object-cover shadow-2xl"
      initial={{ x: startX, y: startY, width: startWidth, height: startHeight, opacity: 0.96, rotate: 0, scale: 1 }}
      animate={{
        x: endX,
        y: endY,
        width: 20,
        height: 26,
        opacity: [0.96, 1, 1, 0.15],
        rotate: [0, -6, 8, 0],
        scale: [1, 0.92, 0.72, 0.45],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], times: [0, 0.35, 0.8, 1] }}
      onAnimationComplete={onComplete}
    />
  )
}

function findVisibleCartTarget() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'))
  const target = targets.find((element) => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  })
  return target?.getBoundingClientRect() ?? new DOMRect(window.innerWidth - 44, 20, 40, 40)
}

function CartDrawer() {
  const open = useCartUiStore((state) => state.drawerOpen)
  const closeDrawer = useCartUiStore((state) => state.closeDrawer)
  const cartItems = useShopStore((state) => state.cartItems)
  const updateQuantity = useShopStore((state) => state.updateCartQuantity)
  const removeFromCart = useShopStore((state) => state.removeFromCart)
  const { products } = useCatalog()
  const reduceMotion = useReducedMotion()

  const items = useMemo(
    () => Object.entries(cartItems)
      .map(([id, quantity]) => {
        const product = products.find((item) => item.id === id)
        return product ? { product, quantity } : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    [cartItems, products],
  )
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeDrawer, open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label="Close cart drawer"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <div className="absolute inset-y-0 right-0 w-[92vw] max-w-[440px] [perspective:1500px]">
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-drawer-title"
              className="flex size-full origin-right flex-col bg-canvas text-ink shadow-[-30px_0_80px_rgba(0,0,0,0.24)] [transform-style:preserve-3d]"
              initial={reduceMotion ? { opacity: 0 } : { x: '104%', rotateY: -11, opacity: 0.7 }}
              animate={{ x: 0, rotateY: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '104%', rotateY: -8, opacity: 0.65 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="flex min-h-20 items-center justify-between border-b border-line px-4 sm:px-6">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-ink/45">Your selection</p>
                  <h2 id="cart-drawer-title" className="mt-1 text-2xl">Shopping bag</h2>
                </div>
                <button type="button" aria-label="Close cart drawer" onClick={closeDrawer} className="grid size-11 place-items-center rounded-full border border-line">
                  <FiX size={19} />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
                {items.length === 0 ? (
                  <div className="grid h-full place-items-center py-14 text-center">
                    <div>
                      <FiShoppingBag size={25} className="mx-auto text-ink/40" />
                      <p className="mt-4 text-lg">Your bag is empty.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {items.map(({ product, quantity }) => (
                      <motion.article key={product.id} layout className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3 py-5">
                        <img src={product.image} alt={product.name} className="aspect-[4/5] w-[72px] object-cover" />
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase tracking-[0.14em] text-ink/45">{product.category}</p>
                          <h3 className="mt-1 line-clamp-2 text-sm leading-5">{product.name}</h3>
                          <p className="mt-2 text-xs">{currency.format(product.price)}</p>
                          <div className="mt-3 flex h-9 w-fit items-center border border-line">
                            <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity - 1)} className="grid size-8 place-items-center"><FiMinus size={12} /></button>
                            <motion.span key={quantity} initial={reduceMotion ? false : { scale: 0.65, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="min-w-7 text-center text-[11px]">{quantity}</motion.span>
                            <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity + 1)} className="grid size-8 place-items-center"><FiPlus size={12} /></button>
                          </div>
                        </div>
                        <button type="button" aria-label={`Remove ${product.name}`} onClick={() => removeFromCart(product.id)} className="grid size-9 place-items-center text-ink/45 hover:text-ink"><FiTrash2 size={15} /></button>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>

              <footer className="border-t border-line p-4 sm:p-6">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <motion.strong key={subtotal} initial={reduceMotion ? false : { scale: 0.88 }} animate={{ scale: 1 }} className="font-display text-xl font-medium">{currency.format(subtotal)}</motion.strong>
                </div>
                <p className="mt-2 text-[9px] text-ink/45">Shipping and taxes calculated at checkout.</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link to="/cart" onClick={closeDrawer} className="flex min-h-12 items-center justify-center border border-ink px-3 text-[8px] uppercase tracking-[0.13em]">View bag</Link>
                  <Link to="/checkout" onClick={closeDrawer} className="flex min-h-12 items-center justify-center gap-2 bg-ink px-3 text-[8px] uppercase tracking-[0.13em] text-canvas">Checkout <FiArrowRight size={13} /></Link>
                </div>
              </footer>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
