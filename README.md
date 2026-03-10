# Nosebleed

Train like the chips are real.

Nosebleed is a no-limit Texas Hold'em training sim where the table fights back. You play full hands against personality-driven opponents, get live table talk, and receive blunt coach feedback while the hand is still hot.

![Nosebleed Table](images/nosebleed.png)

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-orange?style=flat)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

## What Makes It Different

- Full hand loop: blinds, betting rounds, all-in spots, showdown, stack carry-over.
- Personality opponents: style, ego, tilt, and mood influence decisions.
- Live table chat: AI opponents react to pressure, punts, and momentum shifts.
- Coach in your corner: hand-aware advice and post-hand rating/analysis.
- Debug-friendly tools: one-click hand move copy with river + shown hands.

## Opponent Pool

Pick from a larger archetype pool in the lobby, then seat 4 opponents per session.

- Honey: Southern charm LAG pressure.
- Professor: GTO pedant, low-noise TAG lines.
- Bull: high aggression, high volatility.
- Ghost: ultra-tight trap specialist.
- Remy: patient road gambler.
- Viper: cold precision LAG.
- Cleo: theatrical slowplay traps.
- Luna: read-heavy chaos lines.
- Duchess: selective and punishing in big pots.

## Quick Start

### 1. Requirements

- Node.js 20+
- npm

### 2. Install

```bash
git clone https://github.com/peeweeh/nosebleed.git
cd nosebleed
npm install
```

### 3. Configure

```bash
cp .env.local.example .env.local
```

Set your provider in `.env.local`.

OpenAI-compatible endpoint:

```env
AI_PROVIDER=openai
AI_API_BASE=https://your-endpoint/v1
AI_API_KEY=your-key
AI_MODEL_ID=your-model
AI_REASONING_ENABLED=false
AI_REASONING_BUDGET=1024
```

AWS Bedrock:

```env
AI_PROVIDER=bedrock
AWS_PROFILE=your-profile
AWS_REGION=us-east-1
AWS_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
AI_REASONING_ENABLED=false
AI_REASONING_BUDGET=1024
```

Ollama:

```env
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
AI_REASONING_ENABLED=false
AI_REASONING_BUDGET=1024
```

### 4. Run

```bash
npm run dev
# http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run lint
npm run type-check
npm run build
```

## Project Layout

```text
app/            routes: lobby, game, summary, api
components/     table UI, controls, chat
lib/game/       deterministic poker engine
lib/ai/         provider, coach, dealer, opponent logic
stores/         zustand state stores
constants/      archetypes and game constants
types/          shared TypeScript types
prisma/         schema + local DB
```

## Notes

- `tokens.md` and `score.md` are local run logs and ignored by git.
- Planning/private instruction assets are intentionally blocked from this public repo.

## License

MIT
