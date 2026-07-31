import type { ShopProduct } from '../types/product'

// These signature LUMI pieces keep the storefront useful if the demo API is offline.
export const curatedProducts: ShopProduct[] = [
  {
    id: 'luna-silk-dress', name: 'Luna Silk Dress', category: 'Women',
    image: '/images/products/luna-silk-dress.webp', price: 189,
    originalPrice: 240, rating: 4.8, reviewCount: 64, badge: 'Trending',
    available: true, sizes: ['XS', 'S', 'M'], color: 'White', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'relaxed-wool-blazer', name: 'Relaxed Wool Blazer', category: 'Men',
    image: '/images/products/charcoal-wool-blazer.webp', price: 245,
    rating: 4.7, reviewCount: 38, badge: 'Best seller', available: true,
    sizes: ['M', 'L', 'XL'], color: 'Black', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'crescent-leather-bag', name: 'Crescent Leather Bag', category: 'Accessories',
    image: '/images/products/crescent-leather-bag.webp', price: 165,
    originalPrice: 195, rating: 4.9, reviewCount: 91, badge: 'Best seller',
    available: true, sizes: ['One size'], color: 'Brown', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'column-ankle-boots', name: 'Column Ankle Boots', category: 'Shoes',
    image: '/images/products/column-ankle-boots.webp', price: 220,
    rating: 4.6, reviewCount: 47, badge: 'Limited edition', available: true,
    sizes: ['38', '39', '40'], color: 'Black', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'solstice-wool-coat', name: 'Solstice Wool Coat', category: 'Women',
    image: '/images/products/solstice-wool-coat.png', price: 295,
    rating: 4.9, reviewCount: 42, badge: 'New', available: true,
    sizes: ['S', 'M', 'L'], color: 'Brown', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'fine-rib-knit-top', name: 'Fine-Rib Knit Top', category: 'Women',
    image: '/images/products/fine-rib-knit-top.png', price: 115,
    rating: 4.8, reviewCount: 31, badge: 'New', available: true,
    sizes: ['XS', 'S', 'M', 'L'], color: 'White', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'atelier-wide-leg-trouser', name: 'Atelier Wide-Leg Trouser', category: 'Women',
    image: '/images/products/atelier-wide-leg-trouser.png', price: 175,
    originalPrice: 210, rating: 4.7, reviewCount: 26, badge: 'Trending',
    available: true, sizes: ['S', 'M', 'L', 'XL'], color: 'Brown', brand: 'Lumi', source: 'curated',
  },
  {
    id: 'arc-frame-sunglasses', name: 'Arc Frame Sunglasses', category: 'Accessories',
    image: '/images/products/arc-frame-sunglasses.png', price: 98,
    rating: 4.8, reviewCount: 54, badge: 'Best seller', available: true,
    sizes: ['One size'], color: 'Black', brand: 'Lumi', source: 'curated',
  },
]
