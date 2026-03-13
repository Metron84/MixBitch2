interface RulesPageProps {
  onBackToGame: () => void
}

const SECTION_IDS = ['rules', 'flow', 'indicators', 'ending', 'stats'] as const

export function RulesPage({ onBackToGame }: RulesPageProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 pb-8 flex flex-col max-w-md mx-auto">
      <button
        type="button"
        onClick={onBackToGame}
        className="self-start flex items-center gap-1 text-cedar-dark dark:text-green-200 font-medium hover:text-lebanon-red focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 rounded mb-4 min-h-[44px] min-w-[44px] -ml-2 pl-2 pr-3"
        aria-label="Back to game"
      >
        ← Back to game
      </button>

      <div className="border-b-4 border-lebanon-red pb-2 mb-4">
        <h1 className="text-2xl font-bold text-cedar-dark dark:text-green-100 font-heading">How to play</h1>
      </div>

      <nav className="flex flex-wrap gap-x-3 gap-y-1 mb-6 text-sm" aria-label="Rules sections">
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="text-cedar-dark dark:text-green-200 font-medium hover:text-lebanon-red underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 rounded"
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </nav>

      {/* 1. Rules */}
      <section id="rules" className="mb-6 scroll-mt-4">
        <h2 className="text-cedar-dark font-semibold text-base uppercase tracking-wide mb-3">
          Rules
        </h2>
        <p className="text-cedar-dark text-sm mb-3">
          Be the first to get rid of all your cards. You play in turns. On your turn you must either <strong>play</strong> one or more cards that meet the current minimum, or <strong>collect the pile</strong> if you have no valid play. Cards you collect go into your hand.
        </p>
        <p className="text-cedar-dark text-sm mb-2">
          <strong>Playing:</strong> Tap cards from your hand to select them. The <span className="text-lebanon-red font-medium">value in red</span> is the rank (2–10, J, Q, K, A). Tap <strong>Play</strong> to play your selection. You can play multiple cards of the same value (e.g. 2× 8) or a run of three consecutive cards when the rules allow.
        </p>
        <p className="text-cedar-dark text-sm mb-2">
          <strong>2 on top:</strong> When a 2 is on the pile, any card can be played—no minimum.
        </p>

        <h3 className="text-cedar-dark font-semibold text-sm mt-3 mb-2">Magic cards</h3>
        <ul className="text-cedar-dark text-sm space-y-1.5 list-disc list-inside mb-2">
          <li><strong>2 — Reset:</strong> Minimum is cleared (any card can be played next). Pile stays.</li>
          <li><strong>3 — Echo:</strong> Repeats the previous card’s effect (minimum stays as it was).</li>
          <li><strong>7 — Reversal:</strong> Turn order flips (clockwise ↔ counter-clockwise). When a 7 is on top, only 4, 5, 6, or 7 (or 2, 3, 10 as jokers) can be played; 7 is only playable in certain situations (e.g. when the top card is in the 4–7 range or there are 2+ aces on the pile).</li>
          <li><strong>10 — Void:</strong> Pile clears, minimum is cleared, and you play again.</li>
          <li><strong>Magic 4:</strong> If there are <strong>4 consecutive cards of the same value</strong> on top (e.g. four 8s), the pile clears and you play again—same as a 10.</li>
        </ul>

        <p className="text-cedar-dark text-sm mb-2">
          <strong>Your zones:</strong> <strong>Hand</strong> = cards you play from. <strong>Visible</strong> and <strong>Hidden</strong> are committed cards you move to during the game; you’ll play from them later when you reach those levels.
        </p>
        <p className="text-cedar-dark text-sm">
          <strong>Playing from hidden:</strong> When it’s your turn and you’re on the hidden level, tap a face-down hidden card to select it. The card is revealed to everyone in the center; you must then play that card (tap <strong>Play this card</strong>). If it can’t be played, you collect the pile and the card moves to your hand. Bots play a random hidden card when on hidden.
        </p>
      </section>

      {/* 2. Flow */}
      <section id="flow" className="mb-6 scroll-mt-4">
        <h2 className="text-cedar-dark font-semibold text-base uppercase tracking-wide mb-3">
          Flow
        </h2>
        <ol className="text-cedar-dark text-sm space-y-2 list-decimal list-inside">
          <li><strong>Setup:</strong> Choose how many players (2–4). You plus bots. Each player gets a hand; the rest is the deck.</li>
          <li><strong>Swap:</strong> Swap up to 3 cards between your hand and your visible row. When done, tap <strong>Ready</strong>. Bots do the same automatically.</li>
          <li><strong>Play:</strong> Turns go in order. On your turn: play cards that meet the current minimum, or collect the pile. When your hand is empty you draw from the deck; when the deck is empty you move to playing from <strong>Visible</strong>, then <strong>Hidden</strong>.</li>
          <li><strong>Win:</strong> First player with no cards left (hand, visible, and hidden) wins.</li>
        </ol>
      </section>

      {/* 3. Indicators */}
      <section id="indicators" className="mb-6 scroll-mt-4">
        <h2 className="text-cedar-dark font-semibold text-base uppercase tracking-wide mb-3">
          Indicators
        </h2>
        <p className="text-cedar-dark text-sm mb-2">
          <strong>Center circle:</strong> Shows the <strong>Current</strong> minimum you must meet (e.g. Any+, 7+, K+). When there’s a card on the pile, that card is shown. The number on top is the minimum to beat.
        </p>
        <p className="text-cedar-dark text-sm mb-2">
          <strong>Deck &amp; Pile:</strong> On desktop, top-right. On mobile, left of the center: <strong>Deck</strong> = cards left to draw; <strong>Pile</strong> = cards currently in the commitment pile.
        </p>
        <p className="text-cedar-dark text-sm mb-2">
          <strong>Activity log:</strong> On desktop, top-left; on mobile, right of the center. Each line is a move: who played or collected what. Turn on <strong>Tutorial</strong> in the header for a short explanation of what you can and cannot do on your turn.
        </p>
        <p className="text-cedar-dark text-sm">
          <strong>Turn:</strong> The current player’s name/zone is highlighted. When it’s your turn, your hand (and play/collect buttons) are active.
        </p>
      </section>

      {/* 4. Ending */}
      <section id="ending" className="mb-6 scroll-mt-4">
        <h2 className="text-cedar-dark font-semibold text-base uppercase tracking-wide mb-3">
          Ending
        </h2>
        <p className="text-cedar-dark text-sm mb-2">
          The game ends when everyone is done except one—that player is last and is the <strong>Mix Bitch</strong>. You’ll see the result: who got out 1st, 2nd, 3rd (depending on player count), and who was last (Mix Bitch). The post-game screen shows <strong>this game’s stats</strong> (players, magic cards you used, a highlight), your session stats, and options to share, play another round, choose different opponents, or end the game.
        </p>
        <p className="text-cedar-dark text-sm mb-2">
          After the result you can play another round with the same opponents, choose different opponents, or go back to setup.
        </p>
      </section>

      {/* 5. Stats */}
      <section id="stats" className="mb-6 scroll-mt-4">
        <h2 className="text-cedar-dark font-semibold text-base uppercase tracking-wide mb-3">
          Stats
        </h2>
        <p className="text-cedar-dark text-sm mb-2">
          After each game you see <strong>this game’s stats</strong>: players in the game, magic cards you used (with a breakdown by type), and a highlight (e.g. biggest collect or a commitment moment). Your <strong>session stats</strong> are saved automatically and shown in <strong>Stats</strong> (nav): overall summary plus a breakdown by mode and player count (single game, best of 3, best of 5 × 2, 3, or 4 players). A podium shows your top three mode/setting combinations by win rate.
        </p>
        <ul className="text-cedar-dark text-sm space-y-1.5 list-disc list-inside mb-2">
          <li><strong>Games played / Got out:</strong> Total games and how many you won (got out; not last).</li>
          <li><strong>Win rate:</strong> Got out ÷ games played, as a percentage.</li>
          <li><strong>Current streak / Best streak:</strong> Consecutive wins (resets when you’re last—Mix Bitch) and your best ever streak.</li>
          <li><strong>Matches (best-of-3/5):</strong> For series modes, matches played and matches won; match win rate is shown per bucket. You can reset a single bucket or all stats.</li>
        </ul>
      </section>

      <p className="text-cedar-dark/70 text-xs italic mb-4" aria-hidden>
        Good play sits at the intersection of risk and read.
      </p>

      <button
        type="button"
        onClick={onBackToGame}
        className="w-full py-3 min-h-[48px] rounded-xl bg-cedar text-white font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cedar focus-visible:ring-offset-2 focus-visible:ring-offset-felt"
      >
        Back to game
      </button>
    </main>
  )
}
