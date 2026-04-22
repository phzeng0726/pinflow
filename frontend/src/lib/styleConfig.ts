// ── Dependency Relations ──────────────────────────────────────────────────────

import type { CardUrgency } from '@/lib/dates'
import type { Dependency, DependencyType } from '@/types'

export type DependencyRelationKey =
  | 'blocks'
  | 'is_blocked_by'
  | 'is_parent_to'
  | 'is_child_to'
  | 'duplicates'
  | 'is_related_to'

export interface DependencyRelationConfig {
  key: DependencyRelationKey
  label: string
  description: string
  canonicalType: DependencyType
  flip: boolean // if true, fromCard=target, toCard=thisCard
}

export const DEPENDENCY_RELATIONS: DependencyRelationConfig[] = [
  {
    key: 'blocks',
    label: 'Blocks',
    description: 'Must be resolved before the other',
    canonicalType: 'blocks',
    flip: false,
  },
  {
    key: 'is_blocked_by',
    label: 'Is blocked by',
    description: 'Waiting on the other',
    canonicalType: 'blocks',
    flip: true,
  },
  {
    key: 'is_parent_to',
    label: 'Is parent to',
    description: 'Parent of the other',
    canonicalType: 'parent_of',
    flip: false,
  },
  {
    key: 'is_child_to',
    label: 'Is child to',
    description: 'A subtask of the other',
    canonicalType: 'parent_of',
    flip: true,
  },
  {
    key: 'duplicates',
    label: 'Duplicates',
    description: 'Same as the other',
    canonicalType: 'duplicates',
    flip: false,
  },
  {
    key: 'is_related_to',
    label: 'Is related to',
    description: 'Related to the other',
    canonicalType: 'related_to',
    flip: false,
  },
]

/** Given a dependency and the current card's ID, return the label and "other" card ref */
export function resolveDependencyView(
  dep: Dependency,
  thisCardId: number,
): { label: string; otherCardId: number; otherCardTitle: string } {
  const isFrom = dep.fromCard.id === thisCardId

  const labelMap: Record<DependencyType, { asFrom: string; asTo: string }> = {
    blocks: { asFrom: 'Blocks', asTo: 'Is blocked by' },
    parent_of: { asFrom: 'Is parent to', asTo: 'Is child to' },
    duplicates: { asFrom: 'Duplicates', asTo: 'Is duplicated by' },
    related_to: { asFrom: 'Is related to', asTo: 'Is related to' },
  }

  const entry = labelMap[dep.type]
  const label = isFrom ? entry.asFrom : entry.asTo
  const other = isFrom ? dep.toCard : dep.fromCard

  return { label, otherCardId: other.id, otherCardTitle: other.title }
}

// ── Tag Colors ────────────────────────────────────────────────────────────────

export const TAG_COLORS: { key: string; bg: string; ring: string }[] = [
  { key: '', bg: 'bg-gray-200 dark:bg-gray-600', ring: 'ring-gray-400' },
  { key: 'red', bg: 'bg-red-500', ring: 'ring-red-500' },
  { key: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { key: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { key: 'yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-500' },
  { key: 'lime', bg: 'bg-lime-500', ring: 'ring-lime-500' },
  { key: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
  { key: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { key: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { key: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { key: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { key: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { key: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
]

export function getTagColorClasses(colorKey: string) {
  return TAG_COLORS.find((c) => c.key === colorKey) ?? TAG_COLORS[0]
}

// ── Priority Config ───────────────────────────────────────────────────────────

export const PRIORITIES: {
  value: number
  label: string
  activeClass: string
  textClass: string
}[] = [
  {
    value: 1,
    label: 'Highest',
    activeClass:
      'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600',
    textClass: 'text-red-500',
  },
  {
    value: 2,
    label: 'Critical',
    activeClass:
      'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600',
    textClass: 'text-orange-500',
  },
  {
    value: 3,
    label: 'High',
    activeClass:
      'bg-yellow-400 text-white hover:bg-yellow-500 dark:bg-yellow-400 dark:hover:bg-yellow-500',
    textClass: 'text-yellow-500',
  },
  {
    value: 4,
    label: 'Medium',
    activeClass:
      'bg-green-500 text-white hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600',
    textClass: 'text-green-500',
  },
  {
    value: 5,
    label: 'Low',
    activeClass:
      'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600',
    textClass: 'text-blue-500',
  },
]

export function getPriorityConfig(priority: number | null | undefined) {
  return PRIORITIES.find((p) => p.value === priority) ?? null
}

// ── Column Colors ─────────────────────────────────────────────────────────────

export const COLUMN_COLORS: { bg: string; border: string }[] = [
  { bg: 'bg-red-500', border: 'border-red-400' },
  { bg: 'bg-orange-500', border: 'border-orange-400' },
  { bg: 'bg-blue-500', border: 'border-blue-400' },
  { bg: 'bg-green-500', border: 'border-green-400' },
  { bg: 'bg-blue-500', border: 'border-blue-400' },
  { bg: 'bg-purple-500', border: 'border-purple-400' },
]

export function getColumnColor(columnId: number) {
  return COLUMN_COLORS[columnId % COLUMN_COLORS.length]
}

// ── Story Points ──────────────────────────────────────────────────────────────

export const STORY_POINTS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

// ── Graph: Dependency Edge Styles ─────────────────────────────────────────────

export interface DependencyEdgeStyle {
  stroke: string
  strokeDasharray?: string
  /** React Flow markerEnd reference, defined only for directed edges */
  markerEnd?: string
}

export const DEPENDENCY_EDGE_STYLES: Record<
  DependencyType,
  DependencyEdgeStyle
> = {
  blocks: { stroke: '#ef4444', markerEnd: 'url(#arrow-blocks)' },
  parent_of: { stroke: '#3b82f6', markerEnd: 'url(#arrow-parent)' },
  related_to: { stroke: '#22c55e', strokeDasharray: '12 6' },
  duplicates: { stroke: '#9ca3af', strokeDasharray: '4 4' },
}

export function getDependencyEdgeStyle(
  type: DependencyType,
): DependencyEdgeStyle {
  return DEPENDENCY_EDGE_STYLES[type]
}

// ── Graph: Urgency Visual Config ──────────────────────────────────────────────

/** Hex fill colors for urgency states — for SVG / inline styles (MiniMap, Legend). */
export const URGENCY_HEX_COLORS: Record<
  NonNullable<CardUrgency> | 'none',
  string
> = {
  overdue: '#ef4444',
  'due-soon': '#f59e0b',
  'due-in-progress': '#3b82f6',
  none: '#d1d5db',
}

/** Tailwind border classes for graph card node urgency states. */
export function getUrgencyBorderClass(urgency: CardUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.4)]'
    case 'due-soon':
      return 'border-amber-500'
    case 'due-in-progress':
      return 'border-blue-500'
    default:
      return 'border-gray-200 dark:border-gray-600'
  }
}
