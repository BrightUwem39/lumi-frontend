import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  removeWishlistProduct,
  saveWishlistProduct,
} from '../services/wishlist'
import { useAuthStore } from './useAuthStore'
import {
  cartMutationsReady,
  clearServerCart,
  removeCartProduct,
  setCartProduct,
} from '../services/cart'

// The shape of the shared shopping state used across unrelated components.
type ShopState = {
  cartCount: number
  wishlistCount: number
  cartItems: Record<string, number>
  cartSizes: Record<string, string>
  couponCode: string | null
  wishlistItems: string[]
  comparisonItems: string[]
  recentlyViewedItems: string[]
  addToCart: (productId: string, quantity?: number, size?: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setCartItems: (items: Record<string, number>, sizes?: Record<string, string>) => void
  setCouponCode: (couponCode: string | null) => void
  toggleWishlist: (productId: string) => void
  setWishlistItems: (productIds: string[]) => void
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
      cartSizes: {},
      couponCode: null,
      wishlistItems: [],
      comparisonItems: [],
      recentlyViewedItems: [],
      addToCart: (productId, quantity = 1, size) => {
        let previousQuantity = 0
        let nextQuantity = 0
        let previousSize: string | undefined
        let nextSize: string | undefined
        set((state) => {
          previousQuantity = state.cartItems[productId] ?? 0
          previousSize = state.cartSizes[productId]
          nextSize = size ?? previousSize
          nextQuantity = Math.min(10, previousQuantity + quantity)
          const cartItems = {
            ...state.cartItems,
            [productId]: nextQuantity,
          }

          return {
            cartItems,
            cartSizes: nextSize
              ? { ...state.cartSizes, [productId]: nextSize }
              : state.cartSizes,
            cartCount: countCartItems(cartItems),
            couponCode: null,
          }
        })
        if (cartMutationsReady()) {
          void setCartProduct(productId, nextQuantity, nextSize).catch(() => {
            set((state) => rollbackCartQuantity(
              state,
              productId,
              nextQuantity,
              previousQuantity,
              previousSize,
            ))
          })
        }
      },
      updateCartQuantity: (productId, quantity) => {
        let previousQuantity = 0
        let previousSize: string | undefined
        const nextQuantity = Math.min(quantity, 10)
        set((state) => {
          previousQuantity = state.cartItems[productId] ?? 0
          previousSize = state.cartSizes[productId]
          const cartItems = { ...state.cartItems }
          const cartSizes = { ...state.cartSizes }
          if (nextQuantity <= 0) delete cartItems[productId]
          else cartItems[productId] = nextQuantity
          if (nextQuantity <= 0) delete cartSizes[productId]

          return { cartItems, cartSizes, cartCount: countCartItems(cartItems), couponCode: null }
        })
        if (cartMutationsReady()) {
          const request = nextQuantity <= 0
            ? removeCartProduct(productId)
            : setCartProduct(productId, nextQuantity, useShopStore.getState().cartSizes[productId])
          void request.catch(() => {
            set((state) => rollbackCartQuantity(
              state,
              productId,
              Math.max(0, nextQuantity),
              previousQuantity,
              previousSize,
            ))
          })
        }
      },
      removeFromCart: (productId) => {
        let previousQuantity = 0
        let previousSize: string | undefined
        set((state) => {
          previousQuantity = state.cartItems[productId] ?? 0
          previousSize = state.cartSizes[productId]
          const cartItems = { ...state.cartItems }
          const cartSizes = { ...state.cartSizes }
          delete cartItems[productId]
          delete cartSizes[productId]
          return { cartItems, cartSizes, cartCount: countCartItems(cartItems), couponCode: null }
        })
        if (cartMutationsReady()) {
          void removeCartProduct(productId).catch(() => {
            set((state) => rollbackCartQuantity(
              state,
              productId,
              0,
              previousQuantity,
              previousSize,
            ))
          })
        }
      },
      clearCart: () => {
        let previousItems: Record<string, number> = {}
        let previousSizes: Record<string, string> = {}
        set((state) => {
          previousItems = state.cartItems
          previousSizes = state.cartSizes
          return { cartItems: {}, cartSizes: {}, cartCount: 0, couponCode: null }
        })
        if (cartMutationsReady()) {
          void clearServerCart().catch(() => {
            set((state) =>
              Object.keys(state.cartItems).length === 0
                ? {
                    cartItems: previousItems,
                    cartSizes: previousSizes,
                    cartCount: countCartItems(previousItems),
                  }
                : state,
            )
          })
        }
      },
      setCartItems: (items, sizes = {}) =>
        set({ cartItems: items, cartSizes: sizes, cartCount: countCartItems(items) }),
      setCouponCode: (couponCode) => set({ couponCode }),
      toggleWishlist: (productId) => {
        let adding = false
        set((state) => {
          adding = !state.wishlistItems.includes(productId)
          const wishlistItems = adding
            ? [...state.wishlistItems, productId]
            : state.wishlistItems.filter((id) => id !== productId)

          return {
            wishlistItems,
            wishlistCount: wishlistItems.length,
          }
        })

        if (useAuthStore.getState().status === 'authenticated') {
          const request = adding
            ? saveWishlistProduct(productId)
            : removeWishlistProduct(productId)
          void request.catch(() => {
            set((state) => {
              const currentlySaved = state.wishlistItems.includes(productId)
              if (currentlySaved !== adding) return state
              const wishlistItems = adding
                ? state.wishlistItems.filter((id) => id !== productId)
                : [...state.wishlistItems, productId]
              return { wishlistItems, wishlistCount: wishlistItems.length }
            })
          })
        }
      },
      setWishlistItems: (productIds) =>
        set({ wishlistItems: productIds, wishlistCount: productIds.length }),
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

function rollbackCartQuantity(
  state: ShopState,
  productId: string,
  expectedQuantity: number,
  previousQuantity: number,
  previousSize?: string,
) {
  const currentQuantity = state.cartItems[productId] ?? 0
  if (currentQuantity !== expectedQuantity) return state
  const cartItems = { ...state.cartItems }
  const cartSizes = { ...state.cartSizes }
  if (previousQuantity <= 0) delete cartItems[productId]
  else cartItems[productId] = previousQuantity
  if (previousQuantity <= 0) delete cartSizes[productId]
  else if (previousSize) cartSizes[productId] = previousSize
  return { cartItems, cartSizes, cartCount: countCartItems(cartItems) }
}
