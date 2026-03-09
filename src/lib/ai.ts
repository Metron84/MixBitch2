import type { Card, GameState, Player } from '../types/game'
import {
  getArchetypeBehavior,
  getPlayMaxValue,
  getPlayMinValue,
  isSequencePlay,
} from './archetypeConfig'
import { executePlay, collectPile, playRandomHiddenCard, moveRandomHiddenToHandAndCollect } from './gameLogic'
import { isValidPlay } from './validation'

/** Returns a state view where only the acting bot sees their own cards; other players expose only visibleCards (hand and hidden masked). */
export function getStateViewForBot(state: GameState, botPlayerId: string): GameState {
  const players = state.players.map((p) =>
    p.id === botPlayerId
      ? p
      : ({ ...p, handCards: [] as readonly Card[], hiddenCards: [] as readonly Card[] } as Player)
  )
  return { ...state, players }
}

function getActiveCards(player: Player): readonly Card[] {
  if (player.commitmentLevel === 'hand') return player.handCards
  if (player.commitmentLevel === 'visible') return player.visibleCards
  return player.hiddenCards
}

/** All valid single-card and multi-card plays for the player. Same rules for human and bots; bots use pickPlayByArchetype to choose. */
export function getValidPlays(state: GameState, playerId: string): Card[][] {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || !player.canPlay || player.commitmentLevel === 'winner') return []

  const active = getActiveCards(player)
  const plays: Card[][] = []

  if (player.commitmentLevel === 'hidden') return []

  for (let i = 0; i < active.length; i++) {
    const single = [active[i]]
    if (isValidPlay(state, playerId, single)) plays.push(single)
  }

  const sameValueGroups = new Map<number, Card[]>()
  for (const c of active) {
    const arr = sameValueGroups.get(c.value) || []
    arr.push(c)
    sameValueGroups.set(c.value, arr)
  }
  for (const [, cards] of sameValueGroups) {
    if (cards.length >= 2 && isValidPlay(state, playerId, cards)) plays.push([...cards])
  }

  if (player.commitmentLevel === 'hand' && player.handCards.length === 3) {
    const sorted = [...player.handCards].sort((a, b) => a.value - b.value)
    if (sorted[1].value === sorted[0].value + 1 && sorted[2].value === sorted[1].value + 1) {
      if (isValidPlay(state, playerId, sorted)) plays.push([...sorted])
    }
  }

  if (player.commitmentLevel === 'visible' && player.visibleCards.length === 3) {
    const sorted = [...player.visibleCards].sort((a, b) => a.value - b.value)
    if (sorted[1].value === sorted[0].value + 1 && sorted[2].value === sorted[1].value + 1) {
      if (isValidPlay(state, playerId, sorted)) plays.push([...sorted])
    }
  }

  return plays
}

export function canCollect(state: GameState, playerId: string): boolean {
  const plays = getValidPlays(state, playerId)
  return plays.length === 0 && state.commitmentPile.length > 0
}

export interface BotDecision {
  action: 'play' | 'collect'
  cards?: Card[]
  catchphrase?: string
}

function pickPlayByArchetype(
  plays: Card[][],
  persona: NonNullable<Player['persona']>,
  behavior: ReturnType<typeof getArchetypeBehavior>
): Card[] {
  if (plays.length === 0) return []
  if (plays.length === 1) return plays[0]

  const adaptability = persona.adaptability
  const addRandomness =
    behavior.addIntuitiveRandomness && Math.random() < 0.35
  if (addRandomness && Math.random() < 0.5) {
    return plays[Math.floor(Math.random() * plays.length)]
  }

  const commitmentPlays = plays.filter((p) => p[0].isCommitmentCard)
  const regularPlays = plays.filter((p) => !p[0].isCommitmentCard)
  const pool = regularPlays.length > 0 ? regularPlays : plays
  const sequencePlays = plays.filter((p) => isSequencePlay(p))
  const multiCardPlays = plays.filter((p) => p.length >= 2)

  if (behavior.playPreference === 'commitment-first' && commitmentPlays.length > 0) {
    const target = commitmentPlays
    const pick =
      adaptability > 0.7 && Math.random() < adaptability
        ? target[Math.floor(Math.random() * target.length)]
        : target.reduce((a, b) =>
            getPlayMaxValue(a) >= getPlayMaxValue(b) ? a : b
          )
    return pick
  }

  if (
    behavior.playPreference === 'commitment-first' &&
    commitmentPlays.length === 0 &&
    pool.length > 0
  ) {
    const sorted = [...pool].sort(
      (a, b) => getPlayMaxValue(b) - getPlayMaxValue(a)
    )
    const top = sorted[0]
    const ties = sorted.filter(
      (p) => getPlayMaxValue(p) === getPlayMaxValue(top)
    )
    return ties[Math.floor(Math.random() * ties.length)]
  }

  if (
    (behavior.playPreference === 'sequence-first' ||
      behavior.preferMultiCard) &&
    (sequencePlays.length > 0 || multiCardPlays.length > 0)
  ) {
    const prefer = sequencePlays.length > 0 ? sequencePlays : multiCardPlays
    const pick =
      adaptability > 0.6 && Math.random() < adaptability * 0.5
        ? prefer[Math.floor(Math.random() * prefer.length)]
        : prefer[0]
    return pick
  }

  if (behavior.playPreference === 'highest') {
    const sorted = [...pool].sort(
      (a, b) => getPlayMaxValue(b) - getPlayMaxValue(a)
    )
    const top = sorted[0]
    const ties = sorted.filter(
      (p) => getPlayMaxValue(p) === getPlayMaxValue(top)
    )
    return ties[Math.floor(Math.random() * ties.length)]
  }

  if (behavior.playPreference === 'lowest') {
    const sorted = [...pool].sort(
      (a, b) => getPlayMinValue(a) - getPlayMinValue(b)
    )
    const top = sorted[0]
    const ties = sorted.filter(
      (p) => getPlayMinValue(p) === getPlayMinValue(top)
    )
    return ties[Math.floor(Math.random() * ties.length)]
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

function randomCatchphrase(persona: NonNullable<Player['persona']>): string | undefined {
  if (Math.random() >= 0.3) return undefined
  return persona.catchphrases[
    Math.floor(Math.random() * persona.catchphrases.length)
  ]
}

export function calculateBotMove(state: GameState, playerId: string): BotDecision {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return { action: 'collect' }
  if (player.commitmentLevel === 'hidden' && player.hiddenCards.length > 0) {
    const catchphrase = player.persona?.catchphrases[
      Math.floor(Math.random() * (player.persona?.catchphrases.length ?? 1))
    ]
    return { action: 'play', catchphrase }
  }
  if (!player.persona) {
    const plays = getValidPlays(state, playerId)
    if (plays.length > 0) return { action: 'play', cards: plays[0] }
    if (canCollect(state, playerId)) return { action: 'collect' }
    return { action: 'collect' }
  }

  const persona = player.persona
  const behavior = getArchetypeBehavior(persona.archetype)
  const pileSize = state.commitmentPile.length
  const validPlays = getValidPlays(state, playerId)
  const commitmentPlays = validPlays.filter((p) => p[0].isCommitmentCard)
  const regularPlays = validPlays.filter((p) => !p[0].isCommitmentCard)

  const baseThreshold = 10 - persona.riskTolerance * 5
  const commitmentThreshold = Math.max(
    3,
    Math.min(12,
      baseThreshold * behavior.commitmentBias
    )
  )
  const shouldUseCommitment =
    pileSize > commitmentThreshold && commitmentPlays.length > 0

  if (validPlays.length === 0) {
    const catchphrase =
      pileSize >= 8 && Math.random() < 0.5
        ? persona.catchphrases[
            Math.floor(Math.random() * persona.catchphrases.length)
          ]
        : undefined
    return { action: 'collect', catchphrase }
  }

  const collectProb =
    (1 - persona.aggressiveness) * behavior.collectBias
  const pileCollectThreshold = 12 + persona.aggressiveness * 6
  const wantsCollect =
    pileSize > pileCollectThreshold &&
    Math.random() < collectProb &&
    canCollect(state, playerId)

  if (wantsCollect) {
    return {
      action: 'collect',
      catchphrase: randomCatchphrase(persona),
    }
  }

  if (shouldUseCommitment && commitmentPlays.length > 0) {
    const cards = pickPlayByArchetype(
      commitmentPlays,
      persona,
      behavior
    )
    return {
      action: 'play',
      cards,
      catchphrase: randomCatchphrase(persona),
    }
  }

  const pool = regularPlays.length > 0 ? regularPlays : validPlays
  if (pool.length > 0) {
    const cards = pickPlayByArchetype(pool, persona, behavior)
    return {
      action: 'play',
      cards,
      catchphrase: randomCatchphrase(persona),
    }
  }

  if (commitmentPlays.length > 0) {
    const cards = pickPlayByArchetype(
      commitmentPlays,
      persona,
      behavior
    )
    return {
      action: 'play',
      cards,
      catchphrase: randomCatchphrase(persona),
    }
  }

  return { action: 'collect' }
}

export function applyBotDecision(
  state: GameState,
  playerId: string,
  decision: BotDecision
): GameState {
  if (decision.action === 'collect') return collectPile(state, playerId)
  const player = state.players.find((p) => p.id === playerId)
  // LOCK: Bot on hidden — if random hidden card was invalid, move that card to hand then collect so the game never freezes.
  if (player?.commitmentLevel === 'hidden' && player.hiddenCards.length > 0) {
    const afterHidden = playRandomHiddenCard(state, playerId)
    if (afterHidden !== state) return afterHidden
    if (canCollect(state, playerId)) return moveRandomHiddenToHandAndCollect(state, playerId)
  }
  if (decision.cards && decision.cards.length > 0) {
    const afterPlay = executePlay(state, playerId, decision.cards)
    // LOCK: If executePlay returned unchanged (shouldn't happen when cards from getValidPlays), fall through to collect.
    if (afterPlay !== state) return afterPlay
  }
  // Never return state unchanged (avoids freeze). If we can't play, try collect so the game advances.
  if (canCollect(state, playerId)) return collectPile(state, playerId)
  return state
}
