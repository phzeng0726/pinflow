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
