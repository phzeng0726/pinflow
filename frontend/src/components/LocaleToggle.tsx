import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLocaleStore } from '@/stores/localeStore'

export function LocaleToggle() {
  const locale = useLocaleStore((s) => s.locale)
  const toggle = useLocaleStore((s) => s.toggle)
  const { t } = useTranslation()

  const tooltipText =
    locale === 'en-US' ? t('locale.toChinese') : t('locale.toEnglish')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="h-8 w-8 px-0 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          {locale === 'en-US' ? 'EN' : '中'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  )
}
