import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useThemeStore } from '../stores/themeStore'

function Root() {
  const apply = useThemeStore((s) => s.apply)
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    apply()
  }, [apply])
  return (
    <>
      <Outlet />
      <Toaster richColors position="bottom-right" theme={theme} />
    </>
  )
}

export const Route = createRootRoute({ component: Root })
