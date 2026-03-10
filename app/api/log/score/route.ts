// POST /api/log/score
// Appends one block per completed hand to score.md
// Body: { handNumber, humanStack, stackBefore, winners, humanFolded, holeCards, board, coachAnalysis }

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const LOG_DIR = path.join(process.cwd(), 'logs')
const SCORE_LOG = path.join(LOG_DIR, 'score.md')

export async function POST(req: NextRequest) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true })
    const { handNumber, humanStack, stackBefore, winners, humanFolded, holeCards, board, coachAnalysis } = await req.json() as {
      handNumber: number
      humanStack: number
      stackBefore: number
      winners: string[]
      humanFolded: boolean
      holeCards?: string
      board?: string
      coachAnalysis?: string
    }

    const net = humanStack - stackBefore
    const netStr = net >= 0 ? `+${net}` : `${net}`
    const outcome = humanFolded ? 'folded' : winners.includes('human') ? 'won' : 'lost'
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // Parse "Rating: X/10" off the first line of coachAnalysis
    const rawLines = (coachAnalysis ?? '').split('\n').map(l => l.trim()).filter(Boolean)
    const ratingMatch = rawLines[0]?.match(/^Rating:\s*(\d+\/\d+)/i)
    const rating = ratingMatch?.[1] ?? '—'
    const analysis = ratingMatch ? rawLines.slice(1).join(' ').trim() : (coachAnalysis?.trim() ?? '—')

    const block = [
      ``,
      `## Hand #${handNumber} | ${timestamp} | ${outcome} | ${netStr} | Stack: ${humanStack}`,
      `- Hole cards: ${holeCards ?? '—'}`,
      `- Board: ${board ?? '—'}`,
      `- Rating: ${rating}`,
      `- Analysis: ${analysis || '—'}`,
      ``,
    ].join('\n')

    if (!fs.existsSync(SCORE_LOG)) {
      fs.writeFileSync(SCORE_LOG, '# Score Log\n')
    }
    fs.appendFileSync(SCORE_LOG, block)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/log/score]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
