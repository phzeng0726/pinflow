## Context

PinFlow 前端目前無任何 i18n 機制，所有 UI 文字硬寫於元件中（約 95 條中文、50 條英文）。專案已有 themeStore（Zustand + persist 鏡像模式）管理深色/淺色主題，語系切換應遵循相同模式。技術棧：React 19、Vite、Zustand v5、react-i18next、TanStack Router。

## Goals / Non-Goals

**Goals:**
- 支援 `en-US`（預設）與 `zh-TW` 兩種語系
- 語系偏好持久化至 localStorage（key: `pinflow-locale`）
- mount 時自動還原上次選擇的語系
- TypeScript 型別安全的翻譯 key（自動補全 + 編譯期錯誤）
- 語系切換 UI 放在兩個頁面 header 的 theme toggle 旁

**Non-Goals:**
- 不支援第三種以上語系（未來可擴充）
- 不使用遠端翻譯載入（bundle 方式即可）
- 不處理 RTL（right-to-left）排版
- 後端 API 不涉及語系

## Decisions

### 1. 選用 react-i18next 而非自製解法

**決定：** 使用 `i18next` + `react-i18next`。

**原因：**
- 原生支援複數形（i18next `_one` / `_other` 慣例），對應 "{{count}} columns" / "{{count}} 個欄位" 等動態字串
- TypeScript module augmentation 可提供 key 型別推導
- React 19 相容，`useTranslation()` hook 符合現有元件風格

**排除替代方案：**
- 自製 Zustand + JSON Map：無複數形支援，需自行處理插值，維護成本高

### 2. 語系狀態由 localeStore 驅動，i18next 為被動跟隨

**決定：** Zustand `localeStore` 是 single source of truth，i18next instance 透過 `apply()` / `toggle()` 被動同步。

**原因：**
- 與 themeStore 模式完全一致，降低學習成本
- 避免 i18next 語言偵測器與 Zustand persist 競爭初始值
- `__root.tsx` mount 時呼叫 `applyLocale()`，與 `applyTheme()` 並列，確保第一幀即正確語系

**初始化流程：**
```
main.tsx: import '@/lib/i18n'  →  i18next init (lng: 'en-US', bundled JSON)
__root.tsx mount: applyLocale()  →  i18n.changeLanguage(persistedLocale)
```

### 3. 翻譯 JSON 以 bundle 方式內嵌，不使用 lazy loading

**決定：** 翻譯 JSON 直接 import 進 `src/lib/i18n.ts`，不使用 `i18next-http-backend`。

**原因：**
- 約 ~150 條字串，兩個語言合計 JSON < 10 KB，無需 code splitting
- 同步初始化，避免翻譯載入前的 loading state 或 hydration mismatch
- Electron 環境無 HTTP server，remote backend 不適用

### 4. TypeScript key 安全性透過 module augmentation 實現

**決定：** 新增 `src/types/i18next.d.ts`，以 `zh-TW.json` 作為 canonical type source。

**原因：**
- zh-TW 為完整 key 集合，en-US 必須 key 一致（缺 key 時 fallback 到 zh-TW）
- TypeScript `CustomTypeOptions` 讓 `t('xxx')` 在 VS Code 自動補全且編譯期驗證
- 宣告放於獨立 `.d.ts` 避免與 `erasableSyntaxOnly` 衝突

### 5. 語系切換 UI 使用文字按鈕（EN / 中）

**決定：** `LocaleToggle` 元件顯示 `EN` / `中` 文字，不使用 icon。

**原因：**
- lucide-react 目前套件中無 globe/language icon
- 文字標籤（EN / 中）為業界慣例（GitHub、Linear、Notion 皆採用）
- 實作簡單，不需額外 dependency

## Risks / Trade-offs

- **[翻譯缺漏]** en-US 若有 key 遺漏，i18next fallback 至 zh-TW，使用者看到中文 → 開發期加 TypeScript 型別驗證，且 zh-TW / en-US key 必須保持同步
- **[date-fns locale]** CommentSection 使用 `formatDistanceToNow`，需額外傳入 `date-fns/locale/zh-TW` → 在 CommentItem 讀取 localeStore 並條件傳入 locale
- **[StrictMode double-mount]** `applyLocale()` 在 StrictMode 下呼叫兩次 → `i18n.changeLanguage()` 為冪等操作，無副作用
- **[大量元件修改]** 約 21 個元件需逐一加 `useTranslation()` → 修改模式單一固定，風險低，但 review 面積大

## Migration Plan

1. 安裝套件：`pnpm add i18next react-i18next`
2. 建立翻譯 JSON、i18n.ts、localeStore.ts、i18next.d.ts、LocaleToggle.tsx
3. 修改 main.tsx、__root.tsx
4. 逐一修改各元件（建議依 page 分批，每批可獨立測試）
5. 驗證：切換語系 → 所有文字即時更新；重新整理 → 語系持久化

**Rollback：** 功能純前端，不影響 API 或資料。若需回退，移除 import 並還原元件字串即可。

## Open Questions

（無）
