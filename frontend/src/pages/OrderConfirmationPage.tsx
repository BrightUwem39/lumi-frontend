import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LuCheck as FiCheck, LuCreditCard, LuPackage as FiPackage, LuTruck as FiTruck } from 'react-icons/lu'
import { Link, useParams } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'
import { LAST_ORDER_STORAGE_KEY, type DemoOrder } from '../lib/order'
import { formatMoney } from '../lib/currency'
import { fetchOrder } from '../services/orders'
import { ApiError } from '../services/api'
import { fetchPaymentAvailability, initializePayment } from '../services/payments'
import type { OrderDraft } from '../services/checkout'

// The receipt remains available after refresh for the current browser session.
function readOrder(): DemoOrder | null {
  try {
    const savedOrder = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)
    return savedOrder ? (JSON.parse(savedOrder) as DemoOrder) : null
  } catch {
    return null
  }
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(() => readOrder())
  const [loading, setLoading] = useState(!order || order.orderNumber !== orderNumber)
  const [serverOrder, setServerOrder] = useState<OrderDraft | null>(null)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (!orderNumber) return
    let cancelled = false
    void fetchOrder(orderNumber)
      .then((draft) => {
        if (!cancelled) setServerOrder(draft)
        const receipt: DemoOrder = {
          orderNumber: draft.number, placedAt: draft.createdAt,
          customerName: draft.shippingName, email: draft.email,
          deliveryAddress: [draft.shippingAddress.line1, draft.shippingAddress.line2,
            draft.shippingAddress.city, draft.shippingAddress.region,
            draft.shippingAddress.country].filter(Boolean).join(', '),
          estimatedDelivery: 'Available after payment confirmation',
          paymentMethod: 'Payment not initiated',
          items: draft.items.map((item, index) => ({ id: `${draft.number}-${index}`,
            name: item.name, image: item.image ?? '', quantity: item.quantity,
            price: Number(item.unitPrice) })),
          subtotal: Number(draft.subtotal), shipping: Number(draft.shippingTotal),
          total: Number(draft.total),
        }
        if (!cancelled) setOrder(receipt)
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [orderNumber])

  useEffect(() => {
    let cancelled = false
    void fetchPaymentAvailability()
      .then((availability) => { if (!cancelled) setPaymentsEnabled(availability.enabled) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  const beginPayment = async () => {
    if (!orderNumber) return
    setPaying(true)
    setPaymentError('')
    try {
      const session = await initializePayment(orderNumber)
      const target = new URL(session.authorizationUrl)
      if (target.protocol !== 'https:' || !(target.hostname === 'paystack.com' || target.hostname.endsWith('.paystack.com'))) {
        throw new Error('Invalid payment destination')
      }
      window.location.assign(target.toString())
    } catch (caught) {
      setPaymentError(caught instanceof ApiError ? caught.message : 'Payment could not be started.')
      setPaying(false)
    }
  }

  if (loading) return <main className="grid min-h-[65svh] place-items-center bg-canvas text-ink"><p>Loading order…</p></main>

  if (!order || order.orderNumber !== orderNumber) {
    return (
      <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 py-10 text-center text-ink">
        <div className="max-w-md">
          <FiPackage className="mx-auto text-3xl" />
          <h1 className="mt-5 text-3xl sm:text-4xl">Order not found</h1>
          <p className="mt-3 text-sm leading-6 text-ink/55">
            This demo receipt may have expired or belongs to another session.
          </p>
          <Link to="/shop" className="mt-7 inline-flex min-h-12 w-full items-center justify-center bg-ink px-7 text-[9px] uppercase tracking-[0.17em] text-canvas min-[420px]:w-auto">
            Return to shop
          </Link>
        </div>
      </main>
    )
  }

  const status = serverOrder?.status ?? 'DRAFT'
  const paid = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)
  const pending = status === 'PENDING_PAYMENT'
  const canPay = serverOrder?.status === 'DRAFT' && paymentsEnabled
  const currencyCode = serverOrder?.currency ?? 'NGN'

  return (
    <main className="w-full min-w-0 overflow-x-clip bg-canvas px-4 py-7 text-ink min-[480px]:py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-[1100px]"
      >
        <header className="border-b border-line pb-6 text-center sm:pb-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-canvas sm:size-16">
            <FiCheck size={24} />
          </span>
          <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-ink/50">
            Order {order.orderNumber}
          </p>
          <h1 className="mt-2 break-words text-3xl leading-tight min-[380px]:text-4xl sm:text-5xl">
            {paid ? 'Payment confirmed.' : pending ? 'Payment is processing.' : `Your order draft is ready, ${order.customerName.split(' ')[0]}.`}
          </h1>
          <p className="mx-auto mt-4 max-w-xl break-words text-[13px] leading-6 text-ink/60 sm:text-sm">
            {paid
              ? `Your paid order is saved for ${order.email}.`
              : pending
                ? 'We are waiting for signed provider confirmation. You can safely revisit this page.'
                : `Your order draft is saved for ${order.email}. No payment has been taken.`}
          </p>
        </header>

        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_320px] min-[900px]:items-start min-[900px]:gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <section aria-labelledby="ordered-items-heading" className="min-w-0">
            <h2 id="ordered-items-heading" className="text-2xl">What you ordered</h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <div key={item.id} className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 py-4 min-[380px]:grid-cols-[64px_minmax(0,1fr)_auto] sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-4">
                  <div className="aspect-[4/5] w-14 shrink-0 overflow-hidden bg-[#e8e5df] min-[380px]:w-16 sm:w-20">
                    <OptimizedImage src={item.image} alt="" responsiveWidths={[160, 240]} className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm sm:text-base">{item.name}</h3>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-ink/45">Quantity {item.quantity}</p>
                  </div>
                  <span className="max-w-24 shrink-0 break-words text-right text-[11px] sm:text-sm">{formatMoney(item.price * item.quantity, currencyCode)}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="min-w-0 border border-line p-4 min-[380px]:p-5 sm:p-6 min-[900px]:sticky min-[900px]:top-32">
            <div className="flex items-start gap-3 border-b border-line pb-5">
              <FiTruck className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm">Estimated delivery</h2>
                <p className="mt-1 text-xs text-ink/55">{order.estimatedDelivery}</p>
                <p className="mt-3 break-words text-xs leading-5 text-ink/55">{order.deliveryAddress}</p>
              </div>
            </div>
            <div className="space-y-3 border-b border-line py-5 text-xs">
              <PriceRow label="Subtotal" value={formatMoney(order.subtotal, currencyCode)} />
              <PriceRow label="Shipping" value={order.shipping ? formatMoney(order.shipping, currencyCode) : 'Free'} />
              <PriceRow label="Payment" value={paid ? 'Confirmed' : pending ? 'Pending provider confirmation' : order.paymentMethod} />
            </div>
            <div className="flex items-end justify-between gap-3 pt-5">
              <span className="text-sm">Total</span>
              <strong className="min-w-0 break-words text-right font-display text-xl font-medium min-[380px]:text-2xl">{formatMoney(order.total, currencyCode)}</strong>
            </div>
          </aside>
        </div>

        {canPay && (
          <div className="mx-auto mt-8 max-w-xl border border-line p-5 text-center">
            <h2 className="text-xl">Complete payment securely</h2>
            <p className="mt-2 text-xs leading-5 text-ink/55">You will continue to Paystack. Lumi does not collect or store your card details.</p>
            {paymentError && <p role="alert" className="mt-3 text-xs text-red-700">{paymentError}</p>}
            <button type="button" onClick={() => void beginPayment()} disabled={paying} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-[9px] uppercase tracking-[0.16em] text-canvas disabled:opacity-50">
              <LuCreditCard size={14} /> {paying ? 'Opening Paystack…' : 'Pay with Paystack'}
            </button>
          </div>
        )}

        <div className="mt-9 grid gap-3 min-[480px]:mx-auto min-[480px]:max-w-xl min-[480px]:grid-cols-2">
          <Link to="/shop" className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-center text-[9px] uppercase tracking-[0.15em] text-canvas min-[380px]:px-7 min-[380px]:tracking-[0.17em]">Continue shopping</Link>
          <Link to="/profile" className="inline-flex min-h-12 items-center justify-center border border-line px-5 text-center text-[9px] uppercase tracking-[0.15em] min-[380px]:px-7 min-[380px]:tracking-[0.17em]">View your account</Link>
        </div>
        <p className="mt-5 text-center text-[9px] leading-4 text-ink/40">
          {paid
            ? 'Payment was confirmed by the server.'
            : pending
              ? 'Inventory is reserved while provider confirmation is pending.'
              : paymentsEnabled
                ? 'Inventory will be reserved when you start payment.'
                : 'Online payment is not currently available.'}
        </p>
      </motion.div>
    </main>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 justify-between gap-3"><span className="text-ink/55">{label}</span><span className="max-w-[60%] text-right">{value}</span></div>
}
