// SeatCard — displays a single player's stack, bet, and status.

import { type Seat } from '@/types'
import PlayingCard from './PlayingCard'

const ACTION_LABELS: Record<string, string> = {
  fold: 'FOLDED',
  check: 'CHECK',
  call: 'CALL',
  bet: 'BET',
  raise: 'RAISE',
  'all-in': 'ALL-IN',
}

const ARCHETYPE_EMOJI: Record<string, string> = {
  honey:      '🍯',
  professor:  '🎓',
  bull:       '🐂',
  ghost:      '👻',
  dollarbill: '💰',
  dealer:     '🎴',
}

interface Props {
  seat: Seat
  isActive: boolean
  revealCards?: boolean
  onRebuy?: () => void
  lastQuip?: string
  coachMessage?: string
}

export default function SeatCard({ seat, isActive, revealCards = false, onRebuy, lastQuip, coachMessage }: Props) {
  const isFolded = seat.isFolded
  const isHuman = seat.id === 'human'
  const emoji = isHuman ? '🎯' : (seat.archetypeId ? (ARCHETYPE_EMOJI[seat.archetypeId] ?? '🃏') : '🃏')
  const quip = !isHuman ? lastQuip : coachMessage

  const bgGradient = isFolded
    ? 'bg-zinc-900'
    : isActive
      ? 'bg-gradient-to-b from-zinc-700 to-zinc-800'
      : isHuman
        ? 'bg-gradient-to-b from-zinc-800 to-zinc-900'
        : 'bg-gradient-to-b from-zinc-900 to-zinc-950'

  return (
    <div className="flex flex-col items-center">

      {quip ? (
        <div className={`relative max-w-[380px] rounded-2xl px-4 py-2.5 mb-2 text-sm leading-snug text-center shadow-lg ${
          isHuman ? 'bg-violet-950/95 border border-violet-500/70 text-violet-100' : 'bg-zinc-800/95 border border-zinc-500/60 text-zinc-100'
        }`}>
          {quip}
          <span className={`absolute left-1/2 -translate-x-1/2 -bottom-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent ${ isHuman ? 'border-t-[8px] border-t-violet-500/70' : 'border-t-[8px] border-t-zinc-500/60' }`} />
        </div>
      ) : (
        <div className="mb-2 h-[40px]" />
      )}

      <div
        className={`relative flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 min-w-[110px] border transition-all ${bgGradient} ${
          isFolded
            ? 'opacity-30 border-zinc-700'
            : isActive
              ? 'border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.5),0_0_40px_rgba(45,212,191,0.2)]'
              : isHuman
                ? 'border-teal-800/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                : 'border-zinc-700/60 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl leading-none">{emoji}</span>
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            {seat.name ?? seat.id}
          </span>
        </div>

      {/* Stack */}
      <span className={`text-base font-bold ${
        isHuman ? 'text-teal-300' : 'text-zinc-100'
      }`}>
        {seat.stack.toLocaleString()}
      </span>

      {/* Current bet */}
      {seat.currentBet > 0 && !isFolded && (
        <span className="text-xs text-amber-400 font-semibold">
          bet {seat.currentBet.toLocaleString()}
        </span>
      )}

      {/* Hole cards (human only, face-up) */}
      {isHuman && seat.holeCards && seat.holeCards.length > 0 && (
        <div className="flex gap-1.5 mt-1">
          {seat.holeCards.map((c, i) => (
            <PlayingCard key={i} rank={c.rank} suit={c.suit} size="md" />
          ))}
        </div>
      )}

      {/* AI hidden cards — face-down normally, revealed when revealCards=true */}
      {!isHuman && !isFolded && seat.holeCards && seat.holeCards.length > 0 && (
        <div className="flex gap-1.5 mt-1">
          {seat.holeCards.map((c, i) =>
            revealCards
              ? <PlayingCard key={i} rank={c.rank} suit={c.suit} size="md" />
              : <PlayingCard key={i} rank="" suit="" size="md" faceDown />
          )}
        </div>
      )}

      {/* Last action badge */}
      {seat.lastAction && !isFolded && (
        <span className={`text-xs font-bold tracking-widest px-1.5 py-0.5 rounded ${
          seat.lastAction.type === 'raise' || seat.lastAction.type === 'bet'
            ? 'text-rose-400'
            : seat.lastAction.type === 'call'
              ? 'text-teal-400'
              : seat.lastAction.type === 'all-in'
                ? 'text-amber-400'
                : 'text-zinc-500'
        }`}>
          {ACTION_LABELS[seat.lastAction.type] ?? seat.lastAction.type.toUpperCase()}
          {(seat.lastAction.type === 'bet' || seat.lastAction.type === 'raise') && seat.lastAction.amount
            ? ` ${seat.lastAction.amount}` : ''}
        </span>
      )}

      {/* Folded badge */}
      {isFolded && (
        <span className="text-xs text-zinc-600 uppercase tracking-widest">folded</span>
      )}

      {/* Bust + rebuy */}
      {seat.stack === 0 && !isFolded && onRebuy && (
        <button
          onClick={onRebuy}
          className="mt-0.5 text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-800/50 hover:border-amber-500 rounded px-2 py-0.5 transition-all tracking-wide"
        >
          ↻ +1k
        </button>
      )}
    </div>
    </div>
  )
}
