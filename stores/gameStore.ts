// Game state store — owns GameState, drives engine calls, coordinates AI turns.
// All LLM calls are made via API routes (server-side only).

import { create } from 'zustand'
import { type GameState, type PlayerAction, type SeatId } from '@/types'
import { startHand, applyAction } from '@/lib/game/engine'
import { getLegalActions, isActionLegal } from '@/lib/game/actions'
import { useChatStore } from '@/stores/chatStore'
import { broadcastToTable } from '@/lib/ai/tableChat'

// Speed settings — random delay range [min, max] ms between AI turns
export const SPEED_OPTIONS: Record<string, [number, number]> = {
  slow:   [1800, 3200],
  normal: [900,  2000],
  fast:   [300,  700],
}
export type SpeedKey = keyof typeof SPEED_OPTIONS

const AI_DECISION_TIMEOUT_MS = 15000

let _speedKey: SpeedKey = 'normal'
export function setAISpeed(key: SpeedKey) { _speedKey = key }

function randomDelay(): number {
  const [min, max] = SPEED_OPTIONS[_speedKey]
  return min + Math.floor(Math.random() * (max - min))
}

function safeFallbackAction(state: GameState, seatId: SeatId): PlayerAction {
  const legal = getLegalActions(state, seatId)
  if (legal.canCall) return { type: 'call' }
  if (legal.canCheck) return { type: 'check' }
  return { type: 'fold' }
}

async function fetchAIDecision(
  state: GameState,
  seatId: SeatId,
  chatHistory: ReturnType<typeof useChatStore.getState>['messages'],
): Promise<{ action: PlayerAction; talk?: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_DECISION_TIMEOUT_MS)

  try {
    const res = await fetch('/api/ai/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, seatId, chatHistory }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.warn('[gameStore] AI decision request failed', res.status, seatId)
      return { action: safeFallbackAction(state, seatId) }
    }

    const payload = await res.json() as {
      action?: PlayerAction
      talk?: string
    }
    const action = payload.action

    if (!action || !isActionLegal(state, seatId, action)) {
      console.warn('[gameStore] AI returned illegal decision', seatId, action)
      return {
        action: safeFallbackAction(state, seatId),
        talk: typeof payload.talk === 'string' ? payload.talk : undefined,
      }
    }

    return {
      action,
      talk: typeof payload.talk === 'string' ? payload.talk : undefined,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn('[gameStore] AI decision request aborted or failed', seatId, reason)
    return { action: safeFallbackAction(state, seatId) }
  } finally {
    clearTimeout(timeout)
  }
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
      const decision = await fetchAIDecision(next, seatId, chatHistory)

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

      try {
        next = applyAction(next, seatId, decision.action)
      } catch (error) {
        console.warn('[gameStore] applying AI action failed, using fallback', seatId, error)
        next = applyAction(next, seatId, safeFallbackAction(next, seatId))
      }
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
