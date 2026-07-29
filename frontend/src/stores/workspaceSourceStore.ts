import { create } from 'zustand'

type WorkspaceSourceStore = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useWorkspaceSourceStore = create<WorkspaceSourceStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
