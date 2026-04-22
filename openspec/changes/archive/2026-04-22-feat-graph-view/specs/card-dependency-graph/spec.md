## ADDED Requirements

### Requirement: Board/Graph view toggle
看板 Header 右側（LocaleToggle 前）SHALL 顯示 Board / Graph segmented control。進入看板時預設為 Board 模式；切換至 Graph 後，主區域改為渲染 GraphView 元件；再次切換回 Board 恢復原有 DnD 欄位視圖。

#### Scenario: Default state on board entry
- **WHEN** 使用者進入 `/boards/:boardId`
- **THEN** 切換控制顯示 Board 為 active 狀態，主區域顯示 DnD 欄位視圖

#### Scenario: Switch to graph mode
- **WHEN** 使用者點擊 Graph 切換鈕
- **THEN** 主區域切換為 GraphView，Board 切換鈕恢復非 active，Graph 切換鈕變為 active

#### Scenario: Switch back to board mode
- **WHEN** 使用者在 Graph 模式點擊 Board 切換鈕
- **THEN** 主區域恢復 DnD 欄位視圖，Graph 狀態（搜尋、篩選、聚焦）不保留

---

### Requirement: Batch board dependencies API
系統 SHALL 提供 `GET /api/v1/boards/:id/dependencies` 端點，一次回傳該看板所有卡片的完整依賴清單，格式為 `DependencyResponse[]`，每筆包含 fromCard 和 toCard 的 id、title、boardId、columnId。

#### Scenario: Board with dependencies
- **WHEN** 呼叫 `GET /api/v1/boards/:id/dependencies`（board 含有依賴關係）
- **THEN** 回傳 HTTP 200，body 為所有屬於該 board 卡片之依賴的陣列（含 fromCard/toCard 完整資訊）

#### Scenario: Board with no dependencies
- **WHEN** 呼叫 `GET /api/v1/boards/:id/dependencies`（board 無任何依賴）
- **THEN** 回傳 HTTP 200，body 為空陣列 `[]`

#### Scenario: Non-existent board
- **WHEN** 呼叫 `GET /api/v1/boards/:id/dependencies`（board id 不存在）
- **THEN** 回傳 HTTP 404

---

### Requirement: Graph node rendering
Graph View 中每張卡片 SHALL 渲染為 220px 寬的節點，由上而下包含：
1. Tags 長條色塊（`h-[5px] w-6`，最多 5 個，選填，置於標題上方）
2. 標題（最多 2 行截斷，必填）
3. Meta row：日期（`M/d – M/d` 格式）、priority（`Px` 文字 + Flag icon）、story points（Flame icon 前綴）— 均選填，無值時不顯示
4. 底部資訊列：欄位名稱（左，灰色文字）＋ 卡片編號（`#id`，右，灰色文字）

#### Scenario: Full card data
- **WHEN** 卡片有 title、columnId、storyPoint、priority、startTime、endTime、tags
- **THEN** 節點依序顯示 tag 色條、標題、meta row（日期、priority、SP）、底部欄位名稱＋#id

#### Scenario: Minimal card data
- **WHEN** 卡片只有 title 和 columnId
- **THEN** 節點只顯示標題和底部欄位名稱，tag 列和 meta row 不顯示

---

### Requirement: Card due-status border warnings
Graph View 卡片節點 SHALL 依到期狀態顯示彩色邊框，優先順序：overdue > soon > inprog。

- **Overdue**：`endTime` 已過期 → 紅色邊框 + 紅色 glow
- **Due soon**：`endTime` 在 5 天內（含）→ 橘色邊框
- **In progress**：`startTime` 存在且已到達，且未 overdue、非 due soon → 藍色邊框
- 無日期：無特殊邊框

#### Scenario: Overdue card
- **WHEN** 卡片 `endTime` 早於當前時間
- **THEN** 節點渲染紅色邊框加 glow 效果（`border-red-500` + red glow shadow）

#### Scenario: Due within 5 days
- **WHEN** 卡片 `endTime` 距今 ≤ 5 天且尚未逾期
- **THEN** 節點渲染橘色邊框（`border-amber-500`）

#### Scenario: In-progress card
- **WHEN** 卡片 `startTime` ≤ 今天，且 `endTime` 不存在或距今 > 5 天
- **THEN** 節點渲染藍色邊框（`border-blue-500`）

---

### Requirement: Dependency edge styles
Graph View 中不同類型的依賴 SHALL 以不同線條樣式呈現：
- `blocks`：紅色實線，帶箭頭（`stroke: #ef4444`）
- `parent_of`：藍色實線，帶箭頭（`stroke: #3b82f6`）
- `related_to`：綠色長虛線，無箭頭（`stroke: #22c55e`，`strokeDasharray: "12 6"`）
- `duplicates`：灰色短虛線，無箭頭（`stroke: #9ca3af`，`strokeDasharray: "4 4"`）

#### Scenario: Blocks edge
- **WHEN** 兩張卡片間有 `blocks` 類型依賴
- **THEN** 渲染紅色實線箭頭，從 fromCard 指向 toCard

#### Scenario: Related edge
- **WHEN** 兩張卡片間有 `related_to` 類型依賴
- **THEN** 渲染綠色長虛線，無方向箭頭

---

### Requirement: Node focus/highlight mode
點擊節點 SHALL 啟動聚焦模式：被點擊的卡片和所有直接關聯的卡片高亮，其餘節點淡化（`opacity: 0.18`，`filter: saturate(0.5)`）。**邊的淡化規則：兩端點皆在高亮集合內的邊保持原色；任一端點在高亮集合外的邊一律淡化（`opacity: 0.12`）。** 同時顯示 Focus Banner 於工具列下方，Banner 含卡片標題和「Exit Focus」按鈕。

#### Scenario: Click to focus
- **WHEN** 使用者點擊某個卡片節點
- **THEN** 該節點及其直接關聯節點（任意邊相連）高亮；其餘節點淡化；非鄰居間的邊也淡化；Focus Banner 顯示

#### Scenario: Edge between neighbor and non-neighbor
- **WHEN** 聚焦模式中，某條邊的一端為直連鄰居（如 B），另一端為非鄰居（如 C）
- **THEN** 該邊（B↔C）淡化，即使 B 本身高亮

#### Scenario: Exit focus
- **WHEN** 使用者點擊 Focus Banner 的「Exit Focus」按鈕，或點擊空白畫布
- **THEN** 所有節點與邊恢復正常顯示；Focus Banner 消失

---

### Requirement: Title search
Graph View 工具列 SHALL 提供即時標題搜尋輸入框。輸入文字時，標題不符的卡片節點即時淡化；**邊的淡化規則：兩端節點皆符合搜尋的邊保持原色；任一端不符的邊一律淡化（`opacity: 0.12`）。** 清除輸入後全部恢復。

#### Scenario: Search matches subset
- **WHEN** 使用者輸入搜尋文字（debounce 300ms）
- **THEN** 標題包含該文字的節點正常顯示；不符的節點淡化；兩端皆不符的邊也淡化

#### Scenario: Edge between matched and unmatched node
- **WHEN** 搜尋進行中，某條邊連接一個符合節點（A）和一個不符節點（B）
- **THEN** 該邊淡化，即使 A 本身正常顯示

#### Scenario: Empty search
- **WHEN** 搜尋框為空
- **THEN** 所有節點與邊顯示為正常狀態

---

### Requirement: Graph filtering
工具列篩選面板 SHALL 支援：
1. **Relation types**：多選，篩選顯示的邊線類型（`blocks`、`parent_of`、`related_to`、`duplicates`）
2. **Columns**：多選，只顯示選定欄位的卡片
3. **Date range**：開始/結束日期，只顯示 `startTime` 或 `endTime` 在範圍內的卡片
4. **Tags**：多選，只顯示含選定 tag 的卡片

篩選生效時，不符條件的節點和邊從 graph 移除（非淡化）。

#### Scenario: Filter by relation type
- **WHEN** 使用者只勾選 `blocks` relation type
- **THEN** 只有 `blocks` 類型的邊顯示；`parent_of`、`related_to`、`duplicates` 邊隱藏

#### Scenario: Clear filters
- **WHEN** 使用者點擊「Clear Filters」
- **THEN** 所有篩選條件重置，graph 恢復完整顯示

---

### Requirement: Layout modes
Graph View SHALL 支援兩種佈局模式，可透過工具列切換：
- **Hierarchy（預設）**：使用 dagre `rankdir: TB` 自動排版，`blocks` 和 `parent_of` 邊影響層級
- **Cluster**：依欄位分組，欄位水平排列，組內節點垂直堆疊；Cluster 模式顯示所有卡片（含 unlinked）。細節如下：
  - 組內節點依有向邊（`blocks` / `parent_of`）做拓撲排序，A→B 時 A 排在 B 上方
  - 有邊相連的欄位群組排在左側；無任何邊相連的 unlinked 卡片群組排在最右側，並以額外間距視覺分隔

#### Scenario: Default layout
- **WHEN** 進入 Graph View
- **THEN** 以 Hierarchy 模式渲染，節點依依賴方向由上而下排列

#### Scenario: Switch to cluster
- **WHEN** 使用者點擊 Cluster 切換鈕
- **THEN** 節點依欄位分組排列；有依賴的欄位群組在左，unlinked 卡片群組在右；組內節點依拓撲排序由上而下

#### Scenario: Topological order within cluster group
- **WHEN** Cluster 模式中，卡片 A blocks 卡片 B，兩者同欄位
- **THEN** A 出現在 B 上方

---

### Requirement: Minimap and zoom controls
Graph View SHALL 在右下角提供：
- MiniMap 總覽小窗格（可見整體圖形）
- 縮放控制：放大（+）、縮小（-）、全圖 fit（⊡）

#### Scenario: Fit view
- **WHEN** 使用者點擊 fit 按鈕
- **THEN** 視野調整至所有節點可見

---

### Requirement: Relation legend
Graph View 底部中央 SHALL 顯示浮動圖例，分為兩區：
1. **邊線區**：4 種關係類型的線條樣式（顏色 + 虛實 + 箭頭）及標籤
2. **垂直分隔線**
3. **卡片外框色區**：3 種到期狀態的外框顏色說明（紅色=逾期、橘色=即將到期、藍色=進行中）

圖例文字設定 `whitespace-nowrap` 防止換行。

#### Scenario: Legend visible
- **WHEN** Graph View 渲染
- **THEN** 底部顯示邊線圖例（4 種）＋分隔線＋卡片外框色圖例（3 種）

---

### Requirement: Sidebar dock (Needs Attention + Unlinked)
Graph View 左側 SHALL 顯示可收合的側邊欄，由上至下包含兩個 section：
1. **Needs Attention**（上）：`endTime` 逾期或 5 天內到期的卡片，顯示到期狀態色標
2. **Unlinked Cards**（下）：`dependencyCount === 0` 的卡片（Hierarchy 模式下不在 graph 中），顯示標題和欄位色點

側邊欄可收合為 40px rail，只顯示兩個 section 的數量 badge。

#### Scenario: Needs attention section
- **WHEN** 看板有逾期或 5 天內到期的卡片
- **THEN** 這些卡片列在 Needs Attention section（側邊欄上半），顯示紅/橘色點與標題

#### Scenario: Unlinked section
- **WHEN** 看板有無任何關聯的卡片
- **THEN** 這些卡片列在 Unlinked Cards section（側邊欄下半），顯示欄位色點與標題

#### Scenario: Collapse sidebar
- **WHEN** 使用者點擊收合按鈕
- **THEN** 側邊欄縮為 40px，顯示各 section 的數量 badge

---

### Requirement: Urgency threshold unified to 5 days
`getScheduleUrgencyClass()` 函式 SHALL 使用 5 天（`diff <= 5`）作為橘色警告門檻，全站一致（CardItem、Graph View 均適用）。

#### Scenario: Due in exactly 5 days
- **WHEN** 卡片 `endTime` 距今恰好 5 天
- **THEN** `getScheduleUrgencyClass()` 回傳橘色警告 class（`text-orange-500`）

#### Scenario: Due in 6 days
- **WHEN** 卡片 `endTime` 距今 6 天
- **THEN** `getScheduleUrgencyClass()` 回傳 `text-gray-400`（非警告）
