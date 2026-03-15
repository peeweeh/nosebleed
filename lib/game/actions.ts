// Action validation — determines legal actions and amounts for any seat.

import type { GameState, PlayerAction, ActionType, SeatId } from '@/types'

export interface LegalActions {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number
  canBet: boolean
  canRaise: boolean
  minRaise: number
  maxRaise: number // all-in
}

export function getLegalActions(state: GameState, seatId: SeatId): LegalActions {
  const seat = state.seats[seatId]

  // Not an actionable seat on this turn.
  if (!seat.isActive || seat.isFolded || seat.isAllIn || seat.stack === 0) {
    return { canFold: false, canCheck: false, canCall: false, callAmount: 0, canBet: false, canRaise: false, minRaise: 0, maxRaise: 0 }
  }

  const facingBet = maxBetOnStreet(state) - seat.currentBet

  const canCheck = facingBet <= 0
  const canFold = true  // always legal to fold on your turn
  // Calling is always legal when facing a bet and you still have chips.
  // If the bet is larger than your stack, this becomes an all-in call.
  const canCall = facingBet > 0 && seat.stack > 0
  const callAmount = Math.min(facingBet, seat.stack)
  const canBet = facingBet === 0 && seat.stack > 0
  const canRaise = facingBet > 0 && seat.stack > facingBet

  // Min raise: last raise amount or big blind, whichever is larger
  const minRaise = Math.min(
    seat.stack,
    Math.max(state.minRaise, maxBetOnStreet(state) + state.lastRaiseAmount),
  )
  const maxRaise = seat.stack + seat.currentBet

  return { canFold, canCheck, canCall, callAmount, canBet, canRaise, minRaise, maxRaise }
}

export function isActionLegal(
  state: GameState,
  seatId: SeatId,
  action: PlayerAction,
): boolean {
  const legal = getLegalActions(state, seatId)
  switch (action.type) {
    case 'fold': return legal.canFold
    case 'check': return legal.canCheck
    case 'call': return legal.canCall
    case 'bet': return legal.canBet && !!action.amount && action.amount >= legal.minRaise
    case 'raise': return legal.canRaise && !!action.amount && action.amount >= legal.minRaise
    case 'all-in': return state.seats[seatId].stack > 0
    default: return false
  }
}

// How much has been put in on this street across all active seats
function maxBetOnStreet(state: GameState): number {
  return Math.max(...Object.values(state.seats).map(s => s.currentBet))
}

// Determine if a short all-in reopens action (full raise required)
export function allInReopensAction(
  state: GameState,
  allInAmount: number,
): boolean {
  const facing = maxBetOnStreet(state)
  return allInAmount - facing >= state.lastRaiseAmount
}

export const ACTION_LABEL: Record<ActionType, string> = {
  fold: 'Fold',
  check: 'Check',
  call: 'Call',
  bet: 'Bet',
  raise: 'Raise',
  'all-in': 'All-In',
}
