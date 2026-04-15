import { $isCodeNode, $createCodeNode } from '@lexical/code'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/extension'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from '@lexical/rich-text'
import type { HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getNearestNodeOfType } from '@lexical/utils'
import { cn } from '@/lib/utils'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical'

type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'bullet'
  | 'number'
  | 'check'

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation()
  const [blockType, setBlockType] = useState<BlockType>('paragraph')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isLink, setIsLink] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setIsBold(selection.hasFormat('bold'))
    setIsItalic(selection.hasFormat('italic'))
    setIsCode(selection.hasFormat('code'))

    const anchorNode = selection.anchor.getNode()
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow()

    if ($isListNode(element)) {
      const listNode = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
      const listType = listNode?.getListType()
      setBlockType(
        listType === 'check'
          ? 'check'
          : listType === 'number'
            ? 'number'
            : 'bullet',
      )
    } else if ($isHeadingNode(element)) {
      setBlockType(element.getTag() as BlockType)
    } else if ($isCodeNode(element)) {
      setBlockType('code')
    } else if ($isQuoteNode(element)) {
      setBlockType('quote')
    } else {
      setBlockType('paragraph')
    }

    const parent = anchorNode.getParent()
    setIsLink($isLinkNode(parent) || $isLinkNode(anchorNode))
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(updateToolbar)
    })
  }, [editor, updateToolbar])

  const formatBlock = (type: BlockType) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      // 相同 type 或明確設為 paragraph → 轉回 paragraph
      if (type === 'paragraph' || blockType === type) {
        $setBlocksType(selection, () => $createParagraphNode())
        return
      }

      switch (type) {
        case 'h1':
        case 'h2':
        case 'h3':
          $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType))
          break
        case 'quote':
          $setBlocksType(selection, () => $createQuoteNode())
          break
        case 'code':
          $setBlocksType(selection, () => $createCodeNode())
          break
      }
    })
  }

  const formatList = (listType: 'bullet' | 'number' | 'check') => {
    if (blockType === listType) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
      return
    }
    const command =
      listType === 'bullet'
        ? INSERT_UNORDERED_LIST_COMMAND
        : listType === 'number'
          ? INSERT_ORDERED_LIST_COMMAND
          : INSERT_CHECK_LIST_COMMAND
    editor.dispatchCommand(command, undefined)
  }

  const insertHR = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
  }

  const insertLink = () => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    } else {
      const url = window.prompt(t('toolbar.linkPrompt'))
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url })
        editor.focus()
      }
    }
  }

  const btn = (active: boolean) =>
    cn(
      'flex h-7 w-7 items-center justify-center rounded p-1 transition-colors',
      active
        ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300',
    )

  const sep = (
    <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600" />
  )

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-800/50"
      onMouseDown={(e) => e.preventDefault()} // 防止任何工具列操作觸發 editor blur
    >
      {/* 標題 */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('h1') }}
        className={btn(blockType === 'h1')}
        title={t('toolbar.h1')}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('h2') }}
        className={btn(blockType === 'h2')}
        title={t('toolbar.h2')}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('h3') }}
        className={btn(blockType === 'h3')}
        title={t('toolbar.h3')}
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('paragraph') }}
        className={btn(blockType === 'paragraph')}
        title={t('toolbar.paragraph')}
      >
        <Type className="h-4 w-4" />
      </button>

      {sep}

      {/* 行內格式 */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold') }}
        className={btn(isBold)}
        title={t('toolbar.bold')}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic') }}
        className={btn(isItalic)}
        title={t('toolbar.italic')}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code') }}
        className={btn(isCode)}
        title={t('toolbar.inlineCode')}
      >
        <Code className="h-4 w-4" />
      </button>

      {sep}

      {/* 區塊格式 */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('code') }}
        className={btn(blockType === 'code')}
        title={t('toolbar.codeBlock')}
      >
        <Code2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatBlock('quote') }}
        className={btn(blockType === 'quote')}
        title={t('toolbar.blockquote')}
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); insertHR() }}
        className={btn(false)}
        title={t('toolbar.horizontalRule')}
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); insertLink() }}
        className={btn(isLink)}
        title={t('toolbar.link')}
      >
        <Link className="h-4 w-4" />
      </button>

      {sep}

      {/* 清單 */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatList('bullet') }}
        className={btn(blockType === 'bullet')}
        title={t('toolbar.bulletList')}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatList('number') }}
        className={btn(blockType === 'number')}
        title={t('toolbar.orderedList')}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); formatList('check') }}
        className={btn(blockType === 'check')}
        title={t('toolbar.checkboxList')}
      >
        <ListChecks className="h-4 w-4" />
      </button>
    </div>
  )
}
