import { useEffect, useRef } from 'react'
import {
  fetchCart,
  setCartMutationsReady,
  setCartProduct,
} from '../services/cart'
import { useAuthStore } from '../store/useAuthStore'
import { useShopStore } from '../store/useShopStore'

export function useCartSync() {
  const status = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    let cancelled = false
    setCartMutationsReady(false)

    const reconcile = async () => {
      if (status === 'guest' && previousUserId.current) {
        previousUserId.current = null
        useShopStore.getState().setCartItems({}, {})
      } else if (status === 'authenticated' && userId) {
        previousUserId.current = userId
      }

      const localItems = useShopStore.getState().cartItems
      const localSizes = useShopStore.getState().cartSizes
      const serverCart = await fetchCart()

      // Retain offline additions without reducing quantities already merged by the server.
      for (const [slug, localQuantity] of Object.entries(localItems)) {
        const targetQuantity = Math.max(serverCart.items[slug] ?? 0, localQuantity)
        const targetSize = localSizes[slug] ?? serverCart.sizes[slug]
        if (
          targetQuantity !== serverCart.items[slug] ||
          (targetSize && targetSize !== serverCart.sizes[slug])
        ) {
          await setCartProduct(slug, targetQuantity, targetSize)
        }
      }

      const reconciled = await fetchCart()
      if (!cancelled) {
        useShopStore.getState().setCartItems(reconciled.items, reconciled.sizes)
        setCartMutationsReady(true)
      }
    }

    void reconcile().catch(() => {
      if (!cancelled) setCartMutationsReady(false)
    })
    return () => {
      cancelled = true
      setCartMutationsReady(false)
    }
  }, [status, userId])
}
