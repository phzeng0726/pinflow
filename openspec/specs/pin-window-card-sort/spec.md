## ADDED Requirements

### Requirement: 用戶可拖拉重排 PinWindow 卡片順序
PinWindow 的卡片清單 SHALL 支援拖拉排序。每張卡片 SHALL 顯示可見的拖曳手柄（hover 時顯示），用戶可按住手柄拖曳卡片到新位置。

#### Scenario: 拖曳卡片到新位置
- **WHEN** 用戶按住卡片的 grip handle 並拖曳超過 5px
- **THEN** 卡片進入拖曳狀態（透明度降低），顯示拖曳預覽
- **THEN** 放開後卡片移至目標位置，清單即時更新

#### Scenario: 點擊操作不觸發拖曳
- **WHEN** 用戶點擊卡片上的按鈕（Unpin、Edit、Column selector）
- **THEN** 不觸發拖曳行為，按鈕正常執行其功能

### Requirement: 自訂排序持久化至 localStorage
PinWindow 的卡片排序 SHALL 以 card ID 陣列形式儲存於 localStorage（key: `pinflow:pinOrder`），app 重啟後 SHALL 還原為上次排序。

#### Scenario: 重啟後還原排序
- **WHEN** 用戶拖拉調整卡片順序後關閉並重新開啟 PinWindow
- **THEN** 卡片以上次儲存的順序顯示

#### Scenario: localStorage 不存在時的預設行為
- **WHEN** `pinflow:pinOrder` 不存在於 localStorage（首次使用）
- **THEN** 卡片以 API 回傳順序顯示

### Requirement: 新釘選卡片附加至清單末尾
`pinflow:pinOrder` 中不存在的卡片（新釘選的卡片）SHALL 附加至清單末尾。

#### Scenario: 新卡片出現在末尾
- **WHEN** 用戶在 Board 頁面釘選新卡片後切換回 PinWindow
- **THEN** 新卡片顯示在現有清單末尾，不影響其他卡片的排序

### Requirement: 已解除釘選的卡片 ID 不影響排序
儲存於 localStorage 的 card ID 若已不在釘選清單中，SHALL 被忽略，不影響其他卡片的順序計算。

#### Scenario: 解除釘選後排序正常
- **WHEN** 用戶解除某卡片的釘選後再次調整其他卡片順序
- **THEN** 已解除釘選的 ID 不造成任何排序錯誤或 UI 異常
