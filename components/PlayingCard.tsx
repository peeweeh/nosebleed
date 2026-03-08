// PlayingCard — renders a single card with rank + suit symbol.
// suit prop is the word form: 'hearts' | 'diamonds' | 'spades' | 'clubs'

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  spades: '♠',
  clubs: '♣',
}

const IS_RED: Record<string, boolean> = {
  hearts: true,
  diamonds: true,
  spades: false,
  clubs: false,
}

interface Props {
  rank: string
  suit: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  faceDown?: boolean
}

const SIZES = {
  sm: { card: 'w-8 h-11',   rank: 'text-[11px]', suit: 'text-base' },
  md: { card: 'w-10 h-14',  rank: 'text-xs',     suit: 'text-lg'  },
  lg: { card: 'w-14 h-20',  rank: 'text-base',   suit: 'text-2xl' },
  xl: { card: 'w-20 h-28',  rank: 'text-xl',     suit: 'text-4xl' },
}

export default function PlayingCard({ rank, suit, size = 'md', faceDown = false }: Props) {
  const sz = SIZES[size]
  const symbol = SUIT_SYMBOL[suit] ?? '?'
  const red = IS_RED[suit] ?? false
  const displayRank = rank === 'T' ? '10' : rank

  if (faceDown) {
    return (
      <div
        className={`${sz.card} rounded-md border border-zinc-600 bg-zinc-700 shadow-md flex items-center justify-center`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)',
        }}
      >
        <span className="text-zinc-500 text-xs select-none">🂠</span>
      </div>
    )
  }

  return (
    <div
      className={`${sz.card} rounded-md bg-white shadow-md flex flex-col relative select-none overflow-hidden`}
    >
      {/* Top-left pip */}
      <div className={`absolute top-[3px] left-[4px] leading-none font-black ${sz.rank} ${red ? 'text-rose-600' : 'text-zinc-900'}`}>
        <div>{displayRank}</div>
        <div>{symbol}</div>
      </div>

      {/* Center suit */}
      <div className={`flex-1 flex items-center justify-center ${sz.suit} ${red ? 'text-rose-500' : 'text-zinc-800'}`}>
        {symbol}
      </div>

      {/* Bottom-right pip (rotated) */}
      <div
        className={`absolute bottom-[3px] right-[4px] leading-none font-black ${sz.rank} ${red ? 'text-rose-600' : 'text-zinc-900'} rotate-180`}
      >
        <div>{displayRank}</div>
        <div>{symbol}</div>
      </div>
    </div>
  )
}
