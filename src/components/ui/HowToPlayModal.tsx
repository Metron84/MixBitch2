interface HowToPlayModalProps {
  onClose: () => void
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      onClick={onClose}
    >
      <div
        className="rounded-2xl bg-felt border-2 border-cedar/50 border-t-4 border-t-lebanon-red p-6 max-w-md w-full shadow-xl max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="how-to-play-title" className="text-xl font-bold text-cedar-dark font-heading mb-4">
          How to play
        </h2>

        <section className="mb-4">
          <h3 className="text-cedar-dark font-semibold text-sm uppercase tracking-wide mb-2">
            Rules
          </h3>
          <p className="text-cedar-dark text-sm mb-2">
            Play cards that meet the current minimum, or collect the pile if you can&apos;t. <strong>Center circle</strong> shows the minimum (e.g. 7+, K+). <strong>Top-right:</strong> Deck and Pile counts.
          </p>
          <p className="text-cedar-dark text-sm mb-2">
            Tap cards to select, then <strong>Play</strong>. Or <strong>Can&apos;t play — Collect pile</strong>. <strong>2 on top</strong> = any card. <strong>Magic 4</strong> same-value cards clear the pile and you play again.
          </p>
          <p className="text-cedar-dark text-sm">
            <strong>Hand</strong> = play from here. <strong>Visible</strong> and <strong>Hidden</strong> = committed cards you’ll play from later.
          </p>
        </section>

        <section className="mb-4">
          <h3 className="text-cedar-dark font-semibold text-sm uppercase tracking-wide mb-2">
            Flow
          </h3>
          <p className="text-cedar-dark text-sm">
            Swap (optional) → Ready → Play in turns. Empty hand = draw; no deck = play from Visible, then Hidden. Don’t be last—the last player left is the <strong>Mix Bitch</strong>. After the game you’ll see who got out 1st, 2nd, 3rd, this game’s stats (magic cards, highlight), and options to share, play again, or change opponents.
          </p>
        </section>

        <p className="text-cedar-dark/70 text-xs italic mb-4">
          Full rules, indicators, and ending: tap <strong>Rules</strong> in the nav.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 min-h-[48px] rounded-xl bg-cedar text-white font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
          aria-label="Close how to play"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
