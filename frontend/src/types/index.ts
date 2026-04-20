export interface Board {
  id: number
  name: string
  columns: Column[]
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

export type DependencyType =
  | 'blocks'
  | 'parent_of'
  | 'duplicates'
  | 'related_to'

export interface DependencyCardRef {
  id: number
  title: string
  boardId: number
  columnId: number
}

export interface Dependency {
  id: number
  fromCard: DependencyCardRef
  toCard: DependencyCardRef
  type: DependencyType
  createdAt: string
}

export interface CardSearchResult {
  id: number
  title: string
  boardId: number
  boardName: string
  columnId: number
  columnName: string
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
  dependencyCount: number
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  cardId: number
  text: string
  authorId: string
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
