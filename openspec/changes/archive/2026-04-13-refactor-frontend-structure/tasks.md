## 1. 建立資料夾結構並搬遷檔案

- [x] 1.1 建立 `pages/board-list/`、`pages/board-detail/components/cards/`、`pages/board-detail/components/columns/`、`pages/board-detail/components/tags/`、`pages/board-detail/components/checklists/`、`pages/pin/components/` 資料夾
- [x] 1.2 git mv 搬遷 board-list 頁面：`features/board/BoardListPage.tsx` → `pages/board-list/`
- [x] 1.3 git mv 搬遷 board-detail 頁面：`features/board/BoardPage.tsx` → `pages/board-detail/`
- [x] 1.4 git mv 搬遷 cards 領域元件（7 個）：CardItem、CardContextMenu、AddCardForm（from features/board/）+ CardDetailDialog、DuplicateCardDialog、ScheduleSection、StoryPointSelector（from features/card/）→ `pages/board-detail/components/cards/`
- [x] 1.5 git mv 搬遷 columns 領域元件（3 個）：ColumnView、ColumnHeader、AddColumnForm → `pages/board-detail/components/columns/`
- [x] 1.6 git mv 搬遷 tags 領域元件（2 個）：TagSection、ColorPicker → `pages/board-detail/components/tags/`
- [x] 1.7 git mv 搬遷 checklists 領域元件（2 個）：ChecklistBlock、ChecklistSection → `pages/board-detail/components/checklists/`
- [x] 1.8 git mv 搬遷 pin 頁面及元件（3 個）：PinWindow → `pages/pin/`、PinnedCardItem + PinOverlay → `pages/pin/components/`
- [x] 1.9 刪除空的 `features/` 資料夾

## 2. 更新搬遷檔案的 import

- [x] 2.1 更新 `pages/board-list/BoardListPage.tsx` 的 import — 所有 `../../` 改為 `@/`
- [x] 2.2 更新 `pages/board-detail/BoardPage.tsx` 的 import — `../../` 改為 `@/`，`./ColumnView` → `@/pages/board-detail/components/columns/ColumnView`，`./AddColumnForm` → `@/pages/board-detail/components/columns/AddColumnForm`
- [x] 2.3 更新 `pages/board-detail/components/cards/` 下 7 個檔案的 import — 修正所有 `../../`、`../card/`、`./` 跨目錄引用為 `@/`
- [x] 2.4 更新 `pages/board-detail/components/columns/` 下 3 個檔案的 import — ColumnView 的 `./CardItem` → `@/pages/board-detail/components/cards/CardItem` 等
- [x] 2.5 更新 `pages/board-detail/components/tags/` 下 2 個檔案的 import
- [x] 2.6 更新 `pages/board-detail/components/checklists/` 下 2 個檔案的 import
- [x] 2.7 更新 `pages/pin/PinWindow.tsx` 和 `pages/pin/components/` 下 2 個檔案的 import

## 3. 更新非搬遷檔案的 import

- [x] 3.1 更新 `routes/` 下 4 個檔案：index.tsx → `@/pages/board-list/BoardListPage`、boards.$boardId.tsx → `@/pages/board-detail/BoardPage`、pin.tsx → `@/pages/pin/PinWindow`、__root.tsx → `@/stores/themeStore`
- [x] 3.2 更新 `hooks/` 下所有使用 `../` 相對路徑的檔案（約 12 個）改為 `@/` alias
- [x] 3.3 更新 `lib/api/` 下所有使用 `../../types`、`../schemas` 等相對路徑的檔案（約 5 個）改為 `@/`
- [x] 3.4 更新 `components/ui/` 下使用 `../` 的檔案（button.tsx、input.tsx、textarea.tsx 等）改為 `@/lib/utils`

## 4. 驗證

- [x] 4.1 執行 `npx tsc --noEmit` 確認型別檢查通過
- [x] 4.2 執行 `pnpm build` 確認 build 成功
- [x] 4.3 執行 `pnpm test` 確認測試通過
