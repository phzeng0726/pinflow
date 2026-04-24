## 1. Electron Main Process 修改

- [x] 1.1 在 `electron/main.js` 頂端（`app` import 之後）加入 `app.requestSingleInstanceLock()`，取不到 lock 時呼叫 `app.quit()`
- [x] 1.2 在 `else` 分支內加入 `app.on('second-instance', ...)` handler：還原並聚焦 mainWindow（最小化 → restore，隱藏 → show，null → createMainWindow）
- [x] 1.3 將現有 `app.whenReady().then(...)` 及其後的 `app.on('window-all-closed')` / `app.on('activate')` / `app.on('will-quit')` 移入 `else` 分支內

## 2. 驗證

- [x] 2.1 執行 `make dev`，確認正常啟動無問題
- [x] 2.2 打包後執行兩次 exe，確認第二次啟動無新視窗 / 無新後端，既有視窗被聚焦
- [x] 2.3 將視窗最小化後再次執行 exe，確認視窗被還原並聚焦
- [x] 2.4 確認工作管理員中只有一個 `pinflow-backend.exe` 程序
