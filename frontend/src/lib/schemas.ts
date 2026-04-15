import type { TFunction } from 'i18next'
import { z } from 'zod'

// ─── Board ──────────────────────────────────────────────────────────────────

export function createBoardSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('validation.boardName')),
  })
}

export type NewOrEditBoardForm = z.infer<ReturnType<typeof createBoardSchema>>

// ─── Column ──────────────────────────────────────────────────────────────────

export function createColumnSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('validation.columnName')),
  })
}

export type NewColumnForm = z.infer<ReturnType<typeof createColumnSchema>>

export const editColumnSchema = z.object({
  name: z.string().optional(),
  autoPin: z.boolean().optional(),
})

export type EditColumnForm = z.infer<typeof editColumnSchema>

// ─── Card ──────────────────────────────────────────────────────────────────

export function createCardSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('validation.cardTitle')),
  })
}

export type NewCardForm = z.infer<ReturnType<typeof createCardSchema>>

const timeField = z
  .string()
  .transform((v) => (v === '' ? undefined : v))
  .optional()

export function createEditCardSchema(t: TFunction) {
  return z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      storyPoint: z.number().optional(),
      priority: z.number().optional(),
      startTime: timeField,
      endTime: timeField,
    })
    .refine((d) => !(d.startTime && d.endTime && d.endTime < d.startTime), {
      message: t('validation.endBeforeStart'),
      path: ['endTime'],
    })
}

export type EditCardForm = z.infer<ReturnType<typeof createEditCardSchema>>

export const tagInputSchema = z.object({
  input: z.string(),
})

export function createTagSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('validation.tagName')),
    color: z.string().optional(),
  })
}

export type TagForm = z.infer<ReturnType<typeof createTagSchema>>

export function createChecklistSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('validation.checklistTitle')),
  })
}

export type ChecklistFormData = z.infer<ReturnType<typeof createChecklistSchema>>

export function createChecklistItemSchema(t: TFunction) {
  return z.object({
    text: z.string().min(1, t('validation.checklistItemText')),
  })
}

export type ChecklistItemFormData = z.infer<ReturnType<typeof createChecklistItemSchema>>

export function createDuplicateCardSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('validation.cardTitle')),
    copyTags: z.boolean(),
    copyChecklists: z.boolean(),
    copySchedule: z.boolean(),
    pin: z.boolean(),
    selectedBoardId: z.number(),
    selectedColumnId: z.number().min(1, t('validation.targetColumn')),
    position: z.number(),
  })
}

export type DuplicateCardFormData = z.infer<ReturnType<typeof createDuplicateCardSchema>>
