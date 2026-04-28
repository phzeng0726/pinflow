import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import {
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type LexicalNode,
} from 'lexical'
import { Loader2 } from 'lucide-react'
import { type ReactElement, useEffect, useRef, useState } from 'react'

export type SerializedImageNode = Spread<
  { src: string; altText: string },
  SerializedLexicalNode
>

function ImageComponent({
  src,
  altText,
  nodeKey,
}: {
  src: string
  altText: string
  nodeKey: NodeKey
}) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const imageRef = useRef<HTMLSpanElement>(null)
  const isBlob = src.startsWith('blob:')
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const errored = erroredSrc === src

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (
            imageRef.current &&
            (imageRef.current === event.target ||
              imageRef.current.contains(event.target as Node))
          ) {
            if (!event.shiftKey) clearSelection()
            setSelected(true)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event: KeyboardEvent) => {
          if (isSelected) {
            event.preventDefault()
            editor.update(() => {
              $getNodeByKey(nodeKey)?.remove()
            })
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event: KeyboardEvent) => {
          if (isSelected) {
            event.preventDefault()
            editor.update(() => {
              $getNodeByKey(nodeKey)?.remove()
            })
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, isSelected, nodeKey, setSelected, clearSelection])

  if (errored) {
    return (
      <span className="my-2 inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-500 dark:border-red-800 dark:bg-red-900/20">
        [broken image]
      </span>
    )
  }

  return (
    <span
      ref={imageRef}
      className={`relative my-2 block ${isSelected ? 'rounded ring-2 ring-blue-500' : ''}`}
      style={{ userSelect: 'none' }}
    >
      <img
        src={src}
        alt={altText}
        className="max-w-full rounded"
        draggable={false}
        onError={() => !isBlob && setErroredSrc(src)}
      />
      {isBlob && (
        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </span>
      )}
    </span>
  )
}

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string
  __altText: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key)
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__altText = altText
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.style.userSelect = 'none'
    return div
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  setSrc(src: string): void {
    const writable = this.getWritable()
    writable.__src = src
  }

  getAltText(): string {
    return this.__altText
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText)
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
    }
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img')
    img.src = this.__src
    img.alt = this.__altText
    return { element: img }
  }

  static importDOM(): DOMConversionMap {
    return {
      img: () => ({
        conversion: (element): DOMConversionOutput => {
          const img = element as HTMLImageElement
          const src = img.getAttribute('src') ?? ''
          const alt = img.getAttribute('alt') ?? ''
          return { node: $createImageNode(src, alt) }
        },
        priority: 0,
      }),
    }
  }

  decorate(): ReactElement {
    return <ImageComponent src={this.__src} altText={this.__altText} nodeKey={this.__key} />
  }
}

export function $createImageNode(src: string, altText: string): ImageNode {
  return new ImageNode(src, altText)
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
