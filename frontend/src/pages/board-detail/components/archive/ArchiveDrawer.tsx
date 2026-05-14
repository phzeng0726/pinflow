import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useArchivedCards, useArchivedColumns } from '@/hooks/archive/queries/useArchivedItems'
import {
  useDeleteArchivedCard,
  useDeleteArchivedColumn,
  useRestoreCard,
  useRestoreColumn,
} from '@/hooks/archive/mutations/useArchiveMutations'
import { ArchivedCardItem } from './ArchivedCardItem'
import { ArchivedColumnItem } from './ArchivedColumnItem'

interface Props {
  boardId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DeleteTarget =
  | { type: 'card'; id: number }
  | { type: 'column'; id: number }
  | null

export function ArchiveDrawer({ boardId, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  const { data: archivedCards = [] } = useArchivedCards(boardId)
  const { data: archivedColumns = [] } = useArchivedColumns(boardId)

  const restoreCard = useRestoreCard(boardId)
  const restoreColumn = useRestoreColumn(boardId)
  const deleteCard = useDeleteArchivedCard(boardId)
  const deleteColumn = useDeleteArchivedColumn(boardId)

  const sortedCards = [...archivedCards].sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
  )
  const sortedColumns = [...archivedColumns].sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
  )

  const handleRestoreCard = (id: number) => {
    restoreCard.mutate(id)
  }

  const handleRestoreColumn = (id: number) => {
    restoreColumn.mutate(id)
  }

  const handleDeleteCard = (id: number) => {
    setDeleteTarget({ type: 'card', id })
  }

  const handleDeleteColumn = (id: number) => {
    setDeleteTarget({ type: 'column', id })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'card') {
      deleteCard.mutate(deleteTarget.id)
    } else {
      deleteColumn.mutate(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  const handleCancelDelete = () => setDeleteTarget(null)

  const deleteDesc =
    deleteTarget?.type === 'card'
      ? t('archive.confirmDeleteCard')
      : t('archive.confirmDeleteColumn')

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-96 flex-col overflow-hidden p-0 dark:bg-gray-800">
          <SheetHeader className="border-b px-6 py-4 dark:border-gray-700">
            <SheetTitle className="dark:text-gray-100">{t('archive.title')}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden px-4 py-4">
            <Tabs defaultValue="cards" className="flex flex-1 flex-col overflow-hidden">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="cards" className="flex-1">
                  {t('archive.cards')}
                  {archivedCards.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-600">
                      {archivedCards.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="columns" className="flex-1">
                  {t('archive.columns')}
                  {archivedColumns.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-600">
                      {archivedColumns.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="flex-1 overflow-y-auto">
                {sortedCards.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    {t('archive.emptyCards')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedCards.map((card) => (
                      <ArchivedCardItem
                        key={card.id}
                        card={card}
                        onRestore={handleRestoreCard}
                        onDelete={handleDeleteCard}
                        isRestoring={restoreCard.isPending && restoreCard.variables === card.id}
                        disabled={restoreCard.isPending || deleteCard.isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="columns" className="flex-1 overflow-y-auto">
                {sortedColumns.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    {t('archive.emptyColumns')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedColumns.map((column) => (
                      <ArchivedColumnItem
                        key={column.id}
                        column={column}
                        onRestore={handleRestoreColumn}
                        onDelete={handleDeleteColumn}
                        isRestoring={restoreColumn.isPending && restoreColumn.variables === column.id}
                        disabled={restoreColumn.isPending || deleteColumn.isPending}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) handleCancelDelete() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('archive.deleteForever')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('archive.confirmDelete')} {deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={deleteCard.isPending || deleteColumn.isPending}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteCard.isPending || deleteColumn.isPending}
              onClick={handleConfirmDelete}
            >
              {(deleteCard.isPending || deleteColumn.isPending) && (
                <span className="mr-1.5 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {t('archive.deleteForever')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
