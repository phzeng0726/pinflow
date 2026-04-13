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

---

### Requirement: 前端資料夾結構遵循 Pages + 領域分類
前端 `src/` 下的元件 SHALL 按以下結構組織：
- `pages/<page>/` — 路由級頁面元件
- `pages/<page>/components/<domain>/` — 該頁面的領域子元件
- `components/ui/` — shadcn/ui 共用 primitive 元件

頁面分類規則：被 `routes/*.tsx` 直接 import 的元件為頁面元件，放在 `pages/<page>/` 根層。其餘元件按領域（cards、columns、tags、checklists）放在 `pages/<page>/components/<domain>/`。

#### Scenario: board-list 頁面結構
- **WHEN** 開發者查看 `src/pages/board-list/`
- **THEN** 該資料夾 SHALL 僅包含 `BoardListPage.tsx`

#### Scenario: board-detail 頁面結構
- **WHEN** 開發者查看 `src/pages/board-detail/`
- **THEN** 該資料夾 SHALL 包含 `BoardPage.tsx` 和 `components/` 子資料夾
- **THEN** `components/` SHALL 包含 `cards/`、`columns/`、`tags/`、`checklists/` 領域子資料夾

#### Scenario: cards 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/cards/`
- **THEN** SHALL 包含 CardItem、CardContextMenu、CardDetailDialog、DuplicateCardDialog、AddCardForm、ScheduleSection、StoryPointSelector

#### Scenario: columns 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/columns/`
- **THEN** SHALL 包含 ColumnView、ColumnHeader、AddColumnForm

#### Scenario: tags 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/tags/`
- **THEN** SHALL 包含 TagSection、ColorPicker

#### Scenario: checklists 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/checklists/`
- **THEN** SHALL 包含 ChecklistBlock、ChecklistSection

#### Scenario: pin 頁面結構
- **WHEN** 開發者查看 `src/pages/pin/`
- **THEN** SHALL 包含 `PinWindow.tsx` 和 `components/` 子資料夾
- **THEN** `components/` SHALL 包含 PinnedCardItem、PinOverlay

---

### Requirement: Import 路徑統一使用 @ Alias
所有前端 TypeScript/TSX 檔案的跨目錄 import SHALL 使用 `@/` alias（對應 `src/`）。同目錄內的 import MAY 使用 `./` 相對路徑。MUST NOT 使用 `../` 相對路徑進行跨目錄引用。

#### Scenario: 跨目錄引用 UI 元件
- **WHEN** 任何元件 import `components/ui/` 下的元件
- **THEN** MUST 使用 `@/components/ui/<name>` 格式

#### Scenario: 跨目錄引用 hooks
- **WHEN** 任何檔案 import `hooks/` 下的 hook
- **THEN** MUST 使用 `@/hooks/<path>` 格式

#### Scenario: 跨目錄引用 lib
- **WHEN** 任何檔案 import `lib/` 下的模組
- **THEN** MUST 使用 `@/lib/<path>` 格式

#### Scenario: 同目錄引用
- **WHEN** 同一資料夾內的檔案互相引用
- **THEN** MAY 使用 `./` 相對路徑（如 `lib/api/` 內的 `./client`）

#### Scenario: 禁止跨目錄相對路徑
- **WHEN** 開發者撰寫跨目錄 import
- **THEN** MUST NOT 使用 `../` 開頭的相對路徑

---

### Requirement: features 資料夾不再存在
重構完成後 `src/features/` 資料夾 SHALL 被完全刪除，所有元件 SHALL 遷移至 `src/pages/` 結構。

#### Scenario: features 資料夾已移除
- **WHEN** 開發者查看 `src/` 根層
- **THEN** SHALL NOT 存在 `features/` 資料夾
