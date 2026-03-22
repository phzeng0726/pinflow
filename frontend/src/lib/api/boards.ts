import type { Board } from '../../types'
import { client } from './client'

export const getBoards = () =>
  client.get<Board[]>('/boards').then((r) => r.data)
export const getBoard = (id: number) =>
  client.get<Board>(`/boards/${id}`).then((r) => r.data)
export const createBoard = (name: string) =>
  client.post<Board>('/boards', { name }).then((r) => r.data)
export const updateBoard = (id: number, name: string) =>
  client.put<Board>(`/boards/${id}`, { name }).then((r) => r.data)
export const deleteBoard = (id: number) => client.delete(`/boards/${id}`)
