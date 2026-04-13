## Why

前端 `features/` 採 feature-based 分類，但 `features/board/` 混入了 CardItem、CardContextMenu 等 card 相關元件，開發時經常找不到檔案。同時 import 風格混用 `@/` alias 和 `../` 相對路徑（43 個檔案用相對路徑、26 個用 alias，多個檔案混用兩種），增加維護成本。需要一次性重構為 pages + 領域分類結構，並統一 import 風格。

## What Changes

- **BREAKING**: 刪除 `src/features/` 資料夾，19 個元件搬遷至新的 `src/pages/` 結構
- 新增 `src/pages/board-list/` — 放 BoardListPage（看板列表頁）
- 新增 `src/pages/board-detail/` — 放 BoardPage 及所有看板內部元件
- 新增 `src/pages/board-detail/components/cards/` — CardItem、CardDetailDialog、AddCardForm、ScheduleSection、StoryPointSelector 等 7 個 card 相關元件
- 新增 `src/pages/board-detail/components/columns/` — ColumnView、ColumnHeader、AddColumnForm
- 新增 `src/pages/board-detail/components/tags/` — TagSection、ColorPicker
- 新增 `src/pages/board-detail/components/checklists/` — ChecklistBlock、ChecklistSection
- 新增 `src/pages/pin/` — PinWindow + PinnedCardItem、PinOverlay
- 所有跨目錄 import 統一使用 `@/` alias，同目錄 `./` 保留
- 更新 routes、hooks、lib/api、components/ui 中的相對路徑 import

## Capabilities

### New Capabilities

（無新增能力 — 此變更為純結構重構，不引入新功能）

### Modified Capabilities

- `frontend-conventions`: 新增資料夾結構規範（pages + 領域分類）和 import 路徑規範（跨目錄用 `@/`、同目錄用 `./`）

## Impact

- **前端元件**：19 個檔案搬遷路徑，所有內部 import 需更新
- **路由檔案**：`routes/` 下 4 個檔案的 import 路徑需更新
- **Hooks**：約 12 個檔案的相對路徑 import 改為 `@/`
- **API 層**：`lib/api/` 下約 5 個檔案的相對路徑 import 改為 `@/`
- **UI 元件**：`components/ui/` 下約 3 個檔案的相對路徑 import 改為 `@/`
- **無後端影響**：純前端結構變更
- **無 API 變更**：不影響任何 API 路由或資料格式
