import { describe, it, expect } from 'vitest'
import { TIMING, SCORING, NOTE, PRACTICE, XP } from '../Constants'

describe('Constants', () => {
  it('TIMING.PRESETS.beginner.window === 500', () => {
    expect(TIMING.PRESETS.beginner.window).toBe(500)
  })

  it('TIMING.PRESETS.standard.window === 300', () => {
    expect(TIMING.PRESETS.standard.window).toBe(300)
  })

  it('TIMING.PRESETS.hard.window === 150', () => {
    expect(TIMING.PRESETS.hard.window).toBe(150)
  })

  it('SCORING.BASE_POINTS === 100', () => {
    expect(SCORING.BASE_POINTS).toBe(100)
  })

  it('SCORING.STREAK_MULTIPLIERS has 4 bands with last multiplier === 4', () => {
    expect(SCORING.STREAK_MULTIPLIERS).toHaveLength(4)
    const last = SCORING.STREAK_MULTIPLIERS[SCORING.STREAK_MULTIPLIERS.length - 1]
    expect(last.multiplier).toBe(4)
  })

  it('SCORING.GRADE_MULTIPLIERS has Perfect=1.0, Good=0.75, OK=0.5', () => {
    expect(SCORING.GRADE_MULTIPLIERS.Perfect).toBe(1.0)
    expect(SCORING.GRADE_MULTIPLIERS.Good).toBe(0.75)
    expect(SCORING.GRADE_MULTIPLIERS.OK).toBe(0.5)
  })

  it('NOTE colors are valid positive hex numbers', () => {
    expect(NOTE.RIGHT_HAND_COLOR).toBeGreaterThan(0)
    expect(NOTE.LEFT_HAND_COLOR).toBeGreaterThan(0)
  })

  it('PRACTICE speed range: MIN < DEFAULT <= MAX', () => {
    expect(PRACTICE.SPEED_MIN).toBeLessThan(PRACTICE.SPEED_DEFAULT)
    expect(PRACTICE.SPEED_DEFAULT).toBeLessThanOrEqual(PRACTICE.SPEED_MAX)
  })

  it('XP.BASE_XP === 50', () => {
    expect(XP.BASE_XP).toBe(50)
  })

  it('XP.GRADE_BONUS has correct S and D values', () => {
    expect(XP.GRADE_BONUS.S).toBe(100)
    expect(XP.GRADE_BONUS.D).toBe(-25)
  })

  it('SCORING.GRADE_THRESHOLDS has S=95, A=85, B=70, C=50', () => {
    expect(SCORING.GRADE_THRESHOLDS.S).toBe(95)
    expect(SCORING.GRADE_THRESHOLDS.A).toBe(85)
    expect(SCORING.GRADE_THRESHOLDS.B).toBe(70)
    expect(SCORING.GRADE_THRESHOLDS.C).toBe(50)
  })
})
