import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { ChecklistItem } from '@/types'
import { itemsToMarkdown, markdownToItems } from './checklistMarkdown'

interface ChecklistMarkdownEditorProps {
  items: ChecklistItem[]
  onSave: (items: { text: string; completed: boolean }[]) => void
  onCancel: () => void
}

export function ChecklistMarkdownEditor({
  items,
  onSave,
  onCancel,
}: ChecklistMarkdownEditorProps) {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const initialValue = items.length > 0 ? itemsToMarkdown(items) : '- [ ] '
  const [value, setValue] = useState(initialValue)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const textarea = textareaRef.current
    if (!textarea) return

    const pos = textarea.selectionStart
    const text = textarea.value
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1
    const lineEnd = text.indexOf('\n', pos)
    const fullLine = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)

    const emptyPrefixPattern = /^- \[[ xX]\] $/
    if (emptyPrefixPattern.test(fullLine)) {
      let newText: string
      let newCursor: number
      if (lineEnd === -1) {
        // 最後一行：同時移除前面的換行符
        newText = lineStart > 0 ? text.slice(0, lineStart - 1) : ''
        newCursor = lineStart > 0 ? lineStart - 1 : 0
      } else {
        // 中間行：移除整行（含尾端換行符）
        newText = text.slice(0, lineStart) + text.slice(lineEnd + 1)
        newCursor = lineStart
      }
      setValue(newText)
      requestAnimationFrame(() => {
        textarea.selectionStart = newCursor
        textarea.selectionEnd = newCursor
      })
      return
    }

    const prefix = '- [ ] '
    const newText = text.slice(0, pos) + '\n' + prefix + text.slice(pos)
    setValue(newText)
    const newPos = pos + 1 + prefix.length
    requestAnimationFrame(() => {
      textarea.selectionStart = newPos
      textarea.selectionEnd = newPos
    })
  }

  const handleSave = () => {
    const parsed = markdownToItems(value)
    onSave(parsed)
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-none rounded border bg-transparent p-2 font-mono text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:text-gray-200"
        rows={Math.max(4, value.split('\n').length + 1)}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
          {t('common.save')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
