import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useLocaleStore } from '@/stores/localeStore'
import { useThemeStore } from '@/stores/themeStore'
import { getSettings } from '@/lib/api'
import { UpdateDialog } from '@/components/common/UpdateDialog'

function Root() {
  const apply = useThemeStore((s) => s.apply)
  const theme = useThemeStore((s) => s.theme)
  const applyLocale = useLocaleStore((s) => s.apply)
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    getSettings()
      .then((settings) => {
        useThemeStore.setState({ theme: settings.theme as 'light' | 'dark' })
        useLocaleStore.setState({ locale: settings.locale as 'en-US' | 'zh-TW' })
        useThemeStore.getState().apply()
        useLocaleStore.getState().apply()
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    apply()
  }, [apply, theme])
  useEffect(() => {
    applyLocale()
  }, [applyLocale, locale])
  return (
    <>
      <Outlet />
      <Toaster richColors position="bottom-right" theme={theme} />
      {window.electronAPI?.isElectron && <UpdateDialog />}
    </>
  )
}

export const Route = createRootRoute({ component: Root })
