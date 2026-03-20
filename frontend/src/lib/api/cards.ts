import type { Card, DuplicateCardRequest, PinnedCard } from '../../types'
import { client } from './client'

export const getCard = (id: number) => client.get<Card>(`/cards/${id}`).then(r => r.data)
export const createCard = (columnId: number, title: string, description: string) =>
  client.post<Card>(`/columns/${columnId}/cards`, { title, description }).then(r => r.data)
export const updateCard = (
  id: number,
  title: string,
  description: string,
  startTime?: string | null,
  endTime?: string | null,
) =>
  client
    .patch<Card>(`/cards/${id}`, { title, description, start_time: startTime ?? null, end_time: endTime ?? null })
    .then(r => r.data)
export const moveCard = (id: number, columnId: number, position: number) =>
  client.patch<Card>(`/cards/${id}/move`, { column_id: columnId, position }).then(r => r.data)
export const togglePin = (id: number) => client.patch<Card>(`/cards/${id}/pin`).then(r => r.data)
export const deleteCard = (id: number) => client.delete(`/cards/${id}`)
export const getPinnedCards = () => client.get<PinnedCard[]>('/cards/pinned').then(r => r.data)
export const duplicateCard = (id: number, data: DuplicateCardRequest) =>
  client.post<Card>(`/cards/${id}/duplicate`, data).then(r => r.data)
