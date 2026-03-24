## Context

卡片移入自動釘選 column 時，後端 `CardService.MoveCard` 會自動釘選卡片。但移出時後端不處理取消釘選，導致卡片持續顯示在 Pin 面板上。此行為對用戶不透明，容易造成混淆。

目前 drag-end 流程（`BoardPage`）：

1. dnd-kit 觸發 `onDragEnd`
2. 前端呼叫 `moveCard` API（後端自動釘選）
3. TanStack Query 失效對應 query keys

本變更純屬前端修改，不需要新增後端 API。

## Goals / Non-Goals

**Goals:**

- 卡片移出自動釘選 column 且目前為已釘選狀態時，顯示確認 dialog
- 用戶選擇「移出並取消釘選」時，在 move 完成後額外呼叫 PATCH /cards/:id/pin
- 用戶選擇「僅移出」時，不改變釘選狀態
- Dialog 僅在「來源為 auto-pin column」且「卡片目前 isPinned=true」時出現

**Non-Goals:**

- 移入自動釘選 column 的行為不變（後端繼續自動釘選）
- 不修改後端 API
- 不處理卡片非 pinned 狀態下移出 auto-pin column 的情境（無需 dialog）

## Decisions

### 決策 1：先 move 後 dialog（post-commit dialog）

**選項 A：先顯示 dialog，用戶確認後再 move**

- 優點：操作更原子，感覺一致
- 缺點：dnd-kit 動畫已完成，drag-end 後延遲 move 需要額外的 UI 狀態控制，複雜度高

**選項 B（採用）：先執行 move，move 成功後顯示 dialog 詢問是否取消釘選**

- 優點：move 邏輯不變，dialog 只是附加步驟，實作簡單
- 缺點：用戶先看到卡片已移動，再看 dialog，視覺上有輕微延遲感
- 理由：複雜度低，且兩步驟分離更易於維護

### 決策 2：dialog 狀態管理放在 BoardPage

Dialog 所需狀態（`pendingUnpinCard`）存在 `BoardPage` local state，不放 Zustand。理由：此狀態為一次性暫態，無需跨元件共享。

### 決策 3：複用現有 shadcn AlertDialog

使用既有的 `AlertDialog` 元件（已安裝），不另建新元件，符合最小改動原則。

## Risks / Trade-offs

- **[Risk] 競態條件**：move mutation 尚未完成時用戶關閉 dialog → Mitigation：dialog 在 move mutation `onSuccess` callback 內才觸發，確保 move 已完成
- **[Risk] column 資料不含 autoPin**：drag-end 時需要 column 的 `autoPin` 欄位 → Mitigation：確認 `useColumns` hook 回傳資料包含此欄位；若無，補充 column type
- **[Risk] 取消釘選失敗**：unpin API 失敗時用戶無感知 → Mitigation：顯示 toast 錯誤提示（與現有 card mutation 錯誤處理一致）
