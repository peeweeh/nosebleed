'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameStore, setAISpeed, type SpeedKey } from '@/stores/gameStore'
import { useChatStore } from '@/stores/chatStore'
import { type GameState, type SessionConfig, type SeatId, type Seat, type PlayerAction, type MessageVisibility, type ChatMessage, type Card } from '@/types'
import { ARCHETYPES } from '@/constants/archetypes'
import { SEAT_ORDER } from '@/constants/game'
import { getLegalActions, type LegalActions } from '@/lib/game/actions'
import { registerDealerVoice } from '@/lib/ai/dealerVoice'
import { registerCoach } from '@/lib/ai/coach'
import { broadcastToTable } from '@/lib/ai/tableChat'
import TableOval from '@/components/TableOval'
import ActionBar from '@/components/ActionBar'
import ChatFeed from '@/components/ChatFeed'
import ChatInput from '@/components/ChatInput'

function buildInitialState(sessionId: string, config: SessionConfig): GameState {
  const seats = Object.fromEntries(
    config.seats.map((sc): [SeatId, Seat] => [
      sc.seatId,
      {
        id: sc.seatId,
        archetypeId: sc.seatId === 'human' ? null : sc.archetypeId,
        name: sc.seatId === 'human' ? 'You' : (sc.archetypeId ? (ARCHETYPES[sc.archetypeId]?.name ?? sc.seatId) : sc.seatId),
        mood: 'neutral',
        stack: sc.buyIn,
        holeCards: null,
        isActive: true,
        isFolded: false,
        isAllIn: false,
        currentBet: 0,
        lastAction: null,
      },
    ]),
  ) as Record<SeatId, Seat>

  return {
    sessionId,
    handNumber: 0,
    street: 'preflop',
    board: [],
    pot: { main: 0, sides: [] },
    seats,
    activePlayer: null,
    dealerSeat: SEAT_ORDER[0] as SeatId,
    smallBlindSeat: SEAT_ORDER[1] as SeatId,
    bigBlindSeat: SEAT_ORDER[2] as SeatId,
    minRaise: config.bigBlind,
    lastRaiseAmount: config.bigBlind,
    actionsThisStreet: [],
    showdownCards: null,
    winners: null,
  }
}

function deriveNextMood(prev: GameState, seatId: SeatId, stackAfter: number): string {
  const seat = prev.seats[seatId]
  if (!seat) return 'neutral'
  if (seatId === 'human') return seat.mood ?? 'neutral'

  const stackBefore = seat.stack
  const wonHand = (prev.winners ?? []).includes(seatId)
  const busted = stackBefore > 0 && stackAfter === 0
  const heavyLoss = stackBefore > 0 && stackAfter <= Math.floor(stackBefore * 0.6)
  const jammedThisHand = prev.actionsThisStreet.some(
    (e) => e.seatId === seatId && e.action.type === 'all-in',
  )

  if (wonHand) return 'confident'
  if (busted) return 'tilted'
  if (heavyLoss) return 'pissed_off'
  if (jammedThisHand && !wonHand) return 'irritated'
  if (seat.isFolded && !wonHand) return 'cautious'
  return 'neutral'
}

// Carry stacks forward from the completed hand and rotate dealer button
function buildNextHandState(prev: GameState, config: SessionConfig): GameState {
  const order = SEAT_ORDER as SeatId[]
  const prevDealerIdx = order.indexOf(prev.dealerSeat)
  const newDealer = order[(prevDealerIdx + 1) % order.length]
  const newSB    = order[(prevDealerIdx + 2) % order.length]
  const newBB    = order[(prevDealerIdx + 3) % order.length]

  const seats = Object.fromEntries(
    config.seats.map((sc): [SeatId, Seat] => {
      const prevSeat = prev.seats[sc.seatId]
      // AI players auto-rebuy 1k when broke; human must rebuy manually
      const rawStack = prevSeat?.stack ?? sc.buyIn
      const stack = (rawStack === 0 && sc.seatId !== 'human') ? 1000 : rawStack
      return [
        sc.seatId,
        {
          id: sc.seatId,
          archetypeId: sc.seatId === 'human' ? null : sc.archetypeId,
          name: prevSeat?.name ?? (sc.seatId === 'human' ? 'You' : (sc.archetypeId ? (ARCHETYPES[sc.archetypeId]?.name ?? sc.seatId) : sc.seatId)),
          mood: deriveNextMood(prev, sc.seatId, stack),
          stack,
          holeCards: null,
          isActive: stack > 0,
          isFolded: false,
          isAllIn: false,
          currentBet: 0,
          lastAction: null,
        },
      ]
    }),
  ) as Record<SeatId, Seat>

  return {
    ...prev,
    street: 'preflop',
    board: [],
    pot: { main: 0, sides: [] },
    seats,
    activePlayer: null,
    dealerSeat: newDealer,
    smallBlindSeat: newSB,
    bigBlindSeat: newBB,
    actionsThisStreet: [],
    showdownCards: null,
    winners: null,
  }
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const { state, isAIThinking, initHand, humanAction, patchSeatStack } = useGameStore()
  const { messages, addMessage, clearMessages } = useChatStore()

  const [config, setConfig] = useState<SessionConfig | null>(null)
  const [speed, setSpeed] = useState<SpeedKey>('normal')
  const [revealCards, setRevealCards] = useState(false)
  const [totalRebought, setTotalRebought] = useState(0)
  const voiceRegistered = useRef(false)
  const initialBuyIn = useRef<number>(0)
  const stackBeforeHand = useRef<number>(0)

  // Load config and init first hand
  useEffect(() => {
    const raw = sessionStorage.getItem(sessionId)
    if (!raw) {
      router.push('/lobby')
      return
    }
    const cfg = JSON.parse(raw) as SessionConfig
    setConfig(cfg)
    clearMessages()
    const humanCfg = cfg.seats.find(s => s.seatId === 'human')
    initialBuyIn.current = humanCfg?.buyIn ?? 1000

    const initial = buildInitialState(sessionId, cfg)
    initHand(initial)
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Register dealer voice + coach once
  useEffect(() => {
    if (voiceRegistered.current) return
    voiceRegistered.current = true

    registerDealerVoice((msg) => addMessage(msg))
    registerCoach(
      (msg) => addMessage(msg),
      () => useGameStore.getState().state,
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reveal cards when hand ends, hide again when next hand starts
  // Log score ~8s after hand completes so the coach posthand analysis is in the feed
  const prevStreetRef = useRef<string | null>(null)
  const scoreLoggedHandRef = useRef<number>(-1)
  useEffect(() => {
    if (!state) return
    if (state.street === 'complete' && prevStreetRef.current !== 'complete') {
      setRevealCards(true)
      // Snapshot everything we need now (state/refs may change before the timer fires)
      const snapHand = state.handNumber
      const snapStack = state.seats['human']?.stack ?? 0
      const snapStackBefore = stackBeforeHand.current
      const snapWinners = state.winners ?? []
      const snapFolded = state.seats['human']?.isFolded ?? false
      const snapHole = state.seats['human']?.holeCards
        ? state.seats['human'].holeCards!.map(c => `${c.rank}${c.suit}`).join(' ')
        : '—'
      const snapBoard = state.board.length > 0
        ? state.board.map(c => `${c.rank}${c.suit}`).join(' ')
        : 'none'
      // Wait 8s for the coach's posthand message to land in the feed, then log.
      // Do NOT return a cleanup — street will change to 'preflop' before the timer
      // fires and React would cancel it on cleanup, preventing the log from saving.
      setTimeout(() => {
        if (scoreLoggedHandRef.current === snapHand) return // already logged
        scoreLoggedHandRef.current = snapHand
        const allMsgs = useChatStore.getState().messages
        const coachMsgs = allMsgs.filter(m => m.variant === 'coach')
        const lastCoach = coachMsgs[coachMsgs.length - 1]?.message ?? '—'
        const currentState = useGameStore.getState().state
        
        // Log to score.md
        void fetch('/api/log/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handNumber: snapHand,
            humanStack: snapStack,
            stackBefore: snapStackBefore,
            winners: snapWinners,
            humanFolded: snapFolded,
            holeCards: snapHole,
            board: snapBoard,
            coachAnalysis: lastCoach,
          }),
        })

        // Log to play.json for debugging
        if (currentState) {
          const playersData = (Object.entries(currentState.seats) as [SeatId, Seat][]).map(([id, seat]) => ({
            name: id === 'human' ? 'You' : (seat.name ?? id),
            hand: seat.holeCards ? seat.holeCards.map(c => `${c.rank}${c.suit}`) : null,
            position: id === currentState.dealerSeat ? 'button' : 
                     id === currentState.smallBlindSeat ? 'small_blind' :
                     id === currentState.bigBlindSeat ? 'big_blind' : 'other',
            finalStack: seat.stack,
          }))
          
          void fetch('/api/log/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              handNumber: snapHand,
              gameMetadata: {
                sessionId: currentState.sessionId ?? 'unknown',
                timestamp: new Date().toISOString(),
              },
              players: playersData,
              finalBoard: snapBoard.split(' ').filter(c => c !== 'none'),
              winners: snapWinners.map(w => w === 'human' ? 'You' : (currentState.seats[w]?.name ?? w)),
            }),
          })
        }
      }, 8000)
    } else if (state.street !== 'complete' && prevStreetRef.current === 'complete') {
      setRevealCards(false)
    } else if (state.street === 'preflop' && prevStreetRef.current !== 'preflop') {
      // Record stack at start of each new hand
      stackBeforeHand.current = state.seats['human']?.stack ?? 0
    }
    prevStreetRef.current = state.street
  }, [state?.street])

  // Show "Next Hand" button when hand is over — no auto-deal
  function handleNextHand() {
    if (!config || !state) return
    initHand(buildNextHandState(state, config))
  }

  // Announce a rebuy to the table chat so AIs can react
  function announceRebuy(seatId: SeatId, amount: number) {
    if (!state) return
    const name = seatId === 'human' ? 'The Rookie' : (state.seats[seatId]?.name ?? seatId)
    const msg: ChatMessage = {
      id: `rebuy-${seatId}-${Date.now()}`,
      variant: 'dealer',
      sender: 'dealer',
      senderLabel: 'Dealer',
      message: `${name} reached into their pocket and reloaded +${amount.toLocaleString()}.`,
      visibility: 'public',
      timestamp: Date.now(),
    }
    addMessage(msg)
    void broadcastToTable({
      message: msg.message,
      fromSeatId: seatId,
      fromName: name,
      state,
      addMessage,
      conversationMemory: useChatStore.getState().messages,
    })
  }

  function handleRebuy() {
    if (!config || !state) return
    const REBUY = 1000
    setTotalRebought(t => t + REBUY)
    announceRebuy('human', REBUY)
    const patched: GameState = {
      ...state,
      seats: {
        ...state.seats,
        human: { ...state.seats['human'], stack: (state.seats['human']?.stack ?? 0) + REBUY },
      },
    }
    initHand(buildNextHandState(patched, config))
  }

  function handleAIRebuy(seatId: SeatId) {
    if (!state) return
    const REBUY = 1000
    announceRebuy(seatId, REBUY)
    patchSeatStack(seatId, REBUY)
  }

  function handleHumanAction(action: PlayerAction) {
    humanAction(action)
  }

  function handleChatSend(body: string, visibility: MessageVisibility) {
    addMessage({
      id: `human-${Date.now()}`,
      variant: 'human',
      sender: 'human',
      senderLabel: 'You',
      message: body,
      visibility,
      timestamp: Date.now(),
    })

    // Broadcast to all AI seats — each independently decides to respond
    if (state && visibility === 'public') {
      void broadcastToTable({
        message: body,
        fromSeatId: 'human',
        fromName: 'The Rookie',
        state,
        addMessage,
        conversationMemory: useChatStore.getState().messages,
      })
    }

    // Coach message — call /api/ai/coach directly
    if (state && visibility === 'human_only') {
      void fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, question: body, mode: 'hint' }),
      })
        .then(r => r.json())
        .then((data: { message: string }) => {
          if (!data.message) return
          addMessage({
            id: `coach-reply-${Date.now()}`,
            variant: 'coach',
            sender: 'dollarbill',
            senderLabel: 'Dollar Bill',
            message: data.message,
            visibility: 'human_only',
            timestamp: Date.now(),
          })
        })
        .catch(() => {
          addMessage({
            id: `coach-reply-${Date.now()}`,
            variant: 'coach',
            sender: 'dollarbill',
            senderLabel: 'Dollar Bill',
            message: "I'm thinking... trust your read on this one.",
            visibility: 'human_only',
            timestamp: Date.now(),
          })
        })
    }
  }

  if (!state || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <span className="text-zinc-500 text-sm animate-pulse">Loading table...</span>
      </div>
    )
  }

  const humanSeat = state.seats['human']
  const isHandOver = state.street === 'complete'
  const isHumanTurn = state.activePlayer === 'human'
  const emptyLegal: LegalActions = { canFold: false, canCheck: false, canCall: false, callAmount: 0, canRaise: false, canBet: false, minRaise: 0, maxRaise: 0 }
  const legal = isHumanTurn && humanSeat
    ? getLegalActions(state, 'human')
    : emptyLegal

  // Show all messages to human (public + human_only)
  const visibleMessages = messages

  // Latest message per sender for inline seat display
  const latestBySender = messages.reduce<Record<string, string>>((acc, m) => {
    // AI quips: public messages from AI seats
    if (m.visibility === 'public' && m.sender && m.sender !== 'human') {
      acc[m.sender] = m.message
    }
    // Dealer
    if (m.variant === 'dealer') {
      acc['dealer'] = m.message
    }
    // Coach (human_only)
    if (m.variant === 'coach') {
      acc['coach'] = m.message
    }
    return acc
  }, {})

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'radial-gradient(ellipse at 40% 20%, #1a1a2e 0%, #09090b 70%)' }}>
      {/* Left: Table + Actions */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Table — fills all available space */}
        <div className="flex-1 flex items-center justify-center p-6">
          <TableOval
            seats={state.seats}
            activePlayer={state.activePlayer}
            communityCards={state.board}
            potTotal={state.pot.main}
            revealCards={revealCards}
            onRebuy={isHandOver ? handleAIRebuy : undefined}
            latestMessages={latestBySender}
          />
        </div>

        {/* Status / HUD bar */}
        <div className="px-6 py-3 flex items-center gap-5 border-t border-zinc-800/60 bg-gradient-to-r from-zinc-900 to-zinc-950">
          <span className="text-zinc-500 text-sm font-mono">Hand #{state.handNumber}</span>
          <span className="text-zinc-600 text-sm uppercase tracking-widest">{state.street}</span>
          {/* Stack — always visible */}
          <span className="text-teal-400 font-bold text-sm">
            Your stack: <span className="text-base text-teal-300">{humanSeat?.stack.toLocaleString() ?? '—'}</span>
          </span>
          {/* Net P&L */}
          {(() => {
            const net = (humanSeat?.stack ?? 0) - initialBuyIn.current - totalRebought
            return (
              <span className={`text-sm font-bold ${
                net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-zinc-600'
              }`}>
                {net > 0 ? '+' : ''}{net.toLocaleString()}
              </span>
            )
          })()}
          {isAIThinking && (
            <span className="text-zinc-400 text-sm animate-pulse tracking-wide">opponents thinking...</span>
          )}
          {/* Winners banner */}
          {isHandOver && state.winners && (
            <span className="text-amber-400 font-bold text-sm tracking-wide drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              ✦ {state.winners.map(w =>
                w === 'human' ? 'The Rookie' : (state.seats[w]?.name ?? w)
              ).join(' & ')} win{state.winners.length > 1 ? '' : 's'} the pot!
            </span>
          )}
          <div className="ml-auto flex items-center gap-4">
            {/* Speed selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600 text-xs uppercase tracking-widest">Speed</span>
              {(['slow', 'normal', 'fast'] as SpeedKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSpeed(s); setAISpeed(s) }}
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                    speed === s
                      ? 'bg-teal-600 text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Reveal cards toggle */}
            <button
              onClick={() => setRevealCards(v => !v)}
              title={revealCards ? 'Hide cards' : 'Show cards'}
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border transition-all ${
                revealCards
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'border-zinc-700 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              👁
            </button>
            <button
              onClick={() => handleChatSend('What do you think?', 'human_only')}
              title="Ask the coach for advice"
              className="text-zinc-600 hover:text-violet-400 text-lg transition-all"
            >
              💭
            </button>
            {isHandOver && (
              <button
                onClick={handleNextHand}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 text-sm font-bold rounded-lg shadow-[0_2px_16px_rgba(45,212,191,0.4)] transition-all"
              >
                Next Hand →
              </button>
            )}
            {isHandOver && (
              <button
                onClick={handleRebuy}
                className="px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 border border-zinc-600 text-zinc-300 text-sm font-bold rounded-lg transition-all"
                title="Add 1,000 chips and start next hand"
              >
                + 1k rebuy
              </button>
            )}
            <button
              onClick={() => router.push(`/summary/${sessionId}`)}
              title="End session"
              className="text-zinc-600 hover:text-rose-400 text-lg transition-all"
            >
              🚪
            </button>
          </div>
        </div>

        {/* Action bar */}
        {!isHandOver && (
          <ActionBar
            legal={legal}
            humanStack={humanSeat?.stack ?? 0}
            isHumanTurn={isHumanTurn && !isAIThinking && !isHandOver}
            onAction={handleHumanAction}
          />
        )}
      </div>

      {/* Right: Chat panel */}
      <div className="w-[620px] flex flex-col border-l border-zinc-800/60" style={{ background: 'linear-gradient(to bottom, #18181b, #0f0f12)' }}>
        <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-950">
          <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
            Table Chat
          </span>
          <button
            onClick={clearMessages}
            className="text-zinc-600 hover:text-zinc-400 text-xs tracking-wide uppercase"
          >
            reset
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatFeed messages={visibleMessages} />
        </div>
        <ChatInput onSend={handleChatSend} disabled={false} />
      </div>
    </div>
  )
}
