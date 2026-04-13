## 1. Backend — Model & DTO

- [x] 1.1 在 `backend/model/card.go` 的 `Card` struct 新增 `Priority *int` 欄位（json tag: `priority`）
- [x] 1.2 在 `backend/dto/card_dto.go` 的 `UpdateCardRequest` 新增 `Priority *int` 欄位（json tag: `priority`）
- [x] 1.3 在 `backend/dto/card_dto.go` 的 `CardResponse` 新增 `Priority *int` 欄位（json tag: `priority`）

## 2. Backend — Repository & Service

- [x] 2.1 確認 `backend/repository/` 的 card repository 在讀寫 JSON 時自動帶入 `Priority`（若用 struct 整體序列化則無需額外修改，確認即可）
- [x] 2.2 在 `backend/service/` 的 `UpdateCard` 方法，處理 `Priority` 欄位更新邏輯：`priority = 0` 或 `null` 皆清除為 nil；1-5 正常存入；超出範圍回傳錯誤

## 3. Backend — Handler & Swagger

- [x] 3.1 在 PATCH `/api/v1/cards/:id` 的 handler 加入 `priority` 欄位的範圍驗證（允許 0 作為清除，1-5 為有效值，其他回傳 400）
- [x] 3.2 更新 Swagger godoc 註解，反映 `priority` 欄位（UpdateCardRequest 與 CardResponse）
- [x] 3.3 在 `backend/` 執行 `swag init` 重新產生 Swagger 文件

## 4. Frontend — Types & API

- [x] 4.1 在 `frontend/src/types/` 的 Card interface 新增 `priority: number | null`
- [x] 4.2 在 `frontend/src/types/` 的 UpdateCardForm interface 新增 `priority?: number`（選填）
- [x] 4.3 確認 `frontend/src/lib/api/cards.ts` 的 `updateCard` 函式已透過 form 物件傳遞 `priority`（無需額外修改若已泛用傳遞）

## 5. Frontend — PriorityPopover 元件

- [x] 5.1 建立 `frontend/src/pages/board-detail/components/cards/PriorityPopover.tsx`
- [x] 5.2 定義 `PRIORITIES` 常數陣列：`[{value: 1, label: 'Highest'}, {value: 2, label: 'Critical'}, {value: 3, label: 'High'}, {value: 4, label: 'Medium'}, {value: 5, label: 'Low'}]`
- [x] 5.3 實作觸發按鈕：有值時顯示 `P{n}`（filled style），無值時顯示 `+` icon（outline style）
- [x] 5.4 實作 Popover 內容：垂直清單五個選項 + 標題 "Priority" + 底部 REMOVE 按鈕（僅在有值時顯示）
- [x] 5.5 實作選取邏輯：點選已選中的選項 → `updateCard` with `priority: 0`；點選其他 → `updateCard` with 對應值；點選 REMOVE → `updateCard` with `priority: 0`；操作後關閉 popover

## 6. Frontend — CardDetailDialog 整合

- [x] 6.1 在 `CardDetailDialog.tsx` import `PriorityPopover`
- [x] 6.2 在 Story Points 區塊下方、Tags 區塊上方插入 Priority 區塊（含標籤文字 "Priority" 與 `<PriorityPopover>` 元件）
- [x] 6.3 將 `boardId` 與 `card` props 正確傳入 `PriorityPopover`
