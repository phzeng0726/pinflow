import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PinnedCardItem } from '../src/features/pin/PinnedCardItem'
import type { PinnedCard } from '../src/types'

const card: PinnedCard = {
  id: 1,
  title: '開發看板拖曳功能',
  description: '使用 React DnD 實現卡片在不同欄位間拖曳',
  column_id: 2,
  column_name: '進行中',
}

describe('PinnedCardItem', () => {
  it('renders title and column name', () => {
    render(<PinnedCardItem card={card} onUnpin={vi.fn()} />)
    expect(screen.getByText('開發看板拖曳功能')).toBeInTheDocument()
    expect(screen.getByText('進行中')).toBeInTheDocument()
  })

  it('truncates description over 100 chars', () => {
    const longDesc = 'a'.repeat(150)
    const longCard = { ...card, description: longDesc }
    render(<PinnedCardItem card={longCard} onUnpin={vi.fn()} />)
    const desc = screen.getByText(/^a+…$/)
    expect(desc.textContent?.length).toBeLessThanOrEqual(102) // 100 chars + '…'
  })

  it('calls onUnpin when unpin button clicked', async () => {
    const onUnpin = vi.fn()
    render(<PinnedCardItem card={card} onUnpin={onUnpin} />)
    // Show the button by hovering (opacity-0 group-hover)
    const btn = screen.getByTitle('取消釘選')
    fireEvent.click(btn)
    expect(onUnpin).toHaveBeenCalledWith(1)
  })
})
