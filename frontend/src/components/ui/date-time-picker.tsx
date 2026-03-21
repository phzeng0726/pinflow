import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value?: string | null
  onChange: (isoString: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '選擇日期時間',
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)

  const parsedDate = value ? new Date(value) : undefined
  const hours = parsedDate ? parsedDate.getHours() : 0
  const minutes = parsedDate ? parsedDate.getMinutes() : 0

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null)
      return
    }
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    onChange(newDate.toISOString())
  }

  const handleHoursChange = (h: number) => {
    if (!parsedDate) return
    const newDate = new Date(parsedDate)
    newDate.setHours(Math.max(0, Math.min(23, h)), minutes, 0, 0)
    onChange(newDate.toISOString())
  }

  const handleMinutesChange = (m: number) => {
    if (!parsedDate) return
    const newDate = new Date(parsedDate)
    newDate.setHours(hours, Math.max(0, Math.min(59, m)), 0, 0)
    onChange(newDate.toISOString())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-8 w-full justify-start text-left text-sm font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {parsedDate ? format(parsedDate, 'yyyy-MM-dd HH:mm') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          autoFocus
        />
        <div className="flex items-center gap-2 border-t p-3 dark:border-gray-700">
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => handleHoursChange(Number(e.target.value))}
            className="w-14 rounded border px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            disabled={!parsedDate}
          />
          <span className="text-gray-500">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => handleMinutesChange(Number(e.target.value))}
            className="w-14 rounded border px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            disabled={!parsedDate}
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7"
              onClick={() => onChange(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
