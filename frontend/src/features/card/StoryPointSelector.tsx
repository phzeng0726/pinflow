import { Flame, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { cn } from '../../lib/utils'

const STORY_POINTS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

interface StoryPointSelectorProps {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}

export function StoryPointSelector(props: StoryPointSelectorProps) {
  const { value, onChange, disabled } = props

  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Flame className="h-4 w-4" /> Story Point
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {STORY_POINTS.map((sp) => (
          <Button
            key={sp}
            type="button"
            variant={value === sp ? 'default' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(value === sp ? null : sp)}
            className={cn(
              'h-7 w-9 text-xs font-medium',
              value === sp &&
                'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
            )}
          >
            {sp}
          </Button>
        ))}
        {value != null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
