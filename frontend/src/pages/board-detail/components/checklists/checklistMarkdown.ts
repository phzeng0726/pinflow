import type { ChecklistItem } from '@/types'

export function itemsToMarkdown(items: ChecklistItem[]): string {
  return items.map((item) => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n')
}

export function markdownToItems(text: string): { text: string; completed: boolean }[] {
  const pattern = /^- \[([ xX])\] (.+)$/
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(pattern)
      if (!match) return null
      return {
        text: match[2],
        completed: match[1].toLowerCase() === 'x',
      }
    })
    .filter((item): item is { text: string; completed: boolean } => item !== null)
}
