import { TRANSFORMERS } from '@lexical/markdown'
import { IMAGE_ELEMENT, IMAGE_TEXT } from './image'

export const EDITOR_TRANSFORMERS = [...TRANSFORMERS, IMAGE_ELEMENT, IMAGE_TEXT]
