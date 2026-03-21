---
name: code-review-fe
description: Review frontend code changes for quality, patterns, and potential issues. Defaults to reviewing git diff of recent changes unless a specific scope is provided.
license: MIT
metadata:
  author: pinflow
  version: "1.0"
---

審查前端程式碼變更，檢查正確性、品質與專案慣例的一致性。

---

## 輸入

使用者可能提供以下資訊（皆為選填）：

| 項目 | 說明 | 範例 |
|------|------|------|
| **審查範圍** | 指定要審查的檔案、目錄、commit 範圍或 PR | `src/hooks/board/`、`abc123..def456`、`#42` |
| **關注重點** | 希望特別注意的面向 | 「幫我看 hook 的寫法對不對」 |

若使用者未提供審查範圍，則自動偵測（見步驟 1）。

---

## 步驟

### 1. 決定審查範圍

若使用者未指定範圍，依序偵測最近的前端變更：

```bash
# 1. 優先檢查已暫存的變更
git diff --cached --name-only -- frontend/

# 2. 若無暫存，檢查未暫存的變更
git diff --name-only -- frontend/

# 3. 若無未提交的變更，與 main 分支比較
git diff main --name-only -- frontend/
```

使用第一個非空結果，並告知使用者選擇了哪個範圍。

若使用者提供了特定範圍（如檔案路徑、commit SHA 或 PR），則使用該範圍。

### 2. 讀取變更

針對範圍內每個變更的前端檔案：

1. 讀取完整 diff 以理解變更內容
2. 需要時讀取完整檔案內容以取得上下文
3. 若檔案被重新命名或搬移，記錄新舊路徑

跳過自動生成的檔案（`routeTree.gen.ts`、codegen 產生的 `*.d.ts` 等），除非看起來是手動編輯的。

### 3. 審查

依據以下兩份參考資料進行審查：

- **附錄 A — Coding Style 規範**：確認程式碼是否遵循專案慣例
- **附錄 B — 審查清單**：檢查正確性、模式、效能、安全性等面向

只回報實際存在的問題——不要對每個類別強行給出評論。

### 4. 撰寫審查報告

依「輸出格式」撰寫結果。

---

## 輸出格式

依以下結構組織審查結果：

### 摘要

一段話：這些變更做了什麼、整體印象（看起來不錯 / 有問題 / 需要討論）。

### 發現

依嚴重程度分組並使用表格呈現：

**嚴重** — 必須修正。Bug、資料遺失風險、安全性問題。

**警告** — 建議修正。可能導致問題或讓未來的開發者困惑。

**建議** — 錦上添花。非急迫但值得改善的部分。

每個發現需包含：
- 檔案與行號參考（`src/features/board/BoardPage.tsx:42`）
- 問題是什麼（具體描述）
- 為什麼重要
- 建議的修正方式（必要時附程式碼片段）

### 做得好的地方

簡短提及做得好的部分——強化良好模式，讓作者知道哪些做法值得持續。

---

## 附錄 A — Coding Style 規範

審查時，除了檢查正確性與潛在問題外，也要確認程式碼是否遵循以下專案慣例。

### React Query

#### 檔案結構

```
hooks/
  queryKeys.ts              ← 所有 query key 的唯一來源
  <domain>/
    queries/use<Domain>.ts  ← query hooks
    mutations/use<Domain>Mutations.ts ← mutation hooks
```

#### Query Keys

- 所有 key 集中在 `queryKeys` 物件（`hooks/queryKeys.ts`），依 domain 分群
- 每個 key 是**函式**，回傳 `as const` tuple
- 命名慣例：`all()` 列表、`detail(id)` 單筆、`byCard(cardId)` 依關聯

```ts
// OK
queryKey: queryKeys.boards.detail(id)

// NG — 不要寫字串字面值
queryKey: ['boards', id]
```

#### Query Hooks（`queries/`）

- 一個檔案可 export 多個相關 query hook
- API 呼叫使用 `import * as api from '../../../lib/api'`（詳見 API 層章節）
- queryKey 一律引用 `queryKeys`，禁止字串字面值
- 有條件才 fetch 時使用 `enabled` 守衛（如 `enabled: id > 0`）
- 需要輪詢時使用 `refetchInterval`

#### Mutation Hooks（`mutations/`）

- 同 domain 的 mutations 集中在一個 `use<Domain>Mutations()` hook
- hook 內部取得 `useQueryClient()`，縮寫為 `qc`
- 共用的 invalidation 抽成內部 helper，命名為 `invalidate<Domain><Scope>`

```ts
const invalidateBoardAll = () => qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
const invalidateBoardDetail = (id: number) => qc.invalidateQueries({ queryKey: queryKeys.boards.detail(id) })
```

- 多個快取需失效時，`onSuccess`/`onError` 使用 `async` + `await Promise.all([...])`

```ts
// OK
onSuccess: async (data) => {
  await Promise.all([
    invalidateBoardAll(),
    invalidateBoardDetail(data.id),
  ])
}

// NG — 缺少 await，invalidation 失敗不會被捕獲
onSuccess: (data) => {
  Promise.all([...])
}
```

- `onSuccess`：invalidate 快取 + toast 成功訊息
- `onError`：toast 錯誤訊息，必要時也 invalidate 以回復 UI
- toast 訊息使用繁體中文

#### Mutation 命名慣例

- hook 內部使用**簡化動詞**命名：`create`、`update`、`remove`
- return 時加上 **domain 前綴**，組成語意化名稱：`createBoard`、`updateBoard`、`deleteBoard`

```ts
// OK — 內部簡化，對外語意化
const create = useMutation({ ... })
const update = useMutation({ ... })
const remove = useMutation({ ... })

return { createBoard: create, updateBoard: update, deleteBoard: remove }

// NG — 內部就用完整名稱，冗長且重複
const createBoard = useMutation({ ... })
return { createBoard }
```

### API 層

#### 目錄結構

```
lib/api/
  client.ts       ← axios instance（baseURL、interceptors）
  boards.ts       ← Board 相關 endpoint
  cards.ts        ← Card 相關 endpoint
  columns.ts      ← Column 相關 endpoint
  tags.ts         ← Tag 相關 endpoint
  checklists.ts   ← Checklist 相關 endpoint
  index.ts        ← re-export 所有模組
```

#### Import 慣例

- 優先使用 namespace import：`import * as api from '../../../lib/api'`
- 少量函式時可用具名 import：`import { createTag, attachTag } from '../../../lib/api'`
- 禁止直接 import 子模組（如 `../lib/api/cards`），一律透過 `index.ts`

#### 新增 API 端點

新端點加在對應的 domain 檔案中（如 `cards.ts`），`index.ts` 會自動 re-export。

### 表單

#### 技術選型

- 表單一律使用 **react-hook-form** + **zod**（透過 `@hookform/resolvers/zod`）
- 不要使用原生 `onChange` + `useState` 手動管理表單狀態

#### Schema 管理

- 所有 zod schema 集中在 `lib/schemas.ts`
- 表單型別從 schema 推導：`type XxxForm = z.infer<typeof xxxSchema>`
- 驗證訊息使用繁體中文

```ts
// OK — schema 集中管理，型別自動推導
import { cardSchema } from '../../lib/schemas'
type CardForm = z.infer<typeof cardSchema>

const { register, handleSubmit, reset } = useForm<CardForm>({
  resolver: zodResolver(cardSchema),
})

// NG — schema 寫在元件內、手動定義型別
const schema = z.object({ title: z.string() })
interface CardForm { title: string }
```

#### 表單流程慣例

- 使用 `useForm` 的 `register` 綁定欄位
- 使用 `handleSubmit` 包裝 submit handler
- 提交成功後呼叫 `reset()` 清空表單

### UI 元件

#### 技術選型

- UI 元件一律優先使用 **shadcn/ui**（路徑 `components/ui/`）
- 樣式一律使用 **Tailwind CSS**（v3）
- 圖示使用 **lucide-react**

```ts
// OK — 使用 shadcn 元件
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

// NG — 自己刻 button 或用其他 UI 庫
<button className="bg-blue-500 text-white px-4 py-2 rounded">送出</button>
```

- 若 shadcn/ui 沒有對應元件，才可以用 Tailwind 自行實作
- 不要引入其他 UI 框架（如 MUI、Ant Design、Chakra）

#### className 條件式寫法

- 當 className 包含條件判斷時，一律使用 `cn()`（來自 `lib/utils.ts`）
- 禁止使用模板字串拼接 className

```tsx
// OK — 使用 cn() 組合條件 class
className={cn(
  "flex-1 overflow-y-auto px-2 pb-2 min-h-[60px] rounded-lg transition-colors",
  isOver && cards.length === 0 && 'bg-blue-50 dark:bg-blue-900/20',
)}

// NG — 用模板字串拼接，難以閱讀且容易產生多餘空格
className={`flex-1 overflow-y-auto px-2 pb-2 min-h-[60px] rounded-lg transition-colors ${
  isOver && cards.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
}`}
```

### Toast 通知

- 使用 **sonner**（`import { toast } from 'sonner'`）
- `<Toaster>` 已在 `routes/__root.tsx` 全域掛載，不要重複掛載
- 訊息文字一律使用**繁體中文**

```ts
// OK
toast.success('卡片已建立')
toast.error('建立卡片失敗')

// NG — 使用英文或其他 toast 庫
toast.success('Card created')
alert('建立失敗')
```

### Zustand Store 慣例

- Store 檔案放在 `stores/` 目錄
- 需要 localStorage 持久化時使用 `persist` middleware（如 `themeStore` → key `pinflow-theme`）
- 不需持久化則直接使用 `create`（如 `pinStore`）
- 存取 state 使用 **selector** 避免不必要的重渲染：`useThemeStore(s => s.theme)`
- 禁止解構整個 store（`const { theme } = useThemeStore()`），這會導致任何 state 變更都觸發重渲染
- 現有 stores：`themeStore.ts`（主題切換，persist）、`pinStore.ts`（pin 視窗狀態）

### TanStack Router

- 使用 **file-based routing**，路由檔案放在 `routes/` 目錄
- `routeTree.gen.ts` 由 Vite plugin（`TanStackRouterVite`）自動產生——**禁止手動編輯**
- 檔案命名慣例：
  - `__root.tsx` — root layout（`<Toaster>`、theme apply）
  - `index.tsx` — 首頁（`/`）
  - `boards.$boardId.tsx` — 動態路由（`/boards/:boardId`）
  - `pin.tsx` — pin 視窗頁面（`/pin`）
- 新增頁面只需在 `routes/` 建立對應檔案，plugin 自動更新 route tree

### TypeScript 型別

- 型別集中定義在 `types/index.ts`，對應後端 DTO
- 欄位使用 **snake_case**（如 `column_id`、`is_pinned`、`start_time`、`auto_pin`）
- 禁止在元件或 hook 內重新定義已存在的型別——一律從 `types/` 匯入
- 新增型別時在 `types/index.ts` 中加入 interface

### DnD 樂觀更新

- 所有 board-level DnD 邏輯集中在 `hooks/board/useBoardDnd.ts`
- Sensor 設定：`PointerSensor` + `activationConstraint: { distance: 5 }`（< 5px = click，≥ 5px = drag）
- 使用**同步樂觀快取更新**模式：先用 `qc.setQueryData` 更新快取，再呼叫 mutation
- 位置計算使用 `midPosition()`（`lib/utils.ts`）
- Mutation 失敗時透過 cache invalidation 回滾，不需手動還原舊資料

```ts
// 模式：同步快取更新 → mutation → 失敗時 invalidation 回滾
qc.setQueryData(queryKeys.boards.detail(boardId), (prev) => ({
  ...prev,
  columns: reorderedColumns,
}))
updateColumnMutate({ id, data: { position } })
```

---

## 附錄 B — 審查清單

依以下類別評估每個變更。只回報實際存在的問題。

### 正確性
- 邏輯錯誤、off-by-one、null/undefined 風險
- 系統邊界缺少錯誤處理（API 呼叫、使用者輸入）
- 非同步程式碼的競態條件
- TypeScript 型別問題（濫用 any、錯誤的泛型、缺少判別型別）
- 型別是否從 `types/` 匯入而非在元件內重新定義

### React 模式
- Hook 規則違反（條件式 hook、迴圈中的 hook）
- `useEffect`、`useMemo`、`useCallback` 的依賴陣列缺漏或錯誤
- 不必要的重新渲染（不穩定的參考、該 memo 卻沒 memo）
- 元件職責——一個元件是否承擔太多？
- Effect 中的清理（事件監聯器、訂閱、計時器）

### TanStack Query
- Query key 的正確性與一致性
- 樂觀更新邏輯（rollback 處理、快取失效）
- 缺少 `enabled` 守衛或 loading/error 狀態處理
- Mutation 副作用（`onSuccess`、`onError`、`onSettled`）
- Toast 訊息是否使用繁體中文且透過 `sonner` 呼叫

### 狀態管理
- Zustand store 誤用（訂閱過多狀態、缺少 selector）
- Zustand store 是否正確使用 `persist` middleware（需要持久化的資料）
- Props vs. state vs. 衍生資料——狀態存放位置是否正確？
- 不必要的狀態重複

### 樣式與 UI
- Tailwind class 衝突或冗餘
- 響應式 / 無障礙性問題
- 深色模式一致性（`dark:` variants）
- Z-index 層級問題

### DnD (@dnd-kit)
- Sensor 設定一致性
- sortable vs. draggable 的正確使用
- 樂觀位置更新與 rollback
- DnD 邏輯是否集中在 `useBoardDnd` hook 而非散落在元件中
- 拖放後是否先同步更新快取再呼叫 mutation

### 效能
- Bundle size 問題（大型 import、缺少 tree-shaking）
- 缺少 memoization 的昂貴運算
- 不必要的網路請求

### 路由與導航
- `routeTree.gen.ts` 是否被手動編輯（不應該）
- 新頁面是否在 `routes/` 目錄下建立了對應的 route 檔案
- Route 檔案命名是否遵循 TanStack Router 慣例

### 安全性
- 透過 `dangerouslySetInnerHTML` 或未跳脫的使用者輸入造成的 XSS
- 客戶端狀態或 log 中洩露敏感資料

---

## 護欄

- 直接且具體。「這個 effect 的依賴陣列缺少 `columnId`」而非「你可能要考慮檢查一下 deps」
- 對非顯而易見的建議說明*原因*
- 不要挑剔 `eslint`/`prettier` 應該處理的格式或風格問題
- 若不確定意圖，先詢問而非假設有錯
- 尊重專案現有模式——不要建議與 CLAUDE.md 慣例相矛盾的重寫
