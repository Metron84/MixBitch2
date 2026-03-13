/**
 * Card creation and deck utilities. Pure functions.
 */

import type { Card, Suit } from '../types/game'
import { COMMITMENT_MAP } from '../types/game'
import { SUITS, VALUES } from './constants'

let cardIdCounter = 0

function nextId(): string {
  return `card-${++cardIdCounter}`
}

export function createCard(value: number, suit: Suit): Card {
  const isCommitmentCard = value === 2 || value === 3 || value === 7 || value === 10
  return {
    id: nextId(),
    value,
    suit,
    isCommitmentCard,
    commitmentType: isCommitmentCard ? COMMITMENT_MAP[value as 2 | 3 | 7 | 10] : undefined,
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push(createCard(value, suit))
    }
  }
  return deck
}

export function shuffle<T>(array: readonly T[]): T[] {
  const out = [...array]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function isConsecutive(cards: readonly Card[]): boolean {
  if (cards.length < 2) return true
  const sorted = [...cards].sort((a, b) => a.value - b.value)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value !== sorted[i - 1].value + 1) return false
  }
  return true
}

export function countAcesInPile(pile: readonly Card[]): number {
  return pile.filter((c) => c.value === 14).length
}

export function getTopCard(pile: readonly Card[]): Card | null {
  return pile.length > 0 ? pile[pile.length - 1] : null
}

/**
 * Display order: lowest to highest, left to right.
 * Regular: 4,5,6,7,8,9,J,Q,K,A. Magic: 2,3,10 (highest).
 */
const DISPLAY_ORDER: Record<number, number> = {
  4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5,
  11: 6, 12: 7, 13: 8, 14: 9,
  2: 10, 3: 11, 10: 12,
}

export function cardDisplayOrder(value: number): number {
  return DISPLAY_ORDER[value] ?? value
}

export function sortCardsByDisplayOrder<T extends { value: number }>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => cardDisplayOrder(a.value) - cardDisplayOrder(b.value))
}
