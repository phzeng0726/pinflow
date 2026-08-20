import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { getAuthStatus } from '@/lib/api'
import { setupAuthStateSync, useAuthStore } from '@/stores/authStore'

vi.mock('@/lib/api', () => ({
  deleteAuthSession: vi.fn(),
  getAuthStatus: vi.fn(),
}))

const mockedGetAuthStatus = vi.mocked(getAuthStatus)

describe('authStore runtime synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      isAuthenticated: false,
      userId: undefined,
      email: undefined,
      expiresAt: undefined,
      renewalRequired: false,
      isLoading: false,
    })
    delete window.electronAPI
  })

  it('clears stale identity when the authoritative backend session is lost', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      userId: 'user-1',
      email: 'user@example.com',
      expiresAt: '2026-08-20T01:00:00Z',
      renewalRequired: true,
    })
    mockedGetAuthStatus.mockResolvedValue({ authenticated: false })

    await useAuthStore.getState().checkStatus()

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      userId: undefined,
      email: undefined,
      expiresAt: undefined,
      renewalRequired: false,
    })
  })

  it('rehydrates after an Electron auth:changed notification', async () => {
    let authChanged: (() => void) | undefined
    const removeListener = vi.fn()
    window.electronAPI = {
      isElectron: true,
      onAuthChanged: (callback) => {
        authChanged = callback
        return removeListener
      },
    }
    mockedGetAuthStatus
      .mockResolvedValueOnce({ authenticated: false })
      .mockResolvedValueOnce({
        authenticated: true,
        userId: 'user-1',
        email: 'user@example.com',
        expiresAt: '2026-08-20T01:00:00Z',
      })

    const cleanup = setupAuthStateSync()
    await waitFor(() => expect(mockedGetAuthStatus).toHaveBeenCalledTimes(1))
    authChanged?.()

    await waitFor(() =>
      expect(useAuthStore.getState()).toMatchObject({
        isAuthenticated: true,
        userId: 'user-1',
        email: 'user@example.com',
        renewalRequired: false,
      }),
    )
    cleanup?.()
    expect(removeListener).toHaveBeenCalledOnce()
  })
})
