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
