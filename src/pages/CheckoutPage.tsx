import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LuArrowLeft as FiArrowLeft,
  LuArrowRight as FiArrowRight,
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
import { LAST_ORDER_STORAGE_KEY, type DemoOrder } from '../lib/order'
import { useShopStore } from '../store/useShopStore'
import type { ShopProduct } from '../types/product'

type CheckoutStep = 'shipping' | 'payment'
type PaymentMethod = 'card' | 'apple-pay' | 'paypal' | 'bank-transfer'

type ShippingDetails = {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  address: string
  city: string
  state: string
  postalCode: string
  apartment: string
}

const emptyShippingDetails: ShippingDetails = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: 'Nigeria',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  apartment: '',
}

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
    icon: <FiCreditCard size={20} />,
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
    icon: <FaPaypal size={19} />,
  },
  {
    id: 'bank-transfer',
    label: 'Bank transfer',
    description: 'Pay directly from your bank account',
    icon: <FaUniversity size={18} />,
  },
]

const shippingFieldNames: (keyof ShippingDetails)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'country',
  'address',
  'city',
  'state',
  'postalCode',
  'apartment',
]

export function CheckoutPage() {
  const { products, status: catalogStatus } = useCatalog()
  const cartItems = useShopStore((state) => state.cartItems)
  const clearCart = useShopStore((state) => state.clearCart)
  const navigate = useNavigate()
  const shippingPanel = useRef<HTMLElement | null>(null)
  const checkoutForm = useRef<HTMLFormElement | null>(null)
  const [activeStep, setActiveStep] = useState<CheckoutStep>('shipping')
  const [shippingComplete, setShippingComplete] = useState(false)
  const [shippingDetails, setShippingDetails] =
    useState<ShippingDetails>(emptyShippingDetails)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

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

  // Snapshot visible shipping values so switching tabs never clears partial work.
  const readShippingDetails = () => {
    const form = checkoutForm.current
    if (!form) return null

    const formData = new FormData(form)
    return shippingFieldNames.reduce(
      (details, name) => ({
        ...details,
        [name]: String(formData.get(name) ?? ''),
      }),
      {} as ShippingDetails,
    )
  }

  // Validate only the visible shipping panel, preserve its values, then advance.
  const advanceToPayment = () => {
    const panel = shippingPanel.current
    if (!panel) return

    const fields = Array.from(
      panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input, select',
      ),
    )
    const invalidField = fields.find((field) => !field.checkValidity())
    if (invalidField) {
      invalidField.reportValidity()
      return
    }

    const nextDetails = readShippingDetails()
    if (!nextDetails) return

    setShippingDetails(nextDetails)
    setShippingComplete(true)
    setActiveStep('payment')
  }

  const selectStep = (step: CheckoutStep) => {
    if (step === 'payment' && activeStep === 'shipping') {
      const partialDetails = readShippingDetails()
      if (partialDetails) setShippingDetails(partialDetails)
      setActiveStep('payment')
      return
    }
    setActiveStep(step)
  }

  // The frontend demo creates a refresh-safe receipt without storing payment data.
  const handlePlaceOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!items.length) return
    if (!shippingComplete) {
      setActiveStep('shipping')
      return
    }

    const placedAt = new Date()
    const deliveryStart = new Date(placedAt)
    const deliveryEnd = new Date(placedAt)
    deliveryStart.setDate(deliveryStart.getDate() + 3)
    deliveryEnd.setDate(deliveryEnd.getDate() + 5)
    const orderNumber = `LM-${placedAt.getFullYear()}-${String(placedAt.getTime()).slice(-6)}`
    const order: DemoOrder = {
      orderNumber,
      placedAt: placedAt.toISOString(),
      customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
      email: shippingDetails.email,
      deliveryAddress: [
        shippingDetails.address,
        shippingDetails.apartment,
        shippingDetails.city,
        shippingDetails.state,
        shippingDetails.country,
      ]
        .filter(Boolean)
        .join(', '),
      estimatedDelivery: `${deliveryStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${deliveryEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      paymentMethod:
        paymentMethods.find((method) => method.id === paymentMethod)?.label ??
        'Payment method',
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
    <main className="min-h-[calc(100svh-88px)] overflow-x-clip bg-canvas px-3 py-5 text-ink min-[380px]:px-4 sm:min-h-[calc(100svh-102px)] sm:px-7 sm:py-7 lg:px-10 xl:min-h-[calc(100svh-112px)]">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex items-end justify-between gap-5 border-b border-line pb-4">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.16em] text-ink/50 hover:text-ink"
            >
              <FiArrowLeft size={13} />
              Back to cart
            </Link>
            <h1 className="mt-3 text-3xl leading-none sm:text-4xl">
              Checkout
            </h1>
          </div>
          <p className="hidden items-center gap-2 text-[8px] uppercase tracking-[0.16em] text-ink/45 sm:flex">
            <FiLock size={12} /> Secure checkout
          </p>
        </div>

        {catalogStatus === 'loading' && Object.keys(cartItems).length > 0 ? (
          <PageLoadingSkeleton variant="checkout" />
        ) : items.length === 0 ? (
          <div className="grid min-h-[55svh] place-items-center text-center">
            <div>
              <h2 className="text-2xl">There’s nothing to check out yet.</h2>
              <Link
                to="/shop"
                className="mt-6 inline-flex min-h-12 items-center justify-center bg-ink px-7 text-[9px] uppercase tracking-[0.17em] text-canvas"
              >
                Browse the collection
              </Link>
            </div>
          </div>
        ) : (
          <form
            ref={checkoutForm}
            onSubmit={handlePlaceOrder}
            className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8"
          >
            <div className="min-w-0 overflow-hidden border border-line">
              {/* Both checkout destinations remain visible as equal step tabs. */}
              <div
                role="tablist"
                aria-label="Checkout steps"
                className="grid grid-cols-2 border-b border-line"
              >
                <StepTab
                  step="shipping"
                  number="01"
                  label="Shipping address"
                  icon={<FiHome />}
                  activeStep={activeStep}
                  complete={shippingComplete}
                  onSelect={selectStep}
                />
                <StepTab
                  step="payment"
                  number="02"
                  label="Payment method"
                  icon={<FiCreditCard />}
                  activeStep={activeStep}
                  complete={false}
                  onSelect={selectStep}
                />
              </div>

              <div className="min-h-[500px] p-4 sm:p-6 lg:min-h-[510px] lg:p-7">
                <AnimatePresence mode="wait" initial={false}>
                  {activeStep === 'shipping' ? (
                    <motion.section
                      ref={shippingPanel}
                      key="shipping"
                      id="checkout-shipping-panel"
                      role="tabpanel"
                      aria-labelledby="checkout-shipping-tab"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-ink/45">
                            Where should we send it?
                          </p>
                          <h2 className="mt-1.5 text-2xl sm:text-3xl">
                            Shipping address
                          </h2>
                        </div>
                        {shippingComplete && (
                          <span className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.13em] text-ink/50">
                            <FiCheck size={12} /> Saved
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-x-3 gap-y-3 min-[480px]:grid-cols-2 sm:gap-x-4">
                        <CheckoutField
                          label="First name"
                          name="firstName"
                          defaultValue={shippingDetails.firstName}
                        />
                        <CheckoutField
                          label="Last name"
                          name="lastName"
                          defaultValue={shippingDetails.lastName}
                        />
                        <CheckoutField
                          label="Email address"
                          name="email"
                          type="email"
                          defaultValue={shippingDetails.email}
                        />
                        <CheckoutField
                          label="Phone number"
                          name="phone"
                          type="tel"
                          defaultValue={shippingDetails.phone}
                        />
                        <label className="min-w-0">
                          <FieldLabel>Country / region</FieldLabel>
                          <select
                            name="country"
                            required
                            defaultValue={shippingDetails.country}
                            className="mt-1.5 min-h-11 w-full min-w-0 border border-line bg-transparent px-3 text-sm outline-none transition-colors focus:border-ink"
                          >
                            <option>Nigeria</option>
                            <option>United Kingdom</option>
                            <option>United States</option>
                            <option>Canada</option>
                            <option>France</option>
                          </select>
                        </label>
                        <CheckoutField
                          label="City"
                          name="city"
                          defaultValue={shippingDetails.city}
                        />
                        <CheckoutField
                          label="Street address"
                          name="address"
                          className="min-[480px]:col-span-2"
                          defaultValue={shippingDetails.address}
                        />
                        <CheckoutField
                          label="State / province"
                          name="state"
                          defaultValue={shippingDetails.state}
                        />
                        <CheckoutField
                          label="Postal code"
                          name="postalCode"
                          defaultValue={shippingDetails.postalCode}
                        />
                        <CheckoutField
                          label="Apartment, suite, etc. (optional)"
                          name="apartment"
                          required={false}
                          className="min-[480px]:col-span-2"
                          defaultValue={shippingDetails.apartment}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={advanceToPayment}
                        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-5 text-[9px] font-medium uppercase tracking-[0.16em] text-canvas sm:ml-auto sm:w-auto sm:min-w-52"
                      >
                        Continue to payment <FiArrowRight size={14} />
                      </button>
                    </motion.section>
                  ) : (
                    <motion.section
                      key="payment"
                      id="checkout-payment-panel"
                      role="tabpanel"
                      aria-labelledby="checkout-payment-tab"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 18 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mb-5">
                        <p className="text-[8px] uppercase tracking-[0.18em] text-ink/45">
                          Demo payment — nothing will be charged
                        </p>
                        <h2 className="mt-1.5 text-2xl sm:text-3xl">
                          Payment method
                        </h2>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {paymentMethods.map((method) => {
                          const selected = paymentMethod === method.id
                          return (
                            <label
                              key={method.id}
                              className={`flex min-h-[72px] cursor-pointer items-center gap-3 border p-3 transition-colors ${
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
                              <span className="grid size-8 shrink-0 place-items-center">
                                {method.icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <strong className="block text-[11px] font-medium">
                                  {method.label}
                                </strong>
                                <span
                                  className={`mt-1 block text-[8px] leading-3.5 ${
                                    selected ? 'text-canvas/55' : 'text-ink/45'
                                  }`}
                                >
                                  {method.description}
                                </span>
                              </span>
                              <span
                                className={`grid size-4 shrink-0 place-items-center rounded-full border ${
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                          className="mt-3 border border-line p-4"
                        >
                          {paymentMethod === 'card' ? (
                            <div className="grid gap-3 sm:grid-cols-2">
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

                      <button
                        type="button"
                        onClick={() => setActiveStep('shipping')}
                        className="mt-4 inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.14em] text-ink/50 hover:text-ink"
                      >
                        <FiArrowLeft size={12} /> Edit shipping address
                      </button>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <CheckoutSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              activeStep={activeStep}
              onContinue={advanceToPayment}
            />
          </form>
        )}
      </div>
    </main>
  )
}

function StepTab({
  step,
  number,
  label,
  icon,
  activeStep,
  complete,
  onSelect,
}: {
  step: CheckoutStep
  number: string
  label: string
  icon: ReactNode
  activeStep: CheckoutStep
  complete: boolean
  onSelect: (step: CheckoutStep) => void
}) {
  const active = activeStep === step

  return (
    <button
      id={`checkout-${step}-tab`}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`checkout-${step}-panel`}
      onClick={() => onSelect(step)}
      className={`relative flex min-h-[72px] min-w-0 items-center gap-2 px-2 text-left transition-colors min-[380px]:gap-2.5 min-[380px]:px-3 sm:min-h-20 sm:gap-4 sm:px-5 ${
        step === 'payment' ? 'border-l border-line' : ''
      } ${active ? 'text-ink' : 'text-ink/42 hover:text-ink/70'}`}
    >
      <span className="text-[8px]">{complete ? <FiCheck size={12} /> : number}</span>
      <span className="hidden text-lg sm:block">{icon}</span>
      <span className="min-w-0 break-words font-display text-[11px] font-medium leading-tight tracking-[-0.01em] min-[360px]:text-[12px] min-[400px]:whitespace-nowrap min-[400px]:text-sm sm:text-xl">
        {label}
      </span>
      {active && (
        <motion.span
          layoutId="checkout-active-step"
          className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-ink"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        />
      )}
    </button>
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
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  className?: string
  defaultValue?: string
}) {
  return (
    <label className={`min-w-0 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="mt-1.5 min-h-11 w-full min-w-0 border border-line bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-ink/30 focus:border-ink"
      />
    </label>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[8px] font-medium uppercase tracking-[0.14em] text-ink/65">
      {children}
    </span>
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

  return <p className="text-xs leading-6 text-ink/60">{messages[method]}</p>
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
  activeStep,
  onContinue,
}: {
  items: CheckoutItem[]
  subtotal: number
  shipping: number
  total: number
  activeStep: CheckoutStep
  onContinue: () => void
}) {
  return (
    <aside className="w-full min-w-0 overflow-hidden border border-line p-4 sm:p-5 lg:sticky lg:top-28 lg:max-w-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
            Your order
          </p>
          <h2 className="mt-1 text-xl">Summary</h2>
        </div>
        <Link
          to="/cart"
          className="border-b border-ink text-[8px] uppercase tracking-[0.13em]"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 max-h-36 space-y-3 overflow-y-auto pr-1">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex min-w-0 gap-3">
            <div
              className="relative shrink-0 overflow-hidden bg-[#e8e5df]"
              style={{ width: 48, height: 60, flexBasis: 48 }}
            >
              <img
                src={product.image}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[8px] text-canvas">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 self-center">
              <h3 className="truncate text-xs">{product.name}</h3>
              <p className="mt-1 text-[8px] text-ink/45">
                {product.color} · {product.brand}
              </p>
            </div>
            <span className="shrink-0 self-center text-[10px]">
              {currency.format(product.price * quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3 border-y border-line py-4 text-[10px]">
        <PriceRow label="Subtotal" value={currency.format(subtotal)} />
        <PriceRow
          label="Shipping"
          value={shipping === 0 ? 'Free' : currency.format(shipping)}
        />
      </div>
      <div className="mt-4 flex min-w-0 items-end justify-between gap-3">
        <span className="text-xs">Total</span>
        <strong className="min-w-0 text-right font-display text-2xl font-medium">
          {currency.format(total)}
        </strong>
      </div>

      {activeStep === 'shipping' ? (
        <button
          type="button"
          onClick={onContinue}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-[8px] font-medium uppercase tracking-[0.14em] text-canvas"
        >
          Continue to payment <FiArrowRight size={13} />
        </button>
      ) : (
        <button
          type="submit"
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-[8px] font-medium uppercase tracking-[0.14em] text-canvas"
        >
          <FiLock size={13} /> Place order
        </button>
      )}
      <p className="mt-2.5 text-center text-[8px] leading-4 text-ink/40">
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
