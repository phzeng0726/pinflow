import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useBoards, useBoard } from '../../hooks/board/queries/useBoards'
import { useCardMutations } from '../../hooks/card/mutations/useCardMutations'
import { duplicateCardSchema } from '../../lib/schemas'
import type { Card } from '../../types'
import type { z } from 'zod'

type DuplicateCardForm = z.infer<typeof duplicateCardSchema>

interface DuplicateCardDialogProps {
  card: Card
  boardId: number
  onClose: () => void
}

export function DuplicateCardDialog({ card, boardId, onClose }: DuplicateCardDialogProps) {
  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.start_time || !!card.end_time

  const { data: boards = [] } = useBoards()
  const { duplicateCard: duplicate } = useCardMutations()

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DuplicateCardForm>({
    resolver: zodResolver(duplicateCardSchema),
    defaultValues: {
      title: card.title,
      copyTags: true,
      copyChecklists: true,
      copySchedule: true,
      pin: card.is_pinned,
      selectedBoardId: boardId,
      selectedColumnId: card.column_id,
      positionIndex: 0,
    },
  })

  const selectedBoardId = watch('selectedBoardId')
  const selectedColumnId = watch('selectedColumnId')

  const { data: selectedBoard } = useBoard(selectedBoardId)
  const columns = selectedBoard?.columns ?? []
  const targetColumn = columns.find(c => c.id === selectedColumnId)
  const targetCards = targetColumn?.cards ?? []
  const positionCount = targetCards.length + 1
  const isAutoPin = targetColumn?.auto_pin ?? false

  useEffect(() => {
    setValue('pin', isAutoPin || card.is_pinned)
  }, [selectedColumnId, isAutoPin, setValue])

  const handleBoardChange = (newBoardId: number) => {
    setValue('selectedBoardId', newBoardId)
    const newBoard = boards.find(b => b.id === newBoardId)
    const firstCol = newBoard?.columns?.[0]
    setValue('selectedColumnId', firstCol?.id ?? 0)
    setValue('positionIndex', 0)
  }

  const onSubmit = (data: DuplicateCardForm) => {
    duplicate.mutate(
      {
        id: card.id,
        data: {
          title: data.title,
          target_column_id: data.selectedColumnId,
          position_index: data.positionIndex,
          copy_tags: data.copyTags,
          copy_checklists: data.copyChecklists,
          copy_schedule: data.copySchedule,
          pin: data.pin,
        },
      },
      { onSuccess: onClose }
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={e => e.stopPropagation()}>
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-80 p-4">
        <DialogHeader className="mb-4">
          <DialogTitle>複製卡片</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">名稱</Label>
            <Input
              {...register('title')}
              className="text-sm"
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Copy options */}
          {(tags.length > 0 || checklists.length > 0 || hasSchedule) && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">保留...</p>
              <div className="space-y-1.5">
                {tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Controller
                      name="copyTags"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="copyTags"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    <Label htmlFor="copyTags" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-normal">
                      標籤 ({tags.length})
                    </Label>
                  </div>
                )}
                {checklists.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Controller
                      name="copyChecklists"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="copyChecklists"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    <Label htmlFor="copyChecklists" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-normal">
                      清單 ({checklists.length})
                    </Label>
                  </div>
                )}
                {hasSchedule && (
                  <div className="flex items-center gap-2">
                    <Controller
                      name="copySchedule"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="copySchedule"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    <Label htmlFor="copySchedule" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-normal">
                      時程
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pin */}
          <div>
            <div className="flex items-center gap-2">
              <Controller
                name="pin"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="pin"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    disabled={isAutoPin}
                  />
                )}
              />
              <Label htmlFor="pin" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-normal">
                釘選
              </Label>
            </div>
            {isAutoPin && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 ml-6">
                目標欄位為自動釘選，將自動設為釘選
              </p>
            )}
          </div>

          {/* Destination */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">複製到...</p>
            <div className="space-y-2">
              <div>
                <Label className="block text-xs text-gray-400 mb-1">面板</Label>
                <Controller
                  name="selectedBoardId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => handleBoardChange(Number(v))}
                    >
                      <SelectTrigger className="text-sm h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="block text-xs text-gray-400 mb-1">列表</Label>
                  <Controller
                    name="selectedColumnId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => { field.onChange(Number(v)); setValue('positionIndex', 0) }}
                      >
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col.id} value={String(col.id)}>{col.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.selectedColumnId && <p className="text-xs text-red-500 mt-1">{errors.selectedColumnId.message}</p>}
                </div>
                <div className="w-20">
                  <Label className="block text-xs text-gray-400 mb-1">位置</Label>
                  <Controller
                    name="positionIndex"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: positionCount }, (_, i) => {
                            const val = i + 1
                            const isLast = val === positionCount
                            return (
                              <SelectItem key={val} value={isLast ? '0' : String(val)}>
                                {isLast ? '末尾' : String(val)}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={duplicate.isPending}
          >
            {duplicate.isPending ? '建立中...' : '創建卡片'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </div>
  )
}
