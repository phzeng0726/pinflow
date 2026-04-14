# Spec: locale-switching

## Purpose

定義 PinFlow 應用程式的多語系切換功能，支援繁體中文（zh-TW）與美式英文（en-US）兩種顯示語系，並確保語系選擇可持久化與跨頁面保持一致。

---

## Requirements

### Requirement: 語系切換

系統 SHALL 支援繁體中文（zh-TW）與美式英文（en-US）兩種顯示語系，預設語系為 en-US。

#### Scenario: 預設語系為英文

- **WHEN** 使用者首次開啟應用程式（無 localStorage 記錄）
- **THEN** 所有 UI 文字以美式英文顯示

#### Scenario: 切換至繁體中文

- **WHEN** 使用者點擊 header 的語系切換按鈕（顯示 `EN`）
- **THEN** 按鈕標籤變更為 `中`，頁面所有 UI 文字即時切換為繁體中文，無需重新整理

#### Scenario: 切換至英文

- **WHEN** 使用者點擊 header 的語系切換按鈕（顯示 `中`）
- **THEN** 按鈕標籤變更為 `EN`，頁面所有 UI 文字即時切換為美式英文，無需重新整理

---

### Requirement: 語系持久化

系統 SHALL 將使用者選擇的語系持久化至 localStorage，key 為 `pinflow-locale`。

#### Scenario: 重新整理後語系保持

- **WHEN** 使用者切換語系後重新整理頁面
- **THEN** 頁面載入後維持上次選擇的語系，不重置為預設值

#### Scenario: 多頁面間語系一致

- **WHEN** 使用者在 BoardListPage 切換語系，再導航至 BoardPage
- **THEN** BoardPage 同樣顯示切換後的語系

---

### Requirement: 語系切換 UI

系統 SHALL 在 BoardListPage 與 BoardPage 的 header 區域各提供一個語系切換按鈕，位於 theme toggle 旁。

#### Scenario: 顯示當前語系狀態

- **WHEN** 當前語系為 en-US
- **THEN** 按鈕顯示 `EN` 文字

#### Scenario: 顯示切換後語系狀態

- **WHEN** 當前語系為 zh-TW
- **THEN** 按鈕顯示 `中` 文字

#### Scenario: Tooltip 說明

- **WHEN** 使用者 hover 語系切換按鈕
- **THEN** 顯示 Tooltip，說明點擊後將切換至哪種語系

---

### Requirement: 翻譯涵蓋所有 UI 文字

系統 SHALL 對所有 UI 可見文字（按鈕 label、placeholder、tooltip、empty state、錯誤訊息、對話框內容）提供 zh-TW 與 en-US 兩種翻譯。

#### Scenario: 翻譯 key 缺漏時 fallback

- **WHEN** en-US 翻譯檔中某個 key 不存在
- **THEN** 系統顯示 zh-TW 的對應文字（i18next fallbackLng 機制）

#### Scenario: 複數形正確顯示

- **WHEN** 顯示欄位數量（如 "3 columns"）或卡片數量
- **THEN** en-US 依據數量顯示正確複數形（"1 column" / "2 columns"）；zh-TW 使用統一量詞形式

---

### Requirement: date-fns 相對時間語系同步

系統 SHALL 使 CommentSection 的相對時間顯示（`formatDistanceToNow`）跟隨當前語系。

#### Scenario: 中文語系下的相對時間

- **WHEN** 當前語系為 zh-TW 且留言有相對時間顯示
- **THEN** 顯示中文格式（如「3 分鐘前」）

#### Scenario: 英文語系下的相對時間

- **WHEN** 當前語系為 en-US 且留言有相對時間顯示
- **THEN** 顯示英文格式（如「3 minutes ago」）
