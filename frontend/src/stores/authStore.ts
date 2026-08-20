import { create } from 'zustand'
import { deleteAuthSession, getAuthStatus } from '@/lib/api'

type AuthStore = {
  isAuthenticated: boolean
  userId?: string
  email?: string
  expiresAt?: string
  renewalRequired: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkStatus: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  renewalRequired: false,
  isLoading: false,
  login: async () => {
    set({ isLoading: true })
    try {
      if (window.electronAPI?.isElectron) {
        await window.electronAPI.startAuth?.()
      }
      await useAuthStore.getState().checkStatus()
    } finally {
      set({ isLoading: false })
    }
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      if (window.electronAPI?.isElectron) {
        await window.electronAPI.logout?.()
      } else {
        await deleteAuthSession()
      }
      set({
        isAuthenticated: false,
        userId: undefined,
        email: undefined,
        expiresAt: undefined,
        renewalRequired: false,
      })
    } finally {
      set({ isLoading: false })
    }
  },
  checkStatus: async () => {
    set({ isLoading: true })
    try {
      const status = await getAuthStatus()
      if (!status.authenticated) {
        set({
          isAuthenticated: false,
          userId: undefined,
          email: undefined,
          expiresAt: undefined,
          renewalRequired: false,
        })
        return
      }
      set({
        isAuthenticated: true,
        userId: status.userId,
        email: status.email,
        expiresAt: status.expiresAt,
        renewalRequired: status.renewalRequired ?? false,
      })
    } catch {
      set({
        isAuthenticated: false,
        userId: undefined,
        email: undefined,
        expiresAt: undefined,
        renewalRequired: false,
      })
    } finally {
      set({ isLoading: false })
    }
  },
}))

export function setupAuthStateSync() {
  void useAuthStore.getState().checkStatus()
  return window.electronAPI?.onAuthChanged?.(
    () => void useAuthStore.getState().checkStatus(),
  )
}
