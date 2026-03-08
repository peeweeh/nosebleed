// POST /api/ai/dealer
// Accepts { event } — returns { message: string }
// Server-only: calls AWS Bedrock for dealer voice quip.

import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai/provider'
import { resolvePrompt } from '@/lib/ai/promptRegistry'
import { ARCHETYPES } from '@/constants/archetypes'
import { type DealerEvent } from '@/lib/game/engine'

export const runtime = 'nodejs'

const FALLBACKS: Record<string, string[]> = {
  HAND_START: ["New hand. Let's see what you've got.", 'Cards are in the air.', "Here we go. Ante up."],
  STREET_DEALT: ["The board speaks. Who's listening?", 'Community cards hitting the felt.'],
  BIG_BET: ['Someone smells blood.', "That's a statement.", "Big bet on the table. Respect it or raise it."],
  ALL_IN: ['All the chips are in. Fate decides now.', 'All-in. The table holds its breath.'],
  FOLD: ['One less player.', 'Another one down.'],
  SHOWDOWN: ['Cards face up. Truth time.', 'Showdown. No more hiding.'],
  HAND_COMPLETE: ['Chips slide. Next hand coming.', 'Winner takes the pot. Game continues.'],
}

function pickFallback(type: string): string {
  const arr = FALLBACKS[type] ?? ['The game continues.']
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
    case 'HAND_START': return `A new hand has started. Hand number: ${state.handNumber}.`
    case 'STREET_DEALT': return `Street: ${state.street}. Board: ${state.board.map(c => `${c.rank}${c.suit}`).join(' ') || 'n/a'}.`
    case 'BIG_BET': return `${seatName(event)} placed a large bet of ${action?.amount ?? '?'}.`
    case 'ALL_IN': return `${seatName(event)} is all-in.`
    case 'FOLD': return `${seatName(event)} folded.`
    case 'SHOWDOWN': return "It's showdown time."
    case 'HAND_COMPLETE': return `Hand complete. ${winnerNames(event)} wins.`
    default: return 'A notable event occurred.'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json() as { event: DealerEvent }
    const dealer = ARCHETYPES['dealer']

    const systemPrompt = resolvePrompt('dealer.announce', {
      name: dealer.name,
      personality: dealer.description,
    })

    const res = await callLLM({
      systemPrompt,
      userMessage: eventToContext(event),
      maxTokens: 80,
    })

    const message = res.ok && res.text ? res.text : pickFallback(event.type)
    return NextResponse.json({ message })
  } catch (err) {
    console.error('[/api/ai/dealer]', err)
    return NextResponse.json({ message: 'The game continues.' })
  }
}
