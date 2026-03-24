// ─── MicInput Tests ───────────────────────────────────────────────────────────
// Pure-logic tests only — Web Audio API is not available in Vitest/jsdom.
// We test the math helpers that convert frequency ↔ MIDI.

import { describe, it, expect } from 'vitest';
import { midiToPitch, frequencyToMidi } from '../MicInput';

describe('midiToPitch', () => {
  it('converts middle C (MIDI 60) to C4', () => {
    expect(midiToPitch(60)).toBe('C4');
  });

  it('converts A4 (MIDI 69) correctly', () => {
    expect(midiToPitch(69)).toBe('A4');
  });

  it('converts C5 (MIDI 72) correctly', () => {
    expect(midiToPitch(72)).toBe('C5');
  });

  it('converts C3 (MIDI 48) correctly', () => {
    expect(midiToPitch(48)).toBe('C3');
  });

  it('converts F#4 (MIDI 66) correctly', () => {
    expect(midiToPitch(66)).toBe('F#4');
  });

  it('converts A#3 (MIDI 58) correctly', () => {
    expect(midiToPitch(58)).toBe('A#3');
  });

  it('handles A0 (MIDI 21 — lowest piano key)', () => {
    expect(midiToPitch(21)).toBe('A0');
  });

  it('handles C8 (MIDI 108 — highest piano key)', () => {
    expect(midiToPitch(108)).toBe('C8');
  });
});

describe('frequencyToMidi', () => {
  it('converts 440 Hz (A4) to MIDI 69', () => {
    expect(frequencyToMidi(440)).toBe(69);
  });

  it('converts 261.63 Hz (≈C4) to MIDI 60', () => {
    expect(frequencyToMidi(261.63)).toBe(60);
  });

  it('converts 880 Hz (A5) to MIDI 81', () => {
    expect(frequencyToMidi(880)).toBe(81);
  });

  it('converts 220 Hz (A3) to MIDI 57', () => {
    expect(frequencyToMidi(220)).toBe(57);
  });

  it('round-trips: midiToPitch(frequencyToMidi(f)) is consistent', () => {
    // A4 = 440 Hz → MIDI 69 → 'A4'
    const midi = frequencyToMidi(440);
    expect(midiToPitch(midi)).toBe('A4');
  });

  it('handles frequencies slightly off from exact pitch', () => {
    // A4 is 440 Hz; 442 Hz is slightly sharp but still rounds to MIDI 69
    expect(frequencyToMidi(442)).toBe(69);
    expect(frequencyToMidi(438)).toBe(69);
  });
});
