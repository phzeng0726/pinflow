import type { Card, DuplicateCardRequest, PinnedCard } from '../../types'
import type { EditCardForm, NewCardForm } from '../schemas'
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

// TODO 後端 description 應該是 optional
export const updateCard = async (id: number, form: EditCardForm) => {
  const res = await client.patch<Card>(`/cards/${id}`, {
    title: form.title,
    description: form.description,
    storyPoint: form.storyPoint ?? null,
    startTime: form.startTime ?? null,
    endTime: form.endTime ?? null,
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
