# All In

**Strategic card game:** empty your hand → visible cards → hidden cards. Play equal or higher, or collect the pile. Commitment cards (2, 3, 7, 10) change the game.

*Every decision brings you closer to your last hand.*

---

## Run

```bash
cd "All In Game"
npm install
npm run dev
```

Open **http://localhost:7710** (or use your machine’s LAN IP, e.g. **http://YOUR_IP:7710**, to reach it from another device on the same network).

## Build

```bash
npm run build
npm run preview
```

**Note:** The build generates a PWA service worker (Workbox). In some restricted environments the SW step can fail with a terser/rollup exit; run `npm run build` in a normal terminal if that happens.

## Test

```bash
npm run test:run
```

---

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Framer Motion**
- **Zustand** (game + session state)
- **Vitest** (unit tests)
- **vite-plugin-pwa** (manifest + service worker, offline caching)
- **Ollama** (optional, for AI debrief chat)

---

## App overview

### Views and navigation

| View   | Description |
|--------|--------------|
| **Game** | Main flow: setup → swap → play → finished (victory + debrief). |
| **Rules** | How to play: rules, flow, indicators, ending, stats. In-page links to sections; “Back to game” at top and bottom. |
| **Stats** | Session stats: overall summary, podium (top 3 mode/setting), and full grid of all modes & settings with per-bucket reset and “Reset all stats”. |

**Nav bar (all views):** “All In” (logo, goes to game), “Rules”, “Stats”, “New game”. New game clears the current game and returns to setup.

---

## Setup flow (Step 1 → Step 2)

### Step 1 — Player count & match mode

- **Player count:** 2, 3, or 4 players. Labels: Intimate (2), Cozy (3), Lively (4).
- **Match mode:** Single game, Best of 3, or Best of 5. Only affects scoring after the first game.
- **Start:** “Start game” advances to Step 2.
- **Mobile notice:** On small screens, a dismissible banner says the app is best on tablet/desktop. Dismissal is stored in `localStorage`.

### Step 2 — Choose opponents

- **Bots:** One human (You) + (playerCount − 1) bots. User must select exactly that many from the list.
- **List:** 20 personas (Amira, Khalil, Layla, Omar, Nour, Samir, Yasmin, Fadi, Rania, Tariq, Zara, Marwan, Lina, Bassam, Dina, Karim, Mira, Salam, Rana, Nadim). Each has name, archetype, play style, description, bullets, catchphrases.
- **Actions:** Tap a bot to select/deselect; “Randomize” fills slots with random bots; “Let’s Play!” starts the game (same opponents and match mode are kept for “Play again” / “Next game”).
- **Back:** Returns to Step 1 (player count + match mode).

---

## Game board

### Phases

1. **Swap** — Swap cards between hand and visible (up to 3). First player to tap “Ready” goes first; turn order then follows `turnDirection` (clockwise/counter-clockwise). Bots swap automatically.
2. **Play** — On your turn: play one or more valid cards, or collect the pile. After a successful play you draw one card (if the deck has any). Empty hand → play from visible; empty visible → play from hidden (hidden card chosen at random when played).
3. **Finished** — One player has emptied hand, visible, and hidden. Victory modal appears, then debrief.

### Header (during play)

- **Title:** “All In”. In series mode, “Match: You X – Y Bot”.
- **How to play** — Opens the How to Play modal (same content as Rules, condensed).
- **Sound** — Checkbox to enable/disable sound (Howler). Default on.
- **Tutorial** — Checkbox to show tutorial hints in the activity log.
- **Dark mode** — Toggle; preference stored and applied app-wide.
- **Phase** — Current phase label (swap / play / finished).

### Play area

- **Deck & pile counts** — Top-right: “Deck: N”, “Pile: N”.
- **Center** — Current minimum (e.g. “Any+”, “7+”, “K+”) and top of commitment pile. On your turn: “Play” and “Collect pile” (or “Play this card” when a hidden card is revealed).
- **Opponents** — One row of bot zones (hand/visible/hidden counts, commitment level). Last bot catchphrase can show in a bubble above.
- **Your zone** — Hand, visible, and hidden cards. Click/tap to select; multi-select same value for multi-card play; “Play N [value]s” or “Play” with confirmation.
- **Sequence hint** — When hand has exactly 3 consecutive cards (e.g. J–Q–K), a short-lived banner: “You can play J–Q–K as a sequence”.
- **Game log** — Desktop: top-left. Recent moves (who played or collected what). Tutorial toggle adds contextual hints.

### Bot turn

- **Thinking overlay** — “{Name} is thinking…” with optional catchphrase. After ~800 ms the bot acts.
- **Nudge** — If the bot is slow, a “Nudge {Name}” button appears to force the move.

### Commitment effects (visual + sound)

- **2 (reset), 3 (echo), 7 (reversal), 10 (void)** — Brief on-screen effect and distinct sounds (reset, reversal, void, etc.).
- **4× same value** — Same as 10: pile clears, same player plays again.

### Sounds (Howler)

- `card_play`, `collect_pile`, `commitment_card`, `victory`, `error`, `void`, `reversal`, `reset`. Volume 0.7, default on.

---

## End of game

### Victory modal

- **Title:** “You got out!” or “{Loser} was last”.
- **Match (if series):** “Match: You X – Y Bot” or “Match Complete! Final Score: …”.
- **Session stats (this bucket):** Games played, Games won, Current streak, Best streak.
- **Share** — ShareButton: copy/share result and stats.
- **Actions:**
  - **Play again** — Same opponents, next game (or “Next game (X–Y)” in a series; “New match” when the series is over).
  - **Change opponents** — Back to Step 2 with new random bots; player count unchanged.
  - **Back to setup** — Back to Step 1; match mode and session stats unchanged.

### Debrief (after closing victory modal)

- **Scripted mode** — Choose which bot to address; pick from preset replies; bot response from presets. “Rematch”, “Next bot”, “End”.
- **Ollama mode (optional)** — If Ollama is running locally with `llama3.1:latest`, debrief is a live chat: type message, bot responds in character. Same Rematch / Next bot / End.
- **Match in progress** — Debrief shows “Match: You X – Y Bot” or “Final Score: …” when the series is over.

---

## Stats page

- **Back to game** — Returns to game view (no data loss).
- **All games** — One summary: Games played, Got out (wins), Win rate %, Current streak, Best streak (all sessions, all buckets combined).
- **Podium — best by mode & setting** — Top 3 buckets ranked by win rate (game win rate for single; match win rate for best-of-3 / best-of-5). Shows 1st, 2nd, 3rd with bucket label and metric.
- **All modes & settings** — Fixed grid of 9 buckets: 2/3/4 players × Single game, Best of 3, Best of 5. Each card shows:
  - Bucket label (e.g. “2 players · Best of 3”).
  - **Reset** (per bucket).
  - If played: Games played, Got out, Win rate, Streak, Best streak; for series buckets also Matches played, Matches won, Match win rate.
  - If not played: “No games yet”.
- **Stats are saved automatically** — Stored in `localStorage` under `all-in-session-stats`. Survives refresh and new games.
- **Reset all stats** — Clears all buckets (only shown when there is at least one game played).

---

## Rules page

- **Back to game** (top and bottom).
- **Sections (with in-page links):** Rules, Flow, Indicators, Ending, Stats.
- **Content:** Full rules (play/collect, minimum, 2 on top, magic cards 2/3/7/10, magic 4× same value, zones, playing from hidden), flow (setup → swap → play → win), indicators (center circle, deck & pile, activity log, turn), ending (last player loses, debrief, next round options), and stats (persisted in browser, what each metric means). Tagline: “Good play sits at the intersection of risk and read.”

---

## PWA

- **Manifest:** Name “All In”, short_name “All In”, theme_color `#006233`, background_color, start_url `/`, display `standalone`. Icon: `/favicon.svg` (card + cedar + dual-mind mark).
- **Service worker:** Generated by Workbox (vite-plugin-pwa); precache of app assets; `registerType: 'autoUpdate'`.
- **Install:** Users can “Add to Home Screen” (mobile) or install from the browser (desktop). Offline caching is enabled after the first load.

---

## AI debrief (Ollama, optional)

- **Requirement:** [Ollama](https://ollama.com) installed and running; model `llama3.1:latest` pulled.
- **macOS:** `brew install ollama`, `ollama pull llama3.1:latest`, `ollama serve` (default port 11434).
- **Behavior:** When a game ends, the app checks Ollama. If available, the debrief is a live chat with the selected bot (in-character, streamed). If not, the scripted debrief (presets) is used. No setup is required to play; Ollama only enhances the debrief.

---

## Data and state

### Session store (Zustand + localStorage)

- **Key:** `all-in-session-stats`.
- **Shape:** `buckets: Record<BucketKey, SessionStats>`.
- **BucketKey:** `"{matchMode}-{playerCount}"` e.g. `single-2`, `best-of-3-4`. Modes: `single`, `best-of-3`, `best-of-5`. Player counts: 2, 3, 4 (fixed grid of 9 buckets).
- **SessionStats (per bucket):** `gamesPlayed`, `gamesWon`, `currentStreak`, `bestStreak`, and for series buckets `matchesPlayed`, `matchesWon`.
- **APIs:** `recordWin(humanGotOut, matchMode, playerCount)`, `recordMatchComplete(humanWonMatch, matchMode, playerCount)` (series only), `getStatsForBucket`, `getOverallStats`, `getBucketKeys`, `getAllBucketKeys`, `reset`, `resetBucket(key)`.

### Game store (Zustand)

- **State:** `state` (GameState | null), `setup` (player count + opponents), `lastSetup`, `matchState` (mode, humanScore, botScore, gamesInMatch, matchTarget), `playLog`, toasts, errors, bot thinking, commitment effect, etc.
- **Actions:** Setup (setPlayerCount, setMatchMode, setSetupOpponents, randomizeOpponents), startGameFromSetup, playAgainSameOpponents, changeOpponents, backToSetup; swap, ready; play, playHiddenCard, playHiddenRandom, collect; recordMatchResult; isMatchOver, matchWinner.

---

## File structure

```
All In Game/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── README.md                 ← this file (full app inventory)
├── SPEC.md                   ← game spec (reference)
├── ALL_IN_FINAL_PROMPT.md    ← definitive rules & spec
├── EXECUTION_INSTRUCTIONS.md ← build order & checklist
├── public/
│   └── favicon.svg           ← card + cedar + dual-mind icon
└── src/
    ├── main.tsx
    ├── App.tsx               ← view routing (game | rules | stats)
    ├── index.css
    ├── types/
    │   └── game.ts           ← Card, Player, GameState, BotPersona, etc.
    ├── stores/
    │   ├── gameStore.ts      ← game state, match state, actions
    │   └── sessionStore.ts   ← stats buckets, recordWin, recordMatchComplete
    ├── lib/
    │   ├── gameLogic.ts      ← createInitialState, swap, play, collect, etc.
    │   ├── validation.ts     ← isValidPlay, canPlay7, etc.
    │   ├── cardUtils.ts
    │   ├── constants.ts
    │   ├── ai.ts             ← bot decisions (calculateBotMove, applyBotMove)
    │   ├── archetypeConfig.ts
    │   ├── buildDebriefPrompt.ts
    │   ├── ollama.ts         ← checkOllamaAvailable, streamChat
    │   ├── sound.ts          ← Howler events
    │   ├── darkMode.ts
    │   ├── share.ts
    │   └── useMediaQuery.ts
    ├── data/
    │   ├── botPersonas.ts    ← 20 AI_PERSONAS
    │   └── debriefPresets.ts
    ├── components/
    │   ├── GameBoard.tsx     ← setup + swap + play + victory + debrief
    │   ├── NavBar.tsx
    │   ├── RulesPage.tsx
    │   ├── StatsPage.tsx
    │   ├── PlayerZone.tsx
    │   ├── PlayArea.tsx
    │   ├── Card.tsx
    │   ├── GameLog.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── setup/
    │   │   ├── PlayerCountScreen.tsx
    │   │   └── OpponentSelector.tsx
    │   └── ui/
    │       ├── VictoryModal.tsx
    │       ├── DebriefChat.tsx
    │       ├── DebriefModal.tsx
    │       ├── HowToPlayModal.tsx
    │       ├── ShareButton.tsx
    │       ├── TutorialPanel.tsx
    │       ├── SequenceHint.tsx
    │       ├── CommitmentEffect.tsx
    │       ├── BotBubble.tsx
    │       ├── CardBack.tsx
    │       └── CedarTreeIcon.tsx
    └── lib/gameLogic.test.ts
```

---

## Spec and implementation

- **Definitive rules and data structures:** **ALL_IN_FINAL_PROMPT.md**
- **Build order and checklist:** **EXECUTION_INSTRUCTIONS.md**
- **Legacy spec (superseded by ALL_IN_FINAL_PROMPT):** **SPEC.md**
