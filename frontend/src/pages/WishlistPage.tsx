import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  LuArrowLeft as FiArrowLeft,
  LuHeart as FiHeart,
  LuShoppingBag as FiShoppingBag,
  LuTrash2 as FiTrash2,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import { PageLoadingSkeleton } from '../components/LoadingSkeleton'
import { PageReveal } from '../components/PageReveal'
import { useCatalog } from '../hooks/useCatalog'
import { formatMoney } from '../lib/currency'
import { useShopStore } from '../store/useShopStore'
import { createCartFlight, useCartUiStore } from '../store/useCartUiStore'

export function WishlistPage() {
  const reduceMotion = useReducedMotion()
  const { products, status: catalogStatus } = useCatalog()
  const wishlistItems = useShopStore((state) => state.wishlistItems)
  const toggleWishlist = useShopStore((state) => state.toggleWishlist)
  const addToCart = useShopStore((state) => state.addToCart)
  const launchCartFlight = useCartUiStore((state) => state.launchFlight)

  // Resolve saved IDs against the frontend catalog until products come from an API.
  const savedProducts = useMemo(
    () =>
      wishlistItems
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is NonNullable<typeof product> =>
          Boolean(product),
        ),
    [products, wishlistItems],
  )

  const moveToCart = (
    productId: string,
    image: string,
    productName: string,
    source?: Element | null,
  ) => {
    addToCart(productId)
    const sourceImage = source?.closest('article')?.querySelector('img') ?? source
    launchCartFlight(createCartFlight(image, productName, sourceImage))
    toggleWishlist(productId)
  }

  return (
    <main className="min-h-[65svh] w-full min-w-0 overflow-x-clip bg-canvas px-3 py-6 text-ink min-[380px]:px-4 min-[380px]:py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <PageReveal>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55 hover:text-ink"
          >
            <FiArrowLeft size={14} />
            Continue shopping
          </Link>

          <div className="mt-6 flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-6">
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
                Saved for later
              </p>
              <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl">
                Your wishlist
              </h1>
            </div>
            <p className="shrink-0 pb-1 text-xs text-ink/50">
              {savedProducts.length}{' '}
              {savedProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </PageReveal>

        <PageReveal delay={0.08}>
          {catalogStatus === 'loading' && wishlistItems.length > 0 ? (
            <PageLoadingSkeleton variant="wishlist" />
          ) : savedProducts.length === 0 ? (
            <EmptyWishlist />
          ) : (
          /* Compact media rows are easier to scan on phones; cards expand into
             the editorial grid once there is enough horizontal space. */
          <section
            aria-label="Saved products"
            className="mt-6 grid grid-cols-1 gap-x-3 gap-y-5 min-[520px]:grid-cols-2 min-[520px]:gap-y-7 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence initial={!reduceMotion}>
            {savedProducts.map((product, index) => (
              <motion.article
                key={product.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.32, delay: reduceMotion ? 0 : index * 0.04 }}
                className="group grid min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-3 border-b border-line pb-5 min-[380px]:grid-cols-[116px_minmax(0,1fr)] min-[520px]:block min-[520px]:border-0 min-[520px]:pb-0"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e5df]">
                  <Link
                    to={`/product/${product.id}`}
                    aria-label={`View ${product.name}`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                  </Link>
                  {product.badge && (
                    <span className="absolute left-3 top-3 hidden bg-white px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.14em] text-[#171713] min-[520px]:block">
                      {product.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-white text-[#171713] shadow-sm transition-transform hover:scale-105 min-[520px]:right-3 min-[520px]:top-3"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                <div className="flex min-w-0 flex-col pt-1 min-[520px]:block min-[520px]:pt-4">
                  <p className="text-[8px] uppercase tracking-[0.17em] text-ink/45">
                    {product.brand} · {product.category}
                  </p>
                  <div className="mt-1.5 flex min-w-0 flex-col gap-1 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
                    <h2 className="min-w-0 line-clamp-2 text-sm leading-5 min-[420px]:text-base">
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h2>
                    <div className="shrink-0 text-left text-xs min-[520px]:text-right">
                      <span>{formatMoney(product.price, product.currency)}</span>
                      {product.originalPrice && (
                        <span className="ml-1.5 text-ink/35 line-through">
                          {formatMoney(product.originalPrice, product.currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!product.available}
                    onClick={(event) =>
                      moveToCart(
                        product.id,
                        product.image,
                        product.name,
                        event.currentTarget,
                      )
                    }
                    className="mt-auto flex min-h-11 w-full items-center justify-center gap-1.5 bg-ink px-2 text-[8px] font-medium uppercase tracking-[0.1em] text-canvas disabled:cursor-not-allowed disabled:opacity-40 min-[520px]:mt-4 min-[520px]:min-h-12 min-[520px]:gap-2 min-[520px]:px-4 min-[520px]:text-[9px] min-[520px]:tracking-[0.15em]"
                  >
                    <FiShoppingBag size={14} />
                    {product.available ? 'Move to cart' : 'Out of stock'}
                  </button>
                </div>
              </motion.article>
            ))}
            </AnimatePresence>
          </section>
          )}
        </PageReveal>
      </div>
    </main>
  )
}

function EmptyWishlist() {
  return (
    <section className="grid min-h-[50svh] place-items-center px-2 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-line">
          <FiHeart size={21} />
        </span>
        <h2 className="mt-5 text-2xl">Nothing saved yet.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/55">
          Keep the pieces you love in one place while you make up your mind.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-canvas min-[380px]:w-auto min-[380px]:px-7 min-[380px]:tracking-[0.17em]"
        >
          Explore products
        </Link>
      </div>
    </section>
  )
}
