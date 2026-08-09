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
| Catalog names, descriptions, images, prices | Public | Local assets plus DummyJSON response | PostgreSQL/object CDN | Server becomes the authoritative source; validate imported data |
| Cart, wishlist, comparison, recently viewed | Public to Confidential depending on linkage | `localStorage` key `lumi-shop` | Guest cart may remain local; authenticated records in PostgreSQL | Never trust local quantities/prices; server recalculates checkout |
| Theme preference | Public | `localStorage` key `lumi-theme` | Browser | No special restriction |
| Newsletter email | Confidential | `localStorage` key `lumi-newsletter-email` | PostgreSQL or email provider with consent record | Remove local persistence when API exists; record consent time/source; unsubscribe support |
| Shipping identity and address | Confidential | Form state and demo receipt in `sessionStorage` | PostgreSQL | Minimize fields, authorize ownership, redact logs, retention/deletion policy |
| Demo order and totals | Confidential when linked to a person | `sessionStorage` key `lumi-last-order` | PostgreSQL | Browser copy is display-only; server is authoritative |
| Password hash | Restricted | Not implemented | PostgreSQL | Argon2id only; never return or log |
| Session identifier | Restricted | Not implemented | Random cookie identifier plus Redis/server session | `HttpOnly`, `Secure`, `SameSite`; hash server-side if appropriate; rotate/revoke |
| Email verification/reset token | Restricted | Not implemented | Short-lived hashed token record | Single use, expiry, purpose-bound; never log full token |
| Roles and permissions | Restricted | Not implemented | PostgreSQL | Server-owned; changes require authorization and audit event |
| Payment card details | Prohibited | Demo inputs are displayed but not read or stored | Payment provider only | Replace with hosted/provider-controlled UI before production |
| Payment reference/status | Confidential | Simulated label only | PostgreSQL plus Paystack | Verify server-side; unique references; retention for accounting/disputes |
| Paystack secret/webhook secret | Restricted | Not implemented | Deployment secret manager | Server-only, scoped access, rotation procedure |
| Application/database/Redis/email credentials | Restricted | Not implemented | Deployment secret manager | Separate by environment; least privilege; never in `VITE_*` or Git |
| Audit logs | Confidential | Not implemented | Append-oriented protected log storage | Record actor/action/result, not secrets or prohibited data; controlled retention |
| Backups | Same as contained data | Not implemented | Encrypted restricted backup storage | Separate credentials; restore testing; deletion follows retention rules |

## Browser-storage rule

Browser storage is controlled by the user and can be read by JavaScript running
on the same origin. It is suitable only for non-sensitive preferences and an
untrusted guest-cart convenience copy. It must not hold authentication tokens,
passwords, reset tokens, authoritative orders, payment state, or long-lived
personal data.

The current demo receipt and newsletter storage are migration items. They must
be removed or reduced before production.

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

