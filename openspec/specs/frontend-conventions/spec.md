### Requirement: Mutation Hook 內部命名慣例
同一個 mutation hook 內部使用簡化動詞（`create`、`update`、`remove`、`move`、`toggle`、`duplicate`）命名 mutation 變數，return 時加上 domain 前綴組成語意化名稱。

#### Scenario: useBoardMutations 命名
- **WHEN** 定義 `useBoardMutations` hook
- **THEN** 內部變數為 `create`、`update`、`remove`；回傳為 `{ createBoard: create, updateBoard: update, deleteBoard: remove }`

#### Scenario: useCardMutations 命名
- **WHEN** 定義 `useCardMutations` hook
- **THEN** 內部變數為 `create`、`move`、`togglePin`、`update`、`remove`、`duplicate`、`togglePinFromPin`；回傳名稱加上 card domain 前綴

#### Scenario: useChecklistMutations 命名
- **WHEN** 定義 `useChecklistMutations` hook
- **THEN** 內部變數使用簡化動詞；回傳名稱加上 checklist/checklistItem domain 前綴

---

### Requirement: Mutation 非同步 Promise 處理
所有 mutation hook 的 `onSuccess`、`onError`、`onSettled` 中，若呼叫 `Promise.all` 或 invalidation 函式，必須使用 `async/await`。

#### Scenario: Promise.all 必須 await
- **WHEN** `onSuccess` 內部使用 `Promise.all([invalidateX(), invalidateY()])`
- **THEN** callback 必須宣告為 `async`，且 `Promise.all` 前加上 `await`

#### Scenario: onSettled 必須 await
- **WHEN** `onSettled` 內部呼叫 invalidation 函式
- **THEN** callback 必須宣告為 `async`，且 invalidation 呼叫前加上 `await`

---

### Requirement: Mutation Toast 通知完整性
每個 mutation 必須在 `onSuccess` 提供成功 toast，在 `onError` 提供失敗 toast。Toast 訊息一律使用繁體中文並透過 `sonner` 呼叫。

#### Scenario: Board mutations toast
- **WHEN** 任何 board mutation 成功或失敗
- **THEN** 顯示對應的繁體中文 `toast.success` 或 `toast.error`

---

### Requirement: Zustand Store 存取使用 Selector
存取 Zustand store 的值時，一律使用 selector 函式，禁止解構整個 store。

#### Scenario: useThemeStore selector
- **WHEN** 元件需要 `theme` 或 `toggle`
- **THEN** 使用 `useThemeStore(s => s.theme)` 和 `useThemeStore(s => s.toggle)` 分別取值，而非 `const { theme, toggle } = useThemeStore()`
