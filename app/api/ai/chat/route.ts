// POST /api/ai/chat
// Each AI seat independently decides whether to respond to a table message.
// Called once per AI seat — isolated, no cross-seat coordination.
//
// Body: { seatId, archetypeId, message, fromName, gameStateSummary, chatHistory }
// Returns: { respond: boolean, talk?: string }

import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/ai/provider'
import { resolvePrompt } from '@/lib/ai/promptRegistry'
import { ARCHETYPES } from '@/constants/archetypes'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { seatId, archetypeId, message, fromName, gameStateSummary } =
      await req.json() as {
        seatId: string
        archetypeId: string
        message: string
        fromName: string
        gameStateSummary: string
      }

    const archetype = ARCHETYPES[archetypeId]
    if (!archetype) {
      return NextResponse.json({ respond: false })
    }

    const systemPrompt = resolvePrompt('opponent.chat', {
      name: archetype.name,
      personality: archetype.description,
      talkiness: String(archetype.sliders.talkiness),
      ego: String(archetype.sliders.ego),
      from_name: fromName,
      message,
      game_state: gameStateSummary,
    })

    const res = await callLLM({
      systemPrompt,
      userMessage: `You are ${archetype.name}. Someone just said: "${message}". Do you respond?`,
      maxTokens: 120,
    })

    if (!res.ok || !res.text) {
      return NextResponse.json({ respond: false })
    }

    // Extract JSON block
    const match = res.text.match(/```json\s*([\s\S]*?)```/) ??
                  res.text.match(/(\{[\s\S]*\})/)
    if (!match) return NextResponse.json({ respond: false })

    const parsed = JSON.parse(match[1] ?? match[0]) as { respond: boolean; talk?: string }

    console.info(`[/api/ai/chat] ${seatId} respond=${parsed.respond} talk="${parsed.talk ?? ''}"`)

    return NextResponse.json({
      respond: !!parsed.respond,
      talk: parsed.respond && parsed.talk ? parsed.talk.trim() : undefined,
    })
  } catch (err) {
    console.error('[/api/ai/chat]', err)
    return NextResponse.json({ respond: false })
  }
}
