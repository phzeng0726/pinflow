export interface Board {
  id: number
  name: string
  columns?: Column[]
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: number
  boardId: number
  name: string
  position: number
  autoPin: boolean
  cards?: Card[]
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface ChecklistItem {
  id: number
  checklistId: number
  text: string
  completed: boolean
  position: number
}

export interface Checklist {
  id: number
  cardId: number
  title: string
  position: number
  items: ChecklistItem[]
  completedCount?: number
  totalCount?: number
}

export interface Card {
  id: number
  columnId: number
  title: string
  description: string
  position: number
  isPinned: boolean
  storyPoint: number | null
  priority: number | null
  startTime: string | null
  endTime: string | null
  tags: Tag[]
  checklists: Checklist[]
  createdAt: string
  updatedAt: string
}

export interface DuplicateCardRequest {
  title: string
  targetColumnId: number
  position: number
  copyTags: boolean
  copyChecklists: boolean
  copySchedule: boolean
  pin: boolean
}

export interface PinnedCard {
  id: number
  title: string
  description: string
  columnId: number
  columnName: string
}
