import {
  useSessionStore,
  bucketLabel,
  getAllBucketKeys,
  isSeriesBucket,
  type SessionStats,
} from '../stores/sessionStore'

interface StatsPageProps {
  onBackToGame: () => void
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <section className="rounded-2xl bg-felt border-2 border-cedar/40 dark:border-green-700/50 p-4 shadow-lg">
      <p className="text-cedar-dark/80 dark:text-green-300 text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold font-heading mt-1 ${
          highlight ? 'text-lebanon-red' : 'text-cedar-dark dark:text-green-100'
        }`}
      >
        {value}
      </p>
    </section>
  )
}

function rankScore(key: string, stats: SessionStats): number {
  if (isSeriesBucket(key)) {
    const played = stats.matchesPlayed ?? 0
    if (played === 0) return -1
    return (stats.matchesWon ?? 0) / played
  }
  if (stats.gamesPlayed === 0) return -1
  return stats.gamesWon / stats.gamesPlayed
}

function sortKeysByRank(keys: string[], getStats: (key: string) => SessionStats): string[] {
  return [...keys].sort((a, b) => {
    const sa = getStats(a)
    const sb = getStats(b)
    const scoreA = rankScore(a, sa)
    const scoreB = rankScore(b, sb)
    if (scoreB !== scoreA) return scoreB - scoreA
    const playedA = isSeriesBucket(a) ? (sa.matchesPlayed ?? 0) : sa.gamesPlayed
    const playedB = isSeriesBucket(b) ? (sb.matchesPlayed ?? 0) : sb.gamesPlayed
    return playedB - playedA
  })
}

function normalizedBucketStats(
  buckets: Record<string, SessionStats>,
  key: string
): SessionStats {
  const b = buckets[key]
  if (!b) return { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, bestStreak: 0, matchesPlayed: 0, matchesWon: 0 }
  return {
    gamesPlayed: b.gamesPlayed,
    gamesWon: b.gamesWon,
    currentStreak: b.currentStreak ?? 0,
    bestStreak: b.bestStreak ?? 0,
    matchesPlayed: b.matchesPlayed ?? 0,
    matchesWon: b.matchesWon ?? 0,
  }
}

export function StatsPage({ onBackToGame }: StatsPageProps) {
  const buckets = useSessionStore((s) => s.buckets)
  const getOverallStats = useSessionStore((s) => s.getOverallStats)
  const getBotRanking = useSessionStore((s) => s.getBotRanking)
  const getStatsForBucketByKey = (key: string) => normalizedBucketStats(buckets, key)
  const reset = useSessionStore((s) => s.reset)
  const resetBucket = useSessionStore((s) => s.resetBucket)

  const botRanking = getBotRanking()

  const overall = getOverallStats()
  const winRateOverall =
    overall.gamesPlayed > 0 ? Math.round((overall.gamesWon / overall.gamesPlayed) * 100) : 0
  const allBucketKeys = getAllBucketKeys()
  const podiumKeys = sortKeysByRank(allBucketKeys, getStatsForBucketByKey).filter(
    (k) => rankScore(k, getStatsForBucketByKey(k)) >= 0
  ).slice(0, 3)

  const hasAnyStats = overall.gamesPlayed > 0

  return (
    <main className="min-h-[calc(100vh-4rem)] p-6 flex flex-col items-center">
      <button
        type="button"
        onClick={onBackToGame}
        className="self-start flex items-center gap-1 text-cedar-dark dark:text-green-200 font-medium hover:text-lebanon-red focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 rounded mb-4"
        aria-label="Back to game"
      >
        ← Back to game
      </button>
      <div className="border-b-4 border-lebanon-red pb-2 mb-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-cedar-dark dark:text-green-100 font-heading">
          Your stats
        </h1>
      </div>

      {/* Overall summary */}
      <div className="w-full max-w-lg mb-8">
        <h2 className="text-sm font-semibold text-cedar-dark/80 dark:text-green-300 uppercase tracking-wide mb-3">
          All games
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Games played" value={overall.gamesPlayed} />
          <StatCard label="Got out" value={overall.gamesWon} />
          <StatCard label="Win rate" value={winRateOverall + '%'} />
          <StatCard label="Current streak" value={overall.currentStreak} highlight />
          <StatCard label="Best streak" value={overall.bestStreak} />
        </div>
      </div>

      {/* Podium: 1st, 2nd, 3rd across all modes & settings */}
      {podiumKeys.length > 0 && (
        <div className="w-full max-w-lg mb-8">
          <h2 className="text-sm font-semibold text-cedar-dark/80 dark:text-green-300 uppercase tracking-wide mb-3">
            Podium — best by mode & setting
          </h2>
          <div className="flex items-end justify-center gap-2 sm:gap-4">
            {[1, 0, 2].map((i) => {
              if (i >= podiumKeys.length) return null
              const key = podiumKeys[i]
              const stats = getStatsForBucketByKey(key)
              const place = i === 0 ? 2 : i === 1 ? 1 : 3
              const label = isSeriesBucket(key)
                ? `${(stats.matchesPlayed ?? 0) > 0 ? Math.round(((stats.matchesWon ?? 0) / (stats.matchesPlayed ?? 1)) * 100) : 0}% match win`
                : `${stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}% got out`
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center rounded-t-2xl border-2 border-cedar/40 dark:border-green-700/50 bg-felt p-4 shadow-lg ${
                    place === 1 ? 'order-2 h-28' : place === 2 ? 'order-1 h-24' : 'order-3 h-24'
                  }`}
                >
                  <span className="text-cedar-dark/80 dark:text-green-300 text-xs font-medium">
                    {place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'}
                  </span>
                  <span className="font-semibold text-cedar-dark dark:text-green-100 text-sm mt-1 text-center">
                    {bucketLabel(key)}
                  </span>
                  <span className="text-xs text-cedar-dark/70 dark:text-green-400 mt-0.5">
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bot ranking — opponents vs you (toughest first) */}
      {botRanking.length > 0 && (
        <div className="w-full max-w-lg mb-8">
          <h2 className="text-sm font-semibold text-cedar-dark/80 dark:text-green-300 uppercase tracking-wide mb-3">
            Bot ranking — vs you
          </h2>
          <p className="text-cedar-dark/70 dark:text-green-400 text-sm mb-3">
            Toughest opponents first (by how often they beat you).
          </p>
          <ul className="rounded-2xl bg-felt border-2 border-cedar/40 dark:border-green-700/50 divide-y divide-cedar/30 dark:divide-green-700/40 overflow-hidden shadow-lg">
            {botRanking.map((entry, i) => (
              <li
                key={entry.botName}
                className="flex items-center justify-between gap-4 px-4 py-3 text-cedar-dark dark:text-green-100"
              >
                <span className="font-medium">
                  {i + 1}. {entry.botName}
                </span>
                <span className="text-sm text-cedar-dark/80 dark:text-green-300">
                  {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} · You {entry.userWins} – {entry.botWins} bot · {entry.botWinRate}% their wins
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All modes & settings — full grid */}
      <div className="w-full max-w-lg space-y-6">
        <h2 className="text-sm font-semibold text-cedar-dark/80 dark:text-green-300 uppercase tracking-wide">
          All modes & settings
        </h2>
        {allBucketKeys.map((key) => {
          const stats = getStatsForBucketByKey(key)
          const played = stats.gamesPlayed > 0 || (stats.matchesPlayed ?? 0) > 0
          const winRate =
            stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
          const matchRate =
            (stats.matchesPlayed ?? 0) > 0
              ? Math.round(((stats.matchesWon ?? 0) / (stats.matchesPlayed ?? 1)) * 100)
              : null
          return (
            <div
              key={key}
              className="rounded-2xl bg-felt border-2 border-cedar/40 dark:border-green-700/50 p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-cedar-dark dark:text-green-100">
                  {bucketLabel(key)}
                </span>
                <button
                  type="button"
                  onClick={() => resetBucket(key)}
                  className="text-xs text-cedar-dark/70 hover:text-lebanon-red focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar rounded px-2 py-1"
                >
                  Reset
                </button>
              </div>
              {played ? (
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Games played" value={stats.gamesPlayed} />
                  <StatCard label="Got out" value={stats.gamesWon} />
                  <StatCard label="Win rate" value={winRate + '%'} />
                  <StatCard label="Streak" value={stats.currentStreak} highlight />
                  <StatCard label="Best streak" value={stats.bestStreak} />
                  {isSeriesBucket(key) && (
                    <>
                      <StatCard label="Matches played" value={stats.matchesPlayed ?? 0} />
                      <StatCard label="Matches won" value={stats.matchesWon ?? 0} />
                      <StatCard
                        label="Match win rate"
                        value={matchRate !== null ? matchRate + '%' : '—'}
                      />
                    </>
                  )}
                </div>
              ) : (
                <p className="text-cedar-dark/60 dark:text-green-500/80 text-sm">No games yet</p>
              )}
            </div>
          )
        })}
      </div>

      {!hasAnyStats && (
        <p className="text-cedar-dark/70 dark:text-green-400 text-sm mt-2">
          No games played yet. Finish a round to see your stats here.
        </p>
      )}

      <p className="text-cedar-dark/70 dark:text-green-400 text-sm mt-6">
        Stats are saved automatically.
      </p>
      {hasAnyStats && (
        <button
          type="button"
          onClick={reset}
          className="mt-3 px-4 py-2 rounded-xl bg-felt border border-danger/40 text-danger text-sm hover:border-danger/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
        >
          Reset all stats
        </button>
      )}
    </main>
  )
}
