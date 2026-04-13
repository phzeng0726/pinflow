## Context

Card 目前已有 `StoryPoint`（`*int`，選填）欄位，前端以 `StoryPointPopover.tsx` 實作 Popover 選取 UI，後端透過 PATCH `/api/v1/cards/:id` 更新。Priority 功能需求與 SP 高度相似，差異在於：SP 是自由數字集合，Priority 是固定五級列舉（1-5）。

## Goals / Non-Goals

**Goals:**
- 後端 Card model 新增 `Priority *int`（1-5，null = 未設定）
- PATCH 端點接受 `priority` 欄位並驗證範圍（1-5 或 null）
- 前端新增 `PriorityPopover.tsx`，仿照 `StoryPointPopover.tsx` 結構
- CardDetailDialog 在 Story Points 與 Tags 之間插入 Priority 觸發按鈕

**Non-Goals:**
- 不在看板卡片（CardItem）上顯示 Priority badge（此為後續考量）
- 不支援自訂優先等級名稱
- 不依 Priority 排序或篩選卡片

## Decisions

### D1：Priority 以整數（1-5）儲存，不用字串列舉

**選擇：** `*int`（1=Highest … 5=Low），與 `StoryPoint` 型別一致。

**理由：** 整數易於排序、可擴充等級數量，且 JSON 序列化簡單。若改用字串列舉，往後新增/調整等級需要 migration。

**捨棄方案：** `string` enum — 需額外 mapping 層，且前後端 enum 定義需同步維護。

### D2：前端元件命名為 PriorityPopover，與 StoryPointPopover 對稱

**選擇：** 新建 `PriorityPopover.tsx`，不擴充現有元件。

**理由：** Priority 等級為固定 label（Highest/Critical/High/Medium/Low），渲染邏輯與 SP 數字格不同，拆開更清楚。

### D3：觸發按鈕顯示等級縮寫（P1-P5），無值時顯示 `+`

**理由：** 與 SP 按鈕行為一致；縮寫在小尺寸按鈕上仍可辨識。

### D4：Popover 列表改為垂直清單，而非格線

**理由：** Priority 只有 5 個選項且帶有文字 label，垂直清單比 5 格 grid 更易閱讀。

## Risks / Trade-offs

- **後端驗證範圍（1-5）** → 若前端傳入 0（清除），後端需特別處理（0 或 null 皆視為清除）
  → 緩解：API 文件明確規定 `priority: 0` 或 `null` 皆清除，validator 允許 0

- **現有測試** → 新增欄位不影響現有測試，但需確認 `UpdateCardRequest` struct tag 不破壞 JSON binding
  → 緩解：欄位加 `omitempty` tag，無傳入時保持 null

## Migration Plan

1. 後端加欄位 → 現有 JSON 檔無此欄位，讀取時 Go 自動補零值（nil pointer）→ 無需資料 migration
2. 前端部署後立即可用，舊有卡片 priority 顯示為 `+`（未設定）
3. Rollback：移除前端元件 + 後端欄位即可，無 DB schema 變更

## Open Questions

- 無
