import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

/**
 * 掛載後自動聚焦 editor（用於從 view 模式切換至 edit 模式）。
 */
export function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.focus()
  }, [editor])

  return null
}
