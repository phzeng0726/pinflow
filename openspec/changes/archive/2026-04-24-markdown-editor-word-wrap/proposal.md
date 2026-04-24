## Why

Markdown 編輯器在 Source 模式下，段落 `<p>` 套用 `whitespace-nowrap`，外層容器使用 `overflow-x-auto`，導致使用者輸入長行時編輯區不斷往右延伸，必須橫向捲動才能看到完整內容，嚴重影響閱讀與編輯體驗。

## What Changes

- 移除 `.markdown-source-editor p` 的 `whitespace-nowrap`，改用 `white-space: pre-wrap` + `overflow-wrap: anywhere`，讓文字自動換行。
- 移除 Source 編輯區外層容器的 `overflow-x-auto`，不再提供橫向捲軸。
- Rich 模式本身已支援換行，無需修改。

## Capabilities

### New Capabilities

（無新 capability，僅修改既有行為）

### Modified Capabilities

- `markdown-editor`：Source 模式長行文字應自動換行而非水平滾動

## Impact

- **修改檔案**：
  - `frontend/src/index.css`（第 155–159 行，`.markdown-source-editor p` 樣式）
  - `frontend/src/components/common/markdown-editor/index.tsx`（第 224 行，外層容器 className）
- **已知取捨**：左側行號欄以邏輯段落（`<p>`）為單位計算，換行後長段落的視覺第 2、3 行無對應行號（同 VSCode Word Wrap 標準行為）
- **不影響**：Rich 模式、backend、Electron
