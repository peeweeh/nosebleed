'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { type SessionConfig } from '@/types'

export default function SummaryPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [config, setConfig] = useState<SessionConfig | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(sessionId)
    if (raw) setConfig(JSON.parse(raw) as SessionConfig)
  }, [sessionId])

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Session Over</h1>
        <p className="text-zinc-500 text-sm">
          Good session. Stats persistence coming in the next phase.
        </p>
        {config && (
          <div className="bg-zinc-900 rounded-lg p-4 text-left space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <span>Buy-in</span>
              <span className="text-zinc-200">
                {(config.seats[0]?.buyIn ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Blinds</span>
              <span className="text-zinc-200">
                {config.smallBlind}/{config.bigBlind}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => router.push('/lobby')}
          className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-zinc-950 font-bold rounded transition-colors text-sm uppercase tracking-wider"
        >
          New Session
        </button>
      </div>
    </main>
  )
}
