## Why

目前 PinFlow 桌面版 exe 沒有 single-instance 保護，使用者若重複雙擊或誤觸捷徑，會同時啟動多個 Electron 程序，每個程序各自 spawn 一個 `pinflow-backend.exe`，導致多個後端競爭同一 workspace 檔案、浪費系統資源，並令使用者困惑。

## What Changes

- 在 `electron/main.js` 加入 `app.requestSingleInstanceLock()`，讓第二次啟動的實例直接呼叫 `app.quit()`。
- 第一個（既有）實例監聽 `second-instance` 事件：若主視窗已最小化或隱藏至 tray，則自動還原並聚焦；若視窗尚未建立，則呼叫 `createMainWindow()`。
- 現有的 `app.whenReady()` 與 `startBackend()` 邏輯移入 `else` 分支，確保僅在取得 lock 時執行。

## Capabilities

### New Capabilities

- `electron-single-instance`: Electron 應用程式強制單例行為——第二次啟動時直接退出並聚焦既有視窗

### Modified Capabilities

（無現有 spec 需要修改）

## Impact

- **修改檔案**：`electron/main.js`（唯一變動，5–15 行程式碼）
- **不影響**：frontend、backend、Electron preload、Tray、Pin window 邏輯
- **無 API / 協定變更**
