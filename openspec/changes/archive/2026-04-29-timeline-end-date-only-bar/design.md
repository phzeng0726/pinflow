## Context

Timeline 的 `getBarProps` 目前以 `!startTime || !endTime` 短路，使只有截止日的卡片落入「No dates」群組並顯示無意義的虛線框。這批卡片事實上具備有效的時間資訊（截止日），應在 timeline 的正確位置上可見。

影響範圍僅限 `useTimelineData.ts` 與 `TimelineBar.tsx` 兩個前端檔案，無後端 API 改動。

## Goals / Non-Goals

**Goals:**
- 只有 `endTime` 的卡片在 timeline 上以可辨識的 bar 顯示於截止日位置
- 視覺上能與「完整排程（start+end）」的 bar 區分
- urgency glow（overdue / due-soon）、checklist 進度、tooltip、依賴箭頭連線等既有功能對此類 bar 自動有效

**Non-Goals:**
- 只有 `startTime` 的卡片（本次不處理，維持歸入 "No dates"）
- 後端 API 或資料結構變動
- 允許使用者在 timeline 上拖拉調整推算起始日

## Decisions

### 1. 以「今天」作為推算起始日（vs. 固定欄寬 Milestone 符號）

**選擇：Auto-infer start-from-today**

理由：Milestone Diamond 在語意上暗示「零工期里程碑事件」，但 PinFlow 的卡片通常是任務而非事件，使用者期待看到「我從現在到截止日還有多少時間」。Auto-infer 方案不需要新增 icon 或 SVG 形狀，`BarProps.left` / `width` 均有效，`TimelineArrows` 計算邏輯完全不受影響。

過期卡片（`endTime < today`）的推算起始日設為 `endTime - 1 day`，保持最小一格寬度，並觸發 overdue glow。

### 2. 斜線 stripe 作為視覺區分（vs. 改變底色 / 加 icon）

**選擇：CSS `repeating-linear-gradient(135deg, ...)` stripe**

理由：底色維持 blue-500 與正常 bar 一致，使用者能立即辨識這仍是一張有日期的卡片；斜線 stripe 傳達「部分資訊缺失」的視覺語意，無需額外 icon 佔用 bar 內空間，且對截短的窄 bar 同樣有效。

### 3. `BarProps` 新增 `isEndDateOnly: boolean`（vs. 新增 hasSchedule 第三態）

**選擇：新增獨立 boolean 欄位**

理由：`hasSchedule` 現有語意為「bar 是否有有效的 left/width」，改為三態 union 會影響所有讀取方：`TimelineArrows`、`TimelineCanvas`、`TimelineBar`。新增獨立欄位只影響 `TimelineBar` 的渲染分支，改動範圍最小。

## Risks / Trade-offs

- **日期範圍計算隱含 today** → end-only 的 bar 起點是今日，每次 timeline 開啟時 `left` 會改變。若使用者期待 timeline 穩定不變，此行為可能令人意外。緩解：這與「今日紅線」的動態位置行為一致，使用者已有相同預期。
- **只有 startTime 的卡片仍在 No dates** → 本次不處理，未來若要處理，`getBarProps` Case 4 已保留明確擴充點。
