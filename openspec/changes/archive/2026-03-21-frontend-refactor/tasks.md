## 1. 修正 useBoardMutations

- [x] 1.1 `update.onSuccess` 改為 `async`，`Promise.all` 加上 `await`
- [x] 1.2 `create` 加上 `onSuccess: toast.success('看板已建立')` 與 `onError: toast.error('建立看板失敗')`
- [x] 1.3 `update` 加上 `onSuccess: toast.success('看板已更新')` 與 `onError: toast.error('更新看板失敗')`
- [x] 1.4 `remove` 加上 `onSuccess: toast.success('看板已刪除')` 與 `onError: toast.error('刪除看板失敗')`
- [x] 1.5 引入 `toast` import（`import { toast } from 'sonner'`）

## 2. 修正 useColumnMutations

- [x] 2.1 `update.onSettled` 改為 `async`，`invalidate()` 加上 `await`

## 3. 修正 useCardMutations 命名慣例

- [x] 3.1 內部 mutation 變數重命名：`createCard` → `create`、`moveCard` → `move`、`togglePin` → `togglePin`（保留）、`updateCard` → `update`、`deleteCard` → `remove`、`duplicateCard` → `duplicate`、`togglePinFromPin` → `togglePinFromPin`（保留）
- [x] 3.2 return 語句更新：`{ createCard: create, moveCard: move, togglePin, updateCard: update, deleteCard: remove, duplicateCard: duplicate, togglePinFromPin }`

## 4. 修正 useChecklistMutations 命名慣例

- [x] 4.1 內部 mutation 變數重命名：`createChecklist` → `createChecklist` 改為使用簡化模式：`createList`、`deleteList`、`createItem`、`updateItem`、`deleteItem`
- [x] 4.2 return 語句更新：`{ createChecklist: createList, deleteChecklist: deleteList, createChecklistItem: createItem, updateChecklistItem: updateItem, deleteChecklistItem: deleteItem }`

## 5. 修正 BoardPage Zustand Selector

- [x] 5.1 將 `const { theme, toggle: toggleTheme } = useThemeStore()` 改為兩行 selector 寫法
