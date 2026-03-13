'use client'

import { useState } from 'react'
import type { PlayLogEntry } from '../../stores/gameStore'
import type { CommitmentLevel } from '../../types/game'

function formatMin(value: number | null): string {
  if (value === null) return 'Any'
  if (value === 11) return 'J'
  if (value === 12) return 'Q'
  if (value === 13) return 'K'
  if (value === 14) return 'A'
  return String(value)
}

export interface TutorialPanelProps {
  lastLogEntry: PlayLogEntry | null
  currentMin: number | null
  pileLength: number
  deckLength: number
  playableCount: number
  canCollect: boolean
  isYourTurn: boolean
  commitmentLevel: CommitmentLevel
}

export function TutorialPanel({
  lastLogEntry,
  currentMin,
  pileLength,
  deckLength,
  playableCount,
  canCollect,
  isYourTurn,
  commitmentLevel,
}: TutorialPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const minLabel = formatMin(currentMin)
  const scenarioParts: string[] = []
  if (lastLogEntry) {
    const verb = lastLogEntry.action === 'play' ? 'played' : 'collected'
    scenarioParts.push(`${lastLogEntry.playerName} ${verb} ${lastLogEntry.summary}.`)
  }
  scenarioParts.push(`Current: ${minLabel}+.`)
  scenarioParts.push(`Pile: ${pileLength}.`)
  scenarioParts.push(`Deck: ${deckLength}.`)
  const scenarioText = scenarioParts.join(' ')

  const canPlayAny = playableCount > 0
  const canDo: string[] = []
  if (isYourTurn) {
    if (canPlayAny) {
      canDo.push(
        'Play one or more cards from your hand that meet the current minimum (or use 2, 3, 7, 10 when the rules allow).'
      )
    }
    if (canCollect) {
      canDo.push("Collect the pile if you have no valid play (then it's the next player's turn).")
    }
    if (commitmentLevel === 'hidden') {
      canDo.push('Tap a face-down hidden card to select it (everyone sees it). Then tap "Play this card" to play it.')
    }
  } else {
    canDo.push("It's not your turn — wait for your turn to play or collect.")
  }

  const cannotDo: string[] = []
  cannotDo.push("Don't play cards that don't meet the current minimum (unless a 2 is on top or you're using a magic card).")
  if (commitmentLevel === 'hand') {
    cannotDo.push("You can't play from Visible or Hidden until you've committed cards in the swap phase and moved to those levels.")
  }
  if (canPlayAny && !canCollect && isYourTurn) {
    cannotDo.push("You can't collect the pile while you have at least one valid play.")
  }

  return (
    <div
      className="w-full rounded-xl border-2 border-cedar/50 bg-felt/95 backdrop-blur-sm shadow-lg overflow-hidden"
      aria-label="Tutorial"
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-left hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-inset"
        aria-expanded={expanded}
        aria-controls="tutorial-content"
      >
        <span className="text-sm font-semibold text-cedar-dark">Tutorial</span>
        <span className="text-cedar-dark/80 text-sm shrink-0" aria-hidden>
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </button>
      <div
        id="tutorial-content"
        role="region"
        aria-label="Tutorial content"
        className={`overflow-hidden transition-[max-height] duration-200 ${expanded ? 'max-h-[50vh]' : 'max-h-0'}`}
      >
        <div className="px-4 pb-4 pt-0 overflow-y-auto max-h-[45vh] space-y-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-cedar-dark/80 mb-1">
              What just happened
            </h3>
            <p className="text-sm text-cedar-dark leading-snug">{scenarioText}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-cedar-dark/80 mb-1">
              You can
            </h3>
            <ul className="text-sm text-cedar-dark list-disc list-inside space-y-1 leading-snug">
              {canDo.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-cedar-dark/80 mb-1">
              You cannot
            </h3>
            <ul className="text-sm text-cedar-dark list-disc list-inside space-y-1 leading-snug">
              {cannotDo.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
