import { useEffect, useRef, useState } from 'react'
import { useGameStore, type PlayLogEntry } from '../stores/gameStore'

const MAX_VISIBLE = 24

interface GameLogProps {
  /** When true, log sits in layout flow (e.g. right of center on mobile) instead of absolute top-left. */
  embedded?: boolean
}

export function GameLog({ embedded = false }: GameLogProps) {
  const playLog = useGameStore((s) => s.playLog)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const entries = playLog.slice(-MAX_VISIBLE)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [playLog.length])

  const positionClass = embedded ? 'relative' : 'absolute top-3 left-3 z-20'
  const sizeClass = collapsed ? 'w-auto' : embedded ? 'w-[min(180px,32vw)] max-h-[120px]' : 'w-[min(220px,50vw)] max-h-[140px]'

  return (
    <div
      className={`${positionClass} rounded-lg bg-black/60 backdrop-blur-sm border border-cedar/40 shadow-lg flex flex-col overflow-hidden transition-all duration-200 ${sizeClass}`}
      aria-label="Game activity"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={`flex items-center gap-2 px-3 py-2 min-h-[44px] w-full text-left hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-inset ${collapsed ? '' : 'border-b border-cedar/30'}`}
      >
        <span className="text-xs font-medium text-white/90">Activity</span>
        <span className="text-white/60 text-xs" aria-hidden>
          {collapsed ? '▼' : '▲'}
        </span>
      </button>
      {!collapsed && (
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 p-2 space-y-0.5 max-h-[80px] sm:max-h-[100px]"
      >
        {entries.length === 0 ? (
          <p className="text-xs text-white/60 italic">Plays will appear here</p>
        ) : (
          entries.map((entry) => (
            <GameLogLine key={entry.id} entry={entry} />
          ))
        )}
      </div>
      )}
    </div>
  )
}

function GameLogLine({ entry }: { entry: PlayLogEntry }) {
  const isYou = entry.playerName === 'You'
  const nameClass = isYou ? 'text-cedar font-medium' : 'text-white/95'
  return (
    <p className="text-xs text-white/85 leading-tight" role="listitem">
      <span className={nameClass}>{entry.playerName}</span>
      {entry.action === 'play' ? (
        <> played {entry.summary}</>
      ) : (
        <> collected {entry.summary}</>
      )}
    </p>
  )
}
