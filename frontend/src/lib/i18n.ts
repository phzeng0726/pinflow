import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from '@/locales/en-US.json'
import zhTW from '@/locales/zh-TW.json'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-TW': { translation: zhTW },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
