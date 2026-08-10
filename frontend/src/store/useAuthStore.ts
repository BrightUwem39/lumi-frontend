import { create } from 'zustand'
import {
  getCurrentUser,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  verifyCustomerEmail,
  type AuthUser,
} from '../services/auth'

type AuthStatus = 'loading' | 'guest' | 'authenticated'

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (input: Parameters<typeof registerCustomer>[0]) => ReturnType<typeof registerCustomer>
  verifyEmail: (token: string) => ReturnType<typeof verifyCustomerEmail>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  initialize: async () => {
    if (get().status !== 'loading') return
    try {
      const user = await getCurrentUser()
      set({ status: user ? 'authenticated' : 'guest', user })
    } catch {
      set({ status: 'guest', user: null })
    }
  },
  login: async (email, password) => {
    const user = await loginCustomer(email, password)
    set({ status: 'authenticated', user })
  },
  register: (input) => registerCustomer(input),
  verifyEmail: (token) => verifyCustomerEmail(token),
  logout: async () => {
    try {
      await logoutCustomer()
    } finally {
      set({ status: 'guest', user: null })
    }
  },
}))
