import { useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  LuArrowLeft as FiArrowLeft,
  LuCheck as FiCheck,
  LuMinus as FiMinus,
  LuPlus as FiPlus,
  LuShoppingBag as FiShoppingBag,
  LuTrash2 as FiTrash2,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { PageLoadingSkeleton } from '../components/LoadingSkeleton'
import { PageReveal } from '../components/PageReveal'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export function CartPage() {
  const reduceMotion = useReducedMotion()
  const { products, status: catalogStatus } = useCatalog()
  const cartItems = useShopStore((state) => state.cartItems)
  const updateCartQuantity = useShopStore((state) => state.updateCartQuantity)
  const removeFromCart = useShopStore((state) => state.removeFromCart)
  const [coupon, setCoupon] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [discountRate, setDiscountRate] = useState(0)

  // Product records and stored quantities are joined for display and totals.
  const items = useMemo(
    () =>
      Object.entries(cartItems)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === id)
          return product ? { product, quantity } : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [cartItems, products],
  )

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const discount = subtotal * discountRate
  const shipping = subtotal === 0 || subtotal >= 250 ? 0 : 18
  const total = subtotal - discount + shipping
  const remainingForFreeShipping = Math.max(0, 250 - subtotal)

  const applyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (coupon.trim().toUpperCase() === 'LUMI10') {
      setDiscountRate(0.1)
      setCouponMessage('LUMI10 applied — you saved 10%.')
    } else {
      setDiscountRate(0)
      setCouponMessage('That code is not valid. Try LUMI10.')
    }
  }

  return (
    <main className="w-full min-w-0 overflow-x-clip bg-canvas px-3 py-6 text-ink min-[380px]:px-4 min-[380px]:py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <PageReveal>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55 hover:text-ink"
          >
            <FiArrowLeft size={14} />
            Continue shopping
          </Link>

          <div className="mt-6 flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-6">
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
                Your selection
              </p>
              <h1 className="text-4xl sm:text-5xl">Shopping bag</h1>
            </div>
            <p className="shrink-0 pb-1 text-xs text-ink/50">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </PageReveal>

        <PageReveal delay={0.08}>
          {catalogStatus === 'loading' && Object.keys(cartItems).length > 0 ? (
            <PageLoadingSkeleton variant="cart" />
          ) : items.length === 0 ? (
            <EmptyCart />
          ) : (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-12">
            <section aria-label="Cart products">
              {/* Column labels only appear when the row has a table-like layout. */}
              <div className="hidden grid-cols-[1fr_100px_130px_44px] gap-4 border-b border-line pb-3 text-[8px] uppercase tracking-[0.16em] text-ink/45 sm:grid">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span className="sr-only">Remove</span>
              </div>

              <div className="divide-y divide-line">
                <AnimatePresence initial={!reduceMotion}>
                {items.map(({ product, quantity }, index) => (
                  <motion.article
                    key={product.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 14 }}
                    transition={{ duration: 0.28, delay: reduceMotion ? 0 : index * 0.035 }}
                    className="grid grid-cols-[80px_minmax(0,1fr)_40px] gap-x-3 gap-y-3 py-5 min-[380px]:grid-cols-[88px_minmax(0,1fr)_40px] min-[380px]:gap-x-4 min-[380px]:gap-y-4 min-[380px]:py-6 sm:grid-cols-[1fr_100px_130px_44px] sm:items-center sm:gap-4"
                  >
                    <div className="col-span-2 flex min-w-0 gap-3 min-[380px]:gap-4 sm:col-span-1">
                      <Link
                        to={`/product/${product.id}`}
                        className="aspect-[4/5] w-20 shrink-0 overflow-hidden bg-[#e8e5df] min-[380px]:w-[88px] sm:w-24"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0 self-center">
                        <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
                          {product.brand} · {product.category}
                        </p>
                        <h2 className="mt-1.5 line-clamp-2 text-base leading-5 min-[380px]:text-lg">
                          <Link to={`/product/${product.id}`}>
                            {product.name}
                          </Link>
                        </h2>
                        <p className="mt-2 text-[10px] text-ink/50">
                          Color: {product.color}
                        </p>
                      </div>
                    </div>

                    <p className="col-start-2 text-sm sm:col-auto">
                      {currency.format(product.price)}
                    </p>

                    <div className="col-start-2 flex h-11 w-fit items-center border border-line sm:col-auto">
                      <button
                        type="button"
                        aria-label={`Decrease ${product.name} quantity`}
                        onClick={() =>
                          updateCartQuantity(product.id, quantity - 1)
                        }
                        className="grid size-10 place-items-center"
                      >
                        <FiMinus size={13} />
                      </button>
                      <motion.span
                        key={quantity}
                        initial={reduceMotion ? false : { scale: 0.65, opacity: 0.45 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="min-w-8 text-center text-xs"
                      >
                        {quantity}
                      </motion.span>
                      <button
                        type="button"
                        aria-label={`Increase ${product.name} quantity`}
                        onClick={() =>
                          updateCartQuantity(product.id, quantity + 1)
                        }
                        className="grid size-10 place-items-center"
                      >
                        <FiPlus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${product.name} from cart`}
                      onClick={() => removeFromCart(product.id)}
                      className="col-start-3 row-start-1 grid size-10 place-items-center text-ink/45 transition-colors hover:text-ink sm:col-auto sm:row-auto"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </motion.article>
                ))}
                </AnimatePresence>
              </div>
            </section>

            <aside className="min-w-0 w-full overflow-hidden border border-line p-4 min-[380px]:p-5 sm:p-7 lg:ml-auto lg:max-w-xl xl:sticky xl:top-32 xl:ml-0 xl:max-w-none">
              <h2 className="text-xl min-[380px]:text-2xl">Order summary</h2>

              {/* The coupon is intentionally frontend-only until checkout APIs exist. */}
              <form onSubmit={applyCoupon} className="mt-6">
                <label
                  htmlFor="coupon-code"
                  className="text-[9px] font-medium uppercase tracking-[0.16em]"
                >
                  Coupon code
                </label>
                <div className="mt-3 flex min-w-0 flex-col border-b border-ink min-[380px]:flex-row min-[380px]:items-center">
                  <input
                    id="coupon-code"
                    value={coupon}
                    onChange={(event) => {
                      setCoupon(event.target.value)
                      setCouponMessage('')
                    }}
                    placeholder="Enter code"
                    className="min-h-11 w-full min-w-0 flex-1 bg-transparent text-xs uppercase outline-none placeholder:normal-case placeholder:text-ink/35 min-[380px]:min-h-12"
                  />
                  <button
                    type="submit"
                    className="min-h-10 self-end px-1 text-[9px] font-medium uppercase tracking-[0.14em] min-[380px]:self-auto min-[380px]:px-3 min-[380px]:tracking-[0.15em]"
                  >
                    Apply
                  </button>
                </div>
                <p
                  aria-live="polite"
                  className="min-h-8 pt-2 text-[10px] text-ink/55"
                >
                  {couponMessage}
                </p>
              </form>

              <div className="mt-2 space-y-4 border-y border-line py-5 text-xs">
                <SummaryRow label="Subtotal" value={currency.format(subtotal)} />
                {discount > 0 && (
                  <SummaryRow
                    label="Coupon discount"
                    value={`−${currency.format(discount)}`}
                  />
                )}
                <SummaryRow
                  label="Shipping"
                  value={shipping === 0 ? 'Free' : currency.format(shipping)}
                />
              </div>

              {remainingForFreeShipping > 0 ? (
                <p className="mt-4 text-[10px] leading-5 text-ink/55">
                  Add {currency.format(remainingForFreeShipping)} more for free
                  shipping.
                </p>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-[10px] text-ink/60">
                  <FiCheck size={13} />
                  You qualify for free shipping.
                </p>
              )}

              <div className="mt-6 flex min-w-0 items-end justify-between gap-3">
                <span className="text-sm">Total</span>
                <strong className="min-w-0 text-right font-display text-2xl font-medium min-[380px]:text-3xl">
                  {currency.format(total)}
                </strong>
              </div>
              <p className="mt-2 text-right text-[9px] text-ink/45">
                Taxes calculated at checkout
              </p>

              <Link
                to="/checkout"
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-3 text-[8px] font-medium uppercase tracking-[0.11em] text-canvas min-[380px]:min-h-13 min-[380px]:gap-3 min-[380px]:px-5 min-[380px]:text-[9px] min-[380px]:tracking-[0.16em]"
              >
                <FiShoppingBag size={15} />
                Proceed to checkout
              </Link>
            </aside>
          </div>
          )}
        </PageReveal>
      </div>
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 text-ink/55">{label}</span>
      <span className="shrink-0 text-right">{value}</span>
    </div>
  )
}

function EmptyCart() {
  return (
    <section className="grid min-h-[52svh] place-items-center text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-line">
          <FiShoppingBag size={20} />
        </span>
        <h2 className="mt-5 text-2xl">Your bag is empty.</h2>
        <p className="mt-2 text-sm text-ink/55">
          A good place to start is with the latest collection.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-canvas min-[380px]:w-auto min-[380px]:px-7 min-[380px]:tracking-[0.17em]"
        >
          Shop the collection
        </Link>
      </div>
    </section>
  )
}
