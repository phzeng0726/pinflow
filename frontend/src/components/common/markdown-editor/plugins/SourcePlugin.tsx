import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect, useRef } from 'react'

/**
 * 每次 editor 狀態變更時（含 Enter 換行），同步更新 onChange 與 setLineCount。
 * Source 模式專用：直接把各段落文字 join('\n') 作為 markdown 字串輸出。
 *
 * onChange 可能是父層 inline arrow（每次 render 新 reference），若直接列入 dependency
 * 會導致 listener 不斷 unregister/re-register，造成行號更新時序錯亂。
 * 改用 ref 保存最新 onChange，讓 registerUpdateListener 只在 mount 時執行一次。
 */
export function SourcePlugin({
  onChange,
  setLineCount,
}: {
  onChange: (text: string) => void
  setLineCount: (n: number) => void
}) {
  const [editor] = useLexicalComposerContext()
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
      editorState.read(() => {
        const text = $getRoot()
          .getChildren()
          .map((node) => node.getTextContent())
          .join('\n')
        onChangeRef.current(text)
        setLineCount(text.split('\n').length)
      })
    })
  }, [editor, setLineCount])

  return null
}
