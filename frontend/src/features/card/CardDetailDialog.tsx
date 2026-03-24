import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { type EditCardForm, editCardSchema } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@radix-ui/react-label'
import { Notebook, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog'
import { useCardDetail } from '../../hooks/card/queries/useCardDetail'
import { ChecklistSection } from './ChecklistSection'
import { ScheduleSection } from './ScheduleSection'
import { StoryPointSelector } from './StoryPointSelector'
import { TagSection } from './TagSection'

interface CardDetailDialogProps {
  boardId: number
  cardId: number
  onClose: () => void
}

export function CardDetailDialog(props: CardDetailDialogProps) {
  const { boardId, cardId, onClose } = props
  const { data: card, isLoading } = useCardDetail(cardId)
  const { updateCard } = useCardMutations(boardId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditCardForm>({
    resolver: zodResolver(editCardSchema),
    // 這裡很關鍵：當 card 讀取完畢後，確保預設值正確
    values: {
      title: card?.title ?? '',
      description: card?.description ?? '',
    },
  })

  // 統一處理提交邏輯
  const onSubmit = async (form: EditCardForm) => {
    // 只有當內容真的有變動時才發送請求 (優化效能)
    if (form.title === card?.title && form.description === card?.description)
      return

    await updateCard.mutateAsync({
      id: cardId,
      form: {
        title: form.title,
        description: form.description,
      },
    })
  }

  // 封裝一個 blur 處理函數
  const handleBlur = () => {
    handleSubmit(onSubmit)()
  }

  if (isLoading) return <div>Loading...</div>
  if (!card) return <div>Card not found</div>

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogTitle className="sr-only">卡片詳情</DialogTitle>

        {/* 頂部標題區 */}
        <div className="flex items-start gap-3 border-b p-6 dark:border-gray-700">
          <div className="flex-1">
            <Input
              {...register('title')}
              onBlur={handleBlur} // 失去焦點時儲存
              className="w-full border-transparent bg-transparent px-1 text-xl font-semibold shadow-none focus-visible:ring-1"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 內容區 */}
        <div className="p-6">
          <div className="space-y-4">
            {/* 其他組件 */}
            <div className="space-y-6">
              <StoryPointSelector boardId={boardId} card={card} />
              <TagSection boardId={boardId} card={card} />
              <ScheduleSection boardId={boardId} card={card} />

              <div className="space-y-2">
                <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Notebook className="h-4 w-4" /> 描述
                </Label>

                <Textarea
                  {...register('description')}
                  onBlur={handleBlur} // 失去焦點時儲存
                  placeholder="Add a description..."
                  rows={6}
                  className="w-full resize-none border-transparent bg-gray-50 p-3 text-sm focus-visible:ring-1 dark:bg-gray-800/50"
                />
              </div>
              <ChecklistSection boardId={boardId} card={card} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
