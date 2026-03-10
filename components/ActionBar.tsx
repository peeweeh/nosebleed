// ActionBar — human action controls. Disabled when it's not the human's turn.

'use client'

import { useState, useEffect } from 'react'
import { type PlayerAction } from '@/types'
import { type LegalActions } from '@/lib/game/actions'

interface Props {
  legal: LegalActions
  humanStack: number
  isHumanTurn: boolean
  onAction: (action: PlayerAction) => void
}

export default function ActionBar({
  legal,
  humanStack,
  isHumanTurn,
  onAction,
}: Props) {
  const [raiseAmount, setRaiseAmount] = useState(legal.minRaise)

  // Sync slider when legal actions change (new street / new hand)
  useEffect(() => {
    setRaiseAmount(prev => Math.max(prev, legal.minRaise))
  }, [legal.minRaise])

  const disabled = !isHumanTurn

  function handleRaise() {
    const amount = Math.max(raiseAmount, legal.minRaise)
    onAction({ type: legal.canBet ? 'bet' : 'raise', amount })
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-t border-zinc-700/60 transition-opacity ${
        disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Fold */}
      {legal.canFold && (
        <button
          onClick={() => onAction({ type: 'fold' })}
          className="px-6 py-3 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-zinc-200 text-base font-semibold border border-zinc-600/60 shadow-md transition-all"
        >
          Fold
        </button>
      )}

      {/* Check */}
      {legal.canCheck && (
        <button
          onClick={() => onAction({ type: 'check' })}
          className="px-6 py-3 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-zinc-200 text-base font-semibold border border-zinc-600/60 shadow-md transition-all"
        >
          Check
        </button>
      )}

      {/* Call */}
      {legal.canCall && (
        <button
          onClick={() => onAction({ type: 'call' })}
          className="px-6 py-3 rounded-lg bg-gradient-to-b from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-base font-bold shadow-[0_2px_12px_rgba(20,184,166,0.4)] transition-all"
        >
          Call {legal.callAmount.toLocaleString()}
        </button>
      )}

      {/* Raise / Bet */}
      {(legal.canRaise || legal.canBet) && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={legal.minRaise}
            max={humanStack}
            step={Math.max(1, Math.round(legal.minRaise / 2))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
            className="w-36 accent-teal-400"
          />
          <span className="text-sm text-zinc-400 w-20 text-right font-semibold">
            {raiseAmount.toLocaleString()}
          </span>
          <button
            onClick={handleRaise}
            className="px-6 py-3 rounded-lg bg-gradient-to-b from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-zinc-950 text-base font-bold shadow-[0_2px_16px_rgba(45,212,191,0.5)] transition-all"
          >
            {legal.canBet ? 'Bet' : 'Raise'}
          </button>
        </div>
      )}

      {/* All-in (when stack <= minRaise or direct all-in) */}
      {humanStack > 0 && !legal.canRaise && !legal.canBet && (
        <button
          onClick={() => onAction({ type: 'all-in' })}
          className="px-6 py-3 rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-base font-bold shadow-[0_2px_16px_rgba(239,68,68,0.4)] transition-all"
        >
          All-in
        </button>
      )}
    </div>
  )
}
