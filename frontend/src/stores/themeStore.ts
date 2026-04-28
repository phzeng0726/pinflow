import { create } from 'zustand'
import { updateSettings } from '@/lib/api'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  apply: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: 'dark',
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: next })
    document.documentElement.classList.toggle('dark', next === 'dark')
    updateSettings({ theme: next }).catch(() => {})
    window.electronAPI?.broadcastSettings?.({ theme: next })
  },
  apply: () => {
    document.documentElement.classList.toggle('dark', get().theme === 'dark')
  },
}))
