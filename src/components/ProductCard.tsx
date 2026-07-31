import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiEye,
  FiHeart,
  FiLayers,
  FiShoppingBag,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useShopStore } from '../store/useShopStore'
import type { Product } from '../types/product'
import { OptimizedImage } from './OptimizedImage'

type ProductCardProps = {
  product: Product
  className?: string
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

// A reusable commerce card. All product-specific content arrives through props.
export function ProductCard({ product, className = '' }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const addToCart = useShopStore((state) => state.addToCart)
  const toggleWishlist = useShopStore((state) => state.toggleWishlist)
  const isFavorite = useShopStore((state) =>
    state.wishlistItems.includes(product.id),
  )
  const toggleComparison = useShopStore((state) => state.toggleComparison)
  const isCompared = useShopStore((state) =>
    state.comparisonItems.includes(product.id),
  )

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  // Close quick view with Escape and prevent the page behind it from scrolling.
  useEffect(() => {
    if (!quickViewOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuickViewOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [quickViewOpen])

  const handleAddToCart = () => {
    addToCart(product.id)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <>
      <article className={`group min-w-0 ${className}`}>
        {/* Image area contains merchandising badges and fast product actions. */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e5df]">
          {/* The skeleton disappears as soon as the product image is decoded. */}
          {!imageLoaded && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-ink/[0.04] via-ink/[0.09] to-ink/[0.04]" />
          )}
          <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
            <OptimizedImage
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`size-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.025] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badge && (
              <span className="bg-ink px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.16em] text-canvas">
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="bg-white px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.16em] text-[#171713]">
                Save {discount}%
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={
              isFavorite
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={isFavorite}
            onClick={() => toggleWishlist(product.id)}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white text-[#171713] shadow-sm transition-transform hover:scale-105"
          >
            <FiHeart
              size={17}
              fill={isFavorite ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>

          <button
            type="button"
            title="Compare product"
            aria-label={
              isCompared
                ? `Remove ${product.name} from comparison`
                : `Compare ${product.name}`
            }
            aria-pressed={isCompared}
            onClick={() => toggleComparison(product.id)}
            className={`absolute right-3 top-16 grid size-10 place-items-center rounded-full shadow-sm transition-all hover:scale-105 ${
              isCompared
                ? 'bg-ink text-canvas'
                : 'bg-white text-[#171713]'
            }`}
          >
            <FiLayers size={16} />
          </button>

          {/* Actions stay visible on touch screens and reveal on hover for desktop. */}
          <div className="absolute inset-x-3 bottom-3 grid grid-cols-1 gap-2 transition-all duration-300 min-[360px]:grid-cols-2 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              className="flex min-h-11 items-center justify-center gap-2 border border-white/70 bg-black/45 px-2 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <FiEye size={14} />
              Quick view
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex min-h-11 items-center justify-center gap-2 bg-white px-2 text-[8px] font-medium uppercase tracking-[0.12em] text-[#171713] transition-colors hover:bg-[#171713] hover:text-white"
            >
              <FiShoppingBag size={14} />
              {justAdded ? 'Added' : 'Add to cart'}
            </button>
          </div>
        </div>

        {/* Product details remain compact so cards work in grids and sliders. */}
        <div className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[8px] font-medium uppercase tracking-[0.18em] text-ink/50">
                {product.category}
              </p>
              <h3 className="truncate text-[15px] leading-5">
                <Link to={`/product/${product.id}`}>{product.name}</Link>
              </h3>
            </div>
            <div className="shrink-0 text-right text-xs">
              <span>{currency.format(product.price)}</span>
              {product.originalPrice && (
                <span className="ml-2 text-ink/40 line-through">
                  {currency.format(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <div
            aria-label={`${product.rating} out of 5 stars from ${product.reviewCount} reviews`}
            className="mt-2.5 flex items-center gap-1"
          >
            <span className="flex text-ink">
              {Array.from({ length: 5 }, (_, index) => (
                <FiStar
                  key={index}
                  size={11}
                  strokeWidth={1.4}
                  fill={index < Math.round(product.rating) ? 'currentColor' : 'none'}
                  className={
                    index < Math.round(product.rating) ? '' : 'text-ink/25'
                  }
                />
              ))}
            </span>
            <span className="text-[9px] text-ink/45">
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        </div>
      </article>

      {/* Quick view gives product context without leaving the current page. */}
      <AnimatePresence>
        {quickViewOpen && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6">
            <motion.button
              type="button"
              aria-label="Close quick view"
              className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`quick-view-${product.id}`}
              className="relative z-10 grid max-h-[92svh] w-full max-w-4xl overflow-y-auto bg-canvas text-ink sm:grid-cols-2"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                aria-label="Close quick view"
                onClick={() => setQuickViewOpen(false)}
                className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-canvas shadow-sm"
              >
                <FiX size={20} />
              </button>
              <div className="aspect-[4/5] max-h-[70svh] bg-[#e8e5df]">
                <OptimizedImage
                  src={product.image}
                  alt={product.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
                  {product.category}
                </p>
                <h2
                  id={`quick-view-${product.id}`}
                  className="mt-3 text-3xl sm:text-4xl"
                >
                  {product.name}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-lg">{currency.format(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-ink/40 line-through">
                      {currency.format(product.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="mt-6 text-sm leading-6 text-ink/65">
                  Thoughtfully cut and finished for everyday wear. Designed in
                  the Lumi studio with close attention to proportion, texture,
                  and comfort.
                </p>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-8 flex min-h-12 items-center justify-center gap-3 bg-ink px-6 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas"
                >
                  <FiShoppingBag size={16} />
                  {justAdded ? 'Added to cart' : 'Add to cart'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
