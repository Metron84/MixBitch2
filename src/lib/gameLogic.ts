/**
 * Mix Bitch — Pure game engine. Match SPEC.md.
 * All state updates are immutable.
 */

import type { BotPersona, Card, GameState, Player, SessionStats, TurnDirection } from '../types/game'
import { createDeck, getTopCard, shuffle } from './cardUtils'
import { CARDS_PER_ZONE, MIN_PLAYERS, MAX_PLAYERS } from './constants'
import { isValidPlay, getMinimumAfterPlay } from './validation'

// --- Helpers ---

function updatePlayer(
  state: GameState,
  playerId: string,
  updater: (p: Player) => Player
): GameState {
  const players = state.players.map((p) =>
    p.id === playerId ? updater(p) : p
  ) as readonly Player[]
  return { ...state, players }
}

/** Next player index skipping anyone who already got out (commitmentLevel === 'winner'). */
function getNextActivePlayerIndex(
  state: GameState,
  currentIndex: number,
  direction: TurnDirection
): number {
  const n = state.players.length
  for (let i = 1; i <= n; i++) {
    const next = ((currentIndex + direction * i) % n + n) % n
    if (state.players[next].commitmentLevel !== 'winner') return next
  }
  return currentIndex
}

// --- Deal ---

export function createInitialState(
  playerNames: string[],
  _seed?: () => number
): GameState {
  const n = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerNames.length))
  const names = playerNames.slice(0, n)

  let deck = shuffle(createDeck())
  const players: Player[] = names.map((name, i) => {
    const hidden = deck.splice(0, CARDS_PER_ZONE)
    const visible = deck.splice(0, CARDS_PER_ZONE)
    const hand = deck.splice(0, CARDS_PER_ZONE)
    return {
      id: `player-${i}`,
      name,
      handCards: hand,
      visibleCards: visible,
      hiddenCards: hidden,
      commitmentLevel: 'hand' as const,
      canPlay: true,
      isReady: false,
    }
  })

  return {
    id: `game-${Date.now()}`,
    players,
    currentPlayerIndex: 0,
    turnDirection: 1,
    commitmentPile: [],
    drawPile: deck,
    currentMinimum: null,
    phase: 'swap',
    firstPlayerIndex: undefined,
  }
}

/** Create game with one human + bot personas (for setup flow). */
export function createInitialStateFromSetup(
  humanName: string,
  botPersonas: BotPersona[],
  sessionStats?: SessionStats
): GameState {
  const n = 1 + botPersonas.length
  const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n))
  const bots = botPersonas.slice(0, count - 1)

  let deck = shuffle(createDeck())
  const players: Player[] = [
    {
      id: 'player-0',
      name: humanName,
      type: 'human',
      handCards: deck.splice(0, CARDS_PER_ZONE),
      visibleCards: deck.splice(0, CARDS_PER_ZONE),
      hiddenCards: deck.splice(0, CARDS_PER_ZONE),
      commitmentLevel: 'hand',
      canPlay: true,
      isReady: false,
    },
    ...bots.map((persona, i) => {
      const hidden = deck.splice(0, CARDS_PER_ZONE)
      const visible = deck.splice(0, CARDS_PER_ZONE)
      const hand = deck.splice(0, CARDS_PER_ZONE)
      return {
        id: `player-${i + 1}`,
        name: persona.name,
        type: 'bot' as const,
        persona,
        handCards: hand,
        visibleCards: visible,
        hiddenCards: hidden,
        commitmentLevel: 'hand' as const,
        canPlay: true,
        isReady: false,
      }
    }),
  ]

  return {
    id: `game-${Date.now()}`,
    players,
    currentPlayerIndex: 0,
    turnDirection: 1,
    commitmentPile: [],
    drawPile: deck,
    currentMinimum: null,
    phase: 'swap',
    firstPlayerIndex: undefined,
    gameSettings: { playerCount: count },
    sessionStats,
  }
}

// --- Swap ---

export function swapCards(
  state: GameState,
  playerId: string,
  fromZone: 'hand' | 'visible',
  cardIndex: number
): GameState {
  if (state.phase !== 'swap') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state

  const hand = [...player.handCards]
  const visible = [...player.visibleCards]

  if (fromZone === 'hand') {
    if (cardIndex < 0 || cardIndex >= hand.length || visible.length === 0) return state
    const [card] = hand.splice(cardIndex, 1)
    const vIdx = Math.floor(Math.random() * visible.length)
    const [vCard] = visible.splice(vIdx, 1)
    visible.push(card)
    hand.push(vCard)
  } else {
    if (cardIndex < 0 || cardIndex >= visible.length || hand.length === 0) return state
    const [card] = visible.splice(cardIndex, 1)
    const hIdx = Math.floor(Math.random() * hand.length)
    const [hCard] = hand.splice(hIdx, 1)
    hand.push(card)
    visible.push(hCard)
  }

  return updatePlayer(state, playerId, () => ({
    ...player,
    handCards: hand,
    visibleCards: visible,
  }))
}

/** Swap two specific cards: hand[handIndex] ↔ visible[visibleIndex]. Used for two-step human swap UI. */
export function swapCardsByIndices(
  state: GameState,
  playerId: string,
  handIndex: number,
  visibleIndex: number
): GameState {
  if (state.phase !== 'swap') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state

  const hand = [...player.handCards]
  const visible = [...player.visibleCards]
  if (
    handIndex < 0 || handIndex >= hand.length ||
    visibleIndex < 0 || visibleIndex >= visible.length
  ) return state

  const [hCard] = hand.splice(handIndex, 1)
  const [vCard] = visible.splice(visibleIndex, 1)
  hand.splice(handIndex, 0, vCard)
  visible.splice(visibleIndex, 0, hCard)

  return updatePlayer(state, playerId, () => ({
    ...player,
    handCards: hand,
    visibleCards: visible,
  }))
}

/** Run 0–3 random swaps for a bot so they participate in swap phase like the user. */
export function applyBotSwapPhase(state: GameState, playerId: string): GameState {
  if (state.phase !== 'swap') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state
  const numSwaps = Math.floor(Math.random() * 4)
  let next = state
  for (let i = 0; i < numSwaps; i++) {
    const p = next.players.find((x) => x.id === playerId)!
    const handLen = p.handCards.length
    const visibleLen = p.visibleCards.length
    if (handLen === 0 && visibleLen === 0) break
    const fromZone: 'hand' | 'visible' =
      handLen === 0 ? 'visible' : visibleLen === 0 ? 'hand' : Math.random() < 0.5 ? 'hand' : 'visible'
    const len = fromZone === 'hand' ? p.handCards.length : p.visibleCards.length
    if (len === 0) continue
    const cardIndex = Math.floor(Math.random() * len)
    next = swapCards(next, playerId, fromZone, cardIndex)
  }
  return next
}

/**
 * Pre-ready all bots at deal time: run their swap phase and set isReady true.
 * Does NOT set firstPlayerIndex (so the human sets it when they click Ready).
 * Use in startGameFromSetup / playAgainSameOpponents so Ready never freezes. All modes, all bot counts.
 */
export function prepareBotsForSwap(state: GameState): GameState {
  if (state.phase !== 'swap') return state
  let next = state
  for (const p of state.players) {
    if (p.type !== 'bot') continue
    next = applyBotSwapPhase(next, p.id)
    const bot = next.players.find((x) => x.id === p.id)
    if (bot) next = updatePlayer(next, p.id, () => ({ ...bot, isReady: true }))
  }
  return next
}

export function setPlayerReady(state: GameState, playerId: string): GameState {
  if (state.phase !== 'swap') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state
  if (player.visibleCards.length !== 3) return state

  const readyPlayer = { ...player, isReady: true }
  let newState = updatePlayer(state, playerId, () => readyPlayer)

  const alreadyHasFirst = newState.firstPlayerIndex !== undefined
  if (!alreadyHasFirst) {
    newState = { ...newState, firstPlayerIndex: newState.players.findIndex((p) => p.id === playerId) }
  }
  const allReady = newState.players.every((p) => p.isReady)
  if (allReady && newState.firstPlayerIndex !== undefined) {
    newState = {
      ...newState,
      phase: 'play',
      currentPlayerIndex: newState.firstPlayerIndex,
    }
  }
  return newState
}

// --- Play ---

/** True if the top 4 cards of the pile are the same value (acts like magic 10). */
function hasFourConsecutiveSameValueAtTop(pile: readonly Card[]): boolean {
  if (pile.length < 4) return false
  const top = pile[pile.length - 1].value
  return pile.slice(-4).every((c) => c.value === top)
}

export function executePlay(
  state: GameState,
  playerId: string,
  cards: readonly Card[]
): GameState {
  if (state.phase !== 'play') return state
  if (!isValidPlay(state, playerId, cards)) return state

  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state

  const card = cards[0]
  const lastCard = cards.length > 0 ? cards[cards.length - 1] : null
  let newPile = [...state.commitmentPile, ...cards]
  const isVoidEffect =
    card.commitmentType === 'void' || lastCard?.commitmentType === 'void' || hasFourConsecutiveSameValueAtTop(newPile)
  if (isVoidEffect) {
    newPile = []
  }

  let newMin: number | null = state.currentMinimum
  let newDirection: TurnDirection = state.turnDirection

  // Commitment effects (immediate)
  if (isVoidEffect) {
    newMin = null
  } else if (card.commitmentType === 'reset') {
    newMin = null
  } else if (card.commitmentType === 'echo') {
    // Echo repeats the previous card's effect: keep newMin as is (after reset, currentMinimum is null so it stays null).
    const top = getTopCard(state.commitmentPile)
    if (top?.value === 2) newMin = null // echo after reset: reset is echoed, minimum stays cleared
  } else if (card.commitmentType === 'reversal') {
    newDirection = (state.turnDirection === 1 ? -1 : 1) as TurnDirection
  } else {
    newMin = getMinimumAfterPlay(cards)
    if (newMin === null && state.currentMinimum !== null) newMin = state.currentMinimum
    if (newMin === null) newMin = Math.max(...cards.map((c) => c.value))
  }

  // Remove cards from player
  let newHand = [...player.handCards]
  let newVisible = [...player.visibleCards]
  let newHidden = [...player.hiddenCards]

  if (player.commitmentLevel === 'hand') {
    for (const c of cards) {
      const i = newHand.findIndex((x) => x.id === c.id)
      if (i >= 0) newHand.splice(i, 1)
    }
  } else if (player.commitmentLevel === 'visible') {
    for (const c of cards) {
      const i = newVisible.findIndex((x) => x.id === c.id)
      if (i >= 0) newVisible.splice(i, 1)
    }
  } else {
    for (const c of cards) {
      const i = newHidden.findIndex((x) => x.id === c.id)
      if (i >= 0) newHidden.splice(i, 1)
    }
  }

  let newLevel = player.commitmentLevel
  if (newLevel === 'hand' && newHand.length === 0) {
    if (state.drawPile.length === 0) newLevel = 'visible'
  }
  if (newLevel === 'visible' && newVisible.length === 0) newLevel = 'hidden'
  if (newLevel === 'hidden' && newHidden.length === 0) newLevel = 'winner'

  let newState: GameState = {
    ...state,
    commitmentPile: newPile,
    currentMinimum: newMin,
    turnDirection: newDirection,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            handCards: newHand,
            visibleCards: newVisible,
            hiddenCards: newHidden,
            commitmentLevel: newLevel,
          }
        : p
    ) as readonly Player[],
  }

  // Next player (magic 10 or 4-of-a-kind: same player goes again); skip players who already got out
  const currentIdx = newState.players.findIndex((p) => p.id === playerId)
  if (isVoidEffect) {
    const currentPlayer = newState.players[currentIdx]
    // Same player goes again only if they're still in (didn't just play their last card)
    if (currentPlayer?.commitmentLevel !== 'winner') {
      newState = { ...newState, currentPlayerIndex: currentIdx }
    } else {
      const nextIdx = getNextActivePlayerIndex(newState, currentIdx, newDirection)
      newState = { ...newState, currentPlayerIndex: nextIdx }
    }
  } else {
    const nextIdx = getNextActivePlayerIndex(newState, currentIdx, newDirection)
    newState = { ...newState, currentPlayerIndex: nextIdx }
  }

  // Draw until 3 in hand (or deck empty) when deck has cards; cap iterations to avoid any theoretical hang
  const maxDraws = 3
  let drawIterations = 0
  while (newState.drawPile.length > 0 && drawIterations < maxDraws) {
    drawIterations++
    const updatedPlayer = newState.players.find((p) => p.id === playerId)
    if (!updatedPlayer || updatedPlayer.handCards.length >= 3) break
    const drawPile = [...newState.drawPile]
    const drawn = drawPile.pop()
    if (!drawn) break
    newState = { ...newState, drawPile }
    newState = updatePlayer(newState, playerId, () => ({
      ...updatedPlayer,
      handCards: [...updatedPlayer.handCards, drawn],
    }))
  }

  // When this player just got out, record their finish order
  const existingOrder = state.finishOrder ?? []
  const newFinishOrder = newLevel === 'winner' ? [...existingOrder, playerId] : existingOrder

  // Game ends when everyone is done except one (that one is the loser)
  const stillIn = newState.players.filter((p) => p.commitmentLevel !== 'winner')
  if (stillIn.length === 1) {
    newState = { ...newState, phase: 'finished', loser: stillIn[0].id, finishOrder: newFinishOrder }
  } else {
    newState = { ...newState, finishOrder: newFinishOrder }
  }

  return newState
}

// --- Collect (failed play) ---

export function collectPile(state: GameState, playerId: string): GameState {
  if (state.phase !== 'play') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player) return state

  const collected = [...state.commitmentPile]
  let newHand = [...player.handCards]
  let newVisible = [...player.visibleCards]
  let newHidden = [...player.hiddenCards]
  let newLevel: Player['commitmentLevel'] = player.commitmentLevel

  if (player.commitmentLevel === 'hand') {
    newHand = [...newHand, ...collected]
  } else {
    newHand = [...newHand, ...collected]
    newLevel = 'hand'
  }

  let newState: GameState = {
    ...state,
    commitmentPile: [],
    currentMinimum: null,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, handCards: newHand, visibleCards: newVisible, hiddenCards: newHidden, commitmentLevel: newLevel }
        : p
    ) as readonly Player[],
  }

  const currentIdx = newState.players.findIndex((p) => p.id === playerId)
  const nextIdx = getNextActivePlayerIndex(newState, currentIdx, newState.turnDirection)
  newState = { ...newState, currentPlayerIndex: nextIdx }

  // After collect: if hand has fewer than 3 and deck has cards, draw exactly one
  if (newState.drawPile.length > 0) {
    const collector = newState.players.find((p) => p.id === playerId)
    if (collector && collector.handCards.length < 3) {
      const drawPile = [...newState.drawPile]
      const drawn = drawPile.pop()
      if (drawn) {
        newState = { ...newState, drawPile }
        newState = updatePlayer(newState, playerId, () => ({
          ...collector,
          handCards: [...collector.handCards, drawn],
        }))
      }
    }
  }

  return newState
}

/** Move the hidden card at cardIndex to hand, then collect the pile. Used when hidden play was invalid. */
export function moveHiddenToHandAndCollect(
  state: GameState,
  playerId: string,
  cardIndex: number
): GameState {
  if (state.phase !== 'play') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.commitmentLevel !== 'hidden' || player.hiddenCards.length === 0) return state
  if (cardIndex < 0 || cardIndex >= player.hiddenCards.length) return state

  const card = player.hiddenCards[cardIndex]
  const newHidden = player.hiddenCards.filter((_, i) => i !== cardIndex)
  const collected = [...state.commitmentPile]
  const newHand = [...player.handCards, card, ...collected]
  const newLevel: Player['commitmentLevel'] = 'hand'

  let newState: GameState = {
    ...state,
    commitmentPile: [],
    currentMinimum: null,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, handCards: newHand, visibleCards: player.visibleCards, hiddenCards: newHidden, commitmentLevel: newLevel }
        : p
    ) as readonly Player[],
  }

  const currentIdx = newState.players.findIndex((p) => p.id === playerId)
  const nextIdx = getNextActivePlayerIndex(newState, currentIdx, newState.turnDirection)
  newState = { ...newState, currentPlayerIndex: nextIdx }

  if (newState.drawPile.length > 0) {
    const collector = newState.players.find((p) => p.id === playerId)
    if (collector && collector.handCards.length < 3) {
      const drawPile = [...newState.drawPile]
      const drawn = drawPile.pop()
      if (drawn) {
        newState = { ...newState, drawPile }
        newState = updatePlayer(newState, playerId, () => ({
          ...collector,
          handCards: [...collector.handCards, drawn],
        }))
      }
    }
  }

  return newState
}

/** Pick a random hidden card, move it to hand, then collect. Used when bot's random hidden play was invalid. */
export function moveRandomHiddenToHandAndCollect(state: GameState, playerId: string): GameState {
  if (state.phase !== 'play') return state
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.commitmentLevel !== 'hidden' || player.hiddenCards.length === 0) return state
  const idx = Math.floor(Math.random() * player.hiddenCards.length)
  return moveHiddenToHandAndCollect(state, playerId, idx)
}

// --- Hidden: play by index or random ---

/** Play the hidden card at the given index (e.g. user clicked that position). */
export function playHiddenCard(state: GameState, playerId: string, cardIndex: number): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.commitmentLevel !== 'hidden' || player.hiddenCards.length === 0) {
    return state
  }
  if (cardIndex < 0 || cardIndex >= player.hiddenCards.length) return state
  const card = player.hiddenCards[cardIndex]
  return executePlay(state, playerId, [card])
}

export function playRandomHiddenCard(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.commitmentLevel !== 'hidden' || player.hiddenCards.length === 0) {
    return state
  }
  const idx = Math.floor(Math.random() * player.hiddenCards.length)
  return playHiddenCard(state, playerId, idx)
}
