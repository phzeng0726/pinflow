import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  type LexicalNode,
  type ParagraphNode,
} from 'lexical'
import { useEffect } from 'react'

const NBSP = String.fromCharCode(160)
const INDENT = NBSP + NBSP

function getTextNode(paragraph: ParagraphNode) {
  const first = paragraph.getFirstChild()
  if (first && $isTextNode(first)) return first
  const textNode = $createTextNode('')
  paragraph.append(textNode)
  return textNode
}

export function SourceTabPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_TAB_COMMAND,
      (event) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return false

        event.preventDefault()
        const isOutdent = event.shiftKey

        const anchor = selection.anchor
        const focus = selection.focus
        const anchorNode = anchor.getNode()
        const focusNode = focus.getNode()

        const anchorParagraph = $isTextNode(anchorNode)
          ? anchorNode.getParent()
          : anchorNode
        const focusParagraph = $isTextNode(focusNode)
          ? focusNode.getParent()
          : focusNode

        if (!anchorParagraph || !focusParagraph) return false
        if (!$isParagraphNode(anchorParagraph) || !$isParagraphNode(focusParagraph))
          return false

        const isMultiLine = anchorParagraph !== focusParagraph

        if (!isMultiLine) {
          const textNode = getTextNode(anchorParagraph)
          const text = textNode.getTextContent()

          if (isOutdent) {
            let removed = 0
            if (text.startsWith(INDENT)) {
              removed = 2
            } else if (text[0] === NBSP || text[0] === ' ') {
              removed = 1
            }
            if (removed > 0) {
              textNode.setTextContent(text.slice(removed))
              const key = textNode.getKey()
              selection.anchor.set(key, Math.max(0, anchor.offset - removed), 'text')
              selection.focus.set(key, Math.max(0, focus.offset - removed), 'text')
            }
          } else {
            textNode.setTextContent(INDENT + text)
            const key = textNode.getKey()
            selection.anchor.set(key, anchor.offset + 2, 'text')
            selection.focus.set(key, focus.offset + 2, 'text')
          }
        } else {
          const paragraphs: ParagraphNode[] = []
          let current: ParagraphNode | null = anchorParagraph

          const isBefore =
            anchorParagraph.isBefore(focusParagraph)
          const startParagraph = isBefore ? anchorParagraph : focusParagraph
          const endParagraph = isBefore ? focusParagraph : anchorParagraph

          current = startParagraph
          while (current) {
            paragraphs.push(current)
            if (current === endParagraph) break
            const next: LexicalNode | null = current.getNextSibling()
            current = next && $isParagraphNode(next) ? next : null
          }

          for (const para of paragraphs) {
            const textNode = getTextNode(para)
            const text = textNode.getTextContent()
            const key = textNode.getKey()

            if (isOutdent) {
              let removed = 0
              if (text.startsWith(INDENT)) {
                removed = 2
              } else if (text.startsWith(' ')) {
                removed = 1
              }
              if (removed > 0) {
                textNode.setTextContent(text.slice(removed))
                if (key === anchor.key || anchorParagraph === para) {
                  selection.anchor.set(key, Math.max(0, anchor.offset - removed), 'text')
                }
                if (key === focus.key || focusParagraph === para) {
                  selection.focus.set(key, Math.max(0, focus.offset - removed), 'text')
                }
              }
            } else {
              textNode.setTextContent(INDENT + text)
              if (key === anchor.key || anchorParagraph === para) {
                selection.anchor.set(key, anchor.offset + 2, 'text')
              }
              if (key === focus.key || focusParagraph === para) {
                selection.focus.set(key, focus.offset + 2, 'text')
              }
            }
          }
        }

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}
