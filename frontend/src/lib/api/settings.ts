import type { Settings } from '@/types'
import { client } from './client'

export const getSettings = async (): Promise<Settings> => {
  const res = await client.get<Settings>('/settings')
  return res.data
}

export const updateSettings = async (data: Partial<Pick<Settings, 'theme' | 'locale'>>): Promise<Settings> => {
  const res = await client.put<Settings>('/settings', data)
  return res.data
}
