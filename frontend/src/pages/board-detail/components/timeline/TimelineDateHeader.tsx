import type { TimelineZoom } from '@/stores/timelineStore'
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  getDaysInMonth,
  isSameMonth,
  isSameYear,
  isWeekend,
  startOfDay,
  startOfMonth,
} from 'date-fns'

const HEADER_HEIGHT = 56 // total px
const ROW_H = 28 // each row height

interface TimelineDateHeaderProps {
  rangeStart: Date
  rangeEnd: Date
  dayCount: number
  dayWidth: number
  zoom: TimelineZoom
}

export function TimelineDateHeader({
  rangeStart,
  rangeEnd,
  dayCount,
  dayWidth,
  zoom,
}: TimelineDateHeaderProps) {
  const totalWidth = dayCount * dayWidth
  const today = startOfDay(new Date())
  const todayLeft = differenceInDays(today, rangeStart) * dayWidth

  const rangeEndExcl = addDays(rangeEnd, -1)

  if (zoom === 'day') {
    return <DayHeader rangeStart={rangeStart} rangeEndExcl={rangeEndExcl} totalWidth={totalWidth} today={today} todayLeft={todayLeft} dayWidth={dayWidth} />
  }
  if (zoom === 'week') {
    return <WeekHeader rangeStart={rangeStart} rangeEndExcl={rangeEndExcl} totalWidth={totalWidth} todayLeft={todayLeft} dayWidth={dayWidth} />
  }
  return <MonthHeader rangeStart={rangeStart} rangeEndExcl={rangeEndExcl} totalWidth={totalWidth} todayLeft={todayLeft} dayWidth={dayWidth} />
}

// ── Day zoom ──────────────────────────────────────────────────────────────────

function DayHeader({ rangeStart, rangeEndExcl, totalWidth, today, todayLeft, dayWidth }: {
  rangeStart: Date; rangeEndExcl: Date; totalWidth: number; today: Date; todayLeft: number; dayWidth: number
}) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEndExcl })

  // Month spans for top row
  const monthSpans: { label: string; left: number; width: number }[] = []
  let i = 0
  while (i < days.length) {
    const month = days[i]
    let j = i
    while (j < days.length && isSameMonth(days[j], month)) j++
    const left = i * dayWidth
    const width = (j - i) * dayWidth
    monthSpans.push({ label: format(month, 'MMM yyyy'), left, width })
    i = j
  }

  return (
    <div
      className="relative border-b bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{ height: HEADER_HEIGHT, width: totalWidth }}
    >
      {/* Top row: month spans */}
      <div className="relative" style={{ height: ROW_H }}>
        {monthSpans.map((s) => (
          <div
            key={s.label}
            className="absolute flex items-center border-r px-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400"
            style={{ left: s.left, width: s.width, height: ROW_H }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Bottom row: day cells */}
      <div className="relative flex" style={{ height: ROW_H }}>
        {days.map((day, idx) => {
          const isT = isSameDay(day, today)
          const isWe = isWeekend(day)
          return (
            <div
              key={idx}
              className={`flex shrink-0 flex-col items-center justify-center border-r text-center dark:border-gray-700 ${
                isT
                  ? 'bg-blue-500 text-white'
                  : isWe
                    ? 'bg-gray-50 text-gray-400 dark:bg-gray-800/60 dark:text-gray-500'
                    : 'text-gray-600 dark:text-gray-400'
              }`}
              style={{ width: dayWidth, height: ROW_H }}
            >
              <span className="text-[10px] leading-none">{format(day, 'd')}</span>
              <span className="text-[9px] leading-none opacity-70">
                {format(day, 'EEEEE')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Task 6.5: Today flag */}
      <TodayFlag todayLeft={todayLeft} totalWidth={totalWidth} />
    </div>
  )
}

// ── Week zoom ─────────────────────────────────────────────────────────────────

function WeekHeader({ rangeStart, rangeEndExcl, totalWidth, todayLeft, dayWidth }: {
  rangeStart: Date; rangeEndExcl: Date; totalWidth: number; todayLeft: number; dayWidth: number
}) {
  const weekWidth = dayWidth * 7
  const weeks = eachWeekOfInterval(
    { start: rangeStart, end: rangeEndExcl },
    { weekStartsOn: 1 },
  )

  // Month spans: group weeks by month (use week start date)
  const monthSpans: { label: string; left: number; width: number }[] = []
  let i = 0
  while (i < weeks.length) {
    const month = weeks[i]
    let j = i
    while (j < weeks.length && isSameMonth(weeks[j], month)) j++
    const left = differenceInDays(weeks[i], rangeStart) * dayWidth
    const end = j < weeks.length
      ? differenceInDays(weeks[j], rangeStart) * dayWidth
      : totalWidth
    monthSpans.push({ label: format(month, 'MMM yyyy'), left, width: end - left })
    i = j
  }

  return (
    <div
      className="relative border-b bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{ height: HEADER_HEIGHT, width: totalWidth }}
    >
      {/* Top row: month spans */}
      <div className="relative" style={{ height: ROW_H }}>
        {monthSpans.map((s) => (
          <div
            key={s.label + s.left}
            className="absolute flex items-center border-r px-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400"
            style={{ left: s.left, width: s.width, height: ROW_H }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Bottom row: week cells */}
      <div className="relative" style={{ height: ROW_H }}>
        {weeks.map((week) => {
          const left = differenceInDays(week, rangeStart) * dayWidth
          return (
            <div
              key={week.toISOString()}
              className="absolute flex items-center justify-center border-r text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400"
              style={{ left, width: weekWidth, height: ROW_H }}
            >
              {format(week, 'M/d')}
            </div>
          )
        })}
      </div>

      <TodayFlag todayLeft={todayLeft} totalWidth={totalWidth} />
    </div>
  )
}

// ── Month zoom ────────────────────────────────────────────────────────────────

function MonthHeader({ rangeStart, rangeEndExcl, totalWidth, todayLeft, dayWidth }: {
  rangeStart: Date; rangeEndExcl: Date; totalWidth: number; todayLeft: number; dayWidth: number
}) {
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEndExcl })

  // Year spans for top row
  const yearSpans: { label: string; left: number; width: number }[] = []
  let i = 0
  while (i < months.length) {
    const year = months[i]
    let j = i
    while (j < months.length && isSameYear(months[j], year)) j++
    const left = differenceInDays(startOfMonth(months[i]), rangeStart) * dayWidth
    const end = j < months.length
      ? differenceInDays(startOfMonth(months[j]), rangeStart) * dayWidth
      : totalWidth
    yearSpans.push({ label: format(year, 'yyyy'), left, width: end - left })
    i = j
  }

  return (
    <div
      className="relative border-b bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{ height: HEADER_HEIGHT, width: totalWidth }}
    >
      {/* Top row: year spans */}
      <div className="relative" style={{ height: ROW_H }}>
        {yearSpans.map((s) => (
          <div
            key={s.label + s.left}
            className="absolute flex items-center border-r px-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400"
            style={{ left: s.left, width: s.width, height: ROW_H }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Bottom row: month cells (variable width) */}
      <div className="relative" style={{ height: ROW_H }}>
        {months.map((month) => {
          const left = differenceInDays(startOfMonth(month), rangeStart) * dayWidth
          const w = getDaysInMonth(month) * dayWidth
          return (
            <div
              key={month.toISOString()}
              className="absolute flex items-center justify-center border-r text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400"
              style={{ left, width: w, height: ROW_H }}
            >
              {format(month, 'MMM')}
            </div>
          )
        })}
      </div>

      <TodayFlag todayLeft={todayLeft} totalWidth={totalWidth} />
    </div>
  )
}

// ── Today flag + line (task 6.5) ──────────────────────────────────────────────

function TodayFlag({ todayLeft, totalWidth }: { todayLeft: number; totalWidth: number }) {
  if (todayLeft < 0 || todayLeft > totalWidth) return null
  return (
    <>
      {/* TODAY label */}
      <div
        className="tl-today-flag absolute bottom-0 z-10 -translate-x-1/2 select-none rounded-sm bg-red-500 px-1 py-px text-[9px] font-bold leading-none text-white"
        style={{ left: todayLeft }}
      >
        TODAY
      </div>
      {/* Red vertical line */}
      <div
        className="tl-today-line absolute top-0 z-10 w-px bg-red-500"
        style={{ left: todayLeft, height: HEADER_HEIGHT }}
      />
    </>
  )
}

// Helper
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
