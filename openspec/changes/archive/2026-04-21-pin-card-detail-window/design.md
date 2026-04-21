## Context

PinWindow 是 Electron 的獨立 BrowserWindow（300x500px，`alwaysOnTop`，`frame: false`，`transparent: true`）。目前 `PinnedCardItem` 右上角有一個 unpin 按鈕（hover 顯示），但無法開啟卡片詳情。

`CardDetailDialog` 是現有的自包含元件（`max-w-4xl`，需要約 960px 寬），只需 `boardId` 和 `cardId` 兩個 props，自行透過 React Query 取得資料。`PinnedCard` 型別已包含 `boardId` 欄位。

跨視窗資料同步機制（`broadcast-query-invalidation` IPC + `setupWindowQuerySync`）已存在，自動廣播給所有 `BrowserWindow.getAllWindows()`，新視窗無需額外設定即可同步。

## Goals / Non-Goals

**Goals:**
- 讓使用者從 Pin 浮動面板直接編輯卡片，不需切換到主視窗
- 新視窗置中螢幕、`alwaysOnTop`，與 Pin 面板風格對稱
- 將 unpin 按鈕升級為多功能 popover，避免誤觸

**Non-Goals:**
- 不支援 Web 模式（PinWindow 為 Electron 專屬功能）
- 不修改 `CardDetailDialog` 本身的行為

## Decisions

### 決策 1：開新 BrowserWindow，不在 Pin 視窗內 render

**選擇：** 開啟獨立 BrowserWindow 載入 `/card-detail` 路由

**理由：**
- Pin 視窗僅 300x500px，`CardDetailDialog` 需要 ~960px 寬，無法容納
- 在 Pin 視窗內擴大尺寸會破壞 alwaysOnTop 浮動面板的 UX 定位
- 比「請主視窗開 dialog」的方式更不干擾使用者，主視窗焦點不會被搶走

**替代方案：** IPC 請主視窗開 dialog → 會搶奪主視窗焦點、需要主視窗在特定看板頁面

### 決策 2：新視窗設定 `alwaysOnTop: true`

**選擇：** 與 Pin 浮動面板相同層級，`alwaysOnTop: true`，`setAlwaysOnTop(true, 'screen-saver')`

**理由：** 使用者操作 PinWindow 期間通常有其他 App 佔滿螢幕，維持 alwaysOnTop 才能讓詳情視窗一直可見，與 Pin 面板的設計哲學對稱

**替代方案：** 普通視窗 → 可能被其他 App 遮住，使用者體驗割裂

### 決策 3：用多功能 popover 取代 unpin 按鈕

**選擇：** 將 hover 顯示的 unpin 按鈕改為 `⋯` popover 按鈕，內含 Edit 和 Unpin 兩個選項

**理由：**
- 完全避免「想點 Edit 卻誤觸 Unpin」的問題
- 不增加新的視覺元素，保持卡片整潔
- 與常見的 Kanban card 操作模式一致（如 Notion、Linear）

**替代方案：** 點擊卡片任意位置開啟詳情 → 容易誤觸 unpin / checklist 展開等互動元素

### 決策 4：使用 TanStack Router search params 傳遞 boardId & cardId

**選擇：** 路由 `/card-detail?boardId=X&cardId=Y`，使用 `validateSearch` 做型別轉換

**理由：**
- Hash 模式下 file:// URL 的相容方式（`file://...#/card-detail?boardId=X&cardId=Y`）
- TanStack Router 的 `validateSearch` 確保型別安全，避免字串/數字混用
- 與現有路由風格一致（`boards.$boardId.tsx` 用 path params）

### 決策 5：新視窗 `frame: false`，自訂拖曳列 + `CardDetailDialog` 以 `standalone` 模式填滿

**選擇：** `frame: false`，`CardDetailPage` 提供自訂拖曳列與關閉按鈕，`CardDetailDialog` 以 `standalone` prop 略過 Dialog/overlay，直接以 flex 填滿父容器

**理由：**
- `standalone` prop 讓 `CardDetailDialog` 條件性地略過 `Dialog > DialogContent` wrapper，避免 CSS injection 覆蓋 shadcn/ui class selector 的脆弱性（selectors 會隨 UI library 版本變動而失效）
- 自訂拖曳列提供 Electron `WebkitAppRegion: drag` 支援，關閉按鈕呼叫 `window.close()`
- `standalone` 同時隱藏 Dialog 內建的關閉按鈕，避免重複

**替代方案：** CSS injection 覆蓋 Dialog 定位 → `.fixed.inset-0` 等 selector 與 shadcn/ui 版本耦合，升級時容易靜默失效

## Risks / Trade-offs

- **多個詳情視窗並存：** 使用者可連續點擊多張卡片開啟多個視窗 → 可接受，每個視窗獨立，query invalidation 自動同步
- **視窗管理：** 不追蹤個別 cardId 對應的視窗，無法防止重複開啟同一張卡片 → 初期可接受，未來可加 Map 管理
- **`routeTree.gen.ts` 需重新產生：** 開發者需啟動 `pnpm dev` 讓 TanStack Router plugin 自動產生 → 已在 CLAUDE.md 流程中

## Migration Plan

純前端 + Electron 變更，無資料庫 schema 異動，無需 migration。
