import { motion, useReducedMotion } from 'framer-motion'
import type { SessionStats } from '../../types/game'
import type { MatchState } from '../../stores/gameStore'
import type { GameStatsFromLog } from '../../lib/gameStats'
import { CedarTreeIcon } from './CedarTreeIcon'
import { ShareButton } from './ShareButton'

interface VictoryModalProps {
  loserName: string
  loserId: string
  humanPlayerId: string
  humanGotOut: boolean
  opponentName: string
  stats: SessionStats
  playerNames: string[]
  players: readonly { id: string; name: string }[]
  finishOrder: readonly string[]
  gameStats: GameStatsFromLog
  onPlayAgain: () => void
  onChangeOpponents: () => void
  onBackToSetup: () => void
  matchState?: MatchState | null
  isMatchOver?: boolean
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'] as const

function getFinishOrderLines(
  finishOrder: readonly string[],
  players: readonly { id: string; name: string }[],
  loserName: string
): string[] {
  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const lines: string[] = finishOrder.map((id, i) => {
    const name = nameById.get(id) ?? 'Someone'
    const ord = ORDINALS[i] ?? `${i + 1}th`
    return `${name} got out ${ord}`
  })
  lines.push(`${loserName} was last — Mix Bitch`)
  return lines
}

export function VictoryModal({
  loserName,
  loserId,
  humanPlayerId,
  humanGotOut,
  opponentName,
  stats,
  playerNames,
  players,
  finishOrder,
  gameStats,
  onPlayAgain,
  onChangeOpponents,
  onBackToSetup,
  matchState,
  isMatchOver,
}: VictoryModalProps) {
  const matchActive = matchState != null && matchState.mode !== 'single'
  const reduceMotion = useReducedMotion()
  const playersLine = playerNames.length > 0 ? playerNames.join(', ') : '—'
  const hasMagicBreakdown =
    gameStats.humanMagicByType.void > 0 ||
    gameStats.humanMagicByType.reset > 0 ||
    gameStats.humanMagicByType.reversal > 0 ||
    gameStats.humanMagicByType.echo > 0
  const humanPosition = finishOrder.indexOf(humanPlayerId) + 1
  const humanOrdinal = humanPosition > 0 ? (ORDINALS[humanPosition - 1] ?? `${humanPosition}th`) : null
  const finishLines = finishOrder.length > 0 ? getFinishOrderLines(finishOrder, players, loserName) : null
  const titleText = humanGotOut
    ? humanOrdinal
      ? `You got out ${humanOrdinal}!`
      : 'You got out!'
    : loserId === humanPlayerId
      ? 'You were last — Mix Bitch'
      : `${loserName} was last — Mix Bitch`
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      <motion.div
        className="rounded-2xl bg-felt border-2 border-cedar/50 border-t-4 border-t-lebanon-red p-6 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto"
        initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24 }}
      >
        <p className="text-base text-cedar-dark mb-2">Well played, everyone</p>
        <motion.h2
          id="victory-modal-title"
          className="text-2xl font-bold text-cedar-dark font-heading mb-2 flex items-center justify-center gap-2"
          initial={reduceMotion ? false : { scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        >
          {titleText}
          <motion.span
            className="text-cedar inline-flex"
            aria-hidden
            animate={reduceMotion ? undefined : { scale: [1, 1.2, 1] }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.35, duration: 0.5 }}
          >
            <CedarTreeIcon size={28} aria-hidden />
          </motion.span>
        </motion.h2>
        <div className="text-cedar-dark text-sm mb-3 opacity-90">
          <p className="font-medium">Players in this game</p>
          <p className="text-cedar-dark/90">{playersLine}</p>
          {finishLines && finishLines.length > 0 && (
            <p className="text-cedar-dark/90 mt-1.5 text-xs">
              {finishLines.join(' · ')}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-cedar/10 border border-cedar/30 px-3 py-2.5 mb-3 text-cedar-dark text-sm">
          <p className="font-medium mb-0.5">This game</p>
          <p>Magic cards used by you: {gameStats.humanMagicTotal}</p>
          {hasMagicBreakdown && (
            <p className="text-cedar-dark/90 text-xs mt-0.5">
              Reset: {gameStats.humanMagicByType.reset} · Echo: {gameStats.humanMagicByType.echo} · Reversal: {gameStats.humanMagicByType.reversal} · Void: {gameStats.humanMagicByType.void}
            </p>
          )}
          {gameStats.highlight && (
            <p className="mt-1.5 font-medium text-cedar-dark">Highlight: {gameStats.highlight}</p>
          )}
        </div>
        {matchActive && isMatchOver && (
          <div className="rounded-xl bg-cedar/10 border border-cedar/30 px-4 py-3 mb-4 text-center">
            <p className="text-lg font-bold text-cedar-dark font-heading">Match Complete!</p>
            <p className="text-cedar-dark text-base mt-1">
              Final Score: You {matchState.humanScore} – {matchState.botScore} Bot
            </p>
          </div>
        )}
        {matchActive && !isMatchOver && (
          <div className="rounded-xl bg-cedar/10 border border-cedar/30 px-4 py-2 mb-4 text-center">
            <p className="text-sm font-medium text-cedar-dark">
              Match: You {matchState.humanScore} – {matchState.botScore} Bot
            </p>
          </div>
        )}
        <div className="text-cedar-dark text-base space-y-1 mb-6 opacity-90">
          <p>Games played: {stats.gamesPlayed}</p>
          <p>Games won: {stats.gamesWon}</p>
          <p>Current streak: {stats.currentStreak}</p>
          <p>Best streak: {stats.bestStreak}</p>
        </div>
        <div className="mb-4">
          <ShareButton humanWon={humanGotOut} opponentName={opponentName} stats={stats} />
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full py-2.5 rounded-xl bg-cedar text-white font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
          >
            {matchActive
              ? isMatchOver
                ? 'New match'
                : `Next game (${matchState.humanScore}–${matchState.botScore})`
              : 'Play again (same opponents)'}
          </button>
          <button
            type="button"
            onClick={onChangeOpponents}
            className="w-full py-2.5 rounded-xl bg-felt border border-cedar/30 text-cedar-dark hover:border-cedar/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2"
          >
            Change opponents
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="w-full py-2 rounded-xl text-cedar-dark opacity-90 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar/50 focus-visible:ring-offset-2"
          >
            End game
          </button>
        </div>
      </motion.div>
    </div>
  )
}
