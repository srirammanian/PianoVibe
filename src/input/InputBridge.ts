// ─── InputBridge ─────────────────────────────────────────────────────────────
// Singleton event bus for normalised input events.
// All input sources (mic, touch, MIDI) funnel through here.
// The game engine (Phaser) listens to this bus — never to raw input directly.
// Uses the same lightweight EventBus pattern as core/EventBus.ts to stay
// fully browser-compatible (no Node.js 'events' polyfill required).

import type { InputEvent } from '../core/types';

// ─── Re-export so callers can use the type without hunting for it ─────────────
export type { InputEvent };

// ─── Minimal typed emitter ────────────────────────────────────────────────────
type InputBridgeCallback = (event: InputEvent) => void;

class InputBridgeEmitter {
  private listeners: Map<string, InputBridgeCallback[]> = new Map();

  on(event: string, cb: InputBridgeCallback): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(cb);
  }

  off(event: string, cb: InputBridgeCallback): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    const idx = arr.indexOf(cb);
    if (idx !== -1) arr.splice(idx, 1);
  }

  emit(event: string, data: InputEvent): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    for (const cb of [...arr]) cb(data);
  }

  clearAll(): void {
    this.listeners.clear();
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────
export const inputBridge = new InputBridgeEmitter();

// ─── Active source gate ───────────────────────────────────────────────────────
// Only events from the active source are forwarded to the game engine.
let activeSource: 'mic' | 'touch' | 'midi' = 'touch';

export function getActiveSource(): 'mic' | 'touch' | 'midi' {
  return activeSource;
}

export function setActiveSource(source: 'mic' | 'touch' | 'midi'): void {
  activeSource = source;
}

// ─── Emit helpers (called by MicInput, TouchInput, MidiInput) ─────────────────

export function emitNoteOn(
  pitch: string,
  midiNote: number,
  velocity: number,
  source: 'mic' | 'touch' | 'midi',
  confidence?: number,
): void {
  if (source !== activeSource) return;
  const event: InputEvent = {
    type: 'noteOn',
    pitch,
    midiNote,
    velocity,
    timestamp: performance.now(),
    source,
    confidence,
  };
  inputBridge.emit('noteOn', event);
}

export function emitNoteOff(
  pitch: string,
  midiNote: number,
  source: 'mic' | 'touch' | 'midi',
): void {
  if (source !== activeSource) return;
  const event: InputEvent = {
    type: 'noteOff',
    pitch,
    midiNote,
    velocity: 0,
    timestamp: performance.now(),
    source,
  };
  inputBridge.emit('noteOff', event);
}
