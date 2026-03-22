## Context

PinFlow 目前 Card 沒有工作量估算機制，Tag 只支援建立/附加/移除且無顏色區分，Checklist 標題建立後不可修改。這些限制讓看板管理不夠靈活。

現有架構：
- Backend：Go + Gin + GORM + SQLite，三層架構（repository → service → handler）
- Frontend：React 19 + TanStack Query hooks + shadcn/ui + Tailwind v3
- 既有 CRUD pattern 成熟，新功能可沿用現有模式

## Goals / Non-Goals

**Goals:**
- Card 可設定 story point（可選正整數，預設按鈕快速輸入）
- Tag 建立/編輯時可選顏色（Tailwind 調色盤）
- Tag 可編輯名稱與顏色、可刪除
- Checklist 標題可 inline 編輯

**Non-Goals:**
- Story point 的統計/加總/報表功能（未來再做）
- Tag 自訂任意色碼（只提供預定義色票）
- Checklist item 拖曳排序改進（現有 position 機制不在此次範圍）

## Decisions

### 1. Story Point 欄位設計

**決策**：Card model 新增 `StoryPoint *int`（nullable），後端不限制特定值，前端 UI 以按鈕組呈現預設值（1,3,5,7,9,11,13,15,17,19），並提供清除按鈕。

**理由**：nullable 表示「未估點」vs 0 區分明確。後端不硬編碼允許值，保持彈性；限制值的邏輯只在前端 UI 層。

**替代方案**：後端 enum 限制 → 過於僵硬，未來調整需改後端。

### 2. Tag 顏色存儲

**決策**：Tag model 新增 `Color string`（預設空字串表示無顏色）。存儲 Tailwind 色名 key（如 `"red"`, `"blue"`, `"green"`），前端根據 key 映射到對應 Tailwind class。

**理由**：儲存 key 而非完整 class name，避免與 Tailwind 版本耦合。前端維護一份 color map（key → bg/text/ring class），方便統一管理深色模式。

**替代方案**：存 hex 色碼 → 無法利用 Tailwind 的 dark mode variant，需額外處理。

### 3. Tag 顏色調色盤

**決策**：提供約 10-12 個 Tailwind 預定義顏色選項：red, orange, amber, yellow, lime, green, emerald, cyan, blue, violet, purple, pink。前端用圓形色塊按鈕呈現，點選即選取。

**理由**：覆蓋主要色系，數量適中不會造成選擇困難。

### 4. Tag 刪除策略

**決策**：刪除全域 Tag 時，同時移除所有 card-tag 關聯（CASCADE）。前端刪除前顯示確認提示。

**理由**：Tag 是全域資源，刪除影響所有使用該 Tag 的卡片，需要使用者明確確認。

### 5. Checklist 標題編輯 UI

**決策**：Checklist 標題改為 inline editable（點擊標題進入編輯模式，blur 或 Enter 送出）。

**理由**：符合 Kanban 工具的常見互動模式，減少操作步驟。

### 6. API 端點設計

新增端點：
| Method | Path | 說明 |
|--------|------|------|
| PATCH | `/api/v1/tags/:id` | 更新 tag（name, color） |
| DELETE | `/api/v1/tags/:id` | 刪除 tag（cascade 移除關聯） |
| PATCH | `/api/v1/checklists/:id` | 更新 checklist（title） |

既有端點修改：
- `POST /api/v1/tags`：request body 新增 `color` 欄位
- `PATCH /api/v1/cards/:id`：request body 新增 `story_point` 欄位
- 所有回傳 Tag 的 DTO 加入 `color` 欄位
- 所有回傳 Card 的 DTO 加入 `story_point` 欄位

## Risks / Trade-offs

- **[Tag 刪除影響範圍]** → 刪除全域 tag 影響所有相關 card。Mitigation：前端刪除確認 dialog 提示使用者。
- **[Story point nullable vs zero]** → `null` 表示未估點，`0` 不在預設選項中。Mitigation：前端不提供 0 按鈕，只有清除按鈕回到 null。
- **[SQLite migration]** → 新增欄位使用 GORM AutoMigrate，SQLite 支援 ALTER TABLE ADD COLUMN。Mitigation：nullable 欄位不需 default constraint，既有資料不受影響。
