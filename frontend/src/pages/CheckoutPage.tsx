import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { LuArrowLeft, LuCheck, LuLock, LuMapPin, LuPackageCheck } from 'react-icons/lu'
import { Link, useNavigate } from 'react-router-dom'
import { PageLoadingSkeleton } from '../components/LoadingSkeleton'
import { PageReveal } from '../components/PageReveal'
import { useCatalog } from '../hooks/useCatalog'
import { LAST_ORDER_STORAGE_KEY, type DemoOrder } from '../lib/order'
import { formatMoney } from '../lib/currency'
import { ApiError } from '../services/api'
import { createOrderDraft } from '../services/checkout'
import { fetchAddresses, type SavedAddress } from '../services/addresses'
import { useAuthStore } from '../store/useAuthStore'
import { useShopStore } from '../store/useShopStore'

type DeliveryDetails = {
  email: string
  firstName: string
  lastName: string
  phone: string
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
  country: string
}

const emptyDelivery: DeliveryDetails = {
  email: '', firstName: '', lastName: '', phone: '', line1: '', line2: '',
  city: '', region: '', postalCode: '', country: 'NG',
}

export function CheckoutPage() {
  const { products, status } = useCatalog()
  const cartItems = useShopStore((state) => state.cartItems)
  const cartSizes = useShopStore((state) => state.cartSizes)
  const clearCart = useShopStore((state) => state.clearCart)
  const couponCode = useShopStore((state) => state.couponCode)
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const idempotencyKey = useRef(crypto.randomUUID())
  const deliveryTouched = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [delivery, setDelivery] = useState<DeliveryDetails>(emptyDelivery)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState('manual')
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressesError, setAddressesError] = useState('')
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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return
    let active = true
    setAddressesLoading(true)
    setAddressesError('')
    fetchAddresses()
      .then(({ items: savedAddresses }) => {
        if (!active) return
        setAddresses(savedAddresses)
        const preferred = savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0]
        if (preferred && !deliveryTouched.current) {
          setSelectedAddress(preferred.id)
          setDelivery(deliveryFromAddress(preferred, user.email))
        } else if (!deliveryTouched.current) {
          setDelivery((current) => ({
            ...current,
            email: current.email || user.email,
            firstName: current.firstName || user.firstName || '',
            lastName: current.lastName || user.lastName || '',
          }))
        }
      })
      .catch((caught) => {
        if (active) setAddressesError(caught instanceof ApiError ? caught.message : 'Saved addresses could not be loaded.')
      })
      .finally(() => { if (active) setAddressesLoading(false) })
    return () => { active = false }
  }, [authStatus, user])

  const chooseAddress = (address: SavedAddress) => {
    deliveryTouched.current = true
    setSelectedAddress(address.id)
    setDelivery(deliveryFromAddress(address, user?.email ?? delivery.email))
  }
  const chooseManual = () => {
    deliveryTouched.current = true
    setSelectedAddress('manual')
    setDelivery({
      ...emptyDelivery,
      email: user?.email ?? delivery.email,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    })
  }
  const setDeliveryValue = (key: keyof DeliveryDetails, value: string) => {
    deliveryTouched.current = true
    setSelectedAddress('manual')
    setDelivery((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const order = await createOrderDraft({
        email: delivery.email,
        firstName: delivery.firstName,
        lastName: delivery.lastName,
        phone: delivery.phone,
        line1: delivery.line1,
        line2: delivery.line2 || undefined,
        city: delivery.city,
        region: delivery.region,
        postalCode: delivery.postalCode || undefined,
        country: delivery.country,
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
        tax: Number(order.taxTotal),
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
            {authStatus === 'authenticated' && (addressesLoading || addresses.length > 0 || addressesError) && <div className="mt-6 border-y border-line py-5">
              <div className="flex items-center gap-2"><LuMapPin size={15} /><h3 className="text-[9px] font-medium uppercase tracking-[0.15em]">Choose a saved address</h3></div>
              {addressesLoading && <p className="mt-3 text-xs text-ink/50">Loading your saved addresses…</p>}
              {addressesError && <p role="alert" className="mt-3 text-xs leading-5 text-red-700">{addressesError} You can still enter the delivery details manually.</p>}
              {addresses.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{addresses.map((address) => {
                const selected = selectedAddress === address.id
                return <button key={address.id} type="button" aria-pressed={selected} onClick={() => chooseAddress(address)} className={`min-w-0 border p-4 text-left transition-colors ${selected ? 'border-ink bg-ink text-canvas' : 'border-line hover:border-ink'}`}><span className="flex items-start justify-between gap-3"><span className="min-w-0"><strong className="block truncate text-sm font-medium">{address.label || 'Delivery address'}</strong><span className={`mt-1 block truncate text-[10px] ${selected ? 'text-canvas/65' : 'text-ink/50'}`}>{address.line1}, {address.city}</span></span>{selected && <LuCheck className="shrink-0" />}</span>{address.isDefault && <span className={`mt-3 block text-[8px] uppercase tracking-[0.14em] ${selected ? 'text-canvas/65' : 'text-ink/45'}`}>Default address</span>}</button>
              })}<button type="button" aria-pressed={selectedAddress === 'manual'} onClick={chooseManual} className={`min-h-20 border p-4 text-left text-[9px] font-medium uppercase tracking-[0.13em] transition-colors ${selectedAddress === 'manual' ? 'border-ink bg-ink text-canvas' : 'border-dashed border-line hover:border-ink'}`}>Use a different address</button></div>}
            </div>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" autoComplete="given-name" value={delivery.firstName} onChange={(value) => setDeliveryValue('firstName', value)} />
              <Field label="Last name" name="lastName" autoComplete="family-name" value={delivery.lastName} onChange={(value) => setDeliveryValue('lastName', value)} />
              <Field label="Email" name="email" type="email" autoComplete="email" value={delivery.email} onChange={(value) => setDeliveryValue('email', value)} />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" value={delivery.phone} onChange={(value) => setDeliveryValue('phone', value)} />
              <Field label="Street address" name="line1" autoComplete="address-line1" value={delivery.line1} onChange={(value) => setDeliveryValue('line1', value)} className="sm:col-span-2" />
              <Field label="Apartment (optional)" name="line2" required={false} autoComplete="address-line2" value={delivery.line2} onChange={(value) => setDeliveryValue('line2', value)} className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" value={delivery.city} onChange={(value) => setDeliveryValue('city', value)} />
              <Field label="State / region" name="region" autoComplete="address-level1" value={delivery.region} onChange={(value) => setDeliveryValue('region', value)} />
              <Field label="Postal code (optional)" name="postalCode" required={false} autoComplete="postal-code" value={delivery.postalCode} onChange={(value) => setDeliveryValue('postalCode', value)} />
              <label>
                <Label>Country</Label>
                <select name="country" value={delivery.country} onChange={(event) => setDeliveryValue('country', event.target.value)} required className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-ink">
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

function Field({ label, name, value, onChange, type = 'text', required = true, autoComplete, className = '' }: {
  label: string; name: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; autoComplete: string; className?: string
}) {
  return <label className={className}><Label>{label}</Label><input name={name} value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} autoComplete={autoComplete} className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-ink" /></label>
}

function deliveryFromAddress(address: SavedAddress, email: string): DeliveryDetails {
  return {
    email,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    region: address.region,
    postalCode: address.postalCode ?? '',
    country: address.country,
  }
}

function Label({ children }: { children: string }) {
  return <span className="block text-[9px] font-medium uppercase tracking-[0.14em]">{children}</span>
}

function EmptyCheckout() {
  return <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 text-center text-ink"><div><LuPackageCheck size={28} className="mx-auto" /><h1 className="mt-5 text-3xl">Your bag is empty.</h1><Link to="/shop" className="mt-6 inline-flex min-h-12 items-center bg-ink px-7 text-[9px] uppercase tracking-[0.15em] text-canvas">Return to shop</Link></div></main>
}
