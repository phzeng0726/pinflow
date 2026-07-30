import { useEffect, useRef, useState } from 'react'
import {
  CloudDownload,
  Clock3,
  HardDriveUpload,
  LoaderCircle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { queryKeys } from '@/hooks/queryKeys'
import { useWorkspaceSource } from '@/hooks/sync/queries/useWorkspaceSource'
import { resolveWorkspaceSource } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceSourceStore } from '@/stores/workspaceSourceStore'
import type { WorkspaceSource } from '@/types'

export function WorkspaceSourceDialog() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const isOpen = useWorkspaceSourceStore((state) => state.isOpen)
  const open = useWorkspaceSourceStore((state) => state.open)
  const close = useWorkspaceSourceStore((state) => state.close)
  const source = useWorkspaceSource(authenticated)
  const [selection, setSelection] = useState<WorkspaceSource>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const resolving = useRef(false)
  const lastAutoAction = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (source.data?.pending) open()
  }, [open, source.data?.pending])

  useEffect(() => {
    const autoAction = source.data?.autoAction
    if (!autoAction || autoAction === lastAutoAction.current) return
    lastAutoAction.current = autoAction
    if (autoAction === 'pulled' || autoAction === 'pushed') {
      toast.success(
        t(autoAction === 'pulled' ? 'sync.autoPulled' : 'sync.autoPushed'),
      )
      void queryClient.invalidateQueries()
    }
  }, [queryClient, source.data?.autoAction, t])

  useEffect(() => {
    if (!authenticated) {
      lastAutoAction.current = undefined
      close()
      setSelection(undefined)
      setError(undefined)
    }
  }, [authenticated, close])

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return
    if (nextOpen) {
      open()
      return
    }
    close()
    setSelection(undefined)
    setError(undefined)
  }

  const resolve = async () => {
    if (!selection || resolving.current) return
    resolving.current = true
    setLoading(true)
    setError(undefined)
    try {
      const nextState = await resolveWorkspaceSource(selection)
      queryClient.setQueryData(queryKeys.sync.source(), nextState)
      await queryClient.invalidateQueries()
      close()
      setSelection(undefined)
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t('sync.actionFailed'),
      )
    } finally {
      resolving.current = false
      setLoading(false)
    }
  }

  const sourceError = error || source.data?.error
  const confirmCloud = selection === 'cloud'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6">
        {selection ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {t(
                  confirmCloud
                    ? 'sync.confirmCloudTitle'
                    : 'sync.confirmLocalTitle',
                )}
              </DialogTitle>
              <DialogDescription>
                {t(
                  confirmCloud
                    ? 'sync.confirmCloudDescription'
                    : 'sync.confirmLocalDescription',
                )}
              </DialogDescription>
            </DialogHeader>
            {sourceError && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {sourceError}
              </p>
            )}
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setSelection(undefined)
                  setError(undefined)
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button disabled={loading} onClick={() => void resolve()}>
                {loading && <LoaderCircle className="size-4 animate-spin" />}
                {loading ? t('sync.replacing') : t('sync.confirmReplace')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('sync.sourceDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('sync.sourceDialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-3">
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 p-4 text-left"
                onClick={() => setSelection('cloud')}
              >
                <CloudDownload className="size-5 shrink-0" />
                <span>
                  <span className="block font-medium">
                    {t('sync.useCloud')}
                  </span>
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {t('sync.useCloudDescription')}
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 p-4 text-left"
                onClick={() => setSelection('local')}
              >
                <HardDriveUpload className="size-5 shrink-0" />
                <span>
                  <span className="block font-medium">
                    {t('sync.useLocal')}
                  </span>
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {t('sync.useLocalDescription')}
                  </span>
                </span>
              </Button>
            </div>
            {sourceError && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {sourceError}
              </p>
            )}
            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={close}>
                <Clock3 className="size-4" />
                {t('sync.decideLater')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
