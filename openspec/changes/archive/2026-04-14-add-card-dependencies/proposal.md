## Why

看板上的任務之間存在阻擋、階層、關聯等相依關係，但目前無法在卡片之間表達這些關係，導致團隊必須靠描述文字或口頭溝通來追蹤。新增 dependency 功能讓使用者能在卡片間建立明確的有向關係，為未來的 dependency graph 視圖奠定資料基礎。

## What Changes

- 新增後端 dependency 資料模型，以集中式 `dependencies.json` 儲存全域卡片關係
- 新增 4 個後端 API 端點：建立 dependency、列出卡片的 dependency、刪除 dependency、跨 board 卡片搜尋
- 新增 `CardResponse.dependencyCount` 欄位，讓 board 視圖小卡可顯示 dependency 數量
- 新增前端 `DependencyPopover`：兩步驟流程（選關係類型 → 搜尋目標卡片），底部即時 preview bar
- 在 `CardDetailDialog` 新增 Dependencies 區塊，列出已建立的關係並可移除
- 在 `CardItem` 小卡 meta 列新增 link icon + dependency 計數

**關係類型（6 種 UI 選項，儲存為 4 種 canonical type）：**
- Blocks / Is blocked by → `blocks`
- Is parent to / Is child to → `parent_of`
- Duplicates → `duplicates`
- Is related to → `related_to`（對稱）

## Capabilities

### New Capabilities

- `card-dependencies`: 卡片間有向關係的建立、列出、移除；含跨 board 卡片搜尋、兩步驟 Popover UI、小卡 dependency 計數顯示

### Modified Capabilities

- `card-management`: `CardResponse` 新增 `dependencyCount` 欄位；刪除卡片時需連帶清除相關 dependency
- `card-detail-dialog`: 新增 Dependencies 區塊（Popover 觸發 + Badge 列表）

## Impact

**後端（Go）：**
- 新增 `backend/model/dependency.go`、`backend/dto/dependency_dto.go`、`backend/repository/file_dependency_repository.go`、`backend/service/dependency_service.go`、`backend/api/dependency_handler.go`
- 修改 `backend/store/store.go`（dependencies map、序列、file IO、刪卡清理）
- 修改 `backend/repository/interfaces.go`、`backend/api/router.go`、`backend/api/card_handler.go`、`backend/service/card_service.go`、`backend/service/board_service.go`、`backend/main.go`
- 工作區新增 `pinflow-workspace/dependencies.json`、`manifest.json` 新增 `dependencyIdSeq`

**前端（React）：**
- 新增 `frontend/src/lib/api/dependencies.ts`、dependency 相關 hooks（queries + mutations）、`DependencyPopover.tsx`
- 修改 `frontend/src/types/index.ts`、`styleConfig.ts`、`lib/api/cards.ts`、`lib/api/index.ts`、`queryKeys.ts`、`CardDetailDialog.tsx`、`CardItem.tsx`
