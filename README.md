# Nosebleed 🃏

> **No-limit Texas Hold'em trainer.** Play against 4 AI opponents with distinct personalities, coached in real-time by an AI modeled after Dollar Bill from *Billions*.

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![AWS Bedrock](https://img.shields.io/badge/AWS_Bedrock-FF9900?style=flat&logo=amazon-aws&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-orange?style=flat)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

---

## What It Is

A fast, minimal poker simulator for serious skill development:

- **Full NLHE engine** — deal, bet, raise, fold, all-in, side pots, showdown, stack tracking across hands
- **4 AI opponents** with real personalities — each thinks, talks, and tilts differently
- **Dollar Bill coach** — blunt real-time feedback on every decision, tilt detection, session summary
- **Alive table** — AIs talk to each other, needle you, react to rebuys, comment on big pots
- **Inline speech bubbles** — each player's latest quip floats above their seat in real time
- **Rebuy system** — AI opponents can rebuy when busted; you can top up mid-session; all announced to the table
- **Session memory** — hand results, P&L, and coach notes persist across hands

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, TailwindCSS |
| State | Zustand v5 |
| AI | AWS Bedrock — Anthropic Claude (via `@aws-sdk/client-bedrock-runtime`) |
| Database | SQLite via Prisma |
| Validation | Zod |

---

## AI Opponents

| Seat | Archetype | Emoji | Personality |
|------|-----------|-------|-------------|
| A1 | Honey | 🍯 | Sweet up front, methodical, quietly dangerous |
| A2 | Professor | 🎓 | Tight nit — rarely plays, rarely speaks, wins quietly |
| A3 | Bull | 🐂 | Loose-aggressive, relentless pressure, loves chaos |
| A4 | Ghost | 👻 | Stone killer LAG — barely speaks, always dangerous |

Each opponent has independent tilt state, talk frequency, and strategy profile. They react to each other, to your bets, and to the board in character.

---

## Coach: Dollar Bill 💰

Modeled after Dollar Bill Stearn from *Billions*. Blunt. Tactical. Obsessed with your leaks.

- Tags every decision: `good` / `close` / `mistake` / `big_mistake`
- Detects tilt from your betting patterns and chat
- Reads your history: "You've been running loose for three sessions. Tonight we tighten up."
- End-of-session report: 10-category scores + summary + next focus

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- An AWS account with Bedrock access (Anthropic Claude enabled in your region)
- AWS credentials configured locally: `~/.aws/credentials` with a named profile

### 2. Install

```bash
git clone https://github.com/peeweeh/nosebleed.git
cd nosebleed
npm install
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
AWS_PROFILE=your-aws-profile   # named profile in ~/.aws/credentials
AWS_REGION=us-east-1           # Bedrock region with Claude access
AWS_MODEL_ID=your-bedrock-model-id
```

### 4. Set up the database

```bash
npx prisma migrate dev
```

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Features

| Feature | Status |
|---------|--------|
| Full NLHE hand cycle (deal → showdown) | ✅ Live |
| Legal betting — min-raise, all-in, side pots | ✅ Live |
| Stack persistence across hands | ✅ Live |
| Dealer button rotation per hand | ✅ Live |
| 4 AI personality archetypes | ✅ Live |
| AI action engine (Bedrock) | ✅ Live |
| AI table talk between players | ✅ Live |
| Dollar Bill real-time coaching | ✅ Live |
| Inline speech bubbles on seat cards | ✅ Live |
| Emoji avatars per archetype | ✅ Live |
| Human rebuy (+1k) with P&L tracking | ✅ Live |
| AI opponent rebuy buttons | ✅ Live |
| Rebuy announcements — AIs react in chat | ✅ Live |
| AI hole card leak protection | ✅ Live |
| Speed control (slow / normal / fast) | ✅ Live |
| Card reveal toggle (training mode) | ✅ Live |
| Pre-session lobby + config | ✅ Live |
| Session summary screen | ✅ Live |
| SQLite persistence (Prisma) | ✅ Live |

---

## Project Structure

```
app/
├── lobby/         # Pre-session config & buy-ins
├── game/          # Main game screen
├── summary/       # End-of-session scorecard
└── api/           # Server actions

components/
├── TableOval      # Felt surface — community cards, pot, dealer quip
├── SeatCard       # Player tile — stack, cards, action, speech bubble
├── PlayingCard    # Single card renderer (sm/md/lg/xl)
├── ActionBar      # Human fold/check/call/bet controls
├── ChatFeed       # Scrollable table talk log
└── ChatInput      # Human chat input

lib/
├── game/          # Dealer engine — pure logic, no LLM
└── ai/            # Bedrock adapter, prompt registry, opponent + coach logic

stores/
├── gameStore      # GameState, seat stacks, AI loop, patchSeatStack
└── chatStore      # Chat messages, broadcastToTable

constants/         # SEAT_ORDER, speed tiers, archetype presets
types/             # Shared TypeScript interfaces
prisma/            # Schema + migrations
```

---

## Dev Commands

```bash
npm run dev          # Start Next.js dev server
npm run type-check   # TypeScript check (no emit)
npm run lint         # ESLint
npx prisma studio    # Browse SQLite data
npx prisma migrate dev   # Run migrations
```

---

## Design Principles

- **Speed first** — hands resolve fast, UI stays out of the way
- **Human feel** — the table is alive; players bicker, needle, tilt
- **Training-first** — every session produces a coach summary and P&L
- **Spec before code** — all features planned in `plans/` before implementation
- **750-line rule** — no file exceeds 750 lines (most are under 300)

---

## PRD

Full product spec: [prd.md](prd.md)

## Private Planning Policy

Dharma protocol assets are intentionally private and are not stored in this public repo.

- `plans/`
- `.github/instructions/`
- `.github/agents/`
- `.github/copilot-instructions.md`

Source of truth for those files is `nosebleed-private`.

---

## License

MIT
