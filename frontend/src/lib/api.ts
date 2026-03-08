import axios from 'axios'
import type { Board, Card, Column, PinnedCard } from '../types'

// In Electron production mode, window.electronAPI is injected by preload.js.
// There's no Vite proxy, so we must use the absolute backend URL.
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window
const baseURL = isElectron ? 'http://localhost:34115/api/v1' : '/api/v1'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Boards
export const getBoards = () => api.get<Board[]>('/boards').then(r => r.data)
export const getBoard = (id: number) => api.get<Board>(`/boards/${id}`).then(r => r.data)
export const createBoard = (name: string) => api.post<Board>('/boards', { name }).then(r => r.data)
export const updateBoard = (id: number, name: string) => api.put<Board>(`/boards/${id}`, { name }).then(r => r.data)
export const deleteBoard = (id: number) => api.delete(`/boards/${id}`)

// Columns
export const createColumn = (boardId: number, name: string) =>
  api.post<Column>(`/boards/${boardId}/columns`, { name }).then(r => r.data)
export const updateColumn = (id: number, data: { name?: string; auto_pin?: boolean; position?: number }) =>
  api.patch<Column>(`/columns/${id}`, data).then(r => r.data)
export const deleteColumn = (id: number) => api.delete(`/columns/${id}`)

// Cards
export const createCard = (columnId: number, title: string, description: string) =>
  api.post<Card>(`/columns/${columnId}/cards`, { title, description }).then(r => r.data)
export const updateCard = (id: number, title: string, description: string) =>
  api.patch<Card>(`/cards/${id}`, { title, description }).then(r => r.data)
export const moveCard = (id: number, columnId: number, position: number) =>
  api.patch<Card>(`/cards/${id}/move`, { column_id: columnId, position }).then(r => r.data)
export const togglePin = (id: number) => api.patch<Card>(`/cards/${id}/pin`).then(r => r.data)
export const deleteCard = (id: number) => api.delete(`/cards/${id}`)
export const getPinnedCards = () => api.get<PinnedCard[]>('/cards/pinned').then(r => r.data)
