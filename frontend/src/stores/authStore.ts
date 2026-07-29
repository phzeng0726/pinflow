import { create } from 'zustand'
import { deleteAuthSession, getAuthStatus } from '@/lib/api'

type AuthStore = { isAuthenticated: boolean; userId?: string; email?: string; isLoading: boolean; login: () => Promise<void>; logout: () => Promise<void>; checkStatus: () => Promise<void> }
export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false, isLoading: false,
  login: async () => { set({ isLoading: true }); try { if (window.electronAPI?.isElectron) await window.electronAPI.startAuth?.(); await useAuthStore.getState().checkStatus() } finally { set({ isLoading: false }) } },
  logout: async () => { set({ isLoading: true }); try { if (window.electronAPI?.isElectron) await window.electronAPI.logout?.(); else await deleteAuthSession(); set({ isAuthenticated: false, userId: undefined, email: undefined }) } finally { set({ isLoading: false }) } },
  checkStatus: async () => { set({ isLoading: true }); try { const status = await getAuthStatus(); set({ isAuthenticated: status.authenticated, userId: status.userId, email: status.email }) } catch { set({ isAuthenticated: false, userId: undefined, email: undefined }) } finally { set({ isLoading: false }) } },
}))
