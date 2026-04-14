## 1. 套件安裝與基礎設施

- [x] 1.1 安裝 `i18next` 與 `react-i18next`（`cd frontend && pnpm add i18next react-i18next`）
- [x] 1.2 建立 `src/locales/zh-TW.json`（涵蓋 common / theme / locale / board / column / card / duplicate / checklist / comment / pin / dependency / priority / storyPoint / schedule / tags 所有 key）
- [x] 1.3 建立 `src/locales/en-US.json`（key 結構與 zh-TW.json 完全一致，預設語系）
- [x] 1.4 建立 `src/lib/i18n.ts`（i18next 初始化：bundle 兩個 JSON，`lng: 'en-US'`，`fallbackLng: 'en-US'`）
- [x] 1.5 建立 `src/types/i18next.d.ts`（module augmentation，以 zh-TW.json 提供 TypeScript key 型別推導）
- [x] 1.6 建立 `src/stores/localeStore.ts`（Zustand + persist，locale 預設 `en-US`，實作 `toggle()` / `apply()`）

## 2. 整合進應用程式入口

- [x] 2.1 修改 `src/main.tsx`：在最前面加入 `import '@/lib/i18n'` side-effect import
- [x] 2.2 修改 `src/routes/__root.tsx`：import `useLocaleStore`，在 `useEffect` 中呼叫 `applyLocale()`（與現有 `applyTheme()` 並列）

## 3. 語系切換 UI

- [x] 3.1 建立 `src/components/LocaleToggle.tsx`（Button + Tooltip，顯示 `EN` / `中`，呼叫 `localeStore.toggle()`）
- [x] 3.2 修改 `src/pages/board-list/BoardListPage.tsx`：加入 `<LocaleToggle />`（置於 theme toggle 旁）並替換所有硬寫字串為 `t('key')`
- [x] 3.3 修改 `src/pages/board-detail/BoardPage.tsx`：加入 `<LocaleToggle />`（置於 theme toggle 旁）並替換所有硬寫字串為 `t('key')`

## 4. 卡片相關元件翻譯

- [x] 4.1 修改 `src/pages/board-detail/components/cards/AddCardForm.tsx`：`useTranslation()` + 替換 3 條字串
- [x] 4.2 修改 `src/pages/board-detail/components/cards/CardContextMenu.tsx`：`useTranslation()` + 替換 8 條字串
- [x] 4.3 修改 `src/pages/board-detail/components/cards/CardDetailDialog.tsx`：`useTranslation()` + 替換所有中英混寫字串
- [x] 4.4 修改 `src/pages/board-detail/components/cards/CardItem.tsx`：`useTranslation()` + 替換 2 條字串
- [x] 4.5 修改 `src/pages/board-detail/components/cards/DependencyPopover.tsx`：`useTranslation()` + 替換 6 條英文字串
- [x] 4.6 修改 `src/pages/board-detail/components/cards/DuplicateCardDialog.tsx`：`useTranslation()` + 替換 16 條字串
- [x] 4.7 修改 `src/pages/board-detail/components/cards/PriorityPopover.tsx`：`useTranslation()` + 替換 2 條字串
- [x] 4.8 修改 `src/pages/board-detail/components/cards/SchedulePopover.tsx`：`useTranslation()` + 替換 5 條字串
- [x] 4.9 修改 `src/pages/board-detail/components/cards/StoryPointPopover.tsx`：`useTranslation()` + 替換 2 條字串
- [x] 4.10 修改 `src/pages/board-detail/components/cards/TagsPopover.tsx`：`useTranslation()` + 替換 12 條字串

## 5. 欄位、清單、留言、Pin 元件翻譯

- [x] 5.1 修改 `src/pages/board-detail/components/columns/AddColumnForm.tsx`：`useTranslation()` + 替換 3 條字串
- [x] 5.2 修改 `src/pages/board-detail/components/columns/ColumnHeader.tsx`：`useTranslation()` + 替換 5 條字串
- [x] 5.3 修改 `src/pages/board-detail/components/checklists/ChecklistBlock.tsx`：`useTranslation()` + 替換 4 條字串
- [x] 5.4 修改 `src/pages/board-detail/components/checklists/ChecklistSection.tsx`：`useTranslation()` + 替換 5 條字串
- [x] 5.5 修改 `src/pages/board-detail/components/comments/CommentSection.tsx`：`useTranslation()` + 替換 9 條字串 + `formatDistanceToNow` 依語系傳入 date-fns locale
- [x] 5.6 修改 `src/pages/pin/PinWindow.tsx`：`useTranslation()` + 替換 2 條字串
- [x] 5.7 修改 `src/pages/pin/components/PinnedCardItem.tsx`：`useTranslation()` + 替換 2 條字串

## 6. 驗證

- [x] 6.1 執行 `pnpm dev`，確認預設語系為英文（en-US）
- [x] 6.2 點擊語系切換按鈕 → 確認所有文字即時切換為繁體中文
- [x] 6.3 重新整理頁面 → 確認語系維持中文（localStorage 持久化）
- [x] 6.4 再次切換回英文 → 確認所有文字正確還原
- [x] 6.5 執行 `pnpm test`，確認現有測試通過
