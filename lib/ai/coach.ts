// Coach adapter (dollarbill) — ghost coach visible only to human.
// Client-safe: calls /api/ai/coach for LLM responses.

import { onDealerEvent, type DealerEvent, type DealerEventType } from '@/lib/game/engine'
import { ARCHETYPES } from '@/constants/archetypes'
import { type ChatMessage, type GameState } from '@/types'

export type CoachMessageCallback = (message: ChatMessage) => void

const COACH_ARCHETYPE = ARCHETYPES['dollarbill']

// Only trigger coach on meaningful events — not every single action
const COACH_TRIGGER_EVENTS: DealerEventType[] = [
  'STREET_DEALT',
  'SHOWDOWN',
  'HAND_COMPLETE',
]

function buildCoachMessage(text: string): ChatMessage {
  return {
    id: `coach-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    variant: 'coach',
    sender: 'dollarbill',
    senderLabel: COACH_ARCHETYPE.name,
    message: text,
    visibility: 'human_only',
    timestamp: Date.now(),
  }
}

// Serialize relevant state context for the coach prompt
// Kept for potential future local use — currently state is sent to API
function stateContext(state: GameState): string {
  const humanSeat = state.seats['human']
  if (!humanSeat) return 'Human not seated.'

  const board =
    state.board.length > 0
      ? state.board.map((c) => `${c.rank}${c.suit}`).join(' ')
      : 'none'

  const holeStr = humanSeat.holeCards
    ? humanSeat.holeCards.map((c) => `${c.rank}${c.suit}`).join(' ')
    : '??'

  const facingBet = Math.max(...Object.values(state.seats).map((s) => s.currentBet))

  const others = Object.values(state.seats)
    .filter((s) => s.id !== 'human' && !s.isFolded)
    .map((s) => `${s.id}: stack=${s.stack} bet=${s.currentBet}`)
    .join(', ')

  return [
    `Street: ${state.street}`,
    `Board: ${board}`,
    `Your hole cards: ${holeStr}`,
    `Your stack: ${humanSeat.stack}`,
    `Pot: ${state.pot.main}`,
    `Current bet: ${facingBet}`,
    `Active opponents: ${others || 'none'}`,
  ].join('\n')
}

// On-demand hint — call when human requests advice
export async function getCoachHint(
  state: GameState,
  question = 'What should I do here?',
): Promise<ChatMessage> {
  try {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, question, mode: 'hint' }),
    })
    if (res.ok) {
      const data = await res.json() as { message: string }
      if (data.message) return buildCoachMessage(data.message)
    }
  } catch {
    // fall through
  }
  return buildCoachMessage('Focus. What does the board tell you?')
}

// Post-hand analysis — called after HAND_COMPLETE
export async function getPostHandAnalysis(
  state: GameState,
): Promise<ChatMessage> {
  try {
    const res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, mode: 'posthand' }),
    })
    if (res.ok) {
      const data = await res.json() as { message: string }
      if (data.message) return buildCoachMessage(data.message)
    }
  } catch {
    // fall through
  }
  return buildCoachMessage('Every hand teaches you something. What did you learn?')
}

let _registered = false

export function registerCoach(
  onMessage: CoachMessageCallback,
  getState: () => GameState | null,
): void {
  if (_registered) return
  _registered = true

  onDealerEvent(async (event: DealerEvent) => {
    if (!COACH_TRIGGER_EVENTS.includes(event.type)) return

    // Always use event.state — it's the fresh state at emit time.
    // getState() can return stale Zustand state when the event fires
    // synchronously before the store's set() has been called (e.g. STREET_DEALT
    // fires inside startHand() before initHand calls set({ state })).
    const state = event.state ?? getState()
    if (!state) return

    let msg: ChatMessage | null = null

    if (event.type === 'HAND_COMPLETE') {
      msg = await getPostHandAnalysis(state)
    } else if (event.type === 'STREET_DEALT' || event.type === 'SHOWDOWN') {
      msg = await getCoachHint(state)
    }

    if (msg) onMessage(msg)
  })
}
