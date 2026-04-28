import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../src/components/ui/tooltip'
import { PinnedCardItem } from '../src/pages/pin/components/PinnedCardItem'
import type { PinnedCard } from '../src/types'

const card: PinnedCard = {
  id: 1,
  title: '開發看板拖曳功能',
  description: '使用 React DnD 實現卡片在不同欄位間拖曳',
  columnId: 2,
  columnName: '進行中',
  boardId: 1,
  priority: null,
  storyPoint: null,
  startTime: null,
  endTime: null,
  tags: [],
  checklistSummary: { totalCount: 0, completedCount: 0 },
  dependencyCount: 0,
}

function renderCard(props: {
  card: PinnedCard
  onUnpin: (id: number) => void
}) {
  return render(
    <TooltipProvider>
      <PinnedCardItem {...props} onEdit={vi.fn()} />
    </TooltipProvider>,
  )
}

describe('PinnedCardItem', () => {
  it('renders title and column name', () => {
    renderCard({ card, onUnpin: vi.fn() })
    expect(screen.getByText('開發看板拖曳功能')).toBeInTheDocument()
    expect(screen.getByText('進行中')).toBeInTheDocument()
  })

  it('renders long description without crash', () => {
    const longDesc = 'a'.repeat(150)
    const longCard = { ...card, description: longDesc }
    renderCard({ card: longCard, onUnpin: vi.fn() })
    expect(screen.getByText(longDesc)).toBeInTheDocument()
  })

  it('calls onUnpin when unpin button clicked', async () => {
    const onUnpin = vi.fn()
    renderCard({ card, onUnpin })
    const actionsBtn = screen.getByRole('button', { name: 'Actions' })
    fireEvent.click(actionsBtn)
    const btn = await screen.findByTestId('unpin-btn')
    fireEvent.click(btn)
    expect(onUnpin).toHaveBeenCalledWith(1)
  })
})
