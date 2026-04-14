import type { Card, CardSearchResult, DuplicateCardRequest, PinnedCard } from '@/types'
import type { EditCardForm, NewCardForm } from '@/lib/schemas'
import { client } from './client'

export const getCard = async (id: number) => {
  const res = await client.get<Card>(`/cards/${id}`)
  return res.data
}

// TODO 後端記得刪掉 description
export const createCard = async (columnId: number, form: NewCardForm) => {
  const res = await client.post<Card>(`/columns/${columnId}/cards`, {
    title: form.title,
  })
  return res.data
}

// TODO 後端所有欄位都設為 optional
export const updateCard = async (id: number, form: EditCardForm) => {
  const payload: Record<string, unknown> = {}

  if (form.title !== undefined) payload.title = form.title
  if (form.description !== undefined) payload.description = form.description
  if (form.storyPoint !== undefined) payload.storyPoint = form.storyPoint
  if (form.priority !== undefined) payload.priority = form.priority
  if (form.startTime !== undefined) payload.startTime = form.startTime || null
  if (form.endTime !== undefined) payload.endTime = form.endTime || null

  const res = await client.patch<Card>(`/cards/${id}`, payload)
  return res.data
}

export const updateCardSchedule = async (
  id: number,
  startTime: string | null,
  endTime: string | null,
) => {
  const res = await client.patch<Card>(`/cards/${id}/schedule`, {
    startTime,
    endTime,
  })
  return res.data
}

export const moveCard = async (
  id: number,
  columnId: number,
  position: number,
) => {
  const res = await client.patch<Card>(`/cards/${id}/move`, {
    columnId: columnId,
    position,
  })
  return res.data
}

export const togglePin = async (id: number) => {
  const res = await client.patch<Card>(`/cards/${id}/pin`)
  return res.data
}

export const deleteCard = async (id: number) => {
  const res = await client.delete(`/cards/${id}`)
  return res.data
}

export const getPinnedCards = async () => {
  const res = await client.get<PinnedCard[]>('/cards/pinned')
  return res.data
}

export const duplicateCard = async (id: number, data: DuplicateCardRequest) => {
  const res = await client.post<Card>(`/cards/${id}/duplicate`, data)
  return res.data
}

export const searchCards = async (query: string, limit = 20) => {
  const res = await client.get<CardSearchResult[]>('/cards/search', {
    params: { q: query, limit },
  })
  return res.data
}
