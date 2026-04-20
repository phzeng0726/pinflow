import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React, { useEffect, useRef } from 'react'

/**
 * 當 ContentEditable 失去焦點時呼叫 onBlur 與 onSwitchToView。
 * 配合工具列按鈕的 onMouseDown + preventDefault，只有真正離開編輯器時才觸發。
 * suppressBlurRef 為 true 時（例如檔案選擇器開啟中）略過 blur 處理。
 *
 * 為了避免 DecoratorNode（如 ImageNode）操作時的短暫焦點移動誤觸 blur，
 * 會先檢查 relatedTarget 是否仍在 editor container 內，並用 setTimeout(0)
 * 延遲執行讓 Lexical 完成內部焦點管理。
 */
export function OnBlurPlugin({
  onBlur,
  onSwitchToView,
  suppressBlurRef,
}: {
  onBlur: () => void
  onSwitchToView: () => void
  suppressBlurRef?: React.MutableRefObject<boolean>
}) {
  const [editor] = useLexicalComposerContext()
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleBlur = (event: FocusEvent) => {
      if (suppressBlurRef?.current) return

      const rootElement = editor.getRootElement()
      if (rootElement) {
        const container =
          rootElement.closest('[data-lexical-editor-container]') ??
          rootElement.parentElement
        if (
          event.relatedTarget instanceof Node &&
          container?.contains(event.relatedTarget)
        ) {
          return
        }
      }

      if (blurTimeoutRef.current !== null) {
        clearTimeout(blurTimeoutRef.current)
      }
      blurTimeoutRef.current = setTimeout(() => {
        blurTimeoutRef.current = null
        const currentRoot = editor.getRootElement()
        if (currentRoot && currentRoot.contains(document.activeElement)) {
          return
        }
        const container =
          currentRoot?.closest('[data-lexical-editor-container]') ??
          currentRoot?.parentElement
        if (container && container.contains(document.activeElement)) {
          return
        }
        onBlur()
        onSwitchToView()
      }, 0)
    }

    return editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('blur', handleBlur as EventListener)
      rootElement?.addEventListener('blur', handleBlur as EventListener)
    })
  }, [editor, onBlur, onSwitchToView, suppressBlurRef])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  return null
}
