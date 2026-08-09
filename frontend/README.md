# Lumi Storefront

React/Vite frontend for the Lumi premium-fashion ecommerce experience.

## Structure

- `src/components` — reusable storefront UI and commerce interactions
- `src/pages` — route-level screens
- `src/store` — browser-side Zustand state
- `src/services` — external catalog adapters
- `src/data` — curated fallback catalog data
- `public` — production-ready fonts and imagery
- `media-source` — ignored original photography and footage

## Development

```powershell
npm install
npm run dev
```

The development server defaults to `http://127.0.0.1:5173` or the next free
port. Run `npm run lint` and `npm run build` before committing frontend changes.

Browser data is not an authoritative source for prices, inventory, orders,
roles, or payments. Those responsibilities belong to the backend.
