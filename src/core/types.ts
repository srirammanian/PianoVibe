// ─── String Literal Unions (no TypeScript enums — erasableSyntaxOnly) ────────

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
  accuracyMs: number;  // signed, negative = early
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
