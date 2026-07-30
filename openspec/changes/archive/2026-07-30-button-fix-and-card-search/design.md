## Context

PinFlow 的 BoardPage 目前沒有卡片搜尋功能，使用者需逐一瀏覽各 column 才能找到目標卡片。後端已有 `GET /cards/search` API 和前端 `useCardSearch` hook（帶 debounce + React Query），但僅用於 DependencyPopover。此外，兩個 dialog 的「稍後」按鈕外觀不一致。

## Goals / Non-Goals

**Goals:**
- 在 BoardPage 提供 Command Palette 風格的卡片搜尋，復用既有搜尋 API
- 統一 ghost button 的 icon + 間距樣式

**Non-Goals:**
- 跨 board 全域搜尋（僅搜尋當前 board）
- 搜尋卡片內容（僅搜尋標題）
- BoardListPage 的搜尋功能

## Decisions

### 1. 使用 cmdk + shadcn/ui Command 元件

**選擇**: 安裝 `cmdk` 套件，建立 shadcn/ui `Command` 元件作為 Command Palette 基礎。

**理由**: cmdk 是 shadcn/ui 官方推薦的 command palette 方案，提供鍵盤導航、搜尋過濾、分組等功能，且與 shadcn/ui Dialog 無縫整合。專案已大量使用 shadcn/ui，風格一致。

**替代方案**: 自建 dialog + input + list——開發成本高且鍵盤導航需自行實作。

### 2. 復用 useCardSearch hook

**選擇**: 直接使用既有的 `useCardSearch(query, limit, debounceMs, boardId)` hook。

**理由**: 已封裝 debounce 和 React Query 快取邏輯，API 端已排除 archived cards，無需額外過濾。

### 3. 搜尋結果按 column 分組

**選擇**: 搜尋結果按 `columnName` 分組顯示，使用 cmdk 的 `CommandGroup` 元件。

**理由**: 使用者思維模型中卡片按 column 組織，分組顯示幫助快速定位。`CardSearchResult` 已包含 `columnName` 欄位。

### 4. 按鈕樣式修正方式

**選擇**: 在 Button 上加 `className="gap-1.5"`，UpdateDialog 補上 `Clock3` icon。

**理由**: shadcn/ui Button 使用 `inline-flex items-center`，加 `gap-1.5` 即可控制 icon-text 間距，最小改動。

## Risks / Trade-offs

- **cmdk 新增依賴** → 套件體積小（~5KB gzipped），且是 shadcn/ui 生態標準套件，風險低
- **搜尋效能** → 使用 300ms debounce + limit=20，API 層已有索引，當前資料量下無效能疑慮
