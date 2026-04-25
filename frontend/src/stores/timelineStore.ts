import { create } from 'zustand'
import type { DependencyType } from '@/types'

export type TimelineZoom = 'day' | 'week' | 'month'
export type TimelineGroupBy = 'flat' | 'by-column'
export type TimelineDepMode = 'all' | 'hover' | 'off'

const ALL_DEP_TYPES: DependencyType[] = [
  'blocks',
  'parent_of',
  'duplicates',
  'related_to',
]

interface TimelineState {
  zoom: TimelineZoom
  groupBy: TimelineGroupBy
  depMode: TimelineDepMode
  depTypeFilter: DependencyType[]
  searchQuery: string
  hoveredCardId: number | null
  openedCardId: number | null
  filterPanelOpen: boolean
  setZoom: (zoom: TimelineZoom) => void
  setGroupBy: (groupBy: TimelineGroupBy) => void
  setDepMode: (depMode: TimelineDepMode) => void
  setDepTypeFilter: (filter: DependencyType[]) => void
  setSearchQuery: (query: string) => void
  setHoveredCardId: (id: number | null) => void
  setOpenedCardId: (id: number | null) => void
  setFilterPanelOpen: (open: boolean) => void
  reset: () => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  zoom: 'week',
  groupBy: 'by-column',
  depMode: 'all',
  depTypeFilter: ALL_DEP_TYPES,
  searchQuery: '',
  hoveredCardId: null,
  openedCardId: null,
  filterPanelOpen: false,
  setZoom: (zoom) => set({ zoom }),
  setGroupBy: (groupBy) => set({ groupBy }),
  setDepMode: (depMode) => set({ depMode }),
  setDepTypeFilter: (filter) => set({ depTypeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setHoveredCardId: (id) => set({ hoveredCardId: id }),
  setOpenedCardId: (id) => set({ openedCardId: id }),
  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
  reset: () =>
    set({
      zoom: 'week',
      groupBy: 'by-column',
      depMode: 'all',
      depTypeFilter: ALL_DEP_TYPES,
      searchQuery: '',
      hoveredCardId: null,
      openedCardId: null,
      filterPanelOpen: false,
    }),
}))
