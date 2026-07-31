# LUMI Storefront

A responsive premium-fashion storefront built with React, TypeScript, Tailwind
CSS, Framer Motion, Zustand, Swiper, React Router, React Icons, and Cloudinary.

## Development

```bash
npm install
npm run dev
```

Use `npm run build` and `npm run lint` before committing changes.

## Cloudinary setup

The storefront automatically falls back to the images in `public/images` when
Cloudinary is not configured.

1. Create a Cloudinary account and copy `.env.example` to `.env.local`.
2. Add your cloud name:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

3. Upload the current assets using these public IDs:

```text
lumi-summer-hero_ssrptu
luna-silk-dress_hmnr1f
charcoal-wool-blazer_pa9bga
crescent-leather-bag_gvi7mq
column-ankle-boots_ya5rtx
```

The shared `OptimizedImage` component then enables automatic image format and
quality, responsive delivery widths, lazy loading, and blurred placeholders.
The Cloudinary API secret must never be added to a Vite environment variable or
committed to this frontend repository.
