import { create } from 'zustand'

type ChatStore = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
