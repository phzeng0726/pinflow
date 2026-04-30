import type { PinnedCard } from '@/types'
import { arrayMove } from '@dnd-kit/sortable'
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'

const STORAGE_KEY = 'pinflow:pinOrder'

function readPinOrder(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function writePinOrder(order: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
}

function sortByOrder(cards: PinnedCard[], order: number[]): PinnedCard[] {
  const orderMap = new Map(order.map((id, i) => [id, i]))
  const known = cards
    .filter((c) => orderMap.has(c.id))
    .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!)
  const unknown = cards.filter((c) => !orderMap.has(c.id))
  return [...known, ...unknown]
}

interface UsePinDndParams {
  cards: PinnedCard[]
}

export function usePinDnd({ cards }: UsePinDndParams) {
  const [pinOrder, setPinOrder] = useState<number[]>(readPinOrder)
  const [activeCard, setActiveCard] = useState<PinnedCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const sortedCards = sortByOrder(cards, pinOrder)

  const handleDragStart = (e: DragStartEvent) => {
    const id = Number(e.active.id)
    setActiveCard(cards.find((c) => c.id === id) ?? null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveCard(null)

    if (!over || active.id === over.id) return

    const activeId = Number(active.id)
    const overId = Number(over.id)
    const activeIndex = sortedCards.findIndex((c) => c.id === activeId)
    const overIndex = sortedCards.findIndex((c) => c.id === overId)

    if (activeIndex === -1 || overIndex === -1) return

    const newOrder = arrayMove(sortedCards, activeIndex, overIndex).map((c) => c.id)
    setPinOrder(newOrder)
    writePinOrder(newOrder)
  }

  const handleDragCancel = () => {
    setActiveCard(null)
  }

  return {
    sensors,
    sortedCards,
    activeCard,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
