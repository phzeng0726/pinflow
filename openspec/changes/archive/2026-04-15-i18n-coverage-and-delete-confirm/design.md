## Context

PinFlow 前端目前使用 `react-i18next`，i18n 覆蓋率約 90%。剩餘缺口有三類：

1. `lib/schemas.ts` 的 Zod 驗證訊息硬編碼中文字串（Zod 在宣告時 fix 住訊息，無法直接使用執行期 `t()`）
2. 7 個 mutation hook 的 `toast.success/error` 直接傳入硬編碼中文訊息
3. `zh-TW.json` 有 6 個 key 值仍為英文（如 `priority.title: "Priority"`）

此外，三個破壞性刪除操作（Board、Column、Checklist group）無確認提示，誤刪後無法還原。

## Goals / Non-Goals

**Goals:**
- 補齊 locale JSON 缺漏翻譯，整個 UI 在切換語系後不應出現任何硬編碼中英文字串
- 統一英文按鈕為 Sentence case（`Remove` 而非 `REMOVE`）
- Zod 驗證訊息透過 i18n 輸出，支援語系切換
- Mutation toast 訊息透過 i18n 輸出
- 刪除 Board、Column、Checklist group 前顯示確認框

**Non-Goals:**
- 品牌名 `PinFlow`、`LocaleToggle` 的 `EN`/`中` 標示不 i18n
- Unpin、從 card 移除 tag、移除 dependency、移除 tag 顏色、刪除單一 checklist item 不加確認框
- 代碼結構層面重構（拆檔、改目錄）
- Backend 任何變動

## Decisions

### D1：Zod Schema 改為 Factory 函式

**決定**：`lib/schemas.ts` 改為 export factory 函式（`createBoardSchema(t)`），呼叫端在元件內 `useMemo(() => createXxxSchema(t), [t])` 建立實例。

**替代方案 B**：保持 schema 為常數，錯誤訊息存 i18n key，在顯示錯誤時套 `t(message)`。

**棄用理由**：方案 B 要求每個表單元件都記得在顯示 `errors.xxx.message` 時加 `t()`，容易遺漏；方案 A 錯誤訊息在產生時即為可顯示字串，符合「最小化呼叫端的心智負擔」原則。

---

### D2：確認框的 UI 元件選擇

**決定**：依位置選擇不同元件：
- **Dialog 外部**（BoardListPage、ColumnHeader）→ `AlertDialog`
- **Dialog 內部**（ChecklistBlock）→ `Popover`

**理由**：AlertDialog 在 Dialog 內部使用時，z-index 與 focus trap 會衝突；Popover 較輕量且不會搶奪焦點。現有程式碼（`CardContextMenu.tsx` AlertDialog、`CommentSection.tsx` Popover）已有可參考的範本。

---

### D3：Locale JSON 結構 — 新增三個 namespace

**決定**：新增 `confirm`、`validation`、`toast` 三個頂層 namespace，不改動現有 namespace 結構。`toast` 按 domain 分組（`toast.board`、`toast.card` 等）。

**理由**：集中管理，便於查找；避免將確認文案散落在 `common` 或各 domain namespace 中。

---

### D4：移除重複的 `priority.remove` / `storyPoint.remove`

**決定**：從兩個 locale JSON 中刪除 `priority.remove` 和 `storyPoint.remove`，對應元件改用 `common.remove`。

**理由**：值與 `common.remove` 完全相同，保留只會造成維護負擔。

## Risks / Trade-offs

- **Zod factory 影響範圍廣**：有 ~7 個呼叫端需要同步更新。若有遺漏，TypeScript 會在編譯時報錯（型別不符），不會靜默失敗。→ 以 `pnpm build` 作為驗收門檻。
- **DropdownMenu + AlertDialog 的 unmount 問題**：DropdownMenu item 觸發 AlertDialog 時，若 item 直接呼叫 setState，DropdownMenu 關閉後會 unmount item，可能提前關閉 AlertDialog。→ 使用 `onSelect={e => { e.preventDefault(); setOpen(true) }}` 防止預設行為，讓 AlertDialog 完整渲染。
- **`useMemo` 依賴 `t`**：`t` 是穩定的引用（react-i18next 保證），但仍需在 deps 陣列中列出，否則 lint 會警告。

## Migration Plan

1. 先更新 locale JSON（新增 namespace、修正既有 key），確保 key 存在
2. 再修改 schemas.ts（factory 化），同步更新所有呼叫端
3. 再修改 mutation hooks（加入 `useTranslation`）
4. 最後新增確認框（UI 改動，依賴 locale key 存在）
5. 執行 `pnpm build` 確保無型別錯誤
6. 執行 `pnpm test` 確保無回歸
7. 手動驗證語系切換、toast 文案、確認框行為

Rollback：所有改動限於前端 locale + component 層，無後端或資料結構異動，直接 revert commit 即可。

## Open Questions

（無）
