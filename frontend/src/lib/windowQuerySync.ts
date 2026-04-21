import type { QueryClient } from '@tanstack/react-query'

// Electron API 型別
interface ElectronAPI {
  broadcastQueryInvalidation?: (queryKey: readonly unknown[]) => void
  onQueryInvalidation?: (cb: (queryKey: readonly unknown[]) => void) => void
  openCardDetail?: (boardId: number, cardId: number) => void
  broadcastSettings?: (settings: { theme?: string; locale?: string }) => void
  onSettings?: (cb: (settings: { theme?: string; locale?: string }) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

// 接收其他視窗廣播的 theme/locale 設定，同步到本視窗的 Zustand store
// store 更新後，__root.tsx 的 useEffect 會自動套用 CSS class 與 i18n 語言
export function setupWindowSettingsSync() {
  const electron = window.electronAPI
  if (!electron?.onSettings) return

  electron.onSettings(({ theme, locale }) => {
    if (theme) {
      // 動態 import 避免循環相依
      import('@/stores/themeStore').then(({ useThemeStore }) => {
        useThemeStore.setState({ theme: theme as 'light' | 'dark' })
      })
    }
    if (locale) {
      import('@/stores/localeStore').then(({ useLocaleStore }) => {
        useLocaleStore.setState({ locale: locale as 'en-US' | 'zh-TW' })
      })
    }
  })
}

// 讓 Electron 視窗之間可以跨視窗資料同步，因為兩邊不同視窗的狀態會不同
// 可以透過這個機制，讓兩個視窗跟彼此對話，刷新彼此狀態
export function setupWindowQuerySync(queryClient: QueryClient) {
  const electron = window.electronAPI

  // 保留原本的 invalidate
  const originalInvalidate = queryClient.invalidateQueries.bind(queryClient)

  // override
  queryClient.invalidateQueries = async (filters, options) => {
    const res = await originalInvalidate(filters, options)

    if (filters?.queryKey && electron?.broadcastQueryInvalidation) {
      electron.broadcastQueryInvalidation(filters.queryKey)
    }

    return res
  }

  // 接收廣播
  electron?.onQueryInvalidation?.((queryKey: readonly unknown[]) => {
    originalInvalidate({ queryKey })
  })
}
