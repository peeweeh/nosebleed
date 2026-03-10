// Shared TypeScript types for the Nosebleed game engine and AI layer.
// All game logic, AI adapters, and UI components import from here.

// ─── Suits & Ranks ──────────────────────────────────────────────────────────

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

// ─── Actions ────────────────────────────────────────────────────────────────

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

export interface PlayerAction {
  type: ActionType
  amount?: number // required for bet/raise/all-in
}

// ─── Streets ────────────────────────────────────────────────────────────────

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete'

// ─── Seats ──────────────────────────────────────────────────────────────────

export type SeatId = 'human' | 'a1' | 'a2' | 'a3' | 'a4'

export interface Seat {
  id: SeatId
  archetypeId: string | null // null for human
  name?: string              // display name (set from archetype)
  mood?: string              // optional: 'neutral' | 'tilted' | 'confident'
  stack: number
  holeCards: [Card, Card] | null
  isActive: boolean     // still in the hand
  isFolded: boolean
  isAllIn: boolean
  currentBet: number    // amount put in on current street
  lastAction: PlayerAction | null
}

// ─── Pot ────────────────────────────────────────────────────────────────────

export interface SidePot {
  amount: number
  eligibleSeats: SeatId[]
}

export interface Pot {
  main: number
  sides: SidePot[]
}

// ─── Game State ─────────────────────────────────────────────────────────────

export interface GameState {
  sessionId: string
  handNumber: number
  street: Street
  board: Card[]             // 0-5 community cards
  pot: Pot
  seats: Record<SeatId, Seat>
  activePlayer: SeatId | null
  dealerSeat: SeatId
  smallBlindSeat: SeatId
  bigBlindSeat: SeatId
  minRaise: number
  lastRaiseAmount: number   // tracks if a short all-in reopens action
  actionsThisStreet: Array<{ seatId: SeatId; action: PlayerAction }>
  showdownCards: Record<SeatId, [Card, Card]> | null
  winners: SeatId[] | null
}

// ─── AI Mood / Tilt ─────────────────────────────────────────────────────────

export interface AIMood {
  archetypeId: string
  tiltLevel: number         // 0-10
  recentResults: number[]   // last 5 hand net BB outcomes
  speechCooldownUntil: number // epoch ms
  messagesThisHand: number
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export type MessageVisibility = 'public' | 'human_only'
export type MessageVariant = 'opponent' | 'human' | 'dealer' | 'coach'

export interface ChatMessage {
  id: string
  sender: string            // archetypeId, 'human', 'dealer', 'coach'
  senderLabel?: string      // display name (optional)
  variant: MessageVariant
  message: string
  visibility: MessageVisibility
  handNumber?: number       // optional — not all messages are tied to a hand
  timestamp: number         // epoch ms
}

// ─── Session Config ──────────────────────────────────────────────────────────

export interface SeatConfig {
  seatId: SeatId
  archetypeId: string | null
  buyIn: number
  rebuyAllowed: boolean
}

export interface SessionConfig {
  smallBlind: number
  bigBlind: number
  seats: SeatConfig[]
  coachMode: 'off' | 'hint' | 'full'
  coachBluntness: 'professional' | 'direct' | 'savage'
  speed: 'slow' | 'normal' | 'fast'
  showAICards: 'always' | 'showdown' | 'never'
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  lender: SeatId | 'house'
  borrower: SeatId
  amount: number
  handNumber: number
}
