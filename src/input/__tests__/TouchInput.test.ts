// ─── TouchInput Tests ─────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setKeyboardRef,
  handlePointerDown,
  handlePointerUp,
  clearActiveTouches,
} from '../TouchInput';
import { inputBridge, setActiveSource } from '../InputBridge';
import type { InputEvent } from '../../core/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeKeyboardRef(noteMap: Record<string, number>) {
  return {
    getNoteAtPosition: (x: number, y: number): number | null => {
      const key = `${x},${y}`;
      return noteMap[key] ?? null;
    },
  };
}

beforeEach(() => {
  setActiveSource('touch');
  inputBridge.clearAll();
  clearActiveTouches();
  // Provide a simple keyboard ref: (0,0) → MIDI 60 (C4), (100,0) → MIDI 62 (D4)
  setKeyboardRef(makeKeyboardRef({ '0,0': 60, '100,0': 62 }));
});

afterEach(() => {
  clearActiveTouches();
  setKeyboardRef(null);
  inputBridge.clearAll();
});

describe('handlePointerDown', () => {
  it('emits noteOn for a valid key position', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(0, 0);

    expect(handler).toHaveBeenCalledOnce();
    const event: InputEvent = handler.mock.calls[0][0];
    expect(event.type).toBe('noteOn');
    expect(event.midiNote).toBe(60);
    expect(event.pitch).toBe('C4');
    expect(event.source).toBe('touch');
  });

  it('does nothing when position does not hit a key', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(999, 999); // off keyboard
    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when keyboardRef is null', () => {
    setKeyboardRef(null);
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(0, 0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not re-fire noteOn for same touchId while still held', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(0, 0, 1);
    handlePointerDown(0, 0, 1); // duplicate
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('allows different touchIds to press different keys simultaneously', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(0, 0, 1);   // C4
    handlePointerDown(100, 0, 2); // D4
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('handlePointerUp', () => {
  it('emits noteOff matching the stored touchId note', () => {
    const onHandler = vi.fn();
    const offHandler = vi.fn();
    inputBridge.on('noteOn', onHandler);
    inputBridge.on('noteOff', offHandler);

    handlePointerDown(0, 0, 5);   // press C4 with touchId 5
    handlePointerUp(99, 99, 5);   // release with touchId 5 (position doesn't matter)

    expect(offHandler).toHaveBeenCalledOnce();
    const event: InputEvent = offHandler.mock.calls[0][0];
    expect(event.type).toBe('noteOff');
    expect(event.midiNote).toBe(60);
  });

  it('emits noteOff by position when touchId not tracked', () => {
    const offHandler = vi.fn();
    inputBridge.on('noteOff', offHandler);

    handlePointerUp(0, 0, 99); // no prior down with touchId 99 → falls back to position
    expect(offHandler).toHaveBeenCalledOnce();
  });
});

describe('clearActiveTouches', () => {
  it('fires noteOff for all held keys and clears state', () => {
    const offHandler = vi.fn();
    inputBridge.on('noteOff', offHandler);

    handlePointerDown(0, 0, 1);
    handlePointerDown(100, 0, 2);
    clearActiveTouches();

    expect(offHandler).toHaveBeenCalledTimes(2);

    // Subsequent calls should not fire again
    clearActiveTouches();
    expect(offHandler).toHaveBeenCalledTimes(2);
  });
});

describe('source gate integration', () => {
  it('touch events are blocked when source is mic', () => {
    setActiveSource('mic');
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    handlePointerDown(0, 0);
    expect(handler).not.toHaveBeenCalled();
  });
});
