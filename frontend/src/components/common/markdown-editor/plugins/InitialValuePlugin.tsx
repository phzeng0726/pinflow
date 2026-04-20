import { $convertFromMarkdownString } from '@lexical/markdown'
import { EDITOR_TRANSFORMERS } from '../transformers'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { RefObject } from 'react'
import { useEffect } from 'react'

/**
 * Rich 模式專用：外部 value 變更時重新 import markdown。
 * 以 lastExportRef 比對，只有當外部 value 與最後一次匯出值不同時才執行，
 * 避免自身 export 後 react-query refetch 帶回相同值造成游標跳回開頭。
 */
export function InitialValuePlugin({
  value,
  lastExportRef,
}: {
  value: string
  lastExportRef: RefObject<string>
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value === lastExportRef.current) return
    lastExportRef.current = value
    editor.update(() => {
      $convertFromMarkdownString(value, EDITOR_TRANSFORMERS)
    })
  }, [editor, value, lastExportRef])

  return null
}
