# Lumi Ecommerce

Lumi is organized as two independent TypeScript applications so browser code
and trusted server code have an explicit boundary.

Production container and release instructions are in
[`docs/deployment.md`](docs/deployment.md). The zero-cost portfolio deployment
flow is documented in
[`docs/portfolio-deployment.md`](docs/portfolio-deployment.md).

```text
E-COMMERCE_APP/
├── frontend/          React, Vite, Tailwind CSS and storefront assets
├── backend/           NestJS, Fastify, Prisma and API infrastructure
├── docs/security/     Shared threat model and security requirements
├── SECURITY.md        Repository-wide security policy and launch gate
└── README.md          Project overview
```

## Frontend

The responsive premium-fashion storefront uses React, TypeScript, Tailwind CSS,
Framer Motion, Zustand, Swiper, React Router, and React Icons. Its edited local
photography is stored in `frontend/public`, while ignored source photography is
kept in `frontend/media-source`.

```powershell
Set-Location frontend
npm install
npm run dev
```

Use `npm run lint` and `npm run build` from `frontend` before committing UI
changes. Additional storefront details are in
[`frontend/README.md`](frontend/README.md).

## Backend

The API uses NestJS with Fastify and PostgreSQL through Prisma.

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run dev
```

Database and environment setup is documented in
[`backend/README.md`](backend/README.md).

## Security

The current checkout remains a frontend demonstration and must not process real
payments yet. Read [`SECURITY.md`](SECURITY.md) and
[`docs/security`](docs/security) before backend or production work.
