import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBoardDetail } from '@/hooks/board/queries/useBoardDetail'
import { useBoards } from '@/hooks/board/queries/useBoards'
import { useCardMutations } from '@/hooks/card/mutations/useCardMutations'
import { duplicateCardSchema } from '@/lib/schemas'
import type { Card } from '@/types'

type DuplicateCardForm = z.infer<typeof duplicateCardSchema>

interface DuplicateCardDialogProps {
  card: Card
  boardId: number
  onClose: () => void
}

export function DuplicateCardDialog(props: DuplicateCardDialogProps) {
  const { card, boardId, onClose } = props
  const { t } = useTranslation()

  const tags = card.tags ?? []
  const checklists = card.checklists ?? []
  const hasSchedule = !!card.startTime || !!card.endTime

  const { data: boards = [] } = useBoards()
  const { duplicateCard: duplicate } = useCardMutations(boardId)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DuplicateCardForm>({
    resolver: zodResolver(duplicateCardSchema),
    defaultValues: {
      title: card.title,
      copyTags: true,
      copyChecklists: true,
      copySchedule: true,
      pin: card.isPinned,
      selectedBoardId: boardId,
      selectedColumnId: card.columnId,
      position: 0,
    },
  })

  const selectedBoardId = watch('selectedBoardId')
  const selectedColumnId = watch('selectedColumnId')

  const { data: selectedBoard } = useBoardDetail(selectedBoardId)
  const columns = selectedBoard?.columns ?? []
  const targetColumn = columns.find((c) => c.id === selectedColumnId)
  const targetCards = targetColumn?.cards ?? []
  const positionCount = targetCards.length + 1
  const isAutoPin = targetColumn?.autoPin ?? false

  useEffect(() => {
    setValue('pin', isAutoPin || card.isPinned)
  }, [selectedColumnId, isAutoPin, setValue])

  const handleBoardChange = (newBoardId: number) => {
    setValue('selectedBoardId', newBoardId)
    const newBoard = boards.find((b) => b.id === newBoardId)
    const firstCol = newBoard?.columns?.[0]
    setValue('selectedColumnId', firstCol?.id ?? 0)
    setValue('position', 0)
  }

  const onSubmit = (data: DuplicateCardForm) => {
    duplicate.mutate(
      {
        id: card.id,
        data: {
          title: data.title,
          targetColumnId: data.selectedColumnId,
          position: data.position,
          copyTags: data.copyTags,
          copyChecklists: data.copyChecklists,
          copySchedule: data.copySchedule,
          pin: data.pin,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent className="w-80 p-4">
          <DialogHeader className="mb-4">
            <DialogTitle>{t('duplicate.title')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <Label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('duplicate.name')}
              </Label>
              <Input {...register('title')} className="text-sm" autoFocus />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Copy options */}
            {(tags.length > 0 || checklists.length > 0 || hasSchedule) && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('duplicate.keep')}
                </p>
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
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                        )}
                      />
                      <Label
                        htmlFor="copyTags"
                        className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300"
                      >
                        {t('duplicate.tags', { count: tags.length })}
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
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                        )}
                      />
                      <Label
                        htmlFor="copyChecklists"
                        className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300"
                      >
                        {t('duplicate.checklists', { count: checklists.length })}
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
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                        )}
                      />
                      <Label
                        htmlFor="copySchedule"
                        className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300"
                      >
                        {t('duplicate.schedule')}
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
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      disabled={isAutoPin}
                    />
                  )}
                />
                <Label
                  htmlFor="pin"
                  className="cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300"
                >
                  {t('duplicate.pin')}
                </Label>
              </div>
              {isAutoPin && (
                <p className="ml-6 mt-1 text-xs text-blue-500 dark:text-blue-400">
                  {t('duplicate.autoPin')}
                </p>
              )}
            </div>

            {/* Destination */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('duplicate.copyTo')}
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="mb-1 block text-xs text-gray-400">
                    {t('duplicate.board')}
                  </Label>
                  <Controller
                    name="selectedBoardId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => handleBoardChange(Number(v))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="mb-1 block text-xs text-gray-400">
                      {t('duplicate.column')}
                    </Label>
                    <Controller
                      name="selectedColumnId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => {
                            field.onChange(Number(v))
                            setValue('position', 0)
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((col) => (
                              <SelectItem key={col.id} value={String(col.id)}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.selectedColumnId && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.selectedColumnId.message}
                      </p>
                    )}
                  </div>
                  <div className="w-20">
                    <Label className="mb-1 block text-xs text-gray-400">
                      {t('duplicate.position')}
                    </Label>
                    <Controller
                      name="position"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: positionCount }, (_, i) => {
                              const val = i + 1
                              const isLast = val === positionCount
                              return (
                                <SelectItem
                                  key={val}
                                  value={isLast ? '0' : String(val)}
                                >
                                  {isLast ? t('duplicate.positionEnd') : String(val)}
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
              {duplicate.isPending ? t('duplicate.creating') : t('duplicate.createCard')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
