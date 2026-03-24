import type { Board } from '../../types'
import type { NewOrEditBoardForm } from '../schemas'
import { client } from './client'

export const getBoards = async () => {
  const res = await client.get<Board[]>('/boards')
  return res.data
}

export const getBoard = async (id: number) => {
  const res = await client.get<Board>(`/boards/${id}`)
  return res.data
}

export const createBoard = async (form: NewOrEditBoardForm) => {
  const res = await client.post<Board>('/boards', form)
  return res.data
}

export const updateBoard = async (id: number, form: NewOrEditBoardForm) => {
  const res = await client.put<Board>(`/boards/${id}`, form)
  return res.data
}

export const deleteBoard = async (id: number) => {
  const res = await client.delete(`/boards/${id}`)
  return res.data
}
