# Lumi Data Classification and Handling

## Classification levels

| Level | Meaning | Examples | Minimum handling |
| --- | --- | --- | --- |
| Public | Intended for anyone | Published catalog, prices, public policies, editorial images | Integrity controls, normal caching, versioned changes |
| Internal | Operational but not public | Feature flags, internal product drafts, non-sensitive metrics | Authenticated access, least privilege, no public indexing |
| Confidential | Personal or commercially sensitive | Customer contact details, addresses, orders, support records, unpublished discounts | Encryption in transit/at rest, role and ownership checks, redacted logs, defined retention |
| Restricted | Could enable account, payment, or infrastructure compromise | Password hashes, sessions, reset tokens, provider/API secrets, webhook secrets, MFA recovery data | Secret manager or dedicated secure store, very limited access, never in browser/logs/Git, rotation and audit |
| Prohibited | Lumi must not collect or retain | Raw card number, CVV, PIN, plaintext password | Use a compliant hosted payment/authentication flow; reject and remove if received |

## Data inventory

| Data | Classification | Current location | Production owner/location | Rules |
| --- | --- | --- | --- | --- |
| Catalog names, descriptions, images, prices | Public | PostgreSQL plus committed storefront imagery | PostgreSQL and deployed static assets | API is authoritative for catalog data and availability; validate all administrator changes |
| Cart, wishlist, comparison, recently viewed | Public to Confidential depending on linkage | Guest/customer cart and wishlist in PostgreSQL; comparison convenience state in the browser | PostgreSQL plus non-authoritative browser preferences | Never trust browser quantities/prices; server recalculates checkout |
| Theme preference | Public | `localStorage` key `lumi-theme` | Browser | No special restriction |
| Newsletter email | Confidential | `localStorage` key `lumi-newsletter-email` | PostgreSQL or email provider with consent record | Remove local persistence when API exists; record consent time/source; unsubscribe support |
| Shipping identity and address | Confidential | Checkout form state; owned addresses and order snapshots in PostgreSQL | PostgreSQL | Minimize fields, authorize ownership, redact logs, define retention/deletion policy |
| Order and totals | Confidential when linked to a person | PostgreSQL plus a display-only `sessionStorage` receipt | PostgreSQL | Browser copy is non-authoritative; API calculates and stores totals |
| Password hash | Restricted | Argon2id hash in PostgreSQL | PostgreSQL | Never return or log; rehash when parameters change |
| Session identifier | Restricted | Opaque `HttpOnly` cookie; only its hash is stored in PostgreSQL | Browser cookie plus PostgreSQL session record | `HttpOnly`, `Secure`, `SameSite`; expire and revoke server-side |
| Email verification/reset token | Restricted | Short-lived token hash in PostgreSQL; code delivered by Brevo | PostgreSQL plus transient Brevo delivery | Single use, expiry, purpose-bound; never store or log the full token |
| Roles and permissions | Restricted | Server-owned PostgreSQL user role | PostgreSQL | Deny by default; privileged operations require role guards and audit events |
| Payment card details | Prohibited | Never handled by Lumi; Paystack-hosted test checkout only | Payment provider only | Continue using provider-controlled checkout for any future real payments |
| Payment reference/status | Confidential | PostgreSQL payment and provider-event records | PostgreSQL plus Paystack | Verify signatures and provider data; enforce unique references and idempotency |
| Paystack secret/webhook secret | Restricted | Render environment settings | Deployment secret manager | Server-only, scoped access, rotation procedure |
| Application/database/email credentials | Restricted | Render, Neon, Brevo, and Vercel environment settings | Provider secret/configuration stores | Separate by environment; least privilege; never in `VITE_*` or Git |
| Audit logs | Confidential | Append-oriented PostgreSQL audit records | PostgreSQL | Record actor/action/result, not secrets or prohibited data; controlled retention |
| Backups | Same as contained data | Neon-managed database recovery facilities, subject to service plan | Managed encrypted database storage | Review retention, access, restore testing, and deletion before real customer use |

## Browser-storage rule

Browser storage is controlled by the user and can be read by JavaScript running
on the same origin. It is suitable only for non-sensitive preferences and an
untrusted guest-cart convenience copy. It must not hold authentication tokens,
passwords, reset tokens, authoritative orders, payment state, or long-lived
personal data.

The session receipt is a display-only convenience and never establishes order
or payment state. Newsletter email persistence remains a migration item until a
consent-aware subscription API is connected; it must be removed or replaced
before enabling production marketing.

## Collection and minimization

- Collect a field only when a documented customer or legal need exists.
- Tell the customer why it is collected and how it is used.
- Do not reuse checkout data for marketing without separate valid consent.
- Do not send personal data in URLs, analytics attributes, or error messages.
- API responses return only the fields required by that screen and actor.
- Staff views mask sensitive fields when the complete value is unnecessary.

## Retention and deletion

Exact periods require business and legal approval before production. Until
then, no service may retain data indefinitely by default. The backend design
must support:

- removal of expired sessions and authentication tokens;
- newsletter unsubscribe and suppression requirements;
- customer account export and deletion workflows;
- legally required order/accounting retention separated from optional profile
  data;
- deletion of abandoned uploads and carts after a documented period; and
- backup expiration consistent with the approved retention schedule.

Deletion jobs must be observable, retryable, and audited without copying the
deleted personal data into logs.

## Non-production data

- Never copy production customer data into local development.
- Use generated test users, addresses, orders, and provider test credentials.
- Staging must use separate databases, secrets, storage, webhooks, and email
  routing.
- Screenshots, bug reports, fixtures, and test logs must not contain real
  restricted, prohibited, or unnecessary confidential data.
