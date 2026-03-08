import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Compute position between two sorted items (LexoRank simplified) */
export function midPosition(before: number | null, after: number | null): number {
  const b = before ?? 0
  const a = after ?? b + 2
  return (b + a) / 2
}
