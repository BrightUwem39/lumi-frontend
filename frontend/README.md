# Lumi Storefront

For the free portfolio deployment, configure the Vercel project's Root
Directory as `frontend`. The committed `vercel.json` supplies the Vite build,
SPA fallback, security headers, and same-origin proxy to the free Render API.

React/Vite frontend for the Lumi premium-fashion ecommerce experience.

The storefront reads its catalog from the local Lumi API at `/api/v1/products`.
During development, Vite proxies `/api` to `http://127.0.0.1:3000`. Curated
local product data remains available as an offline fallback.

Catalog and fallback prices use NGN, matching the Nigerian Paystack merchant.
Currency travels with each product and order; UI formatters do not assume a
global currency. Shipping is ₦25,000 and becomes free at ₦345,000, matching the
authoritative checkout calculation.

The profile route bootstraps the server-side cookie session and provides
registration, email verification, sign-in, and sign-out flows. Guest wishlist
items are merged into the authenticated wishlist at sign-in; subsequent
mutations use the readable CSRF cookie and remain server-owned.

The local cart is reconciled with `GET /api/v1/cart` after session bootstrap.
Cart changes are optimistic, validated by the API against published products,
sizes, and inventory, and rolled back when the server rejects a mutation.

Authenticated profile order history comes from `/api/v1/orders`. Draft orders
can be reopened and cancelled from the account UI; guest receipts remain bound
to the signed cart cookie that created them.

Order confirmation checks the backend payment-availability endpoint before it
offers Paystack. Starting payment creates a server-owned session and redirects
only to a validated Paystack HTTPS URL. The `/payment-return` route resolves the
provider reference through the owner-authorized API and displays the resulting
order state; callback query parameters are never treated as proof of payment.

## Structure

- `src/components` — reusable storefront UI and commerce interactions
- `src/pages` — route-level screens
- `src/store` — browser-side Zustand state
- `src/services` — external catalog adapters
- `src/data` — curated fallback catalog data
- `public` — production-ready fonts and imagery
- `media-source` — ignored original photography and footage

## Development

```powershell
npm install
npm run dev
```

The development server defaults to `http://127.0.0.1:5173` or the next free
port. Run `npm run lint` and `npm run build` before committing frontend changes.

Browser data is not an authoritative source for prices, inventory, orders,
roles, or payments. Those responsibilities belong to the backend.
