import type { SeatId } from '@/types'

// ─── Blinds presets ──────────────────────────────────────────────────────────

export const BLIND_PRESETS = [
  { label: '1/2', small: 1, big: 2 },
  { label: '2/5', small: 2, big: 5 },
  { label: '5/10', small: 5, big: 10 },
  { label: '25/50', small: 25, big: 50 },
  { label: '50/100 (Big Game)', small: 50, big: 100 },
] as const

// ─── Seat order ──────────────────────────────────────────────────────────────

export const SEAT_ORDER: SeatId[] = ['human', 'a1', 'a2', 'a3', 'a4']

// ─── Bet sizing quick picks ───────────────────────────────────────────────────

export const BET_SIZE_PRESETS = [
  { label: '⅓ pot', fraction: 1 / 3 },
  { label: '½ pot', fraction: 1 / 2 },
  { label: '¾ pot', fraction: 3 / 4 },
  { label: 'Pot', fraction: 1 },
] as const

// ─── Talk ────────────────────────────────────────────────────────────────────

export const TALK_SPEECH_BUBBLE_MS = 4000
export const TALK_MAX_MESSAGES_PER_HAND = 3
export const TALK_COOLDOWN_MS = 8000

// ─── Hand events that trigger AI talk ───────────────────────────────────────

export const TALK_TRIGGER_EVENTS = [
  'BIG_BET',      // bet > 50% pot
  'ALL_IN',
  'FOLD',
  'SHOWDOWN',
  'TILT_SPIKE',
  'STREET_DEALT',
] as const

export type TalkTriggerEvent = typeof TALK_TRIGGER_EVENTS[number]

// ─── Session snapshot cadence ────────────────────────────────────────────────

export const SNAPSHOT_EVERY_N_HANDS = 5
