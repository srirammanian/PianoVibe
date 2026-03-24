import { describe, it, expect, beforeEach } from 'vitest'
import { HitDetector } from '../HitDetector'
import type { GradeResult } from '../HitDetector'

describe('HitDetector', () => {
  let hd: HitDetector
  const NOTE_TIME = 1000 // ms

  beforeEach(() => {
    hd = new HitDetector()
  })

  // ─── Standard mode (window = 300ms) ─────────────────────────────────────────

  describe('standard mode (window=300ms)', () => {
    const W = 300

    it('inputTime === noteTime → Perfect', () => {
      const r = hd.gradeHit(NOTE_TIME, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Perfect')
      expect(r.isEarly).toBe(false)
      expect(r.accuracyMs).toBe(0)
    })

    it('74ms early → Perfect (< 300×0.25=75ms boundary)', () => {
      const r = hd.gradeHit(NOTE_TIME - 74, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Perfect')
    })

    it('75ms early → Good (at 75ms boundary, not Perfect)', () => {
      const r = hd.gradeHit(NOTE_TIME - 75, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Good')
    })

    it('224ms early → Good (< 300×0.75=225ms boundary)', () => {
      const r = hd.gradeHit(NOTE_TIME - 224, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Good')
    })

    it('225ms early → OK (at 225ms boundary, not Good)', () => {
      const r = hd.gradeHit(NOTE_TIME - 225, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('OK')
    })

    it('299ms early → OK (inside window)', () => {
      const r = hd.gradeHit(NOTE_TIME - 299, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('OK')
    })

    it('300ms early → Miss (outside window)', () => {
      const r = hd.gradeHit(NOTE_TIME - 300, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Miss')
    })

    it('74ms late → Perfect (symmetric)', () => {
      const r = hd.gradeHit(NOTE_TIME + 74, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Perfect')
    })

    it('225ms late → OK', () => {
      const r = hd.gradeHit(NOTE_TIME + 225, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('OK')
    })

    it('301ms late → Miss', () => {
      const r = hd.gradeHit(NOTE_TIME + 301, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Miss')
    })
  })

  // ─── Beginner mode (window = 500ms) ─────────────────────────────────────────

  describe('beginner mode (window=500ms)', () => {
    const W = 500

    it('124ms off → Perfect (< 500×0.25=125ms)', () => {
      const r = hd.gradeHit(NOTE_TIME - 124, NOTE_TIME, W, 'beginner', true)
      expect(r.grade).toBe('Perfect')
    })

    it('500ms off → Miss (outside window)', () => {
      const r = hd.gradeHit(NOTE_TIME - 500, NOTE_TIME, W, 'beginner', true)
      expect(r.grade).toBe('Miss')
    })
  })

  // ─── Hard mode (window = 150ms) ──────────────────────────────────────────────

  describe('hard mode (window=150ms)', () => {
    const W = 150

    it('37ms off → Perfect (< 150×0.25=37.5ms)', () => {
      const r = hd.gradeHit(NOTE_TIME - 37, NOTE_TIME, W, 'hard', true)
      expect(r.grade).toBe('Perfect')
    })

    it('151ms off → Miss (outside window)', () => {
      const r = hd.gradeHit(NOTE_TIME - 151, NOTE_TIME, W, 'hard', true)
      expect(r.grade).toBe('Miss')
    })
  })

  // ─── Early note handling ─────────────────────────────────────────────────────

  describe('early note handling — standard mode', () => {
    const W = 300

    it('400ms early (in early zone [300ms, 600ms]) → isEarly=true, grade=Good or OK', () => {
      const r = hd.gradeHit(NOTE_TIME - 400, NOTE_TIME, W, 'standard', true)
      expect(r.isEarly).toBe(true)
      expect(['Good', 'OK']).toContain(r.grade)
    })

    it('700ms early (past early zone) → Miss, isEarly=false', () => {
      const r = hd.gradeHit(NOTE_TIME - 700, NOTE_TIME, W, 'standard', true)
      expect(r.grade).toBe('Miss')
      expect(r.isEarly).toBe(false)
    })
  })

  describe('early note handling — beginner mode', () => {
    it('600ms early (beginner window=500ms, zone=[500ms,1000ms]) → Miss, beginner ignores early', () => {
      const r = hd.gradeHit(NOTE_TIME - 600, NOTE_TIME, 500, 'beginner', true)
      expect(r.grade).toBe('Miss')
      expect(r.isEarly).toBe(false)
    })
  })

  describe('early note handling — hard mode', () => {
    it('200ms early (hard window=150ms, zone=[150ms,300ms]) → Miss, isEarly=true', () => {
      const r = hd.gradeHit(NOTE_TIME - 200, NOTE_TIME, 150, 'hard', true)
      expect(r.grade).toBe('Miss')
      expect(r.isEarly).toBe(true)
    })
  })

  // ─── Wrong note ───────────────────────────────────────────────────────────────

  describe('wrong note (pitchMatches=false)', () => {
    it('wrong pitch → grade=Wrong regardless of timing', () => {
      const r = hd.gradeHit(NOTE_TIME, NOTE_TIME, 300, 'standard', false)
      expect(r.grade).toBe('Wrong')
      expect(r.isEarly).toBe(false)
      expect(r.accuracyMs).toBe(0)
    })

    it('wrong pitch even at perfect timing → Wrong', () => {
      const r = hd.gradeHit(NOTE_TIME, NOTE_TIME, 300, 'standard', false)
      expect(r.grade).toBe('Wrong')
    })

    it('wrong pitch with late input → still Wrong', () => {
      const r = hd.gradeHit(NOTE_TIME + 50, NOTE_TIME, 300, 'standard', false)
      expect(r.grade).toBe('Wrong')
    })
  })

  // ─── GradeResult shape ────────────────────────────────────────────────────────

  describe('GradeResult shape', () => {
    it('result has grade, isEarly, accuracyMs properties', () => {
      const r: GradeResult = hd.gradeHit(NOTE_TIME, NOTE_TIME, 300, 'standard', true)
      expect(r).toHaveProperty('grade')
      expect(r).toHaveProperty('isEarly')
      expect(r).toHaveProperty('accuracyMs')
    })

    it('accuracyMs is negative for early input (inputTime < noteTime)', () => {
      const r = hd.gradeHit(NOTE_TIME - 50, NOTE_TIME, 300, 'standard', true)
      expect(r.accuracyMs).toBeLessThan(0)
      expect(r.accuracyMs).toBe(-50)
    })

    it('accuracyMs is positive for late input (inputTime > noteTime)', () => {
      const r = hd.gradeHit(NOTE_TIME + 50, NOTE_TIME, 300, 'standard', true)
      expect(r.accuracyMs).toBeGreaterThan(0)
      expect(r.accuracyMs).toBe(50)
    })

    it('accuracyMs is 0 for perfect timing', () => {
      const r = hd.gradeHit(NOTE_TIME, NOTE_TIME, 300, 'standard', true)
      expect(r.accuracyMs).toBe(0)
    })

    it('isEarly=false for late hits', () => {
      const r = hd.gradeHit(NOTE_TIME + 100, NOTE_TIME, 300, 'standard', true)
      expect(r.isEarly).toBe(false)
    })
  })

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('standard mode: 300ms window exactly at boundary → Miss', () => {
      // absDelta=300, window=300: 300 < 300 is false → Miss
      const r = hd.gradeHit(NOTE_TIME + 300, NOTE_TIME, 300, 'standard', true)
      expect(r.grade).toBe('Miss')
    })

    it('standard mode: 299ms late → OK (last valid slot)', () => {
      const r = hd.gradeHit(NOTE_TIME + 299, NOTE_TIME, 300, 'standard', true)
      expect(r.grade).toBe('OK')
    })
  })
})
