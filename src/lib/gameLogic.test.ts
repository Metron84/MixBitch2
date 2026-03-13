import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  executePlay,
  collectPile,
  setPlayerReady,
} from './gameLogic'
import { createCard } from './cardUtils'
import { canPlay7, isValidPlay } from './validation'

describe('gameLogic', () => {
  it('deals 3 hidden, 3 visible, 3 hand per player', () => {
    const state = createInitialState(['Alice', 'Bob'])
    expect(state.players).toHaveLength(2)
    state.players.forEach((p) => {
      expect(p.handCards).toHaveLength(3)
      expect(p.visibleCards).toHaveLength(3)
      expect(p.hiddenCards).toHaveLength(3)
    })
    expect(state.phase).toBe('swap')
    expect(state.drawPile.length).toBe(52 - 2 * 9)
  })

  it('first to ready becomes first player, then phase becomes play', () => {
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-1')
    expect(state.firstPlayerIndex).toBe(1)
    expect(state.phase).toBe('swap')
    state = setPlayerReady(state, 'player-0')
    expect(state.phase).toBe('play')
    expect(state.currentPlayerIndex).toBe(1)
  })

  it('valid single play updates pile and minimum', () => {
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-0')
    state = setPlayerReady(state, 'player-1')
    const card = state.players[0].handCards.find(
      (c) => !c.isCommitmentCard
    ) ?? state.players[0].handCards[0]
    state = executePlay(state, 'player-0', [card])
    if (card.value === 10) {
      expect(state.commitmentPile).toHaveLength(0)
      expect(state.currentMinimum).toBe(null)
    } else if (card.value === 2 || card.value === 3) {
      expect(state.commitmentPile).toHaveLength(1)
      expect(state.currentMinimum).toBe(null)
    } else {
      expect(state.commitmentPile).toHaveLength(1)
      expect(state.currentMinimum).toBe(card.value)
    }
    expect(state.currentPlayerIndex).toBe(1)
  })

  it('draw happens after successful play when pile has cards', () => {
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-0')
    state = setPlayerReady(state, 'player-1')
    const handSizeBefore = state.players[0].handCards.length
    const card = state.players[0].handCards[0]
    state = executePlay(state, 'player-0', [card])
    const player0 = state.players.find((p) => p.id === 'player-0')!
    expect(player0.handCards.length).toBe(handSizeBefore - 1 + 1)
  })

  it('collect clears pile and sets minimum to null', () => {
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-0')
    state = setPlayerReady(state, 'player-1')
    const card = state.players[0].handCards[0]
    state = executePlay(state, 'player-0', [card])
    state = collectPile(state, 'player-1')
    expect(state.commitmentPile).toHaveLength(0)
    expect(state.currentMinimum).toBe(null)
  })

  it('10 (void) clears pile', () => {
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-0')
    state = setPlayerReady(state, 'player-1')
    const ten = state.players[0].handCards.find((c) => c.value === 10)
    if (!ten) return
    state = executePlay(state, 'player-0', [ten])
    expect(state.commitmentPile).toHaveLength(0)
    expect(state.currentMinimum).toBe(null)
  })

  it('4 consecutive same value clears pile and same player plays again', () => {
    const eight1 = createCard(8, 'hearts')
    const eight2 = createCard(8, 'diamonds')
    const eight3 = createCard(8, 'clubs')
    const eight4 = createCard(8, 'spades')
    let state = createInitialState(['A', 'B'])
    state = setPlayerReady(state, 'player-0')
    state = setPlayerReady(state, 'player-1')
    state = {
      ...state,
      commitmentPile: [eight1, eight2, eight3],
      currentMinimum: 8,
      players: [
        { ...state.players[0], handCards: [eight4] },
        state.players[1],
      ],
    }
    state = executePlay(state, 'player-0', [eight4])
    expect(state.commitmentPile).toHaveLength(0)
    expect(state.currentMinimum).toBe(null)
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('7 only valid on 4-7 or 2+ Aces', () => {
    const four = createCard(4, 'spades')
    const ace = createCard(14, 'hearts')
    const baseState = {
      id: 'g',
      players: [],
      currentPlayerIndex: 0,
      turnDirection: 1 as const,
      commitmentPile: [four],
      drawPile: [],
      currentMinimum: 4,
      phase: 'play' as const,
    }
    expect(canPlay7(baseState)).toBe(true)

    expect(canPlay7({ ...baseState, commitmentPile: [createCard(5, 'hearts')] })).toBe(true)
    expect(canPlay7({ ...baseState, commitmentPile: [createCard(6, 'diamonds')] })).toBe(true)

    expect(canPlay7({ ...baseState, commitmentPile: [createCard(7, 'clubs')] })).toBe(true)

    expect(canPlay7({ ...baseState, commitmentPile: [ace, ace] })).toBe(true)

    expect(canPlay7({ ...baseState, commitmentPile: [createCard(8, 'clubs')] })).toBe(false)
    expect(canPlay7({ ...baseState, commitmentPile: [createCard(9, 'clubs')] })).toBe(false)
    expect(canPlay7({ ...baseState, commitmentPile: [createCard(11, 'clubs')] })).toBe(false)
    expect(canPlay7({ ...baseState, commitmentPile: [createCard(13, 'clubs')] })).toBe(false)

    expect(canPlay7({ ...baseState, commitmentPile: [ace] })).toBe(false)
  })

  it('after-seven restriction: only 4/5/6/7 and commitment cards (2,3,10) are valid', () => {
    const seven = createCard(7, 'spades')
    const player = {
      id: 'player-0',
      name: 'A',
      handCards: [
        createCard(4, 'hearts'),
        createCard(8, 'diamonds'),
        createCard(10, 'clubs'),
      ],
      visibleCards: [],
      hiddenCards: [],
      commitmentLevel: 'hand' as const,
      canPlay: true,
      isReady: true,
    }
    const state = {
      id: 'g',
      players: [player],
      currentPlayerIndex: 0,
      turnDirection: 1 as const,
      commitmentPile: [seven],
      drawPile: [],
      currentMinimum: 7,
      phase: 'play' as const,
    }

    const four = createCard(4, 'hearts')
    const five = createCard(5, 'hearts')
    const six = createCard(6, 'hearts')
    const anotherSeven = createCard(7, 'hearts')
    expect(isValidPlay(state, 'player-0', [four])).toBe(true)
    expect(isValidPlay(state, 'player-0', [five])).toBe(true)
    expect(isValidPlay(state, 'player-0', [six])).toBe(true)
    expect(isValidPlay(state, 'player-0', [anotherSeven])).toBe(true)

    const two = createCard(2, 'hearts')
    const three = createCard(3, 'hearts')
    const ten = createCard(10, 'hearts')
    expect(isValidPlay(state, 'player-0', [two])).toBe(true)
    expect(isValidPlay(state, 'player-0', [three])).toBe(true)
    expect(isValidPlay(state, 'player-0', [ten])).toBe(true)

    const eight = createCard(8, 'diamonds')
    const nine = createCard(9, 'diamonds')
    const jack = createCard(11, 'diamonds')
    const queen = createCard(12, 'diamonds')
    const king = createCard(13, 'diamonds')
    const ace = createCard(14, 'diamonds')
    expect(isValidPlay(state, 'player-0', [eight])).toBe(false)
    expect(isValidPlay(state, 'player-0', [nine])).toBe(false)
    expect(isValidPlay(state, 'player-0', [jack])).toBe(false)
    expect(isValidPlay(state, 'player-0', [queen])).toBe(false)
    expect(isValidPlay(state, 'player-0', [king])).toBe(false)
    expect(isValidPlay(state, 'player-0', [ace])).toBe(false)
  })
})
