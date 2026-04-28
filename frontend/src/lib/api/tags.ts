import type { Tag } from '@/types'
import { client } from './client'


export const listBoardTags = async (boardId: number) => {
  const res = await client.get<Tag[]>(`/boards/${boardId}/tags`)
  return res.data
}

export const createBoardTag = async (
  boardId: number,
  payload: { name: string; color?: string },
) => {
  const res = await client.post<Tag>(`/boards/${boardId}/tags`, payload)
  return res.data
}

export const updateTag = async (
  id: number,
  data: { name?: string; color?: string },
) => {
  const res = await client.patch<Tag>(`/tags/${id}`, data)
  return res.data
}

export const deleteTag = async (id: number) => {
  const res = await client.delete(`/tags/${id}`)
  return res.data
}

export const attachTag = async (cardId: number, tagId: number) => {
  const res = await client.post<Tag[]>(`/cards/${cardId}/tags`, {
    tag_id: tagId,
  })
  return res.data
}

export const detachTag = async (cardId: number, tagId: number) => {
  const res = await client.delete(`/cards/${cardId}/tags/${tagId}`)
  return res.data
}
