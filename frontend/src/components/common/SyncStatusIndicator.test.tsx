import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setSyncEnabled, triggerSync } from '@/lib/api'
import { SyncStatusIndicator } from './SyncStatusIndicator'

const mocks = vi.hoisted(() => ({
  authState: {
    isAuthenticated: true,
    email: 'user@example.com',
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  },
  syncStatus: {
    data: {
      state: 'disabled' as
        | 'idle'
        | 'syncing'
        | 'error'
        | 'offline'
        | 'disabled',
      lastSyncAt: undefined as string | undefined,
      error: undefined as string | undefined,
    },
    refetch: vi.fn(),
  },
  sourceState: {
    data: {
      pending: false,
      cloudHasData: false,
    },
  },
  openSourceDialog: vi.fn(),
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  setSyncEnabled: vi.fn(),
  triggerSync: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mocks.invalidateQueries,
      removeQueries: mocks.removeQueries,
    }),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { state?: string }) =>
      options?.state ? `${key}:${options.state}` : key,
  }),
}))

vi.mock('@/hooks/sync/queries/useSyncStatus', () => ({
  useSyncStatus: () => mocks.syncStatus,
}))

vi.mock('@/hooks/sync/queries/useWorkspaceSource', () => ({
  useWorkspaceSource: () => mocks.sourceState,
}))

vi.mock('@/stores/workspaceSourceStore', () => ({
  useWorkspaceSourceStore: (
    selector: (state: { open: typeof mocks.openSourceDialog }) => unknown,
  ) => selector({ open: mocks.openSourceDialog }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) =>
    selector(mocks.authState),
}))

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authState.isAuthenticated = true
    mocks.authState.email = 'user@example.com'
    mocks.authState.isLoading = false
    mocks.syncStatus.data.state = 'disabled'
    mocks.syncStatus.data.lastSyncAt = undefined
    mocks.syncStatus.data.error = undefined
    mocks.sourceState.data.pending = false
    mocks.sourceState.data.cloudHasData = false
  })

  it('shows account and enables sync before the initial full sync', async () => {
    const user = userEvent.setup()
    render(<SyncStatusIndicator />)

    await user.click(screen.getByTitle('sync.status:sync.states.disabled'))
    expect(screen.getByText('user@example.com')).toBeTruthy()
    expect(screen.getByText('sync.never')).toBeTruthy()

    await user.click(screen.getByText('sync.enable'))

    expect(setSyncEnabled).toHaveBeenCalledWith(true)
    expect(triggerSync).toHaveBeenCalledOnce()
    expect(mocks.syncStatus.refetch).toHaveBeenCalledOnce()
    expect(mocks.invalidateQueries).toHaveBeenCalledOnce()
    expect(vi.mocked(setSyncEnabled).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(triggerSync).mock.invocationCallOrder[0],
    )
  })

  it('logs out and clears only the sync query cache', async () => {
    const user = userEvent.setup()
    render(<SyncStatusIndicator />)

    await user.click(screen.getByTitle('sync.status:sync.states.disabled'))
    await user.click(screen.getByText('sync.logout'))

    expect(mocks.authState.logout).toHaveBeenCalledOnce()
    expect(mocks.removeQueries).toHaveBeenCalledWith({
      queryKey: ['sync'],
    })
  })

  it('reopens the workspace source dialog while a decision is pending', async () => {
    const user = userEvent.setup()
    mocks.sourceState.data.pending = true
    mocks.sourceState.data.cloudHasData = true
    render(<SyncStatusIndicator />)

    await user.click(screen.getByTitle('sync.status:sync.states.disabled'))
    expect(
      screen
        .getByText('sync.enable')
        .closest('[role="menuitem"]')
        ?.getAttribute('data-disabled'),
    ).not.toBeNull()
    await user.click(screen.getByText('sync.chooseSource'))

    expect(mocks.openSourceDialog).toHaveBeenCalledOnce()
  })

  it.each([
    ['idle', 'text-green-500'],
    ['error', 'text-red-500'],
    ['offline', 'text-gray-400'],
    ['disabled', 'text-muted-foreground'],
  ] as const)('styles the %s state distinctly', (state, className) => {
    mocks.syncStatus.data.state = state
    render(<SyncStatusIndicator />)

    expect(
      screen.getByTestId('sync-status-icon').classList.contains(className),
    ).toBe(true)
  })

  it('includes the last sync time in the idle indicator title', () => {
    mocks.syncStatus.data.state = 'idle'
    mocks.syncStatus.data.lastSyncAt = '2026-07-29T03:00:00.000Z'
    render(<SyncStatusIndicator />)

    expect(screen.getByTitle(/^sync\.states\.idle: /)).toBeTruthy()
  })
})
