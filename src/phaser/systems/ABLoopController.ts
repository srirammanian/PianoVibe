// ─── A-B Loop Controller ─────────────────────────────────────────────────────
// Pure state machine — no Phaser dependency, fully testable in Node.
//
// State transitions:
//   IDLE → markA() → A_MARKED → markB() → LOOP_ACTIVE
//   any  → clear() → IDLE

type ABState = 'IDLE' | 'A_MARKED' | 'LOOP_ACTIVE';

export class ABLoopController {
  private state: ABState = 'IDLE';
  private loopStart: number | null = null;
  private loopEnd: number | null = null;

  /** Mark the loop start point at the given song position (seconds). Clamped to >= 0. */
  markA(currentTimeSec: number): void {
    this.loopStart = Math.max(0, currentTimeSec);
    this.loopEnd = null;
    this.state = 'A_MARKED';
  }

  /**
   * Mark the loop end point.
   * Silently ignored if state is not A_MARKED or if B ≤ A.
   */
  markB(currentTimeSec: number): void {
    if (this.state !== 'A_MARKED') return;
    if (currentTimeSec <= (this.loopStart ?? 0)) return; // B must be strictly after A
    this.loopEnd = currentTimeSec;
    this.state = 'LOOP_ACTIVE';
  }

  /** Deactivate any active loop and return to IDLE. */
  clear(): void {
    this.loopStart = null;
    this.loopEnd = null;
    this.state = 'IDLE';
  }

  /**
   * Returns true when the game clock has reached or passed the loop end
   * and an active loop is configured.
   */
  shouldLoop(currentTimeSec: number): boolean {
    if (this.state !== 'LOOP_ACTIVE') return false;
    if (this.loopEnd === null) return false;
    return currentTimeSec >= this.loopEnd;
  }

  getLoopStart(): number | null {
    return this.loopStart;
  }

  getLoopEnd(): number | null {
    return this.loopEnd;
  }

  getState(): ABState {
    return this.state;
  }
}
