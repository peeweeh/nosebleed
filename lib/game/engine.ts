// Main dealer engine — deterministic, no LLM, no side effects.
// Emits DealerEvents which the dealer-voice layer consumes for LLM talk.

import type { GameState, PlayerAction, SeatId, Seat, Street } from '@/types'
import { SEAT_ORDER } from '@/constants/game'
import { buildDeck, shuffle, dealN } from './deck'
import { isActionLegal, allInReopensAction } from './actions'
import { evaluateBestHand } from './showdown'
import { buildSidePots, totalPot } from './pots'

export type DealerEventType =
  | 'HAND_START'
  | 'STREET_DEALT'
  | 'ACTION_TAKEN'
  | 'BIG_BET'
  | 'ALL_IN'
  | 'FOLD'
  | 'SHOWDOWN'
  | 'HAND_COMPLETE'

export interface DealerEvent {
  type: DealerEventType
  state: GameState
  seatId?: SeatId
  action?: PlayerAction
}

export type DealerEventListener = (event: DealerEvent) => void

const listeners: DealerEventListener[] = []

export function onDealerEvent(fn: DealerEventListener): void {
  listeners.push(fn)
}

function emit(event: DealerEvent): void {
  listeners.forEach(fn => fn(event))
}

// ─── Start Hand ─────────────────────────────────────────────────────────────

export function startHand(state: GameState): GameState {
  const deck = shuffle(buildDeck())
  const activeSeats = SEAT_ORDER.filter(id => state.seats[id].stack > 0)

  // Deal 2 hole cards per active seat
  let remaining = deck
  const newSeats = { ...state.seats }
  for (const id of activeSeats) {
    const { dealt, remaining: r } = dealN(remaining, 2)
    remaining = r
    newSeats[id] = {
      ...newSeats[id],
      holeCards: dealt as [typeof dealt[0], typeof dealt[1]],
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      lastAction: null,
    }
  }

  // Post blinds
  const sb = state.smallBlindSeat
  const bb = state.bigBlindSeat
  const sbAmount = Math.min(newSeats[sb].stack, state.pot.main === 0 ? 0 : 0) // handled below
  newSeats[sb].currentBet = Math.min(newSeats[sb].stack, 0) // will set properly

  const newState: GameState = {
    ...state,
    handNumber: state.handNumber + 1,
    street: 'preflop',
    board: [],
    pot: { main: 0, sides: [] },
    seats: newSeats,
    actionsThisStreet: [],
    showdownCards: null,
    winners: null,
  }

  const s = postBlinds(newState)
  emit({ type: 'HAND_START', state: s })
  return s
}

function postBlinds(state: GameState): GameState {
  const sb = state.smallBlindSeat
  const bb = state.bigBlindSeat
  const sbAmt = Math.min(state.seats[sb].stack, Math.floor(state.pot.main === 0 ? 1 : 1))

  // Simple: derive from actual config — caller sets blinds in config
  // For now use minRaise as big blind
  const bbAmt = state.minRaise
  const sbAmt2 = Math.floor(bbAmt / 2)

  const seats = { ...state.seats }
  seats[sb] = chipOut(seats[sb], sbAmt2)
  seats[bb] = chipOut(seats[bb], bbAmt)

  const activeAfterBB = nextActiveSeat(state, bb)

  return {
    ...state,
    seats,
    pot: { main: sbAmt2 + bbAmt, sides: [] },
    activePlayer: activeAfterBB,
    lastRaiseAmount: bbAmt,
    actionsThisStreet: [],
  }
}

// ─── Apply Action ────────────────────────────────────────────────────────────

export function applyAction(
  state: GameState,
  seatId: SeatId,
  action: PlayerAction,
): GameState {
  if (!isActionLegal(state, seatId, action)) {
    throw new Error(`Illegal action ${action.type} for ${seatId}`)
  }

  let s = { ...state }
  const seats = { ...s.seats }
  const seat = { ...seats[seatId] }

  switch (action.type) {
    case 'fold':
      seat.isFolded = true
      seat.isActive = false
      seats[seatId] = seat  // write mutated seat back
      break
    case 'check':
      seats[seatId] = seat  // ensure seat reference is current
      break
    case 'call': {
      const facing = maxBetOnStreet(s) - seat.currentBet
      const paid = Math.min(seat.stack, facing)
      const calledSeat = chipOut(seat, paid)
      seats[seatId] = calledSeat.stack === 0 ? { ...calledSeat, isAllIn: true } : calledSeat
      s = addToPot(s, paid)
      break
    }
    case 'bet':
    case 'raise': {
      const amount = action.amount!
      const extra = amount - seat.currentBet
      const raisedSeat = chipOut(seat, extra)
      seats[seatId] = raisedSeat.stack === 0 ? { ...raisedSeat, isAllIn: true } : raisedSeat
      s = addToPot(s, extra)
      s = { ...s, lastRaiseAmount: amount - maxBetOnStreet(state) }
      break
    }
    case 'all-in': {
      const allIn = seat.stack
      const reopens = allInReopensAction(s, seat.currentBet + allIn)
      seats[seatId] = { ...chipOut(seat, allIn), isAllIn: true }
      s = addToPot(s, allIn)
      if (!reopens) s = { ...s, lastRaiseAmount: 0 }
      break
    }
  }

  seat.lastAction = action
  seats[seatId] = { ...seats[seatId], lastAction: action }

  s = {
    ...s,
    seats,
    actionsThisStreet: [...s.actionsThisStreet, { seatId, action }],
  }

  emit({ type: action.type === 'fold' ? 'FOLD' : 'ACTION_TAKEN', state: s, seatId, action })
  if (action.type === 'all-in') emit({ type: 'ALL_IN', state: s, seatId, action })
  if (action.amount && action.amount > totalPot(s.pot) * 0.5) {
    emit({ type: 'BIG_BET', state: s, seatId, action })
  }

  // Advance player
  const next = nextActiveSeat(s, seatId)

  // If only one player hasn't folded, they win immediately — no more streets
  const stillIn = SEAT_ORDER.filter(id => !s.seats[id].isFolded && s.seats[id].holeCards)
  if (stillIn.length === 1) {
    return resolveHand(s)
  }

  if (isStreetOver(s)) {
    return advanceStreet(s)
  }
  return { ...s, activePlayer: next }
}

// ─── Advance Street ──────────────────────────────────────────────────────────

export function advanceStreet(state: GameState): GameState {
  const nextStreet = nextStreetAfter(state.street)
  if (nextStreet === 'showdown') return resolveHand(state)

  const cardsToAdd = nextStreet === 'flop' ? 3 : 1
  const usedCards = new Set<string>()
  for (const c of state.board) usedCards.add(`${c.rank}${c.suit}`)
  for (const seat of Object.values(state.seats)) {
    if (!seat.holeCards) continue
    for (const c of seat.holeCards) usedCards.add(`${c.rank}${c.suit}`)
  }
  const deck = shuffle(buildDeck()).filter(
    c => !usedCards.has(`${c.rank}${c.suit}`),
  )
  const newBoard = [...state.board, ...deck.slice(0, cardsToAdd)]

  // Reset current bets AND last actions for new street
  const seats = { ...state.seats }
  for (const id of SEAT_ORDER) {
    seats[id] = { ...seats[id], currentBet: 0, lastAction: null }
  }

  const firstActor = firstToActPostflop(state)
  const s: GameState = {
    ...state,
    street: nextStreet,
    board: newBoard,
    seats,
    actionsThisStreet: [],
    activePlayer: firstActor,
    lastRaiseAmount: state.minRaise,
  }

  emit({ type: 'STREET_DEALT', state: s })

  // No seat can act (everyone else folded or all-in): run out streets immediately.
  if (firstActor === null) {
    return advanceStreet(s)
  }

  return s
}

// ─── Resolve Hand ────────────────────────────────────────────────────────────

export function resolveHand(state: GameState): GameState {
  const contestants = SEAT_ORDER.filter(id => !state.seats[id].isFolded && state.seats[id].holeCards)

  if (contestants.length === 1) {
    const winner = contestants[0]
    const winAmount = totalPot(state.pot)
    const seats = { ...state.seats }
    seats[winner] = { ...seats[winner], stack: seats[winner].stack + winAmount }
    const s: GameState = { ...state, street: 'complete', winners: [winner], seats, activePlayer: null }
    emit({ type: 'HAND_COMPLETE', state: s })
    return s
  }

  // Evaluate each contestant
  const results = contestants.map(id => ({
    id,
    score: evaluateBestHand(state.seats[id].holeCards!, state.board).score,
  }))
  const topScore = Math.max(...results.map(r => r.score))
  const winners = results.filter(r => r.score === topScore).map(r => r.id)

  const winAmount = Math.floor(totalPot(state.pot) / winners.length)
  const seats = { ...state.seats }
  for (const w of winners) {
    seats[w] = { ...seats[w], stack: seats[w].stack + winAmount }
  }

  const s: GameState = {
    ...state,
    street: 'complete',
    showdownCards: Object.fromEntries(contestants.map(id => [id, state.seats[id].holeCards!])) as Record<SeatId, [Card['rank'] extends string ? Card : Card, Card]>,
    winners,
    seats,
    activePlayer: null,
    pot: { main: 0, sides: [] },
  }

  emit({ type: 'SHOWDOWN', state: s })
  emit({ type: 'HAND_COMPLETE', state: s })
  return s
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chipOut(seat: Seat, amount: number): Seat {
  return { ...seat, stack: seat.stack - amount, currentBet: seat.currentBet + amount }
}

function addToPot(state: GameState, amount: number): GameState {
  return { ...state, pot: { ...state.pot, main: state.pot.main + amount } }
}

function maxBetOnStreet(state: GameState): number {
  return Math.max(...Object.values(state.seats).map(s => s.currentBet))
}

function isStreetOver(state: GameState): boolean {
  const active = SEAT_ORDER.filter(id => state.seats[id].isActive && !state.seats[id].isAllIn)
  if (active.length <= 1) return true
  
  // Check if all active players have acted on this street
  const actedThisStreet = new Set(state.actionsThisStreet.map(a => a.seatId))
  if (!active.every(id => actedThisStreet.has(id))) {
    return false
  }
  
  // All have acted; now check if all have matched the bet
  const max = maxBetOnStreet(state)
  return active.every(id => state.seats[id].currentBet === max)
}

function nextActiveSeat(state: GameState, current: SeatId): SeatId | null {
  const order = SEAT_ORDER
  const idx = order.indexOf(current)
  for (let i = 1; i < order.length; i++) {
    const id = order[(idx + i) % order.length]
    if (state.seats[id].isActive && !state.seats[id].isFolded && !state.seats[id].isAllIn) {
      return id
    }
  }
  return null
}

function firstToActPostflop(state: GameState): SeatId | null {
  const order = SEAT_ORDER
  const dealerIdx = order.indexOf(state.dealerSeat)
  for (let i = 1; i <= order.length; i++) {
    const id = order[(dealerIdx + i) % order.length]
    if (state.seats[id].isActive && !state.seats[id].isFolded && !state.seats[id].isAllIn) {
      return id
    }
  }
  return null
}

function nextStreetAfter(street: Street): Street {
  const map: Record<Street, Street> = {
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
    river: 'showdown',
    showdown: 'complete',
    complete: 'complete',
  }
  return map[street]
}

// Re-export Card type for resolveHand usage
import type { Card } from '@/types'
