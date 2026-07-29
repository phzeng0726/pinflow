import type { SyncStatus, WorkspaceSource, WorkspaceSourceState } from '@/types'
import { client } from './client'
export const getSyncStatus = async (): Promise<SyncStatus> =>
  (await client.get('/sync/status')).data
export const triggerSync = async (): Promise<void> => {
  await client.post('/sync/trigger')
}
export const setSyncEnabled = async (enabled: boolean): Promise<void> => {
  await client.patch('/sync/enable', { enabled })
}
export const pullFromCloud = async (): Promise<void> => {
  await client.post('/sync/pull')
}
export const hasCloudData = async (): Promise<boolean> =>
  (await client.get<{ hasData: boolean }>('/sync/has-cloud-data')).data.hasData
export const getWorkspaceSource = async (): Promise<WorkspaceSourceState> =>
  (await client.get<WorkspaceSourceState>('/sync/source')).data
export const resolveWorkspaceSource = async (
  source: WorkspaceSource,
): Promise<WorkspaceSourceState> =>
  (await client.post<WorkspaceSourceState>('/sync/source', { source })).data
