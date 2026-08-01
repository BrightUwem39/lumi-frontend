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

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1 min-[420px]:left-3 min-[420px]:top-3 min-[420px]:gap-1.5">
            {product.badge && (
              <span className="bg-ink px-2 py-1 text-[7px] font-medium uppercase tracking-[0.12em] text-canvas min-[420px]:px-2.5 min-[420px]:text-[8px] min-[420px]:tracking-[0.16em]">
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="bg-white px-2 py-1 text-[7px] font-medium uppercase tracking-[0.12em] text-[#171713] min-[420px]:px-2.5 min-[420px]:text-[8px] min-[420px]:tracking-[0.16em]">
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
            className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white text-[#171713] shadow-sm transition-transform hover:scale-105 min-[420px]:right-3 min-[420px]:top-3 min-[420px]:size-10"
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
            className={`absolute right-2 top-13 grid size-9 place-items-center rounded-full shadow-sm transition-all hover:scale-105 min-[420px]:right-3 min-[420px]:top-16 min-[420px]:size-10 ${
              isCompared
                ? 'bg-ink text-canvas'
                : 'bg-white text-[#171713]'
            }`}
          >
            <FiLayers size={16} />
          </button>

          {/* Actions stay visible on touch screens and reveal on hover for desktop. */}
          <div className="absolute inset-x-2 bottom-2 grid grid-cols-2 gap-1.5 transition-all duration-300 min-[420px]:inset-x-3 min-[420px]:bottom-3 min-[420px]:gap-2 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              className="flex min-h-10 min-w-0 items-center justify-center gap-1 border border-white/70 bg-black/45 px-1.5 text-[7px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:bg-black/75 min-[420px]:min-h-11 min-[420px]:gap-2 min-[420px]:px-2 min-[420px]:text-[8px] min-[420px]:tracking-[0.12em]"
            >
              <FiEye size={14} />
              <span className="min-[420px]:hidden">View</span>
              <span className="hidden min-[420px]:inline">Quick view</span>
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex min-h-10 min-w-0 items-center justify-center gap-1 bg-white px-1.5 text-[7px] font-medium uppercase tracking-[0.08em] text-[#171713] transition-colors hover:bg-[#171713] hover:text-white min-[420px]:min-h-11 min-[420px]:gap-2 min-[420px]:px-2 min-[420px]:text-[8px] min-[420px]:tracking-[0.12em]"
            >
              <FiShoppingBag size={14} />
              {justAdded ? 'Added' : <><span className="min-[420px]:hidden">Add</span><span className="hidden min-[420px]:inline">Add to cart</span></>}
            </button>
          </div>
        </div>

        {/* Product details remain compact so cards work in grids and sliders. */}
        <div className="pt-3 min-[420px]:pt-4">
          <div className="flex min-w-0 flex-col gap-1.5 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[8px] font-medium uppercase tracking-[0.18em] text-ink/50">
                {product.category}
              </p>
              <h3 className="line-clamp-2 text-[14px] leading-5 min-[420px]:text-[15px]">
                <Link to={`/product/${product.id}`}>{product.name}</Link>
              </h3>
            </div>
            <div className="shrink-0 text-left text-xs min-[520px]:text-right">
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
              className="relative z-10 grid max-h-[calc(100svh-1rem)] w-full max-w-4xl overflow-y-auto overscroll-contain bg-canvas text-ink sm:max-h-[92svh] sm:grid-cols-2"
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
              <div className="aspect-[4/3] max-h-[48svh] bg-[#e8e5df] sm:aspect-[4/5] sm:max-h-[70svh]">
                <OptimizedImage
                  src={product.image}
                  alt={product.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-10">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
                  {product.category}
                </p>
                <h2
                  id={`quick-view-${product.id}`}
                  className="mt-2 text-2xl min-[380px]:text-3xl sm:mt-3 sm:text-4xl"
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
                <p className="mt-4 text-xs leading-5 text-ink/65 sm:mt-6 sm:text-sm sm:leading-6">
                  Thoughtfully cut and finished for everyday wear. Designed in
                  the Lumi studio with close attention to proportion, texture,
                  and comfort.
                </p>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-5 flex min-h-12 items-center justify-center gap-3 bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-canvas sm:mt-8 sm:px-6 sm:text-[10px] sm:tracking-[0.18em]"
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
