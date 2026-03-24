import { describe, it, expect, beforeEach } from 'vitest'
import { NoteScheduler } from '../NoteScheduler'
import type { GameReadyNote } from '../../../core/types'

// Helper to build a minimal GameReadyNote
function makeNote(id: string, timeSec: number): GameReadyNote {
  return {
    id,
    pitch: 'C4',
    midiNote: 60,
    time: timeSec,
    duration: 0.5,
    velocity: 0.8,
    hand: 'right',
  }
}

describe('NoteScheduler', () => {
  let sched: NoteScheduler

  beforeEach(() => {
    sched = new NoteScheduler()
  })

  // ─── Schedule calculation ────────────────────────────────────────────────────
  // NOTE.FALL_DURATION_SEC = 2.5s → 2500ms

  it('note at time=2.5s, speed=1.0 → spawnAtMs=0', () => {
    sched.buildSchedule([makeNote('n1', 2.5)], 1.0)
    const entries = sched.getSchedule()
    expect(entries).toHaveLength(1)
    expect(entries[0].spawnAtMs).toBe(0)
    expect(entries[0].targetMs).toBe(2500)
  })

  it('note at time=5.0s, speed=1.0 → spawnAtMs=2500', () => {
    sched.buildSchedule([makeNote('n1', 5.0)], 1.0)
    const entries = sched.getSchedule()
    expect(entries[0].spawnAtMs).toBe(2500)
    expect(entries[0].targetMs).toBe(5000)
  })

  it('speed=0.5: fall duration doubles → note at 5.0s, spawnAtMs=0', () => {
    // adjustedFall = 2500 / 0.5 = 5000ms
    // spawnAtMs = 5000 - 5000 = 0
    sched.buildSchedule([makeNote('n1', 5.0)], 0.5)
    const entries = sched.getSchedule()
    expect(entries[0].spawnAtMs).toBe(0)
  })

  it('speed=2.0: fall duration halves → note at 5.0s, spawnAtMs=3750', () => {
    // adjustedFall = 2500 / 2.0 = 1250ms
    // spawnAtMs = 5000 - 1250 = 3750
    sched.buildSchedule([makeNote('n1', 5.0)], 2.0)
    const entries = sched.getSchedule()
    expect(entries[0].spawnAtMs).toBe(3750)
  })

  it('buildSchedule with 3 notes → schedule sorted by spawnAtMs ascending', () => {
    const notes = [
      makeNote('n3', 7.5), // spawnAtMs=5000
      makeNote('n1', 2.5), // spawnAtMs=0
      makeNote('n2', 5.0), // spawnAtMs=2500
    ]
    sched.buildSchedule(notes, 1.0)
    const entries = sched.getSchedule()
    expect(entries[0].spawnAtMs).toBe(0)
    expect(entries[1].spawnAtMs).toBe(2500)
    expect(entries[2].spawnAtMs).toBe(5000)
  })

  it('buildSchedule([], speed) → empty schedule', () => {
    sched.buildSchedule([], 1.0)
    expect(sched.getSchedule()).toHaveLength(0)
  })

  it('buildSchedule with speed=0 throws RangeError', () => {
    expect(() => sched.buildSchedule([makeNote('n1', 2.5)], 0)).toThrow(RangeError)
  })

  it('buildSchedule with speed=-1 throws RangeError', () => {
    expect(() => sched.buildSchedule([makeNote('n1', 2.5)], -1)).toThrow(RangeError)
  })

  // ─── getNotesToSpawn ────────────────────────────────────────────────────────

  it('getNotesToSpawn(0): returns notes with spawnAtMs <= 0', () => {
    sched.buildSchedule([makeNote('n1', 2.5), makeNote('n2', 5.0)], 1.0)
    // n1 spawnAtMs=0, n2 spawnAtMs=2500
    const toSpawn = sched.getNotesToSpawn(0)
    expect(toSpawn).toHaveLength(1)
    expect(toSpawn[0].noteId).toBe('n1')
  })

  it('getNotesToSpawn(2500): returns notes spawning at or before 2500ms', () => {
    sched.buildSchedule([makeNote('n1', 2.5), makeNote('n2', 5.0)], 1.0)
    const toSpawn = sched.getNotesToSpawn(2500)
    expect(toSpawn).toHaveLength(2)
  })

  it('after markConsumed(noteId): getNotesToSpawn no longer returns that note', () => {
    sched.buildSchedule([makeNote('n1', 2.5), makeNote('n2', 5.0)], 1.0)
    sched.markConsumed('n1')
    const toSpawn = sched.getNotesToSpawn(0)
    expect(toSpawn).toHaveLength(0)
  })

  it('markConsumed does not affect other notes', () => {
    sched.buildSchedule([makeNote('n1', 2.5), makeNote('n2', 5.0)], 1.0)
    sched.markConsumed('n1')
    const toSpawn = sched.getNotesToSpawn(2500)
    expect(toSpawn).toHaveLength(1)
    expect(toSpawn[0].noteId).toBe('n2')
  })

  // ─── getMissedNotes ─────────────────────────────────────────────────────────

  it('getMissedNotes: returns notes past targetMs + windowMs not consumed', () => {
    sched.buildSchedule([makeNote('n1', 2.5), makeNote('n2', 5.0)], 1.0)
    // n1: targetMs=2500, n2: targetMs=5000
    // With windowMs=300, n1 is missed after currentMs > 2800
    const missed = sched.getMissedNotes(3000, 300)
    expect(missed).toHaveLength(1)
    expect(missed[0].noteId).toBe('n1')
  })

  it('getMissedNotes: consumed notes are not returned', () => {
    sched.buildSchedule([makeNote('n1', 2.5)], 1.0)
    sched.markConsumed('n1')
    const missed = sched.getMissedNotes(5000, 300)
    expect(missed).toHaveLength(0)
  })

  // ─── reset ──────────────────────────────────────────────────────────────────

  it('reset(): clears consumed set — previously consumed notes are returned again', () => {
    sched.buildSchedule([makeNote('n1', 2.5)], 1.0)
    sched.markConsumed('n1')
    expect(sched.getNotesToSpawn(0)).toHaveLength(0)  // filtered by consumed
    sched.reset()
    expect(sched.getNotesToSpawn(0)).toHaveLength(1)  // n1 available again
  })

  // ─── SpawnScheduleEntry shape ────────────────────────────────────────────────

  it('schedule entries have noteId, noteData, spawnAtMs, targetMs', () => {
    const note = makeNote('n1', 2.5)
    sched.buildSchedule([note], 1.0)
    const entry = sched.getSchedule()[0]
    expect(entry).toHaveProperty('noteId', 'n1')
    expect(entry).toHaveProperty('noteData', note)
    expect(entry).toHaveProperty('spawnAtMs', 0)
    expect(entry).toHaveProperty('targetMs', 2500)
  })
})
