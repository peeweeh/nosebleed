// Opponent AI adapter.
// Builds prompt from game state + chat log + archetype, calls provider,
// parses action + optional talk response.

import { type GameState, type PlayerAction, type ChatMessage, type SeatId } from '@/types'
import { ARCHETYPES } from '@/constants/archetypes'
import { getLegalActions } from '@/lib/game/actions'
import { callLLM } from '@/lib/ai/provider'
import { resolvePrompt } from '@/lib/ai/promptRegistry'

export interface OpponentDecision {
  action: PlayerAction
  talk?: string // undefined = no talk this turn
}

// Serialize the public board state visible to all players
function publicStateContext(state: GameState, seatId: SeatId): string {
  const seat = state.seats[seatId]
  if (!seat) return ''

  const board =
    state.board.length > 0
      ? state.board.map((c) => `${c.rank}${c.suit}`).join(' ')
      : 'none dealt yet'

  const activePlayers = Object.values(state.seats)
    .filter((s) => !s.isFolded && s.stack > 0)
    .map((s) => {
      const name = s.id === 'human' ? 'The Rookie' : (s.name ?? s.id)
      const label = s.id === seatId ? `YOU (${name})` : name
      return `${label}: stack=${s.stack} bet=${s.currentBet}`
    })
    .join('\n')

  const holeStr = seat.holeCards
    ? seat.holeCards.map((c) => `${c.rank}${c.suit}`).join(' ')
    : '??'

  const facingBet = Math.max(...Object.values(state.seats).map((s) => s.currentBet))

  return [
    `Street: ${state.street}`,
    `Board: ${board}`,
    `Pot: ${state.pot.main}`,
    `Your hole cards: ${holeStr}`,
    `Active players:\n${activePlayers}`,
    `Current bet to call: ${facingBet}`,
    `Your stack: ${seat.stack}`,
  ].join('\n')
}

// Recent public chat — exclude human_only messages
function chatContext(messages: ChatMessage[], limit = 10): string {
  return messages
    .filter((m) => m.visibility === 'public')
    .slice(-limit)
    .map((m) => `[${m.senderLabel ?? m.sender ?? m.variant}]: ${m.message}`)
    .join('\n')
}

// Fallback action when LLM fails or parses incorrectly
function safeFallback(state: GameState, seatId: SeatId): PlayerAction {
  const legal = getLegalActions(state, seatId)
  if (legal.canCall) return { type: 'call' }
  if (legal.canCheck) return { type: 'check' }
  return { type: 'fold' }
}

// Parse LLM response text into a valid action + optional talk
function parseResponse(
  text: string,
  state: GameState,
  seatId: SeatId,
): OpponentDecision {
  let parsed: Record<string, unknown> = {}

  // Try to extract JSON block from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    console.warn('[opponent] Failed to parse JSON response, using fallback')
    return { action: safeFallback(state, seatId) }
  }

  const actionType = String(parsed.action ?? '').toLowerCase()
  const amount =
    typeof parsed.amount === 'number' ? parsed.amount : undefined
  const talk =
    typeof parsed.talk === 'string' && parsed.talk.trim()
      ? parsed.talk.trim()
      : undefined

  const legal = getLegalActions(state, seatId)

  let action: PlayerAction
  switch (actionType) {
    case 'fold':
      action = { type: 'fold' }
      break
    case 'check':
      action = legal.canCheck ? { type: 'check' } : safeFallback(state, seatId)
      break
    case 'call':
      action = legal.canCall ? { type: 'call' } : safeFallback(state, seatId)
      break
    case 'raise':
    case 'bet': {
      const raiseAmount = amount ?? legal.minRaise
      if (legal.canRaise && raiseAmount >= legal.minRaise) {
        action = { type: actionType as 'raise' | 'bet', amount: raiseAmount }
      } else {
        action = safeFallback(state, seatId)
      }
      break
    }
    case 'allin':
    case 'all_in':
    case 'all-in':
      action = { type: 'all-in' }
      break
    default:
      action = safeFallback(state, seatId)
  }

  return { action, talk }
}

export async function getOpponentDecision(
  state: GameState,
  seatId: SeatId,
  chatHistory: ChatMessage[],
): Promise<OpponentDecision> {
  const seat = state.seats[seatId]
  if (!seat || !seat.archetypeId) {
    return { action: safeFallback(state, seatId) }
  }

  const archetype = ARCHETYPES[seat.archetypeId]
  if (!archetype) {
    return { action: safeFallback(state, seatId) }
  }

  const legal = getLegalActions(state, seatId)
  const canAllIn = seat.stack > 0
  const legalStr = [
    legal.canFold ? 'fold' : null,
    legal.canCheck ? 'check' : null,
    legal.canCall ? `call (${legal.callAmount})` : null,
    legal.canRaise ? `raise (min: ${legal.minRaise}, max: ${legal.maxRaise})` : null,
    canAllIn && !legal.canRaise && !legal.canCall ? 'all-in' : null,
  ]
    .filter(Boolean)
    .join(', ')

  try {
    const systemPrompt = resolvePrompt('opponent.action', {
      name: archetype.name,
      archetype: archetype.id,
      personality: archetype.personality,
      style: archetype.label,
    })

    const userMessage = resolvePrompt('opponent.talk', {
      game_state: publicStateContext(state, seatId),
      chat_history: chatContext(chatHistory) || 'No messages yet.',
      legal_actions: legalStr,
      mood: seat.mood ?? 'neutral',
    })

    const res = await callLLM({
      systemPrompt,
      userMessage,
      maxTokens: 500,
    })

    if (!res.ok || !res.text) {
      return { action: safeFallback(state, seatId) }
    }

    return parseResponse(res.text, state, seatId)
  } catch (err) {
    console.error(`[opponent] Error getting decision for ${seatId}:`, err)
    return { action: safeFallback(state, seatId) }
  }
}
