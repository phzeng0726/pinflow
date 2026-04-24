### Requirement: 應用程式限制單一執行個體
PinFlow 桌面版 SHALL 確保任何時刻最多只有一個 Electron 程序實例在運行。

#### Scenario: 第二次啟動時退出
- **WHEN** 使用者在已有一個 PinFlow 實例運行時再次執行 exe
- **THEN** 第二個實例 SHALL 立即退出，不建立任何視窗，不 spawn 後端

#### Scenario: 聚焦既有視窗（正常狀態）
- **WHEN** 使用者在主視窗正常顯示時再次執行 exe
- **THEN** 既有主視窗 SHALL 被帶至最前景並獲得焦點

#### Scenario: 還原最小化視窗
- **WHEN** 主視窗已最小化，使用者再次執行 exe
- **THEN** 主視窗 SHALL 被還原（restore）並聚焦

#### Scenario: 還原隱藏至 tray 的視窗
- **WHEN** 主視窗已隱藏至系統 tray，使用者再次執行 exe
- **THEN** 主視窗 SHALL 重新顯示（show）並聚焦

#### Scenario: 視窗尚未建立時補建
- **WHEN** 主視窗因某原因未建立（mainWindow 為 null），使用者再次執行 exe
- **THEN** 既有實例 SHALL 呼叫 createMainWindow() 建立主視窗
