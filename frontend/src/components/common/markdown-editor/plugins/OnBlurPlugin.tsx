import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

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
