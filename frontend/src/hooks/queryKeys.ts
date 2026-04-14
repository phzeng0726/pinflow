export const queryKeys = {
  boards: {
    all: () => ['boards'] as const,
    detail: (id: number) => ['boards', id] as const,
  },
  cards: {
    detail: (id: number) => ['card', id] as const,
    pinned: () => ['pinned'] as const,
    search: (query: string, limit: number) => ['cards', 'search', query, limit] as const,
  },
  dependencies: {
    byCard: (cardId: number) => ['dependencies', cardId] as const,
  },
  tags: {
    all: () => ['tags'] as const,
  },
  checklists: {
    byCard: (cardId: number) => ['checklists', cardId] as const,
  },
}
