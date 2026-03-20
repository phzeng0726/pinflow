---
name: refactor-fe
description: Use this skill when the user wants to refactor frontend hooks, split query and mutation hooks into separate files, reorganize hooks into queries/mutations subdirectories, or set up centralized query key management. Trigger phrases: "refactor hooks", "split hooks", "重構 hooks", "拆分 hooks".
version: 1.0.0
---

# refactor-fe

## 說明

協助使用者重構前端 `hooks/` 層，將原本「query + mutation 混在同一個 `use*.ts`」的結構，拆分成 `queries/` 與 `mutations/` 子目錄，並建立集中式 Query Key 管理。

---

## 重構動機

- 原架構：單一檔案混放 query 與 mutations，隨功能增長難以維護
- mutation hook 在建立時綁定參數（如 `cardId`），彈性低、無法跨 card 重用
- query key 字串分散各處，容易 typo 且難以批次 invalidate

---

## 目錄結構規範

```
hooks/
  queryKeys.ts              ← 所有 query key 的集中管理（尚未建立）
  tag/
    queries/
      useTags.ts            ← 只放 useQuery
    mutations/
      useTagMutations.ts    ← 所有 mutations 集中成一個 hook
  board/
    queries/
      useBoards.ts
    mutations/
      useBoardMutations.ts
  card/
    queries/
      useCards.ts
    mutations/
      useCardMutations.ts
  column/
    queries/
      useColumns.ts
    mutations/
      useColumnMutations.ts
  checklist/
    queries/
      useChecklists.ts
    mutations/
      useChecklistMutations.ts
```

**命名規範：**
- query hook：`use<Entity>` 或 `use<Entity>s`（例如 `useTags`、`useCards`）
- mutation hook：`use<Entity>Mutations`（例如 `useTagMutations`）
- mutation hook 回傳物件解構：`{ createTag, attachTag, detachTag }`
- 參數綁定改為在 `mutate()` 呼叫時傳入，而非在 hook 建立時綁定

---

## 範例：Tag Hooks 拆分（已完成，作為範本）

### 舊架構（`hooks/useTags.ts`，已刪除）

```ts
// 舊：query + mutations 混放，且 cardId 在 hook 建立時綁定
export function useTags() { /* useQuery */ }
export function useCreateTag() { /* useMutation */ }
export function useAttachTag(cardId: number) { /* useMutation — cardId 綁死 */ }
export function useDetachTag(cardId: number) { /* useMutation — cardId 綁死 */ }
```

### 新架構

**`hooks/tag/queries/useTags.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { getTags } from '@/lib/api'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  })
}
```

**`hooks/tag/mutations/useTagMutations.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTag, attachTag, detachTag } from '@/lib/api'

export function useTagMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })

  const attach = useMutation({
    // cardId 改為 mutate 時傳入，解除與特定 card 的耦合
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      attachTag(cardId, tagId),
    onSuccess: (_data, { cardId }) =>
      queryClient.invalidateQueries({ queryKey: ['card', cardId] }),
  })

  const detach = useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: number; tagId: number }) =>
      detachTag(cardId, tagId),
    onSuccess: (_data, { cardId }) =>
      queryClient.invalidateQueries({ queryKey: ['card', cardId] }),
  })

  return { createTag: create, attachTag: attach, detachTag: detach }
}
```

### 呼叫端（`CardDetailDialog.tsx`）

```ts
// 舊
const attachTag = useAttachTag(cardId)
attachTag.mutate(tagId)

// 新
const { attachTag } = useTagMutations()
attachTag.mutate({ cardId, tagId })
```

---

## Query Key 集中管理（尚未建立）

目前 `['tags']`、`['card', cardId]`、`['boards']` 等 key 字串分散在各 hook 中，需建立 `hooks/queryKeys.ts`：

```ts
// hooks/queryKeys.ts（設計草稿）
export const queryKeys = {
  boards: {
    all: () => ['boards'] as const,
    detail: (id: number) => ['boards', id] as const,
  },
  columns: {
    byBoard: (boardId: number) => ['columns', boardId] as const,
  },
  cards: {
    byColumn: (columnId: number) => ['cards', columnId] as const,
    detail: (id: number) => ['card', id] as const,
    pinned: () => ['cards', 'pinned'] as const,
  },
  tags: {
    all: () => ['tags'] as const,
  },
  checklists: {
    byCard: (cardId: number) => ['checklists', cardId] as const,
  },
}
```

建立後，所有 hook 改用 `queryKeys.tags.all()` 取代字串常數，invalidate 也更安全。

---

## 待重構 Hooks 清單

| Hook 檔案 | 狀態 |
|---|---|
| `hooks/tag/` | 已完成（作為範本）|
| `hooks/useBoards.ts` | 待拆分 → `hooks/board/` |
| `hooks/useColumns.ts` | 待拆分 → `hooks/column/` |
| `hooks/useCards.ts` | 待拆分 → `hooks/card/` |
| `hooks/useChecklists.ts` | 待拆分 → `hooks/checklist/` |
| `hooks/queryKeys.ts` | 尚未建立 |

---

## 執行指引

呼叫此 skill 時，請：

1. 確認要重構哪一個 hook 檔案
2. 讀取現有 hook 檔案，分析其中的 queries 與 mutations
3. 建立對應的 `hooks/<entity>/queries/use<Entity>s.ts`
4. 建立對應的 `hooks/<entity>/mutations/use<Entity>Mutations.ts`
5. 更新所有呼叫端（grep 找出所有 import 位置）
6. 刪除舊的 hook 檔案
7. 若 `queryKeys.ts` 尚未建立，提示使用者一併建立

完成後確認前端仍能正確編譯：`cd frontend && pnpm build`
