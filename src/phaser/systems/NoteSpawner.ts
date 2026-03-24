import Phaser from 'phaser';
import { NoteScheduler } from './NoteScheduler';
import { FallingNote } from '../objects/FallingNote';
import { NOTE, GAME } from '../../core/Constants';
import type { GameReadyNote } from '../../core/types';

export class NoteSpawner {
  private scene: Phaser.Scene;
  private scheduler: NoteScheduler;
  private activeNotes: FallingNote[] = [];
  private fallSpeedPxPerMs: number;

  constructor(scene: Phaser.Scene, notes: GameReadyNote[], speed: number) {
    this.scene = scene;
    this.scheduler = new NoteScheduler();
    this.scheduler.buildSchedule(notes, speed);

    const playLineY = scene.scale.height - GAME.PLAY_LINE_Y_OFFSET;
    this.fallSpeedPxPerMs = playLineY / (NOTE.FALL_DURATION_SEC * 1000 / speed);
  }

  update(gameClockMs: number, deltaMs: number, windowMs: number): {
    newNotes: FallingNote[];
    missedNoteIds: string[];
  } {
    const toSpawn = this.scheduler.getNotesToSpawn(gameClockMs);
    const newNotes: FallingNote[] = [];

    for (const entry of toSpawn) {
      this.scheduler.markConsumed(entry.noteId);
      const x = this.getNoteXPosition(entry.noteData.midiNote);
      const note = new FallingNote(this.scene, x, 0, entry.noteData);
      this.activeNotes.push(note);
      newNotes.push(note);
    }

    for (const note of this.activeNotes) {
      if (note.active) {
        note.y += this.fallSpeedPxPerMs * deltaMs;
      }
    }

    const missed = this.scheduler.getMissedNotes(gameClockMs, windowMs);
    const missedNoteIds = missed.map(e => e.noteId);
    missed.forEach(e => this.scheduler.markConsumed(e.noteId));

    this.activeNotes = this.activeNotes.filter(n => n.active);

    return { newNotes, missedNoteIds };
  }

  getActiveNotes(): FallingNote[] {
    return [...this.activeNotes];
  }

  destroy(): void {
    this.activeNotes.forEach(n => { if (n.active) n.destroy(); });
    this.activeNotes = [];
  }

  private getNoteXPosition(midiNote: number): number {
    const canvasWidth = this.scene.scale.width;
    const normalized = (midiNote - 21) / (108 - 21);
    return Math.round(normalized * canvasWidth);
  }
}
