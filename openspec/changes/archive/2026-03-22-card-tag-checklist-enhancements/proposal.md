## Why

目前 Card 缺少 story point 欄位，無法進行工作量估算；Tag 只能新增與附加/移除，無法編輯名稱、刪除或設定顏色，使用彈性不足；Checklist 建立後無法修改標題，只能刪除重建。這些功能缺口影響日常看板管理的效率。

## What Changes

- **Card Story Point**：Card 新增 `story_point` 欄位（可選正整數），前端提供預設按鈕（1, 3, 5, 7, 9, 11, 13, 15, 17, 19）供快速輸入，也可清除
- **Tag 顏色**：Tag 新增 `color` 欄位，建立與編輯時可從 Tailwind 調色盤選取顏色
- **Tag 編輯/刪除**：新增 Tag 的 update 與 delete API 及前端操作介面
- **Checklist 標題修改**：新增 Checklist 的 update API，前端可 inline 編輯標題

## Capabilities

### New Capabilities
- `card-story-point`: Card 的 story point 欄位，包含後端欄位、API、前端按鈕式輸入 UI

### Modified Capabilities
- `card-tags`: Tag 新增 color 欄位、編輯與刪除功能
- `card-checklist`: Checklist 新增標題編輯功能

## Impact

- **Backend Model**：`Card` 新增 `StoryPoint` 欄位、`Tag` 新增 `Color` 欄位 → 需要 GORM auto-migrate
- **Backend API**：新增 `PATCH /tags/:id`、`DELETE /tags/:id`、`PATCH /checklists/:id`；Card PATCH 需支援 `story_point`
- **Frontend Types**：`Card` 加 `story_point`、`Tag` 加 `color`
- **Frontend API layer**：`tags.ts` 新增 updateTag、deleteTag；`checklists.ts` 新增 updateChecklist；`cards.ts` 的 updateCard 已支援 partial update
- **Frontend Hooks**：tag mutations 新增 update/delete；checklist mutations 新增 update title；card detail 新增 story point UI
- **Zod Schemas**：新增/修改 tag、checklist、card 相關 schema
- **UI 元件**：CardDetailDialog 新增 story point 區塊；tag 相關元件新增顏色選擇器與編輯/刪除按鈕；checklist 標題改為可編輯
