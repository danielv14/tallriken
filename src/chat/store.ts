import { create } from 'zustand'

type PageContext = {
  type: 'recipe'
  recipeId: number
  recipeTitle: string
} | {
  type: 'home'
} | {
  type: 'other'
}

type ChatStore = {
  isOpen: boolean
  pageContext: PageContext
  open: () => void
  close: () => void
  toggle: () => void
  setPageContext: (context: PageContext) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  pageContext: { type: 'other' },
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setPageContext: (pageContext) => set({ pageContext }),
}))
