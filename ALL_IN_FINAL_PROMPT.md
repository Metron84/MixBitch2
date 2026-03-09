# All In — Final Implementation Specification (All Corrections Integrated)

For a **complete inventory** of every screen, component, control, and file in the current app, see **README.md**.

## Game Overview
Create "All In" - a strategic card game where players go through three stages: Hand (control) → Visible (planning) → Hidden (chance). Win by emptying hand, then visible, then hidden. Play equal or higher, or collect the pile. Commitment cards (2, 3, 7, 10) change the game.

## Brand
- **Name:** All In
- **Tagline:** "Every decision brings you closer to your last hand"
- **Tone:** Premium digital card room — sophisticated, accessible

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Zustand
- Howler.js (sound)
- Vitest + Playwright
- Node + Express + Socket.io (v1 minimal), in-memory state

---

## LOCKED DATA STRUCTURES

```typescript
interface Card {
  id: string;
  value: number; // 2-14 (J=11, Q=12, K=13, A=14)
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  isCommitmentCard: boolean;
  commitmentType?: 'reset' | 'echo' | 'reversal' | 'void'; // 2, 3, 7, 10
}

interface Player {
  id: string;
  name: string;
  type: 'human' | 'bot';
  persona?: BotPersona;
  handCards: Card[];
  visibleCards: Card[];
  hiddenCards: Card[];
  commitmentLevel: 'hand' | 'visible' | 'hidden' | 'winner';
  isActive: boolean;
  isReady?: boolean;
}

interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  turnDirection: 1 | -1; // 1 = clockwise, -1 = counterclockwise
  commitmentPile: Card[];
  drawPile: Card[];
  currentMinimum: number | null; // null = any card allowed
  phase: 'setup' | 'swap' | 'play' | 'finished';
  firstPlayerIndex?: number;
  winner?: string;
  gameSettings?: GameSettings;
  sessionStats?: SessionStats;
}

interface GameSettings {
  playerCount: number;
  turnTimer?: number | null;
  gameMode?: 'casual' | 'blitz' | 'lightning';
  soundEnabled?: boolean;
}

interface SessionStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
}
```

---

## LOCKED GAME RULES (NO CHANGES)

- **Draw:** One card immediately after a successful play. If draw pile empty, no draw. After collect, no draw.
- **First player:** First to mark Ready in swap phase plays first; then advance by turnDirection.
- **Multiple cards:** Same value allowed (e.g. 2 or 3 Jacks). Next requirement = that value.
- **Sequence:** Only when player has exactly 3 cards in hand and they form consecutive values (e.g. J-Q-K). **Next player must meet the HIGHEST card in the sequence.**
  - J-Q-K → next needs 13+ (King or Ace).
  - 4-5-6 → next needs 6+.
  - Implementation: `currentMinimum = Math.max(...sequence.map(c => c.value))`.
- **Card 7 (Reversal):** Reverses turn direction. Playable only when top card is 4, 5, 6, or 7 OR pile has 2+ Aces. When 7 is on top of the pile, the next player may only play 4, 5, 6, 7, or a commitment card (2, 3, 10). Normal cards 8+ are blocked.
- **Hidden stage:** When playing from hidden, card chosen at random (no player choice).
- **Commitment effects (definitive):**
  - **2 (reset):** currentMinimum = **null** (any card allowed). Pile remains.
  - **3 (echo):** currentMinimum unchanged (passthrough).
  - **7 (reversal):** Flip turnDirection. Only playable on 4/5/6/7 or 2+ Aces. When 7 is on top, next player restricted to 4/5/6/7 or commitment cards (2, 3, 10).
  - **10 (void):** commitmentPile = []. currentMinimum = **null** (any card allowed).
- **Game start:** currentMinimum = null (any card can start).
- **Failed play:** Player collects entire commitmentPile; no draw; advance to next player.
- **Win:** Empty hand → visible → hidden. First to empty all three wins.

---

## COMMITMENT CARD IMPLEMENTATION (CORRECTED)

```typescript
// After 2 or 10: currentMinimum = null (any card allowed)
const COMMITMENT_CARD_EFFECTS = {
  card2_reset: { currentMinimum: null, pileAction: 'remains' },
  card3_echo: { currentMinimum: 'unchanged', pileAction: 'remains' },
  card7_reversal: { currentMinimum: 'unchanged', turnDirection: 'flip', playableOnlyOn: [4,5,6,7] or '2plusAces', afterSevenRestriction: [4,5,6,7,2,3,10] },
  card10_void: { currentMinimum: null, commitmentPile: [] }
};

// Validation: when currentMinimum === null, any card is valid
function isValidPlay(card: Card, gameState: GameState): boolean {
  if (card.isCommitmentCard) {
    if (card.value === 7) return canPlay7(gameState); // 4-7 or 2+ Aces
    return true;
  }
  if (gameState.currentMinimum === null) return true;
  return card.value >= gameState.currentMinimum;
}

// Sequence requirement = highest card
function getSequenceRequirement(sequence: Card[]): number {
  return Math.max(...sequence.map(c => c.value));
}
```

---

## GAME FLOW

1. **Screen 1 – Player count:** How many players? [2] [3] [4] [5] [6]. One human (slot 1), rest bots. START GAME.
2. **Screen 2 (optional):** Opponent customization — show random bots, allow quick swap from 20-persona catalogue. "Let's Play!" → deal.
3. **Screen 3:** Game board. Swap phase (hand ↔ visible only, Ready) → first ready = first to play → play phase.

---

## AI BOT PERSONAS (20)

Sterling, Rebel, Phoenix, Duchess, Maverick, Sage, Wildcard, Titan, Starlet, Detective, Vibe, Comedian, Champion, Artist, Prodigy, Mystic, Rogue, Perfectionist, Survivor, Trendsetter, Legend. Each: name, archetype, playStyle, riskTolerance (0–1), aggressiveness (0–1), adaptability (0–1), catchphrases[]. Select random bots for empty slots; optional customization before start.

---

## AI DECISION LOGIC

- Commitment card use: threshold ~ `10 - (riskTolerance * 5)` (pile size) — conservative holds longer.
- Collect vs play: pile > 15 → tend to collect; pile < 5 → rarely collect; else use aggressiveness (aggressive bots collect less often).
- Bots play legally and optimally within personality; no bluffing. Catchphrases: always on commitment_card_play, victory, big_pile_collection; 30% on regular_play, close_call, turn_start.

---

## BOT TURN UX

- Thinking delay: 800ms before bot acts.
- Show: "🤔 {BotName} is thinking..." (optional subtle sound).
- Catchphrase when triggered (see above).

---

## MULTI-CARD PLAY

- Click-to-toggle same-value cards. First click selects one; further clicks add/remove same value only.
- Confirmation: "Selected: N [value]s" + "PLAY N [VALUE]S" + "Cancel".
- Validation: all same value, meets currentMinimum (or currentMinimum === null).
- Next requirement after play: that card value (or sequence = highest in sequence).
- Animation: lift (200ms) → arc to pile (400ms) → land (200ms) → update pile → next player indicator (~1000ms total). Single card ~300ms.

---

## SEQUENCE HINT

- When hand has exactly 3 cards and they form a consecutive sequence (e.g. J-Q-K): show subtle banner: "💡 You can play J–Q–K as a sequence". Auto-hide 3s.

---

## VISUAL STYLE

- **Vibe:** Premium digital card room. Colors: --bg-cosmos #0a0a0f, --bg-table #1a1a2e, --gold-primary #d4af37, --purple-magic #8b5cf6, --success #10b981, --danger #ef4444. Text: --text-primary #f8fafc.
- **Fonts:** Playfair Display (titles), Inter (UI, card values).
- **Cards:** border-radius 12px, aspect-ratio 2.5/3.5, shadow. Commitment cards: purple glow, subtle animation. Selected (multi): translateY(-8px), blue border. Valid play: green border; invalid: shake 200ms.
- **Motion:** Confident & smooth. Standard 300ms; multi-card/commitment up to 600–1000ms. Easing: cubic-bezier(0.4, 0, 0.2, 1).

---

## RESPONSIVE

- Mobile ≤640px: card 60px, padding 16, stacked vertical.
- Tablet 641–1023: card 80px, padding 24, hybrid layout.
- Desktop 1024+: card 100px, padding 32, side-by-side.

---

## ERROR & END GAME

- **Invalid play:** Card shake 200ms + toast 2s: "Play {currentMin}+ or collect the pile". Sound: gentle error.
- **Game end:** Modal "{Winner} wins!". Session stats: gamesPlayed, gamesWon, currentStreak. Actions: Play Again (same opponents), Change Opponents, Back to Setup.

---

## SOUND (Howler)

- Events: card_play (soft snap), collect_pile (sweep whoosh), commitment_card (magic chime), victory (short fanfare), error (gentle buzz). Default unmuted, max volume 0.7, tone subtle_premium.

---

## PROGRESSION (V1)

- Session only: gamesPlayed, gamesWon, currentStreak. No persistent DB. End-game options as above.

---

## FILE STRUCTURE

```
src/
├── components/game/     GameBoard, PlayerZones, PlayArea, Card, MultiCardSelector, BotTurnIndicator, SequenceHint
├── components/setup/    PlayerCountScreen, OpponentSelector
├── components/ui/       Button, Modal, Toast, SoundToggle
├── engine/              GameEngine, AIDecisionEngine, CardUtils, ValidationEngine
├── data/                botPersonas, gameConstants
├── stores/              gameStore, settingsStore, sessionStore
├── hooks/               useGameState, useSound, useMultiCardSelection
├── types/               game.ts (Card, Player, GameState with currentMinimum: number | null)
└── styles/              globals, animations
```

---

## CHECKLIST BEFORE SHIP

- [ ] currentMinimum: number | null; null after 2, 10, and game start.
- [ ] Sequence sets currentMinimum = Math.max(...sequence).
- [ ] Card 7 only playable when top is 4/5/6/7 or 2+ Aces. After 7, next player restricted to 4/5/6/7/2/3/10.
- [ ] All commitment effects and validation match this doc.
- [ ] Session stats and end-game actions implemented.
