/** Used for share links (e.g. Telegram, LinkedIn) — where the game will be sold. */
const SITE_URL = 'metronventures.com'

export function buildShareText(
  humanWon: boolean,
  opponentName: string,
  stats: { gamesPlayed: number; gamesWon: number; currentStreak: number },
): string {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0
  const outcome = humanWon
    ? `Just won Mix Bitch vs ${opponentName}! 🔥`
    : `Just lost Mix Bitch to ${opponentName}.`
  return `🃏 ${outcome} Streak: ${stats.currentStreak} | Win rate: ${winRate}%`
}

export async function shareResult(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }
  await copyToClipboard(text)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  }
}

export interface ShareLink {
  platform: string
  url: string | null
  icon: string
  action?: 'clipboard'
}

export function getShareLinks(text: string): ShareLink[] {
  const encoded = encodeURIComponent(text)
  const siteEncoded = encodeURIComponent(`https://${SITE_URL}`)

  return [
    {
      platform: 'WhatsApp',
      url: `https://wa.me/?text=${encoded}`,
      icon: '💬',
    },
    {
      platform: 'X / Twitter',
      url: `https://twitter.com/intent/tweet?text=${encoded}`,
      icon: '𝕏',
    },
    {
      platform: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,
      icon: '📘',
    },
    {
      platform: 'Telegram',
      url: `https://t.me/share/url?text=${encoded}&url=${siteEncoded}`,
      icon: '✈️',
    },
    {
      platform: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${siteEncoded}`,
      icon: '💼',
    },
    {
      platform: 'Instagram',
      url: null,
      icon: '📷',
      action: 'clipboard',
    },
    {
      platform: 'Copy link',
      url: null,
      icon: '📋',
      action: 'clipboard',
    },
  ]
}
