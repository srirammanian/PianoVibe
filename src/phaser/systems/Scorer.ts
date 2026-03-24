// ─── Scorer ───────────────────────────────────────────────────────────────────
// Calculates points, song grades, and XP rewards.
// ZERO Phaser imports — pure business logic, fully testable in Node.

import { SCORING, TIMING, XP } from '../../core/Constants'
import type { TimingGrade, SongGrade, GameMode } from '../../core/types'

export class Scorer {
  /**
   * Calculate points for a single note hit.
   * @param grade      - The timing grade (Perfect/Good/OK/Miss/Wrong)
   * @param streakMultiplier - Current streak multiplier (1x, 2x, 3x, 4x)
   * @param isEarly    - Whether this was an early hit (applies penalty)
   * @param _mode      - GameMode (reserved for future hard-mode late penalty)
   */
  calculatePoints(
    grade: TimingGrade,
    streakMultiplier: number,
    isEarly: boolean,
    _mode: GameMode,
  ): number {
    if (grade === 'Miss' || grade === 'Wrong') return 0;

    const gradeMultiplier = SCORING.GRADE_MULTIPLIERS[grade];
    const earlyPenalty = isEarly ? TIMING.EARLY_PENALTY_MULTIPLIER : 1.0;

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
   * @param grade  - Song grade (S/A/B/C/D)
   * @param _mode  - GameMode (reserved for practice speed bonuses)
   * @param _speed - Playback speed (reserved for practice speed bonuses)
   */
  calculateXP(grade: SongGrade, _mode: GameMode, _speed: number): number {
    const base = XP.BASE_XP;
    const bonus = XP.GRADE_BONUS[grade];
    return Math.max(0, base + bonus);
  }
}
