// Canonical v1 archetype definitions.
// These are default base values — overridden per-seat via session config.

export interface ArchetypeSliders {
  // Strategy (1-10)
  tightness: number
  aggression: number
  bluffFrequency: number
  riskTolerance: number
  // Personality (1-10)
  talkiness: number
  ego: number
  tiltVolatility: number
  sensitivity: number
}

export interface Archetype {
  id: string
  name: string
  label: string
  description: string
  sliders: ArchetypeSliders
}

export const ARCHETYPES: Record<string, Archetype> = {
  honey: {
    id: 'honey',
    name: 'Honey',
    label: 'Southern Charm LAG',
    description: 'Warm and socially disarming. Loose-aggressive with wide ranges and frequent semi-bluffs.',
    sliders: {
      tightness: 3,
      aggression: 8,
      bluffFrequency: 7,
      riskTolerance: 8,
      talkiness: 9,
      ego: 6,
      tiltVolatility: 5,
      sensitivity: 7,
    },
  },
  professor: {
    id: 'professor',
    name: 'The Professor',
    label: 'TAG Brainiac',
    description: 'Tight-aggressive, math-forward. High line consistency and low range width.',
    sliders: {
      tightness: 8,
      aggression: 7,
      bluffFrequency: 3,
      riskTolerance: 4,
      talkiness: 4,
      ego: 8,
      tiltVolatility: 3,
      sensitivity: 2,
    },
  },
  bull: {
    id: 'bull',
    name: 'The Bull',
    label: 'Maniac Bully',
    description: 'High-frequency aggression. Pressure-heavy lines designed to force rushed decisions.',
    sliders: {
      tightness: 2,
      aggression: 10,
      bluffFrequency: 8,
      riskTolerance: 10,
      talkiness: 8,
      ego: 10,
      tiltVolatility: 8,
      sensitivity: 3,
    },
  },
  ghost: {
    id: 'ghost',
    name: 'The Ghost',
    label: 'Nit Assassin',
    description: 'Quiet, low-frequency participation. High showdown strength when entering major pots.',
    sliders: {
      tightness: 10,
      aggression: 5,
      bluffFrequency: 2,
      riskTolerance: 3,
      talkiness: 2,
      ego: 5,
      tiltVolatility: 2,
      sensitivity: 1,
    },
  },
  dealer: {
    id: 'dealer',
    name: 'The Dealer',
    label: 'Table Authority',
    description: 'Runs the table with attitude. Deterministic engine; LLM voice layer for personality.',
    sliders: {
      tightness: 5,
      aggression: 5,
      bluffFrequency: 0,
      riskTolerance: 5,
      talkiness: 7,
      ego: 6,
      tiltVolatility: 2,
      sensitivity: 2,
    },
  },
  dollarbill: {
    id: 'dollarbill',
    name: 'Dollar Bill',
    label: 'Coach',
    description: 'Real-time coaching. Invisible to all opponents.',
    sliders: {
      tightness: 0,
      aggression: 0,
      bluffFrequency: 0,
      riskTolerance: 0,
      talkiness: 8,
      ego: 9,
      tiltVolatility: 1,
      sensitivity: 1,
    },
  },
}

export const OPPONENT_ARCHETYPE_IDS = ['honey', 'professor', 'bull', 'ghost'] as const
export const DEFAULT_SEAT_LINEUP = ['honey', 'professor', 'bull', 'ghost'] as const
