import type { Dependency, DependencyType } from '@/types'
import { client } from './client'

export const listDependencies = async (cardId: number) => {
  const res = await client.get<Dependency[]>(`/cards/${cardId}/dependencies`)
  return res.data
}

export const createDependency = async (
  cardId: number,
  toCardId: number,
  type: DependencyType,
) => {
  const res = await client.post<Dependency>(`/cards/${cardId}/dependencies`, {
    toCardId,
    type,
  })
  return res.data
}

export const deleteDependency = async (dependencyId: number) => {
  await client.delete(`/dependencies/${dependencyId}`)
}

export const listBoardDependencies = async (boardId: number) => {
  const res = await client.get<Dependency[]>(`/boards/${boardId}/dependencies`)
  return res.data
}
