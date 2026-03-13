import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CedarTreeIcon } from '../ui/CedarTreeIcon'
import type { MatchState } from '../../stores/gameStore'

const MOBILE_BREAKPOINT = 640
const STORAGE_KEY = 'all-in-mobile-notice-dismissed'

type MatchMode = MatchState['mode']

const MATCH_OPTIONS: { mode: MatchMode; label: string }[] = [
  { mode: 'single', label: 'Single Game' },
  { mode: 'best-of-3', label: 'Best of 3' },
  { mode: 'best-of-5', label: 'Best of 5' },
]

interface PlayerCountScreenProps {
  selectedCount: number
  onSelectCount: (n: number) => void
  onStart: (matchMode: MatchMode) => void
}

const PLAYER_OPTIONS: { count: number; label: string; description: string }[] = [
  { count: 2, label: 'Intimate', description: 'Head-to-head tension' },
  { count: 3, label: 'Cozy', description: 'Conversation at the table' },
  { count: 4, label: 'Lively', description: 'More action, more chaos' },
]

export function PlayerCountScreen({ selectedCount, onSelectCount, onStart }: PlayerCountScreenProps) {
  const reduceMotion = useReducedMotion()
  const [matchMode, setMatchMode] = useState<MatchMode>('single')
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  )
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const handle = () => setIsSmallScreen(mql.matches)
    handle()
    mql.addEventListener('change', handle)
    return () => mql.removeEventListener('change', handle)
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const showMobileNotice = isSmallScreen && !dismissed

  return (
    <div className="min-h-screen flex flex-col bg-table">
      {showMobileNotice && (
        <div className="w-full shrink-0 px-4 py-3 bg-cedar-light border border-cedar/40 text-cedar-dark flex items-center justify-between gap-3">
          <p className="text-sm">
            Mix Bitch is best experienced on tablet or desktop. You can still play on mobile, but the layout is optimized for larger screens.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-cedar/20 hover:bg-cedar/30 text-cedar-dark font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
          >
            Got it
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center p-8 px-4 sm:p-6">
      <p className="text-text-secondary dark:text-green-300 text-base mb-2">Step 1 of 2</p>
      <div className="border-b-4 border-lebanon-red pb-2 mb-2">
        <h1 className="text-2xl font-bold text-cedar-dark dark:text-green-100 font-heading">Mix Bitch</h1>
      </div>
      <p className="text-text-secondary dark:text-green-300 text-base mb-1">The table is ready</p>
      <p className="text-lebanon-red text-base font-medium mb-4">How many at the table?</p>
      <div className="flex justify-center gap-2 mb-6">
        {MATCH_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMatchMode(mode)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table ${
              matchMode === mode
                ? 'bg-cedar text-white shadow-md'
                : 'bg-cedar/10 text-cedar-dark hover:bg-cedar/20 border border-cedar/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 sm:gap-3 mb-6 w-full max-w-2xl">
        {PLAYER_OPTIONS.map(({ count, label, description }) => (
          <button
            key={count}
            type="button"
            onClick={() => onSelectCount(count)}
            className={`relative flex-1 min-w-0 sm:min-w-[140px] w-full max-w-[200px] sm:max-w-none p-4 min-h-[44px] rounded-xl text-left border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table ${
              selectedCount === count
                ? 'bg-cedar-light border-cedar text-cedar-dark dark:text-green-100'
                : 'bg-white dark:bg-[#2d3a2d] border-cedar/30 text-cedar-dark dark:text-green-200 hover:border-cedar/60'
            }`}
          >
            {selectedCount === count && (
              <motion.span
                className="absolute top-3 right-3 text-cedar"
                aria-hidden
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 22 }}
              >
                <CedarTreeIcon size={28} aria-hidden />
              </motion.span>
            )}
            <span className="font-semibold text-lg block">{label}</span>
            <span className="text-2xl font-bold block mt-0.5">{count}</span>
            <span className={`text-sm block mt-1 ${selectedCount === count ? 'text-text-secondary dark:text-green-300' : 'text-cedar-dark/90 dark:text-green-300'}`}>{description}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onStart(matchMode)}
        className="px-6 py-3 sm:py-2.5 min-h-[44px] rounded-xl bg-cedar text-cedar-dark font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-table"
      >
        Who joins you? →
      </button>
      <p className="text-text-secondary dark:text-green-300 text-sm mt-6">The table awaits your gathering</p>
      <p className="text-cedar-dark/70 dark:text-green-400 text-xs italic mt-2" aria-hidden>
        Play is the work of the mind.
      </p>
      </div>
    </div>
  )
}
