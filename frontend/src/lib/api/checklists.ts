import type { Checklist, ChecklistItem } from '../../types'
import { client } from './client'

export const listChecklists = (cardId: number) =>
  client.get<Checklist[]>(`/cards/${cardId}/checklists`).then((r) => r.data)
export const createChecklist = (cardId: number, title: string) =>
  client
    .post<Checklist>(`/cards/${cardId}/checklists`, { title })
    .then((r) => r.data)
export const deleteChecklist = (id: number) =>
  client.delete(`/checklists/${id}`)

export const createChecklistItem = (checklistId: number, text: string) =>
  client
    .post<ChecklistItem>(`/checklists/${checklistId}/items`, { text })
    .then((r) => r.data)
export const updateChecklistItem = (
  id: number,
  data: { text?: string; completed?: boolean; position?: number },
) =>
  client
    .patch<ChecklistItem>(`/checklist-items/${id}`, data)
    .then((r) => r.data)
export const deleteChecklistItem = (id: number) =>
  client.delete(`/checklist-items/${id}`)
