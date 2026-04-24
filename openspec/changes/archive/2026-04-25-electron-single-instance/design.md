## Context

`electron/main.js` 目前在 `app.whenReady()` 中直接 spawn 後端並建立視窗，沒有任何重複啟動保護。Electron 提供內建的 `app.requestSingleInstanceLock()` API 專為此場景設計，是官方推薦做法。

## Goals / Non-Goals

**Goals:**
- 確保同一台機器只能有一個 PinFlow Electron 實例在運行
- 第二次啟動 exe 時，自動聚焦既有視窗（從 tray / 最小化還原）
- 不重複 spawn `pinflow-backend.exe`

**Non-Goals:**
- 不處理多使用者 / 多 session 情境
- 不修改 pin window 或 card detail window 的行為
- 不影響 `make dev` 開發流程（開發時不打包 exe）

## Decisions

### 使用 `app.requestSingleInstanceLock()`

Electron 提供此 API 作為跨平台 single-instance 解法，底層使用 OS-level named mutex（Windows）或 socket file（macOS/Linux）。

**替代方案考量：**
- 自行建立 lockfile / named mutex → 需手動處理 crash 殘留 lock，不必要的複雜度
- 使用第三方套件 → 無必要，Electron 原生 API 已足夠

### 結構：lock 判斷包裹 `app.whenReady()`

```
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();            // 第二實例立即退出
} else {
  app.on('second-instance', () => { /* 聚焦視窗 */ });
  app.whenReady().then(...); // 原有啟動邏輯不變
}
```

此結構確保後端 spawn、視窗建立只在取得 lock 後執行，不需改動現有 `startBackend()` / `createMainWindow()` 內部邏輯。

## Risks / Trade-offs

- [Lock 殘留] 若程序崩潰而未正常退出，Electron 會在下次啟動時自動清除 stale lock → 無需額外處理
- [tray 隱藏時主視窗為 null] `mainWindow` 可能已被 GC 或設為 null → `second-instance` handler 需判斷 null 並呼叫 `createMainWindow()`

## Migration Plan

純前端（Electron main process）修改，無資料遷移。重新打包 exe 即生效，無需使用者操作。
