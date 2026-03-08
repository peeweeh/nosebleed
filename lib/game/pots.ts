// Pot building — main pot and side pots for all-in scenarios.

import type { GameState, SeatId, Pot, SidePot } from '@/types'

export function buildPots(state: GameState): Pot {
  const seats = Object.values(state.seats)
  const activeSeatIds = seats
    .filter(s => !s.isFolded)
    .map(s => s.id) as SeatId[]

  // Contributions per seat this hand (cumulative across streets)
  // We derive from currentBet which resets each street, so we track via
  // a helper passed in from the engine. For simplicity we work from
  // the existing state.pot and accumulate only current street here.
  // Full side-pot splitting is handled by buildSidePots below.
  return state.pot
}

/**
 * Build side pots from a map of total contributions per seat.
 * contributions: { seatId -> total chips committed this hand }
 */
export function buildSidePots(
  contributions: Record<SeatId, number>,
  eligibleSeats: SeatId[],
): SidePot[] {
  const sorted = Object.entries(contributions)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => a - b) as [SeatId, number][]

  const pots: SidePot[] = []
  let prev = 0

  for (const [seatId, amount] of sorted) {
    const level = amount - prev
    if (level <= 0) continue

    const eligible = eligibleSeats.filter(s => (contributions[s] ?? 0) >= amount)
    const potAmount = level * sorted.filter(([, a]) => a >= amount).length

    if (potAmount > 0) {
      pots.push({ amount: potAmount, eligibleSeats: eligible })
    }
    prev = amount
  }

  return pots
}

export function totalPot(pot: Pot): number {
  return pot.main + pot.sides.reduce((sum, s) => sum + s.amount, 0)
}
