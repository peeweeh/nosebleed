// ChatInput — text input with Group/Coach dropdown for message routing.

'use client'

import { useState, type KeyboardEvent } from 'react'
import { type MessageVisibility } from '@/types'

type Destination = 'group' | 'coach'

interface Props {
  onSend: (body: string, visibility: MessageVisibility) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled = false }: Props) {
  const [body, setBody] = useState('')
  const [destination, setDestination] = useState<Destination>('group')

  function handleSend() {
    const text = body.trim()
    if (!text) return
    const visibility: MessageVisibility =
      destination === 'coach' ? 'human_only' : 'public'
    onSend(text, visibility)
    setBody('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-center gap-2 p-4 border-t border-zinc-700/60 bg-gradient-to-r from-zinc-900 to-zinc-950">
      {/* Destination dropdown */}
      <select
        value={destination}
        onChange={(e) => setDestination(e.target.value as Destination)}
        disabled={disabled}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
      >
        <option value="group">Group</option>
        <option value="coach">Coach</option>
      </select>

      {/* Text input */}
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={
          destination === 'coach' ? 'Ask your coach...' : 'Say something...'
        }
        className="flex-1 bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-base rounded-lg px-4 py-3 placeholder-zinc-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 disabled:opacity-40"
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={disabled || !body.trim()}
        className="px-5 py-3 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 text-base font-bold rounded-lg disabled:opacity-40 shadow-[0_2px_12px_rgba(45,212,191,0.3)] transition-all"
      >
        Send
      </button>
    </div>
  )
}
