# All In — Definitive Game Specification

> **Superseded by ALL_IN_FINAL_PROMPT.md** for full implementation. Use **EXECUTION_INSTRUCTIONS.md** for build order and checklist. This file is kept for reference.

**Purpose:** Single source of truth for implementation. All game logic, UI behavior, and build order must match this document.

**Project:** All In (card game)  
**Folder:** All In Game  
**Build order:** Front-end first, back-end second. Engine → Single-player UI → Local multiplayer → Backend & online.

---

## Current implementation summary

For a **complete inventory** of every screen, component, control, and data in the app, see **README.md**.

| Area | Implemented |
|------|-------------|
| **Views** | Game, Rules, Stats. Nav: All In, Rules, Stats, New game. |
| **Setup** | Player count (2/3/4), match mode (single, best-of-3, best-of-5), opponent selector (20 bots), Let's Play. |
| **Game** | Swap → Play → Finished. Header (How to play, Sound, Tutorial, Dark mode). Deck/pile, center play area, opponents row, human zone. Sequence hint, bot thinking + nudge, commitment effects, game log. |
| **End game** | Victory modal (Share, Play again / Next game / New match, Change opponents, Back to setup). Debrief (scripted or Ollama chat): Rematch, Next bot, End. |
| **Stats** | Overall (games played, got out, win rate, streaks). Podium (top 3 by mode/setting). All 9 buckets (2/3/4 players × single/bo3/bo5) with per-bucket and reset all. Persisted in localStorage. |
| **Stores** | gameStore (state, setup, matchState, playLog, toasts, etc.). sessionStore (buckets by matchMode–playerCount, recordWin, recordMatchComplete, getAllBucketKeys). |
| **Files** | Full list in README.md under "File structure". |

---

## 1. Locked Rules (Do Not Change)

| Rule | Value | Implementation note |
|------|--------|---------------------|
| draw | Immediate after successful play | Not a separate phase. If draw pile empty, skip draw. |
| firstPlayer | First ready in swap phase | Track playersReady; first to ready = first to play; then clockwise. |
| multipleCards | Same value allowed | Player may play 2+ cards of same value in one turn. |
| sequences | Exactly 3 in hand, consecutive values | J-Q-K, 10-J-Q, etc. Only when handCards.length === 3 and consecutive. |
| sequenceRequirement | Highest card in sequence | Next player must play ≥ Math.max(...sequence.map(c => c.value)). |
| card7 | Reverses turn order when 4–7 or 2+ Aces | Playable only when top is 4/5/6/7 OR pile has ≥2 Aces. Then flip turnDirection. When 7 is on top, next player restricted to 4/5/6/7 or commitment cards (2, 3, 10). |
| hiddenStage | Random card selection | When playing from hidden, pick one card at random; no player choice. |
| gameName | All In | App title, PWA name. |
| turnTimer | Optional UX feature | Modes: casual (no timer), blitz (30s), lightning (15s). |
| v1Backend | Node + Socket.io minimal | No Redis/Docker/PostgreSQL for v1. In-memory state. |

---

## 2. Core Data Structures

- **Card:** id, value (2–14), suit, isCommitmentCard, commitmentType?: 'reset'|'echo'|'reversal'|'void'
- **Player:** id, name, handCards, visibleCards, hiddenCards, commitmentLevel ('hand'|'visible'|'hidden'|'winner'), canPlay, isReady?
- **GameState:** id, players, currentPlayerIndex, turnDirection (1|-1), commitmentPile, drawPile, currentMinimum (number|null), phase ('setup'|'swap'|'play'|'finished'), winner?, firstPlayerIndex?
- **Mapping:** 2→reset, 3→echo, 7→reversal, 10→void

---

## 3. Draw Rule

After successful play only: current player draws one card from drawPile (if length > 0). No separate phase. When draw pile empty, no draw. After collect (failed play), no draw.

---

## 4. Swap Phase

Players swap only between handCards and visibleCards. First player to mark Ready = firstPlayerIndex; when phase becomes play, turn order starts at firstPlayerIndex and advances by turnDirection (initially 1 = clockwise).

---

## 5. Play Phase — Valid Plays

- Single: card.value >= currentMinimum (or currentMinimum === null).
- Multiple same value: all same value; next player meets that value.
- Sequence: only when handCards.length === 3, play is 3 consecutive values; next player meets Math.max(...playedCards).
- 7 (reversal): valid only when top of commitmentPile is 4/5/6/7 OR pile has ≥2 Aces. On play: flip turnDirection, then advance to next player by new direction. When 7 is on top, next player may only play 4, 5, 6, 7, or commitment cards (2, 3, 10).

---

## 6. Commitment Effects (Immediate)

- 2 reset: currentMinimum = null; pile stays. When a 2 is on top, any card (including 7) can be played with no restrictions.
- 3 echo: currentMinimum unchanged.
- 7 reversal: flip turnDirection.
- 10 void: clear pile; currentMinimum = null.
- **4 consecutive same value:** If the top 4 cards of the pile are the same value (e.g. one 8 on pile, player plays 3 more 8s; or player plays 4 kings in one turn), same as 10: clear pile; currentMinimum = null; same player plays again.
One commitment card per play.

---

## 7. Failed Play

Cannot play → current player collects entire commitmentPile; no draw; advance by turnDirection.

---

## 8. Win Condition

Empty hand → play from visible; empty visible → play from hidden; empty hidden → winner. When playing from hidden: card chosen at random from hiddenCards.

---

## 9. AI Personas

20 bot personas; see **README.md** and `src/data/botPersonas.ts` for the current list (names, archetypes, play styles, catchphrases). No real celebrity names.

---

## 10. v1 Backend

Node + Express + Socket.io; in-memory state. No Redis/Docker/PostgreSQL required.

---

## 11. Build Order

1. Engine (types + pure functions + tests)
2. Single-player UI (components, state, swap/play, AI)
3. Local multiplayer
4. Backend & online (Socket.io, one link)
5. Polish (tutorial, sound, PWA)

---

## 12. Implementation Checklist

- [ ] Draw once after successful play; none when pile empty or after collect.
- [ ] First ready in swap = first to play; advance by turnDirection.
- [ ] Same-value multiples and 3-card consecutive sequence; next meets highest.
- [ ] 7 only on 4/5/6/7 or 2+ Aces; reverses turnDirection. After 7, next player restricted to 4/5/6/7/2/3/10.
- [ ] Hidden: random card selection.
- [ ] 20 personas; Vibe/Rebel distinct.
- [ ] v1 = Node + Socket.io only.
- [ ] All buttons/links functional.
