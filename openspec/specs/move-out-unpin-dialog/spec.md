## Requirements

### Requirement: 移出自動釘選 column 時顯示取消釘選確認 dialog

當已釘選的卡片從 `autoPin: true` 的 column 移動到其他 column 時，系統 SHALL 在 move 完成後顯示確認 dialog，詢問用戶是否一併取消釘選。

#### Scenario: 移出自動釘選 column 且卡片已釘選時觸發 dialog

- **WHEN** 用戶將 `isPinned: true` 的卡片從 `autoPin: true` 的 column 拖拉至其他 column
- **THEN** move API 呼叫成功後，系統顯示確認 dialog，提示「卡片已移出自動釘選欄位，是否同時取消釘選？」

#### Scenario: 卡片未釘選時不顯示 dialog

- **WHEN** 用戶將 `isPinned: false` 的卡片從 `autoPin: true` 的 column 移動至其他 column
- **THEN** 系統直接完成移動，不顯示 dialog

#### Scenario: 來源 column 非自動釘選時不顯示 dialog

- **WHEN** 用戶將卡片從 `autoPin: false` 的 column 移動至其他 column
- **THEN** 系統直接完成移動，不顯示 dialog

### Requirement: 確認 dialog 提供兩個操作選項

Dialog SHALL 提供「僅移出」與「移出並取消釘選」兩個按鈕。

#### Scenario: 用戶選擇「移出並取消釘選」

- **WHEN** 用戶在確認 dialog 點擊「取消釘選」按鈕
- **THEN** 系統呼叫 PATCH /api/v1/cards/:id/pin 將卡片取消釘選，並關閉 dialog

#### Scenario: 用戶選擇「僅移出」

- **WHEN** 用戶在確認 dialog 點擊「保持釘選」按鈕，或關閉 dialog
- **THEN** 系統不修改釘選狀態，dialog 關閉

#### Scenario: 取消釘選操作失敗

- **WHEN** unpin API 呼叫失敗
- **THEN** 系統顯示錯誤 toast 通知用戶，卡片保持已釘選狀態
