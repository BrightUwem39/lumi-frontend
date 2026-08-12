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
import { cancelOrder, fetchOrders, type OrderSummary } from '../services/orders'

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
    description: 'Paste the single-use token sent to your inbox.',
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
        const result = await verifyEmail(String(data.get('token')))
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
    <main className="relative grid min-h-[calc(100svh-5rem)] w-full min-w-0 place-items-center overflow-hidden bg-canvas px-4 py-5 text-ink sm:px-7 sm:py-7">
      <div aria-hidden="true" className="absolute -left-20 top-8 size-56 rounded-full bg-ink/[0.04] blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 bottom-6 size-64 rounded-full bg-ink/[0.06] blur-3xl" />
      <PageReveal className="relative w-full max-w-[500px] overflow-hidden border border-line bg-canvas shadow-[0_22px_70px_rgba(20,18,14,0.1)]">
        <section className="flex min-h-[500px] items-center p-5 sm:p-8">
          <div className="mx-auto w-full max-w-[390px]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Link to="/" className="font-display text-xl tracking-[-0.03em]">Lumi.</Link>
              <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[7px] uppercase tracking-[0.13em] text-ink/50">Secure account</span>
            </div>
            <p className="text-[8px] font-medium uppercase tracking-[0.18em] text-ink/45">{copy.eyebrow}</p>
            <h1 className="mt-2 text-2xl leading-tight sm:text-[1.8rem]">{copy.title}</h1>
            <p className="mt-2 max-w-md text-[11px] leading-4 text-ink/55">{copy.description}</p>

            <form key={mode} onSubmit={submit} noValidate className="mt-5 space-y-3">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
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
              <button type="button" onClick={() => selectMode('forgot')} className="text-[8px] font-medium text-ink/55 underline decoration-line underline-offset-4 transition-colors hover:text-ink">
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
          {(mode === 'verify' || mode === 'reset') && (
            <AuthField label={mode === 'verify' ? 'Verification token' : 'Reset token'} name="token" minLength={43} autoComplete="one-time-code" placeholder="Paste the token from your email" />
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
              className={`flex items-start gap-2.5 border p-2.5 text-[10px] leading-4 ${error ? 'border-red-700/25 bg-red-700/[0.06] text-red-800 dark:text-red-300' : 'border-line bg-ink/[0.04] text-ink/70'}`}
            >
              {error ? <LuCircleAlert className="mt-0.5 shrink-0" size={15} /> : <LuCircleCheck className="mt-0.5 shrink-0" size={15} />}
              <span>{error || message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="group flex h-10 w-full items-center justify-center gap-2 bg-ink px-5 text-[8px] font-medium uppercase tracking-[0.15em] text-canvas transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {busy ? copy.busy : copy.submit}
            {!busy && <LuArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

            <AuthModeActions mode={mode} selectMode={selectMode} />
          </div>
        </section>
      </PageReveal>
    </main>
  )
}

function AuthField({
  label,
  name,
  type = 'text',
  minLength,
  autoComplete,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  minLength?: number
  autoComplete: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="mt-1.5 h-10 w-full border border-line bg-transparent px-3 text-xs outline-none transition-colors placeholder:text-ink/30 focus:border-ink"
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
      <FieldLabel>{label}</FieldLabel>
      <span className="relative mt-1.5 block">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          minLength={minLength}
          maxLength={128}
          autoComplete={autoComplete}
          required
          className="h-10 w-full border border-line bg-transparent px-3 pr-10 text-xs outline-none transition-colors focus:border-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink/45 transition-colors hover:text-ink"
        >
          {visible ? <LuEyeOff size={17} /> : <LuEye size={17} />}
        </button>
      </span>
    </label>
  )
}

function PasswordRequirements() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-ink/45">
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
      <div className="mt-4 space-y-3 border-t border-line pt-4 text-center">
        <p className="text-[10px] text-ink/55">New to Lumi?{' '}<button type="button" onClick={() => selectMode('register')} className="font-medium text-ink underline decoration-line underline-offset-4">Create an account</button></p>
        <button type="button" onClick={() => selectMode('verify')} className="mx-auto flex max-w-full items-center justify-center gap-2 text-center text-[7px] uppercase leading-3 tracking-[0.1em] text-ink/45 hover:text-ink min-[380px]:text-[8px]"><LuMail size={11} className="shrink-0" /> <span>Already have a verification token?</span></button>
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[8px] text-ink/50">
      <button type="button" onClick={() => selectMode('login')} className="font-medium text-ink underline decoration-line underline-offset-4">Back to sign in</button>
      {mode !== 'register' && <button type="button" onClick={() => selectMode('register')} className="hover:text-ink">Create account</button>}
      {mode !== 'verify' && <button type="button" onClick={() => selectMode('verify')} className="hover:text-ink">Verify email</button>}
      {mode === 'forgot' && <button type="button" onClick={() => selectMode('reset')} className="hover:text-ink">I have a reset token</button>}
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
    <main className="grid min-h-[70svh] place-items-center bg-canvas text-ink">
      <p className="text-[9px] uppercase tracking-[0.18em] text-ink/50">
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
          <article
            key={order.number}
            className="grid gap-4 py-5 min-[480px]:grid-cols-[1fr_auto] min-[480px]:items-center sm:grid-cols-[1.1fr_1fr_0.7fr_auto]"
          >
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
            </div>
          </article>
        ))}
      </div>
      )}
      {error && orders.length > 0 && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}
    </AccountSection>
  )
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[8px] font-medium uppercase tracking-[0.13em]">
      {children}
    </span>
  )
}
