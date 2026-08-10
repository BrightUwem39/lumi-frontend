# Render hosting with a Cloudflare domain

The root `render.yaml` Blueprint provisions the production topology:

```text
Cloudflare DNS
  -> lumi-storefront (public Render web service)
    -> /api over Render private networking
      -> lumi-api (private Render service)
        -> lumi-postgres
        -> lumi-key-value
```

The Blueprint selects paid Starter compute, paid persistent Key Value, and a
paid `basic-256mb` PostgreSQL database in Frankfurt. Review Render's current
estimate before applying the Blueprint. Creating or syncing it can incur
charges.

## 1. Publish the repository

Commit the complete application, migration history, Docker files, and
`render.yaml`, then push the branch to a GitHub or GitLab repository connected
to Render. Never commit `backend/.env`, `deploy/production.env`, or Paystack
keys.

## 2. Create the Render Blueprint

In Render, choose **New > Blueprint**, connect the repository, and select its
root `render.yaml`. During the initial sync, Render prompts for the values marked
`sync: false`:

- `CORS_ORIGINS`: the exact HTTPS storefront origin, such as
  `https://example.com`, with no trailing slash.
- `PAYSTACK_SECRET_KEY`: use the Paystack test secret first (`sk_test_...`).
- `PAYSTACK_CALLBACK_URL`: `https://example.com/payment-return`.

Keep `PAYSTACK_ENABLED=false` for the first deployment. Render generates the
cookie secret and injects the private PostgreSQL, Key Value, and API addresses.
The API's pre-deploy command runs `prisma migrate deploy` before each successful
release.

Wait until `lumi-api` and `lumi-storefront` both report healthy. The API is a
private service and is intentionally reached only through the storefront's
`/api` proxy.

## 3. Attach the Cloudflare domain

Open `lumi-storefront` in Render, then **Settings > Custom Domains > Add Custom
Domain**. Add the root domain. Render also handles the corresponding `www`
domain and redirect.

In Cloudflare:

1. Set **SSL/TLS > Overview** to **Full**.
2. Remove conflicting `AAAA` records for the root and `www` hostnames.
3. Add a `CNAME` record named `@` pointing to the storefront's
   `*.onrender.com` hostname. Start with **DNS only**.
4. Add a `CNAME` named `www` with the same target and **DNS only**.
5. Return to Render and verify the custom domain.
6. After Render shows a valid TLS certificate, Cloudflare proxying can
   optionally be enabled.

Do not point the domain at `lumi-api`; all browser and webhook traffic goes
through `lumi-storefront`.

## 4. Verify before enabling payments

```powershell
curl.exe --fail https://example.com/healthz
curl.exe --fail https://example.com/api/v1/health/ready
```

In the Paystack **test** dashboard, set the webhook URL to:

```text
https://example.com/api/v1/payments/paystack/webhook
```

Then change `PAYSTACK_ENABLED` to `true` on `lumi-api`, redeploy, and complete a
test transaction. Do not switch to `PAYSTACK_MODE=live` or an `sk_live_` key
until the test order, webhook, payment record, and inventory transition have
all been verified.
