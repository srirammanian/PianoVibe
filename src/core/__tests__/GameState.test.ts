import { describe, it, expect } from 'vitest'
import { GameState } from '../GameState'

describe('GameState', () => {
  it('initial default: score === 0', () => {
    const gs = new GameState()
    expect(gs.get('score')).toBe(0)
  })

  it('initial default: streak === 0', () => {
    const gs = new GameState()
    expect(gs.get('streak')).toBe(0)
  })

  it('initial default: maxStreak === 0', () => {
    const gs = new GameState()
    expect(gs.get('maxStreak')).toBe(0)
  })

  it('initial default: mode === "performance"', () => {
    const gs = new GameState()
    expect(gs.get('mode')).toBe('performance')
  })

  it('initial default: speed === 1.0', () => {
    const gs = new GameState()
    expect(gs.get('speed')).toBe(1.0)
  })

  it('initial default: phase === "TITLE"', () => {
    const gs = new GameState()
    expect(gs.get('phase')).toBe('TITLE')
  })

  it('initial default: isPlaying === false', () => {
    const gs = new GameState()
    expect(gs.get('isPlaying')).toBe(false)
  })

  it('set + get round-trip: score', () => {
    const gs = new GameState()
    gs.set('score', 500)
    expect(gs.get('score')).toBe(500)
  })

  it('set + get round-trip: mode', () => {
    const gs = new GameState()
    gs.set('mode', 'practice')
    expect(gs.get('mode')).toBe('practice')
  })

  it('reset() clears score to 0', () => {
    const gs = new GameState()
    gs.set('score', 500)
    gs.reset()
    expect(gs.get('score')).toBe(0)
  })

  it('reset() clears streak to 0', () => {
    const gs = new GameState()
    gs.set('streak', 15)
    gs.reset()
    expect(gs.get('streak')).toBe(0)
  })

  it('reset() clears maxStreak to 0', () => {
    const gs = new GameState()
    gs.set('maxStreak', 15)
    gs.reset()
    expect(gs.get('maxStreak')).toBe(0)
  })

  it('reset() clears loopStart to null', () => {
    const gs = new GameState()
    gs.set('loopStart', 10)
    gs.reset()
    expect(gs.get('loopStart')).toBeNull()
  })

  it('reset() clears loopEnd to null', () => {
    const gs = new GameState()
    gs.set('loopEnd', 30)
    gs.reset()
    expect(gs.get('loopEnd')).toBeNull()
  })

  it('reset() PRESERVES mode', () => {
    const gs = new GameState()
    gs.set('mode', 'practice')
    gs.reset()
    expect(gs.get('mode')).toBe('practice')
  })

  it('reset() PRESERVES speed', () => {
    const gs = new GameState()
    gs.set('speed', 0.75)
    gs.reset()
    expect(gs.get('speed')).toBe(0.75)
  })

  it('reset() PRESERVES timingPreset', () => {
    const gs = new GameState()
    gs.set('timingPreset', 'hard')
    gs.reset()
    expect(gs.get('timingPreset')).toBe('hard')
  })

  it('reset() PRESERVES handMode', () => {
    const gs = new GameState()
    gs.set('handMode', 'left')
    gs.reset()
    expect(gs.get('handMode')).toBe('left')
  })

  it('fresh instances are independent — do not share data', () => {
    const gs1 = new GameState()
    const gs2 = new GameState()
    gs1.set('score', 999)
    expect(gs2.get('score')).toBe(0)
  })

  it('reset() clears notesTotal to 0', () => {
    const gs = new GameState()
    gs.set('notesTotal', 100)
    gs.reset()
    expect(gs.get('notesTotal')).toBe(0)
  })

  it('set multiple fields then reset — only resettable fields clear', () => {
    const gs = new GameState()
    gs.set('score', 300)
    gs.set('streak', 10)
    gs.set('mode', 'practice')
    gs.set('speed', 0.5)
    gs.reset()
    expect(gs.get('score')).toBe(0)
    expect(gs.get('streak')).toBe(0)
    expect(gs.get('mode')).toBe('practice')
    expect(gs.get('speed')).toBe(0.5)
  })
})
