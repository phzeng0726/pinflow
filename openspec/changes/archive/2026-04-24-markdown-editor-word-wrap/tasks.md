## 1. CSS 修改

- [x] 1.1 在 `frontend/src/index.css` 第 155–159 行，將 `.markdown-source-editor p` 的 `@apply m-0 whitespace-nowrap;` 改為 `@apply m-0 break-words;`，並加入 `white-space: pre-wrap;` 及 `overflow-wrap: anywhere;`

## 2. JSX 修改

- [x] 2.1 在 `frontend/src/components/common/markdown-editor/index.tsx` 第 224 行，將外層容器 `className` 中的 `overflow-x-auto` 移除

## 3. 驗證

- [x] 3.1 執行 `cd frontend && pnpm dev`，開啟卡片 description 編輯器，切到 Source 模式
- [xs] 3.2 輸入一段很長的連續文字（無空格，如長 URL），確認文字自動換行，無橫向捲軸
- [x] 3.3 輸入含前導空格的文字（如 4 空格縮排），確認換行後空白被保留
- [x] 3.4 切到 Rich 模式，確認輸入長文字時同樣正常換行，無回歸
- [x] 3.5 確認行號欄與段落頂端對齊正常
