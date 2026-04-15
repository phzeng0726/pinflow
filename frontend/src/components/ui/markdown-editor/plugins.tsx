import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

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
    return editor.registerUpdateListener(({ editorState }) => {
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

/**
 * Rich 模式專用：每次 editor 變更時用 $convertToMarkdownString 匯出 markdown 字串。
 * lastExportRef 記錄最後一次匯出的內容，供 InitialValuePlugin 判斷是否需要重新 import。
 */
export function OnChangePlugin({
  onChange,
  lastExportRef,
}: {
  onChange: (md: string) => void
  lastExportRef: MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const md = $convertToMarkdownString(TRANSFORMERS)
        lastExportRef.current = md
        onChangeRef.current(md)
      })
    })
  }, [editor, lastExportRef])

  return null
}

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
  lastExportRef: MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value === lastExportRef.current) return
    lastExportRef.current = value
    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS)
    })
  }, [editor, value, lastExportRef])

  return null
}

/**
 * 當 ContentEditable 失去焦點時呼叫 onBlur 與 onSwitchToView。
 * 配合工具列按鈕的 onMouseDown + preventDefault，只有真正離開編輯器時才觸發。
 */
export function OnBlurPlugin({
  onBlur,
  onSwitchToView,
}: {
  onBlur: () => void
  onSwitchToView: () => void
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const handleBlur = () => {
      onBlur()
      onSwitchToView()
    }
    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('blur', handleBlur)
      rootElement?.addEventListener('blur', handleBlur)
    })
  }, [editor, onBlur, onSwitchToView])

  return null
}

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
