## Context

前端 `src/features/` 有 19 個元件，按 feature 分為 board（8）、card（8）、pin（3），但實際上 board 資料夾混入 card 相關元件（CardItem、CardContextMenu、AddCardForm），開發者依直覺找不到檔案。同時 import 風格混用 `@/` alias 和 `../` 相對路徑。

現行結構：
- `features/board/` — BoardListPage、BoardPage、CardItem、CardContextMenu、ColumnView、ColumnHeader、AddCardForm、AddColumnForm
- `features/card/` — CardDetailDialog、DuplicateCardDialog、ChecklistBlock、ChecklistSection、ColorPicker、ScheduleSection、StoryPointSelector、TagSection
- `features/pin/` — PinnedCardItem、PinOverlay、PinWindow

## Goals / Non-Goals

**Goals:**
- 按頁面 + 領域分類重組元件，讓開發者能直覺找到檔案
- 拆分 board-list（看板列表）和 board-detail（看板內容）兩個不同層級的頁面
- 統一所有跨目錄 import 為 `@/` alias
- 保留 git history（使用 git mv）

**Non-Goals:**
- 不改動 hooks/、lib/、stores/、types/ 的資料夾結構（只修 import 路徑）
- 不改動 components/ui/（shadcn）的位置
- 不改動任何元件的邏輯或功能
- 不重新命名任何檔案

## Decisions

### 1. 採用 pages + 領域分類結構（而非扁平類型分類）

**選擇**：`pages/board-detail/components/cards/`、`columns/`、`tags/`、`checklists/` 領域子資料夾

**替代方案**：
- 扁平類型分類（`pages/`、`dialogs/`、`forms/`、`components/`）— 簡單但元件間關聯不明顯，components/ 會有 11 個無分類的檔案
- feature-based 保持但重組（移 CardItem 到 card/）— 治標不治本，board/card 邊界仍模糊

**理由**：領域分類讓相關元件物理上相鄰，找 card 相關的東西只需看 `cards/` 資料夾。board-detail 擁有自己的 components/ 反映了「這些元件只在看板詳細頁使用」的事實。

### 2. 拆分 board-list 和 board-detail

**選擇**：`pages/board-list/`（僅 BoardListPage.tsx）和 `pages/board-detail/`（BoardPage + 16 個子元件）

**理由**：BoardListPage 是獨立的簡單頁面，不依賴任何 card/column 元件。拆開後 board-detail 的 components/ 語意清楚——都是看板內部元件。

### 3. Import 規範：跨目錄 `@/`、同目錄 `./`

**選擇**：跨目錄一律 `@/`，同目錄保留 `./`

**替代方案**：全部強制 `@/` — 同目錄的 `./client` 變成 `@/lib/api/client` 顯得冗長且無意義

**理由**：`./` 表示「同一模組內的引用」，語意明確且簡短；`@/` 表示「從 src root 跨目錄引用」，避免 `../../` 的路徑計算。

### 4. 一次性原子搬遷（而非漸進式）

**選擇**：19 個檔案 + 所有 import 修正放同一個 commit

**替代方案**：分階段搬遷（先搬 pages、再搬 components）— 中間狀態下一半新結構一半舊結構，比任一完整狀態都更混亂

**理由**：專案只有 19 個元件檔案，規模小到一次搬完風險很低，且可整個 commit revert。

### 5. ScheduleSection 和 StoryPointSelector 歸入 cards/

**選擇**：放在 `pages/board-detail/components/cards/`

**理由**：這兩個元件只被 CardDetailDialog 使用，是 card 詳細資訊的子區塊。雖然概念上是「排程」和「點數」，但它們不會在 card 以外的地方被使用。

## Risks / Trade-offs

- **components → pages 的向上依賴**：`PinOverlay`（pin/components/）import `PinWindow`（pin/）。這是因為 PinOverlay 是 PinWindow 的 web 模式薄包裝。→ 可接受的例外，不影響維護。
- **路徑較長**：`@/pages/board-detail/components/cards/CardItem` 比原本的 `./CardItem` 長很多。→ 只影響跨目錄引用；同資料夾內的元件互相引用仍可用 `./`。IDE 自動補全也能處理。
- **git mv 在 Windows 的行為**：Windows 上 git mv 可能遇到大小寫問題。→ 全部是新建資料夾名稱，不涉及大小寫變更，無此風險。
