# All In — Execution Instructions (for Agent/Cursor)

When building or updating All In, follow this order and these rules.

## Documentation
- **README.md** — Full app inventory: every view, screen, component, control, store, and file. Use it to leave nothing behind.
- **ALL_IN_FINAL_PROMPT.md** — Single spec for game logic, UI, and behavior.
- **SPEC.md** — Reference spec; superseded by ALL_IN_FINAL_PROMPT.md for conflicts. Contains a short "Current implementation summary" that points to README.

## Golden rules
1. **Front-end first, back-end second.** Implement UI and client behavior before API/server work.
2. **All buttons and links must work.** No dead controls; wire to real actions or clear placeholders.
3. **Run dev from project root:** `cd "All In Game"` then `npm run dev`.
4. **Every dependency in package.json.** No missing imports in production.

## Implementation order
1. **Core engine** — Types (GameState with `currentMinimum: number | null`), deal, swap, play, collect, commitment effects (2/10 → null), sequence = max value, 7 playable only on 4–6 or 2+ Aces. Tests for all rules.
2. **Basic UI** — Setup: player count 2–4, match mode (single / best-of-3 / best-of-5), opponent selector (20 bots). Game: GameBoard, Card, PlayArea, PlayerZones (hidden/visible/hand), swap + Ready, first ready = first player.
3. **Bots** — 20 personas from data, AI decision logic (commitment threshold, collect vs play), bot turn delay 800ms, thinking overlay, catchphrases. Nudge button if bot is slow.
4. **Multi-card** — Click-to-toggle same value, confirmation "Play N [value]s" + Cancel, validation, execute play, animation sequence (lift → arc → land → update pile → next player).
5. **Sequence hint** — When hand has exactly 3 consecutive cards, show banner "You can play X–Y–Z as a sequence", auto-hide 3s.
6. **Polish** — Animations, commitment effects (2/3/7/10 + 4× same value), error shake + toast, victory modal (Share, Play again / Next game / New match, Change opponents, Back to setup), debrief (scripted or Ollama). Session stats per bucket (matchMode–playerCount); record match completion for best-of-3/5.
7. **Sound** — Howler: card_play, collect_pile, commitment_card, victory, error, void, reversal, reset. Default on, volume 0.7.
8. **Responsive** — Mobile, tablet, desktop. Header: How to play, Sound, Tutorial, Dark mode. Rules page, Stats page (overall + podium + all 9 buckets, reset per bucket and reset all).

## Checklist before calling "done"
- [ ] currentMinimum is `number | null`; null after 2, 10, and game start.
- [ ] Sequence play sets currentMinimum = Math.max(...sequence).
- [ ] Card 7 only valid when top is 4/5/6/7 or 2+ Aces in pile.
- [ ] All commitment effects match ALL_IN_FINAL_PROMPT.md.
- [ ] Session stats: buckets by matchMode–playerCount; recordWin per game; recordMatchComplete when a best-of-3 or best-of-5 series ends.
- [ ] Stats page: overall summary, podium (top 3), full grid of all 9 mode×setting buckets, per-bucket reset, reset all. Stats persisted (e.g. localStorage).
- [ ] End-game: Victory modal and debrief; Play again / Next game / New match, Change opponents, Back to setup.
- [ ] All buttons/links functional; no placeholder href="#".
- [ ] README (and any other docs) updated if you add or remove features (see README for full inventory).