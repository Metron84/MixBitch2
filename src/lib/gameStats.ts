import type { PlayLogEntry } from '../stores/gameStore'

const HUMAN_DISPLAY_NAME = 'You'

const COMMITMENT_SUFFIXES = [' — void', ' — reset', ' — reversal', ' — echo'] as const
const COMMITMENT_VALUES: Record<string, CommitmentType> = {
  '2': 'reset',
  '3': 'echo',
  '7': 'reversal',
  '10': 'void',
}
type CommitmentType = 'void' | 'reset' | 'reversal' | 'echo'

export interface GameStatsFromLog {
  humanMagicTotal: number
  humanMagicByType: { void: number; reset: number; reversal: number; echo: number }
  highlight: string | null
}

function isCommitmentPlay(summary: string): boolean {
  return COMMITMENT_SUFFIXES.some((s) => summary.endsWith(s)) || /^\d+× (2|3|7|10)$/.test(summary.trim())
}

function getCommitmentType(summary: string): CommitmentType | null {
  if (summary.endsWith(' — void')) return 'void'
  if (summary.endsWith(' — reset')) return 'reset'
  if (summary.endsWith(' — reversal')) return 'reversal'
  if (summary.endsWith(' — echo')) return 'echo'
  const multiMatch = summary.trim().match(/^\d+× (2|3|7|10)$/)
  if (multiMatch) return COMMITMENT_VALUES[multiMatch[1]] ?? null
  return null
}

/** Parse multi-card commitment play: "2× 7" -> { count: 2, type: 'reversal' }. */
function parseMultiCommitment(summary: string): { count: number; type: CommitmentType } | null {
  const m = summary.trim().match(/^(\d+)× (2|3|7|10)$/)
  if (!m) return null
  const type = COMMITMENT_VALUES[m[2]]
  return type ? { count: parseInt(m[1], 10), type } : null
}

/** Parse collect summary for pile size: "12 cards", "1 card", or "Collected (card to hand) · 5 cards". */
function parseCollectSize(summary: string): number | null {
  const match = summary.match(/(\d+)\s*card/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Derive per-game stats from playLog for the finished game.
 * humanName: display name of the human player (e.g. "You").
 */
export function getGameStatsFromPlayLog(
  playLog: PlayLogEntry[],
  humanName: string = HUMAN_DISPLAY_NAME
): GameStatsFromLog {
  const byType: GameStatsFromLog['humanMagicByType'] = {
    void: 0,
    reset: 0,
    reversal: 0,
    echo: 0,
  }
  let humanMagicTotal = 0

  for (const entry of playLog) {
    if (entry.action !== 'play' || entry.playerName !== humanName) continue
    if (!isCommitmentPlay(entry.summary)) continue
    const multi = parseMultiCommitment(entry.summary)
    if (multi) {
      humanMagicTotal += multi.count
      byType[multi.type] += multi.count
    } else {
      humanMagicTotal += 1
      const t = getCommitmentType(entry.summary)
      if (t) byType[t] += 1
    }
  }

  let highlight: string | null = null

  const collectEntries = playLog.filter((e) => e.action === 'collect')
  let maxCollect = 0
  let maxCollectPlayer: string | null = null
  for (const e of collectEntries) {
    const size = parseCollectSize(e.summary)
    if (size != null && size > maxCollect) {
      maxCollect = size
      maxCollectPlayer = e.playerName
    }
  }
  if (maxCollect > 0 && maxCollectPlayer) {
    highlight = `${maxCollectPlayer} collected ${maxCollect} card${maxCollect !== 1 ? 's' : ''}`
  }

  if (!highlight) {
    const firstCommitment = playLog.find((e) => e.action === 'play' && isCommitmentPlay(e.summary))
    if (firstCommitment) {
      const multi = parseMultiCommitment(firstCommitment.summary)
      const t = multi ? multi.type : getCommitmentType(firstCommitment.summary)
      if (t) highlight = `${firstCommitment.playerName} played ${t}`
    }
  }

  return { humanMagicTotal, humanMagicByType: byType, highlight }
}
