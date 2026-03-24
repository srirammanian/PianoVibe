// ─── InputBridge Tests ────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  inputBridge,
  emitNoteOn,
  emitNoteOff,
  setActiveSource,
  getActiveSource,
} from '../InputBridge';
import type { InputEvent } from '../../core/types';

beforeEach(() => {
  // Reset to default source before each test
  setActiveSource('touch');
  inputBridge.clearAll();
});

afterEach(() => {
  inputBridge.clearAll();
});

describe('InputBridge — emitNoteOn', () => {
  it('emits noteOn event with correct shape', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    emitNoteOn('C4', 60, 100, 'touch');

    expect(handler).toHaveBeenCalledOnce();
    const event: InputEvent = handler.mock.calls[0][0];
    expect(event.type).toBe('noteOn');
    expect(event.pitch).toBe('C4');
    expect(event.midiNote).toBe(60);
    expect(event.velocity).toBe(100);
    expect(event.source).toBe('touch');
    expect(typeof event.timestamp).toBe('number');
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('passes confidence through on mic events', () => {
    setActiveSource('mic');
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    emitNoteOn('A4', 69, 80, 'mic', 0.95);

    const event: InputEvent = handler.mock.calls[0][0];
    expect(event.confidence).toBe(0.95);
    expect(event.source).toBe('mic');
  });

  it('confidence is undefined when not provided', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    emitNoteOn('C4', 60, 100, 'touch');

    const event: InputEvent = handler.mock.calls[0][0];
    expect(event.confidence).toBeUndefined();
  });
});

describe('InputBridge — emitNoteOff', () => {
  it('emits noteOff event with correct shape', () => {
    const handler = vi.fn();
    inputBridge.on('noteOff', handler);

    emitNoteOff('C4', 60, 'touch');

    expect(handler).toHaveBeenCalledOnce();
    const event: InputEvent = handler.mock.calls[0][0];
    expect(event.type).toBe('noteOff');
    expect(event.pitch).toBe('C4');
    expect(event.midiNote).toBe(60);
    expect(event.velocity).toBe(0);
    expect(event.source).toBe('touch');
  });
});

describe('InputBridge — active source gate', () => {
  it('suppresses events from non-active sources', () => {
    setActiveSource('mic');
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    emitNoteOn('C4', 60, 100, 'touch'); // wrong source
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes events from the active source', () => {
    setActiveSource('mic');
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    emitNoteOn('C4', 60, 100, 'mic'); // correct source
    expect(handler).toHaveBeenCalledOnce();
  });

  it('can switch sources at runtime', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);

    setActiveSource('touch');
    emitNoteOn('C4', 60, 100, 'touch');
    expect(handler).toHaveBeenCalledTimes(1);

    setActiveSource('mic');
    emitNoteOn('C4', 60, 100, 'touch'); // now blocked
    expect(handler).toHaveBeenCalledTimes(1);

    emitNoteOn('C4', 60, 100, 'mic');   // passes
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('suppresses noteOff from wrong source', () => {
    setActiveSource('mic');
    const handler = vi.fn();
    inputBridge.on('noteOff', handler);

    emitNoteOff('C4', 60, 'touch');
    expect(handler).not.toHaveBeenCalled();

    emitNoteOff('C4', 60, 'mic');
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('InputBridge — getActiveSource', () => {
  it('returns the current active source', () => {
    setActiveSource('touch');
    expect(getActiveSource()).toBe('touch');

    setActiveSource('mic');
    expect(getActiveSource()).toBe('mic');

    setActiveSource('midi');
    expect(getActiveSource()).toBe('midi');
  });
});

describe('InputBridge — listener management', () => {
  it('supports multiple listeners on the same event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    inputBridge.on('noteOn', h1);
    inputBridge.on('noteOn', h2);

    emitNoteOn('C4', 60, 100, 'touch');
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('off() removes a specific listener', () => {
    const handler = vi.fn();
    inputBridge.on('noteOn', handler);
    inputBridge.off('noteOn', handler);

    emitNoteOn('C4', 60, 100, 'touch');
    expect(handler).not.toHaveBeenCalled();
  });

  it('clearAll() removes all listeners', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    inputBridge.on('noteOn', h1);
    inputBridge.on('noteOff', h2);

    inputBridge.clearAll();

    emitNoteOn('C4', 60, 100, 'touch');
    emitNoteOff('C4', 60, 'touch');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});
