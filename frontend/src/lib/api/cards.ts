import type { Card, DuplicateCardRequest, PinnedCard } from '../../types'
import { client } from './client'

export const getCard = async (id: number) => {
  const res = await client.get<Card>(`/cards/${id}`)
  return res.data
}

export const createCard = async (
  columnId: number,
  title: string,
  description: string,
) => {
  const res = await client.post<Card>(`/columns/${columnId}/cards`, {
    title,
    description,
  })
  return res.data
}

export const updateCard = async (
  id: number,
  title: string,
  description: string,
  storyPoint?: number | null,
  startTime?: string | null,
  endTime?: string | null,
) => {
  const res = await client.patch<Card>(`/cards/${id}`, {
    title,
    description,
    story_point: storyPoint ?? null,
    start_time: startTime ?? null,
    end_time: endTime ?? null,
  })
  return res.data
}

export const moveCard = async (
  id: number,
  columnId: number,
  position: number,
) => {
  const res = await client.patch<Card>(`/cards/${id}/move`, {
    column_id: columnId,
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
