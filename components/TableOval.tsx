// TableOval — renders the poker table oval with seat positions around it.

import { type Seat, type SeatId } from '@/types'
import SeatCard from './SeatCard'
import PlayingCard from './PlayingCard'

interface Props {
  seats: Record<SeatId, Seat>
  activePlayer: SeatId | null
  communityCards: { rank: string; suit: string }[]
  potTotal: number
  revealCards?: boolean
  onRebuy?: (seatId: SeatId) => void
  latestMessages?: Partial<Record<string, string>>
}

// Seat positions as CSS percentages around the oval
const SEAT_POSITIONS: Record<string, { top: string; left: string }> = {
  human: { top: '82%', left: '50%' },
  a1: { top: '50%', left: '13%' },
  a2: { top: '10%', left: '25%' },
  a3: { top: '10%', left: '75%' },
  a4: { top: '50%', left: '87%' },
}

export default function TableOval({
  seats,
  activePlayer,
  communityCards,
  potTotal,
  revealCards = false,
  onRebuy,
  latestMessages = {},
}: Props) {
  return (
    <div className="relative w-full aspect-video mx-auto">
      {/* Oval felt — dark green radial gradient with wood rail */}
      <div className="absolute inset-[6%] rounded-[50%] border-[8px] border-amber-950/80 shadow-[inset_0_0_100px_rgba(0,0,0,0.7),0_0_60px_rgba(0,0,0,0.6)]"
           style={{ background: 'radial-gradient(ellipse at center, #1e4d2f 0%, #0d2217 65%, #061209 100%)' }} />
      {/* Inner rail highlight */}
      <div className="absolute inset-[6%] rounded-[50%] border-[2px] border-amber-900/30 pointer-events-none" style={{ inset: 'calc(6% + 8px)' }} />

      {/* Community cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {communityCards.length === 0 ? (
            <span className="text-emerald-900/80 text-sm tracking-widest uppercase">awaiting flop</span>
          ) : (
            communityCards.map((c, i) => (
              <PlayingCard key={i} rank={c.rank} suit={c.suit} size="xl" />
            ))
          )}
        </div>
        {potTotal > 0 && (
          <span className="text-amber-400 text-base font-bold tracking-wide drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
            Pot: {potTotal.toLocaleString()}
          </span>
        )}
        {/* Dealer last message */}
        {latestMessages['dealer'] && (
          <span className="text-amber-200/70 text-base italic text-center max-w-[340px] leading-snug line-clamp-2 mt-1">
            {latestMessages['dealer']}
          </span>
        )}
      </div>

      {/* Seats */}
      {Object.values(seats).map((seat) => {
        const pos = SEAT_POSITIONS[seat.id]
        if (!pos) return null
        return (
          <div
            key={seat.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: pos.top, left: pos.left }}
          >
            <SeatCard
              seat={seat}
              isActive={activePlayer === seat.id}
              revealCards={revealCards}
              onRebuy={onRebuy ? () => onRebuy(seat.id as SeatId) : undefined}
              lastQuip={seat.id !== 'human' ? latestMessages[seat.id] : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
