## Context

目前 `CardDetailDialog` 以縱向堆疊的方式呈現 `StoryPointSelector`（10 顆常駐按鈕）與 `TagSection`（Badge 列 + autocomplete input + 內嵌色選器），每次開啟卡片時版面擁擠、視覺噪音高。

目標是改為仿 Trello 的「小標題 + 觸發鈕 → Popover」模式，使主畫面保持簡潔，所有操作收進 Popover。

Tech stack：React 19、shadcn/ui（Radix Popover/Button/Input/Checkbox/Badge）、TanStack Query、Tailwind v3。

## Goals / Non-Goals

**Goals:**
- SP 與 Tags 改為 Popover 收納式 UI，主畫面只顯示當前值 + 觸發鈕
- Tags Popover 支援：搜尋、勾選 attach/detach、edit（名稱+顏色）、delete-confirm、create
- SP Popover 支援：數字格按鈕選值、REMOVE 清除
- 抽出 `TAG_COLORS` / `getTagColorClasses` 至 `tagColors.ts` 供多元件共用
- 無後端/API 異動

**Non-Goals:**
- 新增 SP 以外的數字（如自訂 SP 值）
- Tag 排序或分組
- 批次操作 Tags

## Decisions

### D1：`TagsPopover` 使用內部 view-state 機器，而非多個巢狀 Popover

**選項 A**：每個子畫面獨立開新 Popover（edit、create 各自 trigger）
**選項 B（採用）**：單一 Popover，內部以 `view` state 切換畫面

**理由**：Trello 的互動模式是在同一個 popover 視窗內穿梭，體驗一致；多層巢狀 Popover 在 Radix 中有 z-index 與 focus-trap 衝突，且 Popover 寬度/位置會跳動。單一 Popover + view-state 實作較簡單，行為可預期。

`view` 型別：
```ts
type View =
  | 'list'
  | 'create'
  | { mode: 'edit'; tag: Tag }
  | { mode: 'delete-confirm'; tag: Tag }
```

### D2：刪除確認在 Popover 內顯示警告文字，不用 AlertDialog

**選項 A**：沿用既有 `AlertDialog` 阻斷式確認
**選項 B（採用）**：Popover 內切換至 delete-confirm 子畫面

**理由**：AlertDialog 會把整個 Dialog 的 focus 搶走，且在 Dialog 內使用 AlertDialog 有 Radix aria-modal 衝突的已知問題。Popover 內子畫面的體驗更流暢，且不需要額外的 portal 管理。

### D3：`TAG_COLORS` / `getTagColorClasses` 抽出至 `tagColors.ts`

**理由**：`ColorPicker.tsx` 原本是獨立元件，新設計不再使用該元件，但 `CardItem.tsx` 仍需 `getTagColorClasses`；統一從 `tagColors.ts` import 避免循環依賴，讓色彩邏輯有單一來源。

### D4：Tags 觸發鈕：Badge 列 + `+` 鈕，SP 觸發鈕：單顆數字 / `+` 鈕

SP：`<Popover><PopoverTrigger asChild><Button>` — 有值顯示數字（藍底），無值顯示 `+` icon。
Tags：Badge 列保留在 Popover 外部（CardDetailDialog 層），每顆 Badge 有獨立的 `×` 移除鈕；最後一顆 `+` 鈕作為 PopoverTrigger。這樣不需要開 Popover 就能快速移除 tag。

## Risks / Trade-offs

- **Popover 在 Dialog 內的 z-index**：Radix Dialog 預設使用 portal，Popover 也會 portal，通常 z-index 自動疊加正確；若出現蓋層問題需在 `PopoverContent` 加 `className="z-[9999]"`。→ Mitigation：實作後手動驗證 z-index。
- **`storyPoint: 0` 代表清除**：後端協定以 0 表示「無 SP」，前端需維持此行為（不改動）。
- **Tag 勾選的 optimistic update**：目前 `attachTag` / `detachTag` mutation 無 optimistic update，勾選後有短暫延遲。本次不實作 optimistic，維持現狀。

## Migration Plan

1. 新增 `tagColors.ts` 並更新 `CardItem.tsx` import
2. 新增 `StoryPointPopover.tsx` 並更新 `CardDetailDialog.tsx`
3. 刪除 `StoryPointSelector.tsx`
4. 新增 `TagsPopover.tsx`（完整 view-state machine）並更新 `CardDetailDialog.tsx`
5. 刪除 `TagSection.tsx` 與 `ColorPicker.tsx`

無需資料遷移，無後端異動，rollback 方式：還原 git 變更即可。

## Open Questions

（無）
