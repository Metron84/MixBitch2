import { useState, useRef, useEffect, useCallback } from 'react'
import {
  buildShareText,
  shareResult,
  getShareLinks,
  copyToClipboard,
  type ShareLink,
} from '../../lib/share'

interface ShareButtonProps {
  humanWon: boolean
  opponentName: string
  stats: { gamesPlayed: number; gamesWon: number; currentStreak: number }
}

export function ShareButton({ humanWon, opponentName, stats }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const text = buildShareText(humanWon, opponentName, stats)
  const links = getShareLinks(text)
  const canNativeShare =
    typeof navigator !== 'undefined' && !!navigator.share

  const dismiss = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        dismiss()
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, dismiss])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  async function handleNativeShare() {
    await shareResult(text)
    setOpen(false)
  }

  async function handleLink(link: ShareLink) {
    if (link.action === 'clipboard') {
      await copyToClipboard(text)
      setToast(
        link.platform === 'Instagram'
          ? 'Copied! Paste in Instagram'
          : 'Copied to clipboard!',
      )
      setOpen(false)
      return
    }
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full py-2.5 rounded-xl bg-white/80 border-2 border-cedar/50 text-cedar-dark font-semibold hover:bg-white hover:border-cedar focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt flex items-center justify-center gap-2"
      >
        <span aria-hidden>📤</span>
        Share result
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute bottom-full mb-2 left-0 right-0 rounded-xl bg-white border border-cedar/30 shadow-lg overflow-hidden z-10"
        >
          {canNativeShare && (
            <button
              type="button"
              role="menuitem"
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-cedar-dark hover:bg-cedar-light/60 focus:outline-none focus-visible:bg-cedar-light/60 border-b border-cedar/10"
            >
              <span className="text-base" aria-hidden>🔗</span>
              Share…
            </button>
          )}
          {links.map((link) => (
            <button
              key={link.platform}
              type="button"
              role="menuitem"
              onClick={() => handleLink(link)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-cedar-dark hover:bg-cedar-light/60 focus:outline-none focus-visible:bg-cedar-light/60 border-b border-cedar/10 last:border-b-0"
            >
              <span className="text-base" aria-hidden>
                {link.icon}
              </span>
              {link.platform}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-cedar text-white text-xs font-medium px-3 py-1.5 shadow-md"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
