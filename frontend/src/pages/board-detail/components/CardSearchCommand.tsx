import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useCardSearch } from '@/hooks/dependency/queries/useCardSearch'
import { CardDetailDialog } from '@/pages/board-detail/components/cards/CardDetailDialog'
import type { CardSearchResult } from '@/types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CardSearchCommandProps {
  boardId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardSearchCommand({
  boardId,
  open,
  onOpenChange,
}: CardSearchCommandProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<number>()
  const normalizedQuery = query.trim()
  const { data: results = [], isFetching, isDebouncing } = useCardSearch(
    normalizedQuery,
    20,
    300,
    boardId,
    normalizedQuery.length > 0,
  )
  const isSearching = isDebouncing || isFetching

  const groupedResults = useMemo(() => {
    if (!normalizedQuery) return []

    const groups = new Map<string, CardSearchResult[]>()
    for (const card of results) {
      const cards = groups.get(card.columnName) ?? []
      cards.push(card)
      groups.set(card.columnName, cards)
    }
    return Array.from(groups)
  }, [normalizedQuery, results])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('')
    }
    onOpenChange(nextOpen)
  }

  const handleSelect = (cardId: number) => {
    setSelectedCardId(cardId)
    handleOpenChange(false)
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t('cardSearch.dialogTitle')}
        shouldFilter={false}
      >
        <CommandInput
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder={t('cardSearch.placeholder')}
        />
        <CommandList>
          {normalizedQuery && !isSearching && groupedResults.length === 0 && (
            <CommandEmpty>{t('cardSearch.noResults')}</CommandEmpty>
          )}
          {isSearching && normalizedQuery && (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('cardSearch.searching')}
            </p>
          )}
          {!isSearching &&
            groupedResults.map(([columnName, cards]) => (
              <CommandGroup key={columnName} heading={columnName}>
                {cards.map((card) => (
                  <CommandItem
                    key={card.id}
                    value={`card-${card.id}`}
                    onSelect={() => handleSelect(card.id)}
                  >
                    <span className="truncate">{card.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </CommandDialog>

      {selectedCardId !== undefined && (
        <CardDetailDialog
          boardId={boardId}
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(undefined)}
        />
      )}
    </>
  )
}
