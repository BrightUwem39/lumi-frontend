# Lumi API

NestJS/Fastify API foundation for the Lumi ecommerce storefront. PostgreSQL is
accessed through Prisma, while Redis is reserved for sessions, throttling,
queues, and short-lived checkout reservations in later phases.

## Local requirements

- Node.js 24+
- PostgreSQL 17+
- Redis 7+

Docker is optional. From the repository root,
`docker compose -f backend/compose.yaml up -d`
starts PostgreSQL and Redis bound only to the local machine. Docker is not
required in production if a managed PostgreSQL and Redis provider is used.

Lumi maps PostgreSQL to `127.0.0.1:5433` because this development computer
already has another PostgreSQL service on the default host port `5432`. Redis
uses `127.0.0.1:6379`.

## Setup

From the `backend` directory:

```bash
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run dev
```

Generate a unique `COOKIE_SECRET` with at least 32 random characters before
starting the API. The values in `.env.example` are local placeholders and must
never be used in production.

## Endpoints

- `GET /api/v1` — API metadata
- `GET /api/v1/health/live` — process liveness
- `GET /api/v1/health/ready` — database readiness
- `GET /api/docs-json` — OpenAPI schema when `API_DOCS_ENABLED=true`

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
