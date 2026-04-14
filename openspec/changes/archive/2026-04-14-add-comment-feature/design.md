## Context

PinFlow 是單機桌面 App，採用 file-based JSON workspace 儲存。現有的 Checklist 已採用「嵌入 card JSON」策略，並透過 FileStore 維護 in-memory 反向索引。本次新增 Comment 功能，並引入 workspaceId 以追蹤留言來源。

## Goals / Non-Goals

**Goals:**
- 在卡片上支援留言的新增、編輯、刪除
- workspaceId 自動生成並持久化於 manifest.json
- Comment 記錄 authorId（workspaceId），前端暫不顯示
- CardDetailDialog 左右分割，右側為 CommentSection

**Non-Goals:**
- 多使用者登入 / 身份驗證
- 前端顯示作者名稱或頭像
- Comment 分頁或搜尋
- 即時同步（WebSocket）

## Decisions

### 1. Comment 嵌入 card JSON（不另開獨立檔案）

與 Checklist 策略一致：Comment 存於 `card-N.json` 的 `comments` 欄位。

**理由**：桌面單機 App 的留言量不會觸及效能瓶頸；保持架構一致性；不需要新的檔案索引邏輯。

**放棄的替代方案**：獨立 `comments.json` 檔案——增加 I/O 複雜度，對桌面 App 無明顯收益。

---

### 2. workspaceId 存於 manifest.json，首次建立時生成

`store.New()` 載入 manifest 時，若 `workspaceId` 為空則呼叫 `uuid.New()` 並寫回 manifest。後端所有建立 comment 的路徑由 `FileStore.WorkspaceID()` 取得，不從 request 接收。

**理由**：`github.com/google/uuid` 已是既有 dependency；manifest 是 workspace 全域設定的唯一來源。

---

### 3. 後端 Comment 反向索引：commentToCard

FileStore 新增 `commentToCard map[uint]uint`，在 `loadCard()` / `deleteCard()` 時維護（與 `checklistToCard` 相同模式）。

**理由**：PATCH/DELETE `/comments/:id` 需要快速找到對應 card，才能讀取並更新 card JSON。

---

### 4. Comment 排序：前端 createdAt 降冪（最新在上）

後端 API 回傳不強制排序，由前端在 CommentSection 渲染時依 `createdAt` 降冪排列。

**理由**：留言通常最新最重要；前端排序成本低，且不影響儲存結構。

---

### 5. Edit UX：inline 替換

點擊 Edit 後，comment 文字以 `<textarea>` 取代，並出現 Save / Cancel 按鈕。Save 呼叫 PATCH API，成功後回到顯示模式。

**理由**：與使用者描述需求一致；不需要額外 Modal/Popover。

---

### 6. Delete UX：Popover 確認（非 AlertDialog）

使用 shadcn `<Popover>` 元件，點擊 Delete 後在原位展開小確認框，有「確定」和「取消」按鈕。

**理由**：留言刪除屬於局部操作，AlertDialog 的全螢幕遮罩過重；與 TagsPopover 的 delete-confirm view 模式一致。

---

### 7. CardDetailDialog 佈局：flex-row，左側 flex-1，右側固定寬度

```
DialogContent: max-w-4xl, max-h-[90vh], flex flex-col
├── 固定標題列（現有）
└── flex flex-row flex-1 overflow-hidden
    ├── 左側: flex-1, overflow-y-auto, p-4        ← 現有所有內容
    └── 右側: w-72 或 w-80, border-l, flex flex-col ← CommentSection
```

右側內部：上方輸入區（固定），下方留言列表（overflow-y-auto，flex-1）。

**理由**：左右各自獨立捲動；Dialog 不超出視窗可視範圍。

## Risks / Trade-offs

- **Card JSON 膨脹**：留言量大時 card 檔案變大，影響讀寫效能。→ 單機桌面 App 短期不是問題，未來可考慮分離儲存。
- **workspaceId 無驗證**：任何人可修改 manifest.json 偽造 authorId。→ 目前屬設計內，正式多人系統需加驗證層。
- **向下相容**：舊 card JSON 無 `comments` 欄位。→ Go JSON 反序列化時 missing field 預設為零值（空 slice），無需 migration。

## Migration Plan

1. 後端 `store.New()` 自動補齊 workspaceId（存在則跳過）
2. 舊 card JSON 無需手動修改，缺少 `comments` 欄位時自動當作空陣列
3. 無需 rollback 策略（純新增欄位，不破壞現有資料）

## Open Questions

- 右側 CommentSection 寬度：`w-72`（288px）或 `w-80`（320px）？→ 實作時依視覺調整。
