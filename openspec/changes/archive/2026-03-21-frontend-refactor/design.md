## Context

前端程式碼整體架構已符合規範（API 層分拆、queryKeys 集中管理、hooks 分 queries/mutations 目錄），但在以下細節存在偏差：

1. `useBoardMutations` — `update.onSuccess` 的 `Promise.all` 缺少 `await`，且三個 mutations 皆無 toast 通知
2. `useCardMutations` — 內部 mutation 變數直接用完整名稱（`createCard`、`moveCard`），違反「內部簡化動詞」慣例
3. `useChecklistMutations` — 同上問題
4. `useColumnMutations` — `update.onSettled` 呼叫 `invalidate()` 缺少 `await`
5. `BoardPage` — `useThemeStore()` 以解構方式取值，未用 selector，造成任何 store 狀態變更都觸發重渲染

## Goals / Non-Goals

**Goals:**
- 所有 mutation hooks 的非同步呼叫加上正確的 `async/await`
- 所有 mutation hooks 補上繁體中文 toast（`onSuccess` + `onError`）
- `useBoardMutations`、`useCardMutations`、`useChecklistMutations` 的內部命名改為簡化動詞
- `BoardPage` 的 Zustand 取值改為 selector 寫法

**Non-Goals:**
- 不修改 API 層結構（已符合規範）
- 不修改 queryKeys（已符合規範）
- 不修改 DnD 邏輯（已符合規範）
- 不修改其他元件（BoardListPage、CardDetailDialog 等）

## Decisions

### D1: Mutation 內部命名改用簡化動詞
每個 mutation hook 內部一律使用 `create`、`update`、`remove`、`move`、`toggle`、`duplicate` 等簡化動詞，`return` 時加上 domain 前綴組成語意化名稱。

`useCardMutations` 有 `togglePin` 和 `togglePinFromPin` 兩個功能相似的 mutation，內部命名分別為 `togglePin` 和 `togglePinFromPin`（功能確實不同，後者 invalidate 所有 boards），return 時保持現有對外名稱。

### D2: Promise.all await 修正
`useBoardMutations.update.onSuccess` 改為 `async (data) => { await Promise.all([...]) }`。
`useColumnMutations.update.onSettled` 改為 `async () => { await invalidate() }`。

### D3: useBoardMutations 補充 toast
- `create.onSuccess` → `toast.success('看板已建立')`
- `create.onError` → `toast.error('建立看板失敗')`
- `update.onSuccess` → `toast.success('看板已更新')`
- `update.onError` → `toast.error('更新看板失敗')`
- `remove.onSuccess` → `toast.success('看板已刪除')`
- `remove.onError` → `toast.error('刪除看板失敗')`

### D4: BoardPage Zustand selector
```ts
// Before
const { theme, toggle: toggleTheme } = useThemeStore()

// After
const theme = useThemeStore(s => s.theme)
const toggleTheme = useThemeStore(s => s.toggle)
```

## Risks / Trade-offs

- toast 訊息新增後，現有整合測試若有 mock toast 的設定需同步更新（目前無相關測試，風險低）
- `useCardMutations` 內部重命名後，若有其他檔案直接引用內部實作（不應該有），需一併更新
