## ADDED Requirements

### Requirement: 前端資料夾結構遵循 Pages + 領域分類
前端 `src/` 下的元件 SHALL 按以下結構組織：
- `pages/<page>/` — 路由級頁面元件
- `pages/<page>/components/<domain>/` — 該頁面的領域子元件
- `components/ui/` — shadcn/ui 共用 primitive 元件

頁面分類規則：被 `routes/*.tsx` 直接 import 的元件為頁面元件，放在 `pages/<page>/` 根層。其餘元件按領域（cards、columns、tags、checklists）放在 `pages/<page>/components/<domain>/`。

#### Scenario: board-list 頁面結構
- **WHEN** 開發者查看 `src/pages/board-list/`
- **THEN** 該資料夾 SHALL 僅包含 `BoardListPage.tsx`

#### Scenario: board-detail 頁面結構
- **WHEN** 開發者查看 `src/pages/board-detail/`
- **THEN** 該資料夾 SHALL 包含 `BoardPage.tsx` 和 `components/` 子資料夾
- **THEN** `components/` SHALL 包含 `cards/`、`columns/`、`tags/`、`checklists/` 領域子資料夾

#### Scenario: cards 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/cards/`
- **THEN** SHALL 包含 CardItem、CardContextMenu、CardDetailDialog、DuplicateCardDialog、AddCardForm、ScheduleSection、StoryPointSelector

#### Scenario: columns 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/columns/`
- **THEN** SHALL 包含 ColumnView、ColumnHeader、AddColumnForm

#### Scenario: tags 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/tags/`
- **THEN** SHALL 包含 TagSection、ColorPicker

#### Scenario: checklists 領域元件
- **WHEN** 開發者查看 `src/pages/board-detail/components/checklists/`
- **THEN** SHALL 包含 ChecklistBlock、ChecklistSection

#### Scenario: pin 頁面結構
- **WHEN** 開發者查看 `src/pages/pin/`
- **THEN** SHALL 包含 `PinWindow.tsx` 和 `components/` 子資料夾
- **THEN** `components/` SHALL 包含 PinnedCardItem、PinOverlay

---

### Requirement: Import 路徑統一使用 @ Alias
所有前端 TypeScript/TSX 檔案的跨目錄 import SHALL 使用 `@/` alias（對應 `src/`）。同目錄內的 import MAY 使用 `./` 相對路徑。MUST NOT 使用 `../` 相對路徑進行跨目錄引用。

#### Scenario: 跨目錄引用 UI 元件
- **WHEN** 任何元件 import `components/ui/` 下的元件
- **THEN** MUST 使用 `@/components/ui/<name>` 格式

#### Scenario: 跨目錄引用 hooks
- **WHEN** 任何檔案 import `hooks/` 下的 hook
- **THEN** MUST 使用 `@/hooks/<path>` 格式

#### Scenario: 跨目錄引用 lib
- **WHEN** 任何檔案 import `lib/` 下的模組
- **THEN** MUST 使用 `@/lib/<path>` 格式

#### Scenario: 同目錄引用
- **WHEN** 同一資料夾內的檔案互相引用
- **THEN** MAY 使用 `./` 相對路徑（如 `lib/api/` 內的 `./client`）

#### Scenario: 禁止跨目錄相對路徑
- **WHEN** 開發者撰寫跨目錄 import
- **THEN** MUST NOT 使用 `../` 開頭的相對路徑

---

### Requirement: features 資料夾不再存在
重構完成後 `src/features/` 資料夾 SHALL 被完全刪除，所有元件 SHALL 遷移至 `src/pages/` 結構。

#### Scenario: features 資料夾已移除
- **WHEN** 開發者查看 `src/` 根層
- **THEN** SHALL NOT 存在 `features/` 資料夾
