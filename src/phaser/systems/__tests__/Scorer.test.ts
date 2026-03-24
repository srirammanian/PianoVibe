import { describe, it, expect, beforeEach } from 'vitest'
import { Scorer } from '../Scorer'

describe('Scorer', () => {
  let scorer: Scorer

  beforeEach(() => {
    scorer = new Scorer()
  })

  // ─── calculatePoints ────────────────────────────────────────────────────────

  describe('calculatePoints', () => {
    it('Perfect + streak 1x = 100 points', () => {
      expect(scorer.calculatePoints('Perfect', 1, false, 'performance')).toBe(100)
    })

    it('Good + streak 1x = 75 points', () => {
      expect(scorer.calculatePoints('Good', 1, false, 'performance')).toBe(75)
    })

    it('OK + streak 1x = 50 points', () => {
      expect(scorer.calculatePoints('OK', 1, false, 'performance')).toBe(50)
    })

    it('Perfect + streak 2x = 200 points', () => {
      expect(scorer.calculatePoints('Perfect', 2, false, 'performance')).toBe(200)
    })

    it('Perfect + streak 3x = 300 points', () => {
      expect(scorer.calculatePoints('Perfect', 3, false, 'performance')).toBe(300)
    })

    it('Perfect + streak 4x = 400 points', () => {
      expect(scorer.calculatePoints('Perfect', 4, false, 'performance')).toBe(400)
    })

    it('Good + streak 2x = 150 points', () => {
      expect(scorer.calculatePoints('Good', 2, false, 'performance')).toBe(150)
    })

    it('OK + streak 4x = 200 points', () => {
      expect(scorer.calculatePoints('OK', 4, false, 'performance')).toBe(200)
    })

    it('Perfect + early penalty = 75 points (100 × 1.0 × 1 × 0.75)', () => {
      expect(scorer.calculatePoints('Perfect', 1, true, 'performance')).toBe(75)
    })

    it('Good + early penalty = 56 points (Math.round(100 × 0.75 × 1 × 0.75))', () => {
      // 100 × 0.75 × 1 × 0.75 = 56.25 → Math.round = 56
      expect(scorer.calculatePoints('Good', 1, true, 'performance')).toBe(56)
    })

    it('OK + early penalty = 38 points (Math.round(100 × 0.5 × 1 × 0.75))', () => {
      // 100 × 0.5 × 1 × 0.75 = 37.5 → Math.round = 38
      expect(scorer.calculatePoints('OK', 1, true, 'performance')).toBe(38)
    })

    it('Miss = 0 points', () => {
      expect(scorer.calculatePoints('Miss', 1, false, 'performance')).toBe(0)
    })

    it('Wrong = 0 points', () => {
      expect(scorer.calculatePoints('Wrong', 1, false, 'performance')).toBe(0)
    })

    it('Miss with any streak still = 0', () => {
      expect(scorer.calculatePoints('Miss', 4, false, 'performance')).toBe(0)
    })

    it('Wrong with early flag still = 0', () => {
      expect(scorer.calculatePoints('Wrong', 4, true, 'performance')).toBe(0)
    })
  })

  // ─── calculateGrade ─────────────────────────────────────────────────────────

  describe('calculateGrade', () => {
    it('1.0 (100%) → S', () => {
      expect(scorer.calculateGrade(1.0)).toBe('S')
    })

    it('0.95 (95%) → S', () => {
      expect(scorer.calculateGrade(0.95)).toBe('S')
    })

    it('0.94 (94%) → A', () => {
      expect(scorer.calculateGrade(0.94)).toBe('A')
    })

    it('0.85 (85%) → A', () => {
      expect(scorer.calculateGrade(0.85)).toBe('A')
    })

    it('0.84 (84%) → B', () => {
      expect(scorer.calculateGrade(0.84)).toBe('B')
    })

    it('0.70 (70%) → B', () => {
      expect(scorer.calculateGrade(0.70)).toBe('B')
    })

    it('0.69 (69%) → C', () => {
      expect(scorer.calculateGrade(0.69)).toBe('C')
    })

    it('0.50 (50%) → C', () => {
      expect(scorer.calculateGrade(0.50)).toBe('C')
    })

    it('0.49 (49%) → D', () => {
      expect(scorer.calculateGrade(0.49)).toBe('D')
    })

    it('0.0 (0%) → D', () => {
      expect(scorer.calculateGrade(0.0)).toBe('D')
    })
  })

  // ─── calculateXP ─────────────────────────────────────────────────────────

  describe('calculateXP', () => {
    it('grade S + performance mode = 150 XP (50 base + 100 bonus)', () => {
      expect(scorer.calculateXP('S', 'performance', 1.0)).toBe(150)
    })

    it('grade A + performance mode = 100 XP (50 base + 50 bonus)', () => {
      expect(scorer.calculateXP('A', 'performance', 1.0)).toBe(100)
    })

    it('grade B + performance mode = 75 XP (50 base + 25 bonus)', () => {
      expect(scorer.calculateXP('B', 'performance', 1.0)).toBe(75)
    })

    it('grade C + performance mode = 50 XP (50 base + 0 bonus)', () => {
      expect(scorer.calculateXP('C', 'performance', 1.0)).toBe(50)
    })

    it('grade D + performance mode = 25 XP (max(0, 50 - 25))', () => {
      expect(scorer.calculateXP('D', 'performance', 1.0)).toBe(25)
    })

    it('calculateXP never returns negative', () => {
      // Even if bonus were to exceed base, result floors at 0
      expect(scorer.calculateXP('D', 'performance', 1.0)).toBeGreaterThanOrEqual(0)
    })
  })
})
