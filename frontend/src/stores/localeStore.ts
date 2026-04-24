import i18n from '@/lib/i18n'
import { create } from 'zustand'
import { updateSettings } from '@/lib/api'

type Locale = 'en-US' | 'zh-TW'

interface LocaleState {
  locale: Locale
  toggle: () => void
  apply: () => void
}

export const useLocaleStore = create<LocaleState>()((set, get) => ({
  locale: 'en-US',
  toggle: () => {
    const next = get().locale === 'en-US' ? 'zh-TW' : 'en-US'
    set({ locale: next })
    i18n.changeLanguage(next)
    updateSettings({ locale: next }).catch(() => {})
    window.electronAPI?.broadcastSettings?.({ locale: next })
  },
  apply: () => {
    i18n.changeLanguage(get().locale)
  },
}))
