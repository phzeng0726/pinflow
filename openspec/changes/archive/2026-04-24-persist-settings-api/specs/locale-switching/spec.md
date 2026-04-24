## MODIFIED Requirements

### Requirement: 語系持久化
系統 SHALL 將使用者選擇的語系透過後端 `PUT /api/v1/settings` API 持久化，不再依賴 localStorage。

#### Scenario: 重新整理後語系保持
- **WHEN** 使用者切換語系後重新整理頁面
- **THEN** 頁面載入後維持上次選擇的語系，不重置為預設值

#### Scenario: 多頁面間語系一致
- **WHEN** 使用者在 BoardListPage 切換語系，再導航至 BoardPage
- **THEN** BoardPage 同樣顯示切換後的語系

#### Scenario: 預設語系為英文（首次使用）
- **WHEN** 使用者首次開啟應用程式（workspace 中無 `settings.json` 記錄）
- **THEN** 所有 UI 文字以美式英文顯示
