import { useState } from 'react'
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Split,
  TriangleAlert,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setSyncEnabled, triggerSync } from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useSyncStatus } from '@/hooks/sync/queries/useSyncStatus'
import { useWorkspaceSource } from '@/hooks/sync/queries/useWorkspaceSource'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceSourceStore } from '@/stores/workspaceSourceStore'

type PendingAction = 'toggle' | 'sync' | 'logout' | null

export function SyncStatusIndicator() {
  const { t } = useTranslation()
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const email = useAuthStore((state) => state.email)
  const authLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const openSourceDialog = useWorkspaceSourceStore((state) => state.open)
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState<string>()
  const status = useSyncStatus(authenticated)
  const source = useWorkspaceSource(authenticated)

  if (!authenticated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        title={t('sync.login')}
        disabled={authLoading}
        onClick={() => void login()}
      >
        {authLoading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Cloud className="size-4" />
        )}
      </Button>
    )
  }

  const state = status.data?.state ?? 'idle'
  const Icon =
    state === 'syncing'
      ? LoaderCircle
      : state === 'error'
        ? TriangleAlert
        : state === 'offline' || state === 'disabled'
          ? CloudOff
          : CheckCircle2
  const iconClassName =
    state === 'syncing' || pendingAction === 'sync'
      ? 'size-4 animate-spin text-blue-500'
      : state === 'error'
        ? 'size-4 text-red-500'
        : state === 'offline'
          ? 'size-4 text-gray-400'
          : state === 'disabled'
            ? 'size-4 text-muted-foreground'
            : 'size-4 text-green-500'
  const isBusy = pendingAction !== null || state === 'syncing'
  const sourcePending = source.data?.pending === true
  const lastSyncAt = status.data?.lastSyncAt
    ? new Date(status.data.lastSyncAt).toLocaleString()
    : t('sync.never')

  const runAction = async (
    action: Exclude<PendingAction, null>,
    operation: () => Promise<void>,
  ) => {
    setPendingAction(action)
    setActionError(undefined)
    try {
      await operation()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t('sync.actionFailed'),
      )
    } finally {
      setPendingAction(null)
    }
  }

  const handleToggle = () =>
    runAction('toggle', async () => {
      const enabled = state === 'disabled'
      await setSyncEnabled(enabled)
      if (enabled) await triggerSync()
      await status.refetch()
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.all(),
      })
    })

  const handleSyncNow = () =>
    runAction('sync', async () => {
      await triggerSync()
      await status.refetch()
    })

  const handleLogout = () =>
    runAction('logout', async () => {
      await logout()
      queryClient.removeQueries({ queryKey: queryKeys.sync.all() })
    })

  const title =
    status.data?.error ||
    (state === 'idle'
      ? `${t('sync.states.idle')}: ${lastSyncAt}`
      : t('sync.status', { state: t(`sync.states.${state}`) }))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={title}>
          <Icon
            data-testid="sync-status-icon"
            className={iconClassName}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
            {t('sync.signedInAs')}
          </span>
          <span className="block truncate">
            {email || t('sync.unknownAccount')}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-1 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between gap-3">
            <span>{t('sync.stateLabel')}</span>
            <span>{t(`sync.states.${state}`)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>{t('sync.lastSync')}</span>
            <span className="truncate text-right">{lastSyncAt}</span>
          </div>
          {(status.data?.error || actionError) && (
            <p className="text-red-600 dark:text-red-400">
              {status.data?.error || actionError}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        {sourcePending && (
          <DropdownMenuItem disabled={isBusy} onSelect={openSourceDialog}>
            <Split className="size-4" />
            {t('sync.chooseSource')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isBusy || sourcePending}
          onSelect={handleToggle}
        >
          <CloudOff className="size-4" />
          {state === 'disabled' ? t('sync.enable') : t('sync.disable')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isBusy || state === 'disabled' || sourcePending}
          onSelect={handleSyncNow}
        >
          <RefreshCw
            className={
              pendingAction === 'sync' ? 'size-4 animate-spin' : 'size-4'
            }
          />
          {t('sync.syncNow')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          disabled={pendingAction !== null || authLoading}
          onSelect={handleLogout}
        >
          <LogOut className="size-4" />
          {t('sync.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
