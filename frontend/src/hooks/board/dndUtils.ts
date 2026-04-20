export const DND_TYPE = {
  CARD: 'card',
  COLUMN: 'column',
} as const

export const DND_PATTERN_TYPE = {
  CARD: 'card', // 卡片拖曳到卡片上
  COLUMN_DROP: 'col_drop', // 卡片拖曳到 column 空白區
  COLUMN_HANDLE: 'col_handle', // column 拖曳
} as const

const patterns = [
  { prefix: 'card-', type: DND_PATTERN_TYPE.CARD },
  { prefix: 'col-drop-', type: DND_PATTERN_TYPE.COLUMN_DROP },
  { prefix: 'col-', type: DND_PATTERN_TYPE.COLUMN_HANDLE },
] as const

export const parseDndId = (id: string | number) => {
  const s = String(id)

  for (const { prefix, type } of patterns) {
    if (s.startsWith(prefix)) {
      return {
        type,
        id: Number(s.slice(prefix.length)),
      }
    }
  }

  return { type: 'unknown', id: -1 }
}
