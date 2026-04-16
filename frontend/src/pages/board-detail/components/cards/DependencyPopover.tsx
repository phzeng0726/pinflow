import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDependencyMutations } from '@/hooks/dependency/mutations/useDependencyMutations'
import { useCardSearch } from '@/hooks/dependency/queries/useCardSearch'
import { cn } from '@/lib/utils'
import {
  DEPENDENCY_RELATIONS,
  type DependencyRelationKey,
} from '@/pages/board-detail/components/styleConfig'
import type { Card, CardSearchResult } from '@/types'
import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DependencyPopoverProps {
  boardId: number
  card: Card
}

export function DependencyPopover(props: DependencyPopoverProps) {
  const { boardId, card } = props
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const [selectedRelation, setSelectedRelation] =
    useState<DependencyRelationKey | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(
    null,
  )
  const [query, setQuery] = useState('')
  const { createDep } = useDependencyMutations(card.id, boardId)

  const limit = query.trim() ? 100 : 10
  const { data: results = [], isFetching } = useCardSearch(query, limit)
  const filteredResults = results.filter((r) => r.id !== card.id)

  const selectedRelationDef = selectedRelation
    ? DEPENDENCY_RELATIONS.find((r) => r.key === selectedRelation)
    : null

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSelectedRelation(null)
      setSelectedCard(null)
      setQuery('')
    }
  }

  const handleClose = () => handleOpenChange(false)

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedCard(null)
  }

  const handleConfirm = () => {
    if (!selectedRelation || !selectedCard) return
    const relation = DEPENDENCY_RELATIONS.find(
      (r) => r.key === selectedRelation,
    )!
    const fromCardId = relation.flip ? selectedCard.id : card.id
    const toCardId = relation.flip ? card.id : selectedCard.id
    createDep.mutate(
      { fromCardId, toCardId, type: relation.canonicalType },
      { onSuccess: () => handleOpenChange(false) },
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] overflow-hidden p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('dependency.title')}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-72">
          {/* Left: relation type list */}
          <div className="w-60 flex-shrink-0 overflow-y-auto border-r p-2">
            {DEPENDENCY_RELATIONS.map((rel) => {
              const handleSelectRelation = () => {
                setSelectedRelation(rel.key)
                setSelectedCard(null)
              }
              return (
                <button
                  key={rel.key}
                  type="button"
                  onClick={handleSelectRelation}
                  className={cn(
                    'flex w-full flex-col items-start rounded px-2 py-1.5 text-left text-xs transition-colors',
                    selectedRelation === rel.key
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                >
                  <span className="font-medium">{rel.label}</span>
                  <span
                    className={cn(
                      'leading-snug',
                      selectedRelation === rel.key
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    {rel.description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right: card picker */}
          <div className="flex min-w-0 flex-1 flex-col p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('dependency.searchPlaceholder')}
                value={query}
                onChange={handleQueryChange}
                className="h-8 pl-8 text-sm"
              />
            </div>

            <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {isFetching && (
                <p className="px-1 py-2 text-xs text-gray-400">
                  {t('dependency.loading')}
                </p>
              )}
              {!isFetching && filteredResults.length === 0 && (
                <p className="px-1 py-2 text-xs text-gray-400">
                  {t('dependency.noCards')}
                </p>
              )}
              {filteredResults.map((c) => {
                const handleSelectCard = () =>
                  setSelectedCard(selectedCard?.id === c.id ? null : c)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={handleSelectCard}
                    className={cn(
                      'flex flex-col items-start rounded px-2 py-1.5 text-left text-xs transition-colors',
                      selectedCard?.id === c.id
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    )}
                  >
                    <span className="max-w-full truncate font-medium">
                      {c.title}
                    </span>
                    <span
                      className={cn(
                        'max-w-full truncate',
                        selectedCard?.id === c.id
                          ? 'text-blue-600 dark:text-blue-300'
                          : 'text-gray-500 dark:text-gray-400',
                      )}
                    >
                      {c.boardName} · {c.columnName}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom preview / confirm bar */}
        {selectedRelationDef && selectedCard && (
          <div className="border-t bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="mb-2 text-xs leading-snug text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {card.title}
              </span>
              {' → '}
              <span className="text-blue-600 dark:text-blue-400">
                {selectedRelationDef.label}
              </span>
              {' → '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {selectedCard.title}
              </span>
            </p>
            <Button
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleConfirm}
              disabled={createDep.isPending}
            >
              {t('dependency.confirm')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
