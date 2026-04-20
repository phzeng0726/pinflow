import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { uploadImage } from '@/lib/api'
import { $convertToMarkdownString } from '@lexical/markdown'
import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  DROP_COMMAND,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $insertNodes,
  type LexicalCommand,
  type LexicalEditor,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { $createImageNode, ImageNode } from '../nodes/ImageNode'
import { EDITOR_TRANSFORMERS } from '../transformers'
import { useTranslation } from 'react-i18next'

export const INSERT_IMAGE_COMMAND: LexicalCommand<{ src: string; altText: string }> =
  createCommand('INSERT_IMAGE_COMMAND')

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']

export async function insertImageFromFile(
  editor: LexicalEditor,
  cardId: number | undefined,
  file: File,
  t: ReturnType<typeof useTranslation>['t'],
  /** 上傳完成後以最終 markdown 直接呼叫 onChange，
   *  確保即使 OnChangePlugin 已 unmount（使用者在上傳前就 blur）也能儲存圖片 */
  onChange?: (md: string) => void,
): Promise<void> {
  if (file.size > MAX_SIZE) {
    toast.error(t('toolbar.imageSizeError'))
    return
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) {
    toast.error(t('toolbar.imageUploadError'))
    return
  }

  const blobUrl = URL.createObjectURL(file)

  let insertedKey: string | null = null
  editor.update(() => {
    const node = $createImageNode(blobUrl, file.name)
    insertedKey = node.getKey()
    try {
      $insertNodes([node])
    } catch {
      $getRoot().append(node)
    }
    // 確保圖片後面有段落供游標停放
    if (node.getNextSibling() === null) {
      const trailing = $createParagraphNode()
      node.insertAfter(trailing)
      trailing.select()
    }
  })

  if (cardId == null) {
    URL.revokeObjectURL(blobUrl)
    return
  }

  try {
    const url = await uploadImage(cardId, file)
    // editor 可能在上傳期間已被 unmount，用 try/catch 防護
    try {
      // 用一次性 updateListener 確保在 setSrc 提交後讀取最新 markdown，
      // 即使 OnChangePlugin 已 unmount（使用者在上傳前就 blur）也能儲存圖片。
      if (onChange) {
        const unsubscribe = editor.registerUpdateListener(({ editorState }) => {
          unsubscribe()
          editorState.read(() => {
            onChange($convertToMarkdownString(EDITOR_TRANSFORMERS))
          })
        })
      }
      editor.update(() => {
        if (insertedKey) {
          const node = $getNodeByKey(insertedKey)
          if (node instanceof ImageNode) {
            node.setSrc(url)
          }
        }
      })
    } catch {
      // editor 已銷毀，忽略
    }
  } catch {
    try {
      editor.update(() => {
        if (insertedKey) {
          $getNodeByKey(insertedKey)?.remove()
        }
      })
    } catch {
      // editor 已銷毀，忽略
    }
    toast.error(t('toolbar.imageUploadError'))
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export function ImagePlugin({
  cardId,
  onChange,
}: {
  cardId?: number
  onChange?: (md: string) => void
}) {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation()

  useEffect(() => {
    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (files.length === 0) return false
        event.preventDefault()
        files.forEach((file) => insertImageFromFile(editor, cardId, file, t, onChange))
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (files.length === 0) return false
        event.preventDefault()
        files.forEach((file) => insertImageFromFile(editor, cardId, file, t, onChange))
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregisterPaste()
      unregisterDrop()
    }
  }, [editor, cardId, t, onChange])

  return null
}
