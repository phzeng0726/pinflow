import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveWorkspaceSource } from '@/lib/api'
import { WorkspaceSourceDialog } from './WorkspaceSourceDialog'

const mocks = vi.hoisted(() => ({
  authenticated: true,
  source: {
    data: {
      pending: true,
      cloudHasData: true,
      error: undefined as string | undefined,
    },
  },
  dialog: {
    isOpen: true,
    open: vi.fn(),
    close: vi.fn(),
  },
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  resolveWorkspaceSource: vi.fn(),
}))

vi.mock('@/hooks/sync/queries/useWorkspaceSource', () => ({
  useWorkspaceSource: () => mocks.source,
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mocks.authenticated }),
}))

vi.mock('@/stores/workspaceSourceStore', () => ({
  useWorkspaceSourceStore: (
    selector: (state: typeof mocks.dialog) => unknown,
  ) => selector(mocks.dialog),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: mocks.setQueryData,
      invalidateQueries: mocks.invalidateQueries,
    }),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('WorkspaceSourceDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authenticated = true
    mocks.dialog.isOpen = true
    mocks.source.data.pending = true
    mocks.source.data.cloudHasData = true
    mocks.source.data.error = undefined
    vi.mocked(resolveWorkspaceSource).mockResolvedValue({
      pending: false,
      cloudHasData: true,
    })
  })

  it('decides later without modifying either workspace', async () => {
    const user = userEvent.setup()
    render(<WorkspaceSourceDialog />)

    await user.click(screen.getByText('sync.decideLater'))

    expect(mocks.dialog.close).toHaveBeenCalled()
    expect(resolveWorkspaceSource).not.toHaveBeenCalled()
  })

  it.each([
    ['sync.useCloud', 'sync.confirmCloudTitle', 'cloud'],
    ['sync.useLocal', 'sync.confirmLocalTitle', 'local'],
  ] as const)(
    'confirms %s before replacing data',
    async (choice, confirmTitle, source) => {
      const user = userEvent.setup()
      render(<WorkspaceSourceDialog />)

      await user.click(screen.getByText(choice))
      expect(screen.getByText(confirmTitle)).toBeTruthy()
      await user.click(screen.getByText('sync.confirmReplace'))

      await waitFor(() => {
        expect(resolveWorkspaceSource).toHaveBeenCalledWith(source)
      })
      expect(mocks.setQueryData).toHaveBeenCalled()
      expect(mocks.invalidateQueries).toHaveBeenCalled()
      expect(mocks.dialog.close).toHaveBeenCalled()
    },
  )
})
