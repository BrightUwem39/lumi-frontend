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
  LuImage,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPackage,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuSettings,
  LuShoppingBag,
  LuStore,
  LuTrendingUp,
  LuTrash2,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { formatMoney } from '../lib/currency'
import { LumiLogo } from '../components/LumiLogo'
import { ApiError } from '../services/api'
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminCustomers,
  fetchAdminDashboard,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminRevenueAnalytics,
  setAdminInventory,
  setAdminOrderStatus,
  updateAdminProduct,
  type AdminCustomer,
  type AdminDashboard,
  type AdminOrder,
  type AdminProduct,
  type AdminProductInput,
  type AdminRevenueAnalytics,
} from '../services/admin'
import { useAuthStore } from '../store/useAuthStore'

type AdminData = {
  dashboard: AdminDashboard
  revenueAnalytics: AdminRevenueAnalytics
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
  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashboard, revenueAnalytics, products, orders, customers] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminRevenueAnalytics(analyticsDays),
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchAdminCustomers(),
      ])
      setData({ dashboard, revenueAnalytics, products: products.items, orders: orders.items, customers: customers.items })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The Admin workspace could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [analyticsDays])

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
  const searchEnabled = ['/admin/products', '/admin/orders', '/admin/customers', '/admin/inventory'].includes(location.pathname)

  return (
    <main className="admin-theme min-h-screen bg-admin-bg text-admin-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-admin-line bg-admin-surface lg:flex lg:flex-col">
        <AdminBrand />
        <div className="flex-1 overflow-y-auto px-5 py-8">
          <p className="mb-4 text-[9px] font-medium uppercase tracking-[0.22em] text-admin-muted">Workspace</p>
          <AdminNavigation items={primaryNavigation} pathname={location.pathname} />
        </div>
        <div className="border-t border-admin-line p-5">
          <Link to="/admin/settings" className={navigationClass(location.pathname === '/admin/settings')}>
            <LuSettings size={18} /> Settings
          </Link>
          <div className="mt-4 flex items-center gap-3 border-t border-admin-line pt-4">
            <UserAvatar name={`${user.firstName ?? ''} ${user.lastName ?? ''}`} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</p><p className="truncate text-xs text-admin-muted">{user.email}</p></div>
            <ChevronIcon />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-admin-line bg-admin-bg/95 backdrop-blur">
          <div className="relative flex h-[70px] items-center gap-3 px-4 sm:px-7 lg:px-8 xl:px-10">
            <button type="button" aria-label="Open Admin navigation" onClick={() => setDrawerOpen(true)} className="admin-icon-button lg:hidden"><LuMenu size={20} /></button>
            <Link to="/admin" aria-label="Lumi Admin home" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden"><LumiLogo compact /></Link>
            <div className="hidden min-w-0 flex-1 lg:block"><p className="text-[9px] font-medium uppercase tracking-[0.2em] text-admin-muted">Lumi administration</p><p className="mt-1 truncate font-display text-base">{context.eyebrow}</p></div>
            {searchEnabled && <label className="relative ml-auto hidden w-full max-w-md md:block">
              <span className="sr-only">Search current Admin page</span>
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={17} />
              <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={`Search ${context.title.toLowerCase()}…`} className="admin-control h-10 w-full pl-10 pr-4" />
            </label>}
            <button type="button" className="admin-icon-button hidden sm:grid" aria-label="Notifications" title="Notifications integration pending" disabled><LuBell size={18} /></button>
            <Link to="/" className="admin-icon-button hidden sm:grid" aria-label="View storefront"><LuStore size={18} /></Link>
            <button type="button" onClick={() => void logout()} className="admin-icon-button ml-auto md:ml-0" aria-label="Sign out"><LuLogOut size={18} /></button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-8 xl:px-10 xl:py-10">
          {searchEnabled && <label className="relative mb-6 block md:hidden"><span className="sr-only">Search current Admin page</span><LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" size={17} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={`Search ${context.title.toLowerCase()}…`} className="admin-control h-11 w-full pl-10 pr-4" /></label>}
          {error && <AdminError message={error} retry={load} />}
          {loading && !data ? <AdminPanelLoading /> : data && (
            <Routes>
              <Route index element={<Overview data={data} reload={load} analyticsDays={analyticsDays} setAnalyticsDays={setAnalyticsDays} />} />
              <Route path="products" element={<ProductsPage products={data.products} query={globalSearch} />} />
              <Route path="products/new" element={<ProductEditorPage mode="new" products={data.products} reload={load} />} />
              <Route path="products/:productId" element={<ProductEditorPage mode="edit" products={data.products} reload={load} />} />
              <Route path="orders" element={<OrdersPage orders={data.orders} query={globalSearch} />} />
              <Route path="orders/:orderNumber" element={<OrderDetailPage orders={data.orders} reload={load} />} />
              <Route path="customers" element={<CustomersPage customers={data.customers} query={globalSearch} />} />
              <Route path="inventory" element={<InventoryPage products={data.products} query={globalSearch} reload={load} />} />
              <Route path="analytics" element={<AnalyticsPage data={data} analyticsDays={analyticsDays} setAnalyticsDays={setAnalyticsDays} />} />
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

function Overview({ data, reload, analyticsDays, setAnalyticsDays }: { data: AdminData; reload: () => Promise<void>; analyticsDays: 7 | 30 | 90; setAnalyticsDays: (days: 7 | 30 | 90) => void }) {
  const { dashboard, products, revenueAnalytics } = data
  const periodRevenue = Number(revenueAnalytics.revenue.amount)
  const averageOrderValue = revenueAnalytics.orders.total ? periodRevenue / revenueAnalytics.orders.total : 0
  const lowStock = products.filter((product) => product.available <= 10).sort((a, b) => a.available - b.available)
  const stockLeaders = [...products].sort((a, b) => b.available - a.available).slice(0, 4)
  const comparison = revenueAnalytics.revenue.changePercent === null
    ? 'No previous-period baseline'
    : `${revenueAnalytics.revenue.changePercent >= 0 ? '+' : ''}${revenueAnalytics.revenue.changePercent}% vs previous period`
  const stats = [
    { label: `${analyticsDays}-day revenue`, value: formatMoney(periodRevenue, revenueAnalytics.revenue.currency), detail: comparison, icon: <LuCircleDollarSign /> },
    { label: 'Paid orders', value: revenueAnalytics.orders.total.toLocaleString(), detail: `During the last ${analyticsDays} days`, icon: <LuShoppingBag /> },
    { label: 'Customers', value: dashboard.customers.total.toLocaleString(), detail: `${dashboard.customers.active} active accounts`, icon: <LuUsers /> },
    { label: 'Average order value', value: formatMoney(averageOrderValue, revenueAnalytics.revenue.currency), detail: 'Revenue divided by paid orders', icon: <LuTrendingUp /> },
  ]

  return <div className="space-y-6">
    <PageHeader title={`Good ${dayPeriod()}, Bright.`} description="Here is the latest operational picture for Lumi." actions={<><DateRangeControl value={analyticsDays} onChange={setAnalyticsDays} /><button type="button" onClick={() => exportOrdersCsv(dashboard.recentOrders)} className="admin-button secondary"><LuDownload size={16} /> Export</button><button type="button" onClick={() => void reload()} className="admin-button secondary"><LuRefreshCw size={16} /> Refresh</button></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
      <Panel title="Revenue performance" subtitle={`Daily paid revenue · last ${analyticsDays} days`} action={<span className="admin-pill">Live data</span>}>
        <RevenueChart analytics={revenueAnalytics} />
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

  return <div className="space-y-5"><PageHeader title="Products" description={`${products.length} products across ${categories.length} categories.`} actions={<Link to="/admin/products/new" className="admin-button primary"><LuPackage size={16} /> Add product</Link>} /><Toolbar><FilterSelect label="Status" value={status} setValue={setStatus} options={['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED']} /><FilterSelect label="Category" value={category} setValue={setCategory} options={['ALL', ...categories]} /><FilterSelect label="Stock" value={stock} setValue={setStock} options={['ALL', 'LOW', 'HEALTHY']} /><FilterSelect label="Sort" value={sort} setValue={setSort} options={['UPDATED', 'NAME', 'PRICE', 'STOCK']} /><span className="col-span-2 ml-auto text-xs text-admin-muted sm:col-auto">{visible.length} results</span></Toolbar>{visible.length ? <div className="hidden overflow-x-auto border border-admin-line bg-admin-surface xl:block"><table className="admin-table min-w-[900px]"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><ProductIdentity product={product} /></td><td>{product.category}</td><td className="tabular-nums">{formatMoney(Number(product.price), product.currency)}</td><td><strong className="font-semibold tabular-nums">{product.available}</strong><span className="block text-xs text-admin-muted">{product.inventory?.reserved ?? 0} reserved</span></td><td><StatusBadge value={product.status} /></td><td>{formatDate(product.updatedAt)}</td><td><Link to={`/admin/products/${product.id}`} className="admin-text-link">View <LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching products" detail="Clear a filter or try another search phrase." />}{visible.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:hidden">{visible.map((product) => <MobileRecord key={product.id} title={<ProductIdentity product={product} wrap />} status={<StatusBadge value={product.status} />} meta={`${product.category} · ${formatMoney(Number(product.price), product.currency)}`} detail={`${product.available} available · ${product.inventory?.reserved ?? 0} reserved`} action={<Link to={`/admin/products/${product.id}`} className="admin-button secondary">View</Link>} />)}</div>}</div>
}

function OrdersPage({ orders, query }: { orders: AdminOrder[]; query: string }) {
  const [status, setStatus] = useState('ALL')
  const counts = ['ALL', 'DRAFT', 'PAID', 'PROCESSING', 'SHIPPED', 'CANCELLED'].map((value) => ({ value, count: value === 'ALL' ? orders.length : orders.filter((order) => order.status === value).length }))
  const needle = query.trim().toLowerCase()
  const visible = orders.filter((order) => (status === 'ALL' || order.status === status) && (!needle || `${order.number} ${order.shippingName} ${order.email}`.toLowerCase().includes(needle)))
  return <div className="space-y-5"><PageHeader title="Orders" description="Track payment state and move fulfilled orders through valid transitions." /><div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{counts.map((item) => <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`admin-chip ${status === item.value ? 'active' : ''}`}>{titleCase(item.value)} <span>{item.count}</span></button>)}</div>{visible.length ? <div className="hidden overflow-x-auto border border-admin-line bg-admin-surface xl:block"><table className="admin-table min-w-[1040px]"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Items</th><th></th></tr></thead><tbody>{visible.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td><strong className="block font-medium">{order.shippingName}</strong><span className="text-xs text-admin-muted">{order.email}</span></td><td>{formatDate(order.createdAt)}</td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td><StatusBadge value={paymentLabel(order.status)} /></td><td><StatusBadge value={order.status} /></td><td>{order.lineCount}</td><td><Link to={`/admin/orders/${order.number}`} className="admin-text-link">Open <LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching orders" detail="Try another status or search phrase." />}{visible.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:hidden">{visible.map((order) => <MobileRecord key={order.number} title={order.number} status={<StatusBadge value={order.status} />} meta={`${order.shippingName} · ${formatDate(order.createdAt)}`} detail={`${formatMoney(Number(order.total), order.currency)} · ${order.lineCount} item${order.lineCount === 1 ? '' : 's'}`} action={<Link to={`/admin/orders/${order.number}`} className="admin-button secondary">Open</Link>} />)}</div>}</div>
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
  return <div className="space-y-5"><PageHeader title="Customers" description="A minimized operational view of verified customer accounts." />{visible.length ? <><div className="hidden overflow-x-auto border border-admin-line bg-admin-surface xl:block"><table className="admin-table min-w-[760px]"><thead><tr><th>Customer</th><th>Status</th><th>Orders</th><th>Verified</th><th>Last activity</th><th>Joined</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><strong className="block font-semibold">{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unnamed customer'}</strong><span className="text-xs text-admin-muted">{customer.email}</span></td><td><StatusBadge value={customer.status} /></td><td>{customer.orderCount}</td><td>{customer.emailVerifiedAt ? 'Yes' : 'No'}</td><td>{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'No sign-in yet'}</td><td>{formatDate(customer.createdAt)}</td></tr>)}</tbody></table></div><div className="grid gap-3 md:grid-cols-2 xl:hidden">{visible.map((customer) => <MobileRecord key={customer.id} title={[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unnamed customer'} status={<StatusBadge value={customer.status} />} meta={customer.email} detail={`${customer.orderCount} order${customer.orderCount === 1 ? '' : 's'} · ${customer.emailVerifiedAt ? 'Email verified' : 'Email unverified'}`} action={<p className="text-xs leading-5 text-admin-muted">Last activity: {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'No sign-in yet'}<br />Joined: {formatDate(customer.createdAt)}</p>} />)}</div></> : <EmptyState title="No matching customers" detail="Try another name or email address." />}</div>
}

function InventoryPage({ products, query, reload }: { products: AdminProduct[]; query: string; reload: () => Promise<void> }) {
  const [stock, setStock] = useState('ALL')
  const [editing, setEditing] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const visible = products.filter((product) => (!needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle)) && (stock === 'ALL' || (stock === 'LOW' ? product.available <= 10 : stock === 'OUT' ? product.available === 0 : product.available > 10)))
  return <div className="space-y-5"><PageHeader title="Inventory" description="Authoritative on-hand, reserved, and available product stock." /><Toolbar><FilterSelect label="Stock state" value={stock} setValue={setStock} options={['ALL', 'LOW', 'OUT', 'HEALTHY']} /><span className="col-span-1 ml-auto text-xs text-admin-muted sm:col-auto">{visible.length} products</span></Toolbar><div className="grid gap-3 xl:grid-cols-2">{visible.map((product) => <article key={product.id} className="min-w-0 border border-admin-line bg-admin-surface p-4 sm:p-5"><div className="grid min-w-0 gap-4"><ProductIdentity product={product} wrap /><div className="grid grid-cols-3 gap-2 border-y border-admin-line py-3"><StockMetric label="On hand" value={product.inventory?.onHand ?? 0} /><StockMetric label="Reserved" value={product.inventory?.reserved ?? 0} /><StockMetric label="Available" value={product.available} warning={product.available <= 10} /></div><button type="button" onClick={() => setEditing(editing === product.id ? null : product.id)} className="admin-button secondary w-full sm:w-fit">{editing === product.id ? 'Close adjustment' : 'Adjust stock'}</button></div>{editing === product.id && <InventoryForm product={product} close={() => setEditing(null)} reload={reload} />}</article>)}</div>{!visible.length && <EmptyState title="No matching inventory" detail="Change the stock-state filter or search phrase." />}</div>
}

function AnalyticsPage({ data, analyticsDays, setAnalyticsDays }: { data: AdminData; analyticsDays: 7 | 30 | 90; setAnalyticsDays: (days: 7 | 30 | 90) => void }) {
  const analytics = data.revenueAnalytics
  const revenue = Number(analytics.revenue.amount)
  const aov = analytics.orders.total ? revenue / analytics.orders.total : 0
  const comparison = analytics.revenue.changePercent === null ? 'No previous baseline' : `${analytics.revenue.changePercent >= 0 ? '+' : ''}${analytics.revenue.changePercent}% vs prior period`
  return <div className="space-y-5"><PageHeader title="Analytics" description="Verified revenue performance from completed Paystack-backed orders." actions={<DateRangeControl value={analyticsDays} onChange={setAnalyticsDays} />} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Revenue" value={formatMoney(revenue, analytics.revenue.currency)} detail={comparison} icon={<LuCircleDollarSign />} /><StatCard label="Paid orders" value={String(analytics.orders.total)} detail={`Last ${analyticsDays} days`} icon={<LuShoppingBag />} /><StatCard label="Average order value" value={formatMoney(aov, analytics.revenue.currency)} detail="Revenue ÷ paid orders" icon={<LuTrendingUp />} /><StatCard label="Units available" value={String(data.products.reduce((sum, product) => sum + product.available, 0))} detail="Across published catalog" icon={<LuBoxes />} /></div><Panel title="Revenue performance" subtitle={`Daily paid revenue · last ${analyticsDays} days`}><RevenueChart analytics={analytics} /></Panel><Panel title="Next analytics integrations" subtitle="Conversion, refunds, traffic, and category mix"><IntegrationNote text="Revenue time-series and period comparison are now live. Conversion, traffic, refunds, and category performance remain queued for later verified endpoints." /></Panel></div>
}

type ProductFormState = {
  slug: string
  sku: string
  name: string
  description: string
  category: string
  color: string
  sizes: string
  price: string
  compareAtPrice: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  onHand: string
  reason: string
  images: Array<{ url: string; altText: string }>
}

function ProductEditorPage({ mode, products, reload }: { mode: 'new' | 'edit'; products: AdminProduct[]; reload: () => Promise<void> }) {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const product = products.find((item) => item.id === productId)
  const [form, setForm] = useState<ProductFormState>(() => productFormState(product))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => setForm(productFormState(product)), [productId, product])

  if (mode === 'edit' && !product) {
    return <EmptyState title="Product not found" detail="The product may be outside the current result window or was removed." action={<Link to="/admin/products" className="admin-button secondary">Back to products</Link>} />
  }

  const setValue = <Key extends keyof ProductFormState>(key: Key, value: ProductFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }
  const updateImage = (index: number, field: 'url' | 'altText', value: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => imageIndex === index ? { ...image, [field]: value } : image),
    }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const sizes = [...new Set(form.sizes.split(',').map((size) => size.trim()).filter(Boolean))]
    const images = form.images.filter((image) => image.url.trim() || image.altText.trim()).map((image) => ({ url: image.url.trim(), altText: image.altText.trim() }))
    if (!sizes.length) {
      setError('Add at least one size, such as S, M, L or One size.')
      setBusy(false)
      return
    }
    if (images.some((image) => !image.url || !image.altText)) {
      setError('Every image needs both a URL and accessible alternative text.')
      setBusy(false)
      return
    }
    if (form.status === 'PUBLISHED' && !images.length) {
      setError('Published products must have at least one image.')
      setBusy(false)
      return
    }
    const input: AdminProductInput = {
      slug: form.slug.trim(),
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      color: form.color.trim(),
      sizes,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      status: form.status,
      images,
      onHand: Number(form.onHand),
      reason: form.reason.trim(),
    }
    try {
      if (mode === 'new') await createAdminProduct(input)
      else await updateAdminProduct(productId, input)
      await reload()
      navigate('/admin/products', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The product could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const removeProduct = async () => {
    if (!product || deleteConfirmation !== product.name || deleteReason.trim().length < 3) return
    setBusy(true)
    setError('')
    try {
      await deleteAdminProduct(product.id, deleteReason.trim())
      await reload()
      navigate('/admin/products', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The product could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <Link to="/admin/products" className="admin-text-link"><LuArrowLeft /> Back to products</Link>
    <form onSubmit={submit} className="space-y-6">
      <PageHeader title={mode === 'new' ? 'Add product' : 'Edit product'} description={mode === 'new' ? 'Create catalog content, pricing, media, sizes, and opening inventory.' : `Editing ${product?.name ?? productId}`} actions={<><Link to="/admin/products" className="admin-button secondary">Cancel</Link><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : mode === 'new' ? 'Create product' : 'Save changes'}</button></>} />
      {error && <div role="alert" className="border-l-2 border-red-700 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">{error}</div>}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
        <div className="min-w-0 space-y-6">
          <Panel title="Product information" subtitle="Customer-facing catalog content">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2"><AdminField label="Product name"><input required minLength={2} maxLength={200} value={form.name} onChange={(event) => { setValue('name', event.target.value); if (mode === 'new') setValue('slug', slugify(event.target.value)) }} className="admin-control h-11 w-full px-3" /></AdminField></div>
              <AdminField label="Slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setValue('slug', slugify(event.target.value))} className="admin-control h-11 w-full px-3" /></AdminField>
              <AdminField label="SKU"><input required minLength={3} maxLength={80} value={form.sku} onChange={(event) => setValue('sku', event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="LUMI-PRODUCT-NAME" className="admin-control h-11 w-full px-3 uppercase" /></AdminField>
              <div className="md:col-span-2"><AdminField label="Description"><textarea required minLength={10} maxLength={5000} rows={6} value={form.description} onChange={(event) => setValue('description', event.target.value)} className="admin-control w-full resize-y p-3" /></AdminField></div>
              <AdminField label="Category"><input required minLength={2} maxLength={100} value={form.category} onChange={(event) => setValue('category', event.target.value)} placeholder="Women" className="admin-control h-11 w-full px-3" /></AdminField>
              <AdminField label="Colour"><input required minLength={2} maxLength={80} value={form.color} onChange={(event) => setValue('color', event.target.value)} placeholder="Black" className="admin-control h-11 w-full px-3" /></AdminField>
              <div className="md:col-span-2"><AdminField label="Sizes — separate with commas"><input required value={form.sizes} onChange={(event) => setValue('sizes', event.target.value)} placeholder="XS, S, M, L" className="admin-control h-11 w-full px-3" /></AdminField></div>
            </div>
          </Panel>
          <Panel title="Pricing and inventory" subtitle="NGN pricing and authoritative opening stock">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AdminField label="Selling price (₦)"><input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setValue('price', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField>
              <AdminField label="Compare-at price (₦)"><input type="number" min="0.01" step="0.01" value={form.compareAtPrice} onChange={(event) => setValue('compareAtPrice', event.target.value)} placeholder="Optional" className="admin-control h-11 w-full px-3" /></AdminField>
              <AdminField label="On-hand units"><input required type="number" min={product?.inventory?.reserved ?? 0} max="1000000" value={form.onHand} onChange={(event) => setValue('onHand', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField>
            </div>
          </Panel>
        </div>
        <div className="min-w-0 space-y-6">
          <Panel title="Media" subtitle="HTTPS or storefront-relative image URLs" action={<LuImage className="text-admin-muted" />}>
            <div className="space-y-5">
              {form.images.map((image, index) => <div key={index} className="border-b border-admin-line pb-5 last:border-0 last:pb-0"><div className="mb-3 aspect-[4/5] w-full overflow-hidden bg-admin-soft">{image.url ? <img src={image.url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-admin-muted"><LuImage size={24} /></span>}</div><div className="space-y-3"><AdminField label={`Image ${index + 1} URL`}><input value={image.url} onChange={(event) => updateImage(index, 'url', event.target.value)} placeholder="https://… or /images/…" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Alternative text"><input value={image.altText} onChange={(event) => updateImage(index, 'altText', event.target.value)} placeholder="Describe the product image" className="admin-control h-11 w-full px-3" /></AdminField><button type="button" onClick={() => setValue('images', form.images.filter((_, imageIndex) => imageIndex !== index))} className="admin-text-link text-red-700 dark:text-red-300"><LuTrash2 /> Remove image</button></div></div>)}
              {form.images.length < 8 && <button type="button" onClick={() => setValue('images', [...form.images, { url: '', altText: form.name }])} className="admin-button secondary w-full"><LuPlus /> Add image</button>}
            </div>
          </Panel>
          <Panel title="Publishing" subtitle="Storefront visibility and audit trail">
            <div className="space-y-5"><AdminField label="Product status"><select value={form.status} onChange={(event) => setValue('status', event.target.value as ProductFormState['status'])} className="admin-control h-11 w-full px-3"><option value="DRAFT">Draft — hidden</option><option value="PUBLISHED">Published — visible</option><option value="ARCHIVED">Archived — unavailable</option></select></AdminField><AdminField label="Reason for this change"><textarea required minLength={3} maxLength={500} rows={4} value={form.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="New season product, price correction, catalog update…" className="admin-control w-full resize-y p-3" /></AdminField><p className="text-xs leading-5 text-admin-muted">Published products require at least one image. Every save is recorded in the administrator audit log.</p></div>
          </Panel>
        </div>
      </div>
    </form>
    {product?.status === 'ARCHIVED' && <Panel title="Permanent deletion" subtitle="Only archived products without reserved stock can be removed"><div className="grid gap-4 md:grid-cols-2"><AdminField label={`Type “${product.name}” to confirm`}><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Deletion reason"><input minLength={3} maxLength={500} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><button type="button" disabled={busy || deleteConfirmation !== product.name || deleteReason.trim().length < 3} onClick={() => void removeProduct()} className="admin-button border border-red-700 text-red-700 disabled:cursor-not-allowed disabled:opacity-35 md:col-span-2 md:justify-self-start"><LuTrash2 /> Delete permanently</button></div></Panel>}
  </div>
}

function IntegrationPage() {
  return <div className="space-y-5"><PageHeader title="Discounts" description="Plan and manage future campaign codes." actions={<button type="button" disabled className="admin-button primary disabled:opacity-45"><LuBadgePercent /> Create discount</button>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Active codes" value="—" detail="Discount endpoint pending" icon={<LuBadgePercent />} /><StatCard label="Redemptions" value="—" detail="Usage data unavailable" icon={<LuCheck />} /><StatCard label="Discount value" value="—" detail="No simulated totals" icon={<LuCircleDollarSign />} /></div><Panel title="Discount integration" subtitle="No production discount operations are exposed yet"><IntegrationNote text="Percentage and fixed-amount campaigns, usage limits, validity windows, and applicable products will appear here once audited discount endpoints are available." /></Panel></div>
}

function SettingsPage() {
  const sections = [{ title: 'Store profile', detail: 'Brand identity, contact details, and storefront defaults.' }, { title: 'Shipping', detail: 'Delivery regions, thresholds, and future carrier integration.' }, { title: 'Tax', detail: 'Tax display and jurisdiction settings.' }, { title: 'Notifications', detail: 'Operational email preferences and low-stock alerts.' }, { title: 'Account security', detail: 'Administrator sessions, MFA, and recent re-authentication.' }]
  return <div className="space-y-5"><PageHeader title="Settings" description="Configuration is grouped by operational responsibility." /><div className="grid gap-4 lg:grid-cols-2">{sections.map((section) => <Panel key={section.title} title={section.title} subtitle={section.detail}><div className="flex flex-col items-start gap-4 border-l border-admin-line pl-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between"><span className="text-sm leading-5 text-admin-muted">Backend settings contract pending</span><button type="button" disabled className="admin-button secondary w-full disabled:opacity-45 min-[480px]:w-auto">Configure</button></div></Panel>)}</div></div>
}

function AdminBrand({ showAdminLabel = true }: { showAdminLabel?: boolean }) { return <Link to="/admin" aria-label="Lumi Admin home" className="flex h-[70px] items-center justify-between border-b border-admin-line px-5"><LumiLogo compact />{showAdminLabel && <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-admin-muted">Admin</span>}</Link> }

function AdminNavigation({ items, pathname }: { items: NavigationItem[]; pathname: string }) { return <nav aria-label="Admin sections" className="border-t border-admin-line">{items.map((item) => { const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to); return <Link key={item.to} to={item.to} className={navigationClass(active)} aria-current={active ? 'page' : undefined}><span className="text-base">{item.icon}</span>{item.label}<LuArrowRight className="ml-auto" size={14} /></Link> })}</nav> }

function MobileDrawer({ pathname, close }: { pathname: string; close: () => void }) { return <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close Admin navigation" className="absolute inset-0 bg-black/35" onClick={close} /><aside className="absolute inset-y-0 left-0 flex w-[min(92vw,390px)] flex-col bg-admin-bg"><div className="relative border-b border-admin-line"><AdminBrand showAdminLabel={false} /><button type="button" aria-label="Close Admin navigation" onClick={close} className="admin-icon-button absolute right-3 top-1/2 -translate-y-1/2"><LuX /></button></div><div className="flex-1 overflow-y-auto px-5 py-8"><p className="mb-4 text-[9px] font-medium uppercase tracking-[0.22em] text-admin-muted">Workspace</p><AdminNavigation items={primaryNavigation} pathname={pathname} /></div><div className="border-t border-admin-line px-5 py-4"><Link to="/admin/settings" className={navigationClass(pathname === '/admin/settings')}><LuSettings size={16} /> Settings<LuArrowRight className="ml-auto" size={14} /></Link><Link to="/" className={navigationClass(false)}><LuStore size={16} /> View storefront<LuArrowRight className="ml-auto" size={14} /></Link></div></aside></div> }

function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) { return <header className="flex flex-col gap-5 border-b border-admin-line pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="break-words font-display text-[30px] leading-[1.05] sm:text-[36px]">{title}</h1><p className="mt-3 max-w-2xl text-xs leading-5 text-admin-muted sm:text-sm">{description}</p></div>{actions && <div className="admin-page-actions flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">{actions}</div>}</header> }

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) { return <article className="border border-admin-line bg-admin-surface p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-[9px] font-medium uppercase tracking-[0.18em] text-admin-muted">{label}</p><span className="text-admin-muted">{icon}</span></div><p className="mt-8 font-display text-[30px] leading-none tabular-nums sm:text-[34px]">{value}</p><p className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-admin-muted"><LuClock3 size={12} /> {detail}</p></article> }

function Panel({ title, subtitle, action, children, noPadding = false }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode; noPadding?: boolean }) { return <section className="overflow-hidden border border-admin-line bg-admin-surface"><header className="flex flex-col items-start gap-3 border-b border-admin-line px-4 py-5 min-[420px]:flex-row min-[420px]:justify-between sm:px-5"><div className="min-w-0"><h2 className="font-display text-lg">{title}</h2><p className="mt-1 break-words text-[10px] uppercase leading-4 tracking-[0.08em] text-admin-muted">{subtitle}</p></div>{action && <div className="shrink-0">{action}</div>}</header><div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div></section> }

function RecentOrdersTable({ orders }: { orders: AdminDashboard['recentOrders'] }) { return <Panel title="Recent orders" subtitle="Latest customer orders" action={<Link to="/admin/orders" className="admin-text-link">View all <LuArrowRight /></Link>} noPadding><div className="overflow-x-auto"><table className="admin-table min-w-[680px]"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th></tr></thead><tbody>{orders.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td>{order.shippingName}</td><td><StatusBadge value={order.status} /></td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td>{formatDate(order.createdAt)}</td></tr>)}</tbody></table></div></Panel> }

function ProductLine({ product, detail, warning = false }: { product: AdminProduct; detail: string; warning?: boolean }) { return <div className="flex items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className={`mt-0.5 text-xs ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-admin-muted'}`}>{detail}</p></div><span className="text-xs font-medium text-admin-muted">{product.sku}</span></div> }
function ProductIdentity({ product, wrap = false }: { product: AdminProduct; wrap?: boolean }) { return <div className="flex min-w-0 items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0"><strong className={`block font-semibold leading-5 ${wrap ? 'whitespace-normal' : 'truncate'}`}>{product.name}</strong><span className="block truncate text-xs text-admin-muted">{product.sku}</span></div></div> }
function ProductThumbnail({ product }: { product: AdminProduct }) { return <div className="size-11 shrink-0 overflow-hidden bg-admin-soft">{product.images[0] ? <img src={product.images[0].url} alt={product.images[0].altText} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-admin-muted"><LuPackage /></span>}</div> }

function Toolbar({ children }: { children: ReactNode }) { return <div className="grid grid-cols-2 items-center gap-2 border-y border-admin-line py-3 sm:flex sm:flex-wrap">{children}</div> }
function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) { return <label className="min-w-0 sm:w-auto"><span className="sr-only">{label}</span><select value={value} onChange={(event) => setValue(event.target.value)} className="admin-control h-10 w-full min-w-0 px-2 text-sm sm:min-w-32 sm:px-3">{options.map((option) => <option key={option} value={option}>{label}: {titleCase(option)}</option>)}</select></label> }

function InventoryForm({ product, close, reload }: { product: AdminProduct; close: () => void; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [nextOnHand, setNextOnHand] = useState(product.inventory?.onHand ?? 0); const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminInventory(product.id, nextOnHand, reason); close(); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Inventory could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-admin-line pt-5 sm:grid-cols-2"><AdminField label="Resulting on-hand units"><input name="onHand" type="number" min={product.inventory?.reserved ?? 0} max="1000000" required value={nextOnHand} onChange={(event) => setNextOnHand(Number(event.target.value))} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Adjustment reason"><input name="reason" minLength={3} maxLength={500} required placeholder="Stock count or delivery reference" className="admin-control h-11 w-full px-3" /></AdminField><div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save stock'}</button><button type="button" onClick={close} className="admin-button secondary">Cancel</button></div><p className="text-xs leading-5 text-admin-muted sm:col-span-2">Result after save: <strong className="text-admin-ink">{nextOnHand} on hand · {product.inventory?.reserved ?? 0} reserved · {Math.max(0, nextOnHand - (product.inventory?.reserved ?? 0))} available</strong></p>{error && <p role="alert" className="text-sm text-red-700 sm:col-span-2 dark:text-red-300">{error}</p>}</form> }

function OrderStatusForm({ order, reload }: { order: AdminOrder; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const status = nextStatus(order.status)!; const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminOrderStatus(order.number, status, reason); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Order could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="space-y-3"><AdminField label={`Reason for marking ${status.toLowerCase()}`}><textarea name="reason" minLength={3} maxLength={500} required rows={3} placeholder="Fulfilment note or carrier reference" className="admin-control w-full resize-y p-3" /></AdminField><button disabled={busy} className="admin-button primary w-full justify-center">{busy ? 'Saving…' : `Mark ${status.toLowerCase()}`}</button>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</form> }

function StatusTimeline({ status }: { status: string }) { const steps = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']; const currentIndex = steps.indexOf(status); return <ol className="space-y-4">{steps.map((step, index) => <li key={step} className="flex gap-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${index <= currentIndex ? 'border-admin-accent bg-admin-accent text-admin-accent-contrast' : 'border-admin-line text-admin-muted'}`}>{index <= currentIndex ? <LuCheck size={13} /> : index + 1}</span><div><p className="text-sm font-semibold">{titleCase(step)}</p><p className="text-xs text-admin-muted">{index < currentIndex ? 'Completed' : index === currentIndex ? 'Current state' : 'Pending'}</p></div></li>)}</ol> }
function StockMetric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div><p className="text-xs text-admin-muted">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? 'text-amber-700 dark:text-amber-300' : ''}`}>{value}</p></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="border-b border-admin-line py-4"><dt className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">{label}</dt><dd className="mt-2 break-words text-sm font-medium">{value}</dd></div> }

function MobileRecord({ title, status, meta, detail, action }: { title: ReactNode; status: ReactNode; meta: string; detail: string; action: ReactNode }) { return <article className="min-w-0 border border-admin-line bg-admin-surface p-4"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-[160px] flex-1">{typeof title === 'string' ? <h2 className="break-words font-display text-lg leading-6">{title}</h2> : title}<p className="mt-2 break-all text-xs leading-5 text-admin-muted">{meta}</p><p className="mt-2 text-sm font-medium leading-5">{detail}</p></div>{status}</div><div className="mt-5 border-t border-admin-line pt-4">{action}</div></article> }
function EmptyState({ title, detail, compact = false, action }: { title: string; detail: string; compact?: boolean; action?: ReactNode }) { return <div className={`grid place-items-center text-center ${compact ? 'py-6' : 'min-h-56 p-8'}`}><div><span className="mx-auto grid size-10 place-items-center border border-admin-line text-admin-muted"><LuBoxes /></span><h3 className="mt-4 font-display text-lg">{title}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-admin-muted">{detail}</p>{action && <div className="mt-5">{action}</div>}</div></div> }
function IntegrationNote({ text }: { text: string }) { return <div className="flex gap-3 border-l-2 border-admin-ink bg-admin-soft p-4"><LuCircleAlert className="mt-0.5 shrink-0 text-admin-muted" size={18} /><p className="text-sm leading-6 text-admin-muted">{text}</p></div> }
function RevenueChart({ analytics }: { analytics: AdminRevenueAnalytics }) {
  const values = analytics.series.map((point) => Number(point.amount))
  const highestValue = Math.max(...values, 0)
  const scaleMax = Math.max(highestValue, 1)
  const hasRevenue = values.some((value) => value > 0)
  const middle = analytics.series[Math.floor(analytics.series.length / 2)]
  return <div>
    <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.16em] text-admin-muted">Period total</p><p className="mt-1 font-display text-2xl">{formatMoney(Number(analytics.revenue.amount), analytics.revenue.currency)}</p></div><p className="text-right text-[10px] uppercase tracking-[0.1em] text-admin-muted">Highest day<br /><strong className="font-medium text-admin-ink">{formatCompactMoney(highestValue)}</strong></p></div>
    <div className="flex h-56 items-end gap-px border-b border-admin-line" role="img" aria-label={`Daily revenue chart for the last ${analytics.range.days} days`}>
      {analytics.series.map((point) => {
        const amount = Number(point.amount)
        return <div key={point.date} className="group flex h-full min-w-0 flex-1 items-end" title={`${formatShortDate(point.date)} · ${formatMoney(amount, analytics.revenue.currency)} · ${point.orderCount} paid order${point.orderCount === 1 ? '' : 's'}`}><div className={`w-full transition-opacity group-hover:opacity-65 ${amount > 0 ? 'bg-admin-accent' : 'bg-admin-line'}`} style={{ height: `${amount > 0 ? Math.max(4, (amount / scaleMax) * 100) : 1}%` }} /></div>
      })}
    </div>
    <div className="mt-3 grid grid-cols-3 text-[9px] uppercase tracking-[0.1em] text-admin-muted"><span>{formatShortDate(analytics.series[0]?.date)}</span><span className="text-center">{formatShortDate(middle?.date)}</span><span className="text-right">{formatShortDate(analytics.series.at(-1)?.date)}</span></div>
    {!hasRevenue && <p className="mt-5 border-l border-admin-line pl-3 text-xs leading-5 text-admin-muted">No paid NGN revenue was recorded in this period. The graph will update automatically after a confirmed payment.</p>}
  </div>
}
function DateRangeControl({ value, onChange }: { value: 7 | 30 | 90; onChange: (days: 7 | 30 | 90) => void }) { return <label><span className="sr-only">Dashboard date range</span><select value={value} onChange={(event) => onChange(Number(event.target.value) as 7 | 30 | 90)} className="admin-control h-11 px-3 text-sm"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label> }

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
function UserAvatar({ name }: { name: string }) { const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A'; return <span className="grid size-9 shrink-0 place-items-center border border-admin-ink text-[10px] font-medium tracking-[0.08em]">{initials}</span> }
function ChevronIcon() { return <LuChevronDown className="text-admin-muted" size={15} /> }
function AdminGate({ title, detail }: { title: string; detail: string }) { return <main className="admin-theme grid min-h-screen place-items-center bg-admin-bg px-4 text-admin-ink"><section className="w-full max-w-xl border-y border-admin-line py-10 text-center"><Link to="/" aria-label="Lumi home" className="inline-flex"><LumiLogo /></Link><p className="mt-10 text-[9px] font-medium uppercase tracking-[0.2em] text-admin-muted">Lumi administration</p><h1 className="mt-3 font-display text-3xl sm:text-4xl">{title}</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-admin-muted">{detail}</p><div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row"><Link to="/profile" className="admin-button primary">Go to sign in <LuArrowRight /></Link><Link to="/" className="admin-button secondary">Return to store</Link></div></section></main> }
function AdminLoading() { return <main className="admin-theme grid min-h-screen place-items-center bg-admin-bg"><p className="text-sm font-medium text-admin-muted">Checking administrator access…</p></main> }
function AdminPanelLoading() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-shimmer h-40 border border-admin-line" />)}</div> }
function AdminError({ message, retry }: { message: string; retry: () => Promise<void> }) { return <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-4 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"><span className="flex items-center gap-2"><LuCircleAlert />{message}</span><button type="button" onClick={() => void retry()} className="admin-button secondary">Try again</button></div> }

function productFormState(product?: AdminProduct): ProductFormState {
  return product ? {
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    color: product.color,
    sizes: product.sizes.join(', '),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? '',
    status: product.status as ProductFormState['status'],
    onHand: String(product.inventory?.onHand ?? 0),
    reason: '',
    images: product.images.map(({ url, altText }) => ({ url, altText })),
  } : {
    slug: '', sku: '', name: '', description: '', category: '', color: '', sizes: '',
    price: '', compareAtPrice: '', status: 'DRAFT', onHand: '0', reason: '',
    images: [{ url: '', altText: '' }],
  }
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function navigationClass(active: boolean) { return `flex min-h-12 items-center gap-3 border-b border-admin-line px-1 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors ${active ? 'text-admin-ink' : 'text-admin-muted hover:text-admin-ink'} ${active ? 'before:h-4 before:w-px before:bg-admin-ink' : ''}` }
function nextStatus(status: string) { return ({ PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED' } as Record<string, string>)[status] }
function paymentLabel(status: string) { return ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? 'PAID' : status === 'PAYMENT_FAILED' ? 'FAILED' : 'PENDING' }
function titleCase(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }
function formatShortDate(value?: string) { return value ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`)) : '—' }
function formatCompactMoney(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(value) }
function dayPeriod() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening' }
