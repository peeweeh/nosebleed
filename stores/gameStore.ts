// Game state store — owns GameState, drives engine calls, coordinates AI turns.
// All LLM calls are made via API routes (server-side only).

import { create } from 'zustand'
import { type GameState, type PlayerAction, type SeatId } from '@/types'
import { startHand, applyAction } from '@/lib/game/engine'
import { useChatStore } from '@/stores/chatStore'
import { broadcastToTable } from '@/lib/ai/tableChat'

// Speed settings — random delay range [min, max] ms between AI turns
export const SPEED_OPTIONS: Record<string, [number, number]> = {
  slow:   [1800, 3200],
  normal: [900,  2000],
  fast:   [300,  700],
}
export type SpeedKey = keyof typeof SPEED_OPTIONS

let _speedKey: SpeedKey = 'normal'
export function setAISpeed(key: SpeedKey) { _speedKey = key }

function randomDelay(): number {
  const [min, max] = SPEED_OPTIONS[_speedKey]
  return min + Math.floor(Math.random() * (max - min))
}

interface GameStore {
  state: GameState | null
  isAIThinking: boolean

  // Actions
  initHand: (state: GameState) => Promise<void>
  humanAction: (action: PlayerAction) => Promise<void>
  patchSeatStack: (seatId: SeatId, amount: number) => void
  reset: () => void
}

// ─── AI loop helper (runs until it's the human's turn or hand complete) ─────

async function runAILoop(
  initial: GameState,
  set: (partial: Partial<GameStore>) => void,
): Promise<GameState> {
  let next = initial
  const addMessage = useChatStore.getState().addMessage

  set({ isAIThinking: true })
  try {
    while (
      next.activePlayer !== 'human' &&
      next.activePlayer !== null &&
      next.street !== 'complete'
    ) {
      const seatId = next.activePlayer as SeatId
      const chatHistory = useChatStore.getState().messages

      const res = await fetch('/api/ai/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next, seatId, chatHistory }),
      })

      if (!res.ok) {
        // Fallback: fold on error so hand can continue
        next = applyAction(next, seatId, { type: 'fold' })
        set({ state: next })
        continue
      }

      const decision = await res.json() as { action: PlayerAction; talk?: string }

      if (decision.talk) {
        const senderName = next.seats[seatId]?.name ?? seatId
        addMessage({
          id: `${seatId}-talk-${Date.now()}`,
          variant: 'opponent',
          sender: seatId,
          senderLabel: senderName,
          message: decision.talk,
          visibility: 'public',
          timestamp: Date.now(),
        })

        // Broadcast this AI's comment to all OTHER AI seats — fire and forget
        void broadcastToTable({
          message: decision.talk,
          fromSeatId: seatId,
          fromName: senderName,
          state: next,
          addMessage,
          conversationMemory: useChatStore.getState().messages,
        })
      }

      next = applyAction(next, seatId, decision.action)
      set({ state: next })

      // Random delay — feels like the player is thinking
      await new Promise((r) => setTimeout(r, randomDelay()))
    }
  } finally {
    set({ isAIThinking: false })
  }

  return next
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  isAIThinking: false,

  // Start a new hand — if AI goes first, run their turns immediately.
  initHand: async (initial: GameState) => {
    const state = startHand(initial)
    set({ state })

    // If an AI seat acts first (e.g. UTG is not human), run them now.
    if (state.activePlayer !== 'human' && state.activePlayer !== null) {
      await runAILoop(state, set as (partial: Partial<GameStore>) => void)
    }
  },

  humanAction: async (action: PlayerAction) => {
    const { state } = get()
    if (!state) return

    // Apply human action
    const next = applyAction(state, 'human', action)
    set({ state: next })

    if (next.street === 'complete') return

    // Run AI turns until it's the human's turn again
    await runAILoop(next, set as (partial: Partial<GameStore>) => void)
  },

  patchSeatStack: (seatId: SeatId, amount: number) => {
    const { state } = get()
    if (!state) return
    const seat = state.seats[seatId]
    if (!seat) return
    set({
      state: {
        ...state,
        seats: {
          ...state.seats,
          [seatId]: { ...seat, stack: seat.stack + amount, isActive: true },
        },
      },
    })
  },

  reset: () => set({ state: null, isAIThinking: false }),
}))
