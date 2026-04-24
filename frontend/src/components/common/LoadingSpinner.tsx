import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  /** fullPage: centered on full screen; inline: small inline spinner */
  variant?: 'fullPage' | 'inline'
  className?: string
}

export function LoadingSpinner({
  variant = 'fullPage',
  className,
}: LoadingSpinnerProps) {
  if (variant === 'inline') {
    return (
      <Loader2
        className={className ?? 'h-4 w-4 animate-spin text-gray-400'}
      />
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2
        className={
          className ?? 'h-8 w-8 animate-spin text-gray-400 dark:text-gray-500'
        }
      />
    </div>
  )
}
