// Database query helpers — typed CRUD over Prisma models.

import { db } from '@/lib/db'
import { type GameState, type SessionConfig } from '@/types'

// ─── Session State (save / resume) ────────────────────────────────────────────

export async function saveSessionState(
  sessionId: string,
  state: GameState,
  config: SessionConfig,
): Promise<void> {
  await db.sessionState.upsert({
    where: { sessionId },
    update: {
      gameState: JSON.stringify(state),
      handNumber: state.handNumber,
      updatedAt: new Date(),
    },
    create: {
      sessionId,
      config: JSON.stringify(config),
      gameState: JSON.stringify(state),
      handNumber: state.handNumber,
    },
  })
}

export async function loadSessionState(sessionId: string): Promise<{
  state: GameState
  config: SessionConfig
} | null> {
  const row = await db.sessionState.findUnique({ where: { sessionId } })
  if (!row) return null
  return {
    state: JSON.parse(row.gameState) as GameState,
    config: JSON.parse(row.config) as SessionConfig,
  }
}

export async function deleteSessionState(sessionId: string): Promise<void> {
  await db.sessionState.deleteMany({ where: { sessionId } })
}

// ─── Session Summary (scorecard) ──────────────────────────────────────────────

export async function createSessionSummary(params: {
  sessionId: string
  handsPlayed: number
  netBB: number
  netChips: number
  vpip: number
  pfr: number
  wtsd: number
  aiLineup: string
}): Promise<void> {
  await db.sessionSummary.create({ data: params })
}

export async function getRecentSummaries(limit = 10) {
  return db.sessionSummary.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// ─── Player Profile (long-term stats) ─────────────────────────────────────────

export async function getOrCreateProfile(playerId = 'human') {
  return db.playerProfile.upsert({
    where: { playerId },
    update: {},
    create: { playerId },
  })
}

export async function updateProfileStats(
  playerId: string,
  delta: {
    totalHands?: number
    lifetimeNetBB?: number
    totalSessions?: number
  },
): Promise<void> {
  await db.playerProfile.update({
    where: { playerId },
    data: {
      totalHands: { increment: delta.totalHands ?? 0 },
      lifetimeNetBB: { increment: delta.lifetimeNetBB ?? 0 },
      totalSessions: { increment: delta.totalSessions ?? 0 },
    },
  })
}

// ─── Chat Log ─────────────────────────────────────────────────────────────────

export async function appendChatLog(params: {
  sessionId: string
  handNumber: number
  sender: string
  message: string
  visibility: string
}): Promise<void> {
  await db.chatLog.create({ data: params })
}

export async function getChatLog(sessionId: string, limit = 200) {
  return db.chatLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}
