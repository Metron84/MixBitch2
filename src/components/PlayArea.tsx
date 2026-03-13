import { useGameStore } from '../stores/gameStore'
import { Card, type CardSizeVariant } from './Card'

interface PlayAreaProps {
  sizeVariant?: CardSizeVariant
  isBotThinking?: boolean
}

export function PlayArea({ sizeVariant = 'base', isBotThinking = false }: PlayAreaProps) {
  const state = useGameStore((s) => s.state)
  if (!state) return null

  const topCard = state.commitmentPile.length > 0
    ? state.commitmentPile[state.commitmentPile.length - 1]
    : null
  const minLabel =
    state.currentMinimum === null
      ? 'Any'
      : state.currentMinimum === 11
        ? 'J'
        : state.currentMinimum === 12
          ? 'Q'
          : state.currentMinimum === 13
            ? 'K'
            : state.currentMinimum === 14
              ? 'A'
              : String(state.currentMinimum)

  const centerSize =
    sizeVariant === 'extra-compact'
      ? 'w-28 h-28 min-w-[112px] min-h-[112px] md:w-32 md:h-32'
      : sizeVariant === 'compact'
        ? 'w-32 h-32 min-w-[128px] min-h-[128px] md:w-36 md:h-36'
        : 'w-36 h-36 min-w-[144px] min-h-[144px] md:w-40 md:h-40'

  const textSize = sizeVariant === 'extra-compact' ? 'text-xs' : sizeVariant === 'compact' ? 'text-sm' : 'text-sm'

  return (
    <div
      className={`${centerSize} rounded-2xl bg-cedar-dark/95 border-2 border-cedar/60 shadow-2xl flex flex-col items-center justify-center gap-1.5 p-3 ring-4 ring-black/20 ${isBotThinking ? 'center-waiting' : ''}`}
    >
      <div className={`text-white flex items-center gap-1.5 ${textSize}`}>
        <span>Current:</span>
        {topCard ? (
          <Card card={topCard} sizeVariant={sizeVariant} />
        ) : (
          <span className="text-white font-medium">{minLabel}+</span>
        )}
      </div>
    </div>
  )
}
