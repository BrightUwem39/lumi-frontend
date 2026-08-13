# Lumi — Full-Stack Fashion Commerce

Lumi is a responsive full-stack fashion-commerce application built as a complete
customer journey rather than a static storefront. Visitors can browse a live
catalog, create and verify an account, manage a wishlist and cart, create an
order, and complete a sandbox payment through Paystack.

**[Open the live storefront](https://lumi-frontend-git-main-brightuwem39gmailcoms-projects.vercel.app)**

> The public demo uses Paystack **test mode**. It never accepts or charges real
> payment cards. The Render free service can take about a minute to wake after
> a period of inactivity.

## What the project demonstrates

- A polished React storefront with responsive navigation, product discovery,
  filtering, detail pages, wishlist, cart, checkout, and account screens.
- Server-owned catalog prices, inventory, carts, orders, and payment state.
- Registration, Brevo email verification, login, logout, forgotten-password,
  and reset-password flows.
- Opaque `HttpOnly` sessions, CSRF protection, Argon2id password hashing,
  throttling, strict CORS, security headers, and redacted application logs.
- Guest carts that are securely claimed or merged when a customer signs in.
- Idempotent order creation with authoritative totals calculated by the API.
- Paystack sandbox checkout with signed webhook verification; browser callback
  parameters alone can never mark an order as paid.
- Atomic inventory reservation, settlement, release, and scheduled payment
  reconciliation for ambiguous provider responses.
- Containerized builds plus a deployed free-tier hosting architecture.

## Live architecture

```text
Customer browser
  │
  ▼
Vercel Hobby — React/Vite storefront
  │  same-origin /api rewrite
  ▼
Render Free — NestJS/Fastify API
  ├── Neon Free — PostgreSQL
  ├── Brevo — transactional account email
  └── Paystack — sandbox payment checkout + signed webhooks
```

The frontend uses relative `/api/v1/...` requests. Vercel proxies those calls to
Render, keeping browser traffic same-origin while the API independently applies
cookie, CSRF, authorization, and validation controls.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Framer Motion, GSAP, Swiper |
| Backend | NestJS 11, Fastify, TypeScript, Zod, class-validator, Pino |
| Data | PostgreSQL, Prisma ORM and committed migrations |
| Authentication | Argon2id, opaque database sessions, secure cookies, CSRF tokens, Brevo email |
| Payments | Paystack test API, signed raw-body webhooks, idempotent events, reconciliation worker |
| Testing | Vitest, TypeScript checks, Oxlint, production builds |
| Hosting | Vercel, Render, Neon, Docker |

## Customer flow

1. Browse the server-backed catalog and select a size.
2. Add products to a guest cart with inventory validation.
3. Register with an email and a password of at least eight characters containing
   a letter and a number.
4. Verify the six-digit code delivered by Brevo and sign in.
5. Enter shipping details and create an idempotent order draft.
6. Continue to Paystack's hosted test checkout.
7. Paystack sends a signed event directly to the API.
8. The API verifies the signature, reference, amount, currency, and status before
   atomically marking the payment and order successful.

Official Paystack sandbox cards are available in the
[Paystack test-payment documentation](https://paystack.com/docs/payments/test-payments/).
Never enter a real card while Paystack is configured in test mode.

## Security and data ownership

The browser is not trusted as the source of prices, stock, roles, orders, or
payment results. Important controls include:

- Passwords are hashed with Argon2id and never logged.
- Session and guest-cart tokens are opaque; only hashes are stored.
- Authentication and cart mutations use separate purpose-bound CSRF controls.
- Order and payment reads verify ownership through the authenticated user or
  signed guest-cart identity.
- Checkout rebuilds totals from current database records and requires an
  idempotency key.
- Payment success requires a valid Paystack signature and matching provider
  data. Webhook retries are safe because event identifiers are unique.
- Production configuration rejects wildcard CORS, insecure origins, placeholder
  secrets, development token exposure, and incorrect Paystack key modes.

See [SECURITY.md](SECURITY.md), the
[threat model](docs/security/THREAT_MODEL.md), and the
[authorization matrix](docs/security/AUTHORIZATION_MATRIX.md) for the detailed
security design.

## Repository structure

```text
E-COMMERCE_APP/
├── frontend/              React storefront, routes, state, services, and assets
├── backend/               Nest API, Prisma schema/migrations, tests, and Dockerfile
├── docs/security/         Threat model, data classification, authorization matrix
├── docs/deployment.md     Container-based production deployment
├── docs/free-tier-deployment.md
├── render.yaml            Free Render API Blueprint
└── compose.production.yaml
```

## Run locally

Requirements: Node.js 24+, npm, and PostgreSQL 17+. Docker is optional for the
local database.

### 1. Start PostgreSQL

From the repository root:

```powershell
docker compose -f backend/compose.yaml up -d
```

The included development database listens on `127.0.0.1:5433`.

### 2. Start the API

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev
```

Replace the placeholder `COOKIE_SECRET` in `backend/.env` with at least 32
random characters. Brevo and Paystack are optional locally and disabled by
default.

### 3. Start the storefront

In another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to the local API on port 3000.

## Quality checks

```powershell
Set-Location frontend
npm run lint
npm run build

Set-Location ../backend
npm run typecheck
npm test
npm run build
npm run prisma:validate
```

The backend currently contains 43 passing tests across authentication, email,
catalog, cart, checkout, orders, wishlist, payments, environment validation,
and application dependency wiring.

## Deployment

The live application uses free tiers and does not require a custom domain:

- Vercel serves `frontend` and applies the committed SPA/API rewrites.
- Render builds the backend Docker image, applies Prisma migrations, seeds the
  idempotent catalog, and starts the API.
- Neon provides PostgreSQL through a direct connection suitable for migrations.
- Brevo sends account verification and password-reset messages.
- Paystack remains permanently configured with test credentials for the demo.

Follow [docs/free-tier-deployment.md](docs/free-tier-deployment.md) for the full
setup. Secrets belong only in provider environment settings and must never be
committed or placed in `VITE_*` variables.

## Current scope

Lumi is an e-commerce application currently operating in a pre-production test
environment. Paystack stays in sandbox mode, fulfillment is not yet connected
to a carrier, and the free hosting services have development-tier availability
limits. The architecture keeps a future custom domain or paid infrastructure
upgrade separate from the application itself.
