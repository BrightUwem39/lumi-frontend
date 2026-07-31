import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The shape of the shared shopping state used across unrelated components.
type ShopState = {
  cartCount: number
  wishlistCount: number
  cartItems: Record<string, number>
  wishlistItems: string[]
  comparisonItems: string[]
  recentlyViewedItems: string[]
  addToCart: (productId: string, quantity?: number) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  toggleComparison: (productId: string) => void
  clearComparison: () => void
  addRecentlyViewed: (productId: string) => void
}

// Zustand keeps cart and wishlist data available without prop drilling.
// Persistence keeps the cart intact when a customer opens another page.
export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      cartCount: 0,
      wishlistCount: 0,
      cartItems: {},
      wishlistItems: [],
      comparisonItems: [],
      recentlyViewedItems: [],
      addToCart: (productId, quantity = 1) =>
        set((state) => {
          const cartItems = {
            ...state.cartItems,
            [productId]: (state.cartItems[productId] ?? 0) + quantity,
          }

          return {
            cartItems,
            cartCount: countCartItems(cartItems),
          }
        }),
      updateCartQuantity: (productId, quantity) =>
        set((state) => {
          const cartItems = { ...state.cartItems }
          if (quantity <= 0) delete cartItems[productId]
          else cartItems[productId] = Math.min(quantity, 10)

          return { cartItems, cartCount: countCartItems(cartItems) }
        }),
      removeFromCart: (productId) =>
        set((state) => {
          const cartItems = { ...state.cartItems }
          delete cartItems[productId]
          return { cartItems, cartCount: countCartItems(cartItems) }
        }),
      clearCart: () => set({ cartItems: {}, cartCount: 0 }),
      toggleWishlist: (productId) =>
        set((state) => {
          const wishlistItems = state.wishlistItems.includes(productId)
            ? state.wishlistItems.filter((id) => id !== productId)
            : [...state.wishlistItems, productId]

          return {
            wishlistItems,
            wishlistCount: wishlistItems.length,
          }
        }),
      toggleComparison: (productId) =>
        set((state) => ({
          comparisonItems: state.comparisonItems.includes(productId)
            ? state.comparisonItems.filter((id) => id !== productId)
            : state.comparisonItems.length < 3
              ? [...state.comparisonItems, productId]
              : state.comparisonItems,
        })),
      clearComparison: () => set({ comparisonItems: [] }),
      addRecentlyViewed: (productId) =>
        set((state) => ({
          recentlyViewedItems: [
            productId,
            ...state.recentlyViewedItems.filter((id) => id !== productId),
          ].slice(0, 4),
        })),
    }),
    { name: 'lumi-shop' },
  ),
)

function countCartItems(cartItems: Record<string, number>) {
  return Object.values(cartItems).reduce(
    (total, quantity) => total + quantity,
    0,
  )
}
