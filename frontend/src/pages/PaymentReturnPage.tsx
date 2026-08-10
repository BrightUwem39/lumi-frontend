import { useEffect, useState } from 'react'
import { LuLoaderCircle } from 'react-icons/lu'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchPaymentStatus } from '../services/payments'

export function PaymentReturnPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const reference = search.get('reference') ?? search.get('trxref')

  useEffect(() => {
    if (!reference) {
      setError('The payment return reference is missing.')
      return
    }
    let cancelled = false
    void fetchPaymentStatus(reference)
      .then((payment) => {
        if (!cancelled) {
          navigate(`/order-confirmation/${payment.orderNumber}?payment-return=1`, { replace: true })
        }
      })
      .catch(() => {
        if (!cancelled) setError('We could not match this payment to your current browser session.')
      })
    return () => { cancelled = true }
  }, [navigate, reference])

  return (
    <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 text-center text-ink">
      <div className="max-w-md">
        {!error && <LuLoaderCircle className="mx-auto animate-spin text-3xl" aria-hidden="true" />}
        <h1 className="mt-5 text-3xl">{error ? 'Payment return unavailable' : 'Checking your order…'}</h1>
        <p className="mt-3 text-sm leading-6 text-ink/55">
          {error || 'We are reading the server payment state. This return page does not confirm payment by itself.'}
        </p>
        {error && <Link to="/profile" className="mt-7 inline-flex min-h-12 items-center bg-ink px-7 text-[9px] uppercase tracking-[0.17em] text-canvas">View your account</Link>}
      </div>
    </main>
  )
}
