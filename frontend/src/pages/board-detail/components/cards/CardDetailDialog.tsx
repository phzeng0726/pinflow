import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { useCardDetail } from '@/hooks/card/queries/useCardDetail'
import { useDependencyMutations } from '@/hooks/dependency/mutations/useDependencyMutations'
import { useDependencies } from '@/hooks/dependency/queries/useDependencies'
import { useTagMutations } from '@/hooks/tag/mutations/useTagMutations'
import { type EditCardForm, editCardSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { ChecklistSection } from '@/pages/board-detail/components/checklists/ChecklistSection'
import { CommentSection } from '@/pages/board-detail/components/comments/CommentSection'
import {
  getTagColorClasses,
  resolveDependencyView,
} from '@/pages/board-detail/components/styleConfig'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@radix-ui/react-label'
import { Notebook, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { DependencyPopover } from './DependencyPopover'
import { PriorityPopover } from './PriorityPopover'
import { SchedulePopover } from './SchedulePopover'
import { StoryPointPopover } from './StoryPointPopover'
import { TagsPopover } from './TagsPopover'

interface CardDetailDialogProps {
  boardId: number
  cardId: number
  onClose: () => void
}

export function CardDetailDialog(props: CardDetailDialogProps) {
  const { boardId, cardId, onClose } = props
  const { data: card, isLoading } = useCardDetail(cardId)
  const { updateCard } = useCardMutations(boardId)
  const { detachTag } = useTagMutations(boardId)
  const [tagsOpen, setTagsOpen] = useState(false)
  const { data: dependencies = [] } = useDependencies(cardId)
  const { deleteDep } = useDependencyMutations(cardId, boardId)

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
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
        <DialogTitle className="sr-only">卡片詳情</DialogTitle>

        {/* 頂部標題區 */}
        <div className="flex items-start gap-3 border-b px-6 py-3 dark:border-gray-700">
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
        <div className="flex flex-1 flex-row overflow-hidden">
          {/* 左側主內容 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="space-y-6">
                {/* Number, SP 與 Tags 並排 */}
                <div className="flex flex-wrap gap-x-6 gap-y-4">
                  {/* Card Number */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Card Number
                    </Label>
                    <div className="flex h-8 items-center justify-center rounded border border-gray-300 bg-gray-100 px-2 text-sm font-medium dark:border-gray-600 dark:bg-gray-700">
                      # {card.id}
                    </div>
                  </div>

                  {/* Story Points */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Story Points
                    </Label>
                    <StoryPointPopover boardId={boardId} card={card} />
                  </div>

                  {/* Priority */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Priority
                    </Label>
                    <PriorityPopover boardId={boardId} card={card} />
                  </div>

                  {/* Schedule */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Schedule
                    </Label>
                    <SchedulePopover boardId={boardId} card={card} />
                  </div>

                  {/* Dependencies */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Dependencies
                    </Label>
                    <div className="flex flex-wrap items-center gap-1">
                      {dependencies.map((dep) => {
                        const { label, otherCardTitle } = resolveDependencyView(
                          dep,
                          card.id,
                        )
                        return (
                          <Badge
                            key={dep.id}
                            variant="secondary"
                            className="flex h-8 items-center gap-1 rounded px-2 py-0.5 text-xs"
                          >
                            <span className="text-gray-500 dark:text-gray-400">
                              {label}:
                            </span>
                            <span>{otherCardTitle}</span>
                            <button
                              type="button"
                              onClick={() => deleteDep.mutate(dep.id)}
                              className="ml-0.5 h-3 w-3 opacity-60 hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                      <DependencyPopover boardId={boardId} card={card} />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="min-w-0 flex-1">
                    <Label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Tags
                    </Label>
                    <div className="flex flex-wrap items-center gap-1">
                      {(card.tags ?? []).map((tag) => {
                        const colorCls = getTagColorClasses(tag.color)
                        return (
                          <Badge
                            key={tag.id}
                            variant={tag.color ? 'outline' : 'secondary'}
                            onClick={() => setTagsOpen(true)}
                            className={cn(
                              'flex h-8 cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs',
                              tag.color &&
                                `${colorCls.bg} border-transparent text-white transition-opacity hover:opacity-80`,
                            )}
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                detachTag.mutate({
                                  cardId: card.id,
                                  tagId: tag.id,
                                })
                              }}
                              className={cn(
                                'ml-0.5 h-3 w-3 p-0 opacity-60 hover:opacity-100',
                                tag.color ? 'text-white' : '',
                              )}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                      <TagsPopover
                        boardId={boardId}
                        card={card}
                        open={tagsOpen}
                        onOpenChange={setTagsOpen}
                      />
                    </div>
                  </div>
                </div>

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

          {/* 右側 CommentSection */}
          <div className="flex w-80 flex-col border-l dark:border-gray-700">
            <CommentSection
              cardId={card.id}
              boardId={boardId}
              comments={card.comments ?? []}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
