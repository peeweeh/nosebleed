// POST /api/log/play
// Appends one hand to play.json for debugging
// Body: { handNumber, gameMetadata, players, actions, finalBoard, winners }

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const LOG_DIR = path.join(process.cwd(), 'logs')
const PLAY_LOG = path.join(LOG_DIR, 'play.json')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    fs.mkdirSync(LOG_DIR, { recursive: true })

    // Initialize or read existing play.json
    let hands: unknown[] = []
    if (fs.existsSync(PLAY_LOG)) {
      try {
        const existing = fs.readFileSync(PLAY_LOG, 'utf-8')
        const parsed = JSON.parse(existing)
        hands = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        hands = []
      }
    }

    // Append new hand
    hands.push(body)

    // Write back as array
    fs.writeFileSync(PLAY_LOG, JSON.stringify(hands, null, 2))

    return NextResponse.json({ success: true, handsLogged: hands.length })
  } catch (error) {
    console.error('Error logging play:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
