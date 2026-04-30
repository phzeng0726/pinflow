import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const INSTALLER_MIN_BYTES = 1024 * 1024 // 1 MB — blockmap is always smaller

type UpdateState =
  | { phase: 'idle' }
  | { phase: 'available'; version: string }
  | { phase: 'preparing' }
  | { phase: 'downloading'; percent: number }
  | { phase: 'downloaded' }
  | { phase: 'error'; message: string }

export function UpdateDialog() {
  const { t } = useTranslation()
  const [state, setState] = useState<UpdateState>({ phase: 'idle' })

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    api.onUpdateAvailable?.(({ version }: { version: string }) =>
      setState({ phase: 'available', version }),
    )
    api.onUpdateProgress?.(({ percent, total }: { percent: number; total: number }) => {
      if (total < INSTALLER_MIN_BYTES) {
        setState({ phase: 'preparing' })
      } else {
        setState({ phase: 'downloading', percent })
      }
    })
    api.onUpdateDownloaded?.(() => setState({ phase: 'downloaded' }))
    api.onUpdateError?.(({ message }: { message: string }) =>
      setState({ phase: 'error', message }),
    )

    return () => api.removeUpdateListeners?.()
  }, [])

  if (state.phase === 'idle') return null

  const isPreparing = state.phase === 'preparing'
  const isDownloading = state.phase === 'downloading'
  const isDownloaded = state.phase === 'downloaded'
  const isError = state.phase === 'error'

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm p-6"
        onPointerDownOutside={(e) => (isPreparing || isDownloading) && e.preventDefault()}
        onEscapeKeyDown={(e) => (isPreparing || isDownloading) && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state.phase === 'available' && t('updater.availableTitle')}
            {(isPreparing || isDownloading) && t('updater.downloadingTitle')}
            {isDownloaded && t('updater.downloadedTitle')}
            {isError && t('updater.errorTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-sm text-muted-foreground">
          {state.phase === 'available' &&
            t('updater.availableDesc', { version: state.version })}
          {isPreparing && (
            <div className="space-y-3">
              <p>{t('updater.preparingDesc')}</p>
              <Progress value={null} className="animate-pulse" />
            </div>
          )}
          {isDownloading && (
            <div className="space-y-3">
              <p>{t('updater.downloadingDesc')}</p>
              <Progress value={state.percent} />
              <p className="text-right text-xs">{state.percent}%</p>
            </div>
          )}
          {isDownloaded && t('updater.downloadedDesc')}
          {isError && state.message}
        </div>

        <DialogFooter>
          {state.phase === 'available' && (
            <>
              <Button variant="ghost" onClick={() => setState({ phase: 'idle' })}>
                {t('updater.later')}
              </Button>
              <Button
                onClick={() => {
                  setState({ phase: 'downloading', percent: 0 })
                  window.electronAPI?.startUpdateDownload?.()
                }}
              >
                {t('updater.updateNow')}
              </Button>
            </>
          )}
          {isDownloaded && (
            <Button onClick={() => window.electronAPI?.installUpdate?.()}>
              {t('updater.restartNow')}
            </Button>
          )}
          {isError && (
            <Button variant="ghost" onClick={() => setState({ phase: 'idle' })}>
              {t('updater.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
