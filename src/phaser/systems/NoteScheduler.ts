// ─── NoteScheduler ────────────────────────────────────────────────────────────
// Pre-calculates when to spawn notes based on fall duration and playback speed.
// ZERO Phaser imports — pure scheduling logic, fully testable in Node.
//
// Usage:
//   scheduler.buildSchedule(songNotes, speed)
//   Each frame: scheduler.getNotesToSpawn(gameClock) → new notes to render
//   On hit/miss: scheduler.markConsumed(noteId)
//   A-B loop: scheduler.reset() clears consumed set for replay

import { NOTE } from '../../core/Constants'
import type { GameReadyNote, SpawnScheduleEntry } from '../../core/types'

export class NoteScheduler {
  private schedule: SpawnScheduleEntry[] = [];
  private consumed = new Set<string>();

  /**
   * Pre-calculate spawn times for all notes in the song.
   * Sorts by spawnAtMs ascending for efficient frame-by-frame querying.
   *
   * spawnAtMs = noteTimeMs - (FALL_DURATION_SEC * 1000 / speed)
   * targetMs  = noteTimeMs
   */
  buildSchedule(notes: GameReadyNote[], speed: number): void {
    const fallDurationMs = NOTE.FALL_DURATION_SEC * 1000;
    const adjustedFallMs = fallDurationMs / speed;

    this.schedule = notes
      .map((note): SpawnScheduleEntry => ({
        noteId: note.id,
        noteData: note,
        targetMs: note.time * 1000,
        spawnAtMs: note.time * 1000 - adjustedFallMs,
      }))
      .sort((a, b) => a.spawnAtMs - b.spawnAtMs);

    this.consumed.clear();
  }

  /**
   * Returns all notes whose spawnAtMs <= currentMs that have not yet been consumed.
   * Call every frame with the current game clock.
   */
  getNotesToSpawn(currentMs: number): SpawnScheduleEntry[] {
    return this.schedule.filter(
      (e) => e.spawnAtMs <= currentMs && !this.consumed.has(e.noteId),
    );
  }

  /**
   * Mark a note as consumed (spawned or hit/missed).
   * Consumed notes are excluded from future getNotesToSpawn results.
   */
  markConsumed(noteId: string): void {
    this.consumed.add(noteId);
  }

  /**
   * Returns notes that have passed their timing window without being consumed.
   * These are auto-misses.
   *
   * A note is missed when: currentMs > targetMs + windowMs AND not consumed.
   */
  getMissedNotes(currentMs: number, windowMs: number): SpawnScheduleEntry[] {
    return this.schedule.filter(
      (e) => !this.consumed.has(e.noteId) && currentMs > e.targetMs + windowMs,
    );
  }

  /**
   * Clear the consumed set without rebuilding the schedule.
   * Used for A-B loop replay — same notes can be spawned again.
   */
  reset(): void {
    this.consumed.clear();
  }

  /** Returns a copy of the full schedule (for inspection/testing). */
  getSchedule(): SpawnScheduleEntry[] {
    return [...this.schedule];
  }
}
