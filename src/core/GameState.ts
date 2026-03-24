// ─── GameState ────────────────────────────────────────────────────────────────
// Centralized game state with typed get/set and selective reset.
// ZERO Phaser imports — runs in Node for testing.

import type { GameStateData } from './types';

const DEFAULTS: GameStateData = {
  // Profile
  currentProfileId: null,

  // Song
  currentSongId: null,
  currentSongData: null,

  // Phase
  phase: 'TITLE',
  isPlaying: false,
  isPaused: false,
  mode: 'performance',

  // Scoring (live)
  score: 0,
  streak: 0,
  maxStreak: 0,
  notesHit: 0,
  notesMissed: 0,
  notesTotal: 0,

  // Settings — NOT reset between songs
  timingPreset: 'standard',
  timingWindowMs: 300,
  handMode: 'both',
  speed: 1.0,

  // Practice
  loopStart: null,
  loopEnd: null,
};

// Fields that reset() clears (per-run state).
// Settings (mode, speed, timingPreset, handMode) are intentionally excluded.
const RESETTABLE_FIELDS: ReadonlyArray<keyof GameStateData> = [
  'score',
  'streak',
  'maxStreak',
  'notesHit',
  'notesMissed',
  'isPlaying',
  'isPaused',
  'loopStart',
  'loopEnd',
  'currentSongData',
  'currentSongId',
  'phase',
] as const;

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
      // Type-safe reset: cast through unknown to satisfy TypeScript
      (this.data as Record<string, unknown>)[field] = DEFAULTS[field];
    }
  }
}

// Shared singleton — use in app code, NOT in unit tests
export const gameState = new GameState();
