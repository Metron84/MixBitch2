import { motion, useReducedMotion } from 'framer-motion'
import type { Card as CardType } from '../types/game'
import { CardBack } from './ui/CardBack'

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const VALUE_LABELS: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
}

export type CardSizeVariant = 'base' | 'compact' | 'extra-compact' | 'micro'

interface CardProps {
  card: CardType
  faceDown?: boolean
  onClick?: () => void
  disabled?: boolean
  highlight?: boolean
  /** @deprecated Use sizeVariant instead */
  small?: boolean
  sizeVariant?: CardSizeVariant
  shake?: boolean
}

const SIZE_CLASSES: Record<CardSizeVariant, { wrapper: string; radius: string; value: string; suit: string; suitCenter: string; magic: string }> = {
  base: {
    wrapper: 'w-card-w-base h-card-h-base min-w-0 min-h-0 overflow-hidden',
    radius: 'rounded-lg',
    value: 'text-sm leading-tight',
    suit: 'text-xs leading-none',
    suitCenter: 'text-base leading-none',
    magic: 'text-[7px] leading-none',
  },
  compact: {
    wrapper: 'w-card-w-compact h-card-h-compact min-w-0 min-h-0 overflow-hidden',
    radius: 'rounded-md',
    value: 'text-xs leading-tight',
    suit: 'text-[10px] leading-none',
    suitCenter: 'text-sm leading-none',
    magic: 'text-[6px] leading-none',
  },
  'extra-compact': {
    wrapper: 'w-card-w-xs h-card-h-xs min-w-0 min-h-0 overflow-hidden',
    radius: 'rounded',
    value: 'text-[11px] leading-tight',
    suit: 'text-[9px] leading-none',
    suitCenter: 'text-xs leading-none',
    magic: 'text-[5px] leading-none',
  },
  micro: {
    wrapper: 'w-card-w-micro h-card-h-micro min-w-0 min-h-0 overflow-hidden shrink-0',
    radius: 'rounded',
    value: 'text-[9px] leading-tight',
    suit: 'text-[7px] leading-none',
    suitCenter: 'text-[9px] leading-none',
    magic: 'text-[4px] leading-none',
  },
}

function getCardBorderClass(isCommitment: boolean, isRed: boolean): string {
  if (isCommitment) return 'border-2 border-purple-600 font-black'
  return isRed
    ? 'border border-neutral-300 border-l-[3px] border-l-red-400/60'
    : 'border border-neutral-300 border-l-[3px] border-l-neutral-600/40'
}

function getCardBackground(isCommitment: boolean): React.CSSProperties {
  if (isCommitment) {
    return { background: 'linear-gradient(165deg, rgba(243, 232, 255, 0.6) 0%, #ffffff 60%)' }
  }
  return { background: 'linear-gradient(165deg, #f9f9fb 0%, #ffffff 50%)' }
}

function getHoverShadow(isCommitment: boolean, isRed: boolean): string {
  if (isCommitment) return '0 4px 16px rgba(147, 51, 234, 0.3), 0 0 8px rgba(147, 51, 234, 0.15)'
  if (isRed) return '0 4px 14px rgba(220, 38, 38, 0.2), 0 0 6px rgba(220, 38, 38, 0.1)'
  return '0 4px 14px rgba(0, 0, 0, 0.18), 0 0 6px rgba(0, 0, 0, 0.08)'
}

export function Card({
  card,
  faceDown,
  onClick,
  disabled,
  highlight,
  small,
  sizeVariant = 'base',
  shake,
}: CardProps) {
  const variant: CardSizeVariant = sizeVariant ?? (small ? 'compact' : 'base')
  const size = SIZE_CLASSES[variant]
  const label = VALUE_LABELS[card.value] ?? String(card.value)
  const suitSymbol = SUIT_SYMBOLS[card.suit]
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  const reduceMotion = useReducedMotion()

  if (faceDown) {
    return (
      <motion.div
        role="img"
        aria-label="Card face down"
        className={`${size.radius} border-2 border-cedar/50 bg-felt overflow-hidden ${size.wrapper}`}
        whileHover={!disabled && !reduceMotion ? { scale: 1.05 } : undefined}
      >
        <CardBack />
      </motion.div>
    )
  }

  const isCommitment = card.isCommitmentCard
  const suitColorClass = highlight ? 'text-lebanon-red' : (isRed ? 'text-red-600' : 'text-black')
  const showCorner = sizeVariant !== 'extra-compact' && sizeVariant !== 'micro'
  const cornerClass = sizeVariant === 'compact' ? 'text-[7px]' : sizeVariant === 'micro' ? 'text-[5px]' : 'text-[8px]'
  const centerTopPad = showCorner ? 'pt-4' : 'pt-0.5'
  const borderClass = getCardBorderClass(!!isCommitment, isRed)
  const bgStyle = getCardBackground(!!isCommitment)
  const hoverShadow = getHoverShadow(!!isCommitment, isRed)

  const suitCenterStyle: React.CSSProperties = isCommitment
    ? { textShadow: '0 0 8px rgba(147, 51, 234, 0.4), 0 0 3px rgba(147, 51, 234, 0.2)' }
    : {}

  return (
    <motion.button
      type="button"
      style={bgStyle}
      className={`${size.radius} relative shadow shadow-neutral-200 flex flex-col items-center justify-center gap-0 min-h-0 p-0.5 transition-shadow ${size.wrapper} ${suitColorClass} ${borderClass} ${highlight ? 'ring-2 ring-cedar ring-offset-2 ring-offset-table shadow-lg' : ''} ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 card-hover-glow`}
      animate={
        shake && !reduceMotion
          ? { x: [-6, 6, -6, 6, 0], transition: { duration: 0.2 } }
          : { scale: highlight && !reduceMotion ? 1.03 : 1 }
      }
      whileHover={!disabled && !reduceMotion ? { scale: highlight ? 1.05 : 1.2, y: -6, zIndex: 10, boxShadow: hoverShadow } : undefined}
      whileTap={!disabled && !reduceMotion ? { scale: 0.98 } : undefined}
      transition={{ type: 'tween', duration: reduceMotion ? 0 : 0.2 }}
      onClick={onClick}
      disabled={disabled}
    >
      {showCorner && (
        <span className={`absolute top-0.5 left-0.5 font-bold leading-none ${cornerClass} ${suitColorClass}`} aria-hidden>
          {label}{suitSymbol}
        </span>
      )}
      <div className={`flex flex-col items-center justify-center gap-0 shrink-0 ${centerTopPad}`}>
        {isCommitment && (
          <span
            className={`${size.magic} font-black uppercase tracking-tight text-purple-600 -mb-0.5 flex items-center justify-center gap-0.5 shrink-0`}
            style={{ textShadow: '0 0 6px rgba(147, 51, 234, 0.5), 0 0 4px rgba(251, 191, 36, 0.3)' }}
          >
            <span aria-hidden className="scale-75">✨</span>
            <span aria-hidden>✦</span> Magic <span aria-hidden>✦</span>
            <span aria-hidden className="scale-75">✨</span>
          </span>
        )}
        <span className={`${isCommitment ? 'font-black' : 'font-bold'} ${size.value}`}>{label}</span>
        <span className={`${size.suitCenter} ${suitColorClass}`} style={suitCenterStyle}>{suitSymbol}</span>
      </div>
    </motion.button>
  )
}
