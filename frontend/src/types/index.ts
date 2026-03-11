export interface Board {
  id: number
  name: string
  columns?: Column[]
  created_at: string
  updated_at: string
}

export interface Column {
  id: number
  board_id: number
  name: string
  position: number
  auto_pin: boolean
  cards?: Card[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
}

export interface ChecklistItem {
  id: number
  checklist_id: number
  text: string
  completed: boolean
  position: number
}

export interface Checklist {
  id: number
  card_id: number
  title: string
  items: ChecklistItem[]
  completed_count: number
  total_count: number
}

export interface Card {
  id: number
  column_id: number
  title: string
  description: string
  position: number
  is_pinned: boolean
  start_time: string | null
  end_time: string | null
  tags: Tag[]
  checklists: Checklist[]
  created_at: string
  updated_at: string
}

export interface PinnedCard {
  id: number
  title: string
  description: string
  column_id: number
  column_name: string
}
