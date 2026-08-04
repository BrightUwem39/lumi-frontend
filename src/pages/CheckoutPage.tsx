import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LuArrowLeft as FiArrowLeft,
  LuCheck as FiCheck,
  LuCreditCard as FiCreditCard,
  LuHouse as FiHome,
  LuLandmark as FaUniversity,
  LuLock as FiLock,
} from 'react-icons/lu'
import { FaApplePay, FaPaypal } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { PageLoadingSkeleton } from '../components/LoadingSkeleton'
import { useCatalog } from '../hooks/useCatalog'
import {
  LAST_ORDER_STORAGE_KEY,
  type DemoOrder,
} from '../lib/order'
import { useShopStore } from '../store/useShopStore'
import type { ShopProduct } from '../types/product'

type PaymentMethod = 'card' | 'apple-pay' | 'paypal' | 'bank-transfer'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const paymentMethods: {
  id: PaymentMethod
  label: string
  description: string
  icon: ReactNode
}[] = [
  {
    id: 'card',
    label: 'Credit or debit card',
    description: 'Visa, Mastercard or American Express',
    icon: <FiCreditCard size={21} />,
  },
  {
    id: 'apple-pay',
    label: 'Apple Pay',
    description: 'Fast checkout with your Apple wallet',
    icon: <FaApplePay size={27} />,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Continue with your PayPal account',
    icon: <FaPaypal size={20} />,
  },
  {
    id: 'bank-transfer',
    label: 'Bank transfer',
    description: 'Pay directly from your bank account',
    icon: <FaUniversity size={19} />,
  },
]

export function CheckoutPage() {
  const { products, status: catalogStatus } = useCatalog()
  const cartItems = useShopStore((state) => state.cartItems)
  const clearCart = useShopStore((state) => state.clearCart)
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('card')

  // Join persisted cart quantities with catalog information for the summary.
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
  const shipping = subtotal === 0 || subtotal >= 250 ? 0 : 18
  const total = subtotal + shipping

  // The frontend demo creates a refresh-safe receipt without storing payment data.
  const handlePlaceOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!items.length) return
    const formData = new FormData(event.currentTarget)
    const placedAt = new Date()
    const deliveryStart = new Date(placedAt)
    const deliveryEnd = new Date(placedAt)
    deliveryStart.setDate(deliveryStart.getDate() + 3)
    deliveryEnd.setDate(deliveryEnd.getDate() + 5)
    const orderNumber = `LM-${placedAt.getFullYear()}-${String(placedAt.getTime()).slice(-6)}`
    const order: DemoOrder = {
      orderNumber,
      placedAt: placedAt.toISOString(),
      customerName: `${String(formData.get('firstName'))} ${String(formData.get('lastName'))}`,
      email: String(formData.get('email')),
      deliveryAddress: [
        String(formData.get('address')),
        String(formData.get('apartment') ?? ''),
        String(formData.get('city')),
        String(formData.get('state')),
        String(formData.get('country')),
      ].filter(Boolean).join(', '),
      estimatedDelivery: `${deliveryStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${deliveryEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      paymentMethod: paymentMethods.find((method) => method.id === paymentMethod)?.label ?? 'Payment method',
      items: items.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        image: product.image,
        quantity,
        price: product.price,
      })),
      subtotal,
      shipping,
      total,
    }

    sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
    clearCart()
    navigate(`/order-confirmation/${orderNumber}`, { replace: true })
  }

  return (
    <main className="bg-canvas px-3 py-8 text-ink min-[380px]:px-4 sm:px-7 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1280px]">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55 hover:text-ink"
        >
          <FiArrowLeft size={14} />
          Back to cart
        </Link>

        <div className="mt-6 border-b border-line pb-6">
          <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
            Secure checkout
          </p>
          <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl">
            Complete your order
          </h1>
        </div>

        {catalogStatus === 'loading' && Object.keys(cartItems).length > 0 ? (
          <PageLoadingSkeleton variant="checkout" />
        ) : items.length === 0 ? (
          <div className="grid min-h-[52svh] place-items-center text-center">
            <div>
              <h2 className="break-words text-2xl">There’s nothing to check out yet.</h2>
              <Link
                to="/shop"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-ink px-4 text-[9px] uppercase tracking-[0.14em] text-canvas min-[380px]:w-auto min-[380px]:px-7 min-[380px]:tracking-[0.17em]"
              >
                Browse the collection
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="mt-8 grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start xl:gap-16"
          >
            <div className="min-w-0 space-y-10">
              {/* Shipping fields use native browser validation for the prototype. */}
              <section aria-labelledby="shipping-heading">
                <SectionHeading
                  number="01"
                  title="Shipping address"
                  icon={<FiHome />}
                  id="shipping-heading"
                />
                <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <CheckoutField label="First name" name="firstName" />
                  <CheckoutField label="Last name" name="lastName" />
                  <CheckoutField
                    label="Email address"
                    name="email"
                    type="email"
                  />
                  <CheckoutField label="Phone number" name="phone" type="tel" />
                  <label className="sm:col-span-2">
                    <FieldLabel>Country / region</FieldLabel>
                    <select
                      name="country"
                      required
                      defaultValue="Nigeria"
                      className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-ink"
                    >
                      <option>Nigeria</option>
                      <option>United Kingdom</option>
                      <option>United States</option>
                      <option>Canada</option>
                      <option>France</option>
                    </select>
                  </label>
                  <CheckoutField
                    label="Street address"
                    name="address"
                    className="sm:col-span-2"
                  />
                  <CheckoutField label="City" name="city" />
                  <CheckoutField label="State / province" name="state" />
                  <CheckoutField label="Postal code" name="postalCode" />
                  <CheckoutField
                    label="Apartment, suite, etc. (optional)"
                    name="apartment"
                    required={false}
                  />
                </div>
              </section>

              <section aria-labelledby="payment-heading">
                <SectionHeading
                  number="02"
                  title="Payment method"
                  icon={<FiCreditCard />}
                  id="payment-heading"
                />
                <p className="mt-3 text-xs leading-5 text-ink/50">
                  Demo payment options only. No payment will be processed.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const selected = paymentMethod === method.id
                    return (
                      <label
                        key={method.id}
                        className={`flex min-h-20 cursor-pointer items-center gap-3 border p-3 transition-colors min-[380px]:gap-4 min-[380px]:p-4 ${
                          selected
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-line hover:border-ink'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selected}
                          onChange={() => setPaymentMethod(method.id)}
                          className="sr-only"
                        />
                        <span className="grid size-9 shrink-0 place-items-center">
                          {method.icon}
                        </span>
                        <span className="min-w-0">
                          <strong className="block text-xs font-medium">
                            {method.label}
                          </strong>
                          <span
                            className={`mt-1 block text-[9px] leading-4 ${
                              selected ? 'text-canvas/60' : 'text-ink/50'
                            }`}
                          >
                            {method.description}
                          </span>
                        </span>
                        <span
                          className={`ml-auto grid size-4 shrink-0 place-items-center rounded-full border ${
                            selected
                              ? 'border-canvas bg-canvas text-ink'
                              : 'border-line'
                          }`}
                        >
                          {selected && <FiCheck size={10} />}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={paymentMethod}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 border border-line p-4 sm:p-5"
                  >
                    {paymentMethod === 'card' ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <CheckoutField
                          label="Cardholder name"
                          name="cardholder"
                          className="sm:col-span-2"
                        />
                        <CheckoutField
                          label="Card number"
                          name="cardNumber"
                          inputMode="numeric"
                          className="sm:col-span-2"
                        />
                        <CheckoutField
                          label="Expiry date"
                          name="expiry"
                          placeholder="MM / YY"
                        />
                        <CheckoutField
                          label="Security code"
                          name="securityCode"
                          inputMode="numeric"
                        />
                      </div>
                    ) : (
                      <PaymentNotice method={paymentMethod} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>

            <CheckoutSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
            />
          </form>
        )}
      </div>
    </main>
  )
}

function CheckoutField({
  label,
  name,
  type = 'text',
  required = true,
  placeholder,
  inputMode,
  className = '',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  className?: string
}) {
  return (
    <label className={className}>
      <FieldLabel>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 min-h-12 w-full min-w-0 border border-line bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-ink/30 focus:border-ink"
      />
    </label>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[9px] font-medium uppercase tracking-[0.15em]">
      {children}
    </span>
  )
}

function SectionHeading({
  number,
  title,
  icon,
  id,
}: {
  number: string
  title: string
  icon: ReactNode
  id: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line pb-4">
      <span className="text-[9px] text-ink/40">{number}</span>
      <span className="text-base">{icon}</span>
      <h2 id={id} className="text-xl min-[380px]:text-2xl">
        {title}
      </h2>
    </div>
  )
}

function PaymentNotice({ method }: { method: Exclude<PaymentMethod, 'card'> }) {
  const messages = {
    'apple-pay':
      'After placing the order, an Apple Pay confirmation would open on a supported device.',
    paypal:
      'After placing the order, you would be redirected to PayPal to approve the payment.',
    'bank-transfer':
      'Bank account details and a payment reference would appear after the order is placed.',
  }

  return (
    <p className="text-xs leading-6 text-ink/60">{messages[method]}</p>
  )
}

type CheckoutItem = {
  product: ShopProduct
  quantity: number
}

function CheckoutSummary({
  items,
  subtotal,
  shipping,
  total,
}: {
  items: CheckoutItem[]
  subtotal: number
  shipping: number
  total: number
}) {
  return (
    <aside className="min-w-0 w-full overflow-hidden border border-line p-4 min-[380px]:p-5 sm:p-7 lg:ml-auto lg:max-w-xl xl:sticky xl:top-32 xl:ml-0 xl:max-w-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl">Order summary</h2>
        <Link
          to="/cart"
          className="border-b border-ink text-[8px] uppercase tracking-[0.13em]"
        >
          Edit cart
        </Link>
      </div>

      <div className="mt-6 max-h-80 space-y-4 overflow-y-auto pr-1">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex min-w-0 gap-3">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-[#e8e5df]">
              <img
                src={product.image}
                alt=""
                className="size-full object-cover"
              />
              <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-ink text-[9px] text-canvas">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 self-center">
              <h3 className="truncate text-sm">{product.name}</h3>
              <p className="mt-1 text-[9px] text-ink/45">
                {product.color} · {product.brand}
              </p>
            </div>
            <span className="shrink-0 self-center text-xs">
              {currency.format(product.price * quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4 border-y border-line py-5 text-xs">
        <PriceRow label="Subtotal" value={currency.format(subtotal)} />
        <PriceRow
          label="Shipping"
          value={shipping === 0 ? 'Free' : currency.format(shipping)}
        />
      </div>
      <div className="mt-6 flex min-w-0 items-end justify-between gap-3">
        <span className="text-sm">Total</span>
        <strong className="min-w-0 text-right font-display text-2xl font-medium min-[380px]:text-3xl">
          {currency.format(total)}
        </strong>
      </div>
      <p className="mt-2 text-right text-[9px] text-ink/45">
        Taxes calculated at checkout
      </p>

      <button
        type="submit"
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-3 text-[8px] font-medium uppercase tracking-[0.12em] text-canvas min-[380px]:px-5 min-[380px]:text-[9px] min-[380px]:tracking-[0.16em]"
      >
        <FiLock size={14} />
        Place order
      </button>
      <p className="mt-3 text-center text-[9px] leading-4 text-ink/45">
        Frontend demonstration — no payment will be taken.
      </p>
    </aside>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-3">
      <span className="text-ink/55">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}
