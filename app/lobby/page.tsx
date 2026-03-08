'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BLIND_PRESETS } from '@/constants/game'
import { ARCHETYPES, OPPONENT_ARCHETYPE_IDS } from '@/constants/archetypes'
import { type SessionConfig, type SeatConfig, type SeatId } from '@/types'

const BUYINS = [500, 1000, 2500, 5000, 10000]
const SEAT_IDS: SeatId[] = ['human', 'a1', 'a2', 'a3', 'a4']
const DEFAULT_ARCHETYPE_IDS: Record<SeatId, string> = {
  human: 'human',
  a1: 'honey',
  a2: 'professor',
  a3: 'bull',
  a4: 'ghost',
}

export default function LobbyPage() {
  const router = useRouter()
  const [buyIn, setBuyIn] = useState(1000)
  const [blindPreset, setBlindPreset] = useState(0)
  const [archetypes, setArchetypes] = useState(DEFAULT_ARCHETYPE_IDS)

  function updateArchetype(seatId: SeatId, archetypeId: string) {
    setArchetypes((prev) => ({ ...prev, [seatId]: archetypeId }))
  }

  function handleStart() {
    const preset = BLIND_PRESETS[blindPreset]
    const seats: SeatConfig[] = SEAT_IDS.map((seatId) => ({
      seatId,
      archetypeId: seatId === 'human' ? null : archetypes[seatId],
      buyIn,
      rebuyAllowed: false,
    }))
    const config: SessionConfig = {
      smallBlind: preset.small,
      bigBlind: preset.big,
      seats,
      coachMode: 'hint',
      coachBluntness: 'direct',
      speed: 'normal',
      showAICards: 'showdown',
    }
    const sessionId = `session-${Date.now()}`
    sessionStorage.setItem(sessionId, JSON.stringify(config))
    router.push(`/game/${sessionId}`)
  }

  const preset = BLIND_PRESETS[blindPreset]

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            Nosebleed
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            No-limit Texas Hold&apos;em training
          </p>
        </div>

        {/* Buy-in */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Buy-in
          </label>
          <div className="flex gap-2 flex-wrap">
            {BUYINS.map((b) => (
              <button
                key={b}
                onClick={() => setBuyIn(b)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  buyIn === b
                    ? 'bg-teal-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {b.toLocaleString()}
              </button>
            ))}
          </div>
        </section>

        {/* Blinds */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Blinds
          </label>
          <div className="flex gap-2 flex-wrap">
            {BLIND_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setBlindPreset(i)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  blindPreset === i
                    ? 'bg-teal-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-zinc-600 text-xs">
            {preset.small}/{preset.big} — effective stack:{' '}
            {Math.round(buyIn / preset.big)}bb
          </p>
        </section>

        {/* Opponents */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Opponents
          </label>
          {(SEAT_IDS.filter((id) => id !== 'human')).map((seatId) => (
            <div key={seatId} className="flex items-center gap-3">
              <span className="text-zinc-500 text-xs w-6 uppercase">{seatId}</span>
              <select
                value={archetypes[seatId]}
                onChange={(e) => updateArchetype(seatId, e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-teal-400"
              >
                {OPPONENT_ARCHETYPE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ARCHETYPES[id].name} — {ARCHETYPES[id].description}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-zinc-950 font-bold rounded transition-colors text-sm uppercase tracking-wider"
        >
          Start Session
        </button>
      </div>
    </main>
  )
}
