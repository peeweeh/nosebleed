// POST /api/ai/decision
// Accepts { state, seatId, chatHistory } — returns { action, talk? }
// Server-only: calls AWS Bedrock directly.

import { NextRequest, NextResponse } from 'next/server'
import { getOpponentDecision } from '@/lib/ai/opponent'
import { type GameState, type ChatMessage, type SeatId } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      state: GameState
      seatId: SeatId
      chatHistory: ChatMessage[]
    }

    const decision = await getOpponentDecision(
      body.state,
      body.seatId,
      body.chatHistory,
    )

    return NextResponse.json(decision)
  } catch (err) {
    console.error('[/api/ai/decision]', err)
    return NextResponse.json({ action: { type: 'fold' } }, { status: 500 })
  }
}
