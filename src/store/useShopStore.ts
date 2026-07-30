import { create } from 'zustand'

// The shape of the shared shopping state used across unrelated components.
type ShopState = {
  cartCount: number
  wishlistCount: number
  cartItems: Record<string, number>
  wishlistItems: string[]
  addToCart: (productId: string, quantity?: number) => void
  toggleWishlist: (productId: string) => void
}

// Zustand keeps cart and wishlist data available without prop drilling.
// Browser persistence can be added when the full cart experience is built.
export const useShopStore = create<ShopState>((set) => ({
  cartCount: 0,
  wishlistCount: 0,
  cartItems: {},
  wishlistItems: [],
  addToCart: (productId, quantity = 1) =>
    set((state) => {
      const cartItems = {
        ...state.cartItems,
        [productId]: (state.cartItems[productId] ?? 0) + quantity,
      }

      return {
        cartItems,
        cartCount: Object.values(cartItems).reduce(
          (total, quantity) => total + quantity,
          0,
        ),
      }
    }),
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
}))
