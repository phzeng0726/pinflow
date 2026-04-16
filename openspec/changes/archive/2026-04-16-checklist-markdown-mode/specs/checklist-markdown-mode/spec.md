## ADDED Requirements

### Requirement: 新增 PUT /checklists/:id/items 同步端點
系統 SHALL 提供 `PUT /api/v1/checklists/:id/items` endpoint，接受 `{"items": [{text, completed}]}` 並以智慧 diff 方式同步 checklist 項目，回傳更新後的 `ChecklistResponse`。

#### Scenario: 同步新增項目
- **WHEN** 使用者送出 PUT 請求，items 中包含現有項目不存在的新文字
- **THEN** 系統為新文字建立新 item（分配新 ID），保留既有項目的 ID 不變，回傳完整 ChecklistResponse（HTTP 200）

#### Scenario: 同步刪除項目
- **WHEN** 使用者送出 PUT 請求，items 中不包含某個現有項目的文字
- **THEN** 系統刪除該項目，其他項目的 ID 保持不變

#### Scenario: 同步更新 completed 狀態
- **WHEN** 使用者送出 PUT 請求，某項目文字相同但 completed 值不同
- **THEN** 系統保留該項目的 ID，更新其 completed 欄位

#### Scenario: 同步空 items 陣列
- **WHEN** 使用者送出 PUT 請求，items 為空陣列 `[]`
- **THEN** 系統刪除該 checklist 的所有項目，回傳 items 為空的 ChecklistResponse（HTTP 200）

#### Scenario: Checklist 不存在
- **WHEN** 使用者送出 PUT 請求，路徑中的 checklist ID 不存在
- **THEN** 系統回傳 HTTP 404

#### Scenario: 項目文字超過長度限制
- **WHEN** 使用者送出 PUT 請求，任一 item 的 text 為空字串或超過 500 字元
- **THEN** 系統回傳 HTTP 422，不執行任何更新

### Requirement: 後端 Smart Diff 邏輯（文字比對保留 ID）
系統 SHALL 在處理 PUT 同步請求時，以文字字串為 key 進行配對，盡量保留既有 item ID。

#### Scenario: 相同文字的項目保留既有 ID
- **WHEN** PUT 請求中的 item 文字與現有某 item 完全相同
- **THEN** 系統保留該 item 的既有 ID，僅更新 completed 與 position

#### Scenario: 重複文字按順序配對
- **WHEN** PUT 請求中有兩個文字相同的 item，且現有 checklist 中也有相同文字的 item
- **THEN** 第一個請求 item 配對第一個現有 item（保留 ID），第二個建立新 item

#### Scenario: Position 依陣列順序重新指派
- **WHEN** PUT 同步完成
- **THEN** 所有項目的 position 依請求陣列順序重新指派（index + 1），反映使用者在 markdown 中的排列順序

### Requirement: ChecklistMarkdownEditor 元件
前端 SHALL 提供 `ChecklistMarkdownEditor` 元件，以 textarea 呈現 checklist 項目的 markdown 表示，並支援特化的鍵盤行為。

#### Scenario: 初始化顯示既有項目
- **WHEN** 使用者切換至 Markdown 模式
- **THEN** textarea 內容以 `- [ ] text`（未完成）或 `- [x] text`（已完成）每行一項呈現，順序與 UI 模式一致（依 position 排序）

#### Scenario: 空 checklist 預填前綴
- **WHEN** 使用者切換至 Markdown 模式且 checklist 無任何項目
- **THEN** textarea 預填 `- [ ] ` 讓使用者可立即開始輸入

#### Scenario: Enter 自動續行
- **WHEN** 使用者在 `- [ ] 文字` 或 `- [x] 文字` 行尾按下 Enter
- **THEN** 系統在新行自動插入 `- [ ] ` 前綴，游標定位於前綴之後

#### Scenario: 空前綴行 Enter 結束輸入
- **WHEN** 使用者在只有 `- [ ] `（無文字）的行按下 Enter
- **THEN** 系統移除該空前綴行，不再繼續插入新前綴

#### Scenario: 儲存時解析 markdown
- **WHEN** 使用者點擊 Save 按鈕
- **THEN** 系統解析 textarea 內容，只處理符合 `/^- \[([ xX])\] (.+)$/` 的行，格式不符的行靜默忽略，將結果送至後端同步

#### Scenario: 取消時丟棄變更
- **WHEN** 使用者點擊 Cancel 按鈕
- **THEN** 系統丟棄 textarea 本地狀態，切換回 UI 模式，不呼叫後端

### Requirement: ChecklistBlock 模式切換
前端 SHALL 在每個 checklist 區塊 header 提供切換按鈕，讓使用者在 Markdown 模式與 UI 模式之間切換。

#### Scenario: 切換至 Markdown 模式
- **WHEN** 使用者點擊 checklist header 的 Markdown 模式切換按鈕
- **THEN** DnD 項目列表與新增表單隱藏，顯示 ChecklistMarkdownEditor

#### Scenario: 切換回 UI 模式（儲存後）
- **WHEN** 使用者在 Markdown 模式點擊 Save 且後端同步成功
- **THEN** 系統切換回 UI 模式，顯示更新後的項目列表

#### Scenario: 切換回 UI 模式（取消）
- **WHEN** 使用者在 Markdown 模式點擊 Cancel
- **THEN** 系統切換回 UI 模式，項目列表不變

### Requirement: Markdown 解析工具函式
前端 SHALL 提供兩個 pure function 用於 markdown 與 item 資料的互轉。

#### Scenario: itemsToMarkdown 轉換
- **WHEN** 傳入已排序的 ChecklistItem 陣列
- **THEN** 回傳每項以 `- [ ] text`（completed=false）或 `- [x] text`（completed=true）格式的字串，每行一項

#### Scenario: markdownToItems 解析
- **WHEN** 傳入多行 markdown 字串
- **THEN** 回傳只符合 `/^- \[([ xX])\] (.+)$/` 的行解析結果 `{text, completed}[]`，不符合的行靜默忽略
