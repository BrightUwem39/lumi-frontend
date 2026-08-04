import { motion } from 'framer-motion'
import { LuCheck as FiCheck, LuPackage as FiPackage, LuTruck as FiTruck } from 'react-icons/lu'
import { Link, useParams } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'
import { LAST_ORDER_STORAGE_KEY, type DemoOrder } from '../lib/order'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

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
  const order = readOrder()

  if (!order || order.orderNumber !== orderNumber) {
    return (
      <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 py-16 text-center text-ink">
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

  return (
    <main className="bg-canvas px-4 py-9 text-ink min-[480px]:py-11 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-[1100px]"
      >
        <header className="border-b border-line pb-8 text-center sm:pb-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-canvas sm:size-16">
            <FiCheck size={24} />
          </span>
          <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-ink/50">
            Order {order.orderNumber}
          </p>
          <h1 className="mt-2 break-words text-3xl leading-tight min-[380px]:text-4xl sm:text-5xl">Thank you, {order.customerName.split(' ')[0]}.</h1>
          <p className="mx-auto mt-4 max-w-xl break-words text-[13px] leading-6 text-ink/60 sm:text-sm">
            Your demo order is confirmed. A confirmation would be sent to {order.email}.
          </p>
        </header>

        <div className="mt-8 grid min-w-0 gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_320px] min-[900px]:items-start min-[900px]:gap-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
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
                  <span className="max-w-24 shrink-0 break-words text-right text-[11px] sm:text-sm">{currency.format(item.price * item.quantity)}</span>
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
              <PriceRow label="Subtotal" value={currency.format(order.subtotal)} />
              <PriceRow label="Shipping" value={order.shipping ? currency.format(order.shipping) : 'Free'} />
              <PriceRow label="Payment" value={order.paymentMethod} />
            </div>
            <div className="flex items-end justify-between gap-3 pt-5">
              <span className="text-sm">Total</span>
              <strong className="min-w-0 break-words text-right font-display text-xl font-medium min-[380px]:text-2xl">{currency.format(order.total)}</strong>
            </div>
          </aside>
        </div>

        <div className="mt-9 grid gap-3 min-[480px]:mx-auto min-[480px]:max-w-xl min-[480px]:grid-cols-2">
          <Link to="/shop" className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-center text-[9px] uppercase tracking-[0.15em] text-canvas min-[380px]:px-7 min-[380px]:tracking-[0.17em]">Continue shopping</Link>
          <Link to="/profile" className="inline-flex min-h-12 items-center justify-center border border-line px-5 text-center text-[9px] uppercase tracking-[0.15em] min-[380px]:px-7 min-[380px]:tracking-[0.17em]">View your account</Link>
        </div>
        <p className="mt-5 text-center text-[9px] leading-4 text-ink/40">Frontend demonstration — no payment was taken.</p>
      </motion.div>
    </main>
  )
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 justify-between gap-3"><span className="text-ink/55">{label}</span><span className="max-w-[60%] text-right">{value}</span></div>
}
