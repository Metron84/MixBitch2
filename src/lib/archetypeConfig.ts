/**
 * Archetype-to-behavior mapping for all 20 bots.
 * Informed by Metron Ideas thinkers: Engelbart (augmentation), Christensen (jobs-to-be-done),
 * Kahneman (System 1/2), Damasio (emotion/value), Zhuangzi (perspective), Fellini (obsession).
 */

import type { Card } from '../types/game'

export type PlayPreference =
  | 'lowest'    // Conservative: prefer lowest valid card
  | 'highest'   // Aggressive: prefer highest valid card
  | 'sequence-first'  // Strategist/Artist: prefer sequences (J-Q-K)
  | 'commitment-first' // Gambler/Maverick: prefer commitment cards when valid
  | 'random'    // Unpredictable: no preference

export interface ArchetypeBehavior {
  playPreference: PlayPreference
  /** >1 = more likely to collect on big piles (Diplomat, Peacemaker). <1 = hold out (Gambler). */
  collectBias: number
  /** Adjusts commitment threshold. >1 = use commitment earlier. <1 = use later. */
  commitmentBias: number
  /** Intuitive: sometimes pick non-optimal play (System 1 / Kahneman). */
  addIntuitiveRandomness?: boolean
  /** Prefer multi-card plays over singles (Strategist, Artist). */
  preferMultiCard?: boolean
}

const ARCHETYPE_BEHAVIOR: Record<string, ArchetypeBehavior> = {
  'The Strategist': {
    playPreference: 'sequence-first',
    collectBias: 0.9,
    commitmentBias: 0.9,
    preferMultiCard: true,
  },
  'The Gambler': {
    playPreference: 'commitment-first',
    collectBias: 0.5,
    commitmentBias: 1.4,
  },
  'The Observer': {
    playPreference: 'lowest',
    collectBias: 1.0,
    commitmentBias: 1.0,
    // High adaptability modulates via persona.adaptability
  },
  'The Storyteller': {
    playPreference: 'sequence-first',
    collectBias: 0.85,
    commitmentBias: 1.2,
    addIntuitiveRandomness: true,
  },
  'The Mentor': {
    playPreference: 'lowest',
    collectBias: 1.0,
    commitmentBias: 1.0,
  },
  'The Competitor': {
    playPreference: 'highest',
    collectBias: 0.6,
    commitmentBias: 1.2,
  },
  'The Artist': {
    playPreference: 'sequence-first',
    collectBias: 0.9,
    commitmentBias: 1.0,
    preferMultiCard: true,
  },
  'The Joker': {
    playPreference: 'random',
    collectBias: 0.8,
    commitmentBias: 1.15,
    addIntuitiveRandomness: true,
  },
  'The Perfectionist': {
    playPreference: 'lowest',
    collectBias: 1.1,
    commitmentBias: 0.7,
  },
  'The Philosopher': {
    playPreference: 'lowest',
    collectBias: 1.05,
    commitmentBias: 0.9,
  },
  'The Newcomer': {
    playPreference: 'random',
    collectBias: 0.9,
    commitmentBias: 1.2,
    addIntuitiveRandomness: true,
  },
  'The Traditionalist': {
    playPreference: 'lowest',
    collectBias: 1.15,
    commitmentBias: 0.75,
  },
  'The Intuitive': {
    playPreference: 'lowest',
    collectBias: 0.9,
    commitmentBias: 1.0,
    addIntuitiveRandomness: true,
  },
  'The Diplomat': {
    playPreference: 'lowest',
    collectBias: 1.3,
    commitmentBias: 0.8,
  },
  'The Analyst': {
    playPreference: 'lowest',
    collectBias: 1.0,
    commitmentBias: 0.85,
  },
  'The Maverick': {
    playPreference: 'commitment-first',
    collectBias: 0.55,
    commitmentBias: 1.35,
    addIntuitiveRandomness: true,
  },
  'The Empath': {
    playPreference: 'lowest',
    collectBias: 1.1,
    commitmentBias: 0.95,
    // High adaptability
  },
  'The Peacemaker': {
    playPreference: 'lowest',
    collectBias: 1.35,
    commitmentBias: 0.7,
  },
  'The Challenger': {
    playPreference: 'highest',
    collectBias: 0.5,
    commitmentBias: 1.25,
  },
  'The Scholar': {
    playPreference: 'lowest',
    collectBias: 1.05,
    commitmentBias: 0.8,
  },
}

export function getArchetypeBehavior(archetype: string): ArchetypeBehavior {
  return (
    ARCHETYPE_BEHAVIOR[archetype] ?? {
      playPreference: 'lowest',
      collectBias: 1.0,
      commitmentBias: 1.0,
    }
  )
}

/** Max card value in a play (for highest preference). */
export function getPlayMaxValue(cards: readonly Card[]): number {
  return Math.max(...cards.map((c) => c.value))
}

/** Min card value in a play (for lowest preference). */
export function getPlayMinValue(cards: readonly Card[]): number {
  return Math.min(...cards.map((c) => c.value))
}

/** True if this is a 3-card sequence. */
export function isSequencePlay(cards: readonly Card[]): boolean {
  if (cards.length !== 3) return false
  const sorted = [...cards].sort((a, b) => a.value - b.value)
  return (
    sorted[1].value === sorted[0].value + 1 &&
    sorted[2].value === sorted[1].value + 1
  )
}
