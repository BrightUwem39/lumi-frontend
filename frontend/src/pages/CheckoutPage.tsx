import { useMemo, useRef, useState, type FormEvent } from 'react'
import { LuArrowLeft, LuLock, LuPackageCheck } from 'react-icons/lu'
import { Link, useNavigate } from 'react-router-dom'
import { PageLoadingSkeleton } from '../components/LoadingSkeleton'
import { PageReveal } from '../components/PageReveal'
import { useCatalog } from '../hooks/useCatalog'
import { LAST_ORDER_STORAGE_KEY, type DemoOrder } from '../lib/order'
import { formatMoney } from '../lib/currency'
import { ApiError } from '../services/api'
import { createOrderDraft } from '../services/checkout'
import { useShopStore } from '../store/useShopStore'

export function CheckoutPage() {
  const { products, status } = useCatalog()
  const cartItems = useShopStore((state) => state.cartItems)
  const cartSizes = useShopStore((state) => state.cartSizes)
  const clearCart = useShopStore((state) => state.clearCart)
  const couponCode = useShopStore((state) => state.couponCode)
  const navigate = useNavigate()
  const idempotencyKey = useRef(crypto.randomUUID())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const items = useMemo(
    () => Object.entries(cartItems).flatMap(([id, quantity]) => {
      const product = products.find((candidate) => candidate.id === id)
      return product ? [{ product, quantity, size: cartSizes[id] }] : []
    }),
    [cartItems, cartSizes, products],
  )
  const estimate = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const cartCurrency = items[0]?.product.currency ?? 'NGN'

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const order = await createOrderDraft({
        email: String(data.get('email')),
        firstName: String(data.get('firstName')),
        lastName: String(data.get('lastName')),
        phone: String(data.get('phone')),
        line1: String(data.get('line1')),
        line2: String(data.get('line2') ?? '') || undefined,
        city: String(data.get('city')),
        region: String(data.get('region')),
        postalCode: String(data.get('postalCode') ?? '') || undefined,
        country: String(data.get('country')),
        ...(couponCode ? { couponCode } : {}),
      }, idempotencyKey.current)
      const receipt: DemoOrder = {
        orderNumber: order.number,
        placedAt: order.createdAt,
        customerName: order.shippingName,
        email: order.email,
        deliveryAddress: [
          order.shippingAddress.line1, order.shippingAddress.line2,
          order.shippingAddress.city, order.shippingAddress.region,
          order.shippingAddress.country,
        ].filter(Boolean).join(', '),
        estimatedDelivery: 'Available after payment confirmation',
        paymentMethod: 'Payment not initiated',
        items: order.items.map((item, index) => ({
          id: `${order.number}-${index}`,
          name: item.name,
          image: item.image ?? '',
          quantity: item.quantity,
          price: Number(item.unitPrice),
        })),
        subtotal: Number(order.subtotal),
        discount: Number(order.discountTotal),
        couponCode: order.couponCode,
        shipping: Number(order.shippingTotal),
        total: Number(order.total),
      }
      sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(receipt))
      clearCart()
      navigate(`/order-confirmation/${order.number}`, { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Checkout is temporarily unavailable.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' && items.length) return <PageLoadingSkeleton variant="checkout" />
  if (!items.length) return <EmptyCheckout />

  return (
    <main className="min-h-[70svh] bg-canvas px-4 py-7 text-ink sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <PageReveal className="border-b border-line pb-5">
          <Link to="/cart" className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-ink/50">
            <LuArrowLeft size={13} /> Back to cart
          </Link>
          <h1 className="mt-4 text-4xl sm:text-5xl">Create order draft</h1>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-ink/55">
            Lumi will validate your bag and calculate the final totals on the server. No payment details are collected and nothing will be charged.
          </p>
        </PageReveal>

        <form onSubmit={submit} className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="border border-line p-5 sm:p-7">
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink/45">Shipping</p>
            <h2 className="mt-2 text-2xl">Delivery details</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" autoComplete="given-name" />
              <Field label="Last name" name="lastName" autoComplete="family-name" />
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
              <Field label="Street address" name="line1" autoComplete="address-line1" className="sm:col-span-2" />
              <Field label="Apartment (optional)" name="line2" required={false} autoComplete="address-line2" className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" />
              <Field label="State / region" name="region" autoComplete="address-level1" />
              <Field label="Postal code (optional)" name="postalCode" required={false} autoComplete="postal-code" />
              <label>
                <Label>Country</Label>
                <select name="country" defaultValue="NG" required className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm">
                  <option value="NG">Nigeria</option><option value="GB">United Kingdom</option>
                  <option value="US">United States</option><option value="CA">Canada</option><option value="FR">France</option>
                </select>
              </label>
            </div>
          </section>

          <aside className="border border-line p-5 lg:sticky lg:top-28">
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink/45">Order review</p>
            <div className="mt-5 divide-y divide-line">
              {items.map(({ product, quantity, size }) => (
                <div key={product.id} className="flex gap-3 py-4 first:pt-0">
                  <img src={product.image} alt="" className="h-16 w-13 object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm">{product.name}</p>
                    <p className="mt-1 text-[9px] text-ink/45">Qty {quantity}{size ? ` · Size ${size}` : ''}</p></div>
                  <span className="text-xs">{formatMoney(product.price * quantity, product.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm">
              <span>Browser estimate</span><span>{formatMoney(estimate, cartCurrency)}</span>
            </div>
            {couponCode && <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em]">Discount code: {couponCode}</p>}
            <p className="mt-3 text-[9px] leading-4 text-ink/45">The API will replace this estimate with authoritative product and shipping totals.</p>
            {error && <p role="alert" className="mt-4 text-xs leading-5 text-red-700">{error}</p>}
            <button disabled={submitting} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-[9px] uppercase tracking-[0.14em] text-canvas disabled:opacity-50">
              <LuLock size={13} /> {submitting ? 'Creating draft…' : 'Create order draft'}
            </button>
          </aside>
        </form>
      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', required = true, autoComplete, className = '' }: {
  label: string; name: string; type?: string; required?: boolean; autoComplete: string; className?: string
}) {
  return <label className={className}><Label>{label}</Label><input name={name} type={type} required={required} autoComplete={autoComplete} className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-ink" /></label>
}

function Label({ children }: { children: string }) {
  return <span className="block text-[9px] font-medium uppercase tracking-[0.14em]">{children}</span>
}

function EmptyCheckout() {
  return <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 text-center text-ink"><div><LuPackageCheck size={28} className="mx-auto" /><h1 className="mt-5 text-3xl">Your bag is empty.</h1><Link to="/shop" className="mt-6 inline-flex min-h-12 items-center bg-ink px-7 text-[9px] uppercase tracking-[0.15em] text-canvas">Return to shop</Link></div></main>
}
