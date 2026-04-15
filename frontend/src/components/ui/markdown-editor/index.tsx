import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { ListNode, ListItemNode } from '@lexical/list'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { cn } from '@/lib/utils'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { useCallback, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ToolbarPlugin } from './ToolbarPlugin'
import {
  AutoFocusPlugin,
  InitialValuePlugin,
  OnBlurPlugin,
  OnChangePlugin,
  SourcePlugin,
} from './plugins'

interface MarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  onBlur: () => void
  placeholder?: string
}

/** Lexical 節點列表（Rich 模式用） */
const RICH_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  HorizontalRuleNode,
]

/** Lexical theme（Rich 模式用）：直接使用 Tailwind utility class */
const RICH_THEME = {
  heading: {
    h1: 'text-2xl font-bold mt-3 mb-2',
    h2: 'text-xl font-bold mt-3 mb-2',
    h3: 'text-lg font-semibold mt-3 mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    code: 'rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.875em] dark:bg-gray-700 dark:text-gray-200',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  quote:
    'my-2 border-l-4 border-gray-300 pl-4 text-gray-600 dark:border-gray-600 dark:text-gray-400',
  code: 'block my-2 overflow-x-auto rounded-md bg-gray-100 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200',
  list: {
    ul: 'my-1 list-disc pl-6',
    ol: 'my-1 list-decimal pl-6',
    listitem: 'my-0.5',
    listitemChecked: 'opacity-60 line-through',
    listitemUnchecked: '',
    nested: {
      list: '',
      listitem: 'list-none',
    },
  },
  link: 'cursor-pointer text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editorMode, setEditorMode] = useState<'source' | 'rich'>('source')
  const [lineCount, setLineCount] = useState(() => value.split('\n').length)

  /**
   * Rich 模式：記錄最後一次 export 的 markdown，
   * 讓 InitialValuePlugin 能分辨「自己匯出後帶回的 value」與「外部真正的變更」。
   */
  const lastExportRef = useRef(value)

  const handleSwitchToView = useCallback(() => setIsEditing(false), [])

  const switchMode = useCallback(
    (mode: 'source' | 'rich') => {
      if (mode === 'source') setLineCount(value.split('\n').length)
      // 切換前同步 lastExportRef，避免 InitialValuePlugin 誤觸發 re-import
      lastExportRef.current = value
      setEditorMode(mode)
    },
    [value],
  )

  // ── View 模式 ──────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div
        className="markdown-editor-content markdown-preview min-h-[120px] cursor-text rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/30"
        onClick={() => setIsEditing(true)}
      >
        {value ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
        )}
      </div>
    )
  }

  // ── Edit 模式 ──────────────────────────────────────────────────
  const gutterDigits = Math.max(2, String(lineCount).length)

  const sourceInitialConfig = {
    namespace: 'MarkdownSourceEditor',
    onError: (error: Error) => console.error('[MarkdownSourceEditor]', error),
    editorState: () => {
      const root = $getRoot()
      root.clear()
      for (const line of value.split('\n')) {
        const paragraph = $createParagraphNode()
        if (line) paragraph.append($createTextNode(line))
        root.append(paragraph)
      }
    },
  }

  const richInitialConfig = {
    namespace: 'MarkdownRichEditor',
    onError: (error: Error) => console.error('[MarkdownRichEditor]', error),
    theme: RICH_THEME,
    nodes: RICH_NODES,
    editorState: () => {
      $convertFromMarkdownString(value, TRANSFORMERS)
    },
  }

  return (
    <div className="space-y-1">
      {/* 模式切換 */}
      <div className="flex justify-end">
        <div className="flex overflow-hidden rounded border border-gray-200 text-xs dark:border-gray-600">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              switchMode('source')
            }}
            className={cn(
              'px-2.5 py-0.5 transition-colors',
              editorMode === 'source'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50',
            )}
          >
            Source
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              switchMode('rich')
            }}
            className={cn(
              'border-l border-gray-200 px-2.5 py-0.5 transition-colors dark:border-gray-600',
              editorMode === 'rich'
                ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white'
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50',
            )}
          >
            Rich
          </button>
        </div>
      </div>

      {/* Source 編輯器 */}
      {editorMode === 'source' && (
        <LexicalComposer initialConfig={sourceInitialConfig}>
          <div className="overflow-hidden rounded-md border border-gray-300 focus-within:ring-1 focus-within:ring-ring dark:border-gray-500">
            <div className="flex">
              {/* 行號欄 */}
              <div
                aria-hidden
                className="shrink-0 select-none border-r border-gray-200 bg-gray-50 py-2 pl-2 pr-3 text-right font-mono text-xs text-gray-400 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-500"
                style={{ minWidth: `${gutterDigits * 0.6 + 1.2}rem` }}
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="source-editor-line">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* 編輯區（橫向可捲動） */}
              <div className="relative min-w-0 flex-1 overflow-x-auto">
                <PlainTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="markdown-source-editor min-h-[120px] py-2 pl-3 pr-4 font-mono text-sm outline-none"
                      aria-placeholder={placeholder ?? ''}
                      placeholder={
                        <div className="pointer-events-none absolute left-3 top-2 select-none font-mono text-sm text-gray-400 dark:text-gray-500">
                          {placeholder}
                        </div>
                      }
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </div>
            </div>
          </div>
          <SourcePlugin onChange={onChange} setLineCount={setLineCount} />
          <OnBlurPlugin onBlur={onBlur} onSwitchToView={handleSwitchToView} />
          <AutoFocusPlugin />
        </LexicalComposer>
      )}

      {/* Rich 編輯器 */}
      {editorMode === 'rich' && (
        <LexicalComposer initialConfig={richInitialConfig}>
          <div className="overflow-hidden rounded-md border border-gray-300 focus-within:ring-1 focus-within:ring-ring dark:border-gray-500">
            <ToolbarPlugin />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="min-h-[120px] px-3 py-2 text-sm outline-none"
                    aria-placeholder={placeholder ?? ''}
                    placeholder={
                      <div className="pointer-events-none absolute left-3 top-2 select-none text-sm text-gray-400 dark:text-gray-500">
                        {placeholder}
                      </div>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </div>
          <OnChangePlugin onChange={onChange} lastExportRef={lastExportRef} />
          <OnBlurPlugin onBlur={onBlur} onSwitchToView={handleSwitchToView} />
          <InitialValuePlugin value={value} lastExportRef={lastExportRef} />
          <AutoFocusPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <HorizontalRulePlugin />
        </LexicalComposer>
      )}
    </div>
  )
}
