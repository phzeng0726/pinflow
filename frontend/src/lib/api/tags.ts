import type { Tag } from '../../types'
import { client } from './client'

export const listTags = () => client.get<Tag[]>('/tags').then((r) => r.data)
export const createTag = (name: string, color: string = '') =>
  client.post<Tag>('/tags', { name, color }).then((r) => r.data)
export const updateTag = (
  id: number,
  data: { name?: string; color?: string },
) => client.patch<Tag>(`/tags/${id}`, data).then((r) => r.data)
export const deleteTag = (id: number) => client.delete(`/tags/${id}`)
export const attachTag = (cardId: number, tagId: number) =>
  client
    .post<Tag[]>(`/cards/${cardId}/tags`, { tag_id: tagId })
    .then((r) => r.data)
export const detachTag = (cardId: number, tagId: number) =>
  client.delete(`/cards/${cardId}/tags/${tagId}`)
