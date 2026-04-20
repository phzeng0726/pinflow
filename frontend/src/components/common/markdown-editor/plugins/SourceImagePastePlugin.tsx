import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { uploadImage } from '@/lib/api'
import {
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']

export function SourceImagePastePlugin({ cardId }: { cardId?: number }) {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation()

  useEffect(() => {
    const handleFiles = (files: File[]) => {
      const imageFiles = files.filter(
        (f) => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.svg'),
      )
      if (imageFiles.length === 0) return false

      imageFiles.forEach(async (file) => {
        if (file.size > MAX_SIZE) {
          toast.error(t('toolbar.imageSizeError'))
          return
        }
        if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) {
          toast.error(t('toolbar.imageUploadError'))
          return
        }
        if (cardId == null) return

        const toastId = toast.loading('Uploading...')
        try {
          const url = await uploadImage(cardId, file)
          toast.dismiss(toastId)
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertText(`![image](${url})`)
            } else {
              const para = $createParagraphNode()
              para.append($createTextNode(`![image](${url})`))
              $getRoot().append(para)
            }
          })
        } catch {
          toast.dismiss(toastId)
          toast.error(t('toolbar.imageUploadError'))
        }
      })

      return true
    }

    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        const handled = handleFiles(files)
        if (handled) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = Array.from(event.dataTransfer?.files ?? [])
        const handled = handleFiles(files)
        if (handled) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregisterPaste()
      unregisterDrop()
    }
  }, [editor, cardId, t])

  return null
}
