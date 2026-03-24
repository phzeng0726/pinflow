import type { Checklist, ChecklistItem } from '../../types'
import { client } from './client'

export const listChecklists = async (cardId: number) => {
  const res = await client.get<Checklist[]>(`/cards/${cardId}/checklists`)
  return res.data
}

export const createChecklist = async (cardId: number, title: string) => {
  const res = await client.post<Checklist>(`/cards/${cardId}/checklists`, {
    title,
  })
  return res.data
}

export const updateChecklist = async (
  id: number,
  data: { title?: string; position?: number },
) => {
  const res = await client.patch<Checklist>(`/checklists/${id}`, data)
  return res.data
}

export const deleteChecklist = async (id: number) => {
  const res = await client.delete(`/checklists/${id}`)
  return res.data
}

export const createChecklistItem = async (
  checklistId: number,
  text: string,
) => {
  const res = await client.post<ChecklistItem>(
    `/checklists/${checklistId}/items`,
    {
      text,
    },
  )
  return res.data
}

export const updateChecklistItem = async (
  id: number,
  data: { text?: string; completed?: boolean; position?: number },
) => {
  const res = await client.patch<ChecklistItem>(`/checklist-items/${id}`, data)
  return res.data
}

export const deleteChecklistItem = async (id: number) => {
  const res = await client.delete(`/checklist-items/${id}`)
  return res.data
}
