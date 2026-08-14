import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  LuArrowRight,
  LuBoxes,
  LuChartNoAxesCombined,
  LuCircleAlert,
  LuLogOut,
  LuMenu,
  LuRefreshCw,
  LuShoppingBag,
  LuStore,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { formatMoney } from '../lib/currency'
import { ApiError } from '../services/api'
import {
  fetchAdminCustomers,
  fetchAdminDashboard,
  fetchAdminOrders,
  fetchAdminProducts,
  setAdminInventory,
  setAdminOrderStatus,
  type AdminCustomer,
  type AdminDashboard,
  type AdminOrder,
  type AdminProduct,
} from '../services/admin'
import { useAuthStore } from '../store/useAuthStore'

type AdminSection = 'overview' | 'products' | 'orders' | 'customers'

const sections: { id: AdminSection; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LuChartNoAxesCombined /> },
  { id: 'products', label: 'Products & stock', icon: <LuBoxes /> },
  { id: 'orders', label: 'Orders', icon: <LuShoppingBag /> },
  { id: 'customers', label: 'Customers', icon: <LuUsers /> },
]

type AdminData = {
  dashboard: AdminDashboard
  products: AdminProduct[]
  orders: AdminOrder[]
  customers: AdminCustomer[]
}

export function AdminPage() {
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [section, setSection] = useState<AdminSection>('overview')
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashboard, products, orders, customers] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchAdminCustomers(),
      ])
      setData({ dashboard, products: products.items, orders: orders.items, customers: customers.items })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The Admin workspace could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'authenticated' && user?.role === 'ADMINISTRATOR') void load()
    else setLoading(false)
  }, [authStatus, user?.role, load])

  if (authStatus === 'loading') return <AdminLoading />
  if (authStatus === 'guest' || !user) {
    return <AdminGate title="Administrator sign-in required" detail="Sign in with an authorized Lumi administrator account to continue." />
  }
  if (user.role !== 'ADMINISTRATOR') {
    return <AdminGate title="This workspace is restricted" detail="Your account does not have administrator access." />
  }

  const selectSection = (next: AdminSection) => {
    setSection(next)
    setMobileNavigationOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#f1f0eb] text-[#181814] dark:bg-[#11110f] dark:text-[#f4f1e9]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f8f7f3]/95 px-4 backdrop-blur dark:border-white/10 dark:bg-[#171715]/95 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open Admin navigation" onClick={() => setMobileNavigationOpen(true)} className="grid size-10 place-items-center border border-black/10 lg:hidden dark:border-white/10">
              <LuMenu size={19} />
            </button>
            <Link to="/admin" className="flex items-baseline gap-2" aria-label="Lumi Admin home">
              <span className="font-display text-xl tracking-[0.16em]">LUMI</span>
              <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-black/45 dark:text-white/45">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden min-h-10 items-center gap-2 border border-black/10 px-4 text-[9px] font-medium uppercase tracking-[0.14em] hover:border-black sm:flex dark:border-white/10 dark:hover:border-white">
              <LuStore size={14} /> Storefront
            </Link>
            <button type="button" onClick={() => void logout()} className="grid size-10 place-items-center border border-black/10 hover:border-black dark:border-white/10 dark:hover:border-white" aria-label="Sign out">
              <LuLogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-black/10 bg-[#f8f7f3] p-5 lg:block dark:border-white/10 dark:bg-[#171715]">
          <p className="mb-5 px-3 text-[8px] uppercase tracking-[0.18em] text-black/40 dark:text-white/40">Workspace</p>
          <AdminNavigation section={section} onSelect={selectSection} />
          <div className="mt-8 border-t border-black/10 px-3 pt-5 dark:border-white/10">
            <p className="truncate text-xs font-medium">{user.firstName} {user.lastName}</p>
            <p className="mt-1 truncate text-[9px] text-black/45 dark:text-white/45">{user.email}</p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[8px] font-medium uppercase tracking-[0.2em] text-black/45 dark:text-white/45">Operations workspace</p>
              <h1 className="text-3xl sm:text-4xl">{sections.find((item) => item.id === section)?.label}</h1>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 border border-black/15 px-4 text-[9px] font-medium uppercase tracking-[0.14em] disabled:opacity-40 dark:border-white/15">
              <LuRefreshCw className={loading ? 'animate-spin' : ''} size={14} /> Refresh
            </button>
          </div>

          {error && <AdminError message={error} retry={load} />}
          {loading && !data ? <AdminPanelLoading /> : data && (
            <>
              {section === 'overview' && <Overview dashboard={data.dashboard} />}
              {section === 'products' && <Products products={data.products} reload={load} />}
              {section === 'orders' && <Orders orders={data.orders} reload={load} />}
              {section === 'customers' && <Customers customers={data.customers} />}
            </>
          )}
        </section>
      </div>

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close Admin navigation" className="absolute inset-0 bg-black/45" onClick={() => setMobileNavigationOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(84vw,320px)] bg-[#f8f7f3] p-5 shadow-2xl dark:bg-[#171715]">
            <div className="mb-10 flex items-center justify-between">
              <span className="font-display text-xl tracking-[0.16em]">LUMI</span>
              <button type="button" aria-label="Close Admin navigation" onClick={() => setMobileNavigationOpen(false)} className="grid size-10 place-items-center border border-black/10 dark:border-white/10"><LuX /></button>
            </div>
            <AdminNavigation section={section} onSelect={selectSection} />
            <Link to="/" className="mt-8 flex min-h-11 items-center gap-3 border-t border-black/10 px-3 pt-5 text-[9px] font-medium uppercase tracking-[0.14em] dark:border-white/10"><LuStore /> View storefront</Link>
          </aside>
        </div>
      )}
    </main>
  )
}

function AdminNavigation({ section, onSelect }: { section: AdminSection; onSelect: (section: AdminSection) => void }) {
  return <nav aria-label="Admin sections" className="space-y-1">{sections.map((item) => (
    <button key={item.id} type="button" aria-current={section === item.id ? 'page' : undefined} onClick={() => onSelect(item.id)} className={`flex min-h-12 w-full items-center gap-3 px-3 text-left text-[9px] font-medium uppercase tracking-[0.13em] ${section === item.id ? 'bg-[#181814] text-white dark:bg-[#f4f1e9] dark:text-[#181814]' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
      <span className="text-base">{item.icon}</span>{item.label}
    </button>
  ))}</nav>
}

function Overview({ dashboard }: { dashboard: AdminDashboard }) {
  const cards = [
    { label: 'Revenue', value: formatMoney(Number(dashboard.revenue.amount), dashboard.revenue.currency), note: 'Paid, active orders', icon: <LuChartNoAxesCombined /> },
    { label: 'Orders', value: dashboard.orders.total.toLocaleString(), note: `${dashboard.orders.awaitingFulfillment} awaiting fulfilment`, icon: <LuShoppingBag /> },
    { label: 'Customers', value: dashboard.customers.total.toLocaleString(), note: `${dashboard.customers.active} active accounts`, icon: <LuUsers /> },
    { label: 'Products', value: dashboard.products.total.toLocaleString(), note: `${dashboard.products.lowStock} low stock`, icon: <LuBoxes /> },
  ]
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => (
      <article key={card.label} className="border border-black/10 bg-[#f8f7f3] p-5 dark:border-white/10 dark:bg-[#171715]">
        <div className="mb-8 flex items-center justify-between text-black/45 dark:text-white/45"><p className="text-[8px] font-medium uppercase tracking-[0.17em]">{card.label}</p><span>{card.icon}</span></div>
        <p className="font-display text-3xl leading-none">{card.value}</p><p className="mt-3 text-[10px] text-black/50 dark:text-white/50">{card.note}</p>
      </article>
    ))}</div>
    <AdminTable title="Recent orders" columns={['Order', 'Customer', 'Status', 'Total', 'Created']} rows={dashboard.recentOrders.map((order) => [
      order.number,
      <span key="customer" className="block max-w-44 truncate" title={order.email}>{order.shippingName}</span>,
      <Status key="status" value={order.status} />,
      formatMoney(Number(order.total), order.currency),
      formatDate(order.createdAt),
    ])} />
  </div>
}

function Products({ products, reload }: { products: AdminProduct[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null)
  return <AdminCollection empty="No products found.">{products.map((product) => (
    <article key={product.id} className="border-b border-black/10 bg-[#f8f7f3] p-4 last:border-b-0 dark:border-white/10 dark:bg-[#171715] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center">
        <div className="size-14 overflow-hidden bg-black/5">{product.images[0] && <img src={product.images[0].url} alt={product.images[0].altText} className="h-full w-full object-cover" />}</div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base">{product.name}</h2><Status value={product.status} /></div><p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-black/45 dark:text-white/45">{product.sku} · {product.category} · {formatMoney(Number(product.price), product.currency)}</p></div>
        <div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><p className="text-xl font-medium">{product.available}</p><p className="text-[8px] uppercase tracking-[0.12em] text-black/45 dark:text-white/45">available · {product.inventory?.reserved ?? 0} reserved</p></div><button type="button" onClick={() => setEditing(editing === product.id ? null : product.id)} className="min-h-10 border border-black/15 px-4 text-[8px] font-medium uppercase tracking-[0.13em] dark:border-white/15">Adjust</button></div>
      </div>
      {editing === product.id && <InventoryForm product={product} close={() => setEditing(null)} reload={reload} />}
    </article>
  ))}</AdminCollection>
}

function InventoryForm({ product, close, reload }: { product: AdminProduct; close: () => void; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('')
    const fields = new FormData(event.currentTarget)
    try { await setAdminInventory(product.id, Number(fields.get('onHand')), String(fields.get('reason'))); close(); await reload() }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Inventory could not be updated.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-black/10 pt-5 dark:border-white/10 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-end">
    <AdminField label="On-hand units"><input name="onHand" type="number" min={product.inventory?.reserved ?? 0} max="1000000" required defaultValue={product.inventory?.onHand ?? 0} className="h-11 w-full border border-black/15 bg-transparent px-3 dark:border-white/15" /></AdminField>
    <AdminField label="Reason"><input name="reason" minLength={3} maxLength={500} required placeholder="Stock count or delivery reference" className="h-11 w-full border border-black/15 bg-transparent px-3 dark:border-white/15" /></AdminField>
    <div className="flex gap-2"><button disabled={busy} className="h-11 bg-[#181814] px-4 text-[8px] font-medium uppercase tracking-[0.13em] text-white disabled:opacity-40 dark:bg-[#f4f1e9] dark:text-[#181814]">{busy ? 'Saving…' : 'Save stock'}</button><button type="button" onClick={close} className="h-11 border border-black/15 px-4 text-[8px] uppercase dark:border-white/15">Cancel</button></div>
    {error && <p role="alert" className="text-xs text-red-700 sm:col-span-3 dark:text-red-300">{error}</p>}
  </form>
}

function Orders({ orders, reload }: { orders: AdminOrder[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<string | null>(null)
  return <AdminCollection empty="No orders found.">{orders.map((order) => (
    <article key={order.number} className="border-b border-black/10 bg-[#f8f7f3] p-4 last:border-b-0 dark:border-white/10 dark:bg-[#171715] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base">{order.number}</h2><Status value={order.status} /></div><p className="mt-2 text-xs">{order.shippingName} · {order.email}</p><p className="mt-1 text-[9px] text-black/45 dark:text-white/45">{order.lineCount} line{order.lineCount === 1 ? '' : 's'} · {formatDate(order.createdAt)}</p></div><div className="flex items-center justify-between gap-5 sm:justify-end"><p className="font-display text-xl">{formatMoney(Number(order.total), order.currency)}</p>{nextStatus(order.status) && <button type="button" onClick={() => setEditing(editing === order.number ? null : order.number)} className="min-h-10 border border-black/15 px-4 text-[8px] font-medium uppercase tracking-[0.13em] dark:border-white/15">Update</button>}</div></div>
      {editing === order.number && <OrderStatusForm order={order} close={() => setEditing(null)} reload={reload} />}
    </article>
  ))}</AdminCollection>
}

function OrderStatusForm({ order, close, reload }: { order: AdminOrder; close: () => void; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const status = nextStatus(order.status)!
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminOrderStatus(order.number, status, reason); close(); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Order could not be updated.') } finally { setBusy(false) } }
  return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-black/10 pt-5 dark:border-white/10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><AdminField label={`Reason for marking ${status.toLowerCase()}`}><input name="reason" minLength={3} maxLength={500} required placeholder="Fulfilment note or carrier reference" className="h-11 w-full border border-black/15 bg-transparent px-3 dark:border-white/15" /></AdminField><div className="flex gap-2"><button disabled={busy} className="h-11 bg-[#181814] px-4 text-[8px] font-medium uppercase tracking-[0.13em] text-white disabled:opacity-40 dark:bg-[#f4f1e9] dark:text-[#181814]">{busy ? 'Saving…' : `Mark ${status.toLowerCase()}`}</button><button type="button" onClick={close} className="h-11 border border-black/15 px-4 text-[8px] uppercase dark:border-white/15">Cancel</button></div>{error && <p role="alert" className="text-xs text-red-700 sm:col-span-2 dark:text-red-300">{error}</p>}</form>
}

function Customers({ customers }: { customers: AdminCustomer[] }) {
  return <AdminTable title="Customer directory" columns={['Customer', 'Status', 'Orders', 'Verified', 'Joined']} rows={customers.map((customer) => [
    <span key="customer"><strong className="block font-medium">{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unnamed customer'}</strong><span className="mt-1 block text-[9px] text-black/45 dark:text-white/45">{customer.email}</span></span>,
    <Status key="status" value={customer.status} />,
    customer.orderCount,
    customer.emailVerifiedAt ? 'Yes' : 'No',
    formatDate(customer.createdAt),
  ])} />
}

function AdminTable({ title, columns, rows }: { title: string; columns: string[]; rows: ReactNode[][] }) {
  return <section className="overflow-hidden border border-black/10 bg-[#f8f7f3] dark:border-white/10 dark:bg-[#171715]"><div className="flex items-center justify-between border-b border-black/10 p-5 dark:border-white/10"><h2 className="text-lg">{title}</h2><p className="text-[8px] uppercase tracking-[0.14em] text-black/40 dark:text-white/40">{rows.length} records</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left"><thead><tr>{columns.map((column) => <th key={column} className="border-b border-black/10 px-5 py-3 text-[8px] font-medium uppercase tracking-[0.14em] text-black/45 dark:border-white/10 dark:text-white/45">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-black/5 last:border-0 dark:border-white/5">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-4 text-xs">{cell}</td>)}</tr>)}</tbody></table></div></section>
}

function AdminCollection({ children, empty }: { children: ReactNode; empty: string }) { return <section className="overflow-hidden border border-black/10 dark:border-white/10">{Array.isArray(children) && children.length === 0 ? <p className="p-8 text-sm text-black/50 dark:text-white/50">{empty}</p> : children}</section> }
function AdminField({ label, children }: { label: string; children: ReactNode }) { return <label><span className="mb-2 block text-[8px] font-medium uppercase tracking-[0.14em] text-black/45 dark:text-white/45">{label}</span>{children}</label> }
function Status({ value }: { value: string }) { const positive = ['ACTIVE', 'PAID', 'PUBLISHED', 'DELIVERED'].includes(value); return <span className={`inline-flex min-h-6 items-center px-2 text-[7px] font-medium uppercase tracking-[0.12em] ${positive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/65'}`}>{value.replaceAll('_', ' ')}</span> }
function nextStatus(status: string) { return ({ PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED' } as Record<string, string>)[status] }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }

function AdminGate({ title, detail }: { title: string; detail: string }) { return <main className="grid min-h-screen place-items-center bg-[#f1f0eb] px-4 text-[#181814]"><section className="w-full max-w-lg border border-black/10 bg-[#f8f7f3] p-7 sm:p-10"><LuCircleAlert size={24} className="mb-8" /><p className="mb-3 text-[8px] font-medium uppercase tracking-[0.2em] text-black/45">Lumi administration</p><h1 className="text-3xl">{title}</h1><p className="mt-4 max-w-sm text-sm leading-6 text-black/60">{detail}</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/profile" className="inline-flex min-h-11 items-center gap-3 bg-[#181814] px-5 text-[8px] font-medium uppercase tracking-[0.14em] text-white">Go to sign in <LuArrowRight /></Link><Link to="/" className="inline-flex min-h-11 items-center border border-black/15 px-5 text-[8px] font-medium uppercase tracking-[0.14em]">Return to store</Link></div></section></main> }
function AdminLoading() { return <main className="grid min-h-screen place-items-center bg-[#f1f0eb]"><p className="text-[9px] uppercase tracking-[0.2em]">Checking access…</p></main> }
function AdminPanelLoading() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-shimmer h-36 border border-black/5" />)}</div> }
function AdminError({ message, retry }: { message: string; retry: () => Promise<void> }) { return <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"><span className="flex items-center gap-2"><LuCircleAlert />{message}</span><button type="button" onClick={() => void retry()} className="text-[8px] font-medium uppercase tracking-[0.14em]">Try again</button></div> }
