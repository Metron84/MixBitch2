import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useSessionStore, bucketKey } from '../stores/sessionStore'
import { sound } from '../lib/sound'
import { isDark, setDark } from '../lib/darkMode'
import { useMediaQuery } from '../lib/useMediaQuery'
import { GameLog } from './GameLog'
import { PlayArea } from './PlayArea'
import { PlayerZone } from './PlayerZone'
import { Card } from './Card'
import { PlayerCountScreen } from './setup/PlayerCountScreen'
import { OpponentSelector } from './setup/OpponentSelector'
import { VictoryModal } from './ui/VictoryModal'
import { getGameStatsFromPlayLog } from '../lib/gameStats'
import { HowToPlayModal } from './ui/HowToPlayModal'
import { SequenceHint } from './ui/SequenceHint'
import { TutorialPanel } from './ui/TutorialPanel'
import { CommitmentEffect } from './ui/CommitmentEffect'
import { BotBubble } from './ui/BotBubble'

const HUMAN_PLAYER_ID = 'player-0'

type SizeVariant = 'base' | 'compact' | 'extra-compact'

function getLayoutConfig(playerCount: number): {
  sizeVariant: SizeVariant
  gapClass: string
} {
  if (playerCount <= 2) {
    return { sizeVariant: 'base', gapClass: 'gap-zone-base' }
  }
  if (playerCount <= 3) {
    return { sizeVariant: 'base', gapClass: 'gap-zone-base' }
  }
  if (playerCount <= 4) {
    return { sizeVariant: 'compact', gapClass: 'gap-zone-compact' }
  }
  return { sizeVariant: 'extra-compact', gapClass: 'gap-zone-compact' }
}

export function GameBoard() {
  const [selectedCount, setSelectedCount] = useState(3)
  const recordedGameId = useRef<string | null>(null)
  const recordedMatchGameId = useRef<string | null>(null)
  const state = useGameStore((s) => s.state)
  const setup = useGameStore((s) => s.setup)
  const recordWin = useSessionStore((s) => s.recordWin)
  const recordMatchComplete = useSessionStore((s) => s.recordMatchComplete)
  const recordGameResultForBots = useSessionStore((s) => s.recordGameResultForBots)
  const recordMatchResult = useGameStore((s) => s.recordMatchResult)
  const buckets = useSessionStore((s) => s.buckets)
  const getStatsForBucket = useSessionStore((s) => s.getStatsForBucket)
  const matchState = useGameStore((s) => s.matchState)

  const botTurnTriggered = useRef<string | null>(null)
  const botTurnRetryKey = useRef<string | null>(null)
  const mustPlayToastShown = useRef(false)
  const applyBotMove = useGameStore((s) => s.applyBotMove)
  const setBotThinking = useGameStore((s) => s.setBotThinking)
  const botThinking = useGameStore((s) => s.botThinking)
  const toastMessage = useGameStore((s) => s.toastMessage)
  const lastFeltHitAt = useGameStore((s) => s.lastFeltHitAt)
  const reduceMotion = useReducedMotion()
  const getPlayableCardIds = useGameStore((s) => s.getPlayableCardIds)
  const tutorialOn = useGameStore((s) => s.tutorialOn)
  const setTutorialOn = useGameStore((s) => s.setTutorialOn)
  const setToast = useGameStore((s) => s.setToast)
  const playLog = useGameStore((s) => s.playLog)
  const lastBotCatchphrase = useGameStore((s) => s.lastBotCatchphrase)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [soundOn, setSoundOn] = useState(() => sound.getEnabled())
  const [darkMode, setDarkMode] = useState(() => isDark())
  const [showNudge, setShowNudge] = useState(false)
  const skipToMyTurnInProgress = useRef(false)
  const [skippingToMyTurn, setSkippingToMyTurn] = useState(false)
  const [skippingToEnd, setSkippingToEnd] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useMediaQuery()

  const skipToMyTurn = useCallback(() => {
    if (skipToMyTurnInProgress.current || skippingToMyTurn || !state || state.phase !== 'play') return
    const current = state.players[state.currentPlayerIndex]
    if (!current || current.type !== 'bot') return
    const humanOut = state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.commitmentLevel === 'winner'
    skipToMyTurnInProgress.current = true
    setSkippingToMyTurn(true)
    if (humanOut) setSkippingToEnd(true)
    setShowNudge(false)
    setBotThinking(null)
    botTurnTriggered.current = null
    const delayMs = humanOut ? 0 : 80
    const run = () => {
      const st = useGameStore.getState().state
      if (!st || st.phase !== 'play') {
        skipToMyTurnInProgress.current = false
        setSkippingToMyTurn(false)
        setSkippingToEnd(false)
        return
      }
      const cur = st.players[st.currentPlayerIndex]
      if (!cur || cur.type !== 'bot') {
        skipToMyTurnInProgress.current = false
        setSkippingToMyTurn(false)
        setSkippingToEnd(false)
        return
      }
      applyBotMove(cur.id)
      setTimeout(run, delayMs)
    }
    run()
  }, [state, setBotThinking, applyBotMove, skippingToMyTurn])

  const nudgeBot = useCallback(() => {
    if (!state || state.phase !== 'play') return
    const current = state.players[state.currentPlayerIndex]
    if (!current || current.type !== 'bot') return
    setShowNudge(false)
    botTurnTriggered.current = null
    setBotThinking(null)
    const catchphrase = current.persona?.catchphrases.length
      ? current.persona.catchphrases[Math.floor(Math.random() * current.persona.catchphrases.length)]
      : undefined
    setBotThinking({ playerId: current.id, playerName: current.name, catchphrase })
    setTimeout(() => applyBotMove(current.id), 800)
  }, [state, setBotThinking, applyBotMove])

  useEffect(() => {
    if (state?.phase !== 'finished' || state.id === recordedGameId.current) return
    const humanGotOut = state.loser ? state.loser !== HUMAN_PLAYER_ID : state.winner === HUMAN_PLAYER_ID
    const matchMode = matchState?.mode ?? 'single'
    const playerCount = state.gameSettings?.playerCount ?? state.players.length
    const key = bucketKey(matchMode, playerCount)
    recordedGameId.current = state.id
    recordWin(humanGotOut, matchMode, playerCount)
    recordMatchResult(humanGotOut)
    const botNames = state.players.filter((p) => p.type === 'bot').map((p) => p.name)
    if (botNames.length > 0) recordGameResultForBots(key, humanGotOut, botNames)
    const isMatchOver = useGameStore.getState().isMatchOver
    if (isMatchOver() && state.id !== recordedMatchGameId.current) {
      recordedMatchGameId.current = state.id
      const matchWinner = useGameStore.getState().matchWinner()
      if (matchWinner !== null) {
        recordMatchComplete(matchWinner === 'human', matchMode, playerCount)
      }
    }
  }, [state?.id, state?.phase, state?.loser, state?.winner, state?.players, state?.gameSettings?.playerCount, matchState?.mode, recordWin, recordMatchResult, recordMatchComplete, recordGameResultForBots])

  useEffect(() => {
    if (!state || state.phase !== 'play') {
      mustPlayToastShown.current = false
      return
    }
    const current = state.players[state.currentPlayerIndex]
    if (!current || current.type !== 'bot') {
      botTurnTriggered.current = null
      return
    }
    const key = `${state.id}-${state.currentPlayerIndex}-${current.commitmentLevel}-${state.commitmentPile.length}-${state.currentMinimum ?? 'n'}-${playLog.length}`
    if (botTurnTriggered.current === key) {
      if (botThinking != null) return
      if (botTurnRetryKey.current === key) return
      botTurnRetryKey.current = key
      botTurnTriggered.current = null
      const retryId = current.id
      setTimeout(() => applyBotMove(retryId), 500)
      return
    }
    botTurnTriggered.current = key
    botTurnRetryKey.current = null
    const catchphrase = current.persona?.catchphrases.length
      ? current.persona.catchphrases[Math.floor(Math.random() * current.persona.catchphrases.length)]
      : undefined
    setShowNudge(false)
    setBotThinking({ playerId: current.id, playerName: current.name, catchphrase })
    const t = setTimeout(() => {
      applyBotMove(current.id)
    }, 800)
    const safety = setTimeout(() => {
      setShowNudge(true)
    }, 5000)
    return () => {
      // Only clear timeouts when leaving this bot turn. If we re-ran because setBotThinking
      // caused a re-render (same key), do not clear — so the 800ms applyBotMove still fires.
      if (botTurnTriggered.current !== key) {
        clearTimeout(t)
        clearTimeout(safety)
      }
    }
  }, [state?.id, state?.phase, state?.currentPlayerIndex, state?.players, state?.commitmentPile?.length, state?.currentMinimum, setBotThinking, applyBotMove, state?.players?.[state?.currentPlayerIndex ?? 0]?.commitmentLevel, playLog.length, botThinking])

  useEffect(() => {
    if (!state || state.phase !== 'play' || !tutorialOn) return
    const current = state.players[state.currentPlayerIndex]
    if (!current || current.id !== HUMAN_PLAYER_ID) {
      mustPlayToastShown.current = false
      return
    }
    const playableIds = getPlayableCardIds(HUMAN_PLAYER_ID)
    if (playableIds.length > 0 && !mustPlayToastShown.current) {
      mustPlayToastShown.current = true
      setToast('You have at least one card to play')
    }
  }, [state?.id, state?.phase, state?.currentPlayerIndex, tutorialOn, getPlayableCardIds, setToast])

  const setPlayerCount = useGameStore((s) => s.setPlayerCount)
  const setSetupOpponents = useGameStore((s) => s.setSetupOpponents)
  const startGameFromSetup = useGameStore((s) => s.startGameFromSetup)
  const playAgainSameOpponents = useGameStore((s) => s.playAgainSameOpponents)
  const backToSetup = useGameStore((s) => s.backToSetup)
  const setMatchMode = useGameStore((s) => s.setMatchMode)
  const isMatchOver = useGameStore((s) => s.isMatchOver)
  const swapPair = useGameStore((s) => s.swapPair)
  const ready = useGameStore((s) => s.ready)
  const playCards = useGameStore((s) => s.playCards)
  const collect = useGameStore((s) => s.collect)
  const playHiddenCard = useGameStore((s) => s.playHiddenCard)
  const canPlay = useGameStore((s) => s.canPlay)
  const canCollect = useGameStore((s) => s.canCollect)
  const isCurrentPlayer = useGameStore((s) => s.isCurrentPlayer)
  const pendingHiddenReveal = useGameStore((s) => s.pendingHiddenReveal)

  if (!state && !setup) {
    return (
      <PlayerCountScreen
        selectedCount={selectedCount}
        onSelectCount={setSelectedCount}
        onStart={(matchMode) => {
          setMatchMode(matchMode)
          setPlayerCount(selectedCount)
        }}
      />
    )
  }

  if (!state && setup) {
    return (
      <OpponentSelector
        playerCount={setup.playerCount}
        opponents={setup.opponents}
        onSetOpponents={setSetupOpponents}
        onLetsPlay={startGameFromSetup}
        onBack={backToSetup}
      />
    )
  }

  if (!state) return null

  if (state.phase === 'finished' && (state.loser ?? state.winner)) {
    const humanGotOut = state.loser ? state.loser !== HUMAN_PLAYER_ID : state.winner === HUMAN_PLAYER_ID
    const matchMode = matchState?.mode ?? 'single'
    const playerCount = state.gameSettings?.playerCount ?? state.players.length
    const bucketKeyForGame = bucketKey(matchMode, playerCount)
    const sessionStats = buckets[bucketKeyForGame] ?? getStatsForBucket(matchMode, playerCount)
    const loserPlayer = state.players.find((p) => p.id === (state.loser ?? state.winner))
    const loserName = loserPlayer?.name ?? 'Someone'
    const opponentName = humanGotOut
      ? (state.players.find((p) => p.id !== HUMAN_PLAYER_ID)?.name ?? 'Bot')
      : (loserPlayer?.name ?? 'Bot')
    const matchOver = isMatchOver()
    const playerNames = state.players.map((p) => p.name)
    const humanName = state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.name ?? 'You'
    const gameStats = getGameStatsFromPlayLog(playLog, humanName)
    const finishOrder = state.finishOrder ?? []
    const players = state.players.map((p) => ({ id: p.id, name: p.name }))
    return (
      <VictoryModal
        loserName={loserName}
        loserId={state.loser ?? state.winner ?? ''}
        humanPlayerId={HUMAN_PLAYER_ID}
        humanGotOut={humanGotOut}
        opponentName={opponentName}
        stats={sessionStats}
        playerNames={playerNames}
        players={players}
        finishOrder={finishOrder}
        gameStats={gameStats}
        onPlayAgain={matchOver ? backToSetup : playAgainSameOpponents}
        onChangeOpponents={() => useGameStore.getState().changeOpponents(state.gameSettings?.playerCount ?? 2)}
        onBackToSetup={backToSetup}
        matchState={matchState}
        isMatchOver={matchOver}
      />
    )
  }

  const humanPlayer = state.players.find((p) => p.id === HUMAN_PLAYER_ID)
  if (!humanPlayer) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-play-area text-white">
        <p className="text-lg font-medium">Invalid game state.</p>
        <button
          type="button"
          onClick={backToSetup}
          className="mt-4 px-4 py-2 rounded-xl bg-cedar text-white font-semibold hover:opacity-90"
        >
          Back to setup
        </button>
      </div>
    )
  }

  const n = state.players.length
  const layout = getLayoutConfig(n)
  const zoneWidth =
    n <= 2 ? 'min-w-[220px] sm:min-w-[200px] max-w-[260px] w-56' : n <= 3 ? 'min-w-[200px] sm:min-w-[180px] max-w-[240px] w-52' : n <= 4 ? 'min-w-[190px] sm:min-w-[170px] max-w-[220px] w-48' : 'min-w-[180px] sm:min-w-[160px] max-w-[200px] w-44'
  const humanZoneWidth = n <= 2 ? 'min-w-[280px] w-full max-w-[720px]' : n <= 3 ? 'min-w-[260px] w-full max-w-[680px]' : n <= 4 ? 'min-w-[240px] w-full max-w-[640px]' : 'min-w-[220px] w-full max-w-[600px]'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-play-area">
      <CommitmentEffect />
      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 rounded-xl bg-felt border-2 border-cedar/50 px-4 py-2 shadow-xl text-cedar-dark text-base top-20 sm:top-auto sm:bottom-4">
          {toastMessage}
        </div>
      )}
      {botThinking && (
        <div className={`fixed inset-0 z-40 flex items-center justify-center bg-black/50 ${showNudge ? '' : 'pointer-events-none'}`}>
          <div className="rounded-xl bg-felt border-2 border-cedar/50 px-6 py-4 shadow-xl text-center">
            <p className="text-cedar-dark font-medium text-base">{botThinking.playerName} is thinking...</p>
            {showNudge && (
              <button
                type="button"
                onClick={nudgeBot}
                className="mt-3 px-4 py-2 min-h-[44px] rounded-lg bg-cedar text-white font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt shadow-md"
              >
                Nudge {botThinking.playerName}
              </button>
            )}
          </div>
        </div>
      )}
      {skippingToEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600/95" aria-live="polite">
          <p className="text-white text-2xl sm:text-3xl font-bold">Ending game…</p>
        </div>
      )}
      <header className="shrink-0 flex justify-between items-center px-4 py-3 sm:py-2 gap-2 bg-black/20 backdrop-blur-sm border-b border-cedar/30 flex-nowrap sm:flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="border-b-2 border-lebanon-red pb-0.5 shrink-0">
            <h1 className="text-xl font-bold text-white font-heading drop-shadow-md">Mix Bitch</h1>
          </div>
          {matchState && matchState.mode !== 'single' && (
            <span className="rounded-lg bg-white/10 border border-cedar/30 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white/90 shrink-0 truncate max-w-[120px] sm:max-w-none">
              Match: You {matchState.humanScore} – {matchState.botScore} Bot
            </span>
          )}
        </div>
        {/* Desktop: all controls visible */}
        <div className="hidden sm:flex items-center gap-3 text-white/95 flex-wrap">
          {state.phase === 'play' && state.players[state.currentPlayerIndex]?.type === 'bot' && state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.commitmentLevel !== 'winner' && (
            <button
              type="button"
              onClick={skipToMyTurn}
              disabled={skippingToMyTurn}
              className="text-base font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark rounded disabled:opacity-60"
              aria-label="Skip to my turn"
            >
              {skippingToMyTurn ? 'Skipping…' : 'Skip to my turn'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="text-base font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark rounded"
            aria-label="How to play"
          >
            How to play
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('End this game? This round won\'t be saved.')) backToSetup()
            }}
            className="text-base font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark rounded text-white/90"
            aria-label="End game"
          >
            End game
          </button>
          <label className="flex items-center gap-2 text-base cursor-pointer">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => {
                const v = e.target.checked
                setSoundOn(v)
                sound.setEnabled(v)
              }}
              className="rounded border-cedar/50"
              aria-label="Toggle sound"
            />
            Sound
          </label>
          <label className="flex items-center gap-2 text-white/80 text-base cursor-pointer">
            <input
              type="checkbox"
              checked={tutorialOn}
              onChange={(e) => setTutorialOn(e.target.checked)}
              className="rounded border-cedar/50"
              aria-label="Toggle tutorial hints"
            />
            Tutorial
          </label>
          <button
            type="button"
            onClick={() => {
              const next = !darkMode
              setDarkMode(next)
              setDark(next)
            }}
            className="text-base font-medium hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark rounded px-1"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '\u2600' : '\uD83C\uDF19'}
          </button>
          <span className="text-white/80 text-base capitalize">{state.phase}</span>
        </div>
        {/* Mobile: primary action + menu */}
        <div className="flex sm:hidden items-center gap-2">
          {state.phase === 'play' && state.players[state.currentPlayerIndex]?.type === 'bot' && state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.commitmentLevel !== 'winner' && (
            <button
              type="button"
              onClick={skipToMyTurn}
              disabled={skippingToMyTurn}
              className="min-h-[44px] px-3 py-2 text-sm font-medium text-white hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark disabled:opacity-60"
              aria-label="Skip to my turn"
            >
              {skippingToMyTurn ? 'Skipping…' : 'Skip'}
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cedar-dark"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              ⋯
            </button>
            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" aria-hidden onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-56 rounded-xl bg-felt border-2 border-cedar/50 shadow-xl py-2 text-cedar-dark">
                  <button
                    type="button"
                    onClick={() => { setShowHowToPlay(true); setMobileMenuOpen(false) }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-sm font-medium hover:bg-cedar/10"
                  >
                    How to play
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('End this game? This round won\'t be saved.')) { backToSetup(); setMobileMenuOpen(false) }
                    }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-sm font-medium hover:bg-cedar/10"
                  >
                    End game
                  </button>
                  <label className="flex items-center gap-2 px-4 py-3 min-h-[44px] cursor-pointer hover:bg-cedar/10">
                    <input
                      type="checkbox"
                      checked={soundOn}
                      onChange={(e) => { setSoundOn(e.target.checked); sound.setEnabled(e.target.checked) }}
                      className="rounded border-cedar/50"
                      aria-label="Toggle sound"
                    />
                    <span className="text-sm font-medium">Sound</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 min-h-[44px] cursor-pointer hover:bg-cedar/10">
                    <input
                      type="checkbox"
                      checked={tutorialOn}
                      onChange={(e) => setTutorialOn(e.target.checked)}
                      className="rounded border-cedar/50"
                      aria-label="Toggle tutorial"
                    />
                    <span className="text-sm font-medium">Tutorial</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !darkMode
                      setDarkMode(next)
                      setDark(next)
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-sm font-medium hover:bg-cedar/10 flex items-center gap-2"
                  >
                    <span aria-hidden>{darkMode ? '\u2600' : '\uD83C\uDF19'}</span>
                    {darkMode ? 'Light mode' : 'Dark mode'}
                  </button>
                  <div className="px-4 py-2 text-xs text-cedar-dark/80 border-t border-cedar/30 mt-1 pt-2">
                    Phase: <span className="capitalize font-medium">{state.phase}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden relative w-full rounded-none table-glow p-2 sm:p-0 ${layout.gapClass}`}
      >
        {/* Felt hit: brief flash when a card play or collect lands */}
        {lastFeltHitAt != null && !reduceMotion && (
          <motion.div
            key={lastFeltHitAt}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-white/20 z-10"
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            aria-hidden
          />
        )}

        {isMobile ? (
          <>
            {/* Mobile: Bots → Center → Activity (collapsible) → Human (scrollable cards + fixed action bar) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
              {/* 1. Bots: always visible, compact, 2-col, capped height */}
              {lastBotCatchphrase && (
                <div className="w-full flex justify-center shrink-0 px-2 pt-1">
                  <BotBubble
                    playerName={lastBotCatchphrase.playerName}
                    text={lastBotCatchphrase.text}
                    timestamp={lastBotCatchphrase.timestamp}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 px-2 pt-2 pb-1 justify-center max-h-[28vh] min-h-0 overflow-y-auto overflow-x-hidden">
                {state.players
                  .filter((p) => p.id !== HUMAN_PLAYER_ID)
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-xl bg-felt border-2 shadow-lg overflow-hidden min-w-0 min-h-0 ${
                        isCurrentPlayer(p.id) ? 'ring-2 ring-cedar border-cedar/60' : 'border-cedar/30'
                      }`}
                    >
                      <PlayerZone
                        player={p}
                        isCurrent={isCurrentPlayer(p.id)}
                        isYou={false}
                        compact={n >= 4}
                        extraCompact={n >= 5}
                        sizeVariant={layout.sizeVariant}
                        phase={state.phase}
                        onReady={undefined}
                        onSwapPair={undefined}
                        onPlay={undefined}
                        onCollect={undefined}
                        onPlayHiddenCard={undefined}
                        validPlay={undefined}
                        playableCardIds={undefined}
                      />
                    </div>
                  ))}
              </div>
              {/* 2. Center: compact block (deck, pile, PlayArea), clear spacing below bots */}
              <div className="flex flex-col items-center justify-center gap-2 px-2 py-3 shrink-0">
                <div className="flex gap-2" aria-label="Deck and pile counts">
                  <span className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                    Deck: {state.drawPile.length}
                  </span>
                  <span className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                    Pile: {state.commitmentPile.length}
                  </span>
                </div>
                {state.phase === 'play' &&
                  pendingHiddenReveal?.playerId === HUMAN_PLAYER_ID &&
                  (() => {
                    const human = state.players.find((p) => p.id === HUMAN_PLAYER_ID)
                    const card = human?.hiddenCards[pendingHiddenReveal.cardIndex] ?? null
                    return card ? (
                      <div className="shrink-0 flex flex-col items-center gap-1.5 rounded-xl bg-cedar-dark/90 border-2 border-cedar/50 px-4 py-3">
                        <span className="text-white text-sm font-medium">Playing this card</span>
                        <Card card={card} sizeVariant={layout.sizeVariant} />
                      </div>
                    ) : null
                  })()}
                <div className="flex items-center justify-center">
                  <PlayArea sizeVariant={layout.sizeVariant} isBotThinking={!!botThinking} />
                </div>
              </div>
              {/* 3. Activity log: between center and human zone, collapsible, default collapsed */}
              {state.phase === 'play' && (
                <div className="px-2 pb-2 shrink-0">
                  <GameLog embedded defaultCollapsed />
                </div>
              )}
              {tutorialOn && (
                <div className="px-3 pb-2 max-w-md mx-auto w-full shrink-0">
                  <TutorialPanel
                    lastLogEntry={playLog.length > 0 ? playLog[playLog.length - 1] : null}
                    currentMin={state.currentMinimum}
                    pileLength={state.commitmentPile.length}
                    deckLength={state.drawPile.length}
                    playableCount={getPlayableCardIds(HUMAN_PLAYER_ID).length}
                    canCollect={canCollect(HUMAN_PLAYER_ID)}
                    isYourTurn={isCurrentPlayer(HUMAN_PLAYER_ID)}
                    commitmentLevel={humanPlayer.commitmentLevel}
                  />
                </div>
              )}
              {state.phase === 'play' && (
                <div className="px-3 pb-4 shrink-0">
                  <SequenceHint handCards={humanPlayer.handCards} />
                </div>
              )}
            </div>
            <div className="shrink-0 flex justify-center px-2 py-2 w-full bg-play-area border-t border-cedar/30">
              {state.phase === 'play' &&
              state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.commitmentLevel === 'winner' &&
              state.players[state.currentPlayerIndex]?.type === 'bot' ? (
                <div className={`${humanZoneWidth} flex items-center justify-center rounded-xl border-4 border-red-600 bg-red-600/20 min-h-[100px]`}>
                  <button
                    type="button"
                    onClick={skipToMyTurn}
                    disabled={skippingToMyTurn}
                    className="text-red-600 font-bold text-xl px-6 py-3 min-h-[44px] rounded-xl bg-white border-4 border-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400 disabled:opacity-60 shadow-lg"
                    aria-label="Skip to end"
                  >
                    {skippingToMyTurn ? 'Skipping…' : 'Skip to end'}
                  </button>
                </div>
              ) : (
                <div className={`${humanZoneWidth} max-h-[45vh] overflow-y-auto`}>
                  <PlayerZone
                    player={humanPlayer}
                    isCurrent={isCurrentPlayer(HUMAN_PLAYER_ID)}
                    isYou
                    compact={n >= 4}
                    extraCompact={n >= 5}
                    sizeVariant={layout.sizeVariant}
                    phase={state.phase}
                    onReady={() => ready(HUMAN_PLAYER_ID)}
                    onSwapPair={(handIndex, visibleIndex) => swapPair(handIndex, visibleIndex)}
                    onPlay={(cards) => playCards(HUMAN_PLAYER_ID, cards)}
                    onCollect={canCollect(HUMAN_PLAYER_ID) ? () => collect(HUMAN_PLAYER_ID) : undefined}
                    onPlayHiddenCard={
                      humanPlayer.commitmentLevel === 'hidden'
                        ? (index) => playHiddenCard(HUMAN_PLAYER_ID, index)
                        : undefined
                    }
                    validPlay={(cards) => canPlay(HUMAN_PLAYER_ID, cards)}
                    playableCardIds={tutorialOn ? getPlayableCardIds(HUMAN_PLAYER_ID) : undefined}
                    isMobile={true}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="absolute top-3 right-3 z-20 flex flex-row gap-2" aria-label="Deck and pile counts">
              <span className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                Deck: {state.drawPile.length}
              </span>
              <span className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                Pile: {state.commitmentPile.length}
              </span>
            </div>
            {state.phase === 'play' && <GameLog />}
            <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
              <div className="shrink-0 flex flex-row flex-wrap justify-center items-start gap-2 px-2 pt-2">
                {lastBotCatchphrase && (
                  <div className="w-full flex justify-center shrink-0">
                    <BotBubble
                      playerName={lastBotCatchphrase.playerName}
                      text={lastBotCatchphrase.text}
                      timestamp={lastBotCatchphrase.timestamp}
                    />
                  </div>
                )}
                {state.players
                  .filter((p) => p.id !== HUMAN_PLAYER_ID)
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-xl bg-felt border-2 shadow-lg overflow-hidden shrink-0 ${
                        isCurrentPlayer(p.id) ? 'ring-2 ring-cedar border-cedar/60' : 'border-cedar/30'
                      } ${zoneWidth}`}
                    >
                      <PlayerZone
                        player={p}
                        isCurrent={isCurrentPlayer(p.id)}
                        isYou={false}
                        compact={n >= 4}
                        extraCompact={n >= 5}
                        sizeVariant={layout.sizeVariant}
                        phase={state.phase}
                        onReady={undefined}
                        onSwapPair={undefined}
                        onPlay={undefined}
                        onCollect={undefined}
                        onPlayHiddenCard={undefined}
                        validPlay={undefined}
                        playableCardIds={undefined}
                      />
                    </div>
                  ))}
              </div>
              <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-2">
                {state.phase === 'play' &&
                  pendingHiddenReveal?.playerId === HUMAN_PLAYER_ID &&
                  (() => {
                    const human = state.players.find((p) => p.id === HUMAN_PLAYER_ID)
                    const card = human?.hiddenCards[pendingHiddenReveal.cardIndex] ?? null
                    return card ? (
                      <div className="shrink-0 flex flex-col items-center gap-1.5 rounded-xl bg-cedar-dark/90 border-2 border-cedar/50 px-4 py-3">
                        <span className="text-white text-sm font-medium">Playing this card</span>
                        <Card card={card} sizeVariant={layout.sizeVariant} />
                      </div>
                    ) : null
                  })()}
                <div className="flex-1 min-w-0 flex items-center justify-center">
                  <PlayArea sizeVariant={layout.sizeVariant} isBotThinking={!!botThinking} />
                </div>
              </div>
              <div className="shrink-0 flex justify-center px-2 pb-2 w-full">
                {state.phase === 'play' &&
                state.players.find((p) => p.id === HUMAN_PLAYER_ID)?.commitmentLevel === 'winner' &&
                state.players[state.currentPlayerIndex]?.type === 'bot' ? (
                  <div className={`${humanZoneWidth} flex items-center justify-center rounded-xl border-4 border-red-600 bg-red-600/20 min-h-[120px] sm:min-h-[140px]`}>
                    <button
                      type="button"
                      onClick={skipToMyTurn}
                      disabled={skippingToMyTurn}
                      className="text-red-600 font-bold text-xl sm:text-2xl md:text-3xl px-8 py-4 rounded-xl bg-white border-4 border-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                      aria-label="Skip to end"
                    >
                      {skippingToMyTurn ? 'Skipping to end…' : 'Skip to end'}
                    </button>
                  </div>
                ) : (
                  <div className={humanZoneWidth}>
                    <PlayerZone
                      player={humanPlayer}
                      isCurrent={isCurrentPlayer(HUMAN_PLAYER_ID)}
                      isYou
                      compact={n >= 4}
                      extraCompact={n >= 5}
                      sizeVariant={layout.sizeVariant}
                      phase={state.phase}
                      onReady={() => ready(HUMAN_PLAYER_ID)}
                      onSwapPair={(handIndex, visibleIndex) => swapPair(handIndex, visibleIndex)}
                      onPlay={(cards) => playCards(HUMAN_PLAYER_ID, cards)}
                      onCollect={canCollect(HUMAN_PLAYER_ID) ? () => collect(HUMAN_PLAYER_ID) : undefined}
                      onPlayHiddenCard={
                        humanPlayer.commitmentLevel === 'hidden'
                          ? (index) => playHiddenCard(HUMAN_PLAYER_ID, index)
                          : undefined
                      }
                      validPlay={(cards) => canPlay(HUMAN_PLAYER_ID, cards)}
                      playableCardIds={tutorialOn ? getPlayableCardIds(HUMAN_PLAYER_ID) : undefined}
                    />
                  </div>
                )}
              </div>
              {tutorialOn && (
                <div className="absolute bottom-14 left-3 right-3 max-w-md mx-auto pointer-events-none [&>*]:pointer-events-auto">
                  <TutorialPanel
                    lastLogEntry={playLog.length > 0 ? playLog[playLog.length - 1] : null}
                    currentMin={state.currentMinimum}
                    pileLength={state.commitmentPile.length}
                    deckLength={state.drawPile.length}
                    playableCount={getPlayableCardIds(HUMAN_PLAYER_ID).length}
                    canCollect={canCollect(HUMAN_PLAYER_ID)}
                    isYourTurn={isCurrentPlayer(HUMAN_PLAYER_ID)}
                    commitmentLevel={humanPlayer.commitmentLevel}
                  />
                </div>
              )}
            </div>
            {state.phase === 'play' && <SequenceHint handCards={humanPlayer.handCards} />}
          </>
        )}
      </div>

    </div>
  )
}
