# Spec: Pin Card Detail Window

## Purpose

從 Pin 浮動面板開啟卡片詳情視窗的功能。使用者可透過 PinnedCardItem 的多功能 popover 選單，在一個永遠置頂的獨立 BrowserWindow 中編輯釘選卡片，所有修改透過 query invalidation 自動同步回 Pin 面板與主視窗。

## Requirements

### Requirement: PinnedCardItem 右上角提供多功能操作 popover

`PinnedCardItem` 右上角的操作按鈕 SHALL 改為 `⋯` 圖示的 popover 觸發按鈕（hover 時顯示），點擊後展開包含 **Edit** 和 **Unpin** 兩個選項的 popover 選單。

#### Scenario: Hover 顯示操作按鈕

- **WHEN** 使用者將滑鼠移到釘選卡片上
- **THEN** 右上角出現 `⋯` 按鈕

#### Scenario: 點擊操作按鈕展開 popover

- **WHEN** 使用者點擊 `⋯` 按鈕
- **THEN** 展開包含 Edit 和 Unpin 兩個選項的 popover 選單

#### Scenario: 點擊 Edit 選項

- **WHEN** 使用者在 popover 中點擊 Edit
- **THEN** popover 關閉，並開啟卡片詳情視窗

#### Scenario: 點擊 Unpin 選項

- **WHEN** 使用者在 popover 中點擊 Unpin
- **THEN** popover 關閉，該卡片從釘選清單中移除

### Requirement: 從 Pin 浮動面板開啟卡片詳情視窗

系統 SHALL 在使用者選擇 Edit 時，透過 Electron IPC 開啟一個新的 BrowserWindow，顯示與看板頁面相同的 `CardDetailDialog`。

#### Scenario: 開啟詳情視窗

- **WHEN** 使用者在 PinnedCardItem 的 popover 中點擊 Edit
- **THEN** 系統開啟一個新的 BrowserWindow，載入該卡片的詳情（等同 `CardDetailDialog`），視窗置中於螢幕

#### Scenario: 關閉詳情視窗

- **WHEN** 使用者點擊詳情視窗中的 X 按鈕，或點擊 Dialog overlay
- **THEN** 詳情視窗關閉

#### Scenario: 詳情視窗置中螢幕

- **WHEN** 詳情視窗開啟
- **THEN** 視窗出現在主螢幕（primary display）工作區域的正中央

### Requirement: 卡片詳情視窗維持 alwaysOnTop

詳情視窗 SHALL 設定 `alwaysOnTop: true`，與 Pin 浮動面板保持相同層級。

#### Scenario: 切換到其他應用程式後視窗仍可見

- **WHEN** 使用者點擊其他應用程式
- **THEN** 卡片詳情視窗仍然顯示於所有視窗之上

### Requirement: 詳情視窗的資料變更同步至其他視窗

使用者在詳情視窗中所做的任何修改 SHALL 透過既有的 query invalidation 廣播機制，自動同步到 Pin 浮動面板與主視窗。

#### Scenario: 在詳情視窗編輯卡片後 Pin 浮動面板更新

- **WHEN** 使用者在詳情視窗中修改卡片標題或其他欄位並儲存
- **THEN** Pin 浮動面板中該卡片的資訊自動更新，無需手動重新整理
