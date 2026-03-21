import type { QueryClient } from '@tanstack/react-query'

// Electron API 型別
interface ElectronAPI {
    broadcastQueryInvalidation?: (queryKey: readonly unknown[]) => void
    onQueryInvalidation?: (cb: (queryKey: readonly unknown[]) => void) => void
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
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