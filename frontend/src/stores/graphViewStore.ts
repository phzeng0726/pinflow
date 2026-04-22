import { create } from 'zustand'
import type { DependencyType } from '@/types'

export type LayoutMode = 'hierarchy' | 'cluster'

export interface GraphFilters {
  relationTypes: DependencyType[]
  columnIds: number[]
  dateFrom: string | null
  dateTo: string | null
  tagIds: number[]
}

interface GraphViewState {
  layoutMode: LayoutMode
  searchQuery: string
  focusedCardId: number | null
  sidebarOpen: boolean
  filters: GraphFilters
  setLayoutMode: (mode: LayoutMode) => void
  setSearchQuery: (query: string) => void
  setFocusedCardId: (id: number | null) => void
  setSidebarOpen: (open: boolean) => void
  setFilters: (filters: Partial<GraphFilters>) => void
  clearFilters: () => void
  reset: () => void
}

const defaultFilters: GraphFilters = {
  relationTypes: [],
  columnIds: [],
  dateFrom: null,
  dateTo: null,
  tagIds: [],
}

export const useGraphViewStore = create<GraphViewState>((set) => ({
  layoutMode: 'hierarchy',
  searchQuery: '',
  focusedCardId: null,
  sidebarOpen: true,
  filters: defaultFilters,

  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFocusedCardId: (id) => set({ focusedCardId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  clearFilters: () => set({ filters: defaultFilters }),
  reset: () =>
    set({
      layoutMode: 'hierarchy',
      searchQuery: '',
      focusedCardId: null,
      sidebarOpen: true,
      filters: defaultFilters,
    }),
}))
