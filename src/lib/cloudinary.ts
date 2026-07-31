import { Cloudinary } from '@cloudinary/url-gen'

export const cloudinaryCloudName =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() ?? ''

// A missing cloud name intentionally disables Cloudinary and preserves local assets.
export const cloudinary = cloudinaryCloudName
  ? new Cloudinary({ cloud: { cloudName: cloudinaryCloudName } })
  : null

const productPublicIds: Record<string, string> = {
  'luna-silk-dress': 'luna-silk-dress_hmnr1f',
  'charcoal-wool-blazer': 'charcoal-wool-blazer_pa9bga',
  'column-ankle-boots': 'column-ankle-boots_ya5rtx',
  'crescent-leather-bag': 'crescent-leather-bag_gvi7mq',
  'atelier-wide-leg-trouser': 'atelier-wide-leg-trouser_waxo5l',
  'arc-frame-sunglasses': 'arc-frame-sunglasses_eeg8kr',
  'fine-rib-knit-top': 'fine-rib-knit-top_glqlvf',
  'solstice-wool-coat': 'solstice-wool-coat_hb366e',
}

// Only known uploads use Cloudinary; new local assets stay local until uploaded.
export function getCloudinaryPublicId(src: string) {
  if (src.startsWith('/images/products/')) {
    const filename = src.split('/').pop()?.replace(/\.[^.]+$/, '')
    if (!filename) return undefined
    return productPublicIds[filename]
  }

  if (src === '/images/lumi-summer-hero.png') {
    return 'lumi-summer-hero_ssrptu'
  }

  return undefined
}
