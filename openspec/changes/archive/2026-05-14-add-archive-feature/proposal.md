## Why

PinFlow 目前只有永久刪除卡片和欄位的選項，使用者無法暫時移除不需要的項目同時保留復原的可能性。新增封存（Archive）功能讓使用者可以將卡片和欄位移出看板視圖，並在需要時還原或永久刪除。

## What Changes

- 新增對單張卡片的封存操作（右鍵選單）
- 新增對整個欄位的封存操作（欄位多功能選單，封存欄位）
- 新增對欄位內所有卡片的封存操作（欄位多功能選單，封存所有卡片）
- 新增 Archive Drawer（從右側滑出），顯示已封存的卡片與欄位，各有獨立 tab
- 封存的項目可被還原或永久刪除（永久刪除需確認對話框）
- 被封存的卡片和欄位從看板視圖、搜尋結果、釘選清單中隱藏
- Card 和 Column model 新增 `archivedAt` 欄位（向下相容）
- 新增 backend API 端點處理封存、還原、永久刪除和列表查詢

## Capabilities

### New Capabilities

- `card-archive`: 卡片封存操作——封存單張卡片、從封存清單還原或永久刪除卡片
- `column-archive`: 欄位封存操作——封存整個欄位或封存欄位內所有卡片、從封存清單還原或永久刪除欄位
- `archive-drawer`: 封存管理 UI——Archive Drawer 顯示 Cards / Columns 兩個 tab，展示封存項目並支援還原和永久刪除

### Modified Capabilities

（無現有 spec 需要修改）

## Impact

**Backend**
- `backend/model/card.go`、`backend/model/column.go` — 新增 `ArchivedAt *time.Time` 欄位
- `backend/store/store.go` — `CardFile` 新增欄位；修改 `GetColumnsByBoard`、`GetCardsByColumn`、`GetPinnedCards`、`SearchCards` 過濾已封存項目；新增封存查詢方法
- `backend/repository/` — CardRepository、ColumnRepository 新增封存/還原方法；`board_repository.go` 轉換函式更新
- `backend/service/` — 新增 `archive_service.go` 與 `ArchiveService` interface
- `backend/dto/` — 新增 `archive_dto.go`
- `backend/api/` — 新增 `archive_handler.go`；更新 `handler.go`、`router.go`

**Frontend**
- `frontend/src/types/index.ts` — Card、Column type 新增 `archivedAt`；新增 ArchivedCard、ArchivedColumn
- `frontend/src/lib/api/archive.ts` — 新增封存相關 API 函式
- `frontend/src/hooks/` — 新增 archive query/mutation hooks；更新 `queryKeys.ts`
- `frontend/src/components/ui/` — 新增 Sheet、Tabs 元件（shadcn/ui）
- `frontend/src/pages/board-detail/components/` — 新增 archive/ 目錄（ArchiveDrawer、ArchivedCardItem、ArchivedColumnItem）；修改 CardContextMenu、ColumnHeader、BoardPage
- `frontend/src/locales/` — 兩份 i18n 檔案新增 archive 相關文字
