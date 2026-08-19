import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  LuBell as FiBell,
  LuChevronRight as FiChevronRight,
  LuHeart as FiHeart,
  LuHouse as FiHome,
  LuMapPin as FiMapPin,
  LuPackage as FiPackage,
  LuSettings as FiSettings,
  LuShoppingBag as FiShoppingBag,
  LuLogOut as FiLogOut,
  LuUser as FiUser,
  LuArrowRight,
  LuCircleAlert,
  LuCircleCheck,
  LuEye,
  LuEyeOff,
  LuMail,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { PageReveal } from '../components/PageReveal'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'
import { ApiError } from '../services/api'
import {
  requestCustomerPasswordReset,
  resetCustomerPassword,
  type AuthUser,
} from '../services/auth'
import { useAuthStore } from '../store/useAuthStore'
import { formatMoney } from '../lib/currency'
import {
  cancelOrder,
  fetchOrderReturns,
  fetchOrders,
  requestOrderReturn,
  type CustomerReturnOrder,
  type OrderSummary,
} from '../services/orders'

type ProfileTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings'

const accountTabs: { id: ProfileTab; label: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'User information', icon: <FiUser /> },
  { id: 'orders', label: 'Order history', icon: <FiPackage /> },
  { id: 'addresses', label: 'Saved addresses', icon: <FiMapPin /> },
  { id: 'wishlist', label: 'Wishlist', icon: <FiHeart /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings /> },
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const reduceMotion = useReducedMotion()
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (authStatus === 'loading') return <AccountLoading />
  if (authStatus === 'guest' || !user) return <AuthenticationPanel />

  return (
    <main className="min-h-[70svh] w-full min-w-0 overflow-x-clip bg-canvas px-4 py-6 text-ink sm:px-7 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1280px]">
        <PageReveal>
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
                My account
              </p>
              <h1 className="max-w-full break-words text-[clamp(1.85rem,9vw,2.25rem)] leading-[1.05] sm:text-5xl">
                Welcome back, {user.firstName ?? 'there'}.
              </h1>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-11 items-center gap-2 border border-line px-5 text-[9px] font-medium uppercase tracking-[0.14em] hover:border-ink"
            >
              <FiLogOut size={14} /> Sign out
            </button>
          </div>
        </PageReveal>

        <PageReveal delay={0.08} className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          {/* A compact native selector avoids clipped horizontal tabs on phones.
              The full account navigation becomes a sidebar on desktop. */}
          <label className="block lg:hidden">
            <span className="mb-2 block text-[8px] font-medium uppercase tracking-[0.16em] text-ink/45">
              Account section
            </span>
            <select
              aria-label="Account section"
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value as ProfileTab)}
              className="min-h-12 w-full border border-line bg-canvas px-4 text-[10px] font-medium uppercase tracking-[0.13em] text-ink"
            >
              {accountTabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </label>
          <nav
            aria-label="Account sections"
            className="hidden min-w-0 lg:sticky lg:top-32 lg:block lg:self-start lg:border-r lg:pr-6"
          >
            {accountTabs.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mb-1 flex min-h-11 w-full items-center gap-3 px-4 text-left text-[9px] font-medium uppercase tracking-[0.13em] transition-colors ${
                    selected
                      ? 'bg-ink text-canvas'
                      : 'hover:bg-ink/[0.05]'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <section
            aria-live="polite"
            aria-label={
              accountTabs.find((tab) => tab.id === activeTab)?.label
            }
            className="min-w-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'profile' && <UserInformation user={user} />}
                {activeTab === 'orders' && <OrderHistory />}
                {activeTab === 'addresses' && <SavedAddresses />}
                {activeTab === 'wishlist' && <WishlistPreview />}
                {activeTab === 'settings' && <AccountSettings />}
              </motion.div>
            </AnimatePresence>
          </section>
        </PageReveal>
      </div>
    </main>
  )
}

type AuthenticationMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset'

const authenticationCopy: Record<AuthenticationMode, {
  eyebrow: string
  title: string
  description: string
  submit: string
  busy: string
}> = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Sign in to Lumi',
    description: 'Access your saved pieces, orders, and checkout details.',
    submit: 'Sign in',
    busy: 'Signing in…',
  },
  register: {
    eyebrow: 'Join Lumi',
    title: 'Create your account',
    description: 'Save favourites, track orders, and move through checkout faster.',
    submit: 'Create account',
    busy: 'Creating account…',
  },
  verify: {
    eyebrow: 'One last step',
    title: 'Verify your email',
    description: 'Enter the 6-digit code sent to your inbox. It expires in 10 minutes.',
    submit: 'Verify email',
    busy: 'Verifying…',
  },
  forgot: {
    eyebrow: 'Account recovery',
    title: 'Forgot your password?',
    description: 'Enter your email and we will send a secure reset token.',
    submit: 'Send reset token',
    busy: 'Sending token…',
  },
  reset: {
    eyebrow: 'Choose a new password',
    title: 'Reset your password',
    description: 'Use the token from your email and choose a new secure password.',
    submit: 'Update password',
    busy: 'Updating password…',
  },
}

function AuthenticationPanel() {
  const [mode, setMode] = useState<AuthenticationMode>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const verifyEmail = useAuthStore((state) => state.verifyEmail)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirmPassword = String(data.get('confirmPassword') ?? '')
    const verificationCode = String(data.get('token') ?? '').trim()

    if (mode === 'verify' && !/^\d{6}$/.test(verificationCode)) {
      setError('Enter the 6-digit verification code from your email.')
      setBusy(false)
      return
    }

    if (mode === 'register' || mode === 'reset') {
      const passwordError = validateNewPassword(password)
      if (passwordError) {
        setError(passwordError)
        setBusy(false)
        return
      }
      if (password !== confirmPassword) {
        setError('The passwords do not match. Please enter them again.')
        setBusy(false)
        return
      }
    }

    try {
      if (mode === 'login') {
        await login(String(data.get('email')), password)
        return
      }

      if (mode === 'verify') {
        const result = await verifyEmail(verificationCode)
        setMessage(result.message)
        setMode('login')
        return
      }

      if (mode === 'forgot') {
        const result = await requestCustomerPasswordReset(String(data.get('email')))
        setMessage(result.message)
        setMode('reset')
        return
      }

      if (mode === 'reset') {
        const result = await resetCustomerPassword(String(data.get('token')), password)
        setMessage(result.message)
        setMode('login')
        return
      }

      const result = await register({
        firstName: String(data.get('firstName')),
        lastName: String(data.get('lastName')),
        email: String(data.get('email')),
        password,
      })
      if (result.development?.verificationToken) {
        const verified = await verifyEmail(result.development.verificationToken)
        setMessage(verified.message)
        setMode('login')
      } else {
        setMessage(result.message)
        setMode('verify')
      }
    } catch (caught) {
      setError(authenticationErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const selectMode = (nextMode: AuthenticationMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  const copy = authenticationCopy[mode]

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white px-5 text-[#171717] sm:px-8">
      <PageReveal className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col">
        <header className="shrink-0 pt-8 text-center sm:pt-10">
          <Link
            to="/"
            aria-label="Lumi home"
            className="inline-block font-display text-xl font-semibold tracking-[-0.04em] text-[#171717]"
          >
            Lumi.
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="w-full">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#777]">{copy.eyebrow}</p>
            <h1 className="mt-2 text-[1.65rem] font-semibold leading-tight tracking-[-0.035em] text-[#111] sm:text-[1.8rem]">{copy.title}</h1>
            <p className="mt-2 max-w-lg text-[13px] leading-5 text-[#6b6b6b]">{copy.description}</p>

            <form key={mode} onSubmit={submit} noValidate className="mt-6 space-y-3.5">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3.5">
              <AuthField label="First name" name="firstName" autoComplete="given-name" placeholder="Bright" />
              <AuthField label="Last name" name="lastName" autoComplete="family-name" placeholder="Uwem" />
            </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <AuthField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
          )}
          {(mode === 'login' || mode === 'register') && (
            <PasswordField
              label="Password"
              name="password"
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          )}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => selectMode('forgot')} className="text-[11px] font-medium text-[#626262] underline decoration-[#b7b7b7] underline-offset-2 transition-colors hover:text-black">
                Forgot password?
              </button>
            </div>
          )}
          {mode === 'register' && (
            <>
              <PasswordField label="Confirm password" name="confirmPassword" minLength={8} autoComplete="new-password" />
              <PasswordRequirements />
            </>
          )}
          {mode === 'verify' && (
            <AuthField label="Verification code" name="token" minLength={6} maxLength={6} inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" placeholder="Enter the 6-digit code" />
          )}
          {mode === 'reset' && (
            <AuthField label="Reset token" name="token" minLength={43} maxLength={128} autoComplete="one-time-code" placeholder="Paste the token from your email" />
          )}
          {mode === 'reset' && (
            <>
              <PasswordField label="New password" name="password" minLength={8} autoComplete="new-password" />
              <PasswordField label="Confirm new password" name="confirmPassword" minLength={8} autoComplete="new-password" />
              <PasswordRequirements />
            </>
          )}

          {(error || message) && (
            <div
              role={error ? 'alert' : 'status'}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-4 ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#dedede] bg-[#f7f7f7] text-[#505050]'}`}
            >
              {error ? <LuCircleAlert className="mt-0.5 shrink-0" size={15} /> : <LuCircleCheck className="mt-0.5 shrink-0" size={15} />}
              <span>{error || message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-xs font-semibold text-white shadow-sm transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-black disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {busy ? copy.busy : copy.submit}
            {!busy && <LuArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

            <AuthModeActions mode={mode} selectMode={selectMode} />

            <p className="mt-6 text-center text-[10px] leading-5 text-[#858585]">
              By continuing, you agree to Lumi's{' '}
              <Link to="/policies/terms" className="underline underline-offset-2 hover:text-black">Terms &amp; conditions</Link>.
            </p>
          </div>
        </section>

        <footer className="shrink-0 pb-8 text-center sm:pb-10">
          <Link to="/policies/privacy" className="text-[10px] text-[#666] underline decoration-[#bbb] underline-offset-2 transition-colors hover:text-black">
            Privacy policy
          </Link>
        </footer>
      </PageReveal>
    </main>
  )
}

function AuthField({
  label,
  name,
  type = 'text',
  minLength,
  maxLength,
  inputMode,
  pattern,
  autoComplete,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  minLength?: number
  maxLength?: number
  inputMode?: 'numeric'
  pattern?: string
  autoComplete: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#3e3e3e]">{label}</span>
      <input
        name={name}
        type={type}
        minLength={minLength}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="h-11 w-full rounded-xl border border-[#c8c8c8] bg-white px-3.5 text-sm text-[#171717] outline-none transition-[border-color,box-shadow] placeholder:text-[#9a9a9a] focus:border-[#171717] focus:shadow-[0_0_0_1px_#171717]"
      />
    </label>
  )
}

function PasswordField({ label, name, minLength, autoComplete }: {
  label: string
  name: string
  minLength?: number
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#3e3e3e]">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          minLength={minLength}
          maxLength={128}
          autoComplete={autoComplete}
          required
          className="h-11 w-full rounded-xl border border-[#c8c8c8] bg-white px-3.5 pr-11 text-sm text-[#171717] outline-none transition-[border-color,box-shadow] focus:border-[#171717] focus:shadow-[0_0_0_1px_#171717]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#6c6c6c] transition-colors hover:text-black"
        >
          {visible ? <LuEyeOff size={17} /> : <LuEye size={17} />}
        </button>
      </span>
    </label>
  )
}

function PasswordRequirements() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-[#777]">
      <span className="inline-flex items-center gap-1.5"><LuCircleCheck size={12} /> 8 or more characters</span>
      <span className="inline-flex items-center gap-1.5"><LuCircleCheck size={12} /> At least one letter</span>
      <span className="inline-flex items-center gap-1.5"><LuCircleCheck size={12} /> At least one number</span>
    </div>
  )
}

function AuthModeActions({ mode, selectMode }: {
  mode: AuthenticationMode
  selectMode: (mode: AuthenticationMode) => void
}) {
  if (mode === 'login') {
    return (
      <div className="mt-6 text-center">
        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-[#dedede]" />
          <span className="text-[11px] text-[#737373]">or</span>
          <span className="h-px flex-1 bg-[#dedede]" />
        </div>
        <button type="button" onClick={() => selectMode('register')} className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-[#bdbdbd] bg-white px-5 text-xs font-semibold text-[#171717] transition-[border-color,background-color] hover:border-[#171717] hover:bg-[#f8f8f8]">Create an account</button>
        <button type="button" onClick={() => selectMode('verify')} className="mx-auto mt-4 flex max-w-full items-center justify-center gap-2 text-center text-[10px] leading-4 text-[#737373] transition-colors hover:text-black"><LuMail size={12} className="shrink-0" /> <span>Already have a verification code?</span></button>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#dedede] pt-4 text-[10px] text-[#737373]">
      <button type="button" onClick={() => selectMode('login')} className="font-semibold text-[#171717] underline decoration-[#aaa] underline-offset-4">Back to sign in</button>
      {mode !== 'register' && <button type="button" onClick={() => selectMode('register')} className="hover:text-black">Create account</button>}
      {mode !== 'verify' && mode !== 'register' && <button type="button" onClick={() => selectMode('verify')} className="hover:text-black">Verify email</button>}
      {mode === 'forgot' && <button type="button" onClick={() => selectMode('reset')} className="hover:text-black">I have a reset token</button>}
    </div>
  )
}

function validateNewPassword(password: string) {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter.'
  if (!/\d/.test(password)) return 'Password must contain at least one number.'
  return ''
}

function authenticationErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'The account service is temporarily unavailable. Please try again.'
  if (error.status === 401) return 'Incorrect email or password. Please check your details and try again.'
  if (error.status === 403) return 'Please verify your email before signing in.'
  if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (error.status >= 500) return 'The account service is temporarily unavailable. Please try again.'
  return error.message
}

function AccountLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-white text-[#171717]">
      <p className="text-[9px] uppercase tracking-[0.18em] text-[#777]">
        Loading your account…
      </p>
    </main>
  )
}

function UserInformation({ user }: { user: AuthUser }) {
  return (
    <AccountSection
      eyebrow="Personal details"
      title="User information"
      description="Identity details verified for this account. Profile editing will be available in a later account update."
    >
      <dl className="mt-7 grid max-w-3xl gap-4 sm:grid-cols-2">
        <IdentityField label="First name" value={user.firstName ?? 'Not provided'} />
        <IdentityField label="Last name" value={user.lastName ?? 'Not provided'} />
        <IdentityField label="Email address" value={user.email} />
        <IdentityField label="Account role" value={user.role.toLowerCase()} />
      </dl>
    </AccountSection>
  )
}

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-4">
      <dt className="text-[8px] font-medium uppercase tracking-[0.15em] text-ink/45">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm">{value}</dd>
    </div>
  )
}

function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [returnOrder, setReturnOrder] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    void fetchOrders()
      .then((response) => setOrders(response.items))
      .catch((caught) => setError(
        caught instanceof ApiError ? caught.message : 'Order history is unavailable.',
      ))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cancelDraft = async (orderNumber: string) => {
    setCancelling(orderNumber)
    setError('')
    try {
      await cancelOrder(orderNumber)
      const response = await fetchOrders()
      setOrders(response.items)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The draft could not be cancelled.')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <AccountSection
      eyebrow="Purchases"
      title="Order history"
      description="Review previous purchases and delivery status."
    >
      {loading ? (
        <p className="mt-7 text-xs text-ink/50">Loading order history…</p>
      ) : error && orders.length === 0 ? (
        <div className="mt-7 border border-line p-6 text-sm"><p role="alert">{error}</p><button type="button" onClick={load} className="mt-4 border-b border-ink text-[9px] uppercase tracking-[0.14em]">Try again</button></div>
      ) : orders.length === 0 ? (
        <div className="mt-7 border border-line p-8 text-center text-sm text-ink/55">No server-backed orders yet.</div>
      ) : (
      <div className="mt-7 divide-y divide-line border-y border-line">
        {orders.map((order) => (
          <div key={order.number}>
          <article className="grid gap-4 py-5 min-[480px]:grid-cols-[1fr_auto] min-[480px]:items-center sm:grid-cols-[1.1fr_1fr_0.7fr_auto]">
            <div>
              <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
                Order
              </p>
              <h3 className="mt-1 text-sm">{order.number}</h3>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
                Date
              </p>
              <p className="mt-1 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 min-[480px]:col-span-1">
              <span
                className={`px-2.5 py-1 text-[8px] uppercase tracking-[0.12em] ${
                  order.status === 'CANCELLED'
                    ? 'border border-line text-ink/45'
                    : order.status === 'DRAFT'
                    ? 'bg-ink text-canvas'
                    : 'border border-line'
                }`}
              >
                {order.status}
              </span>
              <span className="text-xs">
                {order.lineCount} {order.lineCount === 1 ? 'line' : 'lines'} ·{' '}
                {formatMoney(Number(order.total), order.currency)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link to={`/order-confirmation/${order.number}`} className="flex min-h-10 items-center gap-2 border border-line px-3 text-[8px] uppercase tracking-[0.13em] hover:border-ink">View <FiChevronRight size={13} /></Link>
              {order.status === 'DRAFT' && <button type="button" disabled={cancelling === order.number} onClick={() => void cancelDraft(order.number)} className="min-h-10 border border-line px-3 text-[8px] uppercase tracking-[0.13em] disabled:opacity-50">{cancelling === order.number ? 'Cancelling…' : 'Cancel'}</button>}
              {['SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(order.status) && <button type="button" onClick={() => setReturnOrder((current) => current === order.number ? null : order.number)} className="min-h-10 border border-line px-3 text-[8px] uppercase tracking-[0.13em] hover:border-ink">{returnOrder === order.number ? 'Close returns' : 'Returns'}</button>}
            </div>
          </article>
          {returnOrder === order.number && <CustomerReturns orderNumber={order.number} />}
          </div>
        ))}
      </div>
      )}
      {error && orders.length > 0 && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}
    </AccountSection>
  )
}

function CustomerReturns({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<CustomerReturnOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const load = () => {
    setLoading(true); setError('')
    void fetchOrderReturns(orderNumber)
      .then(setOrder)
      .catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Return information is unavailable.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [orderNumber])
  if (loading && !order) return <div className="border-t border-line bg-ink/[0.025] px-4 py-6 text-xs text-ink/50 sm:px-6">Loading returns…</div>
  if (!order) return <div className="border-t border-line bg-ink/[0.025] px-4 py-6 sm:px-6"><p role="alert" className="text-xs text-red-700">{error}</p><button type="button" onClick={load} className="mt-4 border-b border-ink text-[8px] uppercase tracking-[0.14em]">Try again</button></div>
  const canRequest = order.returnEligible && order.items.some((item) => item.returnableQuantity > 0)
  return <section className="border-t border-line bg-ink/[0.025] px-4 py-6 sm:px-6" aria-label={`Returns for order ${orderNumber}`}>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[8px] font-medium uppercase tracking-[0.16em] text-ink/45">Returns</p><h4 className="mt-2 font-display text-xl">Return an item</h4><p className="mt-2 max-w-xl text-xs leading-5 text-ink/55">Send a request for items from this order. No refund or inventory change happens until Lumi reviews and receives the return.</p></div>{canRequest && !showForm && <button type="button" onClick={() => setShowForm(true)} className="min-h-10 bg-ink px-4 text-[8px] uppercase tracking-[0.14em] text-canvas">Start a return</button>}</div>
    {error && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}
    {showForm && <CustomerReturnForm order={order} close={() => setShowForm(false)} saved={load} />}
    {!canRequest && order.returns.length === 0 && <p className="mt-5 border-y border-line py-5 text-xs leading-5 text-ink/50">There are no items currently available to return.</p>}
    {order.returns.length > 0 && <div className="mt-6 space-y-3">{order.returns.map((productReturn) => <article key={productReturn.id} className="border border-line bg-canvas p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[8px] uppercase tracking-[0.15em] text-ink/45">Return {productReturn.id.slice(0, 8).toUpperCase()}</p><p className="mt-2 text-xs text-ink/50">Requested {new Date(productReturn.createdAt).toLocaleDateString()}</p></div><CustomerReturnStatus status={productReturn.status} /></div><p className="mt-4 text-sm leading-6">{productReturn.reason}</p><div className="mt-4 divide-y divide-line border-y border-line">{productReturn.items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"><span>{item.orderItem.productName} · Size {item.orderItem.size}</span><span className="text-ink/50">Qty {item.quantity}</span></div>)}</div>{productReturn.resolutionNote && <p className="mt-4 border-l-2 border-line pl-3 text-xs leading-5 text-ink/55">{productReturn.resolutionNote}</p>}<p className="mt-4 text-xs leading-5 text-ink/50">{customerReturnMessage(productReturn.status)}</p></article>)}</div>}
  </section>
}

function CustomerReturnForm({ order, close, saved }: { order: CustomerReturnOrder; close: () => void; saved: () => void }) {
  const items = order.items.filter((item) => item.returnableQuantity > 0)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(items.map((item) => [item.id, 0])))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const selected = items.flatMap((item) => quantities[item.id] > 0 ? [{ orderItemId: item.id, quantity: quantities[item.id] }] : [])
    if (!selected.length) { setError('Choose at least one item and quantity.'); return }
    if (reason.trim().length < 3) { setError('Please explain why you are returning the item.'); return }
    setBusy(true)
    try {
      await requestOrderReturn(order.number, { items: selected, reason: reason.trim() })
      close(); saved()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your return request could not be sent.')
    } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="mt-6 border-y border-line py-5"><div className="divide-y divide-line border-y border-line">{items.map((item) => <label key={item.id} className="grid gap-3 py-4 min-[480px]:grid-cols-[56px_minmax(0,1fr)_92px] min-[480px]:items-center"><div className="size-14 overflow-hidden bg-ink/5">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><FiPackage /></span>}</div><span><strong className="block text-sm font-medium">{item.productName}</strong><span className="mt-1 block text-xs text-ink/50">{item.sku} · Size {item.size} · Up to {item.returnableQuantity}</span></span><span><span className="sr-only">Return quantity for {item.productName}</span><input type="number" min="0" max={item.returnableQuantity} step="1" value={quantities[item.id]} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="h-10 w-full border border-line bg-canvas px-3 text-sm outline-none focus:border-ink" /></span></label>)}</div><label className="mt-5 block"><span className="text-[8px] font-medium uppercase tracking-[0.14em] text-ink/50">Reason for return</span><textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us what was wrong or why the item was not suitable" className="mt-2 w-full resize-y border border-line bg-canvas p-3 text-sm outline-none focus:border-ink" /></label>{error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}<div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row"><button disabled={busy} className="min-h-11 bg-ink px-5 text-[8px] uppercase tracking-[0.14em] text-canvas disabled:opacity-50">{busy ? 'Sending…' : 'Send return request'}</button><button type="button" disabled={busy} onClick={close} className="min-h-11 border border-line px-5 text-[8px] uppercase tracking-[0.14em]">Cancel</button></div></form>
}

function CustomerReturnStatus({ status }: { status: string }) {
  const strong = ['APPROVED', 'RECEIVED', 'COMPLETED'].includes(status)
  return <span className={`border px-2.5 py-1 text-[8px] uppercase tracking-[0.12em] ${strong ? 'border-ink bg-ink text-canvas' : status === 'REJECTED' ? 'border-red-300 text-red-700' : 'border-line'}`}>{status.toLowerCase().replaceAll('_', ' ')}</span>
}

function customerReturnMessage(status: string) {
  if (status === 'REQUESTED') return 'Lumi is reviewing your request. You will see the decision here.'
  if (status === 'APPROVED') return 'Your return was approved. Follow the return instructions provided by Lumi.'
  if (status === 'REJECTED') return 'This request was not approved. See the note above for the reason.'
  if (status === 'RECEIVED') return 'Your parcel has arrived and is being inspected.'
  return 'The return has been inspected and completed.'
}

function SavedAddresses() {
  const addresses = [
    {
      title: 'Home',
      lines: ['Amara Okafor', '18 Kingsway, Ikoyi', 'Lagos 106104, Nigeria'],
      primary: true,
    },
    {
      title: 'Work',
      lines: ['Amara Okafor', '42 Marina Road', 'Lagos Island, Nigeria'],
      primary: false,
    },
  ]

  return (
    <AccountSection
      eyebrow="Delivery"
      title="Saved addresses"
      description="Choose where you would like your orders delivered."
    >
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.title} className="border border-line p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-line">
                {address.title === 'Home' ? <FiHome /> : <FiShoppingBag />}
              </span>
              {address.primary && (
                <span className="bg-ink px-2.5 py-1 text-[8px] uppercase tracking-[0.13em] text-canvas">
                  Default
                </span>
              )}
            </div>
            <h3 className="mt-5 text-xl">{address.title}</h3>
            <address className="mt-3 space-y-1 text-xs not-italic leading-5 text-ink/55">
              {address.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
            <div className="mt-5 flex gap-4">
              <button
                type="button"
                className="border-b border-ink pb-1 text-[8px] uppercase tracking-[0.13em]"
              >
                Edit
              </button>
              <button
                type="button"
                className="text-[8px] uppercase tracking-[0.13em] text-ink/45 hover:text-ink"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
        <button
          type="button"
          className="grid min-h-48 place-items-center border border-dashed border-line p-5 text-center hover:border-ink"
        >
          <span>
            <FiMapPin size={20} className="mx-auto" />
            <span className="mt-3 block text-[9px] uppercase tracking-[0.15em]">
              Add a new address
            </span>
          </span>
        </button>
      </div>
    </AccountSection>
  )
}

function WishlistPreview() {
  const { products } = useCatalog()
  const wishlistIds = useShopStore((state) => state.wishlistItems)
  const savedProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(product.id)),
    [products, wishlistIds],
  )

  return (
    <AccountSection
      eyebrow="Saved for later"
      title="Wishlist"
      description="A quick look at the pieces you have saved."
    >
      {savedProducts.length ? (
        <>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {savedProducts.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group min-w-0"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#e8e5df]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                </div>
                <h3 className="mt-3 truncate text-sm">{product.name}</h3>
                <p className="mt-1 text-[10px] text-ink/50">
                  ${product.price}
                </p>
              </Link>
            ))}
          </div>
          <Link
            to="/wishlist"
            className="mt-7 inline-flex min-h-11 items-center gap-2 border border-ink px-5 text-[9px] uppercase tracking-[0.15em]"
          >
            View full wishlist
            <FiChevronRight size={13} />
          </Link>
        </>
      ) : (
        <div className="mt-7 border border-line p-8 text-center">
          <FiHeart size={20} className="mx-auto" />
          <p className="mt-3 text-sm text-ink/55">Your wishlist is empty.</p>
          <Link
            to="/shop"
            className="mt-5 inline-flex border-b border-ink pb-1 text-[9px] uppercase tracking-[0.15em]"
          >
            Find something to save
          </Link>
        </div>
      )}
    </AccountSection>
  )
}

function AccountSettings() {
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [smsUpdates, setSmsUpdates] = useState(false)

  return (
    <AccountSection
      eyebrow="Preferences"
      title="Settings"
      description="Choose how Lumi communicates with you."
    >
      <div className="mt-7 max-w-2xl divide-y divide-line border-y border-line">
        <SettingRow
          icon={<FiBell />}
          title="Collection updates"
          description="New arrivals, early access, and studio notes."
          checked={emailUpdates}
          setChecked={setEmailUpdates}
        />
        <SettingRow
          icon={<FiPackage />}
          title="Order updates"
          description="Delivery progress and important order messages."
          checked={orderUpdates}
          setChecked={setOrderUpdates}
        />
        <SettingRow
          icon={<FiShoppingBag />}
          title="SMS notifications"
          description="Occasional updates sent to your saved phone number."
          checked={smsUpdates}
          setChecked={setSmsUpdates}
        />
      </div>
      <div className="mt-8">
        <h3 className="text-lg">Account security</h3>
        <button
          type="button"
          className="mt-4 min-h-11 border border-line px-5 text-[9px] uppercase tracking-[0.14em] hover:border-ink"
        >
          Change password
        </button>
      </div>
    </AccountSection>
  )
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  setChecked,
}: {
  icon: ReactNode
  title: string
  description: string
  checked: boolean
  setChecked: (checked: boolean) => void
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-3 py-5 min-[380px]:gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-medium">{title}</strong>
        <span className="mt-1 block text-[10px] leading-4 text-ink/50">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-ink' : 'bg-ink/15'
        }`}
      >
        <span
          className={`absolute left-1 top-1 size-4 rounded-full bg-canvas shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </label>
  )
}

function AccountSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.2em] text-ink/45">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl min-[380px]:text-3xl">{title}</h2>
      <p className="mt-3 max-w-lg text-xs leading-5 text-ink/55">
        {description}
      </p>
      {children}
    </div>
  )
}
