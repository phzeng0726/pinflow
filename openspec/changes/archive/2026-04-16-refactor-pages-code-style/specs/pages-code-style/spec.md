## ADDED Requirements

### Requirement: Props 參數使用 props 物件接收
`pages/` 下的 component function 參數 SHALL 使用 `props: XxxProps` 形式，並在函式內以 `const { ... } = props` 解構，不得直接在參數列解構。

#### Scenario: Component 函式簽名
- **WHEN** 定義一個接受 props 的 component function
- **THEN** 函式簽名為 `function Foo(props: FooProps)` 而非 `function Foo({ bar }: FooProps)`

---

### Requirement: Inline event handler 提取為具名函式
JSX 中的 event handler SHALL 提取為 `const handleXxx = () => {}` 形式的具名函式，不得在 JSX 屬性中直接寫 arrow function（`.map()` 內依賴迭代變數者除外）。

#### Scenario: onClick 提取
- **WHEN** JSX 元素需要 onClick 事件處理
- **THEN** handler 定義為 `const handleXxx = () => { ... }`，JSX 使用 `onClick={handleXxx}`

---

### Requirement: 多行 if/return 使用大括弧
多行 `if` 或 `if/return` 語句 SHALL 使用大括弧包覆 block body。

#### Scenario: Early return guard
- **WHEN** component 有多行 loading/error guard return
- **THEN** 寫法為 `if (isLoading) { return (...) }` 而非 `if (isLoading) return (...)`

---

### Requirement: Mutation 呼叫使用 mutate + onSuccess
`pages/` 下呼叫 mutation SHALL 使用 `mutate()` 搭配 `onSuccess` callback，不得使用 `mutateAsync` + `await` + `try/catch`。錯誤 toast 由 mutation hook 的 `onError` 統一處理。

#### Scenario: 成功後更新 UI state
- **WHEN** mutation 成功後需要更新 UI state（如關閉 form、清空 input）
- **THEN** 邏輯放在 `mutate(payload, { onSuccess: () => { ... } })` 的 callback 中

---

### Requirement: 樣式常數集中於 styleConfig.ts
`board-detail/components/` 下的樣式常數（顏色列表、分類選項等）SHALL 定義於 `styleConfig.ts`，不得散落在各 component 檔案內。

#### Scenario: 新增顏色或選項常數
- **WHEN** 需要新增顏色陣列或選項常數供多個 component 使用
- **THEN** 定義於 `board-detail/components/styleConfig.ts` 並 import 使用
