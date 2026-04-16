## Context

Checklist 項目目前透過 `POST /api/v1/checklists/:id/items` 逐筆建立，UI 也是一次只能新增一項。儲存格式為嵌入式 JSON（`card.json` 內的 `checklists[].items[]`），無關聯式資料庫，替換整個 items slice 是原子操作。

## Goals / Non-Goals

**Goals:**
- 在每個 checklist 區塊新增可切換的 Markdown 編輯模式
- 實作專用 `ChecklistMarkdownEditor`，支援 `- [ ] / - [x]` 語法與 Enter 自動續行
- 後端新增 `PUT /checklists/:id/items` 進行智慧 diff 同步（盡量保留既有 item ID）
- 使用者可隨時在 Markdown 模式與 UI 模式之間自由切換

**Non-Goals:**
- 不支援 markdown 以外的語法（無 heading、bold、link 等）
- 不跨 checklist 移動項目
- 不做 real-time 多人協同

## Decisions

### 決策 1：後端 Smart Diff Sync vs 全量替換

**選擇**：Smart Diff Sync（以文字做字串比對）

因為 Markdown 中不帶 item ID，需靠其他方式維持 ID 穩定性。文字比對是最直觀的方案：
- 同文字 → 保留既有 ID，只更新 `completed` 與 `position`
- 新出現的文字 → 分配新 ID 建立
- 消失的文字 → 刪除
- 重複文字 → 按順序配對（textPool map，同 key 的 value 是 queue）

**捨棄**：全量替換（每次儲存重建所有 ID）— 雖實作更簡單，但未來如需 activity log 或 item permalink 會造成問題。

### 決策 2：專用 ChecklistMarkdownEditor vs 通用 textarea

**選擇**：專用元件（非通用 `<Textarea>`）

Checklist markdown 模式有高度特化的鍵盤行為（Enter 自動插入前綴、空前綴行 Enter 結束），這些邏輯不適合放進通用 textarea 或現有 `MarkdownEditor`（後者是 Lexical WYSIWYG，過於複雜）。專用元件保持職責單一，也容易獨立測試。

**捨棄**：重用現有 `MarkdownEditor` — 功能過多、無法輕易攔截 Enter 鍵行為。

### 決策 3：Diff 邏輯放後端 vs 前端

**選擇**：後端實作 diff，前端只送 `[{text, completed}]`

- 後端：單一 HTTP 請求、原子寫入，無 partial failure 風險
- 前端：需多次 API 呼叫，有競態條件與部分失敗問題

### 決策 4：Markdown 解析為 Pure Functions

`itemsToMarkdown` 與 `markdownToItems` 實作為純函式，放在 `checklistMarkdown.ts`，方便單元測試。格式不符的行靜默忽略（只處理 `/^- \[([ xX])\] (.+)$/`）。

## Risks / Trade-offs

- **文字重複配對的歧義**：若兩個 item 文字完全相同，按 queue 順序配對。使用者若調換相同文字的行，ID 可能意外交換，但實際影響極小（文字相同就算交換也感知不到差異）。
- **切換模式時的未儲存狀態**：Cancel 直接丟棄本地 textarea 內容，不提示確認。行為符合直覺（使用者主動點 Cancel），但若用戶誤操作可能遺失大量輸入 → 可接受，符合現有 UI 模式的慣例。
- **後端 validation 422 的 UX**：任何一個 item 文字超過 500 字元整批請求失敗，前端只顯示 toast error，無法指出哪一行有問題 → 可接受，500 字元上限在實務上極少觸發。
