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

export interface Card {
  id: number
  column_id: number
  title: string
  description: string
  position: number
  is_pinned: boolean
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
