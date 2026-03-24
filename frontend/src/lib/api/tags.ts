import type { Tag } from '../../types'
import { client } from './client'

export const listTags = async () => {
  const res = await client.get<Tag[]>('/tags')
  return res.data
}

export const createTag = async (name: string, color: string = '') => {
  const res = await client.post<Tag>('/tags', {
    name,
    color,
  })
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
