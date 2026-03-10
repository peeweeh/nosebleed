// POST /api/ai/coach
// Accepts { state, question?, mode } — returns { message: string }
// mode: 'hint' (street advice) | 'posthand' (end-of-hand review)
// Server-only: calls AWS Bedrock for dollarbill coaching.

import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai/provider'
import { resolvePrompt } from '@/lib/ai/promptRegistry'
import { ARCHETYPES } from '@/constants/archetypes'
import { type GameState } from '@/types'

export const runtime = 'nodejs'

function stateContext(state: GameState): string {
  const humanSeat = state.seats['human']
  if (!humanSeat) return 'Human not seated.'

  const board = state.board.length > 0
    ? state.board.map(c => `${c.rank}${c.suit}`).join(' ')
    : 'none'

  const holeStr = humanSeat.holeCards
    ? humanSeat.holeCards.map(c => `${c.rank}${c.suit}`).join(' ')
    : '??'

  const facingBet = Math.max(...Object.values(state.seats).map(s => s.currentBet))
  const others = Object.values(state.seats)
    .filter(s => s.id !== 'human' && !s.isFolded)
    .map(s => `${s.id}: stack=${s.stack} bet=${s.currentBet}`)
    .join(', ')

  const humanActions = state.actionsThisStreet
    .filter(e => e.seatId === 'human')
    .map(e => e.action.amount != null ? `${e.action.type} ${e.action.amount}` : e.action.type)
    .join(', ')

  const outcome = humanSeat.isFolded
    ? 'folded'
    : state.winners?.includes('human')
      ? 'won the pot'
      : state.winners
        ? 'lost (did not win)'
        : 'still in hand'

  return [
    `Hand #: ${state.handNumber}`,
    `Street: ${state.street}`,
    `Board: ${board}`,
    `Your hole cards: ${holeStr}`,
    `Your stack: ${humanSeat.stack}`,
    `Pot: ${state.pot.main}`,
    `Current bet: ${facingBet}`,
    `Active opponents: ${others || 'none'}`,
    `Your action(s) this street: ${humanActions || (humanSeat.lastAction?.type ?? 'none')}`,
    `Your outcome: ${outcome}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const { state, question, mode } = await req.json() as {
      state: GameState
      question?: string
      mode: 'hint' | 'posthand'
    }

    const coach = ARCHETYPES['dollarbill']
    const promptId = mode === 'posthand' ? 'coach.posthand' : 'coach.hint'

    const systemPrompt = resolvePrompt(promptId, {
      name: coach.name,
      personality: coach.description,
    })

    const ctx = stateContext(state)
    const userMessage = mode === 'hint' && question
      ? `${ctx}\n\nHuman asks: "${question}"`
      : ctx

    const res = await callLLM({ systemPrompt, userMessage, maxTokens: 350 })

    const message = res.ok && res.text
      ? res.text
      : mode === 'posthand'
        ? 'Every hand teaches you something. Think about your bet sizing.'
        : "Focus. What does the board tell you?"

    return NextResponse.json({ message })
  } catch (err) {
    console.error('[/api/ai/coach]', err)
    return NextResponse.json({ message: 'Trust your read.' })
  }
}
