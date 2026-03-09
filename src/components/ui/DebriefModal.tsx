'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BotPersona } from '../../types/game'
import type { DebriefOutcome } from '../../data/debriefPresets'
import {
  getRound1BotLine,
  getRound2BotResponse,
  getRound3BotResponse,
  ROUND1_USER_OPTIONS,
  ROUND2_USER_OPTIONS,
  ROUND3_USER_OPTIONS,
} from '../../data/debriefPresets'
import { CedarTreeIcon } from './CedarTreeIcon'

type DebriefRound = 1 | 2 | 3 | 4

interface DebriefModalProps {
  /** Bots who got out (user can pick who to address). */
  bots: BotPersona[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  outcome: DebriefOutcome
  onRematch: () => void
  onNextBot: () => void
  onEnd: () => void
}

export function DebriefModal({
  bots,
  selectedIndex,
  onSelectIndex,
  outcome,
  onRematch,
  onNextBot,
  onEnd,
}: DebriefModalProps) {
  const [round, setRound] = useState<DebriefRound>(1)
  const [round1Choice, setRound1Choice] = useState<number | null>(null)
  const [round2Choice, setRound2Choice] = useState<number | null>(null)
  const [round2BotShown, setRound2BotShown] = useState(false)
  const [round3Choice, setRound3Choice] = useState<number | null>(null)
  const [round3BotShown, setRound3BotShown] = useState(false)

  const reduceMotion = useReducedMotion()
  const bot = bots[selectedIndex] ?? bots[0]
  const archetype = bot?.archetype ?? ''
  const botName = bot?.name ?? 'Bot'

  const round1Line = getRound1BotLine(archetype, outcome)

  const handleRound1Select = (index: number) => {
    setRound1Choice(index)
    setRound(2)
  }

  const handleRound2Select = (index: number) => {
    setRound2Choice(index)
    setRound2BotShown(true)
  }

  const advanceRound2To3 = () => {
    setRound(3)
  }

  const handleRound3Select = (index: number) => {
    setRound3Choice(index)
    setRound3BotShown(true)
  }

  const advanceRound3To4 = () => {
    setRound(4)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Post-game debrief"
    >
      <motion.div
        className="rounded-2xl bg-felt border-2 border-cedar/50 border-t-4 border-t-lebanon-red p-6 max-w-md w-full shadow-xl max-h-[90vh] flex flex-col"
        initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 300, damping: 24 }
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-2 border-b border-cedar/30">
          <CedarTreeIcon size={24} aria-hidden />
          <h2 className="text-xl font-bold text-neutral-900 font-heading">
            Debrief with {botName}
          </h2>
          {bots.length > 1 && (
            <div className="flex gap-1 ml-auto" role="tablist" aria-label="Choose who to talk to">
              {bots.map((b, i) => (
                <button
                  key={b.name}
                  type="button"
                  role="tab"
                  aria-selected={i === selectedIndex}
                  onClick={() => onSelectIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar ${
                    i === selectedIndex ? 'bg-cedar text-white' : 'bg-white/80 border-2 border-neutral-300 text-neutral-800 hover:bg-white hover:border-cedar'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Round 1: Bot reaction */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">{botName}:</p>
            <p className="text-neutral-900 text-base italic">&ldquo;{round1Line}&rdquo;</p>
          </div>

          {round === 1 && (
            <motion.div
              className="space-y-2"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-sm font-medium text-neutral-700">You:</p>
              <ul className="space-y-2" role="listbox" aria-label="Choose your response">
                {ROUND1_USER_OPTIONS.map((opt, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => handleRound1Select(i)}
                      className="w-full text-left py-2.5 px-4 rounded-xl bg-white/70 border-2 border-neutral-300 text-neutral-900 font-medium hover:bg-white/90 hover:border-cedar focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* After round 1: show user's response */}
          {round >= 2 && round1Choice !== null && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700">You:</p>
              <p className="text-neutral-900 text-base">
                &ldquo;{ROUND1_USER_OPTIONS[round1Choice]}&rdquo;
              </p>
            </div>
          )}

          {/* Round 2: User topic → Bot reflect */}
          {round >= 2 && (
            <>
              {round2Choice !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">You:</p>
                  <p className="text-neutral-900 text-base">
                    &ldquo;{ROUND2_USER_OPTIONS[round2Choice]}&rdquo;
                  </p>
                </div>
              )}
              {round2BotShown && round2Choice !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">{botName}:</p>
                  <p className="text-neutral-900 text-base italic">
                    &ldquo;{getRound2BotResponse(archetype, round2Choice)}&rdquo;
                  </p>
                </div>
              )}
              {round === 2 && !round2BotShown && (
                <motion.div
                  className="space-y-2"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm font-medium text-neutral-700">You:</p>
                  <ul className="space-y-2" role="listbox" aria-label="Choose what to say">
                    {ROUND2_USER_OPTIONS.map((opt, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handleRound2Select(i)}
                          className="w-full text-left py-2.5 px-4 rounded-xl bg-white/70 border-2 border-neutral-300 text-neutral-900 font-medium hover:bg-white/90 hover:border-cedar focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
              {round === 2 && round2BotShown && (
                <button
                  type="button"
                  onClick={advanceRound2To3}
                  className="py-2 px-4 rounded-xl bg-cedar text-white font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
                >
                  Continue
                </button>
              )}
            </>
          )}

          {/* Round 3: User summary → Bot close */}
          {round >= 3 && (
            <>
              {round3Choice !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">You:</p>
                  <p className="text-neutral-900 text-base">
                    &ldquo;{ROUND3_USER_OPTIONS[round3Choice]}&rdquo;
                  </p>
                </div>
              )}
              {round3BotShown && round3Choice !== null && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">{botName}:</p>
                  <p className="text-neutral-900 text-base italic">
                    &ldquo;{getRound3BotResponse(archetype, round3Choice)}&rdquo;
                  </p>
                </div>
              )}
              {round === 3 && !round3BotShown && (
                <motion.div
                  className="space-y-2"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm font-medium text-neutral-700">You:</p>
                  <ul className="space-y-2" role="listbox" aria-label="Choose your closing">
                    {ROUND3_USER_OPTIONS.map((opt, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handleRound3Select(i)}
                          className="w-full text-left py-2.5 px-4 rounded-xl bg-white/70 border-2 border-neutral-300 text-neutral-900 font-medium hover:bg-white/90 hover:border-cedar focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
              {round === 3 && round3BotShown && (
                <button
                  type="button"
                  onClick={advanceRound3To4}
                  className="py-2 px-4 rounded-xl bg-cedar text-white font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
                >
                  Continue
                </button>
              )}
            </>
          )}

          {/* Round 4: Closure — Rematch / Next bot / End */}
          {round === 4 && (
            <motion.div
              className="space-y-3 pt-2"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-neutral-800 text-base font-medium">What next?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onRematch}
                  className="w-full py-2.5 rounded-xl bg-cedar text-white font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
                >
                  Another round (same opponents)
                </button>
                <button
                  type="button"
                  onClick={onNextBot}
                  className="w-full py-2.5 rounded-xl bg-white/70 border-2 border-cedar/50 text-neutral-800 font-semibold hover:bg-white/90 hover:border-cedar focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
                >
                  Different opponents
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="w-full py-2.5 rounded-xl bg-white/50 border-2 border-cedar/40 text-neutral-800 font-medium hover:bg-white/70 hover:border-cedar/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
                >
                  End game
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
