import { create } from 'zustand'

export type CartFlight = {
  id: number
  image: string
  productName: string
  from: { left: number; top: number; width: number; height: number }
}

type CartUiState = {
  drawerOpen: boolean
  flight: CartFlight | null
  pulseKey: number
  openDrawer: () => void
  closeDrawer: () => void
  launchFlight: (flight: Omit<CartFlight, 'id'>) => void
  completeFlight: (id: number) => void
}

let flightSequence = 0

// Transient cart presentation state stays separate from the persisted cart data.
export const useCartUiStore = create<CartUiState>((set) => ({
  drawerOpen: false,
  flight: null,
  pulseKey: 0,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  launchFlight: (flight) =>
    set({
      flight: { ...flight, id: ++flightSequence },
      drawerOpen: false,
    }),
  completeFlight: (id) =>
    set((state) =>
      state.flight?.id === id
        ? { flight: null, drawerOpen: true, pulseKey: state.pulseKey + 1 }
        : state,
    ),
}))

// Store a plain rectangle because DOMRect instances should not enter React state.
export function createCartFlight(
  image: string,
  productName: string,
  source?: Element | null,
): Omit<CartFlight, 'id'> {
  const rect = source?.getBoundingClientRect()
  return {
    image,
    productName,
    from: rect && rect.width > 0
      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      : { left: window.innerWidth / 2 - 24, top: window.innerHeight / 2, width: 48, height: 60 },
  }
}
