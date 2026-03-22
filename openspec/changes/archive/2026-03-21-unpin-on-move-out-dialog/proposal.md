## Why

當卡片被移出「自動釘選」column 時，系統不會自動取消釘選，導致卡片殘留在 Pin 面板上，與用戶的實際工作狀態脫節。需要在移出時提示用戶是否一併取消釘選，讓用戶能明確掌控釘選狀態。

## What Changes

- 在卡片從自動釘選 column 移出時，前端攔截 move 操作並彈出確認 dialog
- Dialog 提供兩個選項：「僅移出」與「移出並取消釘選」
- 僅在來源 column 有 `auto_pin: true` 且卡片目前為已釘選狀態時才顯示 dialog
- 不影響移入自動釘選 column 的行為（移入仍自動釘選）

## Capabilities

### New Capabilities

- `move-out-unpin-dialog`: 移出自動釘選 column 時詢問是否取消釘選的確認 dialog

### Modified Capabilities

- `card-management`: 卡片移動流程新增「移出自動釘選 column」的互動確認步驟

## Impact

- `frontend/src/features/board/` — BoardPage 的 drag-end 或 move card 邏輯需攔截此情境
- `frontend/src/lib/api.ts` — 可能需要在 move 後額外呼叫 pin PATCH
- `frontend/src/hooks/useCards.ts` 或相關 mutation hooks
- 無後端 API 變更（移出 + 取消釘選各自呼叫現有 endpoint）
