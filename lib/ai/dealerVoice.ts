// Dealer voice layer — client-safe.
// Subscribes to DealerEventType events, calls /api/ai/dealer for LLM quips.
// Falls back to deterministic template strings if request fails.

import { onDealerEvent, type DealerEvent } from '@/lib/game/engine'
import { ARCHETYPES } from '@/constants/archetypes'
import { type ChatMessage } from '@/types'

export type DealerQuipCallback = (message: ChatMessage) => void

const DEALER_ARCHETYPE = ARCHETYPES['dealer']

// Deterministic fallback strings keyed by event type
const FALLBACKS: Record<string, string[]> = {
  HAND_START: [
    'New hand. Let\'s see what you\'ve got.',
    'Cards are in the air.',
    'Here we go. Ante up.',
  ],
  STREET_DEALT: [
    'The board speaks. Who\'s listening?',
    'Community cards hitting the felt.',
    'Read \'em and weep — or bet.',
  ],
  BIG_BET: [
    'Someone smells blood.',
    'That\'s a statement.',
    'Big bet on the table. Respect it or raise it.',
  ],
  ALL_IN: [
    'All the chips are in. Fate decides now.',
    'All-in. The table holds its breath.',
    'Every chip. Everything.',
  ],
  FOLD: [
    'One less player.',
    'Another one down.',
    'Wise? Maybe. But they\'re out.',
  ],
  SHOWDOWN: [
    'Cards face up. Truth time.',
    'Showdown. No more hiding.',
    'Let\'s see what you were betting on.',
  ],
  HAND_COMPLETE: [
    'Chips slide. Next hand coming.',
    'Winner takes the pot. Game continues.',
    'That\'s one hand done.',
  ],
}

function pickFallback(eventType: string): string {
  const arr = FALLBACKS[eventType] ?? ['The game continues.']
  return arr[Math.floor(Math.random() * arr.length)]
}

function seatName(event: DealerEvent): string {
  if (!event.seatId) return 'A player'
  if (event.seatId === 'human') return 'The Rookie'
  return event.state.seats[event.seatId]?.name ?? event.seatId
}

function winnerNames(event: DealerEvent): string {
  const winners = event.state.winners ?? []
  if (winners.length === 0) return 'Someone'
  return winners.map(id => {
    if (id === 'human') return 'The Rookie'
    return event.state.seats[id]?.name ?? id
  }).join(' and ')
}

function eventToContext(event: DealerEvent): string {
  const { state, action } = event
  switch (event.type) {
    case 'HAND_START':
      return `A new hand has started. Hand number: ${state.handNumber}. The blinds are posted.`
    case 'STREET_DEALT': {
      const boardStr = state.board.map((c) => `${c.rank}${c.suit}`).join(' ')
      return `The street has advanced to: ${state.street}. Board: ${boardStr || 'n/a'}.`
    }
    case 'BIG_BET':
      return `${seatName(event)} placed a large bet of ${action?.amount ?? '?'}.`
    case 'ALL_IN':
      return `${seatName(event)} is all-in for ${action?.amount ?? 'their stack'}.`
    case 'FOLD':
      return `${seatName(event)} folded.`
    case 'SHOWDOWN':
      return `It\'s showdown time. The remaining players reveal their hands.`
    case 'HAND_COMPLETE':
      return `The hand is complete. ${winnerNames(event)} wins.`
    default:
      return 'A notable event occurred at the table.'
  }
}

async function generateQuip(event: DealerEvent): Promise<string> {
  try {
    const res = await fetch('/api/ai/dealer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    })
    if (res.ok) {
      const data = await res.json() as { message: string }
      if (data.message) return data.message
    }
  } catch {
    // fall through to deterministic fallback
  }

  return pickFallback(event.type)
}

let _registered = false

export function registerDealerVoice(onQuip: DealerQuipCallback): void {
  if (_registered) return
  _registered = true

  onDealerEvent(async (event) => {
    const body = await generateQuip(event)

    const message: ChatMessage = {
      id: `dealer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      variant: 'dealer',
      sender: 'dealer',
      senderLabel: DEALER_ARCHETYPE.name,
      message: body,
      visibility: 'public',
      timestamp: Date.now(),
    }

    onQuip(message)
  })
}
