import { type ElementTransformer, type TextMatchTransformer } from '@lexical/markdown'
import { type LexicalNode } from 'lexical'
import { $createImageNode, $isImageNode, ImageNode } from '../nodes/ImageNode'

/**
 * ElementTransformer 負責 export：
 * ImageNode 是 DecoratorNode（不是 ElementNode），
 * $convertToMarkdownString 只對 top-level 節點呼叫 ElementTransformer.export()，
 * TextMatchTransformer.export() 只在 ElementNode 的 children 階段才觸發。
 * 因此必須用 ElementTransformer 才能正確匯出 DecoratorNode。
 *
 * 同時也處理 import：整行只有 ![alt](url) 的情況。
 */
export const IMAGE_ELEMENT: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node: LexicalNode) => {
    if (!$isImageNode(node)) return null
    const src = node.getSrc()
    if (src.startsWith('blob:')) return ''
    return `![${node.getAltText()}](${src})`
  },
  regExp: /^!\[([^\]]*)\]\(([^)]+)\)\s*$/,
  replace: (parentNode, _children, match) => {
    const [, alt, src] = match
    const imageNode = $createImageNode(src, alt)
    parentNode.replace(imageNode)
  },
  type: 'element',
}

/**
 * TextMatchTransformer 負責 import：
 * 處理段落文字中內嵌的 ![alt](url) 圖片語法（非獨立一行的情況）。
 * export 不在此處理（由 IMAGE_ELEMENT 負責）。
 */
export const IMAGE_TEXT: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: () => null,
  importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: (textNode, match) => {
    const [, alt, src] = match
    const imageNode = $createImageNode(src, alt)
    textNode.replace(imageNode)
  },
  trigger: ')',
  type: 'text-match',
}
