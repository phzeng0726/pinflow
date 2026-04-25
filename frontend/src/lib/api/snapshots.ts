import type { BoardSnapshot } from '@/types'
import { client } from './client'

export const listSnapshots = async (boardId: number) => {
  const res = await client.get<BoardSnapshot[]>(`/boards/${boardId}/snapshots`)
  return res.data
}

export const createSnapshot = async (boardId: number, name?: string) => {
  const res = await client.post<BoardSnapshot>(`/boards/${boardId}/snapshots`, { name: name ?? '' })
  return res.data
}

export const restoreSnapshot = async (boardId: number, snapshotId: number) => {
  await client.post(`/boards/${boardId}/snapshots/${snapshotId}/restore`)
}

export const deleteSnapshot = async (boardId: number, snapshotId: number) => {
  await client.delete(`/boards/${boardId}/snapshots/${snapshotId}`)
}
