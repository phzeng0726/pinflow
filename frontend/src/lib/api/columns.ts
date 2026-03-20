import type { Column } from '../../types'
import { client } from './client'

export const createColumn = (boardId: number, name: string) =>
  client.post<Column>(`/boards/${boardId}/columns`, { name }).then(r => r.data)
export const updateColumn = (id: number, data: { name?: string; auto_pin?: boolean; position?: number }) =>
  client.patch<Column>(`/columns/${id}`, data).then(r => r.data)
export const deleteColumn = (id: number) => client.delete(`/columns/${id}`)
