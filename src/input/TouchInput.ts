// ─── TouchInput ───────────────────────────────────────────────────────────────
// Bridges the on-screen PianoKeyboard visual (Phaser) with InputBridge.
// PianoKeyboard calls handlePointerDown / handlePointerUp with canvas-local
// coordinates; this module converts them to MIDI notes and emits normalised
// input events.

import { emitNoteOn, emitNoteOff } from './InputBridge';

// ─── Note name lookup (mirrors MicInput to avoid circular dep) ────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function midiToPitch(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

// ─── Keyboard reference ───────────────────────────────────────────────────────
// PianoKeyboard registers itself here so TouchInput can do hit-testing.
export interface KeyboardRef {
  getNoteAtPosition: (x: number, y: number) => number | null;
}

let keyboardRef: KeyboardRef | null = null;

export function setKeyboardRef(ref: KeyboardRef | null): void {
  keyboardRef = ref;
}

// ─── Active touch tracking ────────────────────────────────────────────────────
// Supports multi-touch: maps touchId → midiNote so noteOff fires on correct note.
const activeTouches = new Map<number, number>(); // touchId → midiNote

// ─── Public API (called by PianoKeyboard) ─────────────────────────────────────

export function handlePointerDown(x: number, y: number, touchId = 0): void {
  if (!keyboardRef) return;
  const midiNote = keyboardRef.getNoteAtPosition(x, y);
  if (midiNote === null) return;

  // Avoid double-firing for same touch
  if (activeTouches.has(touchId)) return;

  activeTouches.set(touchId, midiNote);
  emitNoteOn(midiToPitch(midiNote), midiNote, 100, 'touch');
}

export function handlePointerUp(x: number, y: number, touchId = 0): void {
  // Prefer stored note for touch-id (pointer may have drifted off key)
  const storedNote = activeTouches.get(touchId);
  if (storedNote !== undefined) {
    activeTouches.delete(touchId);
    emitNoteOff(midiToPitch(storedNote), storedNote, 'touch');
    return;
  }

  // Fallback: resolve from current position
  if (!keyboardRef) return;
  const midiNote = keyboardRef.getNoteAtPosition(x, y);
  if (midiNote === null) return;
  emitNoteOff(midiToPitch(midiNote), midiNote, 'touch');
}

export function clearActiveTouches(): void {
  for (const [, midiNote] of activeTouches) {
    emitNoteOff(midiToPitch(midiNote), midiNote, 'touch');
  }
  activeTouches.clear();
}
