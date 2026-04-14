## Why

前端 UI 文字目前全部硬寫在元件內（約 95 條中文、50 條英文混雜），無法讓使用者切換顯示語言。新增多語系支援，讓使用者能在繁體中文與美式英文之間切換，提升國際化使用體驗。

## What Changes

- 新增 `react-i18next` + `i18next` 套件
- 新增語系翻譯檔 `src/locales/zh-TW.json` 與 `src/locales/en-US.json`，涵蓋所有 UI 文字
- 新增 `src/lib/i18n.ts`：i18next 初始化 singleton
- 新增 `src/stores/localeStore.ts`：Zustand + persist，鏡像 themeStore 模式，預設語系為 `en-US`
- 新增 `src/types/i18next.d.ts`：TypeScript key 型別安全宣告
- 新增 `src/components/LocaleToggle.tsx`：可重用的語系切換按鈕（顯示 EN / 中）
- 修改 `src/main.tsx`：加入 `import '@/lib/i18n'` side-effect
- 修改 `src/routes/__root.tsx`：mount 時呼叫 `localeStore.apply()` 同步語系
- 修改兩個 header 頁面（BoardListPage、BoardPage）：加入 `<LocaleToggle />` 於 theme toggle 旁
- 修改 19 個元件：將所有硬寫字串替換為 `t('key')` 呼叫
- 修改 `CommentSection.tsx`：date-fns 相對時間依語系切換 locale

## Capabilities

### New Capabilities

- `locale-switching`: 語系切換功能——Zustand 持久化語系偏好、i18next 翻譯引擎、語系切換 UI 按鈕，以及所有 UI 元件的翻譯字串整合

### Modified Capabilities

（無現有 spec 的需求層級變更）

## Impact

**新增套件依賴：**
- `i18next` — 翻譯核心
- `react-i18next` — React hooks 整合

**影響範圍：**
- `frontend/src/stores/` — 新增 localeStore
- `frontend/src/lib/` — 新增 i18n.ts
- `frontend/src/locales/` — 新增翻譯 JSON（新目錄）
- `frontend/src/types/` — 新增 i18next.d.ts
- `frontend/src/components/` — 新增 LocaleToggle.tsx
- `frontend/src/main.tsx` — side-effect import
- `frontend/src/routes/__root.tsx` — apply locale on mount
- `frontend/src/pages/` — 約 21 個元件檔案替換硬寫字串
