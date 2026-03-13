/**
 * Mix Bitch — Core types. Match SPEC.md.
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type CommitmentType = 'reset' | 'echo' | 'reversal' | 'void' // 2, 3, 7, 10

export type TurnDirection = 1 | -1 // 1 = clockwise, -1 = counter-clockwise

export type GamePhase = 'setup' | 'swap' | 'play' | 'finished'

export type CommitmentLevel = 'hand' | 'visible' | 'hidden' | 'winner'

export interface Card {
  readonly id: string
  readonly value: number // 2–14 (2–10, J=11, Q=12, K=13, A=14)
  readonly suit: Suit
  readonly isCommitmentCard: boolean
  readonly commitmentType?: CommitmentType
}

export interface BotPersona {
  readonly name: string
  readonly archetype: string
  readonly playStyle: string
  readonly riskTolerance: number
  readonly aggressiveness: number
  readonly adaptability: number
  readonly catchphrases: readonly string[]
  readonly description?: string
  /** Three short bullet points for the selector card. */
  readonly bullets?: readonly [string, string, string]
}

export interface Player {
  readonly id: string
  readonly name: string
  readonly type?: 'human' | 'bot'
  readonly persona?: BotPersona
  readonly handCards: readonly Card[]
  readonly visibleCards: readonly Card[]
  readonly hiddenCards: readonly Card[]
  readonly commitmentLevel: CommitmentLevel
  readonly canPlay: boolean
  readonly isReady?: boolean
}

export interface GameSettings {
  readonly playerCount: number
  readonly turnTimer?: number | null
  readonly gameMode?: 'casual' | 'blitz' | 'lightning'
  readonly soundEnabled?: boolean
}

export interface SessionStats {
  readonly gamesPlayed: number
  readonly gamesWon: number
  readonly currentStreak: number
  readonly bestStreak: number
}

export interface GameState {
  readonly id: string
  readonly players: readonly Player[]
  readonly currentPlayerIndex: number
  readonly turnDirection: TurnDirection
  readonly commitmentPile: readonly Card[]
  readonly drawPile: readonly Card[]
  readonly currentMinimum: number | null
  readonly phase: GamePhase
  /** Set when game ends: the one player who did not get out (last one left). */
  readonly loser?: string
  readonly winner?: string
  /** Order players got out: first to get out is first in array. Loser is not in this array. */
  readonly finishOrder?: readonly string[]
  readonly firstPlayerIndex?: number
  readonly gameSettings?: GameSettings
  readonly sessionStats?: SessionStats
}

export const COMMITMENT_VALUES = [2, 3, 7, 10] as const
export const COMMITMENT_MAP: Record<number, CommitmentType> = {
  2: 'reset',
  3: 'echo',
  7: 'reversal',
  10: 'void',
}
