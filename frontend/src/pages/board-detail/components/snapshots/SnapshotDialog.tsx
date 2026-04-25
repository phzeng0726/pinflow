import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSnapshots } from '@/hooks/snapshot/queries/useSnapshots'
import { useSnapshotMutations } from '@/hooks/snapshot/mutations/useSnapshotMutations'
import { SnapshotList } from '@/pages/board-detail/components/snapshots/SnapshotList'
import { CreateSnapshotDialog } from '@/pages/board-detail/components/snapshots/CreateSnapshotDialog'
import { RestoreConfirmDialog } from '@/pages/board-detail/components/snapshots/RestoreConfirmDialog'

interface SnapshotDialogProps {
  boardId: number
  open: boolean
  onClose: () => void
}

export function SnapshotDialog({ boardId, open, onClose }: SnapshotDialogProps) {
  const { t } = useTranslation()
  const { data: snapshots = [] } = useSnapshots(boardId)
  const { createSnapshot, restoreSnapshot, deleteSnapshot } = useSnapshotMutations(boardId)

  const [createOpen, setCreateOpen] = useState(false)
  const [pendingRestoreId, setPendingRestoreId] = useState<number | null>(null)

  const isPending =
    createSnapshot.isPending || restoreSnapshot.isPending || deleteSnapshot.isPending

  const manualSnaps = snapshots.filter((s) => s.isManual)
  const autoSnaps = snapshots.filter((s) => !s.isManual)

  const handleRestore = (id: number) => setPendingRestoreId(id)

  const handleConfirmRestore = () => {
    if (pendingRestoreId == null) return
    restoreSnapshot.mutate(pendingRestoreId, {
      onSuccess: () => {
        setPendingRestoreId(null)
        onClose()
      },
    })
  }

  const handleDelete = (id: number) => deleteSnapshot.mutate(id)

  const handleCreate = (name: string) => createSnapshot.mutate(name || undefined)

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col overflow-hidden p-0">
          <DialogTitle className="sr-only">{t('snapshot.dialogTitle')}</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-3 dark:border-gray-700">
            <span className="text-xl font-semibold">{t('snapshot.dialogTitle')}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setCreateOpen(true)}
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('snapshot.createSnapshot')}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('snapshot.manualSnapshots')}
              </h3>
              <SnapshotList
                snapshots={manualSnaps}
                onRestore={handleRestore}
                onDelete={handleDelete}
                isPending={isPending}
              />
            </section>

            {autoSnaps.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('snapshot.autoSnapshots')}
                </h3>
                <SnapshotList
                  snapshots={autoSnaps}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  isPending={isPending}
                />
              </section>
            )}

            <p className="whitespace-pre-line border-t pt-3 text-xs leading-relaxed text-gray-400 dark:border-gray-700">
              {t('snapshot.policyHint')}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <CreateSnapshotDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        isPending={isPending}
      />

      <RestoreConfirmDialog
        open={pendingRestoreId != null}
        onClose={() => setPendingRestoreId(null)}
        onConfirm={handleConfirmRestore}
      />
    </>
  )
}
