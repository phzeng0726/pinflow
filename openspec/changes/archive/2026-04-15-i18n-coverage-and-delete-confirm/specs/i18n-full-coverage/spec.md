## ADDED Requirements

### Requirement: Locale JSON 覆蓋所有 UI 字串
`zh-TW.json` 與 `en-US.json` SHALL 覆蓋所有 UI 可見字串，包含按鈕文字、表單錯誤訊息、toast 通知及確認框文案。不得有 key 值仍為另一語言的字串（如 `zh-TW.json` 的 `priority.title` 值為 `"Priority"`）。

#### Scenario: zh-TW 遺漏翻譯修復
- **WHEN** 使用者切換語系至 `zh-TW`
- **THEN** `priority.title`、`priority.remove`、`storyPoint.title`、`storyPoint.remove`、`schedule.title`、`tags.title` 均顯示中文值，不再顯示英文

#### Scenario: en-US Sentence case 統一
- **WHEN** 使用者切換語系至 `en-US`
- **THEN** Remove 按鈕文字顯示為 `"Remove"`，而非 `"REMOVE"`

---

### Requirement: Locale JSON 包含 confirm namespace
兩個 locale 檔案 SHALL 包含 `confirm` namespace，提供刪除確認框的標題與描述文案，支援 `{{name}}` 插值。

#### Scenario: confirm namespace 存在
- **WHEN** 程式碼呼叫 `t('confirm.deleteBoardTitle')`
- **THEN** 回傳對應語系的字串，不得回傳 key 本身

#### Scenario: 插值正確替換
- **WHEN** 程式碼呼叫 `t('confirm.deleteBoardDesc', { name: 'My Board' })`
- **THEN** 回傳的字串中 `{{name}}` 被替換為 `"My Board"`

---

### Requirement: Locale JSON 包含 validation namespace
兩個 locale 檔案 SHALL 包含 `validation` namespace，提供所有 Zod schema 驗證失敗時的錯誤訊息。

#### Scenario: validation namespace 存在
- **WHEN** 使用者送出空白的 Board name 表單
- **THEN** 表單欄位下方顯示對應語系的錯誤訊息（非 i18n key 字串）

#### Scenario: 語系切換後驗證訊息同步更新
- **WHEN** 使用者切換語系後再次送出空白表單
- **THEN** 錯誤訊息顯示為新語系的文字

---

### Requirement: Locale JSON 包含 toast namespace
兩個 locale 檔案 SHALL 包含 `toast` namespace，按 domain 分組（`board`、`card`、`column`、`checklist`、`comment`、`dependency`、`tag`），每個 domain 提供操作成功與失敗的訊息 key。

#### Scenario: toast namespace 存在
- **WHEN** 使用者成功建立 Board
- **THEN** toast 顯示對應語系的建立成功訊息

#### Scenario: 操作失敗時顯示對應語系的錯誤 toast
- **WHEN** API 回傳錯誤，mutation 進入 `onError`
- **THEN** toast 顯示對應語系的失敗訊息

---

### Requirement: Zod Schema 使用 factory 函式支援 i18n
`lib/schemas.ts` SHALL 將各 schema 改為 factory 函式（`createXxxSchema(t: TFunction)`），接收 `t` 函式並回傳帶有 i18n 錯誤訊息的 Zod schema 實例。呼叫端 SHALL 在元件內使用 `useMemo(() => createXxxSchema(t), [t])` 建立實例。

#### Scenario: Zod 驗證訊息跟隨語系
- **WHEN** 使用者在 `zh-TW` 語系下送出空白 Board name
- **THEN** Zod 錯誤訊息顯示中文（例如「請輸入看板名稱」）

#### Scenario: 切換語系後 schema 重新建立
- **WHEN** 使用者切換語系至 `en-US` 後送出空白 Board name
- **THEN** Zod 錯誤訊息顯示英文（例如「Please enter a board name」）

---

### Requirement: Mutation Hook 使用 i18n toast 訊息
7 個 mutation hook（board、card、column、checklist、comment、dependency、tag）SHALL 使用 `useTranslation()` 取得 `t`，並在 `onSuccess` / `onError` callback 中呼叫 `t('toast.<domain>.<key>')` 取代硬編碼字串。

#### Scenario: 成功 toast 顯示對應語系訊息
- **WHEN** 使用者在 `zh-TW` 語系下建立 Card，API 回傳成功
- **THEN** toast 顯示中文成功訊息

#### Scenario: 失敗 toast 顯示對應語系訊息
- **WHEN** 使用者在 `en-US` 語系下刪除 Column，API 回傳錯誤
- **THEN** toast 顯示英文失敗訊息

---

### Requirement: 移除重複的 priority.remove 與 storyPoint.remove
`en-US.json` 與 `zh-TW.json` SHALL 不再包含 `priority.remove` 和 `storyPoint.remove` key。對應元件 SHALL 改用 `common.remove`。

#### Scenario: PriorityPopover 使用 common.remove
- **WHEN** 使用者開啟 PriorityPopover 並已設定優先度
- **THEN** 移除按鈕文字來自 `common.remove`，在兩語系下均正確顯示

#### Scenario: StoryPointPopover 使用 common.remove
- **WHEN** 使用者開啟 StoryPointPopover 並已設定點數
- **THEN** 移除按鈕文字來自 `common.remove`，在兩語系下均正確顯示
