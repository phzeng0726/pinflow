export const queryKeys = {
  boards: {
    all: () => ['boards'] as const,
    detail: (id: number) => ['boards', id] as const,
  },
  cards: {
    detail: (id: number) => ['card', id] as const,
    pinned: () => ['pinned'] as const,
    search: (query: string, limit: number, boardId?: number) =>
      ['cards', 'search', query, limit, boardId] as const,
  },
  dependencies: {
    byCard: (cardId: number) => ['dependencies', cardId] as const,
    byBoard: (boardId: number) => ['dependencies', 'board', boardId] as const,
  },
  tags: {
    all: () => ['tags'] as const,
    byBoard: (boardId: number) => ['tags', 'board', boardId] as const,
  },
  checklists: {
    byCard: (cardId: number) => ['checklists', cardId] as const,
  },
  settings: {
    all: () => ['settings'] as const,
  },
  snapshots: {
    byBoard: (boardId: number) => ['snapshots', 'board', boardId] as const,
  },
}
