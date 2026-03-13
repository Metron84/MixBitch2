import { create } from 'zustand'
import type { BotPersona, GameState, Card } from '../types/game'
import {
  createInitialState,
  createInitialStateFromSetup,
  executePlay,
  collectPile,
  setPlayerReady,
  swapCards,
  swapCardsByIndices,
  applyBotSwapPhase,
  prepareBotsForSwap,
  playHiddenCard as playHiddenCardLogic,
  playRandomHiddenCard,
  moveHiddenToHandAndCollect,
} from '../lib/gameLogic'
import { isValidPlay } from '../lib/validation'
import { selectRandomBots } from '../data/botPersonas'
import { calculateBotMove, applyBotDecision, getValidPlays, canCollect as aiCanCollect, getStateViewForBot } from '../lib/ai'
import { useSessionStore } from './sessionStore'
import { sound } from '../lib/sound'

export interface MatchState {
  mode: 'single' | 'best-of-3' | 'best-of-5'
  humanScore: number
  botScore: number
  gamesInMatch: number
  matchTarget: number
}

export interface SetupState {
  playerCount: number
  opponents: BotPersona[]
}

export interface BotThinking {
  playerId: string
  playerName: string
  catchphrase?: string
}

export interface PlayError {
  cardIds: string[]
}

export interface CommitmentEffect {
  type: 'void' | 'reversal' | 'reset' | 'echo'
  playerName: string
  timestamp: number
}

export interface BotCatchphrase {
  playerId: string
  playerName: string
  text: string
  timestamp: number
}

const VALUE_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
function formatCardValue(value: number): string {
  return VALUE_LABELS[value] ?? String(value)
}

export interface PlayLogEntry {
  id: string
  playerName: string
  action: 'play' | 'collect'
  summary: string
}

let playLogId = 0
function nextPlayLogId(): string {
  return `log-${++playLogId}`
}

function formatPlaySummary(cards: Card[]): string {
  if (cards.length === 0) return '—'
  const v = cards[0].value
  const label = formatCardValue(v)
  const sameValue = cards.length > 1 && cards.every((c) => c.value === v)
  if (sameValue) return `${cards.length}× ${label}`
  if (cards.length === 1 && cards[0].commitmentType === 'void') return `${label} — void`
  if (cards.length === 1 && cards[0].commitmentType === 'reset') return `${label} — reset`
  if (cards.length === 1 && cards[0].commitmentType === 'reversal') return `${label} — reversal`
  if (cards.length === 1 && cards[0].commitmentType === 'echo') return `${label} — echo`
  if (cards.length === 1) return label
  return cards.map((c) => formatCardValue(c.value)).join(', ')
}

const MAX_PLAY_LOG_ENTRIES = 50

interface GameStore {
  state: GameState | null
  setup: SetupState | null
  lastSetup: SetupState | null
  matchState: MatchState | null
  tutorialOn: boolean
  botThinking: BotThinking | null
  toastMessage: string | null
  playError: PlayError | null
  /** Timestamp when a card play or collect last hit the felt (for visual feedback). */
  lastFeltHitAt: number | null
  /** Human collected and now has 7+ cards; auto-open hand selection modal. */
  justCollectedLargeHand: boolean
  /** When set, user has revealed one hidden card and must confirm Play (reveal-then-play flow). */
  pendingHiddenReveal: { playerId: string; cardIndex: number } | null
  lastCommitmentEffect: CommitmentEffect | null
  lastBotCatchphrase: BotCatchphrase | null
  playLog: PlayLogEntry[]
  startGame: (playerNames: string[]) => void
  setTutorialOn: (on: boolean) => void
  setPlayerCount: (n: number) => void
  setSetupOpponents: (opponents: BotPersona[]) => void
  randomizeOpponents: () => void
  setMatchMode: (mode: MatchState['mode']) => void
  startGameFromSetup: () => void
  playAgainSameOpponents: () => void
  changeOpponents: (playerCount: number) => void
  backToSetup: () => void
  swap: (playerId: string, fromZone: 'hand' | 'visible', cardIndex: number) => void
  swapPair: (handIndex: number, visibleIndex: number) => void
  ready: (playerId: string) => void
  playCards: (playerId: string, cards: Card[]) => void
  collect: (playerId: string) => void
  playHiddenRandom: (playerId: string) => void
  playHiddenCard: (playerId: string, cardIndex: number) => void
  canPlay: (playerId: string, cards: Card[]) => boolean
  canCollect: (playerId: string) => boolean
  getPlayableCardIds: (playerId: string) => string[]
  isCurrentPlayer: (playerId: string) => boolean
  applyBotMove: (playerId: string) => void
  setBotThinking: (t: BotThinking | null) => void
  setToast: (message: string) => void
  clearJustCollectedLargeHand: () => void
  setPendingHiddenReveal: (payload: { playerId: string; cardIndex: number } | null) => void
  recordMatchResult: (humanWon: boolean) => void
  isMatchOver: () => boolean
  matchWinner: () => 'human' | 'bot' | null
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null
let playErrorTimeout: ReturnType<typeof setTimeout> | null = null
let commitmentEffectTimeout: ReturnType<typeof setTimeout> | null = null
let botCatchphraseTimeout: ReturnType<typeof setTimeout> | null = null

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  setup: null,
  lastSetup: null,
  matchState: null,
  tutorialOn: false,
  botThinking: null,
  toastMessage: null,
  playError: null,
  lastFeltHitAt: null,
  justCollectedLargeHand: false,
  pendingHiddenReveal: null,
  lastCommitmentEffect: null,
  lastBotCatchphrase: null,
  playLog: [],

  setTutorialOn: (on) => set({ tutorialOn: on }),

  startGame: (playerNames) => {
    try {
      set({ state: createInitialState(playerNames), setup: null, playLog: [] })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  setPlayerCount: (n) => {
    const opponents = selectRandomBots(Math.max(1, n - 1))
    set({ setup: { playerCount: n, opponents } })
  },

  setSetupOpponents: (opponents) => {
    const { setup } = get()
    if (!setup) return
    set({ setup: { ...setup, opponents } })
  },

  randomizeOpponents: () => {
    const { setup } = get()
    if (!setup) return
    set({ setup: { ...setup, opponents: selectRandomBots(setup.opponents.length) } })
  },

  setMatchMode: (mode) => {
    const targetMap = { single: 1, 'best-of-3': 2, 'best-of-5': 3 } as const
    set({
      matchState: {
        mode,
        humanScore: 0,
        botScore: 0,
        gamesInMatch: 0,
        matchTarget: targetMap[mode],
      },
    })
  },

  startGameFromSetup: () => {
    try {
      const { setup, matchState } = get()
      if (!setup) return
      const sessionStats = useSessionStore.getState().getOverallStats()
      let state = createInitialStateFromSetup('You', setup.opponents, {
        gamesPlayed: sessionStats.gamesPlayed,
        gamesWon: sessionStats.gamesWon,
        currentStreak: sessionStats.currentStreak,
        bestStreak: sessionStats.bestStreak,
      })
      state = prepareBotsForSwap(state)
      const matchUpdate = matchState
        ? { matchState: { ...matchState, gamesInMatch: matchState.gamesInMatch + 1 } }
        : {}
      set({ state, setup: null, lastSetup: setup, playLog: [], ...matchUpdate })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  playAgainSameOpponents: () => {
    try {
      const { lastSetup, matchState } = get()
      if (!lastSetup) return
      const sessionStats = useSessionStore.getState().getOverallStats()
      let state = createInitialStateFromSetup('You', lastSetup.opponents, {
        gamesPlayed: sessionStats.gamesPlayed,
        gamesWon: sessionStats.gamesWon,
        currentStreak: sessionStats.currentStreak,
        bestStreak: sessionStats.bestStreak,
      })
      state = prepareBotsForSwap(state)
      const matchUpdate = matchState
        ? { matchState: { ...matchState, gamesInMatch: matchState.gamesInMatch + 1 } }
        : {}
      set({ state, playLog: [], ...matchUpdate })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  changeOpponents: (playerCount) => {
    try {
      set({ state: null, setup: { playerCount, opponents: selectRandomBots(Math.max(1, playerCount - 1)) }, playLog: [] })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  backToSetup: () => {
    if (toastTimeout) clearTimeout(toastTimeout)
    if (playErrorTimeout) clearTimeout(playErrorTimeout)
    if (commitmentEffectTimeout) clearTimeout(commitmentEffectTimeout)
    if (botCatchphraseTimeout) clearTimeout(botCatchphraseTimeout)
    toastTimeout = null
    playErrorTimeout = null
    commitmentEffectTimeout = null
    botCatchphraseTimeout = null
    set({ state: null, setup: null, matchState: null, toastMessage: null, playError: null, justCollectedLargeHand: false, lastCommitmentEffect: null, lastBotCatchphrase: null, playLog: [] })
  },

  swap: (playerId, fromZone, cardIndex) => {
    try {
      const { state } = get()
      if (!state) return
      set({ state: swapCards(state, playerId, fromZone, cardIndex) })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  swapPair: (handIndex, visibleIndex) => {
    try {
      const { state } = get()
      if (!state) return
      const humanId = state.players.find((p) => p.type === 'human')?.id ?? state.players[0]?.id
      if (!humanId) return
      set({ state: swapCardsByIndices(state, humanId, handIndex, visibleIndex) })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  ready: (playerId) => {
    try {
      const { state } = get()
      if (!state) return
      let next = setPlayerReady(state, playerId)
      const maxIterations = next.players.length * 2
      let iterations = 0
      while (next.phase === 'swap' && next.players.some((p) => !p.isReady) && iterations < maxIterations) {
        iterations++
        const notReady = next.players.find((p) => !p.isReady)
        if (!notReady) break
        next = applyBotSwapPhase(next, notReady.id)
        next = setPlayerReady(next, notReady.id)
      }
      // LOCK: Never leave the user stuck in swap after they clicked Ready. If we're still in swap,
      // force transition to play so they can always play or collect. (Requires human to be ready;
      // then mark all ready and set phase/currentPlayerIndex.) Applies to mobile, PWA, and desktop.
      const humanReady = next.players.find((p) => p.id === playerId)?.isReady === true
      if (next.phase === 'swap' && humanReady) {
        const firstIndex = Math.min(
          next.firstPlayerIndex ?? 0,
          Math.max(0, next.players.length - 1)
        )
        next = {
          ...next,
          phase: 'play',
          currentPlayerIndex: firstIndex,
          firstPlayerIndex: next.firstPlayerIndex ?? firstIndex,
          players: next.players.map((p) => ({ ...p, isReady: true })),
        }
      }
      set({ state: next })
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  clearJustCollectedLargeHand: () => set({ justCollectedLargeHand: false }),

  playCards: (playerId, cards) => {
    try {
      const { state } = get()
      if (!state) return
      if (!isValidPlay(state, playerId, cards)) {
        sound.play('error')
        const min = state.currentMinimum ?? 2
        get().setToast(`Play ${min}+ or collect the pile`)
        set({ playError: { cardIds: cards.map((c) => c.id) } })
        if (playErrorTimeout) clearTimeout(playErrorTimeout)
        playErrorTimeout = setTimeout(() => set({ playError: null }), 200)
        return
      }
      const player = state.players.find((p) => p.id === playerId)
      let next: GameState
      let playedCards: Card[] = cards
      if (player?.commitmentLevel === 'hidden' && player.hiddenCards.length > 0) {
        next = playRandomHiddenCard(state, playerId)
        if (next === state) {
          if (get().canCollect(playerId)) get().collect(playerId)
          else get().setToast("That card can't be played right now. Collect the pile instead.")
          return
        }
        playedCards = [next.commitmentPile[next.commitmentPile.length - 1]].filter(Boolean)
        sound.play('card_play')
      } else {
        next = executePlay(state, playerId, cards)
        if (cards.some((c) => c.isCommitmentCard)) sound.play('commitment_card')
        else sound.play('card_play')
      }
      const playerName = player?.name ?? 'Someone'
      const logEntry: PlayLogEntry = {
        id: nextPlayLogId(),
        playerName,
        action: 'play',
        summary: formatPlaySummary(playedCards),
      }
      const { playLog } = get()
      set({
        state: next,
        lastFeltHitAt: Date.now(),
        ...(playerId === 'player-0' && { justCollectedLargeHand: false }),
        playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
      })
      const commitType = playedCards[0]?.commitmentType
      if (commitType) {
        if (commitType === 'void') sound.play('void')
        else if (commitType === 'reversal') sound.play('reversal')
        else if (commitType === 'reset') sound.play('reset')
        if (commitmentEffectTimeout) clearTimeout(commitmentEffectTimeout)
        set({ lastCommitmentEffect: { type: commitType, playerName, timestamp: Date.now() } })
        commitmentEffectTimeout = setTimeout(() => set({ lastCommitmentEffect: null }), 1500)
      }
      if (next.phase === 'finished') sound.play('victory')
    } catch {
      if (playErrorTimeout) clearTimeout(playErrorTimeout)
      set({ playError: null })
      get().setToast('Something went wrong. Try again.')
    }
  },

  collect: (playerId) => {
    try {
      const { state } = get()
      if (!state) return
      const player = state.players.find((p) => p.id === playerId)
      const pileSize = state.commitmentPile.length
      const next = collectPile(state, playerId)
      const collector = next.players.find((p) => p.id === playerId)
      const largeHand = playerId === 'player-0' && collector && collector.handCards.length >= 7
      const logEntry: PlayLogEntry = {
        id: nextPlayLogId(),
        playerName: player?.name ?? 'Someone',
        action: 'collect',
        summary: `${pileSize} card${pileSize !== 1 ? 's' : ''}`,
      }
      const { playLog } = get()
      set({
        state: next,
        lastFeltHitAt: Date.now(),
        justCollectedLargeHand: largeHand,
        playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
      })
      sound.play('collect_pile')
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  playHiddenRandom: (playerId) => {
    try {
      const { state } = get()
      if (!state) return
      const next = playRandomHiddenCard(state, playerId)
      if (next === state) {
        if (get().canCollect(playerId)) get().collect(playerId)
        else get().setToast("No valid hidden play. Collect the pile instead.")
        return
      }
      const player = state.players.find((p) => p.id === playerId)
      const topCard = next.commitmentPile[next.commitmentPile.length - 1]
      const logEntry: PlayLogEntry = {
        id: nextPlayLogId(),
        playerName: player?.name ?? 'Someone',
        action: 'play',
        summary: topCard ? formatPlaySummary([topCard]) : '—',
      }
      const { playLog } = get()
      set({
        state: next,
        lastFeltHitAt: Date.now(),
        playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
      })
      sound.play('card_play')
      if (next.phase === 'finished') sound.play('victory')
    } catch {
      get().setToast('Something went wrong. Try again.')
    }
  },

  playHiddenCard: (playerId, cardIndex) => {
    try {
      const { state } = get()
      if (!state) return
      const next = playHiddenCardLogic(state, playerId, cardIndex)
      if (next === state) {
        if (get().canCollect(playerId)) {
          const nextState = moveHiddenToHandAndCollect(state, playerId, cardIndex)
          const player = state.players.find((p) => p.id === playerId)
          const pileSize = state.commitmentPile.length
          const logEntry: PlayLogEntry = {
            id: nextPlayLogId(),
            playerName: player?.name ?? 'Someone',
            action: 'collect',
            summary: `Collected (card to hand)${pileSize > 0 ? ` · ${pileSize} card${pileSize !== 1 ? 's' : ''}` : ''}`,
          }
          const { playLog } = get()
          set({
            state: nextState,
            lastFeltHitAt: Date.now(),
            pendingHiddenReveal: null,
            playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
          })
          sound.play('collect_pile')
        } else {
          set({ pendingHiddenReveal: null })
          get().setToast("That card can't be played right now. Play a higher value or collect the pile.")
        }
        return
      }
      const playedCard = state.players.find((p) => p.id === playerId)?.hiddenCards[cardIndex]
      const player = state.players.find((p) => p.id === playerId)
      const logEntry: PlayLogEntry = {
        id: nextPlayLogId(),
        playerName: player?.name ?? 'Someone',
        action: 'play',
        summary: playedCard ? formatPlaySummary([playedCard]) : '—',
      }
      const { playLog } = get()
      set({
        state: next,
        lastFeltHitAt: Date.now(),
        pendingHiddenReveal: null,
        playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
      })
      if (playedCard?.isCommitmentCard) sound.play('commitment_card')
      else sound.play('card_play')
      if (next.phase === 'finished') sound.play('victory')
    } catch {
      set({ pendingHiddenReveal: null })
      get().setToast('Something went wrong. Try again.')
    }
  },

  canPlay: (playerId, cards) => {
    const { state } = get()
    if (!state) return false
    return isValidPlay(state, playerId, cards)
  },

  canCollect: (playerId) => {
    const { state } = get()
    if (!state) return false
    return aiCanCollect(state, playerId)
  },

  getPlayableCardIds: (playerId) => {
    const { state } = get()
    if (!state) return []
    const plays = getValidPlays(state, playerId)
    const ids = new Set<string>()
    for (const p of plays) for (const c of p) ids.add(c.id)
    return [...ids]
  },

  isCurrentPlayer: (playerId) => {
    const { state } = get()
    if (!state) return false
    return state.players[state.currentPlayerIndex]?.id === playerId
  },

  applyBotMove: (playerId) => {
    try {
      const { state } = get()
      if (!state || state.phase !== 'play') return
      const current = state.players[state.currentPlayerIndex]
      if (!current || current.id !== playerId || current.type !== 'bot') return
      const view = getStateViewForBot(state, playerId)
      const decision = calculateBotMove(view, playerId)
      const next = applyBotDecision(state, playerId, decision)
      // Bot hidden play: get played card from new pile so activity list always shows it (no longer hidden).
      const playedCardForLog =
        decision.action === 'play' && !decision.cards?.length && next.commitmentPile.length > 0
          ? next.commitmentPile[next.commitmentPile.length - 1]
          : null
      const summary =
        decision.action === 'collect'
          ? `${state.commitmentPile.length} card${state.commitmentPile.length !== 1 ? 's' : ''}`
          : decision.cards?.length
            ? formatPlaySummary(decision.cards)
            : playedCardForLog
              ? formatPlaySummary([playedCardForLog])
              : decision.action === 'play' && next !== state
                ? '1 card'
                : '—'
      const logEntry: PlayLogEntry = {
        id: nextPlayLogId(),
        playerName: current.name,
        action: decision.action,
        summary,
      }
      const { playLog, botThinking: thinking } = get()
      const catchphraseText = decision.catchphrase ?? thinking?.catchphrase
      if (botCatchphraseTimeout) clearTimeout(botCatchphraseTimeout)
      const catchphraseUpdate: { lastBotCatchphrase: BotCatchphrase | null } = catchphraseText
        ? { lastBotCatchphrase: { playerId: current.id, playerName: current.name, text: catchphraseText, timestamp: Date.now() } }
        : { lastBotCatchphrase: null }
      set({
        state: next,
        botThinking: null,
        lastFeltHitAt: Date.now(),
        ...catchphraseUpdate,
        playLog: [...playLog, logEntry].slice(-MAX_PLAY_LOG_ENTRIES),
      })
      if (catchphraseText) {
        botCatchphraseTimeout = setTimeout(() => set({ lastBotCatchphrase: null }), 3000)
      }
      if (decision.action === 'collect') sound.play('collect_pile')
      else if (decision.action === 'play') {
        const card = decision.cards?.[0] ?? playedCardForLog
        if (card?.isCommitmentCard) sound.play('commitment_card')
        else sound.play('card_play')
        const commitType = card?.commitmentType
        if (commitType) {
          if (commitType === 'void') sound.play('void')
          else if (commitType === 'reversal') sound.play('reversal')
          else if (commitType === 'reset') sound.play('reset')
          if (commitmentEffectTimeout) clearTimeout(commitmentEffectTimeout)
          set({ lastCommitmentEffect: { type: commitType, playerName: current.name, timestamp: Date.now() } })
          commitmentEffectTimeout = setTimeout(() => set({ lastCommitmentEffect: null }), 1500)
        }
      }
      if (next.phase === 'finished') sound.play('victory')
    } catch (err) {
      set({ botThinking: null })
      get().setToast('Something went wrong. Try refreshing.')
    }
  },

  recordMatchResult: (humanWon) => {
    const { matchState } = get()
    if (!matchState) return
    set({
      matchState: {
        ...matchState,
        humanScore: matchState.humanScore + (humanWon ? 1 : 0),
        botScore: matchState.botScore + (humanWon ? 0 : 1),
      },
    })
  },

  isMatchOver: () => {
    const { matchState } = get()
    if (!matchState) return false
    return matchState.humanScore >= matchState.matchTarget || matchState.botScore >= matchState.matchTarget
  },

  matchWinner: () => {
    const { matchState } = get()
    if (!matchState) return null
    if (matchState.humanScore >= matchState.matchTarget) return 'human'
    if (matchState.botScore >= matchState.matchTarget) return 'bot'
    return null
  },

  setBotThinking: (t) => set({ botThinking: t }),

  setToast: (message) => {
    if (toastTimeout) clearTimeout(toastTimeout)
    set({ toastMessage: message })
    toastTimeout = setTimeout(() => set({ toastMessage: null }), 2000)
  },

  setPendingHiddenReveal: (payload) => set({ pendingHiddenReveal: payload }),
}))
