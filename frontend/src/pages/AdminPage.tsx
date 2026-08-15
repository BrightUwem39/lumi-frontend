import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  LuArrowLeft,
  LuArrowRight,
  LuBadgePercent,
  LuBell,
  LuBoxes,
  LuChartNoAxesCombined,
  LuCheck,
  LuChevronDown,
  LuCircleAlert,
  LuCircleDollarSign,
  LuClock3,
  LuDownload,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPackage,
  LuRefreshCw,
  LuSearch,
  LuSettings,
  LuShoppingBag,
  LuStore,
  LuTrendingUp,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
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

type AdminData = {
  dashboard: AdminDashboard
  products: AdminProduct[]
  orders: AdminOrder[]
  customers: AdminCustomer[]
}

type NavigationItem = { label: string; to: string; icon: ReactNode }

const primaryNavigation: NavigationItem[] = [
  { label: 'Overview', to: '/admin', icon: <LuLayoutDashboard /> },
  { label: 'Products', to: '/admin/products', icon: <LuPackage /> },
  { label: 'Orders', to: '/admin/orders', icon: <LuShoppingBag /> },
  { label: 'Customers', to: '/admin/customers', icon: <LuUsers /> },
  { label: 'Inventory', to: '/admin/inventory', icon: <LuBoxes /> },
  { label: 'Analytics', to: '/admin/analytics', icon: <LuChartNoAxesCombined /> },
  { label: 'Discounts', to: '/admin/discounts', icon: <LuBadgePercent /> },
]

const pageContext: Record<string, { eyebrow: string; title: string }> = {
  '/admin': { eyebrow: 'Store performance', title: 'Overview' },
  '/admin/products': { eyebrow: 'Catalog management', title: 'Products' },
  '/admin/products/new': { eyebrow: 'Catalog management', title: 'New product' },
  '/admin/orders': { eyebrow: 'Sales operations', title: 'Orders' },
  '/admin/customers': { eyebrow: 'Customer operations', title: 'Customers' },
  '/admin/inventory': { eyebrow: 'Stock control', title: 'Inventory' },
  '/admin/analytics': { eyebrow: 'Business intelligence', title: 'Analytics' },
  '/admin/discounts': { eyebrow: 'Promotions', title: 'Discounts' },
  '/admin/settings': { eyebrow: 'Workspace', title: 'Settings' },
}

export function AdminPage() {
  const location = useLocation()
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')

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

  useEffect(() => setDrawerOpen(false), [location.pathname])

  if (authStatus === 'loading') return <AdminLoading />
  if (authStatus === 'guest' || !user) {
    return <AdminGate title="Administrator sign-in required" detail="Sign in with an authorized Lumi administrator account to continue." />
  }
  if (user.role !== 'ADMINISTRATOR') {
    return <AdminGate title="This workspace is restricted" detail="Your account does not have administrator access." />
  }

  const context = pageContext[location.pathname] ?? (
    location.pathname.startsWith('/admin/orders/')
      ? { eyebrow: 'Sales operations', title: 'Order detail' }
      : location.pathname.startsWith('/admin/products/')
        ? { eyebrow: 'Catalog management', title: 'Edit product' }
        : pageContext['/admin']
  )

  return (
    <main className="admin-theme min-h-screen bg-admin-bg text-admin-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-admin-line bg-admin-surface lg:flex lg:flex-col">
        <AdminBrand />
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-muted">Workspace</p>
          <AdminNavigation items={primaryNavigation} pathname={location.pathname} />
        </div>
        <div className="border-t border-admin-line p-3">
          <Link to="/admin/settings" className={navigationClass(location.pathname === '/admin/settings')}>
            <LuSettings size={18} /> Settings
          </Link>
          <div className="mt-2 flex items-center gap-3 rounded-admin border border-admin-line bg-admin-soft p-3">
            <UserAvatar name={`${user.firstName ?? ''} ${user.lastName ?? ''}`} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</p><p className="truncate text-xs text-admin-muted">{user.email}</p></div>
            <ChevronIcon />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[256px]">
        <header className="sticky top-0 z-30 border-b border-admin-line bg-admin-surface/95 backdrop-blur">
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 xl:px-8">
            <button type="button" aria-label="Open Admin navigation" onClick={() => setDrawerOpen(true)} className="admin-icon-button lg:hidden"><LuMenu size={20} /></button>
            <Link to="/admin" className="mr-auto font-display text-base tracking-[0.12em] lg:hidden">LUMI</Link>
            <div className="hidden min-w-0 flex-1 lg:block"><p className="text-xs font-medium text-admin-muted">{context.eyebrow}</p><h1 className="truncate text-xl font-semibold">{context.title}</h1></div>
            <label className="relative ml-auto hidden w-full max-w-md md:block">
              <span className="sr-only">Search current Admin page</span>
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={17} />
              <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search current page…" className="admin-control h-10 w-full pl-10 pr-4" />
            </label>
            <button type="button" className="admin-icon-button" aria-label="Notifications" title="Notifications integration pending" disabled><LuBell size={18} /></button>
            <Link to="/" className="admin-icon-button" aria-label="View storefront"><LuStore size={18} /></Link>
            <button type="button" onClick={() => void logout()} className="admin-icon-button" aria-label="Sign out"><LuLogOut size={18} /></button>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <div className="mb-5 flex items-center gap-3 lg:hidden"><div><p className="text-xs font-medium text-admin-muted">{context.eyebrow}</p><h1 className="text-2xl font-semibold">{context.title}</h1></div></div>
          <label className="relative mb-5 block md:hidden"><span className="sr-only">Search current Admin page</span><LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={17} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search current page…" className="admin-control h-11 w-full pl-10 pr-4" /></label>
          {error && <AdminError message={error} retry={load} />}
          {loading && !data ? <AdminPanelLoading /> : data && (
            <Routes>
              <Route index element={<Overview data={data} reload={load} />} />
              <Route path="products" element={<ProductsPage products={data.products} query={globalSearch} />} />
              <Route path="products/new" element={<ProductIntegrationPage mode="new" />} />
              <Route path="products/:productId" element={<ProductIntegrationPage mode="edit" />} />
              <Route path="orders" element={<OrdersPage orders={data.orders} query={globalSearch} />} />
              <Route path="orders/:orderNumber" element={<OrderDetailPage orders={data.orders} reload={load} />} />
              <Route path="customers" element={<CustomersPage customers={data.customers} query={globalSearch} />} />
              <Route path="inventory" element={<InventoryPage products={data.products} query={globalSearch} reload={load} />} />
              <Route path="analytics" element={<AnalyticsPage data={data} />} />
              <Route path="discounts" element={<IntegrationPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          )}
        </div>
      </div>

      {drawerOpen && <MobileDrawer pathname={location.pathname} close={() => setDrawerOpen(false)} />}
    </main>
  )
}

function Overview({ data, reload }: { data: AdminData; reload: () => Promise<void> }) {
  const { dashboard, products } = data
  const averageOrderValue = dashboard.orders.total ? Number(dashboard.revenue.amount) / dashboard.orders.total : 0
  const lowStock = products.filter((product) => product.available <= 10).sort((a, b) => a.available - b.available)
  const stockLeaders = [...products].sort((a, b) => b.available - a.available).slice(0, 4)
  const chartOrders = dashboard.recentOrders.filter((order) => ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status))
  const maxValue = Math.max(...chartOrders.map((order) => Number(order.total)), 1)
  const stats = [
    { label: 'Total revenue', value: formatMoney(Number(dashboard.revenue.amount), dashboard.revenue.currency), detail: 'Across paid active orders', icon: <LuCircleDollarSign /> },
    { label: 'Orders', value: dashboard.orders.total.toLocaleString(), detail: `${dashboard.orders.awaitingFulfillment} awaiting fulfilment`, icon: <LuShoppingBag /> },
    { label: 'Customers', value: dashboard.customers.total.toLocaleString(), detail: `${dashboard.customers.active} active accounts`, icon: <LuUsers /> },
    { label: 'Average order value', value: formatMoney(averageOrderValue, dashboard.revenue.currency), detail: 'Revenue divided by all orders', icon: <LuTrendingUp /> },
  ]

  return <div className="space-y-6">
    <PageHeader title={`Good ${dayPeriod()}, Bright.`} description="Here is the latest operational picture for Lumi." actions={<><DateRangeControl /><button type="button" onClick={() => exportOrdersCsv(dashboard.recentOrders)} className="admin-button secondary"><LuDownload size={16} /> Export</button><button type="button" onClick={() => void reload()} className="admin-button secondary"><LuRefreshCw size={16} /> Refresh</button></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
      <Panel title="Revenue snapshot" subtitle="Latest paid orders returned by the live API" action={<span className="admin-pill">Live data</span>}>
        {chartOrders.length ? <div className="pt-2"><div className="flex h-56 items-end gap-3 border-b border-admin-line px-1" role="img" aria-label="Bar chart of latest paid order values">{chartOrders.map((order) => <div key={order.number} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><span className="mb-2 truncate text-center text-[10px] font-medium text-admin-muted">{formatCompactMoney(Number(order.total))}</span><div className="min-h-3 rounded-t-md bg-admin-accent/85 transition-colors group-hover:bg-admin-accent" style={{ height: `${Math.max(12, (Number(order.total) / maxValue) * 78)}%` }} title={`${order.number}: ${formatMoney(Number(order.total), order.currency)}`} /></div>)}</div><div className="mt-3 flex justify-between text-xs text-admin-muted"><span>Older</span><span>Latest paid orders</span><span>Recent</span></div></div> : <EmptyState title="No paid-order data yet" detail="Revenue bars appear after a sandbox payment succeeds." />}
      </Panel>
      <Panel title="Low stock" subtitle="Products with ten units or fewer" action={<Link to="/admin/inventory" className="admin-text-link">View inventory <LuArrowRight /></Link>}>
        {lowStock.length ? <div className="space-y-3">{lowStock.map((product) => <ProductLine key={product.id} product={product} detail={`${product.available} available`} warning />)}</div> : <EmptyState title="Stock levels look healthy" detail="No products are currently below the alert threshold." compact />}
      </Panel>
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
      <RecentOrdersTable orders={dashboard.recentOrders} />
      <Panel title="Product availability" subtitle="Highest available quantities" action={<Link to="/admin/products" className="admin-text-link">All products <LuArrowRight /></Link>}><div className="space-y-3">{stockLeaders.map((product) => <ProductLine key={product.id} product={product} detail={`${product.available} units available`} />)}</div></Panel>
    </div>
  </div>
}

function ProductsPage({ products, query }: { products: AdminProduct[]; query: string }) {
  const [status, setStatus] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [stock, setStock] = useState('ALL')
  const [sort, setSort] = useState('UPDATED')
  const categories = [...new Set(products.map((product) => product.category))].sort()
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = products.filter((product) => (!needle || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(needle)) && (status === 'ALL' || product.status === status) && (category === 'ALL' || product.category === category) && (stock === 'ALL' || (stock === 'LOW' ? product.available <= 10 : product.available > 10)))
    return [...filtered].sort((left, right) => sort === 'NAME' ? left.name.localeCompare(right.name) : sort === 'PRICE' ? Number(right.price) - Number(left.price) : sort === 'STOCK' ? right.available - left.available : new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }, [products, query, status, category, stock, sort])

  return <div className="space-y-5"><PageHeader title="Products" description={`${products.length} products across ${categories.length} categories.`} actions={<Link to="/admin/products/new" className="admin-button primary"><LuPackage size={16} /> Add product</Link>} /><Toolbar><FilterSelect label="Status" value={status} setValue={setStatus} options={['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED']} /><FilterSelect label="Category" value={category} setValue={setCategory} options={['ALL', ...categories]} /><FilterSelect label="Stock" value={stock} setValue={setStock} options={['ALL', 'LOW', 'HEALTHY']} /><FilterSelect label="Sort" value={sort} setValue={setSort} options={['UPDATED', 'NAME', 'PRICE', 'STOCK']} /><span className="ml-auto text-xs text-admin-muted">{visible.length} results</span></Toolbar>{visible.length ? <div className="hidden overflow-hidden rounded-admin border border-admin-line bg-admin-surface md:block"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><ProductIdentity product={product} /></td><td>{product.category}</td><td className="tabular-nums">{formatMoney(Number(product.price), product.currency)}</td><td><strong className="font-semibold tabular-nums">{product.available}</strong><span className="block text-xs text-admin-muted">{product.inventory?.reserved ?? 0} reserved</span></td><td><StatusBadge value={product.status} /></td><td>{formatDate(product.updatedAt)}</td><td><Link to={`/admin/products/${product.id}`} className="admin-text-link">View <LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching products" detail="Clear a filter or try another search phrase." />}{visible.length > 0 && <div className="grid gap-3 md:hidden">{visible.map((product) => <MobileRecord key={product.id} title={<ProductIdentity product={product} />} status={<StatusBadge value={product.status} />} meta={`${product.category} · ${formatMoney(Number(product.price), product.currency)}`} detail={`${product.available} available · ${product.inventory?.reserved ?? 0} reserved`} action={<Link to={`/admin/products/${product.id}`} className="admin-button secondary">View</Link>} />)}</div>}</div>
}

function OrdersPage({ orders, query }: { orders: AdminOrder[]; query: string }) {
  const [status, setStatus] = useState('ALL')
  const counts = ['ALL', 'DRAFT', 'PAID', 'PROCESSING', 'SHIPPED', 'CANCELLED'].map((value) => ({ value, count: value === 'ALL' ? orders.length : orders.filter((order) => order.status === value).length }))
  const needle = query.trim().toLowerCase()
  const visible = orders.filter((order) => (status === 'ALL' || order.status === status) && (!needle || `${order.number} ${order.shippingName} ${order.email}`.toLowerCase().includes(needle)))
  return <div className="space-y-5"><PageHeader title="Orders" description="Track payment state and move fulfilled orders through valid transitions." /><div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{counts.map((item) => <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`admin-chip ${status === item.value ? 'active' : ''}`}>{titleCase(item.value)} <span>{item.count}</span></button>)}</div>{visible.length ? <div className="hidden overflow-hidden rounded-admin border border-admin-line bg-admin-surface md:block"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Items</th><th></th></tr></thead><tbody>{visible.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td><strong className="block font-medium">{order.shippingName}</strong><span className="text-xs text-admin-muted">{order.email}</span></td><td>{formatDate(order.createdAt)}</td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td><StatusBadge value={paymentLabel(order.status)} /></td><td><StatusBadge value={order.status} /></td><td>{order.lineCount}</td><td><Link to={`/admin/orders/${order.number}`} className="admin-text-link">Open <LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching orders" detail="Try another status or search phrase." />}{visible.length > 0 && <div className="grid gap-3 md:hidden">{visible.map((order) => <MobileRecord key={order.number} title={order.number} status={<StatusBadge value={order.status} />} meta={`${order.shippingName} · ${formatDate(order.createdAt)}`} detail={`${formatMoney(Number(order.total), order.currency)} · ${order.lineCount} item${order.lineCount === 1 ? '' : 's'}`} action={<Link to={`/admin/orders/${order.number}`} className="admin-button secondary">Open</Link>} />)}</div>}</div>
}

function OrderDetailPage({ orders, reload }: { orders: AdminOrder[]; reload: () => Promise<void> }) {
  const { orderNumber = '' } = useParams()
  const order = orders.find((item) => item.number === orderNumber)
  if (!order) return <EmptyState title="Order not found" detail="The order may be outside the current result window." action={<Link to="/admin/orders" className="admin-button secondary">Back to orders</Link>} />
  const next = nextStatus(order.status)
  return <div className="space-y-5"><Link to="/admin/orders" className="admin-text-link"><LuArrowLeft /> Back to orders</Link><PageHeader title={order.number} description={`Created ${formatDate(order.createdAt)} · ${order.lineCount} line item${order.lineCount === 1 ? '' : 's'}`} actions={<StatusBadge value={order.status} />} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><div className="space-y-6"><Panel title="Order summary" subtitle="Server-authoritative payment and fulfilment state"><dl className="grid gap-4 sm:grid-cols-2"><Detail label="Customer" value={order.shippingName} /><Detail label="Email" value={order.email} /><Detail label="Total" value={formatMoney(Number(order.total), order.currency)} /><Detail label="Paid at" value={order.paidAt ? formatDate(order.paidAt) : 'Not paid'} /><Detail label="Payment" value={paymentLabel(order.status)} /><Detail label="Fulfilment" value={titleCase(order.status)} /></dl></Panel><Panel title="Item and shipping detail" subtitle="Backend integration point"><IntegrationNote text="Line-item thumbnails, quantities, price breakdown, shipping address, and customer notes require the planned administrator order-detail endpoint. No placeholder customer data is fabricated here." /></Panel></div><div className="space-y-6"><Panel title="Status timeline" subtitle="Only confirmed server states are shown"><StatusTimeline status={order.status} /></Panel><Panel title="Order action" subtitle="Forward-only transitions are audited">{next ? <OrderStatusForm order={order} reload={reload} /> : <EmptyState title="No fulfilment action available" detail="This order cannot move forward from its current state." compact />}</Panel></div></div></div>
}

function CustomersPage({ customers, query }: { customers: AdminCustomer[]; query: string }) {
  const needle = query.trim().toLowerCase()
  const visible = customers.filter((customer) => !needle || `${customer.firstName ?? ''} ${customer.lastName ?? ''} ${customer.email}`.toLowerCase().includes(needle))
  return <div className="space-y-5"><PageHeader title="Customers" description="A minimized operational view of verified customer accounts." /><Panel title="Customer directory" subtitle={`${visible.length} of ${customers.length} customers`} noPadding>{visible.length ? <div className="overflow-x-auto"><table className="admin-table min-w-[720px]"><thead><tr><th>Customer</th><th>Status</th><th>Orders</th><th>Verified</th><th>Last activity</th><th>Joined</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><strong className="block font-semibold">{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unnamed customer'}</strong><span className="text-xs text-admin-muted">{customer.email}</span></td><td><StatusBadge value={customer.status} /></td><td>{customer.orderCount}</td><td>{customer.emailVerifiedAt ? 'Yes' : 'No'}</td><td>{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'No sign-in yet'}</td><td>{formatDate(customer.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No matching customers" detail="Try another name or email address." />}</Panel></div>
}

function InventoryPage({ products, query, reload }: { products: AdminProduct[]; query: string; reload: () => Promise<void> }) {
  const [stock, setStock] = useState('ALL')
  const [editing, setEditing] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const visible = products.filter((product) => (!needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle)) && (stock === 'ALL' || (stock === 'LOW' ? product.available <= 10 : stock === 'OUT' ? product.available === 0 : product.available > 10)))
  return <div className="space-y-5"><PageHeader title="Inventory" description="Authoritative on-hand, reserved, and available product stock." /><Toolbar><FilterSelect label="Stock state" value={stock} setValue={setStock} options={['ALL', 'LOW', 'OUT', 'HEALTHY']} /><span className="ml-auto text-xs text-admin-muted">{visible.length} products</span></Toolbar><div className="space-y-3">{visible.map((product) => <article key={product.id} className="rounded-admin border border-admin-line bg-admin-surface p-4 shadow-admin-sm sm:p-5"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_repeat(3,90px)_auto] sm:items-center"><ProductIdentity product={product} /><StockMetric label="On hand" value={product.inventory?.onHand ?? 0} /><StockMetric label="Reserved" value={product.inventory?.reserved ?? 0} /><StockMetric label="Available" value={product.available} warning={product.available <= 10} /><button type="button" onClick={() => setEditing(editing === product.id ? null : product.id)} className="admin-button secondary">Adjust stock</button></div>{editing === product.id && <InventoryForm product={product} close={() => setEditing(null)} reload={reload} />}</article>)}</div>{!visible.length && <EmptyState title="No matching inventory" detail="Change the stock-state filter or search phrase." />}</div>
}

function AnalyticsPage({ data }: { data: AdminData }) {
  const revenue = Number(data.dashboard.revenue.amount)
  const aov = data.dashboard.orders.total ? revenue / data.dashboard.orders.total : 0
  return <div className="space-y-5"><PageHeader title="Analytics" description="A truthful operational snapshot from the endpoints currently available." actions={<DateRangeControl />} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Revenue" value={formatMoney(revenue)} detail="Paid active orders" icon={<LuCircleDollarSign />} /><StatCard label="Orders" value={String(data.dashboard.orders.total)} detail="All recorded orders" icon={<LuShoppingBag />} /><StatCard label="Average order value" value={formatMoney(aov)} detail="Revenue ÷ orders" icon={<LuTrendingUp />} /><StatCard label="Units available" value={String(data.products.reduce((sum, product) => sum + product.available, 0))} detail="Across published catalog" icon={<LuBoxes />} /></div><Panel title="Advanced analytics integration" subtitle="Conversion, refunds, category mix, and 30-day comparison"><IntegrationNote text="These metrics need time-series, traffic, refund, and sales-aggregation endpoints. The interface is ready for that contract and does not invent production performance values." /></Panel></div>
}

function ProductIntegrationPage({ mode }: { mode: 'new' | 'edit' }) {
  const { productId } = useParams()
  return <div className="space-y-5"><Link to="/admin/products" className="admin-text-link"><LuArrowLeft /> Back to products</Link><PageHeader title={mode === 'new' ? 'Add product' : 'Edit product'} description={mode === 'new' ? 'Create catalog media, pricing, variants, and inventory.' : `Product ${productId ?? ''}`} /><Panel title="Product editor integration" subtitle="Protected write endpoint required"><IntegrationNote text="The current backend intentionally exposes catalog reads and safe inventory adjustment only. Product creation, media upload, metadata editing, and archive operations remain disabled until explicit administrator endpoints and audit tests are added." /></Panel></div>
}

function IntegrationPage() {
  return <div className="space-y-5"><PageHeader title="Discounts" description="Plan and manage future campaign codes." actions={<button type="button" disabled className="admin-button primary disabled:opacity-45"><LuBadgePercent /> Create discount</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Active codes" value="—" detail="Discount endpoint pending" icon={<LuBadgePercent />} /><StatCard label="Redemptions" value="—" detail="Usage data unavailable" icon={<LuCheck />} /><StatCard label="Discount value" value="—" detail="No simulated totals" icon={<LuCircleDollarSign />} /></div><Panel title="Discount integration" subtitle="No production discount operations are exposed yet"><IntegrationNote text="Percentage and fixed-amount campaigns, usage limits, validity windows, and applicable products will appear here once audited discount endpoints are available." /></Panel></div>
}

function SettingsPage() {
  const sections = [{ title: 'Store profile', detail: 'Brand identity, contact details, and storefront defaults.' }, { title: 'Shipping', detail: 'Delivery regions, thresholds, and future carrier integration.' }, { title: 'Tax', detail: 'Tax display and jurisdiction settings.' }, { title: 'Notifications', detail: 'Operational email preferences and low-stock alerts.' }, { title: 'Account security', detail: 'Administrator sessions, MFA, and recent re-authentication.' }]
  return <div className="space-y-5"><PageHeader title="Settings" description="Configuration is grouped by operational responsibility." /><div className="grid gap-4 lg:grid-cols-2">{sections.map((section) => <Panel key={section.title} title={section.title} subtitle={section.detail}><div className="flex items-center justify-between rounded-lg border border-admin-line bg-admin-soft p-4"><span className="text-sm text-admin-muted">Backend settings contract pending</span><button type="button" disabled className="admin-button secondary disabled:opacity-45">Configure</button></div></Panel>)}</div></div>
}

function AdminBrand() { return <Link to="/admin" className="flex h-[68px] items-center gap-3 border-b border-admin-line px-5"><span className="grid size-9 place-items-center rounded-lg bg-admin-ink font-display text-sm tracking-[0.08em] text-admin-surface">L</span><span><strong className="block font-display text-lg tracking-[0.12em]">LUMI</strong><span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-muted">Administration</span></span></Link> }

function AdminNavigation({ items, pathname }: { items: NavigationItem[]; pathname: string }) { return <nav aria-label="Admin sections" className="space-y-1">{items.map((item) => { const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to); return <Link key={item.to} to={item.to} className={navigationClass(active)} aria-current={active ? 'page' : undefined}><span className="text-lg">{item.icon}</span>{item.label}</Link> })}</nav> }

function MobileDrawer({ pathname, close }: { pathname: string; close: () => void }) { return <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close Admin navigation" className="absolute inset-0 bg-black/45" onClick={close} /><aside className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-admin-surface shadow-2xl"><div className="flex items-center justify-between border-b border-admin-line pr-3"><AdminBrand /><button type="button" aria-label="Close Admin navigation" onClick={close} className="admin-icon-button"><LuX /></button></div><div className="flex-1 overflow-y-auto px-3 py-5"><AdminNavigation items={primaryNavigation} pathname={pathname} /></div><div className="border-t border-admin-line p-3"><Link to="/admin/settings" className={navigationClass(pathname === '/admin/settings')}><LuSettings size={18} /> Settings</Link><Link to="/" className={navigationClass(false)}><LuStore size={18} /> View storefront</Link></div></aside></div> }

function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) { return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold sm:text-[28px]">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-admin-muted">{description}</p></div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</header> }

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) { return <article className="rounded-admin border border-admin-line bg-admin-surface p-5 shadow-admin-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-admin-muted">{label}</p><span className="grid size-9 place-items-center rounded-lg bg-admin-soft text-admin-muted">{icon}</span></div><p className="mt-5 text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums">{value}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-admin-muted"><LuClock3 size={13} /> {detail}</p></article> }

function Panel({ title, subtitle, action, children, noPadding = false }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode; noPadding?: boolean }) { return <section className="overflow-hidden rounded-admin border border-admin-line bg-admin-surface shadow-admin-sm"><header className="flex items-start justify-between gap-4 border-b border-admin-line px-5 py-4"><div><h3 className="text-base font-semibold">{title}</h3><p className="mt-1 text-xs text-admin-muted">{subtitle}</p></div>{action}</header><div className={noPadding ? '' : 'p-5'}>{children}</div></section> }

function RecentOrdersTable({ orders }: { orders: AdminDashboard['recentOrders'] }) { return <Panel title="Recent orders" subtitle="Latest customer orders" action={<Link to="/admin/orders" className="admin-text-link">View all <LuArrowRight /></Link>} noPadding><div className="overflow-x-auto"><table className="admin-table min-w-[680px]"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th></tr></thead><tbody>{orders.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td>{order.shippingName}</td><td><StatusBadge value={order.status} /></td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td>{formatDate(order.createdAt)}</td></tr>)}</tbody></table></div></Panel> }

function ProductLine({ product, detail, warning = false }: { product: AdminProduct; detail: string; warning?: boolean }) { return <div className="flex items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className={`mt-0.5 text-xs ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-admin-muted'}`}>{detail}</p></div><span className="text-xs font-medium text-admin-muted">{product.sku}</span></div> }
function ProductIdentity({ product }: { product: AdminProduct }) { return <div className="flex min-w-0 items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0"><strong className="block truncate font-semibold">{product.name}</strong><span className="block truncate text-xs text-admin-muted">{product.sku}</span></div></div> }
function ProductThumbnail({ product }: { product: AdminProduct }) { return <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-admin-soft">{product.images[0] ? <img src={product.images[0].url} alt={product.images[0].altText} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-admin-muted"><LuPackage /></span>}</div> }

function Toolbar({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center gap-2 rounded-admin border border-admin-line bg-admin-surface p-3 shadow-admin-sm">{children}</div> }
function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) { return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => setValue(event.target.value)} className="admin-control h-10 min-w-32 px-3 text-sm">{options.map((option) => <option key={option} value={option}>{label}: {titleCase(option)}</option>)}</select></label> }

function InventoryForm({ product, close, reload }: { product: AdminProduct; close: () => void; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [nextOnHand, setNextOnHand] = useState(product.inventory?.onHand ?? 0); const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminInventory(product.id, nextOnHand, reason); close(); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Inventory could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-admin-line pt-5 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-end"><AdminField label="Resulting on-hand units"><input name="onHand" type="number" min={product.inventory?.reserved ?? 0} max="1000000" required value={nextOnHand} onChange={(event) => setNextOnHand(Number(event.target.value))} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Adjustment reason"><input name="reason" minLength={3} maxLength={500} required placeholder="Stock count or delivery reference" className="admin-control h-11 w-full px-3" /></AdminField><div className="flex gap-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save stock'}</button><button type="button" onClick={close} className="admin-button secondary">Cancel</button></div><p className="text-xs text-admin-muted sm:col-span-3">Result after save: <strong className="text-admin-ink">{nextOnHand} on hand · {product.inventory?.reserved ?? 0} reserved · {Math.max(0, nextOnHand - (product.inventory?.reserved ?? 0))} available</strong></p>{error && <p role="alert" className="text-sm text-red-700 sm:col-span-3 dark:text-red-300">{error}</p>}</form> }

function OrderStatusForm({ order, reload }: { order: AdminOrder; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const status = nextStatus(order.status)!; const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminOrderStatus(order.number, status, reason); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Order could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="space-y-3"><AdminField label={`Reason for marking ${status.toLowerCase()}`}><textarea name="reason" minLength={3} maxLength={500} required rows={3} placeholder="Fulfilment note or carrier reference" className="admin-control w-full resize-y p-3" /></AdminField><button disabled={busy} className="admin-button primary w-full justify-center">{busy ? 'Saving…' : `Mark ${status.toLowerCase()}`}</button>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</form> }

function StatusTimeline({ status }: { status: string }) { const steps = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']; const currentIndex = steps.indexOf(status); return <ol className="space-y-4">{steps.map((step, index) => <li key={step} className="flex gap-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${index <= currentIndex ? 'border-admin-accent bg-admin-accent text-admin-accent-contrast' : 'border-admin-line text-admin-muted'}`}>{index <= currentIndex ? <LuCheck size={13} /> : index + 1}</span><div><p className="text-sm font-semibold">{titleCase(step)}</p><p className="text-xs text-admin-muted">{index < currentIndex ? 'Completed' : index === currentIndex ? 'Current state' : 'Pending'}</p></div></li>)}</ol> }
function StockMetric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div><p className="text-xs text-admin-muted">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? 'text-amber-700 dark:text-amber-300' : ''}`}>{value}</p></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-admin-soft p-4"><dt className="text-xs font-medium text-admin-muted">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div> }

function MobileRecord({ title, status, meta, detail, action }: { title: ReactNode; status: ReactNode; meta: string; detail: string; action: ReactNode }) { return <article className="rounded-admin border border-admin-line bg-admin-surface p-4 shadow-admin-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{typeof title === 'string' ? <h3 className="font-semibold">{title}</h3> : title}<p className="mt-2 text-xs text-admin-muted">{meta}</p><p className="mt-1 text-sm font-medium">{detail}</p></div>{status}</div><div className="mt-4">{action}</div></article> }
function EmptyState({ title, detail, compact = false, action }: { title: string; detail: string; compact?: boolean; action?: ReactNode }) { return <div className={`grid place-items-center text-center ${compact ? 'py-6' : 'min-h-56 p-8'}`}><div><span className="mx-auto grid size-10 place-items-center rounded-full bg-admin-soft text-admin-muted"><LuBoxes /></span><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-admin-muted">{detail}</p>{action && <div className="mt-4">{action}</div>}</div></div> }
function IntegrationNote({ text }: { text: string }) { return <div className="flex gap-3 rounded-lg border border-dashed border-admin-line bg-admin-soft p-4"><LuCircleAlert className="mt-0.5 shrink-0 text-admin-muted" size={18} /><p className="text-sm leading-6 text-admin-muted">{text}</p></div> }
function DateRangeControl() { return <label title="Date-range analytics endpoint pending"><span className="sr-only">Dashboard date range</span><select defaultValue="30" className="admin-control h-10 px-3 text-sm" disabled><option value="30">Current snapshot</option></select></label> }

function exportOrdersCsv(orders: AdminDashboard['recentOrders']) {
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const rows = [
    ['Order', 'Customer', 'Email', 'Status', 'Currency', 'Total', 'Created'],
    ...orders.map((order) => [order.number, order.shippingName, order.email, order.status, order.currency, order.total, order.createdAt]),
  ]
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `lumi-orders-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
function StatusBadge({ value }: { value: string }) { const tone = ['ACTIVE', 'PAID', 'PUBLISHED', 'DELIVERED'].includes(value) ? 'success' : ['PROCESSING', 'PENDING_PAYMENT'].includes(value) ? 'info' : ['PAYMENT_FAILED', 'CANCELLED', 'DISABLED'].includes(value) ? 'danger' : ['SHIPPED'].includes(value) ? 'accent' : 'neutral'; return <span className={`admin-status ${tone}`}>{titleCase(value)}</span> }
function AdminField({ label, children }: { label: string; children: ReactNode }) { return <label><span className="mb-2 block text-xs font-medium text-admin-muted">{label}</span>{children}</label> }
function UserAvatar({ name }: { name: string }) { const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A'; return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-admin-accent text-xs font-semibold text-admin-accent-contrast">{initials}</span> }
function ChevronIcon() { return <LuChevronDown className="text-admin-muted" size={15} /> }
function AdminGate({ title, detail }: { title: string; detail: string }) { return <main className="admin-theme grid min-h-screen place-items-center bg-admin-bg px-4 text-admin-ink"><section className="w-full max-w-lg rounded-admin border border-admin-line bg-admin-surface p-8 shadow-admin"><LuCircleAlert size={24} className="mb-7 text-admin-accent" /><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-admin-muted">Lumi administration</p><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-3 max-w-sm text-sm leading-6 text-admin-muted">{detail}</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/profile" className="admin-button primary">Go to sign in <LuArrowRight /></Link><Link to="/" className="admin-button secondary">Return to store</Link></div></section></main> }
function AdminLoading() { return <main className="admin-theme grid min-h-screen place-items-center bg-admin-bg"><p className="text-sm font-medium text-admin-muted">Checking administrator access…</p></main> }
function AdminPanelLoading() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-shimmer h-40 rounded-admin border border-admin-line" />)}</div> }
function AdminError({ message, retry }: { message: string; retry: () => Promise<void> }) { return <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-admin border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"><span className="flex items-center gap-2"><LuCircleAlert />{message}</span><button type="button" onClick={() => void retry()} className="admin-button secondary">Try again</button></div> }

function navigationClass(active: boolean) { return `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${active ? 'bg-admin-accent text-admin-accent-contrast shadow-sm' : 'text-admin-muted hover:bg-admin-soft hover:text-admin-ink'}` }
function nextStatus(status: string) { return ({ PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED' } as Record<string, string>)[status] }
function paymentLabel(status: string) { return ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? 'PAID' : status === 'PAYMENT_FAILED' ? 'FAILED' : 'PENDING' }
function titleCase(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }
function formatCompactMoney(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(value) }
function dayPeriod() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening' }
