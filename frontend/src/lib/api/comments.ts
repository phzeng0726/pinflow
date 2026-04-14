import type { Comment } from '@/types'
import { client } from './client'

export const createComment = async (cardId: number, text: string) => {
  const res = await client.post<Comment>(`/cards/${cardId}/comments`, { text })
  return res.data
}

export const updateComment = async (id: number, text: string) => {
  const res = await client.patch<Comment>(`/comments/${id}`, { text })
  return res.data
}

export const deleteComment = async (id: number) => {
  const res = await client.delete(`/comments/${id}`)
  return res.data
}
