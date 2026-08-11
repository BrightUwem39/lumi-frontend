# Free portfolio deployment

This showcase deployment is designed to have no recurring infrastructure cost:

```text
Browser
  -> Vercel Hobby: React storefront and same-origin /api rewrite
    -> Render Free: public Nest API
      -> Neon Free: PostgreSQL
```

It is a portfolio demo, not a production commerce deployment. Render's free API
spins down after 15 minutes without traffic and can take about a minute to wake.
Keep Paystack in test mode and do not accept real customer payments.

## 1. Create the free Neon database

Create a Neon Free project and copy its PostgreSQL connection string. Choose the
**Direct connection** because the Render startup command runs Prisma migrations
before starting the API. Keep it private; it will be entered in Render as
`DATABASE_URL`.

## 2. Create the free Render API

In Render, create or resync the Blueprint from the repository's `render.yaml`.
It defines only one Free web service named `brightuwem39-lumi-api`.

Provide these prompted values:

- `DATABASE_URL`: the private Neon PostgreSQL connection string.
- `CORS_ORIGINS`: the exact Vercel production URL, with no trailing slash.

The free tier does not support a pre-deploy command, so the single API instance
runs `prisma migrate deploy` and the idempotent catalog seed immediately before
starting. `PAYSTACK_ENABLED` remains `false`.

After deployment, verify:

```text
https://brightuwem39-lumi-api.onrender.com/api/v1/health/ready
```

## 3. Deploy the free Vercel storefront

Import the GitHub repository into a Vercel Hobby project and set:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The committed `frontend/vercel.json` handles React Router deep links, security
headers, and same-origin `/api` rewrites to the Render API.

After Vercel assigns the production URL, update `CORS_ORIGINS` in Render to that
exact HTTPS origin and redeploy the API.

## 4. Optional Paystack test demonstration

Only after both deployments work, add these environment variables to the Render
API:

```text
PAYSTACK_ENABLED=true
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_CALLBACK_URL=https://YOUR-VERCEL-DOMAIN/payment-return
```

Set the Paystack test webhook directly to the public Render API so its signed
raw request body is preserved:

```text
https://brightuwem39-lumi-api.onrender.com/api/v1/payments/paystack/webhook
```

Never put the Paystack secret in Vercel or in a `VITE_*` environment variable.
A Cloudflare custom domain can be added later without changing the application
architecture.
