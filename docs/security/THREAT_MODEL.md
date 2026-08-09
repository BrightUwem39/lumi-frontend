# Lumi Threat Model

## Status and scope

This is the initial threat model for the planned Lumi ecommerce platform. It
covers the React storefront, the future API, PostgreSQL, Redis/background jobs,
object storage, email delivery, payment providers, administrator tools, and the
deployment pipeline.

The current repository is frontend-only. Controls marked as required below are
backend acceptance criteria, not claims about the present implementation.

Review this model whenever authentication, payments, administration, uploads,
third-party integrations, or deployment architecture changes, and at least
before every production release.

## Security objectives

1. A customer can access and change only their own account data and orders.
2. Only explicitly authorized staff can perform administrative operations.
3. Product prices, discounts, inventory, order state, and payment state cannot
   be controlled by the browser.
4. Passwords, sessions, personal data, and provider secrets remain confidential.
5. Orders and payments cannot be duplicated, skipped, replayed, or moved through
   invalid states.
6. The store remains available under ordinary abuse and can recover from a
   security incident or infrastructure failure.

## Assets

- Customer identity, password hashes, sessions, and account recovery tokens
- Names, email addresses, phone numbers, delivery and billing addresses
- Product, price, discount, coupon, inventory, and order records
- Payment references, provider customer IDs, webhook events, and refund records
- Administrator accounts, roles, permissions, and audit logs
- Database, Redis, email, storage, payment, CI/CD, and deployment credentials
- Source code, build artifacts, backups, logs, analytics, and monitoring data
- Store availability and Lumi's customer trust

## Actors

- Guest: browses products and may maintain a local cart
- Customer: manages their account and their own commerce records
- Staff: fulfills orders and performs limited catalog/customer-support actions
- Administrator: manages staff, permissions, catalog, and sensitive operations
- Third parties: Paystack, email provider, object storage, monitoring, hosting
- Attacker: unauthenticated or authenticated user attempting abuse
- Compromised account or dependency: a formerly trusted actor or component

## Trust boundaries and data flows

1. **Browser to API:** all browser input is untrusted, including identifiers,
   totals, roles, headers, workflow steps, and files.
2. **API to PostgreSQL/Redis:** only validated, authorized server operations may
   cross this private boundary; service accounts use least privilege.
3. **API to payment provider:** secret credentials remain server-side. Payment
   confirmation returns through authenticated provider webhooks.
4. **API to email/storage/monitoring:** exported data is minimized, redacted,
   access-controlled, and sent over TLS.
5. **Staff browser to administration API:** stronger authentication, MFA,
   authorization, audit logging, and shorter sessions are required.
6. **Source control to CI/CD to production:** protected branches, scoped build
   credentials, dependency provenance, and controlled deployment are required.

## Primary threats and required controls

| ID | Threat | Impact | Required controls | Verification |
| --- | --- | --- | --- | --- |
| T01 | Credential stuffing or brute force | Account takeover | Argon2id, login throttling, generic responses, breached-password checks, MFA for privileged users, session alerts | Automated throttling and account-enumeration tests |
| T02 | Session theft or fixation | Account takeover | HTTPS, opaque high-entropy sessions, `HttpOnly`/`Secure`/`SameSite` cookies, rotation, expiry, revocation, CSP | Cookie inspection and session lifecycle tests |
| T03 | Broken object-level authorization | Disclosure or modification of another customer's data | Server-side role and ownership checks on every record; unpredictable public IDs as defense in depth | Cross-user negative tests for every resource |
| T04 | Privilege escalation | Unauthorized administration | Deny-by-default guards, server-owned roles, MFA, re-authentication for sensitive actions, audit logs | Customer/Staff/Admin permission matrix tests |
| T05 | XSS and malicious content | Session actions, data theft, defacement | React escaping, no untrusted raw HTML, allowlisted rich content, CSP, secure cookies, output encoding | XSS payload tests and CSP verification |
| T06 | CSRF | Unauthorized account/order changes | SameSite cookies, origin checks, CSRF tokens for cookie-authenticated mutations | Cross-origin mutation tests |
| T07 | Injection or mass assignment | Data loss, privilege or price manipulation | DTO/schema allowlists, length/range validation, Prisma parameterization, explicit update fields | Fuzzing and unexpected-field tests |
| T08 | Price, coupon, shipping, or tax tampering | Financial loss | Server-owned catalog and calculations; coupon constraints checked transactionally | Modified-client checkout tests |
| T09 | Inventory race or overselling | Incorrect fulfillment | Transactional reservation, atomic stock updates, expiration/release jobs, concurrency tests | Parallel checkout tests |
| T10 | Forged or replayed payment events | Free goods, duplicate fulfillment/refunds | Provider signature verification on raw body, amount/currency/reference checks, unique event IDs, idempotency, state machine | Tampered, duplicate, delayed, and reordered webhook tests |
| T11 | Checkout steps invoked out of order | Payment/fulfillment bypass | Explicit server-side order state machine and allowed transitions | Direct endpoint and reordered-request tests |
| T12 | Sensitive data exposure | Privacy and fraud risk | Data minimization, encryption, field-level response filtering, log redaction, retention/deletion policy | Log review and access tests |
| T13 | Secret or dependency compromise | Full-system compromise | Secret manager, rotation, least privilege, lockfiles, dependency/secret/SAST scanning, reviewed upgrades | CI gates and periodic credential audit |
| T14 | File upload abuse or SSRF | Malware, service compromise, excessive cost | Direct signed uploads, MIME/signature/size validation, randomized names, image re-encoding, no arbitrary URL fetches | Malformed-file, polyglot, size, and URL tests |
| T15 | Botting, scraping, denial of service | Outage or resource cost | Per-route/user/IP rate limits, body limits, caching, CDN/WAF, queue limits, timeouts and backpressure | Load and rate-limit tests |
| T16 | Staff misuse or compromised admin | Fraud or destructive changes | Least privilege, MFA, approval for high-risk operations, tamper-evident audit logs, alerts | Privileged workflow and audit tests |
| T17 | Backup or operational failure | Permanent data loss | Encrypted automated backups, restricted access, restore drills, documented RPO/RTO | Scheduled restoration evidence |
| T18 | Personal data leaked through analytics/errors | Privacy breach | Provider allowlist, consent controls, payload minimization, redaction, no sensitive URLs | Analytics and error-event inspection |

## Ecommerce state rules

The server must enforce explicit transitions. A representative order lifecycle
is:

`draft -> pending_payment -> paid -> processing -> shipped -> delivered`

Additional terminal or compensating states may include `cancelled`,
`payment_failed`, `refunded`, and `partially_refunded`. Every transition must
define the authorized actor, prerequisites, idempotency behavior, inventory
effect, audit event, and customer notification. A browser redirect never causes
a `paid` transition.

## Abuse cases to test

- Change a cart line's price, product ID, currency, quantity, or discount.
- Use another customer's user, address, wishlist, order, or return identifier.
- Call payment or fulfillment endpoints without completing earlier steps.
- Replay the same webhook concurrently or send it after an order is cancelled.
- Submit a valid webhook signature with the wrong amount, currency, or reference.
- Add disallowed fields such as `role`, `isPaid`, `ownerId`, or `discount`.
- Reuse an expired reset token or retain a session after a password/role change.
- Upload an oversized, executable, malformed, or content-type-spoofed file.
- Flood search, login, coupon validation, checkout, and newsletter endpoints.
- Cause logs or error monitoring to receive secrets or personal data.

## Residual risk and decisions

Security reduces risk but cannot eliminate it. Accepted risks must have an
owner, rationale, compensating controls, review date, and explicit approval.
Critical or high risks involving authentication, authorization, personal data,
payments, secrets, or remote code execution cannot be silently accepted.

