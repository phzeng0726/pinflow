import type { AuthStatus } from '@/types'
import { client } from './client'

export const getAuthStatus = async (): Promise<AuthStatus> => (await client.get('/auth/session')).data
export const setAuthSession = async (accessToken: string, refreshToken: string): Promise<AuthStatus> => (await client.post('/auth/session', { accessToken, refreshToken })).data
export const deleteAuthSession = async (): Promise<void> => { await client.delete('/auth/session') }
