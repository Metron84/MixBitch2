import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, type CardSizeVariant } from './Card'
import { sortCardsByDisplayOrder, cardDisplayOrder, isConsecutive } from '../lib/cardUtils'
import { useGameStore } from '../stores/gameStore'
import type { Card as CardType, Player } from '../types/game'

const VALUE_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
function getValueLabel(value: number): string {
  return VALUE_LABELS[value] ?? String(value)
}

function getHandValueSummary(cards: readonly CardType[]): string {
  const countByValue = new Map<number, number>()
  for (const c of cards) {
    countByValue.set(c.value, (countByValue.get(c.value) ?? 0) + 1)
  }
  const entries = [...countByValue.entries()].sort(
    (a, b) => cardDisplayOrder(a[0]) - cardDisplayOrder(b[0])
  )
  return entries.map(([val, n]) => `${n}× ${getValueLabel(val)}`).join(' · ')
}

interface PlayerZoneProps {
  player: Player
  isCurrent: boolean
  isYou: boolean
  compact?: boolean
  extraCompact?: boolean
  sizeVariant?: CardSizeVariant
  onPlay?: (cards: CardType[]) => void
  onCollect?: () => void
  onReady?: () => void
  onSwapPair?: (handIndex: number, visibleIndex: number) => void
  onPlayHiddenCard?: (cardIndex: number) => void
  phase: string
  validPlay?: (cards: CardType[]) => boolean
  playableCardIds?: string[]
  /** When true (mobile), hand modal is full-screen with sticky footer */
  isMobile?: boolean
}

export function PlayerZone({
  player,
  isCurrent,
  isYou,
  compact = false,
  extraCompact = false,
  sizeVariant = 'base',
  onPlay,
  onCollect,
  onReady,
  onSwapPair,
  onPlayHiddenCard,
  phase,
  validPlay,
  playableCardIds,
  isMobile = false,
}: PlayerZoneProps) {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
  const [swapSource, setSwapSource] = useState<{ zone: 'hand' | 'visible'; index: number } | null>(null)
  const playError = useGameStore((s) => s.playError)
  const justCollectedLargeHand = useGameStore((s) => s.justCollectedLargeHand)
  const clearJustCollectedLargeHand = useGameStore((s) => s.clearJustCollectedLargeHand)
  const pendingHiddenReveal = useGameStore((s) => s.pendingHiddenReveal)
  const setPendingHiddenReveal = useGameStore((s) => s.setPendingHiddenReveal)
  const inSwap = phase === 'swap'
  const inPlay = phase === 'play'
  const canAct = isYou && (inSwap || (inPlay && isCurrent))
  const shakeSet = playError ? new Set(playError.cardIds) : new Set<string>()

  const handleHandCardClick = useCallback(
    (c: CardType, index: number) => {
      if (inSwap && isYou && onSwapPair) {
        if (swapSource === null) {
          setSwapSource({ zone: 'hand', index })
          return
        }
        if (swapSource.zone === 'visible') {
          onSwapPair(index, swapSource.index)
          setSwapSource(null)
          return
        }
        setSwapSource({ zone: 'hand', index })
        return
      }
      if (!inPlay || !isCurrent || !isYou || !onPlay) return
      const idx = selectedCards.findIndex((x) => x.id === c.id)
      if (idx >= 0) {
        setSelectedCards((prev) => prev.filter((_, i) => i !== idx))
        return
      }
      if (selectedCards.length === 0) {
        if (validPlay?.([c])) setSelectedCards([c])
        return
      }
      const next = [...selectedCards, c]
      if (validPlay?.(next)) {
        setSelectedCards(next)
      } else if (
        next.length === 2 &&
        isConsecutive(next) &&
        player.handCards.length === 3
      ) {
        setSelectedCards(next)
      } else if (validPlay?.([c])) {
        setSelectedCards([c])
      }
    },
    [inSwap, inPlay, isCurrent, isYou, onSwapPair, onPlay, validPlay, selectedCards, player.handCards.length, swapSource]
  )

  const handleVisibleCardClick = useCallback(
    (c: CardType, index: number) => {
      if (inSwap && isYou && onSwapPair) {
        if (swapSource === null) {
          setSwapSource({ zone: 'visible', index })
          return
        }
        if (swapSource.zone === 'hand') {
          onSwapPair(swapSource.index, index)
          setSwapSource(null)
          return
        }
        setSwapSource({ zone: 'visible', index })
        return
      }
      if (!inPlay || !isCurrent || !isYou || !onPlay || player.commitmentLevel !== 'visible') return
      const idx = selectedCards.findIndex((x) => x.id === c.id)
      if (idx >= 0) {
        setSelectedCards((prev) => prev.filter((_, i) => i !== idx))
        return
      }
      if (selectedCards.length === 0) {
        if (validPlay?.([c])) setSelectedCards([c])
        return
      }
      const next = [...selectedCards, c]
      if (validPlay?.(next)) {
        setSelectedCards(next)
      } else if (
        next.length === 2 &&
        isConsecutive(next) &&
        player.visibleCards.length === 3
      ) {
        setSelectedCards(next)
      } else if (validPlay?.([c])) {
        setSelectedCards([c])
      }
    },
    [inSwap, inPlay, isCurrent, isYou, onSwapPair, onPlay, validPlay, selectedCards, player.commitmentLevel, player.visibleCards.length, swapSource]
  )

  const handlePlaySelected = useCallback(() => {
    if (selectedCards.length > 0 && onPlay && validPlay?.(selectedCards)) {
      onPlay(selectedCards)
      setSelectedCards([])
    }
  }, [selectedCards, onPlay, validPlay])

  const showMultiConfirm = inPlay && isCurrent && isYou && selectedCards.length > 0
  const reduceMotion = useReducedMotion()

  const padding = extraCompact ? 'p-4 sm:p-1.5' : compact ? 'p-4 sm:p-2' : 'p-4'
  const labelClass = extraCompact ? 'text-xs sm:text-[10px] w-10' : 'text-xs w-16'
  const overlapClass =
    sizeVariant === 'extra-compact' ? '-space-x-1' : sizeVariant === 'compact' ? '-space-x-1.5' : '-space-x-2'
  const handCount = player.handCards.length
  const visibleCount = player.visibleCards.length
  const hiddenCount = player.hiddenCards.length
  /** Modes 3–4: when user has many cards, put Play/Collect buttons to the right on the felt for easier access. */
  const buttonsRightOfHand = isYou && (compact || extraCompact) && handCount > 6
  const maxHandDisplay = 6
  const handDisplayCount = isYou && handCount > maxHandDisplay ? maxHandDisplay : handCount
  const useHandScroll = handDisplayCount > 10
  const useVisibleScroll = visibleCount > 8
  const showViewMoreHand = isYou && handCount > maxHandDisplay
  const showHandValueSummary = handCount > 8 && isYou
  const handLayoutClass = showViewMoreHand
    ? 'flex gap-2 flex-nowrap items-center'
    : useHandScroll
      ? 'flex gap-2 flex-nowrap items-center'
      : handDisplayCount > 4
        ? 'flex-wrap gap-x-2 gap-y-1'
        : overlapClass
  const visibleLayoutClass = useVisibleScroll
    ? 'flex gap-2 flex-nowrap items-center'
    : visibleCount > 4
      ? 'flex-wrap gap-x-2 gap-y-1'
      : overlapClass
  /** One step smaller than zone so opponent visible cards stay inside the box (no overflow). */
  const opponentVisibleVariant: CardSizeVariant =
    sizeVariant === 'base' ? 'compact' : sizeVariant === 'compact' ? 'extra-compact' : 'micro'
  const [showHandModal, setShowHandModal] = useState(false)
  const [handModalView, setHandModalView] = useState<'grid' | 'peek'>('grid')
  const [peekIndex, setPeekIndex] = useState(0)
  const handCards = player.handCards
  const sortedHandCards = sortCardsByDisplayOrder(handCards)
  const peekCard = sortedHandCards[peekIndex] ?? null
  const canPeekPrev = peekIndex > 0
  const canPeekNext = peekIndex < sortedHandCards.length - 1

  const isYourTurn = isCurrent && isYou
  const showLargeHandPrompt =
    justCollectedLargeHand && isYou && inPlay && handCount >= 7

  const showMobileActionBarContents = isMobile && isYou && inPlay

  return (
    <div
      className={`rounded-xl bg-felt border-2 shadow-lg zone-panel transition-shadow ${
        isCurrent ? 'ring-2 ring-cedar border-cedar/60' : 'border-cedar/30'
      } ${isYourTurn ? 'zone-your-turn-pulse' : ''} ${padding} ${isMobile && isYou ? 'flex flex-col min-h-0' : ''}`}
    >
      <div className={isMobile && isYou ? 'flex-1 min-h-0 overflow-y-auto' : ''}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-cedar-dark">
          {player.name} {isCurrent && '(turn)'}
        </span>
        {player.commitmentLevel === 'winner' && (
          <span className="text-cedar-dark text-sm">Winner!</span>
        )}
      </div>

      {showLargeHandPrompt && (
        <div className="mb-3 p-3 rounded-xl bg-cedar-light border border-cedar/40 space-y-2">
          <p className="text-cedar-dark text-sm font-medium">
            You collected the pile — you have <strong>{handCount}</strong> cards in hand.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowHandModal(true)
                setHandModalView('grid')
                setPeekIndex(0)
                clearJustCollectedLargeHand()
              }}
              className="px-4 py-2 rounded-xl bg-cedar text-cedar-dark font-medium text-sm hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
            >
              View hand & choose play
            </button>
            <button
              type="button"
              onClick={() => clearJustCollectedLargeHand()}
              className="px-4 py-2 rounded-xl bg-felt border border-cedar/40 text-cedar-dark text-sm hover:border-cedar/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {inSwap && isYou && (
        <div className="mb-2">
          <p className="text-xs text-cedar-dark/80 mb-1.5">
            {swapSource
              ? 'Now tap a card in the other row to swap with it.'
              : 'Tap a card in Hand, then a card in Visible (or the other way) to swap that pair. Then tap Ready.'}
          </p>
          {swapSource && (
            <button
              type="button"
              onClick={() => setSwapSource(null)}
              className="mb-2 px-3 py-1.5 min-h-[36px] rounded-lg border-2 border-cedar/50 text-cedar-dark text-xs font-medium hover:bg-cedar/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
            >
              Cancel selection
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSwapSource(null)
              onReady?.()
            }}
            disabled={player.isReady || visibleCount !== 3}
            title={visibleCount !== 3 ? 'Need exactly 3 visible cards to continue' : undefined}
            className="px-4 py-3 sm:py-2 min-h-[44px] rounded-xl bg-cedar text-cedar-dark font-medium disabled:opacity-50 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
          >
            {player.isReady ? 'Ready ✓' : 'Ready'}
          </button>
          {visibleCount !== 3 && !player.isReady && (
            <p className="text-xs text-cedar-dark/75 mt-1">Need 3 visible to continue.</p>
          )}
        </div>
      )}

      <div
        className={
          isYou
            ? 'flex flex-row flex-nowrap items-start gap-2 sm:gap-3 min-w-0 overflow-x-auto'
            : `space-y-2 ${extraCompact ? 'sm:space-y-1' : ''}`
        }
      >
        <div
          className={
            isYou
              ? 'flex flex-col gap-1 min-w-0 flex-1 min-w-[100px] shrink-0'
              : `flex gap-1 items-center ${overlapClass}`
            }
          >
            <span className={`text-cedar-dark ${labelClass}`}>Hidden ({hiddenCount})</span>
            {isYou ? (
              <div className={`flex gap-1 items-center ${overlapClass}`}>
                {player.hiddenCards.map((_, i) => {
                  const canClickHidden =
                    inPlay && isCurrent && isYou && player.commitmentLevel === 'hidden' && onPlayHiddenCard
                  const isRevealed =
                    pendingHiddenReveal?.playerId === player.id && pendingHiddenReveal?.cardIndex === i
                  if (canClickHidden && isRevealed) {
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <Card card={player.hiddenCards[i]} sizeVariant={sizeVariant} />
                        <button
                          type="button"
                          onClick={() => onPlayHiddenCard(i)}
                          className="px-3 py-1.5 min-h-[44px] rounded-lg bg-cedar text-white text-xs font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                        >
                          Play this card
                        </button>
                      </div>
                    )
                  }
                  if (canClickHidden && !(pendingHiddenReveal?.playerId === player.id)) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPendingHiddenReveal({ playerId: player.id, cardIndex: i })}
                        className="cursor-pointer rounded-lg border-2 border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt hover:border-cedar/40 transition-colors p-0 leading-none"
                        aria-label={`Reveal hidden card ${i + 1}`}
                      >
                        <Card card={player.hiddenCards[i]} faceDown sizeVariant={sizeVariant} />
                      </button>
                    )
                  }
                  return (
                    <Card key={i} card={player.hiddenCards[i]} faceDown sizeVariant={sizeVariant} />
                  )
                })}
              </div>
            ) : (
              <span className="text-cedar-dark/80 text-xs">{hiddenCount} cards</span>
            )}
          </div>
          <div
            className={
              isYou
                ? 'flex flex-col gap-1 min-w-0 flex-1 min-w-[100px] shrink-0'
                : 'flex gap-1 items-center'
            }
          >
            <span className={`text-cedar-dark ${labelClass} shrink-0`}>Visible ({visibleCount})</span>
            {isYou ? (
              <>
                <div
                  className={
                    useVisibleScroll
                      ? 'overflow-x-auto overflow-y-hidden max-h-card-h-xs flex-1 min-w-0'
                      : 'flex-1 min-w-0'
                  }
                >
                  <div className={`flex gap-1 items-center ${visibleLayoutClass}`}>
                    {sortCardsByDisplayOrder(player.visibleCards).map((c) => {
                      const visibleIndex = player.visibleCards.findIndex((x) => x.id === c.id)
                      return (
                        <Card
                          key={c.id}
                          card={c}
                          onClick={() => handleVisibleCardClick(c, visibleIndex)}
                          disabled={
                            !(
                              (inSwap && isYou) ||
                              (inPlay && isCurrent && isYou && player.commitmentLevel === 'visible')
                            )
                          }
                          highlight={
                            (inSwap && isYou && swapSource?.zone === 'visible' && swapSource.index === visibleIndex) ||
                            selectedCards.some((x) => x.id === c.id) ||
                            (inPlay &&
                              isYou &&
                              player.commitmentLevel === 'visible' &&
                              (playableCardIds?.includes(c.id) ?? validPlay?.([c])))
                          }
                          shake={shakeSet.has(c.id)}
                          sizeVariant={sizeVariant}
                        />
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-0.5 sm:gap-1 items-center min-w-0 overflow-hidden flex-1">
                {sortCardsByDisplayOrder(player.visibleCards).map((c) => (
                  <Card key={c.id} card={c} sizeVariant={opponentVisibleVariant} />
                ))}
              </div>
            )}
          </div>
        {!buttonsRightOfHand && (
          <div
            className={
              isYou
                ? 'flex flex-col gap-1 min-w-0 flex-1 min-w-[120px] shrink-0'
                : 'flex gap-1 items-center'
            }
          >
            <span className={`text-cedar-dark ${labelClass} shrink-0`}>Hand ({handCount})</span>
            {isYou ? (
              <>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  {showHandValueSummary && (
                    <p className="text-xs text-cedar-dark/75" aria-label="Card value counts">
                      {getHandValueSummary(player.handCards)}
                    </p>
                  )}
                  <div
                    className={
                      showViewMoreHand
                        ? 'min-w-0 overflow-x-auto overflow-y-hidden max-h-card-h-xs'
                        : useHandScroll
                          ? 'overflow-x-auto overflow-y-hidden max-h-card-h-xs'
                          : ''
                    }
                  >
                    <div className={`flex gap-1 items-center ${handLayoutClass}`}>
                    {(showViewMoreHand ? sortedHandCards.slice(0, maxHandDisplay) : sortCardsByDisplayOrder(player.handCards)).map((c) => {
                      const handIndex = player.handCards.findIndex((x) => x.id === c.id)
                      return (
                        <Card
                          key={c.id}
                          card={c}
                          onClick={() => handleHandCardClick(c, handIndex)}
                          disabled={!canAct && !(inPlay && isCurrent && isYou)}
                          highlight={
                            (inSwap && isYou && swapSource?.zone === 'hand' && swapSource.index === handIndex) ||
                            selectedCards.some((x) => x.id === c.id) ||
                            (playableCardIds?.includes(c.id) ?? (inPlay && isYou && validPlay?.([c])))
                          }
                          shake={shakeSet.has(c.id)}
                          sizeVariant={sizeVariant}
                        />
                      )
                    })}
                    </div>
                  </div>
                </div>
                {showViewMoreHand && (
                  <button
                    type="button"
                    onClick={() => {
                      setPeekIndex(0)
                      setHandModalView('grid')
                      setShowHandModal(true)
                    }}
                    className="shrink-0 px-3 py-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg bg-cedar/20 border border-cedar/50 text-cedar-dark text-xs font-medium hover:bg-cedar/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                  >
                    View more ({handCount})
                  </button>
                )}
              </>
            ) : (
              <span className="text-cedar-dark/80 text-xs">{handCount} cards</span>
            )}
          </div>
        )}
      </div>

      {buttonsRightOfHand ? (
        <div className="flex flex-row gap-2 items-start mt-2">
          <div className="flex gap-1 items-center min-w-0 flex-1">
            <span className={`text-cedar-dark ${labelClass} shrink-0`}>Hand ({handCount})</span>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {showHandValueSummary && (
                <p className="text-xs text-cedar-dark/75" aria-label="Card value counts">
                  {getHandValueSummary(player.handCards)}
                </p>
              )}
              <div
                className={
                  showViewMoreHand
                    ? 'min-w-0 overflow-x-auto overflow-y-hidden max-h-card-h-xs'
                    : useHandScroll
                      ? 'overflow-x-auto overflow-y-hidden max-h-card-h-xs'
                      : ''
                }
              >
                <div className={`flex gap-1 items-center ${handLayoutClass}`}>
                  {(showViewMoreHand ? sortedHandCards.slice(0, maxHandDisplay) : sortCardsByDisplayOrder(player.handCards)).map((c) => {
                    const handIdx = player.handCards.findIndex((x) => x.id === c.id)
                    return (
                      <Card
                        key={c.id}
                        card={c}
                        onClick={() => handleHandCardClick(c, handIdx)}
                        disabled={!canAct && !(inPlay && isCurrent && isYou)}
                        highlight={
                          (inSwap && isYou && swapSource?.zone === 'hand' && swapSource.index === handIdx) ||
                          selectedCards.some((x) => x.id === c.id) ||
                          (playableCardIds?.includes(c.id) ?? (inPlay && isYou && validPlay?.([c])))
                        }
                        shake={shakeSet.has(c.id)}
                        sizeVariant={sizeVariant}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            {showViewMoreHand && (
              <button
                type="button"
                onClick={() => {
                  setPeekIndex(0)
                  setHandModalView('grid')
                  setShowHandModal(true)
                }}
                className="shrink-0 px-3 py-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-lg bg-cedar/20 border border-cedar/50 text-cedar-dark text-xs font-medium hover:bg-cedar/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
              >
                View more ({handCount})
              </button>
            )}
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            {showMultiConfirm && (
              <motion.div
                className="p-2 rounded-xl bg-cedar-light border border-cedar/50 flex flex-wrap items-center gap-2"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
              >
                <span className="text-cedar-dark text-sm">
                  Selected: {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
                </span>
                <button
                  type="button"
                  onClick={handlePlaySelected}
                  className="px-4 py-2 rounded-xl bg-cedar text-cedar-dark font-medium text-sm hover:opacity-90"
                  aria-label={`Play ${selectedCards.length} selected card${selectedCards.length > 1 ? 's' : ''}`}
                >
                  Play {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCards([])}
                  className="px-3 py-1.5 rounded-xl bg-felt text-cedar-dark text-sm hover:border-cedar/30"
                  aria-label="Cancel selection"
                >
                  Cancel
                </button>
              </motion.div>
            )}
            {inPlay && isCurrent && isYou && onCollect && !showMultiConfirm && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCards([])
                  onCollect()
                }}
                className="px-4 py-3 sm:py-2 min-h-[44px] rounded-xl bg-danger/80 text-white text-sm hover:opacity-90"
              >
                Can&apos;t play — Collect pile
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {showMultiConfirm && (
            <motion.div
              className="mt-2 p-2 rounded-xl bg-cedar-light border border-cedar/50 flex flex-wrap items-center gap-2"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <span className="text-cedar-dark text-sm">
                Selected: {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
              </span>
              <button
                type="button"
                onClick={handlePlaySelected}
                className="px-4 py-2 rounded-xl bg-cedar text-cedar-dark font-medium text-sm hover:opacity-90"
                aria-label={`Play ${selectedCards.length} selected card${selectedCards.length > 1 ? 's' : ''}`}
              >
                Play {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCards([])}
                className="px-3 py-1.5 rounded-xl bg-felt text-cedar-dark text-sm hover:border-cedar/30"
                aria-label="Cancel selection"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {inPlay && isCurrent && isYou && onCollect && !showMultiConfirm && (
            <button
              type="button"
              onClick={() => {
                setSelectedCards([])
                onCollect()
              }}
              className="mt-2 px-4 py-3 sm:py-2 min-h-[44px] rounded-xl bg-danger/80 text-white text-sm hover:opacity-90"
            >
              Can&apos;t play — Collect pile
            </button>
          )}
        </>
      )}

      {showMobileActionBarContents && (
        <div className="sticky bottom-0 left-0 right-0 p-2 flex flex-wrap items-center gap-2 bg-felt border-t border-cedar/30 shrink-0 mt-2">
          {showMultiConfirm && (
            <>
              <button
                type="button"
                onClick={handlePlaySelected}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-cedar text-cedar-dark font-medium text-sm hover:opacity-90"
                aria-label={`Play ${selectedCards.length} selected card${selectedCards.length > 1 ? 's' : ''}`}
              >
                Play {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCards([])}
                className="px-3 py-2 min-h-[44px] rounded-xl bg-felt border border-cedar/40 text-cedar-dark text-sm"
                aria-label="Cancel selection"
              >
                Cancel
              </button>
            </>
          )}
          {inPlay && isCurrent && isYou && onCollect && !showMultiConfirm && (
            <button
              type="button"
              onClick={() => { setSelectedCards([]); onCollect() }}
              className="px-4 py-2 min-h-[44px] rounded-xl bg-danger/80 text-white text-sm hover:opacity-90"
            >
              Can&apos;t play — Collect pile
            </button>
          )}
          {showViewMoreHand && (
            <button
              type="button"
              onClick={() => { setPeekIndex(0); setHandModalView('grid'); setShowHandModal(true) }}
              className="px-3 py-2 min-h-[44px] rounded-lg bg-cedar/20 border border-cedar/50 text-cedar-dark text-xs font-medium hover:bg-cedar/30"
            >
              View more ({handCount})
            </button>
          )}
        </div>
      )}
      </div>

      {showHandModal && isYou && (
        <div
          className={`fixed inset-0 z-50 flex ${isMobile ? 'items-stretch' : 'items-center justify-center p-4'} bg-black/70`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hand-modal-title"
          onClick={() => {
            setShowHandModal(false)
            setSelectedCards([])
            clearJustCollectedLargeHand()
          }}
        >
          <div
            className={`bg-felt border-2 border-cedar/50 shadow-xl w-full flex flex-col ${isMobile ? 'h-full max-h-[100dvh] rounded-none' : 'max-w-4xl max-h-[85vh] rounded-2xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1 p-3 border-b border-cedar/30 shrink-0">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 id="hand-modal-title" className="text-cedar-dark font-heading font-bold text-lg">
                  Your hand ({handCards.length} cards)
                </h2>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHandModalView(handModalView === 'grid' ? 'peek' : 'grid')}
                  className="px-3 py-1.5 rounded-lg bg-cedar/20 border border-cedar/50 text-cedar-dark text-sm font-medium hover:bg-cedar/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                >
                  {handModalView === 'grid' ? 'Peek (one at a time)' : 'Grid'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHandModal(false)
                    setSelectedCards([])
                    clearJustCollectedLargeHand()
                  }}
                  className="px-3 py-1.5 rounded-lg bg-felt border border-cedar/30 text-cedar-dark text-sm hover:border-cedar/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                >
                  Close
                </button>
                </div>
              </div>
              {showHandValueSummary && (
                <p className="text-xs text-cedar-dark/75" aria-label="Card value counts">
                  {getHandValueSummary(handCards)}
                </p>
              )}
            </div>
            <div className="overflow-auto p-4 flex-1 min-h-0 flex flex-col items-center justify-center">
              {handModalView === 'peek' ? (
                <div className="flex items-center gap-4 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setPeekIndex((i) => Math.max(0, i - 1))}
                    disabled={!canPeekPrev}
                    className="p-2 rounded-xl bg-cedar/20 border border-cedar/50 text-cedar-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cedar/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                    aria-label="Previous card"
                  >
                    ←
                  </button>
                  <div className="flex flex-col items-center gap-2">
                    {peekCard && (
                      <Card
                        card={peekCard}
                        onClick={() => handleHandCardClick(peekCard, handCards.findIndex((x) => x.id === peekCard.id))}
                        disabled={!canAct && !(inPlay && isCurrent && isYou)}
                        highlight={
                          selectedCards.some((x) => x.id === peekCard.id) ||
                          (playableCardIds?.includes(peekCard.id) ?? (inPlay && isYou && validPlay?.([peekCard])))
                        }
                        shake={shakeSet.has(peekCard.id)}
                        sizeVariant="base"
                      />
                    )}
                    <span className="text-cedar-dark text-sm">
                      Card {peekIndex + 1} of {sortedHandCards.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPeekIndex((i) => Math.min(sortedHandCards.length - 1, i + 1))}
                    disabled={!canPeekNext}
                    className="p-2 rounded-xl bg-cedar/20 border border-cedar/50 text-cedar-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cedar/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar"
                    aria-label="Next card"
                  >
                    →
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {sortCardsByDisplayOrder(handCards).map((c) => (
                    <Card
                      key={c.id}
                      card={c}
                      onClick={() => handleHandCardClick(c, handCards.findIndex((x) => x.id === c.id))}
                      disabled={!canAct && !(inPlay && isCurrent && isYou)}
                      highlight={
                        selectedCards.some((x) => x.id === c.id) ||
                        (playableCardIds?.includes(c.id) ?? (inPlay && isYou && validPlay?.([c])))
                      }
                      shake={shakeSet.has(c.id)}
                      sizeVariant="compact"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-cedar/30 flex flex-wrap items-center gap-2 shrink-0 bg-felt">
              {selectedCards.length > 0 ? (
                <>
                  <span className="text-cedar-dark text-sm">
                    Selected: {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handlePlaySelected()
                      setShowHandModal(false)
                      clearJustCollectedLargeHand()
                    }}
                    className="px-4 py-2 rounded-xl bg-cedar text-cedar-dark font-medium text-sm hover:opacity-90"
                  >
                    Play {selectedCards.length} <span className="selected-card-value">{getValueLabel(selectedCards[0].value)}{selectedCards.length > 1 ? 's' : ''}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCards([])}
                    className="px-3 py-1.5 rounded-xl bg-felt text-cedar-dark text-sm hover:border-cedar/30"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <span className="text-cedar-dark text-sm">
                  {handModalView === 'peek' ? 'Click the card to select, then Play. Use arrows to browse.' : 'Click cards to select, then Play. Hover to magnify.'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
