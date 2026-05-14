import { $convertToMarkdownString } from '@lexical/markdown'
import { EDITOR_TRANSFORMERS } from '../transformers'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

/**
 * Rich 模式專用：每次 editor 變更時用 $convertToMarkdownString 匯出 markdown 字串。
 * lastExportRef 記錄最後一次匯出的內容，供 InitialValuePlugin 判斷是否需要重新 import。
 */
export function OnChangePlugin({
  onChange,
  lastExportRef,
}: {
  onChange: (md: string) => void
  lastExportRef: RefObject<string>
}) {
  const [editor] = useLexicalComposerContext()
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
        editorState.read(() => {
          const md = $convertToMarkdownString(EDITOR_TRANSFORMERS).trimEnd()
          lastExportRef.current = md
          onChangeRef.current(md)
        })
      },
    )
  }, [editor, lastExportRef])

  return null
}
