## MODIFIED Requirements

### Requirement: 甘特 Bar 渲染
每張有 `endTime` 的卡片 SHALL 在畫布上渲染一個甘特 bar。Bar 的 `left` 與 `width` 根據日期與目前 zoom 的欄寬計算：
- 若卡片同時具備 `startTime` 與 `endTime`，`left` = startTime 距 rangeStart 的天數 × dayWidth，`width` = endTime - startTime 天數 × dayWidth（最小 1 格）
- 若卡片僅有 `endTime`（無 `startTime`），以「今天」作為推算起始日；若 endTime < today，則推算起始日為 endTime - 1 day

Bar 顏色 SHALL 對應所屬 Column；bar 內 SHALL 顯示卡片標題（overflow ellipsis）與 checklist 完成度（e.g., `3/8`）。Bar 點擊 SHALL 開啟 `CardDetailDialog`。

有 `endTime` 且無 `startTime` 的 bar（`isEndDateOnly: true`）SHALL 以斜線 stripe（`repeating-linear-gradient(135deg, transparent 4px, rgba(255,255,255,0.25) 4px 8px)`）疊加於藍色底色，以區分完整排程 bar。

#### Scenario: Bar 位置計算（完整排程）
- **WHEN** 卡片 startTime 為 2025-01-10，endTime 為 2025-01-20，zoom 為 day（28px/日）
- **THEN** bar width = (20-10) × 28 = 280px，left 對應 2025-01-10 的位置

#### Scenario: End-date-only bar 位置計算（today < endTime）
- **WHEN** 卡片無 startTime，endTime 為未來日期，今天為 2026-04-29，zoom 為 day
- **THEN** bar left 對應 2026-04-29，width = (endTime - today) × dayWidth（最小 1 格）

#### Scenario: End-date-only bar 位置計算（已過期）
- **WHEN** 卡片無 startTime，endTime 早於今天
- **THEN** bar left 對應 endTime - 1 day，width = 1 × dayWidth，顯示 overdue glow

#### Scenario: End-date-only bar 視覺樣式
- **WHEN** 渲染 isEndDateOnly 為 true 的 bar
- **THEN** bar 顯示藍色底色加斜線 stripe，視覺上可與完整排程 bar 區分

#### Scenario: Checklist progress overlay
- **WHEN** 卡片有 checklists，totalCount=8，completedCount=3
- **THEN** bar 內左側顯示 37.5% 寬度的半透明白色 progress overlay，bar 內顯示文字 `3/8`

#### Scenario: Overdue bar 樣式
- **WHEN** 卡片 endTime 早於今日且卡片未完成
- **THEN** bar 顯示紅色 border glow（`due-overdue` 樣式）

#### Scenario: Due soon bar 樣式
- **WHEN** 卡片 endTime 在今日起 5 天內（與 `getCardUrgency()` 門檻一致）
- **THEN** bar 顯示橘色 border glow（`due-soon` 樣式）

#### Scenario: 點擊 bar
- **WHEN** 使用者點擊甘特 bar
- **THEN** 開啟該卡片的 CardDetailDialog

---

### Requirement: 無排程卡片顯示
僅 **兩者皆無**（`startTime` 與 `endTime` 均未設定）或**僅有 `startTime`**（無 `endTime`）的卡片 SHALL 統一顯示於畫布底部「No dates」群組，以虛線框 bar 呈現（固定 120px 寬），不根據日期定位。僅有 `endTime` 的卡片 SHALL 進入主 lane（不歸入 "No dates"）。

#### Scenario: 無排程卡片群組
- **WHEN** 板子中有卡片未設定任何日期（startTime 與 endTime 皆為 null）
- **THEN** 這些卡片出現在所有有排程群組之後，群組標頭顯示「No dates」與計數

#### Scenario: 無排程 bar 樣式
- **WHEN** 渲染無排程卡片的 bar
- **THEN** bar 呈透明底色 + 虛線框，寬度固定 120px，使用 sticky 定位貼齊可視區域左緣，不顯示 progress overlay

#### Scenario: End-date-only 卡片不進入 No dates
- **WHEN** 卡片有 endTime 但無 startTime
- **THEN** 該卡片顯示於所屬 Column 的 lane 中（而非 "No dates" 群組），以 isEndDateOnly bar 渲染
