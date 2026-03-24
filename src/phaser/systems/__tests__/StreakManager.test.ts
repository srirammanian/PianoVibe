import { describe, it, expect, beforeEach } from 'vitest'
import { StreakManager } from '../StreakManager'

describe('StreakManager', () => {
  let sm: StreakManager

  beforeEach(() => {
    sm = new StreakManager()
  })

  it('initial state: count=0, multiplier=1, maxStreak=0', () => {
    const state = sm.getState()
    expect(state.count).toBe(0)
    expect(state.multiplier).toBe(1)
    expect(state.maxStreak).toBe(0)
  })

  it('single hit: count=1, multiplier stays 1', () => {
    sm.hit()
    const state = sm.getState()
    expect(state.count).toBe(1)
    expect(state.multiplier).toBe(1)
  })

  it('four hits: count=4, multiplier=1 (threshold not crossed)', () => {
    for (let i = 0; i < 4; i++) sm.hit()
    const state = sm.getState()
    expect(state.count).toBe(4)
    expect(state.multiplier).toBe(1)
  })

  it('five hits: multiplier becomes 2', () => {
    for (let i = 0; i < 5; i++) sm.hit()
    expect(sm.getState().multiplier).toBe(2)
  })

  it('ten hits: multiplier becomes 3', () => {
    for (let i = 0; i < 10; i++) sm.hit()
    expect(sm.getState().multiplier).toBe(3)
  })

  it('twenty hits: multiplier becomes 4', () => {
    for (let i = 0; i < 20; i++) sm.hit()
    expect(sm.getState().multiplier).toBe(4)
  })

  it('multiplier caps at 4 — 50 consecutive hits', () => {
    for (let i = 0; i < 50; i++) sm.hit()
    expect(sm.getState().multiplier).toBe(4)
  })

  it('miss(): count resets to 0, multiplier resets to 1', () => {
    for (let i = 0; i < 10; i++) sm.hit()
    sm.miss()
    const state = sm.getState()
    expect(state.count).toBe(0)
    expect(state.multiplier).toBe(1)
  })

  it('wrong(): same behavior as miss — count=0, multiplier=1', () => {
    for (let i = 0; i < 10; i++) sm.hit()
    sm.wrong()
    const state = sm.getState()
    expect(state.count).toBe(0)
    expect(state.multiplier).toBe(1)
  })

  it('maxStreak persists after miss', () => {
    for (let i = 0; i < 15; i++) sm.hit()
    sm.miss()
    expect(sm.getState().count).toBe(0)
    expect(sm.getState().maxStreak).toBe(15)
  })

  it('maxStreak only grows — not updated when lower', () => {
    for (let i = 0; i < 15; i++) sm.hit()
    sm.miss()
    for (let i = 0; i < 5; i++) sm.hit()
    expect(sm.getState().maxStreak).toBe(15)
  })

  it('getState() returns correct snapshot', () => {
    for (let i = 0; i < 5; i++) sm.hit()
    const state = sm.getState()
    expect(state).toEqual({ count: 5, multiplier: 2, maxStreak: 5 })
  })

  it('reset(): count, multiplier, maxStreak all return to defaults', () => {
    for (let i = 0; i < 20; i++) sm.hit()
    sm.reset()
    const state = sm.getState()
    expect(state.count).toBe(0)
    expect(state.multiplier).toBe(1)
    expect(state.maxStreak).toBe(0)
  })
})
