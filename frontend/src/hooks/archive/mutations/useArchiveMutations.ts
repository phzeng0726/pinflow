import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useTranslation } from 'react-i18next'

export function useArchiveCard(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.archiveCard(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.archive.cards(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() }),
      ])
      toast.success(t('toast.archive.cardArchived'))
    },
    onError: () => toast.error(t('toast.card.updateError')),
  })
}

export function useRestoreCard(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.restoreCard(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.archive.cards(boardId) }),
      ])
      toast.success(t('toast.archive.cardRestored'))
    },
    onError: () => toast.error(t('toast.card.updateError')),
  })
}

export function useDeleteArchivedCard(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.deleteArchivedCard(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.archive.cards(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.snapshots.byBoard(boardId) }),
      ])
      toast.success(t('toast.archive.cardDeleted'))
    },
    onError: () => toast.error(t('toast.card.deleteError')),
  })
}

export function useArchiveColumn(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.archiveColumn(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.archive.columns(boardId) }),
      ])
      toast.success(t('toast.archive.columnArchived'))
    },
    onError: () => toast.error(t('toast.column.updateError')),
  })
}

export function useArchiveAllCardsInColumn(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.archiveAllCardsInColumn(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.archive.cards(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.cards.pinned() }),
      ])
      toast.success(t('toast.archive.allCardsArchived'))
    },
    onError: () => toast.error(t('toast.column.updateError')),
  })
}

export function useRestoreColumn(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.restoreColumn(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.archive.columns(boardId) }),
      ])
      toast.success(t('toast.archive.columnRestored'))
    },
    onError: () => toast.error(t('toast.column.updateError')),
  })
}

export function useDeleteArchivedColumn(boardId: number) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => api.deleteArchivedColumn(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.archive.columns(boardId) }),
        qc.invalidateQueries({ queryKey: queryKeys.snapshots.byBoard(boardId) }),
      ])
      toast.success(t('toast.archive.columnDeleted'))
    },
    onError: () => toast.error(t('toast.column.deleteError')),
  })
}
