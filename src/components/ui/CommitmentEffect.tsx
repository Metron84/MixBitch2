import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useGameStore, type CommitmentEffect as CommitmentEffectData } from '../../stores/gameStore'

function VoidEffect() {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-purple-400/60"
            initial={{ width: 20, height: 20, opacity: 0.8 }}
            animate={{ width: 280, height: 280, opacity: 0 }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
      <motion.p
        className="absolute inset-0 flex items-center justify-center text-3xl font-bold font-heading text-white tracking-widest drop-shadow-lg"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3, exit: { duration: 0.25 } }}
      >
        VOID
      </motion.p>
      <motion.div
        className="absolute inset-0 bg-purple-900/20 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}

function ReversalEffect() {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          className="text-4xl text-cedar"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 360, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          ⟲
        </motion.span>
        <motion.span
          className="text-4xl text-cedar"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: -360, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          ⟳
        </motion.span>
      </motion.div>
      <motion.p
        className="absolute inset-0 flex items-center justify-center pt-16 text-2xl font-bold font-heading text-cedar-dark tracking-wider drop-shadow-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      >
        REVERSAL
      </motion.p>
    </>
  )
}

function ResetEffect() {
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-white/15 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6, times: [0, 0.3, 1] }}
      />
      <motion.p
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold font-heading text-lebanon-red tracking-wider drop-shadow-md"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        RESET — Any card
      </motion.p>
    </>
  )
}

function EchoEffect() {
  return (
    <>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute rounded-full border border-cedar/40"
          initial={{ width: 40, height: 40, opacity: 0.6 }}
          animate={{ width: 180, height: 180, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </motion.div>
      <motion.p
        className="absolute inset-0 flex items-center justify-center text-xl font-bold font-heading text-cedar tracking-widest drop-shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 1, times: [0, 0.3, 1] }}
      >
        ECHO
      </motion.p>
    </>
  )
}

const effectComponents: Record<CommitmentEffectData['type'], () => JSX.Element> = {
  void: VoidEffect,
  reversal: ReversalEffect,
  reset: ResetEffect,
  echo: EchoEffect,
}

export function CommitmentEffect() {
  const effect = useGameStore((s) => s.lastCommitmentEffect)
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return null

  return (
    <AnimatePresence>
      {effect && (
        <motion.div
          key={effect.timestamp}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          {(() => {
            const Comp = effectComponents[effect.type]
            return <Comp />
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
