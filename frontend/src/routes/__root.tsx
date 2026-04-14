import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useLocaleStore } from '@/stores/localeStore'
import { useThemeStore } from '@/stores/themeStore'

function Root() {
  const apply = useThemeStore((s) => s.apply)
  const theme = useThemeStore((s) => s.theme)
  const applyLocale = useLocaleStore((s) => s.apply)
  useEffect(() => {
    apply()
    applyLocale()
  }, [apply, applyLocale])
  return (
    <>
      <Outlet />
      <Toaster richColors position="bottom-right" theme={theme} />
    </>
  )
}

export const Route = createRootRoute({ component: Root })
