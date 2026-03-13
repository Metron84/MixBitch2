import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BotPersona } from '../../types/game'
import { AI_PERSONAS, selectRandomBots } from '../../data/botPersonas'
import { CedarTreeIcon } from '../ui/CedarTreeIcon'

interface OpponentSelectorProps {
  playerCount: number
  opponents: BotPersona[]
  onSetOpponents: (opponents: BotPersona[]) => void
  onLetsPlay: () => void
  onBack: () => void
}

export function OpponentSelector({
  playerCount,
  opponents,
  onSetOpponents,
  onLetsPlay,
  onBack,
}: OpponentSelectorProps) {
  const needed = Math.max(1, playerCount - 1)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(opponents.map((p) => p.name))
  )
  const [isStarting, setIsStarting] = useState(false)

  const toggle = useCallback(
    (p: BotPersona) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(p.name)) {
          next.delete(p.name)
        } else if (next.size < needed) {
          next.add(p.name)
        } else {
          /* At capacity: replace one selected with this bot */
          const first = next.values().next().value
          if (first !== undefined) {
            next.delete(first)
            next.add(p.name)
          }
        }
        return next
      })
    },
    [needed]
  )

  const handleRandomize = useCallback(() => {
    const bots = selectRandomBots(needed)
    setSelected(new Set(bots.map((p) => p.name)))
    onSetOpponents(bots)
  }, [needed, onSetOpponents])

  const selectedList = AI_PERSONAS.filter((p) => selected.has(p.name))
  const canPlay = selectedList.length === needed
  const reduceMotion = useReducedMotion()
  const [modalPersona, setModalPersona] = useState<BotPersona | null>(null)

  const handleLetsPlay = useCallback(() => {
    if (!canPlay) return
    if (selected.size === needed) {
      const list = AI_PERSONAS.filter((p) => selected.has(p.name))
      onSetOpponents(list)
    }
    setIsStarting(true)
    setTimeout(() => {
      onLetsPlay()
    }, 400)
  }, [selected, needed, onSetOpponents, onLetsPlay, canPlay])

  return (
    <div className="min-h-screen flex flex-col bg-table">
      <div className="sticky top-0 z-10 shrink-0 flex flex-col items-center py-4 px-4 sm:py-5 sm:px-6 bg-setup-header border-b-4 border-b-lebanon-red">
        <p className="text-cedar-dark dark:text-green-200 text-xs sm:text-sm mb-1">Step 2 · {playerCount} players</p>
        <h1 className="text-xl font-bold text-lebanon-red font-heading mb-1">Choose opponents</h1>
        <p className="text-cedar-dark dark:text-green-200 text-sm mb-2">Select <span className="font-semibold">{needed}</span></p>
        <div className="flex justify-center gap-1.5 mb-2">
          {Array.from({ length: needed }, (_, i) => (
            <span
              key={i}
              className={`inline-block w-2.5 h-2.5 rounded-full ${i < selectedList.length ? 'bg-cedar' : 'bg-cedar/20'}`}
              aria-hidden
            />
          ))}
        </div>
        {selectedList.length > 0 && (
          <p className="text-cedar-dark dark:text-green-200 text-xs mb-2 truncate max-w-full px-2 text-center">
            {selectedList.map((p) => p.name).join(', ')}
          </p>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-felt border border-cedar/30 text-cedar-dark text-sm font-medium hover:border-cedar/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-felt border border-cedar/30 text-cedar-dark text-sm font-medium hover:border-cedar/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table"
          >
            Surprise Me
          </button>
          <button
            type="button"
            onClick={handleLetsPlay}
            disabled={!canPlay || isStarting}
            className="px-5 py-2 min-h-[44px] rounded-xl bg-cedar text-cedar-dark text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table"
          >
            {isStarting ? 'Preparing...' : 'Start game →'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-3">
        {AI_PERSONAS.map((p) => {
          const isSelected = selected.has(p.name)
          return (
            <div
              key={p.name}
              role="button"
              tabIndex={0}
              onClick={() => toggle(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(p)
                }
              }}
              className={`text-left rounded-xl px-3 py-3 border transition-colors min-h-[100px] flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 cursor-pointer ${
                isSelected
                  ? 'bg-cedar-light border-cedar ring-2 ring-cedar/50'
                  : 'bg-white dark:bg-[#2d3a2d] border-cedar/30 hover:border-cedar/50 text-cedar-dark dark:text-green-200'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`text-sm ${isSelected ? 'font-bold text-cedar-dark dark:text-green-100' : 'font-semibold text-cedar-dark dark:text-green-100'}`}>{p.name}</span>
                {isSelected && (
                  <motion.span
                    className="text-cedar shrink-0"
                    aria-hidden
                    initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    <CedarTreeIcon size={22} aria-hidden />
                  </motion.span>
                )}
              </div>
              <span className={`text-xs mt-0.5 ${isSelected ? 'text-cedar-dark dark:text-green-200 font-medium' : 'text-cedar-dark/90 dark:text-green-300'}`}>{p.archetype}</span>
              {p.bullets ? (
                <ul className={`text-xs mt-1 list-disc list-inside space-y-0.5 ${isSelected ? 'text-cedar-dark dark:text-green-200' : 'text-cedar-dark/90 dark:text-green-300'}`}>
                  {p.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                p.description && (
                  <p className={`text-xs mt-1 line-clamp-4 ${isSelected ? 'text-cedar-dark dark:text-green-200' : 'text-cedar-dark/90 dark:text-green-300'}`}>{p.description}</p>
                )
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setModalPersona(p)
                }}
                className="mt-2 text-xs font-medium text-lebanon-red hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-1 rounded self-start"
              >
                Read more
              </button>
            </div>
          )
        })}
      </div>
        <p className="text-cedar-dark/70 dark:text-green-400 text-xs italic mt-6 text-center" aria-hidden>
          Strategy is the bridge between chance and choice.
        </p>
      </div>

      {modalPersona && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opponent-modal-title"
          onClick={() => setModalPersona(null)}
        >
          <div
            className="rounded-2xl bg-felt border-2 border-cedar/50 border-t-4 border-t-lebanon-red p-6 max-w-md w-full shadow-xl max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="opponent-modal-title" className="text-xl font-bold text-cedar-dark dark:text-green-100 font-heading mb-1">
              {modalPersona.name}
            </h2>
            <p className="text-lebanon-red font-medium text-sm mb-3">{modalPersona.archetype}</p>
            {modalPersona.description && (
              <p className="text-cedar-dark dark:text-green-200 text-sm mb-4">{modalPersona.description}</p>
            )}
            {modalPersona.catchphrases.length > 0 && (
              <div className="mb-4">
                <h3 className="text-cedar-dark dark:text-green-200 font-semibold text-xs uppercase tracking-wide mb-1">Catchphrases</h3>
                <ul className="text-cedar-dark dark:text-green-200 text-sm list-disc list-inside space-y-0.5">
                  {modalPersona.catchphrases.map((c, i) => (
                    <li key={i}>&ldquo;{c}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => setModalPersona(null)}
              className="w-full py-2.5 rounded-xl bg-cedar text-lebanon-red font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
