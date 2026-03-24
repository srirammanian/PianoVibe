// ─── HitDetector ──────────────────────────────────────────────────────────────
// Evaluates player input timing against scheduled note times.
// ZERO Phaser imports — pure business logic, fully testable in Node.

import { TIMING } from '../../core/Constants'
import type { TimingGrade, TimingPreset } from '../../core/types'

export interface GradeResult {
  grade: TimingGrade;
  isEarly: boolean;
  accuracyMs: number;  // signed: negative=early, positive=late, 0=perfect
}

export class HitDetector {
  /**
   * Grade a player's hit against a target note.
   *
   * Algorithm:
   * 1. pitchMatches=false → Wrong (regardless of timing)
   * 2. Compute delta = inputTime - noteTime (negative=early, positive=late)
   * 3. If |delta| < window → grade by position (Perfect/Good/OK), isEarly=false
   * 4. If input is early AND |delta| <= window*2 (early zone):
   *    - beginner: Miss, isEarly=false (beginner ignores early)
   *    - hard:     Miss, isEarly=true  (hard breaks streak)
   *    - standard: grade by position using absDelta, isEarly=true
   * 5. Otherwise: Miss, isEarly=false
   */
  gradeHit(
    inputTimeMs: number,
    noteTimeMs: number,
    windowMs: number,
    preset: TimingPreset,
    pitchMatches: boolean,
  ): GradeResult {
    if (!pitchMatches) {
      return { grade: 'Wrong', isEarly: false, accuracyMs: 0 };
    }

    const delta = inputTimeMs - noteTimeMs;  // negative=early, positive=late
    const absDelta = Math.abs(delta);
    const isEarlyInput = delta < 0;

    // Main timing window (strict less-than so boundary is Miss)
    if (absDelta < windowMs) {
      const grade = this.gradeByPosition(absDelta, windowMs);
      return { grade, isEarly: false, accuracyMs: delta };
    }

    // Early zone: (windowMs, 2*windowMs] — strictly after the main window
    // absDelta === windowMs falls through to Miss (boundary is exclusive)
    if (isEarlyInput && absDelta > windowMs && absDelta <= windowMs * 2) {
      if (preset === 'beginner') {
        // Beginner ignores early zone — no credit, no early flag
        return { grade: 'Miss', isEarly: false, accuracyMs: delta };
      }
      if (preset === 'hard') {
        // Hard mode: early hit still misses, but flag it so streak breaks
        return { grade: 'Miss', isEarly: true, accuracyMs: delta };
      }
      // Standard mode: credit the hit with early flag (penalty applied by Scorer)
      const grade = this.gradeByPosition(absDelta, windowMs);
      return { grade, isEarly: true, accuracyMs: delta };
    }

    // Outside all windows — clean Miss
    return { grade: 'Miss', isEarly: false, accuracyMs: delta };
  }

  /**
   * Grade by absolute delta position within the timing window.
   * Uses strict < so boundaries fall into the less-precise tier.
   *
   * <  window * PERFECT (0.25) → Perfect
   * <  window * GOOD    (0.75) → Good
   * else                       → OK
   */
  private gradeByPosition(absDelta: number, windowMs: number): TimingGrade {
    if (absDelta < windowMs * TIMING.PERFECT) return 'Perfect';
    if (absDelta < windowMs * TIMING.GOOD) return 'Good';
    return 'OK';
  }
}
