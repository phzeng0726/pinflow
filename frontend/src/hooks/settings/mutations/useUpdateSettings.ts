import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { queryKeys } from '@/hooks/queryKeys'
import { useThemeStore } from '@/stores/themeStore'
import { useLocaleStore } from '@/stores/localeStore'

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.updateSettings,
    onMutate: (variables) => {
      if (variables.theme) {
        useThemeStore.setState({ theme: variables.theme as 'light' | 'dark' })
      }
      if (variables.locale) {
        useLocaleStore.setState({ locale: variables.locale as 'en-US' | 'zh-TW' })
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.all(), data)
    },
  })
}
