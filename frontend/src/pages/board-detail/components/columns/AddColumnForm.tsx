import { newColumnSchema, type NewColumnForm } from '@/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useColumnMutations } from '@/hooks/column/mutations/useColumnMutations'
import type { Board } from '@/types'

interface AddColumnFormProps {
  board: Board
  setAddingColumn: Dispatch<SetStateAction<boolean>>
}
export function AddColumnForm(props: AddColumnFormProps) {
  const { board, setAddingColumn } = props

  const { createColumn } = useColumnMutations(board.id)

  const {
    register: registerCol,
    handleSubmit: handleSubmitCol,
    reset: resetCol,
  } = useForm<NewColumnForm>({
    resolver: zodResolver(newColumnSchema),
  })

  const handleAddColumn = async (data: NewColumnForm) => {
    await createColumn.mutateAsync(data)
    resetCol()
    setAddingColumn(false)
  }

  const handleCancel = () => {
    resetCol()
    setAddingColumn(false)
  }

  return (
    <form
      onSubmit={handleSubmitCol(handleAddColumn)}
      className="space-y-2 rounded-xl bg-gray-200 p-3 dark:bg-gray-700"
    >
      <Input
        placeholder="欄位名稱"
        {...registerCol('name')}
        autoFocus
        className="text-sm"
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-7 text-xs">
          新增
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-7 text-xs"
        >
          取消
        </Button>
      </div>
    </form>
  )
}
