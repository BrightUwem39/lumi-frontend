import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  LuBell as FiBell,
  LuCheck as FiCheck,
  LuChevronRight as FiChevronRight,
  LuHeart as FiHeart,
  LuHouse as FiHome,
  LuMapPin as FiMapPin,
  LuPackage as FiPackage,
  LuSettings as FiSettings,
  LuShoppingBag as FiShoppingBag,
  LuUser as FiUser,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'

type ProfileTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings'

const accountTabs: { id: ProfileTab; label: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'User information', icon: <FiUser /> },
  { id: 'orders', label: 'Order history', icon: <FiPackage /> },
  { id: 'addresses', label: 'Saved addresses', icon: <FiMapPin /> },
  { id: 'wishlist', label: 'Wishlist', icon: <FiHeart /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings /> },
]

const orderHistory = [
  {
    id: 'LUM-10482',
    date: 'July 24, 2026',
    status: 'Delivered',
    items: 2,
    total: '$354.00',
  },
  {
    id: 'LUM-10311',
    date: 'June 08, 2026',
    status: 'Delivered',
    items: 1,
    total: '$245.00',
  },
  {
    id: 'LUM-09876',
    date: 'March 19, 2026',
    status: 'Returned',
    items: 3,
    total: '$472.00',
  },
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')

  return (
    <main className="min-h-[70svh] bg-canvas px-4 py-8 text-ink sm:px-7 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="border-b border-line pb-6">
          <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
            My account
          </p>
          <h1 className="max-w-full break-words text-[clamp(1.85rem,9vw,2.25rem)] leading-[1.05] sm:text-5xl">
            Welcome back, Amara.
          </h1>
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 sm:mt-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
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
            {activeTab === 'profile' && <UserInformation />}
            {activeTab === 'orders' && <OrderHistory />}
            {activeTab === 'addresses' && <SavedAddresses />}
            {activeTab === 'wishlist' && <WishlistPreview />}
            {activeTab === 'settings' && <AccountSettings />}
          </section>
        </div>
      </div>
    </main>
  )
}

function UserInformation() {
  const [saved, setSaved] = useState(false)

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <AccountSection
      eyebrow="Personal details"
      title="User information"
      description="Keep your contact information up to date."
    >
      <form
        onSubmit={saveProfile}
        className="mt-7 grid max-w-3xl gap-x-4 gap-y-5 sm:grid-cols-2"
      >
        <ProfileField label="First name" defaultValue="Amara" />
        <ProfileField label="Last name" defaultValue="Okafor" />
        <ProfileField
          label="Email address"
          type="email"
          defaultValue="amara@example.com"
        />
        <ProfileField
          label="Phone number"
          type="tel"
          defaultValue="+234 801 234 5678"
        />
        <ProfileField
          label="Date of birth"
          type="date"
          defaultValue="1994-08-16"
        />
        <label>
          <FieldLabel>Preferred size</FieldLabel>
          <select
            defaultValue="M"
            className="mt-2 min-h-12 w-full border border-line bg-transparent px-4 text-sm outline-none focus:border-ink"
          >
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
          </select>
        </label>

        <div className="flex flex-col items-start gap-3 pt-2 sm:col-span-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="min-h-12 w-full bg-ink px-7 text-[9px] font-medium uppercase tracking-[0.16em] text-canvas sm:w-auto"
          >
            Save changes
          </button>
          <span
            aria-live="polite"
            className="flex min-h-6 items-center gap-2 text-[10px] text-ink/55"
          >
            {saved && (
              <>
                <FiCheck size={13} />
                Your details have been saved.
              </>
            )}
          </span>
        </div>
      </form>
    </AccountSection>
  )
}

function OrderHistory() {
  return (
    <AccountSection
      eyebrow="Purchases"
      title="Order history"
      description="Review previous purchases and delivery status."
    >
      <div className="mt-7 divide-y divide-line border-y border-line">
        {orderHistory.map((order) => (
          <article
            key={order.id}
            className="grid gap-4 py-5 min-[480px]:grid-cols-[1fr_auto] min-[480px]:items-center sm:grid-cols-[1.1fr_1fr_0.7fr_auto]"
          >
            <div>
              <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
                Order
              </p>
              <h3 className="mt-1 text-sm">{order.id}</h3>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-[0.16em] text-ink/45">
                Date
              </p>
              <p className="mt-1 text-xs">{order.date}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 min-[480px]:col-span-1">
              <span
                className={`px-2.5 py-1 text-[8px] uppercase tracking-[0.12em] ${
                  order.status === 'Delivered'
                    ? 'bg-ink text-canvas'
                    : 'border border-line'
                }`}
              >
                {order.status}
              </span>
              <span className="text-xs">
                {order.items} {order.items === 1 ? 'item' : 'items'} ·{' '}
                {order.total}
              </span>
            </div>
            <button
              type="button"
              className="flex min-h-10 items-center justify-between gap-2 border border-line px-3 text-[8px] uppercase tracking-[0.13em] hover:border-ink"
            >
              View order
              <FiChevronRight size={13} />
            </button>
          </article>
        ))}
      </div>
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
    <label className="flex cursor-pointer items-center gap-4 py-5">
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

function ProfileField({
  label,
  type = 'text',
  defaultValue,
}: {
  label: string
  type?: string
  defaultValue: string
}) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        defaultValue={defaultValue}
        required
        className="mt-2 min-h-12 w-full min-w-0 border border-line bg-transparent px-4 text-sm transition-colors focus:border-ink"
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
