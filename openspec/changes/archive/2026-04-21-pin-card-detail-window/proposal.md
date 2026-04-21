## Why

釘選卡片目前只能在 Pin 浮動面板中查看摘要資訊，無法直接編輯。使用者若要修改卡片，必須切換回看板視窗才能操作，打斷了使用釘選面板的工作流。

## What Changes

- 將 `PinnedCardItem` 右上角的 unpin 按鈕改為多功能 popover 按鈕（hover 顯示），內含兩個選項：**Edit**（開啟詳情）和 **Unpin**（取消釘選）
- 點擊 Edit 選項，開啟一個新的 Electron BrowserWindow 顯示 CardDetailDialog
- 新視窗置中於螢幕、`alwaysOnTop: true`，與 Pin 浮動面板風格對稱
- 新視窗尺寸為 960x720，`frame: false`，使用既有 `CardDetailDialog` 元件
- Electron IPC 新增 `open-card-detail` 指令，preload 新增 `openCardDetail` API
- 新增 TanStack Router 路由 `/card-detail`，接受 `boardId` 和 `cardId` search params
- 既有的跨視窗 query invalidation 廣播機制自動涵蓋新視窗，無需額外同步邏輯

## Capabilities

### New Capabilities

- `pin-card-detail-window`: 從 Pin 浮動面板開啟卡片詳情視窗（新 Electron BrowserWindow + 新路由）

### Modified Capabilities

（無）

## Impact

- **Frontend routes**: 新增 `frontend/src/routes/card-detail.tsx`
- **Frontend pages**: 新增 `frontend/src/pages/card-detail/CardDetailPage.tsx`
- **Frontend pin components**: 修改 `PinnedCardItem.tsx`（新增 `onCardClick` prop、stopPropagation）、`PinWindow.tsx`（接線 handler）
- **Frontend types**: 修改 `frontend/src/lib/windowQuerySync.ts`（擴充 `ElectronAPI` 型別）
- **Electron main**: 修改 `electron/main.js`（新增 IPC handler、`screen` 引入）
- **Electron preload**: 修改 `electron/preload.js`（新增 `openCardDetail` 方法）
- **TanStack Router codegen**: `routeTree.gen.ts` 需重新產生
