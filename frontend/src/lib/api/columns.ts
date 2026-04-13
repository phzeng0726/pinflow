import type { Column } from '@/types'
import type { EditColumnForm, NewColumnForm } from '@/lib/schemas'
import { client } from './client'

export const createColumn = async (boardId: number, form: NewColumnForm) => {
  const res = await client.post<Column>(`/boards/${boardId}/columns`, {
    name: form.name,
  })
  return res.data
}

export const updateColumn = async (id: number, form: EditColumnForm) => {
  const res = await client.patch<Column>(`/columns/${id}`, {
    name: form.name,
    autoPin: form.autoPin,
  })
  return res.data
}

export const moveColumn = async (id: number, position: number) => {
  const res = await client.patch<Column>(`/columns/${id}`, {
    position,
  })
  return res.data
}

export const deleteColumn = async (id: number) => {
  const res = await client.delete(`/columns/${id}`)
  return res.data
}
