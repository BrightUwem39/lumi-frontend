import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, ProductStatus } from '../src/generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required to seed the catalog')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const publishedAt = new Date('2026-08-01T00:00:00.000Z')

// One-time USD-to-NGN catalog migration based on the CBN NFEM reference rate
// of ₦1,380.18/US$ (2026-07-17), rounded to stable ₦1,000 retail price points.

const products = [
  {
    slug: 'luna-silk-dress',
    sku: 'LUMI-LUNA-DRESS',
    name: 'Luna Silk Dress',
    description: 'A fluid bias-cut silk dress with a softly draped neckline.',
    category: 'Women',
    color: 'White',
    sizes: ['XS', 'S', 'M'],
    price: '261000.00',
    compareAtPrice: '332000.00',
    image: '/images/editorial/shop/luna-silk-dress-v2.jpg',
    onHand: 18,
  },
  {
    slug: 'relaxed-wool-blazer',
    sku: 'LUMI-WOOL-BLAZER',
    name: 'Relaxed Wool Blazer',
    description: 'A softly structured wool blazer cut with an easy, modern proportion.',
    category: 'Men',
    color: 'Black',
    sizes: ['M', 'L', 'XL'],
    price: '339000.00',
    compareAtPrice: null,
    image: '/images/editorial/shop/relaxed-wool-blazer-v2.jpg',
    onHand: 12,
  },
  {
    slug: 'crescent-leather-bag',
    sku: 'LUMI-CRESCENT-BAG',
    name: 'Crescent Leather Bag',
    description: 'A compact crescent shoulder bag made for everyday movement.',
    category: 'Accessories',
    color: 'Brown',
    sizes: ['One size'],
    price: '228000.00',
    compareAtPrice: '270000.00',
    image: '/images/editorial/crescent-bag-transit-v2.jpg',
    onHand: 21,
  },
  {
    slug: 'column-ankle-boots',
    sku: 'LUMI-COLUMN-BOOTS',
    name: 'Column Ankle Boots',
    description: 'Clean-lined leather ankle boots grounded by a sculpted heel.',
    category: 'Shoes',
    color: 'Black',
    sizes: ['38', '39', '40'],
    price: '304000.00',
    compareAtPrice: null,
    image: '/images/editorial/column-boots-rain-v2.jpg',
    onHand: 9,
  },
  {
    slug: 'solstice-wool-coat',
    sku: 'LUMI-SOLSTICE-COAT',
    name: 'Solstice Wool Coat',
    description: 'A long double-faced wool coat with a warm, architectural silhouette.',
    category: 'Women',
    color: 'Brown',
    sizes: ['S', 'M', 'L'],
    price: '407000.00',
    compareAtPrice: null,
    image: '/images/editorial/solstice-coat-atelier-v2.jpg',
    onHand: 7,
  },
  {
    slug: 'fine-rib-knit-top',
    sku: 'LUMI-FINE-RIB-TOP',
    name: 'Fine-Rib Knit Top',
    description: 'A close-fitting fine-rib knit designed as a refined everyday layer.',
    category: 'Women',
    color: 'White',
    sizes: ['XS', 'S', 'M', 'L'],
    price: '159000.00',
    compareAtPrice: null,
    image: '/images/editorial/fine-rib-window-v2.jpg',
    onHand: 24,
  },
  {
    slug: 'atelier-wide-leg-trouser',
    sku: 'LUMI-ATELIER-TROUSER',
    name: 'Atelier Wide-Leg Trouser',
    description: 'Fluid high-rise trousers balanced by a precise, elongated wide leg.',
    category: 'Women',
    color: 'Brown',
    sizes: ['S', 'M', 'L', 'XL'],
    price: '242000.00',
    compareAtPrice: '290000.00',
    image: '/images/editorial/atelier-trouser-street-v2.jpg',
    onHand: 15,
  },
  {
    slug: 'arc-frame-sunglasses',
    sku: 'LUMI-ARC-SUNGLASSES',
    name: 'Arc Frame Sunglasses',
    description: 'Sculptural acetate sunglasses with a subtle lifted profile.',
    category: 'Accessories',
    color: 'Black',
    sizes: ['One size'],
    price: '135000.00',
    compareAtPrice: null,
    image: '/images/editorial/arc-sunglasses-cafe-v2.jpg',
    onHand: 30,
  },
] as const

async function seedCatalog() {
  for (const item of products) {
    const { image, onHand, ...product } = item
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        ...product,
        sizes: [...product.sizes],
        currency: 'NGN',
        status: ProductStatus.PUBLISHED,
        publishedAt,
        images: {
          create: [{ url: image, altText: product.name, position: 0 }],
        },
        inventory: { create: { onHand, reserved: 0 } },
      },
      update: {
        ...product,
        sizes: [...product.sizes],
        currency: 'NGN',
        status: ProductStatus.PUBLISHED,
        publishedAt,
        images: {
          deleteMany: {},
          create: [{ url: image, altText: product.name, position: 0 }],
        },
        inventory: {
          upsert: {
            create: { onHand, reserved: 0 },
            update: { onHand, reserved: 0 },
          },
        },
      },
    })
  }

  console.info(`Seeded ${products.length} published catalog products.`)
}

try {
  await seedCatalog()
} finally {
  await prisma.$disconnect()
}
