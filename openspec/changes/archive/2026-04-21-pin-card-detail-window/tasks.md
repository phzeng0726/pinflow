## 1. Electron 主程序

- [x] 1.1 在 `electron/main.js` 頂部引入 `screen`（from electron）
- [x] 1.2 新增 `open-card-detail` IPC handler：建立 960x720 BrowserWindow，`alwaysOnTop: true`，`setAlwaysOnTop(true, 'screen-saver')`，`frame: false`，使用 `screen.getPrimaryDisplay().workAreaSize` 計算置中座標
- [x] 1.3 新視窗載入正確 URL：dev → `http://localhost:5173/card-detail?boardId=X&cardId=Y`，prod → `file://...#/card-detail?boardId=X&cardId=Y`

## 2. Electron Preload

- [x] 2.1 在 `electron/preload.js` 的 `contextBridge.exposeInMainWorld` 中新增 `openCardDetail: (boardId, cardId) => ipcRenderer.send('open-card-detail', { boardId, cardId })`

## 3. 前端型別

- [x] 3.1 在 `frontend/src/lib/windowQuerySync.ts` 的 `ElectronAPI` interface 新增 `openCardDetail?: (boardId: number, cardId: number) => void`

## 4. 新路由與頁面

- [x] 4.1 建立 `frontend/src/routes/card-detail.tsx`：使用 `createFileRoute('/card-detail')` 搭配 `validateSearch`（將 `boardId`、`cardId` 轉為 `number`）
- [x] 4.2 建立 `frontend/src/pages/card-detail/CardDetailPage.tsx`：透過 `Route.useSearch()` 取得 params，設定 `document.body` / `#root` 背景透明，render `CardDetailDialog`，`onClose` 呼叫 `window.close()`
- [x] 4.3 啟動 `pnpm dev` 確認 `routeTree.gen.ts` 自動更新包含 `/card-detail` 路由

## 5. PinnedCardItem 多功能 popover

- [x] 5.1 將 `PinnedCardItem` 的 `onUnpin` prop 改為 `onAction: { unpin: () => void; edit: () => void }`（或新增 `onEdit` prop）
- [x] 5.2 將右上角 unpin 按鈕替換為 `⋯` popover 觸發按鈕（hover 顯示，`opacity-0 group-hover:opacity-100`）
- [x] 5.3 popover 內容包含 Edit（`SquarePen` 圖示）和 Unpin（`PinOff` 圖示）兩個選項
- [x] 5.4 確認 checklist 展開按鈕已有 `e.stopPropagation()`（或確認不需要，因為卡片主體不再有 onClick）

## 6. PinWindow 接線

- [x] 6.1 在 `PinWindow.tsx` 新增 `handleCardEdit` handler：呼叫 `(window as any).electronAPI.openCardDetail(card.boardId, card.id)`
- [x] 6.2 將 `handleCardEdit` 透過 prop 傳入每個 `PinnedCardItem`
