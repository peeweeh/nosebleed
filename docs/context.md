# Nosebleed — Project Context (Current State)

> **Keep this file updated to reflect current state, not history.**
> Reference `prd.md` for the full product spec.

## What Is This

No-limit Texas Hold'em training app. Single-player. 4 AI opponents with real personalities. Coached in real-time by Dollar Bill from Billions.

Public repo. Built for fun and skill improvement.

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js (App Router) | TypeScript |
| Styling | TailwindCSS | Dark theme only |
| State | Zustand | Per-domain stores |
| Database | SQLite via Prisma | 4 tables — see schema below |
| AI | Ollama (local) / Bedrock | Via `LLMProvider` abstraction |

## Key Directories

```
app/           # Next.js routes
components/    # UI components
lib/
├── game/      # Dealer engine (pure logic)
├── ai/        # LLM adapter, opponent, coach
└── db/        # Prisma queries
types/         # Shared TypeScript interfaces
constants/     # Game rules, archetype definitions
prisma/        # schema.prisma + migrations
plans/         # Specs and tickets
.github/       # Dharma Protocol (agents, instructions, copilot config)
```

## Database Schema (v1)

4 models in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `SessionSummary` | End-of-session scorecard |
| `SessionState` | Save/resume game snapshot |
| `PlayerProfile` | Long-term aggregated stats |
| `ChatLog` | Optional full chat archive |

> **Before adding a table:** read `prisma/schema.prisma` and confirm it's necessary.

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `OLLAMA_ENDPOINT` | Ollama base URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model to use | `llama3` |
| `AI_BACKEND` | `ollama` or `bedrock` | `ollama` |
| `AWS_REGION` | Bedrock region (if bedrock) | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock model (if bedrock) | — |

## Development Status

See [README.md](../README.md#features) for current feature status.

## AI opponent Archetypes

Defined in `constants/archetypes.ts` (to be created). Stats from PRD section 10.

## Workflow

Specs live in `plans/`. Follow Dharma Protocol in `.github/copilot-instructions.md`.
