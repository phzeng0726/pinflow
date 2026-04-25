## MODIFIED Requirements

### Requirement: 依賴線型別篩選
Toolbar SHALL 提供篩選按鈕，點擊後顯示 filter panel。Filter panel SHALL 以每種依賴型別對應的 SVG 線條視覺（顏色、虛線樣式與實際渲染一致）呈現選項，而非 checkbox。Panel 頂部 SHALL 提供「Show All」與「Hide All」兩個快速按鈕。使用者可點擊任一型別 row 切換其顯示狀態。關閉某型別後，該型別的所有線條立即從畫布消失。Filter panel SHALL 僅在點擊 panel 外部（不含觸發按鈕本身）時關閉；點擊 panel 內部 SHALL 不關閉 panel。

#### Scenario: Filter panel 顯示線條視覺
- **WHEN** 使用者點擊 Toolbar 的篩選按鈕
- **THEN** 彈出 panel，每個依賴型別以 SVG 小線段（對應顏色與 strokeDasharray）呈現，而非 checkbox

#### Scenario: Show All
- **WHEN** 使用者點擊 panel 頂部「Show All」按鈕
- **THEN** 四種依賴型別全部啟用，畫布顯示所有通過型別篩選的依賴線

#### Scenario: Hide All
- **WHEN** 使用者點擊 panel 頂部「Hide All」按鈕
- **THEN** 四種依賴型別全部停用，畫布不顯示任何依賴線

#### Scenario: 切換單一型別
- **WHEN** 使用者點擊 `blocks` 型別 row（目前為啟用狀態）
- **THEN** `blocks` 型別停用，其線條從畫布移除，row 呈現黯淡狀態；其他型別不受影響

#### Scenario: 點擊 panel 內部不關閉
- **WHEN** 使用者在 filter panel 開啟時，點擊 panel 內部任何元素
- **THEN** panel 保持開啟，所點擊的操作（Show All / Hide All / 型別切換）正常執行

#### Scenario: 點擊外部關閉 panel
- **WHEN** filter panel 開啟時，使用者點擊 panel 和觸發按鈕以外的任何區域
- **THEN** panel 關閉

---

### Requirement: 依賴關係箭頭顯示
畫布 SHALL 以 SVG elbow path 繪製卡片間的依賴關係線，從 from-card bar 右邊緣出發，折線至 to-card bar 左邊緣。線條顏色 SHALL 對應依賴型別（blocks=紅、parent_of=藍、related_to=綠虛線、duplicates=灰虛線）。

#### Scenario: All 模式顯示全部箭頭
- **WHEN** depMode 為 `all`
- **THEN** 所有通過 depTypeFilter 的依賴線以 opacity 0.75 顯示

#### Scenario: Off 模式不顯示箭頭
- **WHEN** depMode 為 `off`
- **THEN** 畫布不渲染任何 SVG 依賴線

#### Scenario: Hover 模式 — 有卡片被 hover
- **WHEN** depMode 為 `hover` 且使用者 hover 某張卡片
- **THEN** 僅渲染與該卡片直接相連（fromCard 或 toCard 為該卡片）的依賴線（opacity=1）；其餘所有依賴線不渲染（完全不存在於 DOM）

#### Scenario: Hover 模式 — 無卡片被 hover
- **WHEN** depMode 為 `hover` 且無卡片被 hover
- **THEN** 畫布不渲染任何依賴線

---

### Requirement: 標題搜尋
Toolbar SHALL 提供搜尋輸入框，輸入後即時（無需按 Enter）篩選卡片。有搜尋詞時，標題不包含搜尋字串（大小寫不敏感）的卡片 SHALL 以低 opacity 顯示（黯淡），標題包含搜尋字串的卡片正常顯示。所有卡片保持在 DOM 中，不因搜尋而移除。若某 Column 下所有卡片均不匹配，lane 標頭列仍顯示（但其卡片均黯淡）。

#### Scenario: 搜尋時未匹配卡片黯淡
- **WHEN** 使用者在搜尋框輸入 `bug`
- **THEN** 標題不含 `bug`（不分大小寫）的卡片在左側 label 與右側 bar 上均以低 opacity 顯示；含 `bug` 的卡片以正常 opacity 顯示

#### Scenario: 搜尋時匹配卡片正常顯示
- **WHEN** 使用者在搜尋框輸入 `bug`
- **THEN** 標題含 `bug` 的卡片行正常顯示，不黯淡

#### Scenario: 清空搜尋
- **WHEN** 使用者清空搜尋框
- **THEN** 所有卡片恢復正常 opacity

---

## ADDED Requirements

### Requirement: Row Hover 高亮
Timeline 中的每張卡片 SHALL 在鼠標移入其 row（左側 label 區或右側 bar 區）時，整條 row 顯示高亮背景色（含左側 label 區與右側畫布對應橫向區域）。移出後恢復正常背景。此行為與 depMode 和 searchQuery 狀態無關，始終啟用。

#### Scenario: 鼠標移入左側 label row 時高亮
- **WHEN** 使用者將鼠標移至某卡片的左側 label row
- **THEN** 該 row 的左側 label 區顯示高亮背景；右側畫布對應橫向區域同步顯示高亮背景

#### Scenario: 鼠標移入右側 bar 時高亮
- **WHEN** 使用者將鼠標移至某卡片的甘特 bar
- **THEN** 左側 label 區與右側對應 row 區域均顯示高亮背景

#### Scenario: 鼠標移出後恢復
- **WHEN** 使用者將鼠標移出 row
- **THEN** 高亮背景消失，恢復正常顯示
