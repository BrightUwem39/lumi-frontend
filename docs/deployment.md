# Production deployment

For the selected zero-cost Vercel, Render, and Neon showcase setup, follow
[`portfolio-deployment.md`](./portfolio-deployment.md).

Lumi ships provider-neutral Docker targets for the React storefront, Nest API,
and a one-shot Prisma migration job. The production Compose file expects
managed PostgreSQL; it does not place a database inside the application stack.

## Architecture

```text
Internet
  -> HTTPS load balancer / host reverse proxy
    -> frontend:8080 (Nginx, SPA and security headers)
      -> backend:3000 (/api only, private Compose network)
        -> managed PostgreSQL
        -> Paystack API

release -> migrate target -> prisma migrate deploy -> backend starts
```

Terminate TLS before the frontend container and redirect HTTP to HTTPS there.
Do not publish the backend port or database ports. Configure HSTS at the TLS
terminator only after HTTPS is confirmed across the production domain.

## 1. Provision external services

- Create PostgreSQL with automated backups, point-in-time recovery, TLS, and a
  least-privilege application role.
- Create separate staging and production databases, Paystack
  keys, and domains. Never reuse production data or secrets in staging.

## 2. Configure secrets

Copy `deploy/production.example.env` to `deploy/production.env`. The destination
is ignored by Git. Replace every placeholder and keep Paystack disabled for the
first deployment.

Generate a cookie secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Set `CORS_ORIGINS` to the exact public storefront origin without a trailing
slash. `TRUST_PROXY` is a hop count: the supplied value `2` represents an
external TLS proxy plus the bundled Nginx frontend. Change it only when the
actual proxy chain differs.

Production startup fails closed when it sees localhost service URLs, HTTP CORS
origins, placeholder secrets, public API docs, untrusted proxy settings,
insecure Paystack callbacks, or a Paystack key that does not match its selected
test/live mode.

## 3. Build and start

```powershell
docker compose --env-file deploy/production.env -f compose.production.yaml config
docker compose --env-file deploy/production.env -f compose.production.yaml build
docker compose --env-file deploy/production.env -f compose.production.yaml up -d
```

The `migrate` service runs `prisma migrate deploy` and must complete before the
backend starts. Never use `prisma migrate dev` or `prisma db push` against
production. Commit the complete migration history and back up the database
before every release that changes its schema.

Verify:

```powershell
curl.exe --fail https://shop.example.com/healthz
curl.exe --fail https://shop.example.com/api/v1/health/ready
```

Review container logs without printing environment variables:

```powershell
docker compose -f compose.production.yaml ps
docker compose -f compose.production.yaml logs --tail 100 backend migrate
```

## 4. Paystack staging, then live

First run a full test transaction with:

```text
PAYSTACK_ENABLED=true
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_CALLBACK_URL=https://shop.example.com/payment-return
PAYSTACK_ALLOWED_CURRENCIES=NGN
```

Set the Paystack test webhook URL to:

```text
https://shop.example.com/api/v1/payments/paystack/webhook
```

Confirm the order, payment, webhook event, and inventory transitions before
using live credentials. Live activation requires `PAYSTACK_MODE=live` and an
`sk_live_` key; environment validation rejects a test/live mismatch. Repeat the
same end-to-end check with the smallest permitted live amount and immediately
refund it through the approved operational process.

## 5. Release and rollback discipline

- Tag immutable frontend and backend images with the same release identifier.
- Run tests and builds before pushing images.
- Take a database backup before migrations.
- Roll back application images independently of database migrations.
- Treat migrations as forward-only; prepare a corrective migration rather than
  editing or deleting an applied migration.
- Keep Paystack disabled during rollback if payment-state compatibility is
  uncertain.
- Rotate any secret that appears in logs, chat, source control, or build output.

The temporary Cloudflare Quick Tunnel used during local testing is not a
production ingress and must not be restored for a live deployment.
