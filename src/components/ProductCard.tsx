import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { createPortal } from 'react-dom'
import {
  LuEye as FiEye,
  LuHeart as FiHeart,
  LuLayers as FiLayers,
  LuPlus as FiPlus,
  LuShoppingBag as FiShoppingBag,
  LuX as FiX,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { useShopStore } from '../store/useShopStore'
import { createCartFlight, useCartUiStore } from '../store/useCartUiStore'
import type { Product } from '../types/product'
import { Skeleton } from './LoadingSkeleton'
import { OptimizedImage } from './OptimizedImage'

type ProductCardProps = {
  product: Product
  className?: string
  viewportReveal?: boolean
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

// A reusable commerce card. All product-specific content arrives through props.
export function ProductCard({
  product,
  className = '',
  viewportReveal = true,
}: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [canTilt, setCanTilt] = useState(false)
  const reduceMotion = useReducedMotion()
  const addToCart = useShopStore((state) => state.addToCart)
  const launchCartFlight = useCartUiStore((state) => state.launchFlight)
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

  // Tilt is reserved for mouse/trackpad devices; touch cards retain native swipe.
  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncPointer = () => setCanTilt(pointerQuery.matches)
    syncPointer()
    pointerQuery.addEventListener('change', syncPointer)
    return () => pointerQuery.removeEventListener('change', syncPointer)
  }, [])

  const handleAddToCart = (source?: Element | null) => {
    const sourceImage = source
      ?.closest('[data-product-card]')
      ?.querySelector('.product-card-media img') ?? source
    addToCart(product.id)
    launchCartFlight(createCartFlight(product.image, product.name, sourceImage))
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1200)
  }

  const handleQuickView = () => {
    setQuickViewOpen(true)
  }

  return (
    <>
      <Tilt
        className={`h-full min-w-0 ${className}`}
        tiltEnable={canTilt && !reduceMotion}
        tiltMaxAngleX={4.5}
        tiltMaxAngleY={4.5}
        perspective={1300}
        scale={1.012}
        transitionSpeed={850}
        glareEnable={canTilt && !reduceMotion}
        glareMaxOpacity={0.11}
        glareColor="#ffffff"
        glarePosition="all"
      >
        <motion.article
          className="group flex h-full min-w-0 flex-col"
          data-product-card={product.id}
          initial={viewportReveal && !reduceMotion ? { opacity: 0, y: 18 } : false}
          whileInView={viewportReveal && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          whileHover={canTilt && !reduceMotion ? { y: -8 } : undefined}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: canTilt && !reduceMotion ? 'transform' : 'auto' }}
        >
        {/* Image area contains merchandising badges and fast product actions. */}
        <div className="product-card-media relative aspect-[4/5] overflow-hidden bg-[#e8e5df]">
          {/* The skeleton disappears as soon as the product image is decoded. */}
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 z-10" />
          )}
          <Link
            to={`/product/${product.id}`}
            aria-label={`View ${product.name}`}
            className="relative block size-full"
          >
            <OptimizedImage
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>

          {/* Quick view stays in the upper corner without obscuring the product. */}
          <button
            type="button"
            title="Quick view"
            aria-label={`Quick view ${product.name}`}
            onClick={handleQuickView}
            className="absolute right-2 top-2 z-20 grid size-10 place-items-center text-white transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-60 sm:right-3 sm:top-3"
          >
            <FiEye size={19} strokeWidth={1.4} />
          </button>

          {/* The centered plus is the card's minimal add-to-bag action. */}
          <button
            type="button"
            title={justAdded ? 'Added to bag' : 'Add to bag'}
            aria-label={justAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`}
            onClick={(event) => handleAddToCart(event.currentTarget)}
            className="absolute bottom-2 left-1/2 z-20 grid size-9 -translate-x-1/2 place-items-center text-white transition-[opacity,transform] hover:-translate-x-1/2 hover:-translate-y-0.5 hover:opacity-60 sm:bottom-3"
          >
            <FiPlus size={17} strokeWidth={1.35} />
          </button>

        </div>

        {/* A restrained editorial hierarchy keeps commerce details easy to scan. */}
        <div className="flex flex-1 flex-col border-b border-line/70 pb-4 pt-3.5 min-[420px]:pt-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[7px] font-medium uppercase tracking-[0.13em] text-ink/48 sm:text-[8px] sm:tracking-[0.19em]">
              {product.category}{product.badge ? ` · ${product.badge}` : ''}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                aria-pressed={isFavorite}
                onClick={() => toggleWishlist(product.id)}
                className="grid size-8 place-items-center transition-opacity hover:opacity-50"
              >
                <FiHeart size={15} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.4} />
              </button>
              <button
                type="button"
                title="Compare product"
                aria-label={isCompared ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
                aria-pressed={isCompared}
                onClick={() => toggleComparison(product.id)}
                className={`grid size-8 place-items-center transition-opacity hover:opacity-50 ${isCompared ? 'opacity-100' : 'opacity-45'}`}
              >
                <FiLayers size={14} />
              </button>
            </div>
          </div>

          <h3 className="mt-1.5 min-w-0 truncate whitespace-nowrap text-[14px] leading-[1.2] tracking-[-0.012em] min-[420px]:text-[16px] sm:mt-2 sm:text-[18px]">
            <Link
              to={`/product/${product.id}`}
              className="block min-w-0 truncate transition-opacity hover:opacity-55"
            >
              {product.name}
            </Link>
          </h3>

          <div className="mt-3 flex min-h-10 flex-wrap content-start items-center gap-x-2.5 gap-y-1.5 sm:min-h-5">
            <span className="text-[11px] font-medium sm:text-[13px]">
              {currency.format(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-[9px] text-ink/35 line-through sm:text-[11px]">
                  {currency.format(product.originalPrice)}
                </span>
                <span className="border border-line px-1 py-0.5 text-[6px] font-medium uppercase tracking-[0.08em] text-ink/55 sm:px-1.5 sm:text-[7px] sm:tracking-[0.13em]">
                  Save {discount}%
                </span>
              </>
            )}
          </div>
        </div>
        </motion.article>
      </Tilt>

      {/* A body-level portal keeps the modal above transformed tilt containers. */}
      {createPortal(
        <AnimatePresence>
          {quickViewOpen && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-3 [perspective:1400px] sm:p-6">
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
              className="relative z-10 grid max-h-[calc(100svh-1rem)] w-full max-w-4xl origin-center overflow-y-auto overscroll-contain bg-canvas text-ink [transform-style:preserve-3d] sm:max-h-[92svh] sm:grid-cols-2"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 20, scale: 0.965, rotateY: -7 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.98, rotateY: 5 }
              }
              transition={{
                duration: reduceMotion ? 0 : 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                  onClick={(event) => {
                    handleAddToCart(event.currentTarget)
                    setQuickViewOpen(false)
                  }}
                  className="mt-5 flex min-h-12 items-center justify-center gap-3 bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-canvas sm:mt-8 sm:px-6 sm:text-[10px] sm:tracking-[0.18em]"
                >
                  <FiShoppingBag size={16} />
                  {justAdded ? 'Added' : 'Add'}
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
