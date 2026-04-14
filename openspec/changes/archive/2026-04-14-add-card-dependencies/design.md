## Context

PinFlow 以 JSON file-based storage 儲存所有資料（boards、columns、cards、tags），並透過 FileStore in-memory map + 寫入的模式保持一致性。Tags 功能是目前最接近的先例：全域 `tags.json` + 每張 card file 的 `tag_ids` array。

Dependency 本質是「卡片與卡片之間的有向邊」，與 tag 的「全域物件 + 卡片附加」不同，需要額外考慮：
- 兩端都是 card（不是 card + 外部物件）
- 有方向性：A blocks B ≠ B blocks A
- 需要從任一端查詢（我 blocks 誰、誰 blocks 我）
- 刪除 card 時需清理相關 dependency

## Goals / Non-Goals

**Goals:**
- 新增卡片間的 dependency 關係（建立、列出、移除）
- 支援 4 種 canonical 關係型別（blocks、parent_of、duplicates、related_to）
- 提供跨 board 卡片搜尋（by title）以選擇目標卡片
- 在 CardDetailDialog 顯示並可編輯 dependencies（兩步驟 Popover UI）
- 在 board 小卡 meta 列顯示 dependency 數量

**Non-Goals:**
- Dependency graph 視圖（下一階段）
- Circular dependency 偵測或阻止
- 依 dependency 狀態自動更新卡片狀態（e.g., blocked card 自動標示）
- Dependency 的備注或說明欄位

## Decisions

### 1. 集中式 `dependencies.json` vs 嵌入 card file

**選擇：集中式 `dependencies.json`**

Dependency 是雙向邊，若存在每張 card file 上，需同時維護兩端（A blocks B → A 的 file 記錄 outgoing，B 的 file 記錄 incoming），刪除或更新時需原子性地寫入兩個檔案，複雜且易出錯。

集中式與 `tags.json` 同層級，由 `FileStore` 統一管理，單一寫入路徑，從任一 cardID 查詢只需 linear scan（卡片數量不大的看板 OK）。

`manifest.json` 新增 `dependencyIdSeq` 計數器以產生唯一 ID。

### 2. 4 種 canonical type，UI 層做 flip 轉換

**選擇：後端只儲存 4 種 canonical type（blocks、parent_of、duplicates、related_to），UI 的 6 個選項在前端送出時轉換方向**

| UI 選項 | 後端 from | 後端 to | type |
|---|---|---|---|
| Blocks | thisCard | target | blocks |
| Is blocked by | target | thisCard | blocks |
| Is parent to | thisCard | target | parent_of |
| Is child to | target | thisCard | parent_of |
| Duplicates | thisCard | target | duplicates |
| Is related to | thisCard | target | related_to |

前端 `styleConfig.ts` 的 `DEPENDENCY_RELATIONS` 設定每個 UI 選項的 `canonicalType` 和 `flip`（是否反轉 from/to）。顯示時再依「我是 from 還是 to」還原 UI label。

好處：後端邏輯單純，不需處理 "is_blocked_by" 型別；UI label 多樣性留在前端設定層。

`related_to` 對稱，列出時兩側都顯示「is related to」。

### 3. 跨 board 卡片搜尋：新增後端端點

**選擇：新增 `GET /api/v1/cards/search?q=&limit=` 端點**

前端若自行拉全部 boards 再過濾，需要多次請求且前端 cache 可能不含所有 board 資料。後端 FileStore 已有全部 cards 的 in-memory map，O(n) 掃描即可，結果附上 board/column meta（名稱），回傳 `CardSearchResponse[]`。

`/cards/search` 路由必須在 `/:id` 之前註冊（Gin 字面路由優先）。

### 4. dependencyCount 填入時機

**選擇：在 `CardService.GetCardDetail` 和 `BoardService` 組裝 cards 時，呼叫 `depRepo.CountByCard(cardID)` 填入**

不增加額外 API 請求，board 列表回傳時一次性填入所有卡片的 count。代價是每次拉 board 都會呼叫多次 CountByCard，但 FileStore 已有 in-memory map，O(n) 成本可接受。

### 5. Popover UI 設計

**選擇：兩步驟狀態機 popover，仿 TagsPopover 的 `view` state pattern**

```
type View = 'select-relation' | { mode: 'pick-card'; relation: DependencyRelationKey }
```

Step 1（select-relation）：6 個選項列表，各附圖示和說明文字。
Step 2（pick-card）：返回箭頭 + 搜尋輸入（debounced）+ 結果列表（顯示 title + board/column）+ 底部 sticky preview bar。

Preview bar 是關鍵設計：在使用者按下確認前，以一句話呈現「這張卡 → 關係 → 那張卡」，讓方向選錯的問題可被即時察覺（尤其 blocks 和 is blocked by 容易混淆）。

## Risks / Trade-offs

- **孤兒邊風險**（刪 card 後 dependency 殘留）→ 在 `FileStore.DeleteCard` 中先呼叫 `cleanDependenciesByCard(cardID)` 再刪 card，兩者在同一把 mutex 鎖內完成。
- **重複 dependency**（同 from+to+type 建立兩次）→ `FileStore.CreateDependency` 在寫入前檢查是否已存在，存在則回傳 conflict error（HTTP 409）。
- **自我引用**（A depends on A）→ `CreateDependency` 驗證 `fromCardID != toCardID`，否則回傳 400。
- **CountByCard 效能**：每次組裝 board 時對每張 card 呼叫一次。目前 in-memory，OK；若未來卡片量大可考慮在 FileStore 維護 count cache，但現階段過早優化。
- **related_to 重複方向**：`related_to` 對稱，但使用者可能從 A 建 "related to B"，再從 B 建 "related to A"，產生兩條邊。重複檢查策略：同時檢查 (from=A, to=B) 和 (from=B, to=A) 的同 type 是否存在，任一存在即視為重複。
