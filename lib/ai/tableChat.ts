// lib/ai/tableChat.ts — client-safe broadcast module.
// When any player (human or AI) says something, broadcast to all AI seats.
// Each seat independently decides whether to respond via /api/ai/chat.
// Responses are staggered with random delays to feel natural.

import { type GameState, type ChatMessage, type SeatId } from '@/types'
import { ARCHETYPES } from '@/constants/archetypes'

export type ChatBroadcastOptions = {
  message: string
  fromSeatId: SeatId | 'human'
  fromName: string
  state: GameState
  addMessage: (msg: ChatMessage) => void
  conversationMemory?: ChatMessage[]
}

function gameStateSummary(state: GameState): string {
  return [
    `Street: ${state.street}`,
    `Pot: ${state.pot.main}`,
    `Board: ${state.board.map(c => `${c.rank}${c.suit}`).join(' ') || 'none'}`,
    `Active players: ${Object.values(state.seats).filter(s => !s.isFolded && s.isActive).map(s => s.name ?? s.id).join(', ')}`,
  ].join(' | ')
}

// Broadcast a message to every AI seat (even folded) — each independently responds.
export async function broadcastToTable(opts: ChatBroadcastOptions): Promise<void> {
  const { message, fromSeatId, fromName, state, addMessage, conversationMemory = [] } = opts

  // Collect AI seats that are not the speaker; folded players can still table-talk.
  const aiSeats = Object.values(state.seats).filter(
    s => s.id !== 'human' && s.id !== fromSeatId && !!s.archetypeId,
  )

  if (aiSeats.length === 0) return

  const summary = gameStateSummary(state)
  const recentPublicChat = conversationMemory
    .filter((m) => m.visibility === 'public')
    .slice(-20)
    .map((m) => ({
      sender: m.sender,
      senderLabel: m.senderLabel,
      message: m.message,
      timestamp: m.timestamp,
    }))

  // Fire all requests in parallel — each AI is isolated and decides alone
  const requests = aiSeats.map(async (seat, i) => {
    // Stagger replies: 600ms–2400ms so they don't all fire at once
    const delay = 600 + i * 400 + Math.floor(Math.random() * 500)
    await new Promise(r => setTimeout(r, delay))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: seat.id,
          archetypeId: seat.archetypeId,
          message,
          fromName,
          gameStateSummary: summary,
          chatHistory: recentPublicChat,
        }),
      })

      if (!res.ok) return

      const data = await res.json() as { respond: boolean; talk?: string }
      if (!data.respond || !data.talk) return

      const archetype = ARCHETYPES[seat.archetypeId!]
      addMessage({
        id: `${seat.id}-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        variant: 'opponent',
        sender: seat.id as SeatId,
        senderLabel: archetype?.name ?? seat.name ?? seat.id,
        message: data.talk,
        visibility: 'public',
        timestamp: Date.now(),
      })
    } catch {
      // Silent fail — AI chose not to respond
    }
  })

  // Don't await — let responses trickle in asynchronously
  void Promise.allSettled(requests)
}
