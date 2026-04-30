## Why

PinWindow 的釘選卡片清單固定以後端回傳順序顯示，用戶無法依個人優先順序排列，降低了 PinWindow 作為快速任務面板的實用性。

## What Changes

- PinWindow 卡片清單支援拖拉排序（`@dnd-kit/sortable`）
- 每張 `PinnedCardItem` 顯示 grip handle，hover 時可見
- 自訂排序以 `localStorage` 本地持久化，不需後端變更
- 新釘選的卡片預設附加至清單末尾

## Capabilities

### New Capabilities
- `pin-window-card-sort`: PinWindow 內卡片拖拉排序，排序本地持久化

### Modified Capabilities
<!-- 無現有 spec 層級行為變更 -->

## Impact

- **前端：** 新增 `usePinDnd` hook；修改 `PinWindow.tsx`、`PinnedCardItem.tsx`
- **後端：** 無變更（排序為前端本地狀態）
- **依賴：** 使用既有 `@dnd-kit/core`、`@dnd-kit/sortable`（已安裝）
