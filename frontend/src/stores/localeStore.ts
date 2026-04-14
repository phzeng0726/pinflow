import i18n from '@/lib/i18n'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Locale = 'en-US' | 'zh-TW'

interface LocaleState {
  locale: Locale
  toggle: () => void
  apply: () => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en-US',
      toggle: () => {
        const next = get().locale === 'en-US' ? 'zh-TW' : 'en-US'
        set({ locale: next })
        i18n.changeLanguage(next)
      },
      apply: () => {
        i18n.changeLanguage(get().locale)
      },
    }),
    { name: 'pinflow-locale' },
  ),
)
