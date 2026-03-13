/**
 * Play validation. Match SPEC.md: valid plays, 7 restriction (4/5/6/7 or 2+ Aces), after-seven restriction, sequences.
 * Same rules apply to all players (human and bots); bots choose among valid plays via archetype (see ai.ts).
 */

import type { Card, GameState, Player } from '../types/game'
import { countAcesInPile, getTopCard, isConsecutive } from './cardUtils'

export function canPlay7(state: GameState): boolean {
  const top = getTopCard(state.commitmentPile)
  if (!top) return true
  const aceCount = countAcesInPile(state.commitmentPile)
  return (top.value >= 4 && top.value <= 7) || aceCount >= 2
}

/** When top card is 7, next player can play 4, 5, 6, or 7 (and multiples, sequences 4-5-6, 5-6-7) */
const VALID_AFTER_SEVEN = new Set([4, 5, 6, 7])

function isTopCardSeven(state: GameState): boolean {
  const top = getTopCard(state.commitmentPile)
  return top?.value === 7
}

function isValidAfterSeven(cardValue: number): boolean {
  return VALID_AFTER_SEVEN.has(cardValue)
}

function isSequenceAfterSeven(cards: readonly Card[]): boolean {
  if (cards.length !== 3 || !isConsecutive(cards)) return false
  const values = cards.map((c) => c.value).sort((a, b) => a - b)
  return (values[0] === 4 && values[1] === 5 && values[2] === 6) ||
    (values[0] === 5 && values[1] === 6 && values[2] === 7)
}

export function canPlayMultipleSameValue(cards: readonly Card[]): boolean {
  if (cards.length < 2) return false
  const v = cards[0].value
  return cards.every((c) => c.value === v)
}

/** Sequence valid when player has 3 cards in the active zone (hand or visible) and plays 3 consecutive. */
export function canPlaySequence(player: Player, cards: readonly Card[]): boolean {
  if (cards.length !== 3 || !isConsecutive(cards)) return false
  if (player.commitmentLevel === 'hand') return player.handCards.length === 3
  if (player.commitmentLevel === 'visible') return player.visibleCards.length === 3
  return false
}

export function getSequenceRequirement(cards: readonly Card[]): number {
  return Math.max(...cards.map((c) => c.value))
}

/**
 * Check if a single card is a valid play (ignoring 7 special rule for now).
 */
function isSingleCardValid(card: Card, currentMin: number | null): boolean {
  if (currentMin === null) return true
  return card.value >= currentMin
}

/**
 * Returns whether the given play (array of cards) is valid for the current state.
 * Does not mutate state.
 */
export function isValidPlay(
  state: GameState,
  playerId: string,
  cards: readonly Card[]
): boolean {
  if (cards.length === 0) return false

  const player = state.players.find((p) => p.id === playerId)
  if (!player || !player.canPlay) return false

  const min = state.currentMinimum
  const topIsSeven = isTopCardSeven(state)

  // When top card is 7: 2, 3, 10 are "ultimate joker" and always playable; 7 only if canPlay7; else 4, 5, 6, 7 (or multiples/sequences)
  if (topIsSeven) {
    if (cards.length === 1 && cards[0].isCommitmentCard) {
      if (cards[0].value === 7) return canPlay7(state)
      return true // 2, 3, 10 playable at any time
    }
    if (cards.length >= 2 && canPlayMultipleSameValue(cards) && cards.every((c) => c.isCommitmentCard)) {
      if (cards[0].value === 7) return canPlay7(state)
      return true // 2×2, 3×3, 10×10 when permitted
    }
    if (cards.length === 1) return isValidAfterSeven(cards[0].value)
    if (cards.length >= 2 && canPlayMultipleSameValue(cards)) return isValidAfterSeven(cards[0].value)
    if (cards.length === 3 && canPlaySequence(player, cards)) return isSequenceAfterSeven(cards)
    return false
  }

  // Commitment cards (when top is NOT 7)
  if (cards.length === 1 && cards[0].isCommitmentCard) {
    const top = getTopCard(state.commitmentPile)
    if (top?.value === 2) return true // 2 (reset) on top: any card including 7 can be played; no restrictions
    if (cards[0].value === 7) return canPlay7(state)
    return true // 2, 3, 10 always valid
  }

  // Multiple same-value commitment cards (when single is valid)
  if (cards.length >= 2 && canPlayMultipleSameValue(cards) && cards.every((c) => c.isCommitmentCard)) {
    const top = getTopCard(state.commitmentPile)
    if (top?.value === 2) return true // 7×7 etc. allowed after reset
    if (cards[0].value === 7) return canPlay7(state)
    return true // 2×2, 3×3, 10×10 when permitted
  }

  // Multiple same value
  if (cards.length >= 2 && canPlayMultipleSameValue(cards)) {
    return isSingleCardValid(cards[0], min)
  }

  // Sequence: exactly 3 in hand, 3 consecutive. 10 (void) allowed only when last (e.g. 8-9-10); 10-J-Q and 9-10-J disallowed
  if (cards.length === 3 && canPlaySequence(player, cards)) {
    if (cards.some((c) => c.commitmentType === 'void') && cards[2].commitmentType !== 'void') return false
    const req = getSequenceRequirement(cards)
    return min === null || req >= min
  }

  // Single non-commitment card
  if (cards.length === 1) {
    return isSingleCardValid(cards[0], min)
  }

  return false
}

/**
 * Get the new currentMinimum after a play (for non-void/non-reset).
 */
export function getMinimumAfterPlay(cards: readonly Card[]): number | null {
  if (cards.length === 0) return null
  if (cards[0].commitmentType === 'void' || cards[0].commitmentType === 'reset') return null
  if (cards[0].commitmentType === 'echo') return null // keep previous; caller handles
  if (cards.length === 3 && isConsecutive(cards)) return getSequenceRequirement(cards)
  return Math.max(...cards.map((c) => c.value))
}
