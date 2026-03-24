import { describe, it, expect, beforeEach } from 'vitest';
import { ABLoopController } from '../ABLoopController';

describe('ABLoopController', () => {
  let ab: ABLoopController;

  beforeEach(() => {
    ab = new ABLoopController();
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('starts in IDLE state', () => {
    expect(ab.getState()).toBe('IDLE');
  });

  it('starts with null loopStart', () => {
    expect(ab.getLoopStart()).toBeNull();
  });

  it('starts with null loopEnd', () => {
    expect(ab.getLoopEnd()).toBeNull();
  });

  // ── markA ────────────────────────────────────────────────────────────────

  it('markA() transitions state to A_MARKED', () => {
    ab.markA(2);
    expect(ab.getState()).toBe('A_MARKED');
  });

  it('markA() sets loopStart', () => {
    ab.markA(2);
    expect(ab.getLoopStart()).toBe(2);
  });

  it('markA() with negative time clamps loopStart to 0', () => {
    ab.markA(-1);
    expect(ab.getLoopStart()).toBe(0);
    expect(ab.getState()).toBe('A_MARKED');
  });

  it('markA() clears a previously set loopEnd', () => {
    ab.markA(1);
    ab.markB(3);
    ab.markA(5); // re-mark A
    expect(ab.getLoopEnd()).toBeNull();
    expect(ab.getState()).toBe('A_MARKED');
  });

  // ── markB ────────────────────────────────────────────────────────────────

  it('markB() after markA() transitions to LOOP_ACTIVE', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.getState()).toBe('LOOP_ACTIVE');
  });

  it('markB() sets loopEnd', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.getLoopEnd()).toBe(5);
  });

  it('markB() without prior markA() is ignored (state stays IDLE)', () => {
    ab.markB(5);
    expect(ab.getState()).toBe('IDLE');
    expect(ab.getLoopEnd()).toBeNull();
  });

  it('markB() with B equal to A is ignored (state stays A_MARKED)', () => {
    ab.markA(3);
    ab.markB(3); // B === A — not allowed
    expect(ab.getState()).toBe('A_MARKED');
    expect(ab.getLoopEnd()).toBeNull();
  });

  it('markB() with B less than A is ignored (state stays A_MARKED)', () => {
    ab.markA(5);
    ab.markB(2); // B < A — not allowed
    expect(ab.getState()).toBe('A_MARKED');
    expect(ab.getLoopEnd()).toBeNull();
  });

  // ── shouldLoop ───────────────────────────────────────────────────────────

  it('shouldLoop() returns false when state is IDLE', () => {
    expect(ab.shouldLoop(10)).toBe(false);
  });

  it('shouldLoop() returns false when state is A_MARKED', () => {
    ab.markA(2);
    expect(ab.shouldLoop(10)).toBe(false);
  });

  it('shouldLoop() returns false when currentTime < loopEnd', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.shouldLoop(4.9)).toBe(false);
  });

  it('shouldLoop() returns true when currentTime >= loopEnd', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.shouldLoop(5.0)).toBe(true);
  });

  it('shouldLoop() returns true when currentTime > loopEnd', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.shouldLoop(6)).toBe(true);
  });

  // ── clear ────────────────────────────────────────────────────────────────

  it('clear() from IDLE keeps state IDLE', () => {
    ab.clear();
    expect(ab.getState()).toBe('IDLE');
  });

  it('clear() from A_MARKED resets to IDLE', () => {
    ab.markA(2);
    ab.clear();
    expect(ab.getState()).toBe('IDLE');
  });

  it('clear() from LOOP_ACTIVE resets to IDLE', () => {
    ab.markA(2);
    ab.markB(5);
    ab.clear();
    expect(ab.getState()).toBe('IDLE');
  });

  it('clear() sets loopStart to null', () => {
    ab.markA(2);
    ab.clear();
    expect(ab.getLoopStart()).toBeNull();
  });

  it('clear() sets loopEnd to null', () => {
    ab.markA(2);
    ab.markB(5);
    ab.clear();
    expect(ab.getLoopEnd()).toBeNull();
  });

  // ── Full cycle ───────────────────────────────────────────────────────────

  it('full cycle: markA(2), markB(5), shouldLoop at 4.9 = false, 5.0 = true', () => {
    ab.markA(2);
    ab.markB(5);
    expect(ab.shouldLoop(4.9)).toBe(false);
    expect(ab.shouldLoop(5.0)).toBe(true);
  });
});
