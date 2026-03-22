import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export const TAG_COLORS: { key: string; bg: string; ring: string }[] = [
  { key: '', bg: 'bg-gray-200 dark:bg-gray-600', ring: 'ring-gray-400' },
  { key: 'red', bg: 'bg-red-500', ring: 'ring-red-500' },
  { key: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { key: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { key: 'yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-500' },
  { key: 'lime', bg: 'bg-lime-500', ring: 'ring-lime-500' },
  { key: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
  { key: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { key: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { key: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { key: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { key: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { key: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
]

export function getTagColorClasses(colorKey: string) {
  return TAG_COLORS.find((c) => c.key === colorKey) ?? TAG_COLORS[0]
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker(props: ColorPickerProps) {
  const { value, onChange } = props

  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color.key}
          type="button"
          onClick={() => onChange(color.key)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110',
            color.bg,
            value === color.key && 'ring-2 ring-offset-1 dark:ring-offset-gray-800',
            value === color.key && color.ring,
          )}
        >
          {value === color.key && (
            <Check
              className={cn(
                'h-3.5 w-3.5',
                color.key === '' || color.key === 'yellow' || color.key === 'amber'
                  ? 'text-gray-800'
                  : 'text-white',
              )}
            />
          )}
        </button>
      ))}
    </div>
  )
}
