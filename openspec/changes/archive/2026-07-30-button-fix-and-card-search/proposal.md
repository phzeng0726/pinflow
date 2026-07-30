## Why

Dialog 中的「稍後」按鈕樣式不一致——UpdateDialog 缺少 Clock icon 且 WorkspaceSourceDialog 的 icon 與文字間無間距，視覺上顯得粗糙。同時，使用者在 Board 頁面中缺乏快速搜尋卡片標題的能力，需要逐一瀏覽各 column 才能找到目標卡片。

## What Changes

- 統一 UpdateDialog 和 WorkspaceSourceDialog 的「稍後」ghost 按鈕樣式：都加上 Clock3 icon 並設定 icon 與文字間距
- 在 BoardPage header 新增搜尋按鈕，點擊或 `Ctrl+K` 開啟 Command Palette dialog
- Command Palette 使用 cmdk (shadcn/ui Command) 元件，即時搜尋當前 board 的卡片標題（不含 archived cards）
- 點選搜尋結果直接打開卡片詳情

## Capabilities

### New Capabilities

- `card-search-palette`: Board 頁面的 Command Palette 卡片搜尋功能，支援 Ctrl+K 快捷鍵、即時搜尋、結果按 column 分組、點選跳轉卡片詳情

### Modified Capabilities

_(none)_

## Impact

- **前端新增套件**: `cmdk`（shadcn/ui Command 元件依賴）
- **新增元件**: `components/ui/command.tsx`（shadcn/ui Command）、`board-detail/components/CardSearchCommand.tsx`
- **修改檔案**: `UpdateDialog.tsx`（加 icon + gap）、`WorkspaceSourceDialog.tsx`（加 gap）、`BoardPage.tsx`（整合搜尋按鈕與 Command Palette）
- **i18n**: `en-US.json`、`zh-TW.json` 新增搜尋相關翻譯 key
- **復用既有 API**: `GET /cards/search`（帶 `board_id` 參數）、`useCardSearch` hook
