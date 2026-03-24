# PianoVibe — PRD 1 Execution Plan: Core Game Engine & Play Mode (TDD)

**Version:** 1.0  
**Date:** 2026-03-24  
**Branch:** `feat/piano-game-engine`  
**Status:** Builder-ready  

---

## Quick Reference

| Phase | Iterations | Primary Concern |
|-------|-----------|-----------------|
| Pure Logic TDD | 1–3 | Zero Phaser deps, full test coverage |
| Phaser Integration | 4 | Scenes, objects, game loop wiring |
| Polish + React Shell | 5 | Visual feedback, practice tools, App entry |

**Golden rule:** Every pure-logic module (Scorer, StreakManager, HitDetector, NoteSpawner logic) **must never import from `phaser`**. Vitest runs in Node — any Phaser import will crash the test suite.

---

## Pre-Flight Checks

Before writing any code, confirm:

```bash
# Verify current branch
git branch --show-current
# Expected: feat/piano-game-engine

# Verify node_modules present
ls node_modules/phaser node_modules/vitest
# Expected: both directories exist

# Verify test runner works (will pass with 0 tests initially)
npm run test
# Expected: exit 0, "No test files found"

# Verify build baseline
npm run build
# Expected: exit 0
```

---

## Infrastructure Fix (do first, before any iteration)

### Fix vite.config.ts — Vitest TypeScript Types

**Problem:** `vite.config.ts` imports `defineConfig` from `'vite'` but uses a `test:` block. TypeScript cannot type-check the `test` block without `vitest/config`. This is a latent type error that will surface when adding test configuration options.

**Fix:**

```typescript
// vite.config.ts — REPLACE the entire file with:
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/core/**', 'src/phaser/systems/**'],
    },
  },
})
```

**Why `vitest/config` instead of `vite`:** `vitest/config` re-exports everything from `vite` plus the `UserConfig['test']` schema. Zero functional change, full TypeScript coverage for test options.

**Verify:**
```bash
npx tsc --noEmit
npm run test
# Expected: 0 errors, 0 test files (clean baseline)
```

---

## ITERATION 1 — Infrastructure & Core Foundation

**Goal:** All shared types, constants, EventBus, and GameState exist, are tested, and pass `npm run test`.

**Commit target:** `feat: core infrastructure — Constants, EventBus, GameState with tests`

---

### Step 1.1 — Create `src/core/types.ts`

**Purpose:** Single source of truth for all shared TypeScript interfaces. No imports from Phaser. No imports from anything else in `src/` (this is the foundation).

**File:** `src/core/types.ts`

```typescript
// ─── Enums & Literals ────────────────────────────────────────────────────────

export type GameMode = 'performance' | 'practice';
export type HandMode = 'both' | 'left' | 'right';
export type TimingPreset = 'beginner' | 'standard' | 'hard';
export type Hand = 'left' | 'right';

export type TimingGrade = 'Perfect' | 'Good' | 'OK' | 'Miss' | 'Wrong';
export type SongGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export type GamePhase =
  | 'TITLE'
  | 'SONG_SETUP'
  | 'GAMEPLAY'
  | 'PRACTICE'
  | 'PAUSED'
  | 'SONG_COMPLETE'
  | 'VIEW_RECAP';

// ─── Core Data Shapes ────────────────────────────────────────────────────────

export interface GameReadyNote {
  id: string;
  pitch: string;       // e.g. "C4", "F#3"
  midiNote: number;    // 0–127
  time: number;        // seconds from song start
  duration: number;    // seconds
  velocity: number;    // 0–1
  hand: Hand;
  finger?: number;     // 1–5 for bundled songs
  isChord?: boolean;   // true if simultaneous with another note
}

export interface HitResult {
  grade: TimingGrade;
  points: number;
  noteId: string;
  isEarly: boolean;
  accuracyMs: number;  // how many ms from perfect center (signed, negative = early)
}

export interface StreakState {
  count: number;
  multiplier: number;
  maxStreak: number;
}

export interface ScoreResult {
  totalScore: number;
  notesHit: number;
  notesMissed: number;
  notesTotal: number;
  accuracy: number;    // 0–1
  grade: SongGrade;
  xpEarned: number;
  bestStreak: number;
}

// ─── GameState Shape ─────────────────────────────────────────────────────────

export interface GameStateData {
  // Profile
  currentProfileId: string | null;

  // Song
  currentSongId: string | null;
  currentSongData: GameReadyNote[] | null;

  // Phase
  phase: GamePhase;
  isPlaying: boolean;
  isPaused: boolean;
  mode: GameMode;

  // Scoring (live)
  score: number;
  streak: number;
  maxStreak: number;
  notesHit: number;
  notesMissed: number;
  notesTotal: number;

  // Settings
  timingPreset: TimingPreset;
  timingWindowMs: number;
  handMode: HandMode;
  speed: number;         // 0.25–1.5

  // Practice
  loopStart: number | null;   // seconds
  loopEnd: number | null;     // seconds
}

// ─── Input / Events ──────────────────────────────────────────────────────────

export interface InputEvent {
  type: 'noteOn' | 'noteOff';
  pitch: string;
  midiNote: number;
  velocity: number;
  timestamp: number;
  source: 'mic' | 'touch' | 'midi';
  confidence?: number;
}

export interface GameStartData {
  songId: string;
  songData: GameReadyNote[];
  mode: GameMode;
  speed: number;
  handMode: HandMode;
  timingPreset: TimingPreset;
}

export interface GameEndData {
  results: ScoreResult;
}

// ─── Spawn Scheduling ────────────────────────────────────────────────────────

export interface SpawnScheduleEntry {
  noteId: string;
  noteData: GameReadyNote;
  spawnAtMs: number;   // game clock ms when this note should be spawned
  targetMs: number;    // game clock ms when note should cross the play line
}
```

**No test file needed for types.ts** — TypeScript compilation is the test. The compiler will catch interface mismatches across the codebase.

---

### Step 1.2 — Create `src/core/Constants.ts`

**Purpose:** ALL magic numbers in one place. Any config value referenced more than once lives here. Pure data — no logic, no imports.

**File:** `src/core/Constants.ts`

```typescript
// src/core/Constants.ts — copy verbatim from ARCHITECTURE.md §4.4
// Key additions vs the architecture draft:
// - GAME.PLAY_LINE_Y_OFFSET (80px from bottom)
// - TIMING grade percentage constants
// - SCORING.XP values matching PRD 1 §5.5
// - PRACTICE loop state keys
```

**Full content to implement:**

- `GAME`: `WIDTH`, `HEIGHT`, `BACKGROUND_COLOR`, `PLAY_LINE_Y_OFFSET: 80`
- `NOTE`: all geometry + colors from ARCHITECTURE.md
- `TIMING`: presets object + grade boundaries (`PERFECT: 0.25`, `GOOD: 0.75`, `OK: 1.0`) + `EARLY_PENALTY_MULTIPLIER: 0.75` + `CHORD_TOLERANCE`
- `SCORING`: `BASE_POINTS: 100`, grade multipliers (`Perfect: 1.0, Good: 0.75, OK: 0.5`), streak multiplier bands, grade thresholds
- `XP`: base XP, grade bonuses (S:+100, A:+50, B:+25, C:0, D:-25), speed bonuses for practice
- `FEEDBACK`: colors (hex), floating text animation timings, particle counts, streak thresholds
- `AUDIO`: pitchy settings, metronome range
- `PRACTICE`: `SPEED_MIN: 0.25`, `SPEED_MAX: 1.5`, `SPEED_STEP: 0.05`, `SPEED_DEFAULT: 1.0`

**Write the test file FIRST:**

**File:** `src/core/__tests__/Constants.test.ts`

Test cases (target: 6–8 tests):

1. `TIMING.PRESETS.beginner.window` === 500
2. `TIMING.PRESETS.standard.window` === 300
3. `TIMING.PRESETS.hard.window` === 150
4. `SCORING.BASE_POINTS` === 100
5. `SCORING.STREAK_MULTIPLIERS` has exactly 4 bands, last band multiplier === 4
6. `SCORING.GRADE_MULTIPLIERS.Perfect` + `.Good` + `.OK` === 1.0 + 0.75 + 0.5 (spot check math)
7. `NOTE.RIGHT_HAND_COLOR` and `NOTE.LEFT_HAND_COLOR` are valid hex numbers (> 0)
8. `PRACTICE.SPEED_MIN < PRACTICE.SPEED_DEFAULT && PRACTICE.SPEED_DEFAULT <= PRACTICE.SPEED_MAX`

**Run:** `npm run test` — must pass all 8 before moving on.

---

### Step 1.3 — Create `src/core/EventBus.ts`

**Purpose:** Zero-dependency event emitter. Shared singleton between React and Phaser. Must support `on`, `off`, `emit`, `once`, and `clear` (for test teardown).

**Write the test file FIRST:**

**File:** `src/core/__tests__/EventBus.test.ts`

Test cases (target: 10–12 tests):

1. **emit with no listeners** — does not throw
2. **on + emit** — listener receives emitted data
3. **multiple listeners for same event** — both fire
4. **off removes listener** — no call after off
5. **off non-existent listener** — does not throw
6. **once fires exactly one time** — second emit does not trigger it
7. **once cleans up after itself** — listener Map no longer holds the callback
8. **emit passes data correctly** — complex object arrives intact
9. **multiple events** — listeners for event A don't fire on event B
10. **clear removes all listeners for an event** — emit after clear does nothing
11. **fresh instance is independent** — `new EventBus()` shares no state with singleton
12. **chained on calls** — registering same callback twice calls it twice per emit

**Key implementation details:**

```typescript
// src/core/EventBus.ts

type EventCallback = (data?: unknown) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  clear(event: string): void {
    this.listeners.delete(event);
  }

  clearAll(): void {
    this.listeners.clear();
  }
}

// Shared singleton — React and Phaser both import this
export const eventBus = new EventBus();

// ─── Event Name Registry ─────────────────────────────────────────────────────
// Copy the full Events object from ARCHITECTURE.md §4.2
export const Events = { ... } as const;
```

**Singleton isolation for tests:** Tests import `EventBus` (the class), not `eventBus` (the singleton). Each test uses `new EventBus()`. This is the correct pattern — the singleton exists for app wiring, not unit tests.

**Run:** `npm run test` — all EventBus tests pass before moving on.

---

### Step 1.4 — Create `src/core/GameState.ts`

**Write the test file FIRST:**

**File:** `src/core/__tests__/GameState.test.ts`

Test cases (target: 12–15 tests):

1. **Initial defaults** — `get('score')` === 0 on fresh instance
2. **Initial defaults** — `get('streak')` === 0
3. **Initial defaults** — `get('mode')` === `'performance'`
4. **Initial defaults** — `get('speed')` === 1.0
5. **Initial defaults** — `get('phase')` === `'TITLE'`
6. **set + get round-trip** — set `score` to 500, get returns 500
7. **set + get round-trip** — set `mode` to `'practice'`, get returns `'practice'`
8. **reset clears score** — set score to 500, reset(), get score === 0
9. **reset clears streak** — set streak to 15, reset(), get streak === 0
10. **reset clears maxStreak** — set maxStreak to 15, reset(), maxStreak === 0
11. **reset clears loopStart/loopEnd** — set both, reset(), both null
12. **reset preserves mode** — mode is NOT reset (persists between songs)
13. **reset preserves speed** — speed is NOT reset
14. **reset preserves timingPreset** — not reset
15. **fresh instances are independent** — two `new GameState()` instances don't share data

**Key implementation details:**

```typescript
// src/core/GameState.ts

import type { GameStateData } from './types';

const DEFAULTS: GameStateData = {
  currentProfileId: null,
  currentSongId: null,
  currentSongData: null,
  phase: 'TITLE',
  isPlaying: false,
  isPaused: false,
  mode: 'performance',
  score: 0,
  streak: 0,
  maxStreak: 0,
  notesHit: 0,
  notesMissed: 0,
  notesTotal: 0,
  timingPreset: 'standard',
  timingWindowMs: 300,
  handMode: 'both',
  speed: 1.0,
  loopStart: null,
  loopEnd: null,
};

// Fields that reset() clears (per-run state):
const RESETTABLE_FIELDS: Array<keyof GameStateData> = [
  'score', 'streak', 'maxStreak', 'notesHit', 'notesMissed',
  'isPlaying', 'isPaused', 'loopStart', 'loopEnd',
  'currentSongData', 'currentSongId',
  'phase',
];
// NOTE: mode, speed, timingPreset, handMode, currentProfileId are NOT reset

export class GameState {
  private data: GameStateData;

  constructor() {
    this.data = { ...DEFAULTS };
  }

  get<K extends keyof GameStateData>(key: K): GameStateData[K] {
    return this.data[key];
  }

  set<K extends keyof GameStateData>(key: K, value: GameStateData[K]): void {
    this.data[key] = value;
  }

  reset(): void {
    for (const field of RESETTABLE_FIELDS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.data as any)[field] = DEFAULTS[field];
    }
  }
}

export const gameState = new GameState();
```

**Run:** `npm run test` — all GameState tests pass before moving on.

---

### Iteration 1 Commit

```bash
npm run test   # All ~25 tests pass
npx tsc --noEmit  # Zero type errors
git add -A
git commit -m "feat: core infrastructure — Constants, EventBus, GameState with tests"
```

---

## ITERATION 2 — Business Logic Systems (StreakManager + Scorer)

**Goal:** StreakManager and Scorer fully tested and implemented. No Phaser imports anywhere. All tests pass.

**Commit target:** `feat: StreakManager + Scorer with full TDD coverage`

---

### Step 2.1 — StreakManager

**File locations:**
- Test: `src/phaser/systems/__tests__/StreakManager.test.ts`
- Impl: `src/phaser/systems/StreakManager.ts`

**⚠️ No Phaser imports in `StreakManager.ts`.** It is a pure class. The file lives under `phaser/systems/` but imports nothing from Phaser.

**Write tests FIRST:**

Test cases (target: 11–13 tests):

1. **Initial state** — count === 0, multiplier === 1, maxStreak === 0
2. **Single hit** — count becomes 1, multiplier stays 1
3. **Four hits** — count === 4, multiplier === 1 (threshold not yet crossed)
4. **Five hits** — count === 5, multiplier === 2
5. **Ten hits** — count === 10, multiplier === 3
6. **Twenty hits** — count === 20, multiplier === 4
7. **Multiplier caps at 4x** — 50 consecutive hits, multiplier === 4
8. **Miss resets streak** — after 10 hits, miss(), count === 0, multiplier === 1
9. **Wrong resets streak** — after 10 hits, wrong(), count === 0, multiplier === 1
10. **maxStreak persists after reset** — 15 hits, miss, count === 0, maxStreak === 15
11. **maxStreak only grows** — 15 hits, miss, 5 hits, maxStreak still 15
12. **getState() returns correct snapshot** — returns `{ count, multiplier, maxStreak }`
13. **reset() full reset** — count, multiplier, maxStreak all reset to defaults

**Implementation:**

```typescript
// src/phaser/systems/StreakManager.ts
// NO PHASER IMPORTS

import { SCORING } from '../../core/Constants';
import type { StreakState } from '../../core/types';

export class StreakManager {
  private count = 0;
  private multiplier = 1;
  private maxStreak = 0;

  hit(): void {
    this.count++;
    if (this.count > this.maxStreak) {
      this.maxStreak = this.count;
    }
    this.multiplier = this.calculateMultiplier(this.count);
  }

  miss(): void {
    this.count = 0;
    this.multiplier = 1;
  }

  wrong(): void {
    this.miss();
  }

  getState(): StreakState {
    return {
      count: this.count,
      multiplier: this.multiplier,
      maxStreak: this.maxStreak,
    };
  }

  reset(): void {
    this.count = 0;
    this.multiplier = 1;
    this.maxStreak = 0;
  }

  private calculateMultiplier(streak: number): number {
    const bands = SCORING.STREAK_MULTIPLIERS;
    for (let i = bands.length - 1; i >= 0; i--) {
      if (streak >= bands[i].minStreak) {
        return bands[i].multiplier;
      }
    }
    return 1;
  }
}
```

**Run:** `npm run test` — all StreakManager tests pass.

---

### Step 2.2 — Scorer

**File locations:**
- Test: `src/phaser/systems/__tests__/Scorer.test.ts`
- Impl: `src/phaser/systems/Scorer.ts`

**⚠️ No Phaser imports.** Pure class.

**Write tests FIRST:**

Test cases (target: 18–22 tests):

**calculatePoints:**
1. Perfect hit, streak 1x → 100 points (100 base × 1.0 grade × 1 streak)
2. Good hit, streak 1x → 75 points (100 × 0.75 × 1)
3. OK hit, streak 1x → 50 points (100 × 0.5 × 1)
4. Perfect hit, streak 2x → 200 points
5. Perfect hit, streak 3x → 300 points
6. Perfect hit, streak 4x → 400 points
7. Good hit, streak 2x → 150 points
8. OK hit, streak 4x → 200 points
9. Perfect hit, early penalty (standard mode) → 75 points (100 × 1.0 × 1 × 0.75)
10. Good hit, early penalty → ~56 points (100 × 0.75 × 1 × 0.75, floor/round)
11. Miss → 0 points
12. Wrong → 0 points

**calculateGrade (accuracy → SongGrade):**
13. 100% accuracy → 'S'
14. 95% accuracy → 'S'
15. 94% accuracy → 'A'
16. 85% accuracy → 'A'
17. 84% accuracy → 'B'
18. 70% accuracy → 'B'
19. 69% accuracy → 'C'
20. 50% accuracy → 'C'
21. 49% accuracy → 'D'
22. 0% accuracy → 'D'

**calculateXP:**
23. Grade S, performance mode → baseXP + 100
24. Grade A, performance mode → baseXP + 50
25. Grade D, performance mode → max(0, baseXP - 25) — ensure never negative

**Implementation:**

```typescript
// src/phaser/systems/Scorer.ts
// NO PHASER IMPORTS

import { SCORING, XP } from '../../core/Constants';
import type { TimingGrade, SongGrade, GameMode } from '../../core/types';

export class Scorer {
  calculatePoints(
    grade: TimingGrade,
    streakMultiplier: number,
    isEarly: boolean,
    _mode: GameMode   // reserved for future hard-mode late penalty
  ): number {
    if (grade === 'Miss' || grade === 'Wrong') return 0;

    const gradeMultiplier = SCORING.GRADE_MULTIPLIERS[grade];
    const earlyPenalty = isEarly ? TIMING.EARLY_PENALTY_MULTIPLIER : 1.0;

    return Math.round(
      SCORING.BASE_POINTS * gradeMultiplier * streakMultiplier * earlyPenalty
    );
  }

  calculateGrade(accuracy: number): SongGrade {
    const pct = accuracy * 100;
    const t = SCORING.GRADE_THRESHOLDS;
    if (pct >= t.S) return 'S';
    if (pct >= t.A) return 'A';
    if (pct >= t.B) return 'B';
    if (pct >= t.C) return 'C';
    return 'D';
  }

  calculateXP(grade: SongGrade, mode: GameMode, speed: number): number {
    const base = XP.BASE_XP;
    const bonus = XP.GRADE_BONUS[grade] ?? 0;
    let total = Math.max(0, base + bonus);

    // Practice mode speed bonus
    if (mode === 'practice') {
      if (speed > 1.25) total = Math.round(total * 1.5);
      else if (speed > 1.0) total = Math.round(total * 1.25);
    }

    return total;
  }
}
```

**Note for Constants.ts update:** `SCORING.GRADE_MULTIPLIERS` must use keys that match `TimingGrade` literals: `Perfect`, `Good`, `OK`. Not `S`/`A`/`B`. Make sure Constants.ts uses the right key names.

**Run:** `npm run test` — all Scorer tests pass.

---

### Iteration 2 Commit

```bash
npm run test   # All ~40 tests pass
npx tsc --noEmit  # Zero type errors
git add -A
git commit -m "feat: StreakManager + Scorer with full TDD coverage"
```

---

## ITERATION 3 — Hit Detection + Note Scheduling

**Goal:** HitDetector and NoteSpawner scheduling logic fully tested. Most complex business logic — invest in test coverage here.

**Commit target:** `feat: HitDetector + NoteSpawner logic with TDD coverage`

---

### Step 3.1 — HitDetector

**File locations:**
- Test: `src/phaser/systems/__tests__/HitDetector.test.ts`
- Impl: `src/phaser/systems/HitDetector.ts`

**⚠️ No Phaser imports.** Pure class.

**Core algorithm from PRD 1 §4.4:**
```
gradeHit(inputTime, noteTime, windowMs) → TimingGrade

1. Calculate delta = inputTime - noteTime  (signed; negative = early, positive = late)
2. If |delta| <= windowMs * TIMING.PERFECT (25%) → 'Perfect'
3. If |delta| <= windowMs * TIMING.GOOD (75%) → 'Good'
4. If |delta| <= windowMs (100%) → 'OK'
5. If input is before note and |delta| is within [windowMs, 2*windowMs] → early
6. If |delta| > windowMs → 'Miss' (for no-input misses) or 'Wrong' (for wrong pitch)
```

**Write tests FIRST:**

Test cases (target: 22–26 tests):

**Standard mode (window = 300ms):**
1. Input at exactly note time → 'Perfect'
2. Input 74ms early → 'Perfect' (300 × 0.25 = 75ms threshold)
3. Input 75ms early → 'Good' (at boundary)
4. Input 224ms early → 'Good' (300 × 0.75 = 225ms threshold)
5. Input 225ms early → 'OK' (at boundary)
6. Input 299ms early → 'OK'
7. Input 300ms early → 'Miss' (outside window)
8. Mirror: 74ms late → 'Perfect'
9. Mirror: 225ms late → 'OK'
10. Mirror: 301ms late → 'Miss'

**Beginner mode (window = 500ms):**
11. Input 124ms off → 'Perfect' (500 × 0.25 = 125ms)
12. Input 500ms off → 'Miss' (outside window)

**Hard mode (window = 150ms):**
13. Input 37ms off → 'Perfect' (150 × 0.25 = 37.5ms)
14. Input 151ms off → 'Miss'

**Early note handling:**
15. Standard mode: input 400ms early (in early zone) → grade with isEarly=true
16. Standard mode: input 600ms early (past early zone) → isEarly=false, no credit possible
17. Beginner mode: input in early zone → isEarly=false (beginner ignores early)
18. Hard mode: input in early zone → 'Miss' (hard mode breaks streak on early)

**Wrong note (pitch mismatch):**
19. Wrong pitch, any timing → 'Wrong' regardless of timing
20. Wrong pitch, perfect timing → 'Wrong'

**Chord detection:**
21. Two notes at same time, beginner tolerance 100ms → both match if within 100ms
22. Two notes at same time, hard tolerance 25ms → no match if 26ms apart

**Boundary / edge:**
23. windowMs = 0 → only exact match is 'Perfect' (degenerate case)
24. `gradeHit` returns `{ grade, isEarly, accuracyMs }` — verify shape
25. accuracyMs is negative for early inputs

**HitDetector API:**

```typescript
// src/phaser/systems/HitDetector.ts
// NO PHASER IMPORTS

import { TIMING } from '../../core/Constants';
import type { TimingGrade, TimingPreset } from '../../core/types';

export interface GradeResult {
  grade: TimingGrade;
  isEarly: boolean;
  accuracyMs: number;  // signed: negative=early, positive=late
}

export class HitDetector {
  gradeHit(
    inputTimeMs: number,
    noteTimeMs: number,
    windowMs: number,
    preset: TimingPreset,
    pitchMatches: boolean
  ): GradeResult {
    if (!pitchMatches) {
      return { grade: 'Wrong', isEarly: false, accuracyMs: 0 };
    }

    const delta = inputTimeMs - noteTimeMs; // negative = early
    const absDelta = Math.abs(delta);
    const isEarlyInput = delta < 0;

    // Check if in main timing window
    if (absDelta <= windowMs) {
      const grade = this.gradeByPosition(absDelta, windowMs, isEarlyInput, preset);
      return { grade, isEarly: false, accuracyMs: delta };
    }

    // Check early zone (only Standard mode credits it)
    if (isEarlyInput && absDelta <= windowMs * 2) {
      if (preset === 'beginner') {
        return { grade: 'Miss', isEarly: false, accuracyMs: delta };
      }
      if (preset === 'hard') {
        return { grade: 'Miss', isEarly: true, accuracyMs: delta };
      }
      // Standard: credit with penalty
      const grade = this.gradeByPosition(absDelta, windowMs, true, preset);
      return { grade, isEarly: true, accuracyMs: delta };
    }

    return { grade: 'Miss', isEarly: false, accuracyMs: delta };
  }

  private gradeByPosition(
    absDelta: number,
    windowMs: number,
    _isEarly: boolean,
    _preset: TimingPreset
  ): TimingGrade {
    if (absDelta <= windowMs * TIMING.PERFECT) return 'Perfect';
    if (absDelta <= windowMs * TIMING.GOOD) return 'Good';
    return 'OK';
  }
}
```

**Run:** `npm run test` — all HitDetector tests pass.

---

### Step 3.2 — NoteSpawner (scheduling logic only)

**File locations:**
- Test: `src/phaser/systems/__tests__/NoteSpawner.test.ts`
- Impl: `src/phaser/systems/NoteSpawner.ts` (scheduling portion; Phaser integration added in Iteration 4)

**Design decision:** Split NoteSpawner into two concerns:
1. **`NoteScheduler`** — pure logic class (testable, no Phaser). Lives in `src/phaser/systems/NoteScheduler.ts`.
2. **`NoteSpawner`** — Phaser-aware class that uses `NoteScheduler` internally. Not tested directly.

This separation keeps the business logic testable and the Phaser integration clean.

**Write tests FIRST (for `NoteScheduler`):**

Test cases (target: 11–13 tests):

1. **Basic schedule calculation** — note at 2.5s, fallDuration 2.5s, speed 1.0 → spawnAt = 0ms (note spawns immediately)
2. **Note at 5.0s** — spawnAt = 2500ms (5000 - 2500)
3. **Speed 0.5** — fall takes longer, spawnAt earlier: `noteTimeMs - (fallDurationMs / speed)`
4. **Speed 2.0** — fall takes half the time, spawnAt later
5. **Multiple notes** — buildSchedule(notes) returns sorted array by spawnAtMs
6. **getNotesToSpawn(currentMs)** — returns only notes whose spawnAtMs <= currentMs
7. **getNotesToSpawn(currentMs)** — does not re-return already-spawned notes (internal consumed set)
8. **getMissedNotes(currentMs, windowMs)** — returns notes past their target + window
9. **reset()** — clears consumed set, allows re-spawning (for A-B loop)
10. **Notes sorted by spawnAtMs** — schedule is always ascending
11. **Speed scaling** — at speed 0.5, note that targets 5.0s spawns at t=0 (because fall takes 5.0s)
12. **Empty song** — buildSchedule([]) returns []
13. **loopWindow** — getNotesToSpawn with loopStart/loopEnd filters to range

**`NoteScheduler` API:**

```typescript
// src/phaser/systems/NoteScheduler.ts
// NO PHASER IMPORTS

import { NOTE } from '../../core/Constants';
import type { GameReadyNote, SpawnScheduleEntry } from '../../core/types';

export class NoteScheduler {
  private schedule: SpawnScheduleEntry[] = [];
  private consumed = new Set<string>();

  buildSchedule(notes: GameReadyNote[], speed: number): void {
    const fallDurationMs = NOTE.FALL_DURATION_SEC * 1000;
    const adjustedFall = fallDurationMs / speed;

    this.schedule = notes
      .map(note => ({
        noteId: note.id,
        noteData: note,
        targetMs: note.time * 1000,
        spawnAtMs: note.time * 1000 - adjustedFall,
      }))
      .sort((a, b) => a.spawnAtMs - b.spawnAtMs);

    this.consumed.clear();
  }

  getNotesToSpawn(currentMs: number): SpawnScheduleEntry[] {
    return this.schedule.filter(
      e => e.spawnAtMs <= currentMs && !this.consumed.has(e.noteId)
    );
  }

  markConsumed(noteId: string): void {
    this.consumed.add(noteId);
  }

  getMissedNotes(currentMs: number, windowMs: number): SpawnScheduleEntry[] {
    return this.schedule.filter(
      e => !this.consumed.has(e.noteId) && currentMs > e.targetMs + windowMs
    );
  }

  reset(): void {
    this.consumed.clear();
  }

  getSchedule(): SpawnScheduleEntry[] {
    return [...this.schedule];
  }
}
```

**Run:** `npm run test` — all NoteScheduler tests pass.

---

### Iteration 3 Commit

```bash
npm run test   # All ~70 tests pass
npx tsc --noEmit  # Zero type errors
git add -A
git commit -m "feat: HitDetector + NoteSpawner logic with TDD coverage"
```

---

## ITERATION 4 — Phaser Integration (Scenes + Game Loop)

**Goal:** Working Phaser game that renders to the screen. Notes fall, GameScene has an update loop, EventBus is wired. **No new unit tests in this iteration** — integration is validated visually.

**Commit target:** `feat: Phaser integration — scenes, FallingNote, game loop`

---

### Step 4.1 — Phaser Config

**File:** `src/phaser/config.ts`

```typescript
import Phaser from 'phaser';
import { GAME } from '../core/Constants';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  parent: 'phaser-container',
  scene: [BootScene, PreloaderScene, GameScene, ResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: {
    disableWebAudio: true,
  },
};
```

**File:** `src/phaser/main.ts`

```typescript
import Phaser from 'phaser';
import { phaserConfig } from './config';

export function createPhaserGame(): Phaser.Game {
  return new Phaser.Game(phaserConfig);
}
```

---

### Step 4.2 — Scenes

**Boot Scene** (`src/phaser/scenes/BootScene.ts`):
- Extends `Phaser.Scene { key: 'Boot' }`
- `create()`: immediately starts 'Preloader'
- No EventBus listeners here (too early)

**Preloader Scene** (`src/phaser/scenes/PreloaderScene.ts`):
- Extends `Phaser.Scene { key: 'Preloader' }`
- `preload()`: load any assets (placeholder: nothing for now)
- `create()`: starts 'Game'
- **TODO Iteration 5:** Load particle textures, UI assets here

**Game Scene** (`src/phaser/scenes/GameScene.ts`):

This is the most complex scene. Implement in this order:

1. Constructor + `init(data: GameStartData)` — store data, reset gameState
2. `create()`:
   - Call `gameState.reset()`
   - Set `timingWindowMs` from data
   - Create background rectangle (GAME.BACKGROUND_COLOR)
   - Create play line at `height - GAME.PLAY_LINE_Y_OFFSET`
   - Initialize `NoteSpawner` with song data
   - Initialize `HitDetector`, `Scorer`, `StreakManager`
   - Create HUD text objects (score, streak — placeholder Text objects)
   - Listen for `Events.NOTE_PLAYED` → `this.handleNotePlayed`
   - Listen for `Events.GAME_PAUSE` → `this.handlePause`
   - Set `gameState.set('isPlaying', true)`
3. `update(time, delta)`:
   - Guard: `if (!gameState.get('isPlaying') || gameState.get('isPaused')) return`
   - Accumulate game clock: `this.gameClock += delta * speed`
   - Call `this.noteSpawner.update(this.gameClock)` → get notes to spawn
   - For each new note: create `FallingNote` object
   - Move existing notes: `note.y += fallSpeed * delta`
   - Check missed notes via `NoteScheduler.getMissedNotes()`
   - Update score/streak text
4. `handleNotePlayed(data: InputEvent)`:
   - Find nearest active note matching pitch within timing window
   - Call `hitDetector.gradeHit(...)`
   - Call `scorer.calculatePoints(...)`
   - Call `streakManager.hit()` or `streakManager.miss()`
   - Update `gameState` score/streak
   - Emit `Events.NOTE_HIT` or `Events.NOTE_MISSED`
   - Call `note.showHitFeedback(grade)` or `note.showMissFeedback()`
5. `shutdown()`: **CRITICAL** — remove all EventBus listeners with `eventBus.off()`

**⚠️ Shutdown rule:** Every `eventBus.on()` in `create()` MUST have a corresponding `eventBus.off()` in `shutdown()`. Leaking listeners causes phantom event fires on scene restart.

---

### Step 4.3 — FallingNote Game Object

**File:** `src/phaser/objects/FallingNote.ts`

```typescript
import Phaser from 'phaser';
import { NOTE, FEEDBACK } from '../../core/Constants';
import type { GameReadyNote, TimingGrade } from '../../core/types';

export class FallingNote extends Phaser.GameObjects.Rectangle {
  public readonly noteData: GameReadyNote;
  private fingerText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, noteData: GameReadyNote) {
    const color = noteData.hand === 'left' ? NOTE.LEFT_HAND_COLOR : NOTE.RIGHT_HAND_COLOR;
    const width = Math.min(
      Math.max(noteData.duration * 80, NOTE.MIN_WIDTH),
      NOTE.MAX_WIDTH
    );
    super(scene, x, y, width, NOTE.HEIGHT, color);

    this.noteData = noteData;
    scene.add.existing(this);

    if (noteData.finger) {
      this.fingerText = scene.add.text(x, y, String(noteData.finger), {
        fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(0.5);
    }
  }

  showHitFeedback(grade: TimingGrade): void {
    if (grade === 'Miss' || grade === 'Wrong') return;
    const colorMap: Record<string, number> = {
      Perfect: FEEDBACK.COLORS.perfect,
      Good: FEEDBACK.COLORS.good,
      OK: FEEDBACK.COLORS.ok,
    };
    this.setFillStyle(colorMap[grade] ?? FEEDBACK.COLORS.ok);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.2,
      duration: 300,
      onComplete: () => {
        this.fingerText?.destroy();
        this.destroy();
      },
    });
  }

  showMissFeedback(): void {
    this.setFillStyle(FEEDBACK.COLORS.miss);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.fingerText?.destroy();
        this.destroy();
      },
    });
  }

  preUpdate(): void {
    // Keep finger text in sync with note position
    if (this.fingerText) {
      this.fingerText.setPosition(this.x, this.y);
    }
  }
}
```

---

### Step 4.4 — NoteSpawner (Phaser integration)

**File:** `src/phaser/systems/NoteSpawner.ts`

```typescript
import Phaser from 'phaser';
import { NoteScheduler } from './NoteScheduler';
import { FallingNote } from '../objects/FallingNote';
import { NOTE } from '../../core/Constants';
import type { GameReadyNote } from '../../core/types';

export class NoteSpawner {
  private scene: Phaser.Scene;
  private scheduler: NoteScheduler;
  private activeNotes: FallingNote[] = [];
  private fallSpeedPxPerMs: number;

  constructor(scene: Phaser.Scene, notes: GameReadyNote[], speed: number) {
    this.scene = scene;
    this.scheduler = new NoteScheduler();
    this.scheduler.buildSchedule(notes, speed);

    const canvasHeight = scene.scale.height;
    const playLineY = canvasHeight - 80; // GAME.PLAY_LINE_Y_OFFSET
    this.fallSpeedPxPerMs = playLineY / (NOTE.FALL_DURATION_SEC * 1000 / speed);
  }

  update(gameClockMs: number, deltaMs: number, windowMs: number): {
    newNotes: FallingNote[];
    missedNoteIds: string[];
  } {
    // Spawn new notes
    const toSpawn = this.scheduler.getNotesToSpawn(gameClockMs);
    const newNotes: FallingNote[] = [];

    for (const entry of toSpawn) {
      this.scheduler.markConsumed(entry.noteId);
      const x = this.getNoteXPosition(entry.noteData.midiNote);
      const note = new FallingNote(this.scene, x, 0, entry.noteData);
      this.activeNotes.push(note);
      newNotes.push(note);
    }

    // Move existing notes
    for (const note of this.activeNotes) {
      note.y += this.fallSpeedPxPerMs * deltaMs;
    }

    // Detect missed notes
    const missed = this.scheduler.getMissedNotes(gameClockMs, windowMs);
    const missedNoteIds = missed.map(e => e.noteId);
    missed.forEach(e => this.scheduler.markConsumed(e.noteId));

    // Clean up destroyed notes
    this.activeNotes = this.activeNotes.filter(n => n.active);

    return { newNotes, missedNoteIds };
  }

  getActiveNotes(): FallingNote[] {
    return this.activeNotes;
  }

  destroy(): void {
    this.activeNotes.forEach(n => n.destroy());
    this.activeNotes = [];
  }

  private getNoteXPosition(midiNote: number): number {
    // Map MIDI note to X coordinate on canvas
    // Piano range: MIDI 21 (A0) to 108 (C8) = 88 keys
    const canvasWidth = this.scene.scale.width;
    const normalized = (midiNote - 21) / (108 - 21);
    return Math.round(normalized * canvasWidth);
  }
}
```

---

### Step 4.5 — Results Scene

**File:** `src/phaser/scenes/ResultsScene.ts`

Minimal implementation:
- Receives `ScoreResult` via `init(data)`
- Renders: score number, grade letter, accuracy %, XP earned
- "Play Again" button → emits `Events.GAME_RESTART`
- "Back to Menu" → emits `Events.GAME_END`

---

### Step 4.6 — Validation

```bash
npm run test      # All ~70 tests still pass (we added no new tests)
npm run build     # Must exit 0 — this validates TypeScript compilation of Phaser code
npm run dev       # Visual inspection: game canvas renders, Boot→Preloader→Game scene flow
```

**Visual smoke test (manual):**
- [ ] Dark background renders
- [ ] No console errors on startup
- [ ] Scene transition Boot → Preloader → Game completes
- [ ] Game scene shows (even if empty — no notes until song data is passed)

---

### Iteration 4 Commit

```bash
npm run test   # Still passing
npm run build  # Clean build
git add -A
git commit -m "feat: Phaser integration — scenes, FallingNote, game loop"
```

---

## ITERATION 5 — Visual Feedback + Practice Tools + React Shell

**Goal:** Full playable loop. React shell wires into Phaser. Practice tools work. Visual feedback is polished.

**Commit target:** `feat: visual feedback, practice tools, React shell integration`

---

### Step 5.1 — FeedbackText (floating "Perfect!" animation)

**File:** `src/phaser/objects/FeedbackText.ts`

Animation spec from PRD 1 §7.2:
1. Scale 0.5 → 1.2 over 100ms (ease-out)
2. Hold at 1.2 for 50ms
3. Scale 1.2 → 1.0 while floating up 30px over 200ms (ease-out)
4. Fade to 0 over 100ms
5. Total: ~450ms, then destroy

```typescript
export class FeedbackText {
  static show(scene: Phaser.Scene, x: number, y: number, grade: TimingGrade): void {
    const labels: Record<TimingGrade, string> = {
      Perfect: 'Perfect!',
      Good: 'Good!',
      OK: 'OK!',
      Miss: 'Miss!',
      Wrong: 'Wrong!',
    };
    const colors: Record<TimingGrade, string> = {
      Perfect: '#2ECC71',
      Good: '#F39C12',
      OK: '#E67E22',
      Miss: '#E74C3C',
      Wrong: '#C0392B',
    };

    const text = scene.add.text(x, y, labels[grade], {
      fontSize: '28px',
      fontStyle: 'bold',
      color: colors[grade],
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScale(0.5).setDepth(100);

    scene.tweens.chain({
      targets: text,
      tweens: [
        { scaleX: 1.2, scaleY: 1.2, duration: 100, ease: 'Power2Out' },
        { scaleX: 1.0, scaleY: 1.0, y: y - 30, duration: 200, ease: 'Power2Out' },
        { alpha: 0, duration: 100, onComplete: () => text.destroy() },
      ],
    });
  }
}
```

---

### Step 5.2 — ParticleManager

**File:** `src/phaser/systems/ParticleManager.ts`

Uses Phaser 3.60+ `ParticleEmitter` API (not the deprecated `ParticleEmitterManager`).

Implement:
- `hitBurst(x, y, color)` — 10 particles, radial, 400ms lifespan
- `streakTrail(x, y, color)` — 5 particles, 300ms lifespan (called each frame when streak ≥ 5)
- `destroy()` — clean up all emitters

**Note:** Use `scene.add.particles(0, 0, 'particle', { ... })`. If no particle texture exists in Preloader, create a small 8×8 white circle texture programmatically in BootScene using `scene.textures.generate()`.

---

### Step 5.3 — In-Game UI Elements

**StreakCounter** (`src/phaser/ui/StreakCounter.ts`):
- Position: upper-left
- Shows: "🔥 15" when streak ≥ 5, "15" otherwise
- Pulses on increment (tween scaleX/Y 1.0 → 1.3 → 1.0, 150ms)
- Flame icon: Unicode emoji or a simple Phaser Graphics flame shape

**ComboDisplay** (`src/phaser/ui/ComboDisplay.ts`):
- Position: upper-right
- Shows: "15 × 3" (streak × multiplier)
- Pulses on multiplier change

**PauseOverlay** (`src/phaser/ui/PauseOverlay.ts`):
- Semi-transparent dark rectangle over full canvas
- "PAUSED" text centered
- "Resume" button → emits `Events.GAME_RESUME`
- "Quit" button → emits `Events.GAME_END`

---

### Step 5.4 — Practice Mode — Speed Slider State

**Speed slider is a React component** (not Phaser). The slider controls `gameState.set('speed', value)` and emits `Events.PRACTICE_SPEED_CHANGE`.

In `GameScene.update()`:
```typescript
const speed = gameState.get('speed');
const adjustedDelta = delta * speed;
```

**State:** Speed is read from `gameState` each frame. No caching. This allows live updates while playing.

**Timing window scaling:** When speed changes, recalculate:
```typescript
const baseWindow = TIMING.PRESETS[gameState.get('timingPreset')].window;
const effectiveWindow = baseWindow * speed;  // Scales with tempo
gameState.set('timingWindowMs', effectiveWindow);
```

---

### Step 5.5 — Practice Mode — A-B Loop State Machine

**State machine (4 states):**
```
IDLE → [Mark A pressed] → A_MARKED → [Mark B pressed] → LOOP_ACTIVE
LOOP_ACTIVE → [Clear pressed] → IDLE
A_MARKED → [Clear pressed] → IDLE
```

**File:** `src/phaser/systems/ABLoopController.ts`

```typescript
type ABState = 'IDLE' | 'A_MARKED' | 'LOOP_ACTIVE';

export class ABLoopController {
  private state: ABState = 'IDLE';
  private loopStart: number | null = null;
  private loopEnd: number | null = null;

  markA(currentTimeSec: number): void { ... }
  markB(currentTimeSec: number): void { ... }
  clear(): void { ... }
  shouldLoop(currentTimeSec: number): boolean { ... }
  getLoopStart(): number | null { ... }
  getLoopEnd(): number | null { ... }
  getState(): ABState { ... }
}
```

In `GameScene.update()`:
```typescript
if (this.abLoop.shouldLoop(this.gameClock / 1000)) {
  this.seekTo(this.abLoop.getLoopStart()!);
}
```

---

### Step 5.6 — React App.tsx + GameWrapper Integration

**Restructure:**
1. Move existing `src/App.tsx` content → `src/react/App.tsx`
2. Move `src/main.tsx` → `src/react/main.tsx`
3. Update `index.html` to point to new entry: `src/react/main.tsx`

**GameWrapper** (`src/react/pages/GameWrapper.tsx`):
```typescript
import { useEffect, useRef } from 'react';
import { createPhaserGame } from '../../phaser/main';
import { eventBus, Events } from '../../core/EventBus';
import type { GameStartData } from '../../core/types';

interface Props {
  startData: GameStartData;
  onGameEnd: () => void;
}

export function GameWrapper({ startData, onGameEnd }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    gameRef.current = createPhaserGame();

    // Small delay to let Phaser initialize before emitting start
    setTimeout(() => {
      eventBus.emit(Events.GAME_START, startData);
    }, 500);

    const handleEnd = () => onGameEnd();
    eventBus.on(Events.GAME_END, handleEnd);

    return () => {
      eventBus.off(Events.GAME_END, handleEnd);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []); // eslint-disable-line -- intentionally run once

  return <div id="phaser-container" style={{ width: '100%', height: '100vh' }} />;
}
```

**React Router** (minimal, for PRD 1):
- `/` → Splash / placeholder "Start Game" button
- `/game` → `GameWrapper` with hardcoded test song data

---

### Step 5.7 — ResultsScene Polish

Enhance the minimal ResultsScene from Iteration 4:
- Animate grade letter in with scale pop
- Show XP bar animation (fill from 0 to earned XP)
- Wire "Play Again" → scene restart with same data
- Wire "Back to Menu" → React navigation via `Events.GAME_END`

---

### Iteration 5 Validation

```bash
npm run test      # All ~70 tests still pass
npm run build     # Clean build
npm run dev       # Full visual smoke test
```

**Visual smoke test checklist:**
- [ ] React app loads at localhost:5173
- [ ] "Start Game" button launches Phaser canvas
- [ ] Notes fall at correct speed
- [ ] Hit detection fires correct feedback text
- [ ] Streak counter increments and resets
- [ ] Pause overlay works (show/hide)
- [ ] Practice mode speed slider updates fall speed in real time
- [ ] A-B loop state machine transitions correctly
- [ ] Results scene shows score + grade after song ends
- [ ] Restarting game clears all state (clean reset)
- [ ] No console errors throughout

---

### Iteration 5 Commit

```bash
npm run test
npm run build
git add -A
git commit -m "feat: visual feedback, practice tools, React shell integration"
```

---

## Complete File Manifest

### Files to Create (in implementation order)

| Iteration | File | Purpose |
|-----------|------|---------|
| 0 (pre-flight) | `vite.config.ts` | Fix vitest/config import |
| 1 | `src/core/types.ts` | All shared TypeScript interfaces |
| 1 | `src/core/Constants.ts` | ALL game config values |
| 1 | `src/core/__tests__/Constants.test.ts` | Shape + value validation |
| 1 | `src/core/EventBus.ts` | Event emitter class + singleton + Events registry |
| 1 | `src/core/__tests__/EventBus.test.ts` | on/off/emit/once/clear tests |
| 1 | `src/core/GameState.ts` | Centralized state class + singleton |
| 1 | `src/core/__tests__/GameState.test.ts` | get/set/reset tests |
| 2 | `src/phaser/systems/StreakManager.ts` | Hit/miss/wrong streak tracking |
| 2 | `src/phaser/systems/__tests__/StreakManager.test.ts` | All threshold scenarios |
| 2 | `src/phaser/systems/Scorer.ts` | Points, grade, XP calculation |
| 2 | `src/phaser/systems/__tests__/Scorer.test.ts` | All grade/mode/streak combos |
| 3 | `src/phaser/systems/HitDetector.ts` | gradeHit() logic |
| 3 | `src/phaser/systems/__tests__/HitDetector.test.ts` | All timing scenarios |
| 3 | `src/phaser/systems/NoteScheduler.ts` | Pure spawn scheduling logic |
| 3 | `src/phaser/systems/__tests__/NoteScheduler.test.ts` | Scheduling calculations |
| 4 | `src/phaser/config.ts` | Phaser game configuration object |
| 4 | `src/phaser/main.ts` | `createPhaserGame()` factory |
| 4 | `src/phaser/scenes/BootScene.ts` | Minimal boot → preloader |
| 4 | `src/phaser/scenes/PreloaderScene.ts` | Asset loading → game |
| 4 | `src/phaser/scenes/GameScene.ts` | Main game loop |
| 4 | `src/phaser/scenes/ResultsScene.ts` | Score recap |
| 4 | `src/phaser/objects/FallingNote.ts` | Note gem game object |
| 4 | `src/phaser/systems/NoteSpawner.ts` | Phaser-aware spawner (wraps NoteScheduler) |
| 5 | `src/phaser/objects/FeedbackText.ts` | Floating "Perfect!" animation |
| 5 | `src/phaser/objects/PlayLine.ts` | Visual play line |
| 5 | `src/phaser/systems/ParticleManager.ts` | Hit bursts, streak trails |
| 5 | `src/phaser/systems/ABLoopController.ts` | A-B loop state machine |
| 5 | `src/phaser/ui/StreakCounter.ts` | Streak + flame UI |
| 5 | `src/phaser/ui/ComboDisplay.ts` | Combo × multiplier UI |
| 5 | `src/phaser/ui/PauseOverlay.ts` | Pause screen |
| 5 | `src/react/App.tsx` | React app root (replaces src/App.tsx) |
| 5 | `src/react/main.tsx` | React entry point |
| 5 | `src/react/pages/GameWrapper.tsx` | Phaser canvas host |
| 5 | `src/react/pages/Splash.tsx` | Placeholder home screen |

### Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | Fix import: `'vite'` → `'vitest/config'` |
| `src/App.tsx` | Replace content → redirect to `src/react/App.tsx` (or delete) |
| `src/main.tsx` | Update entry point to `src/react/main.tsx` |
| `index.html` | Update `<script>` src if entry point changes |

---

## TDD Test Structure

```
src/
  core/
    __tests__/
      Constants.test.ts         # 6–8 tests
      EventBus.test.ts          # 10–12 tests
      GameState.test.ts         # 12–15 tests
  phaser/
    systems/
      __tests__/
        StreakManager.test.ts   # 11–13 tests
        Scorer.test.ts          # 18–22 tests
        HitDetector.test.ts     # 22–26 tests
        NoteScheduler.test.ts   # 11–13 tests
```

### Test Count Targets

| Module | Min | Max | Focus |
|--------|-----|-----|-------|
| Constants | 6 | 8 | Shape validation, key values, relationships |
| EventBus | 10 | 12 | on/off/emit/once, isolation, cleanup |
| GameState | 12 | 15 | Defaults, get/set, what resets vs persists |
| StreakManager | 11 | 13 | All multiplier bands, reset, maxStreak tracking |
| Scorer | 18 | 22 | All grade × streak combinations, XP edge cases |
| HitDetector | 22 | 26 | All 3 modes, early handling, chord tolerance, signed delta |
| NoteScheduler | 11 | 13 | Schedule math, consumed tracking, loop reset |
| **Total** | **90** | **109** | — |

---

## Validation Plan

### After Each Iteration
```bash
npm run test           # All tests pass, zero failures
npx tsc --noEmit       # Zero TypeScript errors
```

### After Iteration 4 (Phaser integration)
```bash
npm run build          # Production build succeeds
# Manually inspect: no TS errors from Phaser objects
```

### After Iteration 5 (Full game)
```bash
npm run dev            # Dev server starts, no console errors
# Manual smoke test checklist (see Iteration 5 §5.7)
```

### Final Pre-PR Check
```bash
npm run test:coverage  # Coverage report — core modules should be 80%+
npm run lint           # Zero ESLint errors
npm run build          # Clean build
```

---

## Risk Register & Mitigations

### Risk 1 — Phaser import leaks into testable modules
**Impact:** `vitest` runs in Node — Phaser's browser APIs throw immediately.  
**Mitigation:**
- `NoteSpawner.ts` is Phaser-aware (not tested directly)
- `NoteScheduler.ts` is pure logic (fully tested, zero Phaser imports)
- Same split for any future system that needs Phaser access
- Add a lint rule (or just manually enforce): `src/phaser/systems/__tests__/` files must never import `phaser`

### Risk 2 — Singleton state leaking between tests
**Impact:** Test A sets `gameState.score = 500`; test B sees 500 instead of 0.  
**Mitigation:**
- **Never import the singleton (`gameState`, `eventBus`) in unit tests**
- Always use `new GameState()` and `new EventBus()` in tests
- Add `afterEach(() => { instance.reset() })` where needed
- The singleton is for app wiring only

### Risk 3 — `vite.config.ts` TypeScript type errors on test block
**Impact:** TypeScript compiler errors when adding new `test:` options.  
**Mitigation:** Fixed in pre-flight step — change import to `vitest/config`.

### Risk 4 — `tsconfig.app.json` strict mode conflicts
**Impact:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` may reject valid test patterns.  
**Mitigation:**
- Tests are not compiled by `tsconfig.app.json` (that's for app code)
- Vitest uses its own transpilation — strict TS config doesn't apply to test files
- If needed, add a `tsconfig.test.json` with relaxed settings that `vitest` references

### Risk 5 — EventBus listener memory leaks in GameScene
**Impact:** Scene restarts accumulate duplicate listeners; events fire multiple times.  
**Mitigation:**
- Strict rule: store all bound handlers as `private` class properties (not anonymous functions) so they can be passed to `eventBus.off()`
- Pattern:
  ```typescript
  // In create():
  this.boundNotePlayed = this.handleNotePlayed.bind(this);
  eventBus.on(Events.NOTE_PLAYED, this.boundNotePlayed);
  
  // In shutdown():
  eventBus.off(Events.NOTE_PLAYED, this.boundNotePlayed);
  ```
- Add `eventBus.clearAll()` call in GameScene shutdown as safety net (only safe if no other scenes are listening)

### Risk 6 — Phaser 3.90 API changes from documentation
**Impact:** Code written for Phaser 3.60–3.70 docs may not compile against 3.90.  
**Mitigation:**
- `npm run build` after Iteration 4 is the gate — don't proceed to Iteration 5 until build is clean
- Check Phaser 3.90 changelog for: ParticleEmitter API (changed in 3.60), Rectangle game object, Scene lifecycle
- Use `import type` for Phaser types where possible to catch mismatches early

### Risk 7 — React 19 + Phaser canvas lifecycle conflicts
**Impact:** React 19 StrictMode double-invokes effects — Phaser game instantiated twice.  
**Mitigation:**
- In `GameWrapper.tsx`, use `useRef` to store Phaser game instance
- Cleanup in `useEffect` return: `game.destroy(true)` — destroys canvas completely
- Guard: `if (gameRef.current) return;` at top of effect to prevent double-init
- Alternatively: remove `<React.StrictMode>` wrapper in development (acceptable trade-off for PRD 1)

### Risk 8 — `erasableSyntaxOnly` TypeScript config
**Impact:** Cannot use `enum` (non-erasable syntax). Must use `as const` objects instead.  
**Mitigation:** `types.ts` already uses string literal unions (`'Perfect' | 'Good'`), not enums. All good. Watch for: no `namespace`, no `abstract class` with unimplemented methods, no decorators.

### Risk 9 — Grade multiplier key naming mismatch
**Impact:** `SCORING.GRADE_MULTIPLIERS` in Constants uses wrong key names for `TimingGrade` literals.  
**Mitigation:** Keys MUST be `Perfect`, `Good`, `OK` (matching `TimingGrade`) — not `S`, `A`, `B` (those are `SongGrade`). Add a test that does `SCORING.GRADE_MULTIPLIERS['Perfect']` and checks it's a number.

---

## Dependency Order (Critical Path)

```
types.ts
    └── Constants.ts (no deps)
    └── EventBus.ts (no deps)
    └── GameState.ts (imports types.ts, Constants.ts)
            └── StreakManager.ts (imports Constants.ts, types.ts)
            └── Scorer.ts (imports Constants.ts, types.ts)
            └── HitDetector.ts (imports Constants.ts, types.ts)
            └── NoteScheduler.ts (imports Constants.ts, types.ts)
                    └── NoteSpawner.ts (imports NoteScheduler + Phaser + FallingNote)
                            └── FallingNote.ts (imports Phaser + Constants + types)
                                    └── GameScene.ts (imports everything above + Phaser)
                                            └── React integration (imports EventBus + types)
```

**Nothing in the critical path has a cycle.** Pure logic modules form a DAG before Phaser is introduced.

---

## Parallelization Opportunities

**Can parallelize within Iteration 2:**
- StreakManager tests + implementation
- Scorer tests + implementation
- These are completely independent — no shared state, no shared imports beyond Constants

**Can parallelize within Iteration 3:**
- HitDetector tests + implementation  
- NoteScheduler tests + implementation
- Independent of each other

**Cannot parallelize:**
- Iteration 1 must complete before Iterations 2/3 (GameState, Constants, types.ts are deps)
- Iteration 4 depends on Iterations 1–3 (uses all systems)
- Iteration 5 depends on Iteration 4 (React shell needs Phaser running)

---

## Scope Guardrails — What Is NOT in PRD 1

The following are **explicitly out of scope** for this iteration. Do not implement them even if they seem easy:

| Out of Scope | Belongs In |
|-------------|-----------|
| Mic pitch detection (Pitchy) | PRD 2 |
| Touch keyboard piano | PRD 2 |
| MIDI file parsing (@tonejs/midi) | PRD 3 |
| IndexedDB profiles storage | PRD 4 |
| XP persistence across sessions | PRD 4 |
| Theme system / dark/light toggle | PRD 5 |
| Audio Manager / Web Audio synth | PRD 1 §8 (defer to polish) |
| Auto-zoom / keyboard pan | PRD 1 §3.5 (defer) |
| MicInput.ts / InputBridge.ts | PRD 2 |
| PianoKeyboard visual object | PRD 2 |

**For PRD 1 testing:** Use a hardcoded `GameReadyNote[]` array (a short 5–10 note sequence) passed directly to GameScene. No MIDI parsing needed.

---

## Appendix A — Hardcoded Test Song Data

Use this to bootstrap GameScene without MIDI parsing:

```typescript
// src/test-fixtures/testSong.ts
import type { GameReadyNote } from '../core/types';

export const TEST_SONG: GameReadyNote[] = [
  { id: '1', pitch: 'C4', midiNote: 60, time: 1.0, duration: 0.5, velocity: 0.8, hand: 'right' },
  { id: '2', pitch: 'E4', midiNote: 64, time: 1.5, duration: 0.5, velocity: 0.8, hand: 'right' },
  { id: '3', pitch: 'G4', midiNote: 67, time: 2.0, duration: 0.5, velocity: 0.8, hand: 'right' },
  { id: '4', pitch: 'C4', midiNote: 60, time: 2.5, duration: 0.5, velocity: 0.8, hand: 'left' },
  { id: '5', pitch: 'E4', midiNote: 64, time: 3.0, duration: 0.5, velocity: 0.8, hand: 'left' },
  { id: '6', pitch: 'G4', midiNote: 67, time: 3.5, duration: 0.75, velocity: 0.9, hand: 'right' },
  { id: '7', pitch: 'C5', midiNote: 72, time: 4.5, duration: 1.0, velocity: 0.9, hand: 'right' },
];
```

This covers: both hands, varied durations, spread timing for streak building.

---

## Appendix B — ESLint Rules to Watch

The project uses TypeScript-ESLint strict config. Watch for:

- `@typescript-eslint/no-explicit-any` — avoid `any`, use `unknown` with type guards
- `@typescript-eslint/no-unused-vars` — all declared variables must be used (or prefixed with `_`)
- `react-hooks/exhaustive-deps` — React effect deps must be complete
- `react-refresh/only-export-components` — don't export non-components from component files

For Phaser scene classes: `_scene` prefix for unused constructor params passed to `super()`.

---

*This plan was generated by the SDW v2 Planner. Builder may deviate from specific implementation details where the existing codebase pattern differs, but the iteration order, test-first discipline, and Phaser/pure-logic split are non-negotiable.*
