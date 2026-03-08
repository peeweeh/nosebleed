// ChatFeed — scrolling message feed. Shows public + human_only messages.
// Renders coach messages with a distinct style.

'use client'

import { useEffect, useRef } from 'react'
import { type ChatMessage } from '@/types'

interface Props {
  messages: ChatMessage[]
}

const VARIANT_STYLES: Record<string, string> = {
  opponent: 'text-zinc-200',
  human: 'text-teal-300',
  dealer: 'text-amber-400 italic',
  coach: 'text-violet-400 italic',
}

const VARIANT_PREFIX: Record<string, string> = {
  opponent: '',
  human: 'You',
  dealer: '🃏 Dealer',
  coach: '👁 Coach',
}

export default function ChatFeed({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3 text-base">
      {messages.length === 0 && (
        <span className="text-zinc-600 text-sm text-center mt-6 tracking-widest uppercase">
          Table is quiet...
        </span>
      )}
      {messages.map((msg) => {
        const isCoach = msg.variant === 'coach'
        const isDealer = msg.variant === 'dealer'
        const prefix =
          msg.variant === 'opponent'
          ? (msg.senderLabel ?? msg.sender)
          : VARIANT_PREFIX[msg.variant] ?? msg.variant
        return (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 rounded-lg px-3 py-2 ${
              isCoach
                ? 'bg-gradient-to-r from-violet-950/50 to-violet-900/20 border border-violet-800/30'
                : isDealer
                  ? 'bg-gradient-to-r from-amber-950/40 to-zinc-900/20 border border-amber-900/20'
                  : 'bg-zinc-800/30'
            }`}
          >
            <span className={`text-sm font-semibold uppercase tracking-widest ${
              isCoach ? 'text-violet-400' : isDealer ? 'text-amber-500' : 'text-zinc-500'
            }`}>
              {prefix}
            </span>
            <span className={`leading-snug ${VARIANT_STYLES[msg.variant] ?? 'text-zinc-300'}`}>
              {msg.message}
            </span>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
