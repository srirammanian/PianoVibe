// ─── PianoKeyboard ────────────────────────────────────────────────────────────
// Phaser Container that renders an on-screen piano keyboard and wires touch /
// pointer events through to InputBridge via TouchInput.
//
// Layout maths
//   - White keys are drawn first (behind black keys)
//   - Black keys are positioned as x-offsets within an octave
//   - The container origin is top-left; position it with .setPosition()
//
// Usage (from GameScene):
//   const kb = new PianoKeyboard(this, 48, 3);  // C3, 3 octaves
//   kb.setPosition(0, this.scale.height - PianoKeyboard.HEIGHT);

import Phaser from 'phaser';
import {
  handlePointerDown,
  handlePointerUp,
  clearActiveTouches,
  setKeyboardRef,
} from '../../input/TouchInput';

// ─── Colours ──────────────────────────────────────────────────────────────────
const COLOR_WHITE_KEY = 0xf5f5f5;
const COLOR_WHITE_STROKE = 0xbbbbbb;
const COLOR_BLACK_KEY = 0x1a1a2e;
const COLOR_WHITE_PRESSED = 0x9bc4f5; // soft blue highlight
const COLOR_BLACK_PRESSED = 0x2e5fa3;

// ─── Keyboard geometry ────────────────────────────────────────────────────────
const WHITE_KEY_W = 44;
const WHITE_KEY_H = 130;
const BLACK_KEY_W = 26;
const BLACK_KEY_H = 80;
const KEY_GAP = 1; // gap between adjacent white keys

// Semitone index → offset from white key (fractional of white key width)
// Applies to semitones that have a black key: 1 (C#), 3 (D#), 6 (F#), 8 (G#), 10 (A#)
const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.65,  // C# sits 65% into C's width
  3: 1.65,  // D#
  6: 3.65,  // F#
  8: 4.65,  // G#
  10: 5.65, // A#
};

// Semitones within an octave that are white keys, in order
const WHITE_KEY_SEMITONES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

// Black key semitones
const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10]);

export class PianoKeyboard extends Phaser.GameObjects.Container {
  static readonly HEIGHT = WHITE_KEY_H;

  private startNote: number;
  private numOctaves: number;

  // Rectangle objects indexed by MIDI note
  private keyRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  // Track which keys are currently pressed for visual feedback
  private pressedKeys: Set<number> = new Set();

  constructor(scene: Phaser.Scene, startNote = 48, numOctaves = 3) {
    super(scene, 0, 0);

    this.startNote = startNote;
    this.numOctaves = numOctaves;

    this.buildKeys();
    this.setupInteraction();

    // Register position resolver with TouchInput
    setKeyboardRef({ getNoteAtPosition: this.getNoteAtPosition.bind(this) });

    scene.add.existing(this);
  }

  // ─── Total pixel width of the keyboard ──────────────────────────────────────
  getTotalWidth(): number {
    return this.numOctaves * 7 * (WHITE_KEY_W + KEY_GAP) - KEY_GAP;
  }

  // ─── Build all key rectangles ────────────────────────────────────────────────
  private buildKeys(): void {
    // White keys first (rendered behind black keys)
    for (let octave = 0; octave < this.numOctaves; octave++) {
      let whiteIndex = 0;
      for (const semi of WHITE_KEY_SEMITONES) {
        const midiNote = this.startNote + octave * 12 + semi;
        const x = (octave * 7 + whiteIndex) * (WHITE_KEY_W + KEY_GAP);

        const rect = this.scene.add.rectangle(
          x + WHITE_KEY_W / 2,
          WHITE_KEY_H / 2,
          WHITE_KEY_W,
          WHITE_KEY_H,
          COLOR_WHITE_KEY,
        );
        rect.setStrokeStyle(1, COLOR_WHITE_STROKE);
        this.keyRects.set(midiNote, rect);
        this.add(rect); // added to this container

        whiteIndex++;
      }
    }

    // Black keys on top
    for (let octave = 0; octave < this.numOctaves; octave++) {
      for (const [semi, offset] of Object.entries(BLACK_KEY_OFFSETS)) {
        const semitone = Number(semi);
        const midiNote = this.startNote + octave * 12 + semitone;
        const octaveStartX = octave * 7 * (WHITE_KEY_W + KEY_GAP);
        const x = octaveStartX + offset * (WHITE_KEY_W + KEY_GAP);

        const rect = this.scene.add.rectangle(
          x,
          BLACK_KEY_H / 2,
          BLACK_KEY_W,
          BLACK_KEY_H,
          COLOR_BLACK_KEY,
        );
        // Depth is set by add() order — black keys are added after white keys
        this.keyRects.set(midiNote, rect);
        this.add(rect);
      }
    }
  }

  // ─── Phaser interaction ───────────────────────────────────────────────────────
  private setupInteraction(): void {
    const totalW = this.getTotalWidth();

    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, totalW, WHITE_KEY_H),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer) => {
        const local = this.toLocal(pointer.x, pointer.y);
        const touchId = pointer.id ?? 0;
        this.onKeyPress(local.x, local.y, touchId);
      },
    );

    this.on(
      'pointermove',
      (pointer: Phaser.Input.Pointer) => {
        // Slide: release previous key and press new one when pointer moves
        const local = this.toLocal(pointer.x, pointer.y);
        const touchId = pointer.id ?? 0;
        if (pointer.isDown) {
          this.onKeyRelease(local.x, local.y, touchId);
          this.onKeyPress(local.x, local.y, touchId);
        }
      },
    );

    this.on(
      'pointerup',
      (pointer: Phaser.Input.Pointer) => {
        const local = this.toLocal(pointer.x, pointer.y);
        const touchId = pointer.id ?? 0;
        this.onKeyRelease(local.x, local.y, touchId);
      },
    );

    this.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      const local = this.toLocal(pointer.x, pointer.y);
      const touchId = pointer.id ?? 0;
      this.onKeyRelease(local.x, local.y, touchId);
    });
  }

  private toLocal(worldX: number, worldY: number): { x: number; y: number } {
    // Container is positioned at (this.x, this.y) with no rotation/scale
    return { x: worldX - this.x, y: worldY - this.y };
  }

  private onKeyPress(localX: number, localY: number, touchId: number): void {
    const midiNote = this.getNoteAtPosition(localX, localY);
    if (midiNote === null) return;
    this.pressKey(midiNote);
    handlePointerDown(localX, localY, touchId);
  }

  private onKeyRelease(localX: number, localY: number, touchId: number): void {
    handlePointerUp(localX, localY, touchId);
    // Release all pressed keys that are no longer touched
    // (TouchInput tracks the exact note; we mirror visual state)
    this.releaseAllKeys();
  }

  // ─── Visual feedback ──────────────────────────────────────────────────────────
  pressKey(midiNote: number): void {
    if (this.pressedKeys.has(midiNote)) return;
    this.pressedKeys.add(midiNote);
    const rect = this.keyRects.get(midiNote);
    if (!rect) return;
    const isBlack = BLACK_KEY_SEMITONES.has(midiNote % 12);
    rect.setFillStyle(isBlack ? COLOR_BLACK_PRESSED : COLOR_WHITE_PRESSED);
  }

  releaseKey(midiNote: number): void {
    if (!this.pressedKeys.has(midiNote)) return;
    this.pressedKeys.delete(midiNote);
    const rect = this.keyRects.get(midiNote);
    if (!rect) return;
    const isBlack = BLACK_KEY_SEMITONES.has(midiNote % 12);
    rect.setFillStyle(isBlack ? COLOR_BLACK_KEY : COLOR_WHITE_KEY);
  }

  releaseAllKeys(): void {
    for (const midiNote of [...this.pressedKeys]) {
      this.releaseKey(midiNote);
    }
  }

  // ─── Hit-test: local coordinates → MIDI note ─────────────────────────────────
  getNoteAtPosition(localX: number, localY: number): number | null {
    if (localY < 0 || localY > WHITE_KEY_H || localX < 0) return null;

    // Check black keys first (they are on top visually)
    if (localY < BLACK_KEY_H) {
      for (let octave = 0; octave < this.numOctaves; octave++) {
        for (const [semi, offset] of Object.entries(BLACK_KEY_OFFSETS)) {
          const semitone = Number(semi);
          const octaveStartX = octave * 7 * (WHITE_KEY_W + KEY_GAP);
          const centerX = octaveStartX + offset * (WHITE_KEY_W + KEY_GAP);
          const halfW = BLACK_KEY_W / 2;

          if (localX >= centerX - halfW && localX <= centerX + halfW) {
            return this.startNote + octave * 12 + semitone;
          }
        }
      }
    }

    // White key lookup
    const keyIndex = Math.floor(localX / (WHITE_KEY_W + KEY_GAP));
    const octave = Math.floor(keyIndex / 7);
    const noteInOctave = keyIndex % 7;

    if (octave >= this.numOctaves) return null;
    const semitone = WHITE_KEY_SEMITONES[noteInOctave];
    if (semitone === undefined) return null;

    return this.startNote + octave * 12 + semitone;
  }

  override destroy(fromScene?: boolean): void {
    clearActiveTouches();
    setKeyboardRef(null);
    super.destroy(fromScene);
  }
}
