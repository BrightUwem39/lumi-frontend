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
  createAdminCoupon,
  createAdminProduct,
  createAdminRefund,
  createAdminReturn,
  completeAdminReturn,
  deleteAdminProduct,
  fetchAdminCustomers,
  fetchAdminCoupons,
  fetchAdminDashboard,
  fetchAdminOrder,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminRevenueAnalytics,
  fetchAdminSettings,
  fetchAdminSecurity,
  setAdminInventory,
  setAdminCouponStatus,
  setAdminOrderStatus,
  updateAdminReturnStatus,
  revokeAdminSession,
  revokeOtherAdminSessions,
  updateAdminProduct,
  updateAdminStoreProfile,
  updateAdminShippingSettings,
  updateAdminTaxSettings,
  updateAdminNotificationSettings,
  type AdminCustomer,
  type AdminCoupon,
  type AdminDashboard,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminProduct,
  type AdminProductInput,
  type AdminRevenueAnalytics,
  type AdminReturn,
  type AdminSettings,
  type AdminSecurity,
  type AdminNotificationSettings,
  type AdminShippingSettings,
  type AdminTaxSettings,
  type AdminStoreProfile,
} from '../services/admin'
import { useAuthStore } from '../store/useAuthStore'

type AdminData = {
  dashboard: AdminDashboard
  revenueAnalytics: AdminRevenueAnalytics
  products: AdminProduct[]
  orders: AdminOrder[]
  customers: AdminCustomer[]
  coupons: AdminCoupon[]
  settings: AdminSettings
  security: AdminSecurity
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
      const [dashboard, revenueAnalytics, products, orders, customers, coupons, settings, security] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminRevenueAnalytics(analyticsDays),
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchAdminCustomers(),
        fetchAdminCoupons(),
        fetchAdminSettings(),
        fetchAdminSecurity(),
      ])
      setData({ dashboard, revenueAnalytics, products: products.items, orders: orders.items, customers: customers.items, coupons, settings, security })
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
              <Route path="discounts" element={<DiscountsPage coupons={data.coupons} reload={load} />} />
              <Route path="settings" element={<SettingsPage settings={data.settings} security={data.security} reload={load} />} />
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
      <Panel title="Low stock" subtitle="10 units or fewer" action={<Link to="/admin/inventory" className="admin-text-link">View inventory <LuArrowRight /></Link>}>
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
  const counts = ['ALL', 'DRAFT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED'].map((value) => ({ value, count: value === 'ALL' ? orders.length : orders.filter((order) => order.status === value).length }))
  const needle = query.trim().toLowerCase()
  const visible = orders.filter((order) => (status === 'ALL' || order.status === status) && (!needle || `${order.number} ${order.shippingName} ${order.email}`.toLowerCase().includes(needle)))
  return <div className="space-y-5"><PageHeader title="Orders" description="Track payment state and move fulfilled orders through valid transitions." /><div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{counts.map((item) => <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`admin-chip ${status === item.value ? 'active' : ''}`}>{titleCase(item.value)} <span>{item.count}</span></button>)}</div>{visible.length ? <div className="hidden overflow-x-auto border border-admin-line bg-admin-surface xl:block"><table className="admin-table min-w-[1040px]"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Items</th><th></th></tr></thead><tbody>{visible.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td><strong className="block font-medium">{order.shippingName}</strong><span className="text-xs text-admin-muted">{order.email}</span></td><td>{formatDate(order.createdAt)}</td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td><StatusBadge value={paymentLabel(order.status)} /></td><td><StatusBadge value={order.status} /></td><td>{order.lineCount}</td><td><Link to={`/admin/orders/${order.number}`} className="admin-text-link">Open <LuArrowRight /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching orders" detail="Try another status or search phrase." />}{visible.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:hidden">{visible.map((order) => <MobileRecord key={order.number} title={order.number} status={<StatusBadge value={order.status} />} meta={`${order.shippingName} · ${formatDate(order.createdAt)}`} detail={`${formatMoney(Number(order.total), order.currency)} · ${order.lineCount} item${order.lineCount === 1 ? '' : 's'}`} action={<Link to={`/admin/orders/${order.number}`} className="admin-button secondary">Open</Link>} />)}</div>}</div>
}

function OrderDetailPage({ reload }: { orders: AdminOrder[]; reload: () => Promise<void> }) {
  const { orderNumber = '' } = useParams()
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadOrder = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrder(await fetchAdminOrder(orderNumber))
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Order detail could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [orderNumber])
  useEffect(() => { void loadOrder() }, [loadOrder])
  if (loading && !order) return <AdminPanelLoading />
  if (!order) return <EmptyState title="Order not found" detail={error || 'This order is no longer available.'} action={<Link to="/admin/orders" className="admin-button secondary">Back to orders</Link>} />
  const next = nextStatus(order.status)
  const refresh = async () => { await Promise.all([reload(), loadOrder()]) }
  return <div className="space-y-5"><Link to="/admin/orders" className="admin-text-link"><LuArrowLeft /> Back to orders</Link>{error && <AdminError message={error} retry={loadOrder} />}<PageHeader title={order.number} description={`Created ${formatDate(order.createdAt)} · ${order.lineCount} line item${order.lineCount === 1 ? '' : 's'}`} actions={<StatusBadge value={order.status} />} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><div className="space-y-6"><Panel title="Order summary" subtitle="Server-authoritative payment and fulfilment state"><dl className="grid gap-4 sm:grid-cols-2"><Detail label="Customer" value={order.shippingName} /><Detail label="Email" value={order.email} /><Detail label="Phone" value={order.shippingPhone} /><Detail label="Paid at" value={order.paidAt ? formatDate(order.paidAt) : 'Not paid'} /><Detail label="Payment" value={paymentLabel(order.status)} /><Detail label="Fulfilment" value={titleCase(order.status)} /></dl></Panel><Panel title="Order items" subtitle={`${order.lineCount} purchased line item${order.lineCount === 1 ? '' : 's'}`}><div className="divide-y divide-admin-line">{order.items.map((item) => <article key={item.id} className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center"><div className="size-14 overflow-hidden bg-admin-soft">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-admin-muted"><LuPackage /></span>}</div><div className="min-w-0"><p className="font-semibold leading-5">{item.productName}</p><p className="mt-1 text-xs text-admin-muted">{item.sku} · Size {item.size} · Qty {item.quantity}</p><p className="mt-1 text-xs text-admin-muted">{formatMoney(Number(item.unitPrice), order.currency)} each · {item.returnableQuantity} returnable</p></div><p className="font-semibold tabular-nums sm:text-right">{formatMoney(Number(item.lineTotal), order.currency)}</p></article>)}</div></Panel><ReturnsPanel order={order} reload={refresh} /><Panel title="Shipping address" subtitle="Delivery information supplied at checkout"><address className="not-italic text-sm leading-7"><strong className="block font-semibold">{order.shippingName}</strong><span className="block text-admin-muted">{formatShippingAddress(order.shippingAddress)}</span><span className="block text-admin-muted">{order.shippingPhone}</span></address></Panel></div><div className="space-y-6"><Panel title="Price breakdown" subtitle="Captured order totals"><dl className="space-y-3"><PriceRow label="Subtotal" value={formatMoney(Number(order.subtotal), order.currency)} /><PriceRow label="Discount" value={`−${formatMoney(Number(order.discountTotal), order.currency)}`} /><PriceRow label="Shipping" value={formatMoney(Number(order.shippingTotal), order.currency)} /><PriceRow label="Tax" value={formatMoney(Number(order.taxTotal), order.currency)} /><div className="border-t border-admin-line pt-3"><PriceRow label="Total" value={formatMoney(Number(order.total), order.currency)} strong /></div></dl></Panel><RefundPanel order={order} reload={refresh} /><Panel title="Status timeline" subtitle="Only confirmed server states are shown"><StatusTimeline status={order.status} /></Panel><Panel title="Order action" subtitle="Forward-only transitions are audited">{next ? <OrderStatusForm order={order} reload={refresh} /> : <EmptyState title="No fulfilment action available" detail="This order cannot move forward from its current state." compact />}</Panel></div></div></div>
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

function DiscountsPage({ coupons, reload }: { coupons: AdminCoupon[]; reload: () => Promise<void> }) {
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<AdminCoupon['type']>('PERCENTAGE')
  const active = coupons.filter((coupon) => couponState(coupon) === 'ACTIVE').length
  const scheduled = coupons.filter((coupon) => couponState(coupon) === 'SCHEDULED').length
  const redemptions = coupons.reduce((sum, coupon) => sum + coupon.usageCount, 0)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setError('')
    try {
      const startsAt = String(fields.get('startsAt') || '')
      const expiresAt = String(fields.get('expiresAt') || '')
      await createAdminCoupon({
        code: String(fields.get('code')),
        type,
        value: Number(fields.get('value')),
        ...optionalNumber('minimumSubtotal', fields),
        ...(type === 'PERCENTAGE' ? optionalNumber('maximumDiscount', fields) : {}),
        ...optionalInteger('usageLimit', fields),
        ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        active: fields.get('active') === 'on',
        reason: String(fields.get('reason')),
      })
      form.reset()
      setType('PERCENTAGE')
      setCreating(false)
      await reload()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Discount could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (coupon: AdminCoupon) => {
    setBusy(true)
    setError('')
    try {
      const active = !coupon.active
      await setAdminCouponStatus(coupon.id, active, `${active ? 'Activated' : 'Deactivated'} from the administrator discount workspace`)
      await reload()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Discount status could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-5"><PageHeader title="Discounts" description="Create and control audited percentage and fixed-amount campaign codes." actions={<button type="button" onClick={() => setCreating((value) => !value)} className="admin-button primary"><LuBadgePercent />{creating ? 'Close form' : 'Create discount'}</button>} />{error && <AdminError message={error} retry={reload} />}<div className="grid gap-4 sm:grid-cols-3"><StatCard label="Active codes" value={String(active)} detail="Available within current rules" icon={<LuBadgePercent />} /><StatCard label="Redemptions" value={redemptions.toLocaleString()} detail="Recorded coupon uses" icon={<LuCheck />} /><StatCard label="Scheduled" value={String(scheduled)} detail="Campaigns starting later" icon={<LuClock3 />} /></div>{creating && <Panel title="Create discount" subtitle="All changes are recorded in the administrator audit log"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><AdminField label="Discount code"><input name="code" required minLength={3} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9_-]+" placeholder="LUMI10" className="admin-control h-11 w-full px-3 uppercase" /></AdminField><AdminField label="Discount type"><select value={type} onChange={(event) => setType(event.target.value as AdminCoupon['type'])} className="admin-control h-11 w-full px-3"><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></AdminField><AdminField label={type === 'PERCENTAGE' ? 'Percentage value' : 'Amount (NGN)'}><input name="value" type="number" required min="0.01" max={type === 'PERCENTAGE' ? 100 : 1_000_000_000} step="0.01" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Minimum subtotal (optional)"><input name="minimumSubtotal" type="number" min="0" step="0.01" className="admin-control h-11 w-full px-3" /></AdminField>{type === 'PERCENTAGE' && <AdminField label="Maximum discount (optional)"><input name="maximumDiscount" type="number" min="0.01" step="0.01" className="admin-control h-11 w-full px-3" /></AdminField>}<AdminField label="Usage limit (optional)"><input name="usageLimit" type="number" min="1" max="1000000" step="1" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Starts at (optional)"><input name="startsAt" type="datetime-local" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Expires at (optional)"><input name="expiresAt" type="datetime-local" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Creation reason"><input name="reason" required minLength={3} maxLength={500} placeholder="Seasonal campaign" className="admin-control h-11 w-full px-3" /></AdminField><label className="flex min-h-11 items-center gap-3 text-sm"><input name="active" type="checkbox" defaultChecked className="size-4 accent-current" /> Activate immediately or at the start date</label><div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3"><button disabled={busy} className="admin-button primary">{busy ? 'Creating…' : 'Create discount'}</button><button type="button" onClick={() => setCreating(false)} className="admin-button secondary">Cancel</button></div></form></Panel>}<Panel title="Campaign codes" subtitle={`${coupons.length} configured discount${coupons.length === 1 ? '' : 's'}`}>{coupons.length ? <div className="grid gap-3 md:grid-cols-2">{coupons.map((coupon) => { const state = couponState(coupon); return <article key={coupon.id} className="border border-admin-line p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-xl tracking-wide">{coupon.code}</p><p className="mt-1 text-xs text-admin-muted">{couponValue(coupon)} discount</p></div><StatusBadge value={state} /></div><dl className="mt-5 grid grid-cols-2 gap-x-4 border-y border-admin-line py-3 text-xs"><Detail label="Usage" value={`${coupon.usageCount}${coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}`} /><Detail label="Minimum order" value={coupon.minimumSubtotal ? formatMoney(Number(coupon.minimumSubtotal), 'NGN') : 'None'} /><Detail label="Starts" value={coupon.startsAt ? formatDate(coupon.startsAt) : 'Immediately'} /><Detail label="Expires" value={coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No expiry'} /></dl><button type="button" disabled={busy} onClick={() => void toggle(coupon)} className="admin-button secondary mt-4 w-full justify-center">{coupon.active ? 'Deactivate' : 'Activate'}</button></article> })}</div> : <EmptyState title="No discount codes yet" detail="Create the first campaign code when you are ready." compact />}</Panel></div>
}

function SettingsPage({ settings, security, reload }: { settings: AdminSettings; security: AdminSecurity; reload: () => Promise<void> }) {
  const [profile, setProfile] = useState<AdminStoreProfile>(settings.storeProfile)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => setProfile(settings.storeProfile), [settings.storeProfile])
  const setValue = (key: keyof AdminStoreProfile, value: string) => setProfile((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await updateAdminStoreProfile({ ...profile, reason })
      await reload()
      setReason('')
      setSaved(true)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Store profile could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  return <div className="space-y-5"><PageHeader title="Settings" description="Configuration is grouped by operational responsibility." /><Panel title="Store profile" subtitle="Brand identity, contact details, and storefront defaults"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><AdminField label="Store name"><input required minLength={2} maxLength={100} value={profile.storeName} onChange={(event) => setValue('storeName', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Default currency"><select value={profile.defaultCurrency} onChange={(event) => setValue('defaultCurrency', event.target.value)} className="admin-control h-11 w-full px-3"><option value="NGN">Nigerian naira (NGN)</option></select></AdminField><div className="md:col-span-2"><AdminField label="Store tagline"><input required minLength={10} maxLength={200} value={profile.tagline} onChange={(event) => setValue('tagline', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField></div><AdminField label="Support email"><input type="email" required maxLength={320} value={profile.supportEmail} onChange={(event) => setValue('supportEmail', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Support phone"><input type="tel" required minLength={5} maxLength={32} value={profile.supportPhone} onChange={(event) => setValue('supportPhone', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Address"><input required minLength={2} maxLength={250} value={profile.addressLine} onChange={(event) => setValue('addressLine', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="City"><input required minLength={2} maxLength={100} value={profile.city} onChange={(event) => setValue('city', event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Country code"><input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={profile.countryCode} onChange={(event) => setValue('countryCode', event.target.value.toUpperCase())} className="admin-control h-11 w-full px-3 uppercase" /></AdminField><AdminField label="Reason for this change"><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Updated customer support details" className="admin-control h-11 w-full px-3" /></AdminField><div className="flex flex-wrap items-center gap-3 md:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save store profile'}</button>{saved && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Store profile saved.</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div></form></Panel><ShippingSettingsForm settings={settings.shipping} reload={reload} /><TaxSettingsForm settings={settings.tax} reload={reload} /><NotificationSettingsForm settings={settings.notifications} reload={reload} /><AccountSecurityPanel security={security} reload={reload} /></div>
}

function ShippingSettingsForm({ settings, reload }: { settings: AdminShippingSettings; reload: () => Promise<void> }) {
  const [enabled, setEnabled] = useState(settings.shippingEnabled)
  const [fee, setFee] = useState(settings.shippingFee)
  const [threshold, setThreshold] = useState(settings.freeShippingThreshold)
  const [minimumDays, setMinimumDays] = useState(String(settings.deliveryMinDays))
  const [maximumDays, setMaximumDays] = useState(String(settings.deliveryMaxDays))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => { setEnabled(settings.shippingEnabled); setFee(settings.shippingFee); setThreshold(settings.freeShippingThreshold); setMinimumDays(String(settings.deliveryMinDays)); setMaximumDays(String(settings.deliveryMaxDays)) }, [settings])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true); setError(''); setSaved(false)
    try {
      await updateAdminShippingSettings({ shippingEnabled: enabled, shippingFee: Number(fee), freeShippingThreshold: Number(threshold), deliveryMinDays: Number(minimumDays), deliveryMaxDays: Number(maximumDays), reason })
      await reload(); setReason(''); setSaved(true)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Shipping settings could not be saved.')
    } finally { setBusy(false) }
  }
  return <Panel title="Shipping" subtitle="Live NGN delivery charges and estimated delivery window"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label className="flex min-h-11 items-center gap-3 text-sm md:col-span-2"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-current" /> Accept orders requiring shipping</label><AdminField label="Shipping fee (NGN)"><input type="number" required min="0" max="1000000000" step="0.01" value={fee} onChange={(event) => setFee(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Free shipping from (NGN)"><input type="number" required min="0" max="1000000000" step="0.01" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Minimum delivery days"><input type="number" required min="1" max="60" step="1" value={minimumDays} onChange={(event) => setMinimumDays(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Maximum delivery days"><input type="number" required min="1" max="90" step="1" value={maximumDays} onChange={(event) => setMaximumDays(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><div className="md:col-span-2"><AdminField label="Reason for this change"><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Updated local delivery pricing" className="admin-control h-11 w-full px-3" /></AdminField></div><div className="flex flex-wrap items-center gap-3 md:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save shipping settings'}</button>{saved && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Shipping settings saved.</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div></form></Panel>
}

function TaxSettingsForm({ settings, reload }: { settings: AdminTaxSettings; reload: () => Promise<void> }) {
  const [enabled, setEnabled] = useState(settings.taxEnabled)
  const [rate, setRate] = useState(settings.taxRate)
  const [label, setLabel] = useState(settings.taxLabel)
  const [inclusive, setInclusive] = useState(settings.pricesIncludeTax)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => { setEnabled(settings.taxEnabled); setRate(settings.taxRate); setLabel(settings.taxLabel); setInclusive(settings.pricesIncludeTax) }, [settings])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false)
    try {
      await updateAdminTaxSettings({ taxEnabled: enabled, taxRate: Number(rate), taxLabel: label, pricesIncludeTax: inclusive, reason })
      await reload(); setReason(''); setSaved(true)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Tax settings could not be saved.')
    } finally { setBusy(false) }
  }
  return <Panel title="Tax" subtitle="Live tax calculation applied to server-authoritative order totals"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-current" /> Calculate tax at checkout</label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={inclusive} onChange={(event) => setInclusive(event.target.checked)} className="size-4 accent-current" /> Product prices already include tax</label><AdminField label="Tax label"><input required minLength={2} maxLength={40} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="VAT" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Tax rate (%)"><input type="number" required min={enabled ? 0.01 : 0} max="100" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><div className="md:col-span-2"><AdminField label="Reason for this change"><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Updated VAT configuration" className="admin-control h-11 w-full px-3" /></AdminField></div><div className="flex flex-wrap items-center gap-3 md:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save tax settings'}</button>{saved && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Tax settings saved.</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div></form></Panel>
}

function NotificationSettingsForm({ settings, reload }: { settings: AdminNotificationSettings; reload: () => Promise<void> }) {
  const [email, setEmail] = useState(settings.notificationEmail)
  const [orderAlerts, setOrderAlerts] = useState(settings.orderPaidAlerts)
  const [stockAlerts, setStockAlerts] = useState(settings.lowStockAlerts)
  const [threshold, setThreshold] = useState(String(settings.lowStockThreshold))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => { setEmail(settings.notificationEmail); setOrderAlerts(settings.orderPaidAlerts); setStockAlerts(settings.lowStockAlerts); setThreshold(String(settings.lowStockThreshold)) }, [settings])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false)
    try {
      await updateAdminNotificationSettings({ notificationEmail: email, orderPaidAlerts: orderAlerts, lowStockAlerts: stockAlerts, lowStockThreshold: Number(threshold), reason })
      await reload(); setReason(''); setSaved(true)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Notification settings could not be saved.')
    } finally { setBusy(false) }
  }
  return <Panel title="Notifications" subtitle="Operational Brevo email alerts after confirmed payments"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><AdminField label="Notification email"><input type="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="orders@example.com" className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Low-stock threshold (available units)"><input type="number" required min="0" max="1000000" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="admin-control h-11 w-full px-3" /></AdminField><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={orderAlerts} onChange={(event) => setOrderAlerts(event.target.checked)} className="size-4 accent-current" /> Email me when an order is paid</label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={stockAlerts} onChange={(event) => setStockAlerts(event.target.checked)} className="size-4 accent-current" /> Include products at or below the stock threshold</label><div className="md:col-span-2"><AdminField label="Reason for this change"><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Enable fulfilment team alerts" className="admin-control h-11 w-full px-3" /></AdminField></div><p className="text-xs leading-5 text-admin-muted md:col-span-2">Alerts are disabled by default. Saving an email address alone will not send messages until at least one alert option is enabled.</p><div className="flex flex-wrap items-center gap-3 md:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save notification settings'}</button>{saved && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">Notification settings saved.</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div></form></Panel>
}

function AccountSecurityPanel({ security, reload }: { security: AdminSecurity; reload: () => Promise<void> }) {
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const activeOthers = security.sessions.filter((session) => session.status === 'ACTIVE' && !session.current)
  const run = async (sessionId?: string) => {
    if (reason.trim().length < 3) {
      setError('Enter a reason of at least 3 characters before revoking a session.')
      return
    }
    const key = sessionId ?? 'all'
    setBusyId(key); setError(''); setMessage('')
    try {
      const result = sessionId
        ? await revokeAdminSession(sessionId, reason)
        : await revokeOtherAdminSessions(reason)
      await reload()
      setReason('')
      setMessage(result.revoked === 1 ? '1 session revoked.' : `${result.revoked} sessions revoked.`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The session could not be revoked.')
    } finally { setBusyId('') }
  }
  return <Panel title="Account security" subtitle="Administrator session control and audited security activity"><div className="space-y-6"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"><AdminField label="Reason for revoking access"><input required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Device lost or session no longer needed" className="admin-control h-11 w-full px-3" /></AdminField><button type="button" disabled={busyId !== '' || activeOthers.length === 0} onClick={() => void run()} className="admin-button secondary min-h-11 justify-center">{busyId === 'all' ? 'Revoking…' : `Revoke all other sessions (${activeOthers.length})`}</button></div>{message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}<div><h3 className="text-[9px] font-medium uppercase tracking-[0.18em] text-admin-muted">Recent sessions</h3><div className="mt-3 grid gap-3 lg:grid-cols-2">{security.sessions.map((session) => <article key={session.id} className="min-w-0 border border-admin-line p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{describeDevice(session.userAgent)}</p><p className="mt-1 text-xs text-admin-muted">Last active {formatDateTime(session.lastSeenAt)}</p></div><StatusBadge value={session.current ? 'CURRENT' : session.status} /></div><dl className="mt-4 grid gap-2 border-t border-admin-line pt-3 text-xs sm:grid-cols-2"><div><dt className="text-admin-muted">Signed in</dt><dd className="mt-1 font-medium">{formatDateTime(session.createdAt)}</dd></div><div><dt className="text-admin-muted">Expires</dt><dd className="mt-1 font-medium">{formatDateTime(session.expiresAt)}</dd></div></dl>{session.status === 'ACTIVE' && !session.current && <button type="button" disabled={busyId !== ''} onClick={() => void run(session.id)} className="admin-button secondary mt-4 w-full justify-center">{busyId === session.id ? 'Revoking…' : 'Revoke this session'}</button>}</article>)}</div></div><div><h3 className="text-[9px] font-medium uppercase tracking-[0.18em] text-admin-muted">Recent security activity</h3>{security.activity.length ? <div className="mt-3 divide-y divide-admin-line border-y border-admin-line">{security.activity.map((event) => <div key={event.id} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><div className="min-w-0"><p className="text-sm font-semibold">{securityActionLabel(event.action)}</p><p className="mt-1 break-words text-xs leading-5 text-admin-muted">{event.reason ?? 'No reason recorded'}</p></div><time className="text-xs text-admin-muted sm:text-right">{formatDateTime(event.createdAt)}</time></div>)}</div> : <EmptyState title="No security changes yet" detail="Session revocations will appear here with their recorded reason." compact />}</div><p className="border-l border-admin-line pl-4 text-xs leading-5 text-admin-muted">Multi-factor authentication requires a separate enrollment and recovery workflow and is not enabled yet.</p></div></Panel>
}

function AdminBrand({ showAdminLabel = true }: { showAdminLabel?: boolean }) { return <Link to="/admin" aria-label="Lumi Admin home" className="flex h-[70px] items-center justify-between border-b border-admin-line px-5"><LumiLogo compact />{showAdminLabel && <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-admin-muted">Admin</span>}</Link> }

function AdminNavigation({ items, pathname }: { items: NavigationItem[]; pathname: string }) { return <nav aria-label="Admin sections" className="border-t border-admin-line">{items.map((item) => { const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to); return <Link key={item.to} to={item.to} className={navigationClass(active)} aria-current={active ? 'page' : undefined}><span className="text-base">{item.icon}</span>{item.label}<LuArrowRight className="ml-auto" size={14} /></Link> })}</nav> }

function MobileDrawer({ pathname, close }: { pathname: string; close: () => void }) { return <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Close Admin navigation" className="absolute inset-0 bg-black/35" onClick={close} /><aside className="absolute inset-y-0 left-0 flex w-[min(92vw,390px)] flex-col bg-admin-bg"><div className="relative border-b border-admin-line"><AdminBrand showAdminLabel={false} /><button type="button" aria-label="Close Admin navigation" onClick={close} className="admin-icon-button absolute right-3 top-1/2 -translate-y-1/2"><LuX /></button></div><div className="flex-1 overflow-y-auto px-5 py-8"><p className="mb-4 text-[9px] font-medium uppercase tracking-[0.22em] text-admin-muted">Workspace</p><AdminNavigation items={primaryNavigation} pathname={pathname} /></div><div className="border-t border-admin-line px-5 py-4"><Link to="/admin/settings" className={navigationClass(pathname === '/admin/settings')}><LuSettings size={16} /> Settings<LuArrowRight className="ml-auto" size={14} /></Link><Link to="/" className={navigationClass(false)}><LuStore size={16} /> View storefront<LuArrowRight className="ml-auto" size={14} /></Link></div></aside></div> }

function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) { return <header className="flex flex-col gap-5 border-b border-admin-line pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h1 className="break-words font-display text-[30px] leading-[1.05] sm:text-[36px]">{title}</h1><p className="mt-3 max-w-2xl text-xs leading-5 text-admin-muted sm:text-sm">{description}</p></div>{actions && <div className="admin-page-actions flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">{actions}</div>}</header> }

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) { return <article className="min-w-0 border border-admin-line bg-admin-surface p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-[9px] font-medium uppercase tracking-[0.18em] text-admin-muted">{label}</p><span className="text-admin-muted">{icon}</span></div><p className="mt-8 max-w-full whitespace-nowrap font-display text-[clamp(1.375rem,7vw,2.125rem)] leading-none tracking-[-0.02em] tabular-nums">{value}</p><p className="mt-4 flex items-start gap-1.5 text-[10px] uppercase leading-4 tracking-[0.08em] text-admin-muted"><LuClock3 className="mt-0.5 shrink-0" size={12} /> {detail}</p></article> }

function Panel({ title, subtitle, action, children, noPadding = false }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode; noPadding?: boolean }) { return <section className="overflow-hidden border border-admin-line bg-admin-surface"><header className="flex flex-col items-start gap-3 border-b border-admin-line px-4 py-5 min-[420px]:flex-row min-[420px]:justify-between sm:px-5"><div className="min-w-0"><h2 className="font-display text-lg">{title}</h2><p className="mt-1 break-words text-[10px] uppercase leading-4 tracking-[0.08em] text-admin-muted">{subtitle}</p></div>{action && <div className="shrink-0">{action}</div>}</header><div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div></section> }

function RecentOrdersTable({ orders }: { orders: AdminDashboard['recentOrders'] }) { return <Panel title="Recent orders" subtitle="Latest customer orders" action={<Link to="/admin/orders" className="admin-text-link">View all <LuArrowRight /></Link>} noPadding><div className="overflow-x-auto"><table className="admin-table min-w-[680px]"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th></tr></thead><tbody>{orders.map((order) => <tr key={order.number}><td><Link to={`/admin/orders/${order.number}`} className="font-semibold hover:text-admin-accent">{order.number}</Link></td><td>{order.shippingName}</td><td><StatusBadge value={order.status} /></td><td className="font-semibold tabular-nums">{formatMoney(Number(order.total), order.currency)}</td><td>{formatDate(order.createdAt)}</td></tr>)}</tbody></table></div></Panel> }

function ProductLine({ product, detail, warning = false }: { product: AdminProduct; detail: string; warning?: boolean }) { return <div className="flex items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className={`mt-0.5 text-xs ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-admin-muted'}`}>{detail}</p></div><span className="text-xs font-medium text-admin-muted">{product.sku}</span></div> }
function ProductIdentity({ product, wrap = false }: { product: AdminProduct; wrap?: boolean }) { return <div className="flex min-w-0 items-center gap-3"><ProductThumbnail product={product} /><div className="min-w-0"><strong className={`block font-semibold leading-5 ${wrap ? 'whitespace-normal' : 'truncate'}`}>{product.name}</strong><span className="block truncate text-xs text-admin-muted">{product.sku}</span></div></div> }
function ProductThumbnail({ product }: { product: AdminProduct }) { return <div className="size-11 shrink-0 overflow-hidden bg-admin-soft">{product.images[0] ? <img src={product.images[0].url} alt={product.images[0].altText} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-admin-muted"><LuPackage /></span>}</div> }

function Toolbar({ children }: { children: ReactNode }) { return <div className="grid grid-cols-2 items-center gap-2 border-y border-admin-line py-3 sm:flex sm:flex-wrap">{children}</div> }
function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) { return <label className="min-w-0 sm:w-auto"><span className="sr-only">{label}</span><select value={value} onChange={(event) => setValue(event.target.value)} className="admin-control h-10 w-full min-w-0 px-2 text-sm sm:min-w-32 sm:px-3">{options.map((option) => <option key={option} value={option}>{label}: {titleCase(option)}</option>)}</select></label> }

function InventoryForm({ product, close, reload }: { product: AdminProduct; close: () => void; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [nextOnHand, setNextOnHand] = useState(product.inventory?.onHand ?? 0); const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminInventory(product.id, nextOnHand, reason); close(); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Inventory could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-admin-line pt-5 sm:grid-cols-2"><AdminField label="Resulting on-hand units"><input name="onHand" type="number" min={product.inventory?.reserved ?? 0} max="1000000" required value={nextOnHand} onChange={(event) => setNextOnHand(Number(event.target.value))} className="admin-control h-11 w-full px-3" /></AdminField><AdminField label="Adjustment reason"><input name="reason" minLength={3} maxLength={500} required placeholder="Stock count or delivery reference" className="admin-control h-11 w-full px-3" /></AdminField><div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} className="admin-button primary">{busy ? 'Saving…' : 'Save stock'}</button><button type="button" onClick={close} className="admin-button secondary">Cancel</button></div><p className="text-xs leading-5 text-admin-muted sm:col-span-2">Result after save: <strong className="text-admin-ink">{nextOnHand} on hand · {product.inventory?.reserved ?? 0} reserved · {Math.max(0, nextOnHand - (product.inventory?.reserved ?? 0))} available</strong></p>{error && <p role="alert" className="text-sm text-red-700 sm:col-span-2 dark:text-red-300">{error}</p>}</form> }

function OrderStatusForm({ order, reload }: { order: AdminOrder; reload: () => Promise<void> }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const status = nextStatus(order.status)!; const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const reason = String(new FormData(event.currentTarget).get('reason')); try { await setAdminOrderStatus(order.number, status, reason); await reload() } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Order could not be updated.') } finally { setBusy(false) } }; return <form onSubmit={submit} className="space-y-3"><AdminField label={`Reason for marking ${status.toLowerCase()}`}><textarea name="reason" minLength={3} maxLength={500} required rows={3} placeholder="Fulfilment note or carrier reference" className="admin-control w-full resize-y p-3" /></AdminField><button disabled={busy} className="admin-button primary w-full justify-center">{busy ? 'Saving…' : `Mark ${status.toLowerCase()}`}</button>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</form> }

function ReturnsPanel({ order, reload }: { order: AdminOrderDetail; reload: () => Promise<void> }) {
  const returns = order.returns ?? []
  const returnableItems = order.items.filter((item) => item.returnableQuantity > 0)
  const canOpenReturn = ['SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(order.status) && returnableItems.length > 0
  const [showCreate, setShowCreate] = useState(false)

  return <Panel title="Product returns" subtitle="Audited receiving and inventory decisions" action={canOpenReturn && !showCreate ? <button type="button" onClick={() => setShowCreate(true)} className="admin-button secondary"><LuPlus size={15} /> Open return</button> : undefined}>
    <div className="space-y-5">
      {showCreate && <CreateReturnForm order={order} close={() => setShowCreate(false)} reload={reload} />}
      {!canOpenReturn && returns.length === 0 && <p className="text-sm leading-6 text-admin-muted">Returns become available after an order has shipped. This order currently has no returnable items.</p>}
      {returns.length > 0 && <div className="space-y-4">
        {returns.map((productReturn) => <ReturnRecord key={productReturn.id} productReturn={productReturn} reload={reload} />)}
      </div>}
    </div>
  </Panel>
}

function CreateReturnForm({ order, close, reload }: { order: AdminOrderDetail; close: () => void; reload: () => Promise<void> }) {
  const items = order.items.filter((item) => item.returnableQuantity > 0)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(items.map((item) => [item.id, 0])))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const selected = items.flatMap((item) => quantities[item.id] > 0 ? [{ orderItemId: item.id, quantity: quantities[item.id] }] : [])
    if (!selected.length) { setError('Choose at least one item and return quantity.'); return }
    if (reason.trim().length < 3) { setError('Enter a clear return reason of at least 3 characters.'); return }
    setBusy(true)
    try {
      await createAdminReturn(order.number, { items: selected, reason: reason.trim() })
      close(); await reload()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The return could not be opened.')
    } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="border border-admin-line bg-admin-soft p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-lg">Open a product return</p><p className="mt-1 text-xs leading-5 text-admin-muted">Use zero for items the customer is keeping.</p></div><button type="button" onClick={close} className="admin-text-link"><LuX /> Close</button></div>
    <div className="mt-4 divide-y divide-admin-line border-y border-admin-line">{items.map((item) => <label key={item.id} className="grid gap-3 py-3 min-[480px]:grid-cols-[minmax(0,1fr)_96px] min-[480px]:items-center"><span className="min-w-0"><strong className="block text-sm leading-5">{item.productName}</strong><span className="mt-1 block text-xs text-admin-muted">{item.sku} · Size {item.size} · {item.returnableQuantity} available to return</span></span><span><span className="sr-only">Return quantity for {item.productName}</span><input type="number" min="0" max={item.returnableQuantity} step="1" value={quantities[item.id]} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="admin-control h-10 w-full px-3 tabular-nums" /></span></label>)}</div>
    <div className="mt-4"><AdminField label="Customer's reason for return"><textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Wrong size, damaged item, or another clear reason" className="admin-control w-full resize-y p-3" /></AdminField></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row"><button disabled={busy} className="admin-button primary justify-center">{busy ? 'Opening…' : 'Open return'}</button><button type="button" disabled={busy} onClick={close} className="admin-button secondary justify-center">Cancel</button></div>
  </form>
}

function ReturnRecord({ productReturn, reload }: { productReturn: AdminReturn; reload: () => Promise<void> }) {
  return <article className="border border-admin-line p-4 sm:p-5">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">Return {productReturn.id.slice(0, 8).toUpperCase()}</p><p className="mt-2 text-xs text-admin-muted">Opened {formatDateTime(productReturn.createdAt)}</p></div><StatusBadge value={productReturn.status} /></div>
    <p className="mt-4 break-words text-sm leading-6">{productReturn.reason}</p>
    <div className="mt-4 divide-y divide-admin-line border-y border-admin-line">{productReturn.items.map((item) => <div key={item.id} className="grid gap-2 py-3 min-[480px]:grid-cols-[minmax(0,1fr)_auto] min-[480px]:items-center"><div className="min-w-0"><p className="text-sm font-semibold">{item.orderItem.productName}</p><p className="mt-1 text-xs text-admin-muted">{item.orderItem.sku} · Size {item.orderItem.size}</p></div><p className="text-xs font-medium tabular-nums text-admin-muted">Returned {item.quantity}{productReturn.status === 'COMPLETED' ? ` · Restocked ${item.restockedQuantity}` : ''}</p></div>)}</div>
    {productReturn.resolutionNote && <p className="mt-4 border-l-2 border-admin-line pl-3 text-xs leading-5 text-admin-muted">Latest note: {productReturn.resolutionNote}</p>}
    <ReturnAction productReturn={productReturn} reload={reload} />
  </article>
}

function ReturnAction({ productReturn, reload }: { productReturn: AdminReturn; reload: () => Promise<void> }) {
  if (productReturn.status === 'RECEIVED') return <CompleteReturnForm productReturn={productReturn} reload={reload} />
  if (['REJECTED', 'COMPLETED'].includes(productReturn.status)) return null
  return <ReturnStatusForm productReturn={productReturn} reload={reload} />
}

function ReturnStatusForm({ productReturn, reload }: { productReturn: AdminReturn; reload: () => Promise<void> }) {
  const choices = productReturn.status === 'REQUESTED' ? ['APPROVED', 'REJECTED'] as const : ['RECEIVED'] as const
  const [status, setStatus] = useState<(typeof choices)[number]>(choices[0])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await updateAdminReturnStatus(productReturn.id, { status, resolutionNote: note.trim() })
      await reload()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The return status could not be updated.')
    } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-admin-line pt-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
    {choices.length > 1 ? <AdminField label="Decision"><select value={status} onChange={(event) => setStatus(event.target.value as (typeof choices)[number])} className="admin-control h-11 w-full px-3">{choices.map((choice) => <option key={choice} value={choice}>{titleCase(choice)}</option>)}</select></AdminField> : <div><p className="text-xs font-medium text-admin-muted">Next stage</p><p className="mt-3 text-sm font-semibold">Mark parcel received</p></div>}
    <AdminField label="Audit note"><input required minLength={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder={status === 'REJECTED' ? 'Why the request was rejected' : status === 'RECEIVED' ? 'Warehouse or parcel reference' : 'Approval note'} className="admin-control h-11 w-full px-3" /></AdminField>
    <button disabled={busy} className="admin-button secondary justify-center sm:col-span-2 sm:w-fit">{busy ? 'Saving…' : status === 'RECEIVED' ? 'Confirm parcel received' : `Mark ${status.toLowerCase()}`}</button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2 dark:text-red-300">{error}</p>}
  </form>
}

function CompleteReturnForm({ productReturn, reload }: { productReturn: AdminReturn; reload: () => Promise<void> }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(productReturn.items.map((item) => [item.id, item.quantity])))
  const [note, setNote] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const total = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0)
  const prepare = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(''); if (note.trim().length < 3) { setError('Enter an inspection note of at least 3 characters.'); return }; setConfirmation(true) }
  const complete = async () => {
    setBusy(true); setError('')
    try {
      await completeAdminReturn(productReturn.id, { items: productReturn.items.map((item) => ({ returnItemId: item.id, quantity: quantities[item.id] })), resolutionNote: note.trim() })
      await reload()
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The return could not be completed.')
    } finally { setBusy(false) }
  }
  return <form onSubmit={prepare} className="mt-5 border-t border-admin-line pt-5">
    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">Inventory inspection</p><p className="mt-2 text-xs leading-5 text-admin-muted">Enter only units that passed inspection and can be sold again. Use zero for damaged or non-resellable units.</p>
    <div className="mt-3 divide-y divide-admin-line">{productReturn.items.map((item) => <label key={item.id} className="grid gap-2 py-3 min-[480px]:grid-cols-[minmax(0,1fr)_104px] min-[480px]:items-center"><span><strong className="block text-sm">{item.orderItem.productName}</strong><span className="mt-1 block text-xs text-admin-muted">Maximum {item.quantity} received</span></span><span><span className="sr-only">Restock quantity for {item.orderItem.productName}</span><input type="number" min="0" max={item.quantity} step="1" value={quantities[item.id]} onChange={(event) => { setConfirmation(false); setQuantities((current) => ({ ...current, [item.id]: Number(event.target.value) })) }} className="admin-control h-10 w-full px-3 tabular-nums" /></span></label>)}</div>
    <div className="mt-3"><AdminField label="Inspection and completion note"><textarea required minLength={3} maxLength={500} rows={3} value={note} onChange={(event) => { setConfirmation(false); setNote(event.target.value) }} placeholder="Condition received and reason for any units not restocked" className="admin-control w-full resize-y p-3" /></AdminField></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {confirmation ? <div className="mt-4 border border-admin-line bg-admin-soft p-4"><p className="text-sm leading-6">Complete this return and add <strong>{total} unit{total === 1 ? '' : 's'}</strong> back to sellable inventory?</p><div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row"><button type="button" disabled={busy} onClick={() => void complete()} className="admin-button primary justify-center">{busy ? 'Completing…' : 'Confirm and restock'}</button><button type="button" disabled={busy} onClick={() => setConfirmation(false)} className="admin-button secondary justify-center">Review quantities</button></div></div> : <button className="admin-button secondary mt-4 w-full justify-center min-[420px]:w-fit">Review completion</button>}
  </form>
}

function RefundPanel({ order, reload }: { order: AdminOrderDetail; reload: () => Promise<void> }) {
  const refundableAmount = order.refundableAmount ?? '0.00'
  const refunds = order.refunds ?? []
  const available = Number(refundableAmount)
  const [amount, setAmount] = useState(refundableAmount)
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState<{ amount: number; reason: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => setAmount(refundableAmount), [refundableAmount])
  const prepare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    const requested = Number(amount)
    if (!Number.isFinite(requested) || requested <= 0 || requested > available) {
      setError(`Enter an amount between ${formatMoney(0.01, order.currency)} and ${formatMoney(available, order.currency)}.`)
      return
    }
    if (reason.trim().length < 3) {
      setError('Enter a clear refund reason of at least 3 characters.')
      return
    }
    setConfirmation({ amount: requested, reason: reason.trim() })
  }
  const confirm = async () => {
    if (!confirmation) return
    setBusy(true); setError(''); setMessage('')
    try {
      const refund = await createAdminRefund(order.number, confirmation)
      setConfirmation(null); setReason('')
      setMessage(`${formatMoney(Number(refund.amount), refund.currency)} refund queued with Paystack.`)
      try {
        await reload()
      } catch {
        setError('The refund was queued, but the latest status could not be refreshed. Reload this page before taking another action.')
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'The refund could not be queued.')
    } finally { setBusy(false) }
  }
  const canRefund = available > 0 && ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED'].includes(order.status)
  return <Panel title="Refunds" subtitle="Paystack-confirmed full and partial refunds"><div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-admin-line pb-4"><div><p className="text-[9px] uppercase tracking-[0.16em] text-admin-muted">Refundable balance</p><p className="mt-1 font-display text-2xl tabular-nums">{formatMoney(available, order.currency)}</p></div><span className="text-xs text-admin-muted">Original payment {formatMoney(Number(order.total), order.currency)}</span></div>{message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}{confirmation ? <div className="border border-admin-line bg-admin-soft p-4"><p className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">Final confirmation</p><p className="mt-3 text-sm leading-6">Queue a refund of <strong>{formatMoney(confirmation.amount, order.currency)}</strong> for order <strong>{order.number}</strong>?</p><p className="mt-2 break-words text-xs leading-5 text-admin-muted">Reason: {confirmation.reason}</p><p className="mt-3 text-xs leading-5 text-admin-muted">Paystack processes refunds asynchronously. Lumi will wait for a signed processed webhook before marking the order refunded.</p><div className="mt-4 grid gap-2 min-[420px]:grid-cols-2"><button type="button" disabled={busy} onClick={() => void confirm()} className="admin-button primary justify-center">{busy ? 'Sending…' : 'Confirm refund'}</button><button type="button" disabled={busy} onClick={() => setConfirmation(null)} className="admin-button secondary justify-center">Go back</button></div></div> : canRefund ? <form onSubmit={prepare} className="space-y-4"><AdminField label="Refund amount"><div className="grid min-w-0 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto]"><input type="number" required min="0.01" max={available} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="admin-control h-11 w-full min-w-0 px-3" /><button type="button" onClick={() => setAmount(refundableAmount)} className="admin-button secondary justify-center">Full balance</button></div></AdminField><AdminField label="Reason for refund"><textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Return approved, item unavailable, or customer resolution" className="admin-control w-full resize-y p-3" /></AdminField><button className="admin-button secondary w-full justify-center">Review refund</button><p className="text-xs leading-5 text-admin-muted">Submitting this form first opens a confirmation step. It does not immediately contact Paystack.</p></form> : <p className="text-sm leading-6 text-admin-muted">{refunds.some((refund) => ['REQUESTING', 'PENDING', 'PROCESSING', 'NEEDS_ATTENTION'].includes(refund.status)) ? 'The remaining balance is committed to a refund that is still being processed.' : 'No refundable Paystack balance is available for this order.'}</p>}{refunds.length > 0 && <div><h3 className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">Refund history</h3><div className="mt-3 divide-y divide-admin-line border-y border-admin-line">{refunds.map((refund) => <article key={refund.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold tabular-nums">{formatMoney(Number(refund.amount), refund.currency)}</p><p className="mt-1 text-xs text-admin-muted">Requested {formatDateTime(refund.createdAt)}</p></div><StatusBadge value={refund.status} /></div><p className="mt-3 break-words text-xs leading-5 text-admin-muted">{refund.reason}</p>{refund.failureReason && <p className="mt-2 text-xs leading-5 text-red-700 dark:text-red-300">{refund.failureReason}</p>}{refund.expectedAt && !refund.processedAt && <p className="mt-2 text-xs text-admin-muted">Expected by {formatDateTime(refund.expectedAt)}</p>}</article>)}</div></div>}</div></Panel>
}

function StatusTimeline({ status }: { status: string }) { if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(status)) return <div className="border-l-2 border-admin-ink bg-admin-soft p-4"><StatusBadge value={status} /><p className="mt-3 text-xs leading-5 text-admin-muted">The refund state now supersedes the fulfilment timeline. See refund history for the provider-confirmed amount.</p></div>; const steps = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']; const currentIndex = steps.indexOf(status); return <ol className="space-y-4">{steps.map((step, index) => <li key={step} className="flex gap-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${index <= currentIndex ? 'border-admin-accent bg-admin-accent text-admin-accent-contrast' : 'border-admin-line text-admin-muted'}`}>{index <= currentIndex ? <LuCheck size={13} /> : index + 1}</span><div><p className="text-sm font-semibold">{titleCase(step)}</p><p className="text-xs text-admin-muted">{index < currentIndex ? 'Completed' : index === currentIndex ? 'Current state' : 'Pending'}</p></div></li>)}</ol> }
function StockMetric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div><p className="text-xs text-admin-muted">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? 'text-amber-700 dark:text-amber-300' : ''}`}>{value}</p></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="border-b border-admin-line py-4"><dt className="text-[9px] font-medium uppercase tracking-[0.16em] text-admin-muted">{label}</dt><dd className="mt-2 break-words text-sm font-medium">{value}</dd></div> }
function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className={`flex items-center justify-between gap-4 text-sm ${strong ? 'font-semibold' : ''}`}><dt className="text-admin-muted">{label}</dt><dd className="shrink-0 tabular-nums">{value}</dd></div> }

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
function StatusBadge({ value }: { value: string }) { const tone = ['ACTIVE', 'PAID', 'PUBLISHED', 'DELIVERED', 'PROCESSED', 'REFUNDED', 'COMPLETED'].includes(value) ? 'success' : ['PROCESSING', 'PENDING', 'PENDING_PAYMENT', 'REQUESTING', 'REQUESTED', 'PARTIALLY_REFUNDED'].includes(value) ? 'info' : ['PAYMENT_FAILED', 'FAILED', 'CANCELLED', 'DISABLED', 'NEEDS_ATTENTION', 'REJECTED'].includes(value) ? 'danger' : ['SHIPPED', 'APPROVED', 'RECEIVED'].includes(value) ? 'accent' : 'neutral'; return <span className={`admin-status ${tone}`}>{titleCase(value)}</span> }
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
function paymentLabel(status: string) { if (status === 'REFUNDED') return 'REFUNDED'; if (status === 'PARTIALLY_REFUNDED') return 'PARTIALLY_REFUNDED'; return ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? 'PAID' : status === 'PAYMENT_FAILED' ? 'FAILED' : 'PENDING' }
function titleCase(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
function formatShortDate(value?: string) { return value ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`)) : '—' }
function formatCompactMoney(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(value) }
function formatShippingAddress(address: AdminOrderDetail['shippingAddress']) { return [address.line1, address.line2, address.city, address.region, address.postalCode, address.country].filter(Boolean).join(', ') }
function couponState(coupon: AdminCoupon) { const now = Date.now(); if (!coupon.active) return 'DISABLED'; if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return 'EXHAUSTED'; if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return 'SCHEDULED'; if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) return 'EXPIRED'; return 'ACTIVE' }
function couponValue(coupon: AdminCoupon) { return coupon.type === 'PERCENTAGE' ? `${Number(coupon.value)}%` : formatMoney(Number(coupon.value), 'NGN') }
function optionalNumber<Key extends 'minimumSubtotal' | 'maximumDiscount'>(key: Key, fields: FormData): Partial<Record<Key, number>> { const value = String(fields.get(key) || '').trim(); return value ? { [key]: Number(value) } as Partial<Record<Key, number>> : {} }
function optionalInteger(key: 'usageLimit', fields: FormData): Partial<Record<'usageLimit', number>> { const value = String(fields.get(key) || '').trim(); return value ? { usageLimit: Number(value) } : {} }
function dayPeriod() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening' }
function describeDevice(userAgent: string | null) { if (!userAgent) return 'Unknown device'; const browser = userAgent.includes('Edg/') ? 'Microsoft Edge' : userAgent.includes('Chrome/') ? 'Google Chrome' : userAgent.includes('Firefox/') ? 'Mozilla Firefox' : userAgent.includes('Safari/') ? 'Safari' : 'Web browser'; const system = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Android') ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : userAgent.includes('Mac OS') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'unknown system'; return `${browser} on ${system}` }
function securityActionLabel(action: string) { return action === 'ADMIN_SESSION_REVOKED' ? 'Administrator session revoked' : action === 'ADMIN_OTHER_SESSIONS_REVOKED' ? 'Other administrator sessions revoked' : titleCase(action) }
