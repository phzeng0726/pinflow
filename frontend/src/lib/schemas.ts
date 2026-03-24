import { z } from 'zod'

// ─── Board ──────────────────────────────────────────────────────────────────

export const newOrEditBoardSchema = z.object({
  name: z.string().min(1, '請輸入看板名稱'),
})

export type NewOrEditBoardForm = z.infer<typeof newOrEditBoardSchema>

// ─── Column ──────────────────────────────────────────────────────────────────

export const newColumnSchema = z.object({
  name: z.string().min(1, '請輸入欄位名稱'),
})

export type NewColumnForm = z.infer<typeof newColumnSchema>

export const editColumnSchema = z.object({
  name: z.string().optional(),
  autoPin: z.boolean().optional(),
})

export type EditColumnForm = z.infer<typeof editColumnSchema>

// ─── Card ──────────────────────────────────────────────────────────────────

export const newCardSchema = z.object({
  title: z.string().min(1, '請輸入標題'),
})

export type NewCardForm = z.infer<typeof newCardSchema>

export const editCardSchema = z.object({
  title: z.string().min(1, '請輸入標題'),
  description: z.string().optional(),
  storyPoint: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export type EditCardForm = z.infer<typeof editCardSchema>

export const scheduleSchema = z
  .object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine((d) => !(d.startTime && d.endTime && d.endTime < d.startTime), {
    message: '結束時間必須晚於開始時間',
    path: ['endTime'],
  })

export const tagInputSchema = z.object({
  input: z.string(),
})

export const tagFormSchema = z.object({
  name: z.string().min(1, '請輸入標籤名稱'),
  color: z.string().optional(),
})

export const checklistSchema = z.object({
  title: z.string().min(1, '請輸入清單標題'),
})

export const checklistItemSchema = z.object({
  text: z.string().min(1, '請輸入項目文字'),
})

export const duplicateCardSchema = z.object({
  title: z.string().min(1, '請輸入標題'),
  copyTags: z.boolean(),
  copyChecklists: z.boolean(),
  copySchedule: z.boolean(),
  pin: z.boolean(),
  selectedBoardId: z.number(),
  selectedColumnId: z.number().min(1, '請選擇目標欄位'),
  position: z.number(),
})
