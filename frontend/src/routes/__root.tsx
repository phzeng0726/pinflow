import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useThemeStore } from '../stores/themeStore'

function Root() {
  const apply = useThemeStore(s => s.apply)
  useEffect(() => { apply() }, [apply])
  return <Outlet />
}

export const Route = createRootRoute({ component: Root })
