/**
 * Deck and game constants.
 */

import type { Suit } from '../types/game'

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

export const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const

export const CARDS_PER_ZONE = 3

export const COMMITMENT_VALUES = [2, 3, 7, 10] as const

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4
