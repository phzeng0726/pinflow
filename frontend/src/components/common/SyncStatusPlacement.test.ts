import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('SyncStatusIndicator placement', () => {
  it('uses page header layouts instead of a fixed root overlay', () => {
    const rootSource = readFileSync(
      resolve(process.cwd(), 'src/routes/__root.tsx'),
      'utf8',
    )
    const boardListSource = readFileSync(
      resolve(process.cwd(), 'src/pages/board-list/BoardListPage.tsx'),
      'utf8',
    )
    const boardSource = readFileSync(
      resolve(process.cwd(), 'src/pages/board-detail/BoardPage.tsx'),
      'utf8',
    )

    expect(rootSource).not.toContain('<SyncStatusIndicator')
    expect(boardListSource).toContain('<SyncStatusIndicator />')

    const syncAction = boardSource.indexOf('<SyncStatusIndicator />')
    const pinnedTasksAction = boardSource.indexOf(
      '<div className="relative" ref={pinPopoverRef}>',
    )
    expect(syncAction).toBeGreaterThan(-1)
    expect(syncAction).toBeLessThan(pinnedTasksAction)
  })
})
