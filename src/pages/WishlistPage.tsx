import { useMemo } from 'react'
import {
  FiArrowLeft,
  FiHeart,
  FiShoppingBag,
  FiTrash2,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useShopStore } from '../store/useShopStore'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function WishlistPage() {
  const { products, status: catalogStatus } = useCatalog()
  const wishlistItems = useShopStore((state) => state.wishlistItems)
  const toggleWishlist = useShopStore((state) => state.toggleWishlist)
  const addToCart = useShopStore((state) => state.addToCart)

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

  const moveToCart = (productId: string) => {
    addToCart(productId)
    toggleWishlist(productId)
  }

  return (
    <main className="min-h-[65svh] bg-canvas px-4 py-10 text-ink sm:px-7 sm:py-14 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55 hover:text-ink"
        >
          <FiArrowLeft size={14} />
          Continue shopping
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4 border-b border-line pb-6">
          <div className="min-w-0">
            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-ink/50">
              Saved for later
            </p>
            <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl">
              Your wishlist
            </h1>
          </div>
          <p className="shrink-0 text-xs text-ink/50">
            {savedProducts.length}{' '}
            {savedProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {catalogStatus === 'loading' && wishlistItems.length > 0 ? (
          <div className="grid min-h-[45svh] place-items-center text-sm text-ink/50">Loading saved products…</div>
        ) : savedProducts.length === 0 ? (
          <EmptyWishlist />
        ) : (
          /* Cards stack on small phones and gradually expand to four columns. */
          <section
            aria-label="Saved products"
            className="mt-8 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {savedProducts.map((product) => (
              <article key={product.id} className="group min-w-0">
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
                    <span className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.14em] text-[#171713]">
                      {product.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from wishlist`}
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white text-[#171713] shadow-sm transition-transform hover:scale-105"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                <div className="pt-4">
                  <p className="text-[8px] uppercase tracking-[0.17em] text-ink/45">
                    {product.brand} · {product.category}
                  </p>
                  <div className="mt-1.5 flex min-w-0 items-start justify-between gap-3">
                    <h2 className="min-w-0 text-base leading-5">
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h2>
                    <div className="shrink-0 text-right text-xs">
                      <span>{currency.format(product.price)}</span>
                      {product.originalPrice && (
                        <span className="ml-1.5 text-ink/35 line-through">
                          {currency.format(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!product.available}
                    onClick={() => moveToCart(product.id)}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-4 text-[9px] font-medium uppercase tracking-[0.15em] text-canvas disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiShoppingBag size={14} />
                    {product.available ? 'Move to cart' : 'Out of stock'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
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
          className="mt-6 inline-flex min-h-12 items-center bg-ink px-7 text-[9px] font-medium uppercase tracking-[0.17em] text-canvas"
        >
          Explore products
        </Link>
      </div>
    </section>
  )
}
