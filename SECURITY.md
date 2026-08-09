# Lumi Security Policy

Lumi is currently a frontend demonstration. It does not provide production
authentication, order processing, inventory control, or payment processing.
Do not deploy the current checkout as a real payment experience.

The security requirements for the planned backend are maintained in:

- [Threat model](docs/security/THREAT_MODEL.md)
- [Data classification](docs/security/DATA_CLASSIFICATION.md)
- [Authorization matrix](docs/security/AUTHORIZATION_MATRIX.md)

These documents are part of the product requirements. A backend feature is not
complete until its relevant security requirements and negative tests pass.

## Reporting a vulnerability

Do not disclose suspected vulnerabilities in a public issue. Send a private
report to the project owner with:

- the affected page or endpoint;
- steps to reproduce the issue;
- the likely impact;
- screenshots or a minimal proof of concept; and
- any suggested remediation.

A production security email must be configured before launch. Until then,
reports are handled privately by the repository owner.

Never include real customer data, passwords, session identifiers, payment
details, or production secrets in a report.

## Developer rules

### Secrets

- Never commit credentials or private keys.
- Never put secrets in `VITE_*` variables; Vite exposes them to the browser.
- Keep local secrets in ignored `.env` files and provide only placeholders in
  `.env.example`.
- Use the deployment platform's secret manager in staging and production.
- Rotate a secret immediately if it is exposed, including exposure in Git
  history.

### Authentication and sessions

- Hash passwords with Argon2id using parameters reviewed against current OWASP
  guidance.
- Use opaque server-side sessions in cookies marked `HttpOnly`, `Secure`, and
  an appropriate `SameSite` value.
- Rotate the session identifier after authentication or a privilege change.
- Revoke sessions after logout, password reset, account disablement, and role
  changes.
- Require multi-factor authentication for Staff and Administrator accounts.
- Apply throttling to login, registration, password-reset, and verification
  endpoints without exposing whether an account exists.
- Protect cookie-authenticated state-changing requests against CSRF.

### Authorization

- Deny access by default.
- Enforce authorization in the API, never only in React.
- Verify record ownership as well as role membership.
- Ignore client-supplied roles, ownership fields, prices, discounts, totals,
  payment states, and inventory states.
- Record privileged staff actions in an immutable audit trail.

### API and data handling

- Validate request type, length, format, range, and allowed fields at every
  trust boundary.
- Set strict request-body and upload limits.
- Use parameterized database access through Prisma; never build SQL from user
  input.
- Return generic production errors without stack traces or internal details.
- Use HTTPS only, a strict CORS allowlist, security headers, and rate limits.
- Redact passwords, tokens, cookies, secrets, and sensitive personal data from
  logs.
- Do not log complete request bodies on authentication, address, or payment
  endpoints.

### Commerce and payments

- Recalculate product prices, discounts, coupons, shipping, tax, and totals on
  the server.
- Verify inventory and reserve it transactionally during checkout.
- Do not collect or store raw card numbers, CVVs, or PINs in Lumi.
- Initialize payments on the server and use the payment provider's hosted UI.
- Mark an order paid only after server-side verification of a signed webhook or
  provider verification response.
- Verify webhook signatures against the raw request payload and make processing
  idempotent so retries cannot duplicate side effects.
- Use database transactions for order, payment, and inventory state changes.

### Dependencies and delivery

- Review new packages before installation and keep the dependency graph small.
- Run build, lint, tests, dependency audit, and secret scanning in CI.
- Protect the main branch and require review for backend, authentication,
  authorization, payment, and infrastructure changes.
- Keep development, staging, and production data and credentials separate.
- Back up production data in encrypted storage and test restoration regularly.

## Current frontend limitations

The following behavior is demo-only and must not be treated as a secure source
of truth:

- Cart, wishlist, comparison, recently viewed products, newsletter email, and
  theme preferences use browser storage.
- Checkout totals and order numbers are calculated in the browser.
- The last demo receipt stores a customer name, email, and delivery address in
  `sessionStorage`.
- The checkout displays fake payment inputs. It does not process a payment, but
  real payment details must never be entered or retained there.
- Product metadata is fetched from DummyJSON and is not authoritative inventory.

Before launch, browser storage must contain only non-sensitive UI state. Orders,
addresses, consent, inventory, and payment state must be server-owned.

## Minimum launch gate

Production launch is blocked until all of the following are true:

- the applicable OWASP ASVS requirements have evidence and passing tests;
- no unresolved critical or high-severity known vulnerability remains;
- authorization tests prove customers cannot access another customer's data;
- Staff and Administrator accounts require MFA;
- HTTPS, security headers, CORS, CSRF protection, and rate limits are verified;
- no production secret exists in Git history or a browser bundle;
- price tampering, coupon abuse, stock races, and invalid checkout transitions
  are rejected by the server;
- payment signature, amount, currency, replay, retry, and idempotency tests pass;
- audit logging and security alerts are active and redact sensitive data;
- an encrypted backup has been successfully restored in a drill;
- a staging security assessment and independent penetration test are complete;
  and
- incident contacts, credential rotation, containment, and recovery procedures
  are documented and rehearsed.

