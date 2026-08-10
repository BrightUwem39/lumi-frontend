import { useEffect, useRef } from 'react'
import { fetchWishlist, saveWishlistProduct } from '../services/wishlist'
import { useAuthStore } from '../store/useAuthStore'
import { useShopStore } from '../store/useShopStore'

export function useWishlistSync() {
  const status = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      let cancelled = false
      previousUserId.current = userId

      const reconcile = async () => {
        const guestItems = useShopStore.getState().wishlistItems
        await Promise.all(guestItems.map((slug) => saveWishlistProduct(slug)))
        const serverItems = await fetchWishlist()
        if (!cancelled) {
          const currentItems = useShopStore.getState().wishlistItems
          const addedWhileSyncing = currentItems.filter(
            (slug) => !guestItems.includes(slug),
          )
          const removedWhileSyncing = new Set(
            guestItems.filter((slug) => !currentItems.includes(slug)),
          )
          const reconciled = [...new Set([...serverItems, ...addedWhileSyncing])]
            .filter((slug) => !removedWhileSyncing.has(slug))
          useShopStore.getState().setWishlistItems(reconciled)
        }
      }

      void reconcile().catch(() => {
        // Keep the optimistic local list when the API is temporarily unavailable.
      })
      return () => {
        cancelled = true
      }
    }

    if (status === 'guest' && previousUserId.current) {
      previousUserId.current = null
      useShopStore.getState().setWishlistItems([])
    }
  }, [status, userId])
}
