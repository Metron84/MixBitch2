import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface BotBubbleProps {
  playerName: string
  text: string
  /** Unique key so AnimatePresence can track entries */
  timestamp: number
}

export function BotBubble({ playerName, text, timestamp }: BotBubbleProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={timestamp}
        className="pointer-events-none max-w-[200px]"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        aria-hidden
      >
        <div className="relative rounded-xl bg-white/95 dark:bg-zinc-800/95 shadow-lg border border-cedar/20 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] font-semibold text-cedar-dark dark:text-cedar truncate leading-tight">
            {playerName}
          </p>
          <p className="text-xs text-text-secondary leading-snug mt-0.5 line-clamp-3">
            &ldquo;{text}&rdquo;
          </p>
          {/* Speech tail */}
          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white/95 dark:bg-zinc-800/95 border-b border-r border-cedar/20 rotate-45" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
