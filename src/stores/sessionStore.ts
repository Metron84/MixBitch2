import { create } from 'zustand'

const STORAGE_KEY = 'all-in-session-stats'
const BOT_RESULTS_KEY = 'all-in-bot-results'

export interface BotGameResult {
  bucketKey: string
  humanWon: boolean
  botNames: string[]
}

export type MatchMode = 'single' | 'best-of-3' | 'best-of-5'

export interface SessionStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  bestStreak: number
  /** Series only: number of completed best-of-3 or best-of-5 matches. */
  matchesPlayed?: number
  /** Series only: matches won (human reached matchTarget first). */
  matchesWon?: number
}

export type BucketKey = string

/** e.g. "single-2", "best-of-3-4". */
export function bucketKey(matchMode: MatchMode, playerCount: number): BucketKey {
  return `${matchMode}-${playerCount}`
}

/** All (mode × player count) bucket keys in display order. */
const PLAYER_COUNTS = [2, 3, 4] as const
const MATCH_MODES: MatchMode[] = ['single', 'best-of-3', 'best-of-5']

export function getAllBucketKeys(): BucketKey[] {
  const keys: BucketKey[] = []
  for (const n of PLAYER_COUNTS) {
    for (const mode of MATCH_MODES) {
      keys.push(bucketKey(mode, n))
    }
  }
  return keys
}

/** True if this bucket is a series (best-of-3 or best-of-5). */
export function isSeriesBucket(key: BucketKey): boolean {
  return key.startsWith('best-of-3-') || key.startsWith('best-of-5-')
}

/** Human-readable label for a bucket. */
export function bucketLabel(key: BucketKey): string {
  const idx = key.lastIndexOf('-')
  if (idx === -1) return key
  const modePart = key.slice(0, idx)
  const countNum = parseInt(key.slice(idx + 1), 10)
  if (Number.isNaN(countNum)) return key
  const modeLabel =
    modePart === 'single'
      ? 'Single game'
      : modePart === 'best-of-3'
        ? 'Best of 3'
        : modePart === 'best-of-5'
          ? 'Best of 5'
          : modePart
  return `${countNum} player${countNum !== 1 ? 's' : ''} · ${modeLabel}`
}

const EMPTY_STATS: SessionStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  matchesPlayed: 0,
  matchesWon: 0,
}

interface StoredState {
  buckets: Record<BucketKey, SessionStats>
  botGameResults: BotGameResult[]
}

function loadBotResults(): BotGameResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BOT_RESULTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (r): r is BotGameResult =>
          r && typeof r.bucketKey === 'string' && typeof r.humanWon === 'boolean' && Array.isArray(r.botNames)
      )
    }
    return []
  } catch {
    return []
  }
}

function saveBotResults(results: BotGameResult[]) {
  try {
    localStorage.setItem(BOT_RESULTS_KEY, JSON.stringify(results))
  } catch { /* quota */ }
}

export interface BotRankEntry {
  botName: string
  gamesPlayed: number
  userWins: number
  botWins: number
  botWinRate: number
}

function loadState(): StoredState {
  if (typeof window === 'undefined') return { buckets: {}, botGameResults: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { buckets: {}, botGameResults: loadBotResults() }
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.buckets === 'object' && parsed.buckets !== null) {
      const buckets: Record<string, SessionStats> = {}
      for (const [k, v] of Object.entries(parsed.buckets)) {
        if (v && typeof v === 'object' && typeof (v as SessionStats).gamesPlayed === 'number') {
          const s = v as SessionStats
          buckets[k] = {
            gamesPlayed: s.gamesPlayed,
            gamesWon: typeof s.gamesWon === 'number' ? s.gamesWon : 0,
            currentStreak: typeof s.currentStreak === 'number' ? s.currentStreak : 0,
            bestStreak: typeof s.bestStreak === 'number' ? s.bestStreak : 0,
            matchesPlayed: typeof (v as SessionStats).matchesPlayed === 'number' ? (v as SessionStats).matchesPlayed : 0,
            matchesWon: typeof (v as SessionStats).matchesWon === 'number' ? (v as SessionStats).matchesWon : 0,
          }
        }
      }
      return { buckets, botGameResults: loadBotResults() }
    }
    if (
      typeof parsed.gamesPlayed === 'number' ||
      typeof parsed.gamesWon === 'number' ||
      typeof parsed.currentStreak === 'number' ||
      typeof parsed.bestStreak === 'number'
    ) {
      const migrated: SessionStats = {
        gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
        gamesWon: typeof parsed.gamesWon === 'number' ? parsed.gamesWon : 0,
        currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
        bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
      }
      return { buckets: { overall: migrated }, botGameResults: loadBotResults() }
    }
    return { buckets: {}, botGameResults: loadBotResults() }
  } catch {
    return { buckets: {}, botGameResults: [] }
  }
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ buckets: state.buckets }))
    saveBotResults(state.botGameResults)
  } catch { /* quota or private browsing */ }
}

interface SessionStore extends StoredState {
  recordWin: (humanGotOut: boolean, matchMode: MatchMode, playerCount: number) => void
  recordMatchComplete: (humanWonMatch: boolean, matchMode: MatchMode, playerCount: number) => void
  recordGameResultForBots: (bucketKey: BucketKey, humanWon: boolean, botNames: string[]) => void
  getStatsForBucket: (matchMode: MatchMode, playerCount: number) => SessionStats
  getOverallStats: () => SessionStats
  getBucketKeys: () => BucketKey[]
  getBotRanking: () => BotRankEntry[]
  reset: () => void
  resetBucket: (key: BucketKey) => void
}

const initial = loadState()

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initial,

  recordWin: (humanGotOut, matchMode, playerCount) => {
    const key = bucketKey(matchMode, playerCount)
    set((s) => {
      const prev = s.buckets[key] ?? EMPTY_STATS
      const nextBucket: SessionStats = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: humanGotOut ? prev.gamesWon + 1 : prev.gamesWon,
        currentStreak: humanGotOut ? prev.currentStreak + 1 : 0,
        bestStreak: humanGotOut ? Math.max(prev.bestStreak, prev.currentStreak + 1) : prev.bestStreak,
      }
      const buckets = { ...s.buckets, [key]: nextBucket }
      const next = { buckets, botGameResults: s.botGameResults }
      saveState(next)
      return next
    })
  },

  recordMatchComplete: (humanWonMatch, matchMode, playerCount) => {
    if (matchMode === 'single') return
    const key = bucketKey(matchMode, playerCount)
    set((s) => {
      const prev = s.buckets[key] ?? EMPTY_STATS
      const matchesPlayed = (prev.matchesPlayed ?? 0) + 1
      const matchesWon = (prev.matchesWon ?? 0) + (humanWonMatch ? 1 : 0)
      const nextBucket: SessionStats = {
        ...prev,
        matchesPlayed,
        matchesWon,
      }
      const buckets = { ...s.buckets, [key]: nextBucket }
      const next = { buckets, botGameResults: s.botGameResults }
      saveState(next)
      return next
    })
  },

  recordGameResultForBots: (bucketKey, humanWon, botNames) => {
    if (botNames.length === 0) return
    set((s) => {
      const botGameResults = [...s.botGameResults, { bucketKey, humanWon, botNames }]
      const next = { ...s, botGameResults }
      saveState(next)
      return next
    })
  },

  getBotRanking: () => {
    const results = get().botGameResults
    const byBot = new Map<string, { userWins: number; botWins: number }>()
    for (const r of results) {
      for (const name of r.botNames) {
        const cur = byBot.get(name) ?? { userWins: 0, botWins: 0 }
        if (r.humanWon) cur.userWins += 1
        else cur.botWins += 1
        byBot.set(name, cur)
      }
    }
    const entries: BotRankEntry[] = Array.from(byBot.entries()).map(([botName, { userWins, botWins }]) => ({
      botName,
      gamesPlayed: userWins + botWins,
      userWins,
      botWins,
      botWinRate: userWins + botWins > 0 ? Math.round((botWins / (userWins + botWins)) * 100) : 0,
    }))
    return entries.sort((a, b) => b.botWinRate - a.botWinRate)
  },

  getStatsForBucket: (matchMode, playerCount) => {
    const key = bucketKey(matchMode, playerCount)
    const b = get().buckets[key]
    if (!b) return { ...EMPTY_STATS }
    return {
      ...EMPTY_STATS,
      ...b,
      matchesPlayed: b.matchesPlayed ?? 0,
      matchesWon: b.matchesWon ?? 0,
    }
  },

  getOverallStats: () => {
    const buckets = get().buckets
    let gamesPlayed = 0
    let gamesWon = 0
    let currentStreak = 0
    let bestStreak = 0
    for (const s of Object.values(buckets)) {
      gamesPlayed += s.gamesPlayed
      gamesWon += s.gamesWon
      currentStreak += s.currentStreak
      bestStreak = Math.max(bestStreak, s.bestStreak)
    }
    return { gamesPlayed, gamesWon, currentStreak, bestStreak }
  },

  getBucketKeys: () => {
    const keys = Object.keys(get().buckets)
    const order = (a: string, b: string) => {
      const lastDashA = a.lastIndexOf('-')
      const lastDashB = b.lastIndexOf('-')
      const nA = lastDashA === -1 ? 0 : parseInt(a.slice(lastDashA + 1), 10)
      const nB = lastDashB === -1 ? 0 : parseInt(b.slice(lastDashB + 1), 10)
      if (!Number.isNaN(nA) && !Number.isNaN(nB) && nA !== nB) return nA - nB
      const modeA = lastDashA === -1 ? a : a.slice(0, lastDashA)
      const modeB = lastDashB === -1 ? b : b.slice(0, lastDashB)
      const modeOrder: Record<string, number> = { single: 0, 'best-of-3': 1, 'best-of-5': 2 }
      return (modeOrder[modeA] ?? 0) - (modeOrder[modeB] ?? 0)
    }
    return keys.sort(order)
  },

  reset: () => {
    const next = { buckets: {}, botGameResults: [] }
    saveState(next)
    saveBotResults([])
    set(next)
  },

  resetBucket: (key) => {
    set((s) => {
      const { [key]: _, ...rest } = s.buckets
      const next = { buckets: rest, botGameResults: s.botGameResults }
      saveState(next)
      return next
    })
  },
}))
