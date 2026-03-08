// Chat store — owns the ChatMessage[] feed for the current session.
// Human messages, opponent talk, dealer quips, and coach hints all land here.

import { create } from 'zustand'
import { type ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void

  // Filtered views
  publicMessages: () => ChatMessage[]
  humanOnlyMessages: () => ChatMessage[]
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],

  addMessage: (msg: ChatMessage) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  clearMessages: () => set({ messages: [] }),

  publicMessages: () =>
    get().messages.filter((m) => m.visibility === 'public'),

  humanOnlyMessages: () =>
    get().messages.filter((m) => m.visibility === 'human_only'),
}))
