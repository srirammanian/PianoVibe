// ─── Scorer ───────────────────────────────────────────────────────────────────
// Calculates points, song grades, and XP rewards.
// ZERO Phaser imports — pure business logic, fully testable in Node.

import { SCORING, TIMING, XP } from '../../core/Constants'
import type { TimingGrade, SongGrade, GameMode, TimingPreset } from '../../core/types'

export class Scorer {
  /**
   * Calculate points for a single note hit.
   * @param grade            - The timing grade (Perfect/Good/OK/Miss/Wrong)
   * @param streakMultiplier - Current streak multiplier (1x, 2x, 3x, 4x)
   * @param isEarly          - Whether this was an early hit (standard mode only: 25% penalty)
   * @param isLate           - Whether this was a late hit past 75% window (hard mode only)
   * @param timingPreset     - TimingPreset (hard/standard/beginner — drives late/early penalties)
   */
  calculatePoints(
    grade: TimingGrade,
    streakMultiplier: number,
    isEarly: boolean,
    isLate: boolean,
    timingPreset: TimingPreset,
  ): number {
    if (grade === 'Miss' || grade === 'Wrong') return 0;

    // Hard mode late penalty: flat Base×0.5 formula (no grade multiplier, PRD §5.1)
    if (timingPreset === 'hard' && isLate) {
      return Math.round(SCORING.BASE_POINTS * 0.5 * streakMultiplier);
    }

    const gradeMultiplier = SCORING.GRADE_MULTIPLIERS[grade];
    // Early penalty is standard-mode only (hard mode doesn't grant late-early credit)
    const earlyPenalty = (timingPreset === 'standard' && isEarly) ? TIMING.EARLY_PENALTY_MULTIPLIER : 1.0;

    return Math.round(
      SCORING.BASE_POINTS * gradeMultiplier * streakMultiplier * earlyPenalty,
    );
  }

  /**
   * Calculate the song grade letter from overall accuracy.
   * @param accuracy - 0.0 to 1.0 (fraction of notes hit perfectly/well)
   */
  calculateGrade(accuracy: number): SongGrade {
    const pct = accuracy * 100;
    const t = SCORING.GRADE_THRESHOLDS;
    if (pct >= t.S) return 'S';
    if (pct >= t.A) return 'A';
    if (pct >= t.B) return 'B';
    if (pct >= t.C) return 'C';
    return 'D';
  }

  /**
   * Calculate XP earned for a completed song.
   * @param grade - Song grade (S/A/B/C/D)
   * @param mode  - GameMode (practice mode applies speed bonuses, PRD §5.5)
   * @param speed - Playback speed (>1.25 → ×1.5, >1.0 → ×1.25, else no bonus)
   */
  calculateXP(grade: SongGrade, mode: GameMode, speed: number): number {
    const base = XP.BASE_XP;
    const bonus = XP.GRADE_BONUS[grade];
    let total = Math.max(0, base + bonus);

    // Practice mode only: apply speed bonus
    if (mode === 'practice') {
      if (speed > XP.SPEED_BONUS_THRESHOLDS.HIGH) {        // > 1.25
        total = Math.round(total * 1.5);
      } else if (speed > XP.SPEED_BONUS_THRESHOLDS.MEDIUM) { // > 1.0
        total = Math.round(total * 1.25);
      }
      // speed <= 1.0: no bonus
    }
    // Performance mode: no speed bonus regardless of speed

    return Math.max(0, total);  // floor guarantee after multiplication
  }
}
