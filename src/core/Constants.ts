// ═══════════════════════════════════════════════════════════
// GAME CONFIGURATION — All magic numbers live here
// No imports — pure data module
// ═══════════════════════════════════════════════════════════

export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: 0x0D1117,
  PLAY_LINE_Y_OFFSET: 80,       // pixels from bottom of canvas
} as const;

// ═══════════════════════════════════════════════════════════
// NOTE FALLING PHYSICS
// ═══════════════════════════════════════════════════════════

export const NOTE = {
  FALL_DURATION_SEC: 2.5,        // Time to fall from top to play line
  HEIGHT: 24,                    // Note gem height in pixels
  MIN_WIDTH: 40,                 // Minimum gem width (short notes)
  MAX_WIDTH: 120,                // Maximum gem width (long notes)
  CORNER_RADIUS: 4,
  GLOW_SPREAD: 8,

  // Colors (hex)
  RIGHT_HAND_COLOR: 0xE74C3C,
  LEFT_HAND_COLOR: 0x3498DB,
  GHOST_OPACITY: 0.3,
} as const;

// ═══════════════════════════════════════════════════════════
// TIMING WINDOWS (in milliseconds)
// ═══════════════════════════════════════════════════════════

export const TIMING = {
  PRESETS: {
    beginner: { window: 500, label: 'Relaxed' },
    standard: { window: 300, label: 'Standard' },
    hard: { window: 150, label: 'Strict' },
  },

  // Timing grade boundaries (percentage of window from center)
  PERFECT: 0.25,   // Inner 25% of window → Perfect
  GOOD: 0.75,      // 25–75% of window → Good
  OK: 1.0,         // 75–100% of window → OK

  // Early note handling
  EARLY_PENALTY_MULTIPLIER: 0.75,   // Standard mode: 25% point deduction for early hits

  // Chord simultaneity tolerance (ms)
  CHORD_TOLERANCE: {
    beginner: 100,
    standard: 50,
    hard: 25,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════

export const SCORING = {
  BASE_POINTS: 100,

  // Per-note grade multipliers (TimingGrade → multiplier)
  // Keys match TimingGrade literals: Perfect | Good | OK
  GRADE_MULTIPLIERS: {
    Perfect: 1.0,
    Good: 0.75,
    OK: 0.5,
  },

  // Streak bands: consecutive hits → score multiplier
  STREAK_MULTIPLIERS: [
    { minStreak: 0,  maxStreak: 4,        multiplier: 1 },
    { minStreak: 5,  maxStreak: 9,        multiplier: 2 },
    { minStreak: 10, maxStreak: 19,       multiplier: 3 },
    { minStreak: 20, maxStreak: Infinity, multiplier: 4 },
  ],

  // Song-level accuracy thresholds (percentage)
  GRADE_THRESHOLDS: {
    S: 95,
    A: 85,
    B: 70,
    C: 50,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// XP & PROGRESSION
// ═══════════════════════════════════════════════════════════

export const XP = {
  BASE_XP: 50,

  // Added to BASE_XP based on song grade
  GRADE_BONUS: {
    S: 100,
    A: 50,
    B: 25,
    C: 0,
    D: -25,
  },

  // Practice mode speed bonuses (applied when mode === 'practice')
  SPEED_BONUS_THRESHOLDS: {
    HIGH: 1.25,       // speed > 1.25 → 1.5× XP
    MEDIUM: 1.0,      // speed > 1.0  → 1.25× XP
  },
} as const;

// ═══════════════════════════════════════════════════════════
// VISUAL FEEDBACK
// ═══════════════════════════════════════════════════════════

export const FEEDBACK = {
  COLORS: {
    perfect: 0x2ECC71,
    good: 0xF39C12,
    ok: 0xE67E22,
    miss: 0xE74C3C,
    wrong: 0xC0392B,
  },

  FLOATING_TEXT: {
    DURATION_MS: 450,
    SCALE_IN: 1.2,
    FLOAT_DISTANCE: 30,
  },

  PARTICLES: {
    HIT_BURST_COUNT: 10,
    HIT_BURST_LIFESPAN: 400,
    STREAK_TRAIL_COUNT: 5,
    STREAK_TRAIL_LIFESPAN: 300,
  },

  STREAK_EFFECTS: {
    FLAME_THRESHOLD: 5,
    SHAKE_THRESHOLD: 20,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════

export const AUDIO = {
  METRONOME_BPM_MIN: 30,
  METRONOME_BPM_MAX: 240,

  PITCHY: {
    SAMPLE_RATE: 44100,
    BUFFER_SIZE: 2048,
    MIN_FREQUENCY: 27.5,   // A0
    MAX_FREQUENCY: 4186,   // C8
    MIN_CONFIDENCE: 0.8,
    DEBOUNCE_MS: 50,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// PRACTICE TOOLS
// ═══════════════════════════════════════════════════════════

export const PRACTICE = {
  SPEED_MIN: 0.25,
  SPEED_MAX: 1.5,
  SPEED_STEP: 0.05,
  SPEED_DEFAULT: 1.0,
} as const;
