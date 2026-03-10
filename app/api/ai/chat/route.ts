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
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

type ChatLine = {
  sender?: string
  senderLabel?: string
  message?: string
  timestamp?: number
}

type LoggedHand = {
  handNumber?: number
  gameMetadata?: {
    sessionId?: string
    timestamp?: string
  }
  winners?: string[]
  finalBoard?: string[]
}

const PLAY_LOG = path.join(process.cwd(), 'logs', 'play.json')

function buildConversationMemory(chatHistory: ChatLine[]): string {
  const lines = chatHistory
    .filter((m) => typeof m.message === 'string' && m.message.trim().length > 0)
    .slice(-12)
    .map((m) => `[${m.senderLabel ?? m.sender ?? 'Player'}] ${m.message!.trim()}`)
  return lines.length > 0 ? lines.join('\n') : 'No recent table talk.'
}

function buildCrossGameMemory(): string {
  if (!fs.existsSync(PLAY_LOG)) return 'No prior hands logged yet.'

  try {
    const raw = fs.readFileSync(PLAY_LOG, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    const hands = (Array.isArray(parsed) ? parsed : [parsed]) as LoggedHand[]

    const memory = hands
      .slice(-8)
      .map((h) => {
        const winners = Array.isArray(h.winners) && h.winners.length > 0
          ? h.winners.join(', ')
          : 'unknown'
        const rookieWon = Array.isArray(h.winners)
          ? h.winners.includes('You') || h.winners.includes('human')
          : false
        const result = rookieWon ? 'The Rookie won.' : 'The Rookie did not win.'
        const board = Array.isArray(h.finalBoard) && h.finalBoard.length > 0
          ? h.finalBoard.join(' ')
          : 'unknown board'
        const handNum = h.handNumber ?? '?'
        return `Hand #${handNum}: Winners: ${winners}. ${result} Board: ${board}.`
      })

    return memory.length > 0 ? memory.join('\n') : 'No prior hands logged yet.'
  } catch {
    return 'Prior hand memory unavailable.'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seatId, archetypeId, message, fromName, gameStateSummary, chatHistory } =
      await req.json() as {
        seatId: string
        archetypeId: string
        message: string
        fromName: string
        gameStateSummary: string
        chatHistory?: ChatLine[]
      }

    const archetype = ARCHETYPES[archetypeId]
    if (!archetype) {
      return NextResponse.json({ respond: false })
    }

    const conversationMemory = buildConversationMemory(Array.isArray(chatHistory) ? chatHistory : [])
    const tableMemory = buildCrossGameMemory()

    const systemPrompt = resolvePrompt('opponent.chat', {
      name: archetype.name,
      personality: archetype.description,
      talkiness: String(archetype.sliders.talkiness),
      ego: String(archetype.sliders.ego),
      from_name: fromName,
      message,
      game_state: gameStateSummary,
      chat_history: conversationMemory,
      table_memory: tableMemory,
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
