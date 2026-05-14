import type { ArchivedCard, ArchivedColumn } from '@/types'
import { client } from './client'

export const archiveCard = async (id: number): Promise<void> => {
  await client.patch(`/cards/${id}/archive`)
}

export const restoreCard = async (id: number): Promise<void> => {
  await client.patch(`/cards/${id}/restore`)
}

export const deleteArchivedCard = async (id: number): Promise<void> => {
  await client.delete(`/cards/${id}/archive`)
}

export const archiveColumn = async (id: number): Promise<void> => {
  await client.patch(`/columns/${id}/archive`)
}

export const archiveAllCardsInColumn = async (id: number): Promise<void> => {
  await client.patch(`/columns/${id}/archive-cards`)
}

export const restoreColumn = async (id: number): Promise<void> => {
  await client.patch(`/columns/${id}/restore`)
}

export const deleteArchivedColumn = async (id: number): Promise<void> => {
  await client.delete(`/columns/${id}/archive`)
}

export const getArchivedCards = async (boardId: number): Promise<ArchivedCard[]> => {
  const res = await client.get<ArchivedCard[]>(`/boards/${boardId}/archive/cards`)
  return res.data
}

export const getArchivedColumns = async (boardId: number): Promise<ArchivedColumn[]> => {
  const res = await client.get<ArchivedColumn[]>(`/boards/${boardId}/archive/columns`)
  return res.data
}
