// ─── StreakManager ────────────────────────────────────────────────────────────
// Tracks consecutive hit streaks and computes score multipliers.
// ZERO Phaser imports — pure business logic, fully testable in Node.

import { SCORING } from '../../core/Constants'
import type { StreakState } from '../../core/types'

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
    // Iterate from highest band down — return first band where streak qualifies
    for (let i = bands.length - 1; i >= 0; i--) {
      if (streak >= bands[i].minStreak) {
        return bands[i].multiplier;
      }
    }
    return 1;
  }
}
