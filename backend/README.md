# Lumi API

NestJS/Fastify API for the Lumi ecommerce storefront. PostgreSQL is accessed
through Prisma and stores the application's catalog, customer, cart, order,
inventory, and payment state.

## Local requirements

- Node.js 24+
- PostgreSQL 17+

Docker is optional. From the repository root,
`docker compose -f backend/compose.yaml up -d`
starts PostgreSQL bound only to the local machine. Docker is not required in
production if a managed PostgreSQL provider is used.

Lumi maps PostgreSQL to `127.0.0.1:5433` because this development computer
already has another PostgreSQL service on the default host port `5432`.

## Setup

From the `backend` directory:

```bash
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run dev
```

Generate a unique `COOKIE_SECRET` with at least 32 random characters before
starting the API. The values in `.env.example` are local placeholders and must
never be used in production.

## Endpoints

- `GET /api/v1` — API metadata
- `GET /api/v1/health/live` — process liveness
- `GET /api/v1/health/ready` — database readiness
- `GET /api/v1/products` — paginated published catalog
- `GET /api/v1/products/:slug` — published product detail
- `GET /api/v1/wishlist` — authenticated customer's saved products
- `POST /api/v1/wishlist` — idempotently save a published product
- `DELETE /api/v1/wishlist/:productSlug` — idempotently remove a saved product
- `GET /api/v1/cart` — create/return the current guest or customer cart
- `PUT /api/v1/cart/items/:productSlug` — set an inventory-validated quantity
- `DELETE /api/v1/cart/items/:productSlug` — remove a product from the cart
- `DELETE /api/v1/cart` — clear the current cart
- `POST /api/v1/checkout/orders` — create an idempotent, non-payable order draft
- `GET /api/v1/orders` — authenticated customer's order history
- `GET /api/v1/orders/:orderNumber` — owner-authorized order detail
- `POST /api/v1/orders/:orderNumber/cancel` — cancel an unpaid draft
- `POST /api/v1/payments/paystack/initialize/:orderNumber` — reserve stock and initialize payment
- `GET /api/v1/payments/paystack/availability` — public provider availability without secrets
- `GET /api/v1/payments/paystack/status/:reference` — owner-authorized return status
- `POST /api/v1/payments/paystack/webhook` — receive signed provider events
- `GET /api/v1/admin/dashboard` — administrator-only operational overview with audited access
- `GET /api/docs-json` — OpenAPI schema when `API_DOCS_ENABLED=true`

Catalog queries accept bounded `page` and `limit` values plus optional
`category`, `search`, and `sort` filters. Public responses expose availability
without disclosing exact stock or reservation counts.

The production catalog is priced in NGN to match the configured Nigerian
Paystack merchant. The one-time seed conversion uses the CBN NFEM reference of
₦1,380.18/US$ from 2026-07-17 and rounds to ₦1,000 retail price points. Shipping
is ₦25,000 and becomes free at ₦345,000. These are explicit business constants,
not a live foreign-exchange dependency.

`npm run prisma:seed` idempotently loads the eight curated Lumi products used
by the storefront. It is intended for local development and test environments.

Wishlist ownership is always derived from the authenticated session. Wishlist
mutations require the session's CSRF cookie value in the `X-CSRF-Token` header.

Cart identity comes from a signed, opaque `HttpOnly` cookie whose raw token is
stored only as a hash. `GET /cart` issues a purpose-bound readable CSRF cookie;
mutations echo it in `X-Cart-CSRF-Token`. Signing in atomically claims or merges
the browser's guest cart into the customer's active cart.

Checkout requires `Idempotency-Key` and `X-Cart-CSRF-Token`. The API rebuilds
totals from current catalog records, validates inventory and sizes, snapshots
order lines, and returns `payable: false`. No payment details are accepted.

Paystack is disabled by default. Enabling it requires `PAYSTACK_ENABLED=true`,
a server-only `PAYSTACK_SECRET_KEY`, and `PAYSTACK_CALLBACK_URL`. Initialization
requires owner authorization and cart CSRF, reserves inventory for 30 minutes,
and redirects the browser only to Paystack's returned authorization URL. The
browser callback never marks an order paid. Only a raw-body webhook with a
valid `x-paystack-signature`, matching reference, amount, currency, and success
status can atomically move the payment/order to `SUCCEEDED`/`PAID` and convert
reserved inventory into sold inventory. Provider events are stored with a
unique idempotency key so webhook retries are safe.

A definitive provider rejection releases the reservation and restores the
draft. A timeout or provider error is treated as ambiguous and remains pending,
because the provider may have accepted the reference before the connection
failed. Expired ambiguous attempts must be reconciled with Paystack before
inventory can be released; this deliberately favors preventing overselling and
missing a real payment.

When Paystack is enabled, a bounded reconciliation worker polls expired pending
attempts using Paystack's transaction verification endpoint. Database-backed
claim timestamps prevent concurrent API instances from processing the same
attempt. Verified success uses the same atomic settlement path as a webhook;
verified `failed` or `abandoned` results atomically release inventory and restore
the order draft. All other statuses and provider errors remain pending and are
retried after five minutes. Configure the polling cadence and batch limit with
`PAYMENT_RECONCILIATION_INTERVAL_SECONDS` and
`PAYMENT_RECONCILIATION_BATCH_SIZE`.

### Authentication

- `POST /api/v1/auth/register` — create a pending customer account
- `POST /api/v1/auth/verify-email` — activate a single-use verification token
- `POST /api/v1/auth/login` — create a signed, opaque cookie session
- `GET /api/v1/auth/me` — return the authenticated customer
- `POST /api/v1/auth/logout` — revoke the current session
- `POST /api/v1/auth/logout-all` — revoke all customer sessions
- `POST /api/v1/auth/forgot-password` — request a reset token
- `POST /api/v1/auth/reset-password` — update the password and revoke sessions

Authenticated mutations require the readable CSRF cookie value to be sent in
the `X-CSRF-Token` header. The session cookie remains `HttpOnly`. Local
development may expose verification/reset tokens in response bodies only when
`AUTH_DEV_TOKENS_ENABLED=true`; environment validation forbids that setting in
production. A real email provider must replace this development aid before
deployment.

## Verification

```bash
npm run typecheck
npm run test
npm run build
npm run prisma:validate
```

Read the repository-level [`SECURITY.md`](../SECURITY.md) and
[`docs/security`](../docs/security) requirements before adding authentication,
customer data, order, payment, or administration code.
