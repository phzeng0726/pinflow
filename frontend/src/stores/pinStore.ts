import { create } from 'zustand'

interface PinWindowState {
  isOpen: boolean
  isMinimized: boolean
  open: () => void
  close: () => void
  toggleMinimize: () => void
}

export const usePinStore = create<PinWindowState>((set) => ({
  isOpen: false,
  isMinimized: false,
  open: () => set({ isOpen: true, isMinimized: false }),
  close: () => set({ isOpen: false }),
  toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
}))
