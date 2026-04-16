import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, zhTW } from 'date-fns/locale'
import type { Locale } from 'date-fns/locale'

type AppLocale = 'en-US' | 'zh-TW'

const dateFnsLocaleMap: Record<AppLocale, Locale> = {
  'en-US': enUS,
  'zh-TW': zhTW,
}

/** 格式化 ISO 字串為卡片 badge 的短日期（M/d）。失敗時回傳空字串。 */
export function formatCardDate(iso: string): string {
  try {
    return format(parseISO(iso), 'M/d')
  } catch {
    return ''
  }
}

/** 格式化 ISO 字串為排程摘要的短日期（yyyy/M/d）。無效時回傳 null。 */
export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return format(parseISO(iso), 'yyyy/M/d')
  } catch {
    return null
  }
}

/** 將 startTime/endTime 組合為 "yyyy/M/d → yyyy/M/d" 摘要。兩端均無日期時回傳 null。 */
export function formatScheduleSummary(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const start = formatShortDate(startTime)
  const end = formatShortDate(endTime)
  if (start && end) return `${start} → ${end}`
  if (start) return `${start} →`
  if (end) return `→ ${end}`
  return null
}

/** 根據 endTime（優先）或 startTime 回傳緊急度 Tailwind class。 */
export function getScheduleUrgencyClass(
  endTime: string | null | undefined,
  startTime: string | null | undefined,
): string {
  const referenceIso = endTime ?? startTime
  if (!referenceIso) return 'text-gray-400'
  try {
    const diff =
      (parseISO(referenceIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return 'text-red-500'
    if (diff <= 3) return 'text-orange-500'
    return 'text-gray-400'
  } catch {
    return 'text-gray-400'
  }
}

/** 將日期轉換為相對時間字串（例如 "3 minutes ago"），支援 app locale。 */
export function formatRelativeTime(
  date: string | Date,
  locale: AppLocale = 'en-US',
): string {
  const dateFnsLocale = dateFnsLocaleMap[locale] ?? enUS
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: dateFnsLocale,
  })
}
