import { useEffect, useMemo, useState } from 'react'
import {
  LuCheck as FiCheck,
  LuChevronDown as FiChevronDown,
  LuHeart as FiHeart,
  LuShieldCheck as FiShield,
  LuShoppingBag as FiShoppingBag,
  LuStar as FiStar,
  LuTruck as FiTruck,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { ProductGallery } from '../components/ProductGallery'
import { RailIndicator } from '../components/RailIndicator'
import { useCatalog } from '../hooks/useCatalog'
import { createCartFlight, useCartUiStore } from '../store/useCartUiStore'
import { useShopStore } from '../store/useShopStore'
import type { ShopProduct } from '../types/product'
import { getRailIndex } from '../utils/rail'
import { getExpandedSizes } from '../utils/sizes'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const reviews = [
  {
    name: 'Amara K.',
    date: 'July 18, 2026',
    rating: 5,
    text: 'The cut is beautiful and it sits exactly where it should. I wore it all evening without having to adjust a thing.',
  },
  {
    name: 'Maya R.',
    date: 'July 04, 2026',
    rating: 5,
    text: 'Even better in person. The fabric has a lovely weight to it and the finish feels genuinely considered.',
  },
  {
    name: 'Sophie T.',
    date: 'June 21, 2026',
    rating: 4,
    text: 'A very polished piece. I sized up for a little more room and the fit is now perfect.',
  },
]

// Product details combines shop data with purchasing controls and supporting content.
export function ProductDetailsPage({ productId }: { productId: string }) {
  const { products, status } = useCatalog()
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return (
      <main className="grid min-h-[65svh] place-items-center bg-canvas px-4 text-center text-ink">
        <div>
          <h1 className="text-3xl">
            {status === 'loading' ? 'Loading product…' : 'Product not found'}
          </h1>
          {status !== 'loading' && (
            <Link
              to="/shop"
              className="mt-6 inline-flex min-h-12 items-center bg-ink px-7 text-[9px] uppercase tracking-[0.17em] text-canvas"
            >
              Return to shop
            </Link>
          )}
        </div>
      </main>
    )
  }

  return <ProductDetailsContent product={product} products={products} />
}

function ProductDetailsContent({
  product,
  products,
}: {
  product: ShopProduct
  products: ShopProduct[]
}) {
  const availableSizes = getExpandedSizes(product.sizes)
  const [selectedSize, setSelectedSize] = useState(availableSizes[0])
  const [added, setAdded] = useState(false)
  const [activeRelatedProduct, setActiveRelatedProduct] = useState(0)
  const addToCart = useShopStore((state) => state.addToCart)
  const launchCartFlight = useCartUiStore((state) => state.launchFlight)
  const addRecentlyViewed = useShopStore((state) => state.addRecentlyViewed)
  const toggleWishlist = useShopStore((state) => state.toggleWishlist)
  const isFavorite = useShopStore((state) =>
    state.wishlistItems.includes(product.id),
  )

  // Recently viewed history is persisted and shown inside the search modal.
  useEffect(() => {
    addRecentlyViewed(product.id)
  }, [addRecentlyViewed, product.id])

  const relatedProducts = useMemo(
    () =>
      products
        .filter(
          (item) =>
            item.id !== product.id &&
            (item.category === product.category || item.brand === product.brand),
        )
        .slice(0, 4),
    [product, products],
  )

  // Alternate crops provide useful detail views until backend media is connected.
  const fallbackGallery = [
    {
      src: product.image,
      alt: `${product.name}, full view`,
      label: 'Full view',
      objectPosition: 'center',
    },
    {
      src: product.image,
      alt: `${product.name}, upper detail`,
      label: 'Upper detail',
      objectPosition: '50% 22%',
      imageScale: 1.28,
    },
    {
      src: product.image,
      alt: `${product.name}, fabric detail`,
      label: 'Fabric detail',
      objectPosition: '42% 48%',
      imageScale: 1.55,
    },
    {
      src: product.image,
      alt: `${product.name}, lower detail`,
      label: 'Lower detail',
      objectPosition: '50% 78%',
      imageScale: 1.3,
    },
  ]
  const galleryImages = product.gallery?.length
    ? product.gallery.slice(0, 4).map((src, index) => ({
        src,
        alt: `${product.name}, view ${index + 1}`,
        label: `View ${index + 1}`,
        objectPosition: 'center',
      }))
    : fallbackGallery

  const handleAddToCart = (source?: Element | null) => {
    addToCart(product.id, 1)
    launchCartFlight(createCartFlight(product.image, product.name, source))
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <main className="bg-canvas text-ink">
      <section className="px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap gap-x-2 gap-y-1 text-[8px] uppercase tracking-[0.12em] text-ink/45 min-[380px]:mb-5 min-[380px]:text-[9px] min-[380px]:tracking-[0.16em]"
          >
            <Link to="/shop" className="hover:text-ink">Shop</Link>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="min-w-0 break-words text-ink">{product.name}</span>
          </nav>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:gap-8 xl:gap-10">
            <ProductGallery images={galleryImages} productName={product.name} />

            {/* Product information remains visible while browsing the tall gallery. */}
            <div className="no-scrollbar lg:sticky lg:top-32 lg:h-[500px] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50 lg:text-[8px]">
                {product.brand} · {product.category}
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="w-full min-w-0 max-w-full break-words text-3xl leading-[1.05] min-[380px]:text-4xl sm:text-5xl lg:text-3xl xl:text-4xl">
                  {product.name}
                </h1>
                <button
                  type="button"
                  aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={() => toggleWishlist(product.id)}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line lg:size-9"
                >
                  <FiHeart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-3 lg:gap-2">
                <span className="text-lg lg:text-base">{currency.format(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-ink/40 line-through lg:text-xs">
                    {currency.format(product.originalPrice)}
                  </span>
                )}
                <a href="#reviews" className="ml-auto flex items-center gap-1.5 text-xs lg:text-[10px]">
                  <FiStar size={13} fill="currentColor" />
                  {product.rating} ({product.reviewCount})
                </a>
              </div>

              <p className="mt-7 max-w-full break-words border-t border-line pt-6 text-sm leading-7 text-ink/65 lg:mt-4 lg:pt-4 lg:text-[11px] lg:leading-[1.65]">
                {product.description ?? 'Designed for repeat wear, with a clean silhouette and quietly considered details. Finished in the Lumi studio for an easy, confident fit.'}
              </p>

              <div className="mt-7 lg:mt-4">
                <div className="mb-3 flex justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-[0.17em] lg:text-[8px]">Select size</span>
                  <button type="button" className="border-b border-ink text-[9px] lg:text-[8px]">Size guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-12 min-w-14 flex-1 border px-3 text-xs sm:max-w-24 lg:min-h-9 lg:min-w-10 lg:px-2 lg:text-[9px] ${
                        selectedSize === size
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line hover:border-ink'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 lg:mt-4">
                <button
                  type="button"
                  disabled={!product.available}
                  onClick={(event) => handleAddToCart(event.currentTarget)}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.16em] text-canvas disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:text-[8px]"
                >
                  {added ? <FiCheck size={15} /> : <FiShoppingBag size={15} />}
                  {product.available ? (added ? 'Added to cart' : 'Add to cart') : 'Out of stock'}
                </button>
              </div>

              {/* Native disclosure controls keep delivery information accessible. */}
              <div className="mt-7 border-t border-line lg:mt-4">
                <DeliveryRow icon={<FiTruck />} title="Delivery & returns">
                  Free standard delivery over $150. Returns are accepted within
                  30 days in their original condition.
                </DeliveryRow>
                <DeliveryRow icon={<FiShield />} title="Materials & care">
                  Store away from direct light and follow the care label to keep
                  the piece looking its best.
                </DeliveryRow>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reviews product={product} />

      <section aria-labelledby="related-heading" className="px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[9px] uppercase tracking-[0.2em] text-ink/50">You may also like</p>
          <h2 id="related-heading" className="mt-2 text-3xl sm:text-4xl">Related products</h2>

          {/* Phones display one centered, snap-aligned product at a time. */}
          <div
            className="no-scrollbar mt-6 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:pb-0 lg:grid-cols-4"
            onScroll={(event) =>
              setActiveRelatedProduct(getRailIndex(event.currentTarget))
            }
          >
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                className="w-full min-w-0 shrink-0 snap-center sm:w-auto sm:shrink"
              />
            ))}
          </div>
          <RailIndicator
            count={relatedProducts.length}
            activeIndex={activeRelatedProduct}
          />
        </div>
      </section>
    </main>
  )
}

function DeliveryRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <details className="group border-b border-line">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 text-xs lg:min-h-12 lg:text-[10px]">
        <span className="text-base">{icon}</span>
        {title}
        <FiChevronDown className="ml-auto transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-5 pl-7 text-xs leading-6 text-ink/60 lg:pb-3 lg:text-[10px] lg:leading-5">{children}</p>
    </details>
  )
}

function Reviews({ product }: { product: ShopProduct }) {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="border-y border-line px-4 py-10 sm:px-7 sm:py-14 lg:px-10"
    >
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-ink/50">What people say</p>
          <h2 id="reviews-heading" className="mt-2 text-3xl">Reviews</h2>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-5xl">{product.rating}</span>
            <span className="pb-1 text-xs text-ink/50">
              from {product.reviewCount} reviews
            </span>
          </div>
        </div>
        <div>
          {reviews.map((review) => (
            <article key={review.name} className="border-b border-line py-6 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm">{review.name}</h3>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }, (_, index) => (
                      <FiStar
                        key={index}
                        size={11}
                        fill={index < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <time className="text-[9px] text-ink/45">{review.date}</time>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65">
                {review.text}
              </p>
            </article>
          ))}
          <button
            type="button"
            className="mt-6 border-b border-ink pb-1 text-[9px] uppercase tracking-[0.16em]"
          >
            Read all reviews
          </button>
        </div>
      </div>
    </section>
  )
}
