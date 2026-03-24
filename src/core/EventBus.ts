// ─── EventBus ────────────────────────────────────────────────────────────────
// Zero-dependency event emitter shared between React and Phaser.
// Uses Array (not Set) so registering the same callback twice fires it twice.
// ZERO Phaser imports — runs in Node for testing.

type EventCallback = (data?: unknown) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const current = this.listeners.get(event);
    if (!current) return;
    const idx = current.indexOf(callback);
    if (idx !== -1) {
      current.splice(idx, 1);
    }
  }

  emit(event: string, data?: unknown): void {
    const current = this.listeners.get(event);
    if (!current) return;
    // Copy to avoid mutation issues if a listener removes itself
    for (const cb of [...current]) {
      cb(data);
    }
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

// ─── Shared singleton — React and Phaser both import this ────────────────────
export const eventBus = new EventBus();

// ─── Event Name Registry ─────────────────────────────────────────────────────
// ALL event strings go here. Never use raw strings in application code.
export const Events = {
  // Game Flow
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_END: 'game:end',
  GAME_RESTART: 'game:restart',

  // Input
  NOTE_PLAYED: 'input:notePlayed',
  NOTE_RELEASED: 'input:noteReleased',
  MIC_PERMISSION: 'input:micPermission',
  INPUT_MODE_CHANGE: 'input:modeChange',

  // Gameplay
  NOTE_SPAWNED: 'game:noteSpawned',
  NOTE_HIT: 'game:noteHit',
  NOTE_MISSED: 'game:noteMissed',
  NOTE_WRONG: 'game:noteWrong',
  STREAK_UPDATE: 'game:streakUpdate',
  SCORE_UPDATE: 'game:scoreUpdate',

  // Spectacle Events (for visual polish)
  SPECTACLE_HIT: 'spectacle:hit',
  SPECTACLE_COMBO: 'spectacle:combo',
  SPECTACLE_STREAK: 'spectacle:streak',

  // Results
  RESULTS_SHOW: 'results:show',

  // Profile
  PROFILE_SELECT: 'profile:select',
  XP_EARNED: 'profile:xpEarned',
  LEVEL_UP: 'profile:levelUp',

  // Practice
  PRACTICE_SPEED_CHANGE: 'practice:speedChange',
  PRACTICE_LOOP_UPDATE: 'practice:loopUpdate',
} as const;
