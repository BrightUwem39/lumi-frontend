# Lumi showcase handoff

This guide presents Lumi as the full-stack e-commerce product it is. It is
intended for project reviewers, prospective clients, and technical interviews;
Lumi itself is not a portfolio website.

## Live environment

- Storefront: [lumi-frontend-git-main-brightuwem39gmailcoms-projects.vercel.app](https://lumi-frontend-git-main-brightuwem39gmailcoms-projects.vercel.app)
- API readiness: [brightuwem39-lumi-api.onrender.com/api/v1/health/ready](https://brightuwem39-lumi-api.onrender.com/api/v1/health/ready)
- Payment provider: Paystack test mode only
- Transactional email: Brevo verification and password recovery
- Database: Neon PostgreSQL

The Render free service may need several seconds to wake after inactivity.
Wait for the first catalog request to finish before judging subsequent page
speed. No real card should ever be entered in the demonstration environment.

## Recommended walkthrough

### 1. Storefront and discovery

1. Open the homepage and show the centered Lumi navigation system.
2. Open the side menu and highlight consistent desktop, tablet, and mobile
   information architecture.
3. Show featured products and the swipeable two-card category layout on mobile.
4. Open Shop, then demonstrate search, filters, sorting, wishlist, comparison,
   and product quick views.
5. Open a product to show its gallery, sizes, reviews, and swipeable related
   products.

### 2. Account and checkout

1. Register with an email address and a password containing at least eight
   characters, a letter, and a number.
2. Enter the six-digit code delivered by Brevo, then sign in.
3. Save a delivery address from the account area.
4. Add a sized product to the bag and create an order draft.
5. Continue to Paystack's hosted test checkout and use only an official
   Paystack sandbox card.
6. Return to Lumi and show the webhook-confirmed order and account history.

Registration and payment create real demonstration records. Use an email
address controlled by the reviewer and Paystack test data only. Never share
administrator credentials in repository documentation, recordings, or public
messages.

### 3. Administration

The protected `/admin` workspace is available only to an administrator account.
A live demonstration can cover:

- Overview metrics, daily revenue chart, low stock, and recent orders
- Product creation, editing, publishing, imagery, and inventory adjustment
- Customer lookup and order fulfilment transitions
- Return review, refund processing, and restored inventory
- Discount campaigns and operational notifications
- Immutable audit events and CSV business reports
- Store, shipping, tax, email, and session-security configuration

Use read-only navigation during a public walkthrough. Demonstrate mutations on
purpose-created test records so existing evidence is not accidentally changed.

## Verified release state

Production smoke testing completed on 25 August 2026 with these results:

| Area | Result |
| --- | --- |
| Render readiness and Neon database health | Passed |
| Live catalog | 8 published products returned |
| Homepage, shop, journal, policies, product, cart, wishlist, checkout | Passed |
| Authenticated profile, addresses, and order history | Passed |
| All 11 administrator workspaces | Passed |
| Mobile and tablet document overflow | None detected |
| Mobile featured/category/related product presentation | Two cards visible; swipe rails verified where designed |
| Broken production images | None detected |
| Lumi application console errors | None detected |
| Frontend lint and production build | Passed |
| Backend typecheck, build, and Prisma validation | Passed |
| Backend automated tests | 98 passed across 16 files |
| Dependency audit | No known vulnerabilities at verification time |

Browser-extension messages are not Lumi application errors and should be
filtered by their `chrome-extension://` source during console review.

## Architecture discussion points

- Prices, stock, roles, carts, orders, and payment outcomes are server-owned.
- Guest carts use opaque signed identity and merge safely after authentication.
- Checkout recalculates totals from PostgreSQL and requires idempotency.
- A browser callback cannot mark an order paid; signed Paystack webhooks settle
  payments and inventory atomically.
- Ambiguous provider outcomes remain reserved until reconciliation avoids both
  overselling and missing a legitimate payment.
- Opaque sessions, CSRF separation, Argon2id, throttling, validation, strict
  production configuration, security headers, and redacted logs provide a
  defence-in-depth baseline.
- Route-level code splitting keeps the customer storefront separate from the
  larger administrator workspace.

## Demonstration boundaries

The following are deliberate demonstration-environment boundaries:

- Paystack remains in test mode and cannot take real payment.
- Render and Neon use free service tiers, so cold starts and development-tier
  availability are expected.
- Shipment status is managed internally; no carrier API is connected.
- A custom domain is optional and can be introduced later.

These boundaries should be stated clearly rather than presented as defects or
unfinished core functionality.

## Final maintenance checklist

Before sharing Lumi with a new reviewer:

1. Confirm the storefront opens and the first catalog request completes.
2. Confirm `/api/v1/health/ready` reports the database as up.
3. Keep Paystack in test mode and confirm the webhook endpoint is active.
4. Confirm Brevo's sender and verification delivery remain enabled.
5. Do not expose `.env` values, API keys, verification codes, session cookies,
   personal addresses, or administrator credentials.
6. Use `npm run lint` and `npm run build` in `frontend`.
7. Use `npm run typecheck`, `npm test`, `npm run build`, and
   `npm run prisma:validate` in `backend`.

Detailed deployment and security references remain in
[free-tier-deployment.md](free-tier-deployment.md),
[SECURITY.md](../SECURITY.md), and [security/](security/).
