import type { Tag } from '../../types'
import { client } from './client'

export const listTags = () => client.get<Tag[]>('/tags').then((r) => r.data)
export const createTag = (name: string) =>
  client.post<Tag>('/tags', { name }).then((r) => r.data)
export const attachTag = (cardId: number, tagId: number) =>
  client
    .post<Tag[]>(`/cards/${cardId}/tags`, { tag_id: tagId })
    .then((r) => r.data)
export const detachTag = (cardId: number, tagId: number) =>
  client.delete(`/cards/${cardId}/tags/${tagId}`)
