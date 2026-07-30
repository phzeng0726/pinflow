## 1. Ghost Button 樣式統一

- [x] 1.1 修改 `frontend/src/components/common/UpdateDialog.tsx`：為「稍後」按鈕加上 `Clock3` icon import 和 `className="gap-1.5"`
- [x] 1.2 修改 `frontend/src/components/common/WorkspaceSourceDialog.tsx`：為「稍後再決定」按鈕加上 `className="gap-1.5"`

## 2. 安裝依賴與建立 Command 元件

- [x] 2.1 安裝 `cmdk` 套件：`cd frontend && pnpm add cmdk`
- [x] 2.2 建立 `frontend/src/components/ui/command.tsx`（shadcn/ui Command 元件）

## 3. CardSearchCommand 元件實作

- [x] 3.1 建立 `frontend/src/pages/board-detail/components/CardSearchCommand.tsx`：使用 CommandDialog、整合 `useCardSearch` hook、搜尋結果按 column 分組、點選結果打開 CardDetailDialog
- [x] 3.2 新增 i18n 翻譯 key 至 `frontend/src/locales/en-US.json` 和 `zh-TW.json`（搜尋框 placeholder、無結果提示、tooltip 等）

## 4. BoardPage 整合

- [x] 4.1 在 `frontend/src/pages/board-detail/BoardPage.tsx` header 加入搜尋按鈕（Search icon + Tooltip）
- [x] 4.2 在 BoardPage 加入 `Ctrl+K` 鍵盤快捷鍵 listener 開啟 CardSearchCommand
- [x] 4.3 整合 CardSearchCommand 元件，傳入 boardId 和 open/onOpenChange

## 5. 驗證

- [x] 5.1 執行 `pnpm build` 確認無編譯錯誤
- [x] 5.2 執行 `pnpm lint` 確認無 lint 警告
- [x] 5.3 手動測試：確認兩個 dialog 的按鈕樣式一致、Command Palette 搜尋功能正常、dark mode 樣式正確
