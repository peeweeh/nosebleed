---

# NOSEBLEED – Product Requirements Document (v1)

**Repo:** `nosebleed`  
**Stack:** Next.js (App Router) + React + TypeScript + TailwindCSS + SQLite  
**Last updated:** March 6, 2026

***

## 1. Product overview

- **Name:** Nosebleed
- **One‑liner:** A fast, minimal Next.js no‑limit Texas Hold'em simulator where I train against 4 AI opponents with distinct human personalities, coached in real‑time by an AI modeled after Dollar Bill from Billions.
- **Core principles:**
  - **Speed first:** hands resolve fast, UI stays out of the way.
  - **Human feel:** AIs talk to each other, talk to me, needle, brag, tilt – the table is alive.
  - **Training‑first:** every session produces a compact scorecard and coach summary for self‑reinforcement.
  - **Configurable everything:** stakes, buy‑ins per seat, AI personalities, talk levels, model backend – all switches exposed.
  - **Persistent memory:** coach remembers the full session and my long‑term profile across sessions.

***

## 2. Texas Hold'em rules (built‑in tutorial)

The app explains all of this to a new player on first launch (onboarding overlay or "Learn" tab).

### 2.1 What is poker?

- A betting game where 2–10 players get cards, bet chips into a pot, and the best 5‑card hand at showdown wins – or the last player standing if everyone else folds.

### 2.2 Hand rankings (high → low)

| Rank | Hand | Example |
|------|------|---------|
| 1 | Royal Flush | A♠K♠Q♠J♠10♠ |
| 2 | Straight Flush | 5♥6♥7♥8♥9♥ |
| 3 | Four of a Kind | 7♠7♥7♦7♣ + X |
| 4 | Full House | K♠K♥K♦3♣3♦ |
| 5 | Flush | Any 5 same suit, not sequential |
| 6 | Straight | Any 5 sequential, mixed suits |
| 7 | Three of a Kind | 9♠9♥9♦ + X + Y |
| 8 | Two Pair | J♠J♥4♦4♣ + X |
| 9 | One Pair | A♠A♥ + X + Y + Z |
| 10 | High Card | Nothing above; highest card plays |

### 2.3 Texas Hold'em structure

- Each player receives 2 private "hole cards."
- Up to 5 shared "community cards" are dealt face‑up on the board.
- Best 5‑card combination from any mix of hole cards + board wins.

### 2.4 Betting rounds

- **Blinds:** small blind + big blind posted before cards are dealt.
- **Preflop:** 2 hole cards dealt, first betting round.
- **Flop:** 3 community cards dealt, second betting round.
- **Turn:** 4th community card, third betting round.
- **River:** 5th community card, final betting round, then showdown.

### 2.5 Actions

- **Check:** bet nothing, pass action (only if no bet is out).
- **Bet:** first chips into the pot on this street.
- **Call:** match the current bet to stay in.
- **Raise:** increase the current bet; others must at least call.
- **Fold:** give up your cards and any chips already in the pot.
- **All‑in:** push every chip you have.

### 2.6 Key concepts

- **Position:** later position = more information = more power.
- **Pot odds:** ratio of what you must call vs what's in the pot.
- **Bluffing:** betting/raising with a weak hand to make opponents fold.
- **Tilt:** emotional state where you play worse after bad beats or frustration.

***

## 3. Table composition

| Seat | Role | Visible to human? |
|------|------|-------------------|
| H | Human (me) | Yes |
| A1 | AI Opponent 1 | Yes |
| A2 | AI Opponent 2 | Yes |
| A3 | AI Opponent 3 | Yes |
| A4 | AI Opponent 4 | Yes |
| D | Dealer engine | No (system logic) |
| C | Coach (Dollar Bill) | Side panel, only to human |

- Single‑player only for v1.

***

## 4. UI design: sleek, minimal, fast

### 4.1 Visual language

- **Theme:** flat, dark (charcoal/near‑black background), single accent color (teal, electric blue, or muted gold).
- **No skeuomorphism:** no faux felt, no 3D chips, no wood grain. Cards are clean rectangles with suit + rank. Chips are numeric labels.
- **Typography:** one sans‑serif font, clear hierarchy. Stack sizes and pot in bold; actions in medium weight.

### 4.2 Table layout

- **Center:** simple oval or rounded‑rectangle "table" shape.
  - Community cards in a clean horizontal row.
  - Pot size label directly below the board.
- **Seats:** arranged around the table.
  - Human seat anchored at bottom center.
  - A1–A4 fanned across top and sides.
  - Each seat shows:
    - Name + avatar (simple icon or single initial in a circle).
    - Stack size.
    - Last action text ("BET 120", "FOLD", "ALL‑IN").
    - Small speech bubble for table talk (fades after 3–5 seconds).
- **Dealer button:** small "D" chip indicator that rotates.

### 4.3 Human action bar

- Fixed at bottom of screen.
- Buttons:
  - **Fold** (always available when facing a bet).
  - **Check / Call** (context‑dependent label).
  - **Bet / Raise** (context‑dependent label).
- Bet sizing:
  - Slider from min‑raise to all‑in.
  - Quick‑select pills: ⅓ pot, ½ pot, ¾ pot, pot, all‑in.
- **Chat input:** small text field or mic icon below action bar for sending table talk.

### 4.4 Side panels (right side, tabbed)

- **Coach tab:** Dollar Bill's commentary, suggestions, warnings.
- **Table Talk tab:** scrollable feed of all chat (AI‑to‑AI, AI‑to‑human, human‑to‑table).
- **Session tab:** live score bars + current net BB + focus reminder from last session.

### 4.5 Speed control

- Slider in top bar or settings: **Slow** (teaching) / **Normal** / **Fast**.
- Slow: card animations, longer pauses for reading coach + talk.
- Normal: brief transitions.
- Fast: instant deal, minimal delay between actions.

***

## 5. Configuration: every switch exposed

Accessible via **Settings drawer** (gear icon, top‑right) + a **pre‑session lobby** screen.

### 5.1 Pre‑session lobby

Clean card layout showing:

- **Stakes header:** "Game: 2/5 NLHE"
- **Per‑seat cards** (Human + A1–A4):
  - Name, avatar, personality label (e.g., "Drunk Gambler").
  - Buy‑in amount (editable per seat).
  - Min/max buy‑in range.
  - Rebuy allowed: toggle.
- **"Start Session"** button → creates `sessionId`, snapshots config, game begins.

### 5.2 Game structure settings

- **Blinds:**
  - Small blind (numeric).
  - Big blind (numeric).
  - Presets: 1/2, 2/5, 5/10, 25/50, 50/100 ("Big Game").
- **Buy‑ins / entrance fee (per seat):**
  - Min buy‑in (in BB).
  - Max buy‑in (in BB).
  - Current buy‑in for this session (slider or numeric input).
  - Rebuy allowed: on/off per seat.
- **Game mode:**
  - Cash (fixed blinds, open‑ended).
  - Tournament (v2): starting stack, blind schedule, rebuys toggle.

### 5.3 Table behavior settings

- **Speed:** slider (Slow / Normal / Fast).
- **Info density:**
  - Show AI hole cards: Always (training) / Showdown only (realistic) / Never (sweat mode).
  - Stack display: Chips / Big blinds.
- **Table talk:**
  - Global level: Off / Light / Normal / Spicy.
  - Per‑player mute: checkbox next to each AI.
  - My table talk: On / Off.

### 5.4 AI opponent settings (per seat A1–A4)

- **Strategy sliders (1–10):**
  - Tightness.
  - Aggression.
  - Bluff frequency.
  - Risk tolerance.
- **Personality sliders (1–10):**
  - Talkiness.
  - Ego.
  - Tilt volatility.
  - Sensitivity to table talk (how much human/AI trash talk affects them).
- **Quick presets:**
  - Nit / Witty Reg / Drunk Gambler / Stone Killer.

### 5.5 Coach settings

- **Persona:** Dollar Bill (fixed for v1).
- **Mode:** Off / Hint / Full.
- **Bluntness:** Professional / Direct / Savage.
- **Language filter:**
  - Clean: no profanity, still sharp.
  - Unfiltered: full Dollar Bill energy (within guardrails: no slurs, no personal attacks).

### 5.6 AI backend settings

- **Backend type:** AWS Bedrock (Anthropic Claude) / Local (Ollama) — configured via env vars.
- **Model name / ID:** text field.
- **Local endpoint URL:** (default `http://localhost:11434`).
- **Bedrock config:** region, model ID (credentials via env vars).

***

## 6. AI architecture

### 6.1 Dealer engine

- **Pure deterministic logic** (no LLM calls):
  - Shuffle + deal.
  - Rotate dealer button.
  - Manage streets (preflop → flop → turn → river).
  - Validate actions (legal bet sizes, min‑raise rules).
  - Build main pot + side pots.
  - Determine showdown winner(s).
  - Update stacks.
- **API (conceptual):**
  - `startHand()` → deal hole cards, post blinds.
  - `applyAction(seatId, action, amount)` → validate, update state.
  - `advanceStreet()` → deal next board card(s).
  - `resolveHand()` → showdown logic, distribute pot(s).
  - `getState()` → canonical state object for all consumers.

### 6.2 AI opponents (4 "friends")

Each opponent is a combination of **strategy engine** + **personality engine**.

#### Strategy engine

- **Input:** compact game state JSON:
  - Their hole cards.
  - Board cards.
  - Pot size.
  - Stack sizes.
  - Position relative to button.
  - Action history this hand.
  - Known opponent tendencies (if modeled).
- **Decision logic:**
  - Option A (fast, default): heuristic rules engine:
    - Preflop range charts parameterized by `tightness` + `aggression`.
    - Postflop rules: C‑bet frequency, fold‑to‑raise, bluff frequency, value‑bet thresholds.
  - Option B (richer): LLM call via adapter:
    - Same state JSON → prompt → action response.
- **Output:**
  - `{ action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in', amount?: number }`

#### Personality engine

- **Input:**
  - Action just taken (by self or others).
  - Recent hand results (wins/losses).
  - Current tilt state.
  - Messages received from human or other AIs.
- **Output:**
  - Optional `tableTalk` string.
  - Updated internal mood/tilt state.

#### Tilt modeling (per AI)

- Track per AI, per session:
  - `recentResults`: last N hand outcomes.
  - `currentMood`: derived from results + incoming table talk.
- Effects:
  - When tilted:
    - Ranges widen (looser).
    - Aggression spikes.
    - Talk gets saltier or quieter (depending on personality).
  - When running hot:
    - Ego inflates.
    - May over‑bluff or get cocky in chat.

### 6.3 AI‑to‑AI table talk

**This is critical for the "alive table" feel.**

- AIs talk to *each other*, not just to the human:
  - After a big pot between A2 and A3:
    - A2: "You called that? With *that*?"
    - A3: "Paid to see it. Worth every chip."
  - After a bluff gets through:
    - A4: "..."
    - A1: "He had nothing. Again."
  - During a long tank:
    - A3: "Take your time, buddy. I'll order a drink."
- Talk triggers:
  - Showdown (especially dramatic ones).
  - Big bet / all‑in.
  - Someone folding to a small bet (needling opportunity).
  - Responding to another AI's trash talk.
  - Responding to *human* trash talk.
- Implementation:
  - After each significant event, personality engine for each AI rolls a "talk check" based on `talkiness` + event significance.
  - If triggered: generate a line from templates or LLM call.
  - Lines are contextual: reference the hand, the opponent, the action.

### 6.4 Coach: Dollar Bill

#### Persona

- Talks like Dollar Bill Stearn from Billions:
  - Blunt, tactical, money‑obsessed, supremely confident.
  - Mixes aggression with genuine insight.
  - Sample lines:
    - Pre‑action: "You're about to light money on fire. Fold."
    - Post‑mistake: "That call? That's charity. We don't do charity."
    - Post‑good play: "Now you're thinking like someone who wants to keep his money."
    - On tilt detection: "You're emotional. Emotions are for people who can afford to lose."
    - On my trash talk: "Love the energy. Now channel it into folding that garbage hand."
    - End of session: "Down 40 big blinds. You played like a tourist for the first hour, then figured it out. Tomorrow, skip the tourist part."

#### Inputs

- Full game state (my cards, board, pot, stacks, positions, action history).
- AI opponent profiles and tendencies.
- My `PlayerProfile` (long‑term averages).
- My current session scores (live‑updated).
- My chat messages (for tilt/mood detection).
- Current session focus goals.

#### Behavior modes

- **Off:** no real‑time commentary; only end‑session summary.
- **Hint:** occasional nudges on big decisions or clear mistakes.
  - "Careful. This is a fold."
- **Full:** commentary on most of my decisions.
  - Pre‑action: suggestion + sizing + one‑line reason.
  - Post‑action: tag (`good` / `close` / `mistake` / `big_mistake`) + one‑liner.

#### Decision tagging

For every human action, coach assigns:
- `good`: correct or near‑optimal.
- `close`: defensible but not ideal.
- `mistake`: clearly suboptimal, cost chips.
- `big_mistake`: major error, significant chip damage.

#### Session output

- 10 category scores (1–10).
- 2–3 sentence natural‑language summary in Dollar Bill voice.
- Next‑session focus recommendation (1–2 bullet points).

***

## 7. Human table talk & its impact on the game

### 7.1 Chat input

- Text field near action bar (or expandable chat drawer).
- Optional: quick‑phrase buttons for common lines:
  - "Nice hand." / "Show me." / "You don't have it." / "Let's gamble."
- Messages appear as:
  - Speech bubble by human seat (fades after a few seconds).
  - Logged in Table Talk feed.

### 7.2 Content guardrails

- Filter hard slurs and hate speech.
- Allow mild profanity and sharp banter (matches the Dollar Bill / poker table vibe).
- Configurable: "Language filter: On / Off."

### 7.3 How human talk affects the game

- **AI reactions:**
  - Each AI has `sensitivityToTableTalk` (1–10).
  - When you target an AI ("You never have it"):
    - Low sensitivity AI: ignores it.
    - High sensitivity AI: tilt nudge → may call lighter, bluff more, or tighten up (depending on personality).
  - AIs can *respond* to your trash talk:
    - A3 (Gambler): "Keep talking, kid. Your stack does the real talking."
    - A1 (Nit): *silence*
    - A2 (Witty Reg): "Bold words from the short stack."

- **Table image:**
  - Your talk frequency and tone contribute to a `tableImage` tag:
    - "Quiet grinder", "Chatty LAG", "Tilted maniac", etc.
  - AIs adjust strategy slightly based on your image:
    - Vs "Tilted maniac": call wider, bluff less.
    - Vs "Quiet grinder": fold more to big bets.

- **Self‑tilt detection:**
  - Classify human messages for tilt signals:
    - ALL CAPS, profanity density, "rigged" / "impossible" / "every time" language.
  - Combine with behavioral signals (sudden looseness, over‑aggression post‑loss).
  - Update live `tiltScore`.
  - Coach reacts:
    - Mild: "Easy. You're better than this."
    - Moderate: "You're tilting. I can see it in your bets and your mouth."
    - Severe: "Walk away from the table. Seriously. Come back tomorrow."

### 7.4 Logging

- `humanTalkVolume` (1–10): message frequency.
- `humanTalkSpice` (1–10): aggression/emotion of messages.
- `tiltEvents`: count of tilt‑threshold crossings.
- All stored in `SessionSummary`.

***

## 8. Session memory & persistence

### 8.1 Storage

- **Engine:** SQLite via Prisma for local persistence.
- **Entities:**
  - `SessionSummary` – compact scorecard per session.
  - `SessionState` – snapshot for resume/restart.
  - `PlayerProfile` – aggregated long‑term data.
  - `ChatLog` – optional full chat archive per session.

### 8.2 `SessionSummary`

Saved at end of session (and incrementally updated during play):

```typescript
interface SessionSummary {
  sessionId: string;            // UUID
  startTime: string;            // ISO timestamp
  endTime: string;
  stakes: string;               // e.g. "2/5"
  mode: string;                 // "training_slow", "realistic_fast", etc.
  backend: string;              // "ollama:llama3", "bedrock:claude-v3", etc.
  aiLineup: AILineupSnapshot[]; // personality + buy-in per seat
  
  handsPlayed: number;
  netBB: number;                // net result in big blinds
  
  scores: {
    aggression: number;          // 1-10
    tightness: number;
    positionDiscipline: number;
    bluffControl: number;
    valueBetting: number;
    showdownDiscipline: number;
    tiltControl: number;
    preflopFundamentals: number;
    postflopFundamentals: number;
    overallQuality: number;
  };
  
  humanTalkVolume: number;      // 1-10
  humanTalkSpice: number;       // 1-10
  tiltEvents: number;
  
  coachSummary: string;         // 2-3 sentences, Dollar Bill voice
  nextFocus: string[];          // 1-2 bullet points for next session
}
```

### 8.3 `SessionState` (for game rest / resume)

Snapshot saved every N hands or on explicit "Save & Quit":

```typescript
interface SessionState {
  sessionId: string;
  savedAt: string;
  
  // Table state
  blinds: { small: number; big: number };
  buttonPosition: number;
  stacks: Record<string, number>;     // seatId → stack
  
  // AI state
  aiMoods: Record<string, AIMoodState>;  // per-AI tilt/mood
  
  // Human state
  humanTiltScore: number;
  humanTableImage: string;
  
  // Session context
  handsPlayedSoFar: number;
  netBBSoFar: number;
  runningScores: SessionSummary['scores'];  // partial scores so far
  
  // Coach context
  recentCoachNotes: string[];   // last 5-10 coach observations
  sessionFocus: string[];       // what coach is emphasizing this session
}
```

On restart:
- **"Resume last session"** → loads `SessionState`, continues with same stacks, moods, and context.
- **"New session"** → fresh `sessionId`, new buy‑ins, previous data preserved for history.

### 8.4 `PlayerProfile` (long‑term memory)

Aggregated across all sessions:

```typescript
interface PlayerProfile {
  totalSessions: number;
  totalHands: number;
  totalNetBB: number;
  
  // Rolling averages of scores
  avgScores: SessionSummary['scores'];
  
  // Derived style
  naturalStyle: string;         // "Loose-Aggressive", "Tight-Passive", etc.
  
  // Tilt patterns
  tiltSignatures: string[];     // e.g. "Over-bluffs after big losses"
  avgTalkVolume: number;
  avgTalkSpice: number;
  
  // Trend direction per category
  trends: Record<string, 'improving' | 'stable' | 'declining'>;
}
```

Coach reads this at session start:
- "You've been running loose for three sessions straight. Tonight we tighten up or I'm done talking."

***

## 9. Tilt / "losing cool" detection (comprehensive)

### 9.1 Signals

| Source | Signal | Weight |
|--------|--------|--------|
| Behavior | VPIP spike after big loss | High |
| Behavior | Aggression spike post‑bad beat | High |
| Behavior | Calling frequency increase in large pots | Medium |
| Chat | ALL CAPS messages | Medium |
| Chat | Profanity density increase | Medium |
| Chat | "Rigged" / "impossible" / "every time" language | High |
| Chat | Rapid‑fire messages (flooding) | Medium |
| Pattern | Deviating from preflop chart (playing trash) | High |

### 9.2 Tilt score

- Calculated live, 0–10 scale.
- Updated after every hand and every chat message.
- Decays slowly over calm hands.

### 9.3 Coach response ladder

| Tilt score | Dollar Bill response |
|------------|---------------------|
| 0–3 | Normal coaching. |
| 4–5 | "You're getting warm. Stay disciplined." |
| 6–7 | "You're tilting. I can see it in your bets and your chat. Tighten up NOW." |
| 8–9 | "You're burning money. If this were real, I'd physically remove you from this table." |
| 10 | "Session over. Walk away. Come back when you remember why you're here." |

### 9.4 AI response to human tilt

- AIs with high `sensitivityToTableTalk` notice tilt:
  - May exploit: call lighter, value‑bet thinner.
  - May needle: "He's steaming. Love to see it."

***

## 10. AI personality archetypes (default 4)

### A1: "The Professor" (Tight Nit)

| Dimension | Value |
|-----------|-------|
| Tightness | 9 |
| Aggression | 3 |
| Bluff frequency | 2 |
| Talkiness | 2 |
| Ego | 3 |
| Tilt volatility | 1 |
| Sensitivity to talk | 2 |

- Rarely speaks. When he does:
  - "Interesting."
  - "That's… a choice."
- To other AIs: almost nothing.
- When he wins big: "As expected."

### A2: "Vince" (Witty Reg)

| Dimension | Value |
|-----------|-------|
| Tightness | 6 |
| Aggression | 7 |
| Bluff frequency | 5 |
| Talkiness | 6 |
| Ego | 7 |
| Tilt volatility | 3 |
| Sensitivity to talk | 4 |

- Dry humor, references poker concepts ironically:
  - To A3 after a bad call: "Pot odds don't work like that, but I admire the confidence."
  - To human: "Bold raise. Let's see if bold pays rent."
  - To A1 after a fold: "Folding again? Shocking."

### A3: "Maverick" (Drunk Gambler)

| Dimension | Value |
|-----------|-------|
| Tightness | 3 |
| Aggression | 8 |
| Bluff frequency | 8 |
| Talkiness | 9 |
| Ego | 6 |
| Tilt volatility | 8 |
| Sensitivity to talk | 7 |

- Loud, loose, fun, volatile:
  - "LET'S GAMBLE."
  - To A1: "You gonna play a hand tonight or just watch?"
  - After losing big: "That's fine. I'll get it back. I always get it back."
  - After winning: "DRINKS ON ME. Wait, you're all robots."
- Tilts hard and fast; ranges blow wide open after bad beats.

### A4: "Ghost" (Stone Killer LAG)

| Dimension | Value |
|-----------|-------|
| Tightness | 5 |
| Aggression | 8 |
| Bluff frequency | 6 |
| Talkiness | 3 |
| Ego | 8 |
| Tilt volatility | 2 |
| Sensitivity to talk | 1 |

- Barely speaks. When he does, it cuts:
  - After a successful bluff: "You knew. You just couldn't pull the trigger."
  - To Maverick after a spew: "Thanks."
  - To human after a hero call: "Respect."
- Almost impossible to tilt. Ignores trash talk entirely.

***

## 11. AI‑to‑AI conversation system

### 11.1 When AIs talk to each other

- **Triggers:**
  - Showdown between two AIs (especially dramatic).
  - One AI folds to another's big bet.
  - An AI makes an unusual play (massive overbet, min‑raise, limp).
  - An AI is on a run (winning streak / losing streak).
  - Responding to another AI's comment.
  - Responding to human's trash talk directed at the table.

### 11.2 Talk generation

- Each AI's personality engine checks:
  - `talkiness` score vs random roll.
  - Event significance (bigger pot = more likely to trigger talk).
  - Relationship state:
    - If A3 just lost a big pot to A4, tension is high → more likely to exchange words.
- Output:
  - 1 line of dialogue, contextual to the event.
  - Directed at a specific seat or the table generally.

### 11.3 Example sequences

**After A3 (Maverick) loses all‑in to A4 (Ghost):**
- A3: "You had it the whole time? Unbelievable."
- A4: "Believe it."
- A2 (Vince): "That's what happens when you shove 9‑4 suited."
- A1 (Professor): *silence*

**After human bluffs A2 (Vince) off a big pot:**
- A2: "Fine. You got me. This time."
- A3: "Vince got owned! Love it!"
- A4: *silence*
- Human (optional): "Should've called, Vince."
- A2: "Keep that energy. You'll need it."

### 11.4 Talk pacing

- Max 2–3 messages per significant event.
- No talk during action (only between hands or after showdowns).
- Respects global talk level setting.

***

## 12. Session‑level feedback & self‑reinforcement

### 12.1 End‑of‑session screen

- **Result card:**
  - Stakes, hands played, duration, net BB.
- **Score bars (1–10):**
  - Aggression.
  - Tightness.
  - Position discipline.
  - Bluff control.
  - Value betting.
  - Showdown discipline.
  - Tilt control.
  - Preflop fundamentals.
  - Postflop fundamentals.
  - Overall quality.
- **Talk stats:**
  - Talk volume (1–10).
  - Talk spice (1–10).
  - Tilt events count.
- **Dollar Bill summary:**
  - 2–3 sentences.
  - Example: "2/5, down 42bb over 95 hands. You started solid, then Maverick got under your skin and you turned into a calling station. When you talk trash, make sure your cards back it up. Next time: fold river facing big bets when you only have one pair."
- **Next focus:**
  - 1–2 concrete goals.
  - Displayed on the next session's start screen.

### 12.2 History view

- Minimalist list of past sessions:
  - Date, stakes, net BB, overall quality score.
- Tap into any session → full scorecard + coach summary.
- Optional: trend chart showing scores over time per category.

### 12.3 Profile‑informed coaching

- Coach reads `PlayerProfile` at session start:
  - References trends: "Your bluff control has improved from 3 to 6 over five sessions. Don't backslide."
  - References tilt patterns: "You historically spew after losing two big pots in a row. I'm watching for that tonight."
  - References talk patterns: "You get chatty when you're losing. That's a tell. The AIs know it. I know it."

***

## 13. Tech stack & architecture

### 13.1 Stack

- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS.
- **State management:** Zustand or React context for game state.
- **Database:** SQLite via Prisma (local persistence).
  - **AI adapter:** abstraction layer for AWS Bedrock calls (Anthropic Claude).

### 13.2 Key API routes / server actions

- `/api/game/start` – initialize session, deal first hand.
- `/api/game/action` – apply human action, trigger AI responses, advance state.
- `/api/game/save` – snapshot `SessionState`.
- `/api/game/end` – finalize session, generate scores + summary.
- `/api/ai/opponent/:seatId` – get AI action + optional talk.
- `/api/ai/coach` – get coaching text for current spot.
- `/api/ai/chat` – process human chat message, return AI reactions.

### 13.3 AI provider abstraction

```typescript
interface LLMProvider {
  type: 'ollama' | 'bedrock';
  modelName: string;
  endpoint?: string;       // for ollama
  region?: string;          // for bedrock
}
```

Configurable via environment variables or settings UI.

### 13.4 Component tree (high‑level)

```
App
├── LobbyScreen (pre-session config + buy-ins)
├── GameScreen
│   ├── Table
│   │   ├── Board (community cards + pot)
│   │   ├── Seat × 5 (avatar, stack, action, talk bubble)
│   │   └── DealerButton
│   ├── ActionBar (fold, check/call, bet/raise, slider, chat input)
│   └── SidePanel (tabs)
│       ├── CoachTab (Dollar Bill)
│       ├── TalkTab (table chat feed)
│       └── SessionTab (live scores + focus)
├── SessionEndScreen (scorecard + summary)
├── HistoryScreen (past sessions list + trends)
└── SettingsDrawer (all config switches)
```

***

## 14. Data export

- **Export button** in History screen:
  - All `SessionSummary` objects as JSON or CSV.
  - Optional: full `ChatLog` per session as JSON.
- **Purpose:**
  - Offline analysis.
  - Future fine‑tuning experiments.
  - Sharing progress.

***

## 15. MVP scope checklist

v1 is "done" when:

- [ ] **Playable NLHE:** full hand cycle (deal → showdown) with legal betting, side pots, button rotation.
- [ ] **4 AI opponents:** visibly different strategies and personalities.
- [ ] **AI‑to‑AI talk:** AIs banter with each other, not just with the human.
- [ ] **Human table talk:** I can send messages; they affect AI behavior and my tilt score.
- [ ] **Dollar Bill coach:** suggests actions, tags decisions, generates session summary.
- [ ] **Configurable everything:** stakes, buy‑ins per seat, AI sliders, talk level, speed, backend.
- [ ] **Sleek minimal UI:** dark, flat, no skeuomorphism, responsive.
- [ ] **Session logging:** compact 10‑category scorecard + talk stats + coach summary.
- [ ] **Session memory:** `SessionState` supports save/resume; `PlayerProfile` persists across sessions.
- [ ] **Tilt detection:** behavioral + chat‑based, with coach escalation ladder.
- [x] **Model backends:** AWS Bedrock (Anthropic Claude) — Ollama optional.
- [ ] **History view:** list of past sessions with scores.

***

## 16. Future (v2+)

- Tournament mode with blind schedule.
- More AI archetypes (swappable roster).
- Voice output for AI talk and coach (TTS).
- Mobile‑optimized layout.
- Multiplayer (invite friends to replace AI seats).
- Supervised fine‑tuning on logged sessions.
- Self‑play: AI "me" vs AI opponents to test strategies.

***

That's the full PRD for **Nosebleed**.