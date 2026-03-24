import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
import { gameState } from '../../core/GameState';
import { GAME, TIMING } from '../../core/Constants';
import { HitDetector } from '../systems/HitDetector';
import { Scorer } from '../systems/Scorer';
import { StreakManager } from '../systems/StreakManager';
import { NoteSpawner } from '../systems/NoteSpawner';
import type { GameStartData, InputEvent, GameReadyNote } from '../../core/types';

export class GameScene extends Phaser.Scene {
  private noteSpawner: NoteSpawner | null = null;
  private hitDetector: HitDetector | null = null;
  private scorer: Scorer | null = null;
  private streakManager: StreakManager | null = null;
  private gameClock = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private streakText: Phaser.GameObjects.Text | null = null;
  private songData: GameReadyNote[] = [];

  // Store bound handlers for cleanup
  private boundNotePlayed: ((data: unknown) => void) | null = null;
  private boundPause: (() => void) | null = null;
  private boundResume: (() => void) | null = null;

  constructor() {
    super({ key: 'Game' });
  }

  init(data: GameStartData): void {
    gameState.reset();
    if (data.mode) gameState.set('mode', data.mode);
    if (data.speed) gameState.set('speed', data.speed);
    if (data.handMode) gameState.set('handMode', data.handMode);
    if (data.timingPreset) {
      gameState.set('timingPreset', data.timingPreset);
      const baseWindow = TIMING.PRESETS[data.timingPreset].window;
      gameState.set('timingWindowMs', baseWindow);
    }
    if (data.songData) {
      this.songData = data.songData;
      gameState.set('notesTotal', data.songData.length);
    }
    if (data.songId) gameState.set('currentSongId', data.songId);
    this.gameClock = 0;
  }

  create(): void {
    // Background
    this.add.rectangle(
      GAME.WIDTH / 2,
      GAME.HEIGHT / 2,
      GAME.WIDTH,
      GAME.HEIGHT,
      GAME.BACKGROUND_COLOR
    );

    // Play line
    const playLineY = GAME.HEIGHT - GAME.PLAY_LINE_Y_OFFSET;
    const playLine = this.add.rectangle(GAME.WIDTH / 2, playLineY, GAME.WIDTH, 2, 0x888888);
    playLine.setAlpha(0.6);

    // HUD
    this.scoreText = this.add.text(GAME.WIDTH - 20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(1, 0);

    this.streakText = this.add.text(20, 20, 'Streak: 0', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0, 0);

    // Systems
    this.hitDetector = new HitDetector();
    this.scorer = new Scorer();
    this.streakManager = new StreakManager();

    // If we have song data from init(), start the spawner
    if (this.songData.length > 0) {
      this.noteSpawner = new NoteSpawner(
        this,
        this.songData,
        gameState.get('speed')
      );
    }

    // EventBus listeners
    this.boundNotePlayed = (data: unknown) => this.handleNotePlayed(data as InputEvent);
    this.boundPause = () => this.handlePause();
    this.boundResume = () => this.handleResume();

    eventBus.on(Events.NOTE_PLAYED, this.boundNotePlayed);
    eventBus.on(Events.GAME_PAUSE, this.boundPause);
    eventBus.on(Events.GAME_RESUME, this.boundResume);

    gameState.set('isPlaying', true);
    gameState.set('phase', 'GAMEPLAY');
  }

  update(_time: number, delta: number): void {
    if (!gameState.get('isPlaying') || gameState.get('isPaused')) return;

    const speed = gameState.get('speed');
    const adjustedDelta = delta * speed;
    this.gameClock += adjustedDelta;

    if (!this.noteSpawner) return;

    const windowMs = gameState.get('timingWindowMs');
    const { missedNoteIds } = this.noteSpawner.update(this.gameClock, adjustedDelta, windowMs);

    // Handle missed notes
    for (const noteId of missedNoteIds) {
      this.handleMissedNote(noteId);
    }

    // Update HUD
    this.scoreText?.setText(`Score: ${gameState.get('score')}`);
    this.streakText?.setText(`Streak: ${gameState.get('streak')}`);
  }

  private handleNotePlayed(inputEvent: InputEvent): void {
    if (!this.hitDetector || !this.scorer || !this.streakManager || !this.noteSpawner) return;
    if (!gameState.get('isPlaying') || gameState.get('isPaused')) return;

    const windowMs = gameState.get('timingWindowMs');
    const preset = gameState.get('timingPreset');

    // Find closest matching note by midi note number
    const activeNotes = this.noteSpawner.getActiveNotes();
    let closestNote = null;
    let closestDelta = Infinity;

    for (const note of activeNotes) {
      if (note.noteData.midiNote !== inputEvent.midiNote) continue;
      const noteTargetMs = note.noteData.time * 1000;
      const delta = Math.abs(inputEvent.timestamp - noteTargetMs);
      if (delta < closestDelta) {
        closestDelta = delta;
        closestNote = note;
      }
    }

    if (!closestNote) {
      // Wrong note — no matching pitch in active notes
      eventBus.emit(Events.NOTE_WRONG, { midiNote: inputEvent.midiNote });
      this.streakManager.wrong();
      this.updateScoreDisplay();
      return;
    }

    const noteTargetMs = closestNote.noteData.time * 1000;
    const result = this.hitDetector.gradeHit(
      inputEvent.timestamp,
      noteTargetMs,
      windowMs,
      preset,
      true // pitch already matched above
    );

    if (result.grade === 'Miss') {
      this.streakManager.miss();
      closestNote.showMissFeedback();
      gameState.set('notesMissed', gameState.get('notesMissed') + 1);
      eventBus.emit(Events.NOTE_MISSED, { noteId: closestNote.noteData.id, grade: result.grade });
    } else {
      const streakState = this.streakManager.getState();
      this.streakManager.hit();
      const newStreakState = this.streakManager.getState();

      const points = this.scorer.calculatePoints(
        result.grade,
        streakState.multiplier,
        result.isEarly,
        result.isLate,
        preset   // TimingPreset drives hard/standard penalties
      );

      const newScore = gameState.get('score') + points;
      gameState.set('score', newScore);
      gameState.set('streak', newStreakState.count);
      gameState.set('notesHit', gameState.get('notesHit') + 1);

      closestNote.showHitFeedback(result.grade);

      eventBus.emit(Events.NOTE_HIT, {
        noteId: closestNote.noteData.id,
        grade: result.grade,
        points,
        streak: newStreakState.count,
        multiplier: newStreakState.multiplier,
      });
      eventBus.emit(Events.SCORE_UPDATE, { score: newScore });
      eventBus.emit(Events.STREAK_UPDATE, {
        streak: newStreakState.count,
        multiplier: newStreakState.multiplier,
      });
    }

    this.updateScoreDisplay();
  }

  private handleMissedNote(noteId: string): void {
    if (!this.streakManager) return;
    this.streakManager.miss();
    gameState.set('streak', 0);
    gameState.set('notesMissed', gameState.get('notesMissed') + 1);
    eventBus.emit(Events.NOTE_MISSED, { noteId, grade: 'Miss' });
    this.updateScoreDisplay();
  }

  private handlePause(): void {
    gameState.set('isPaused', true);
    // TODO: Show pause overlay (Iteration 5)
  }

  private handleResume(): void {
    gameState.set('isPaused', false);
  }

  private updateScoreDisplay(): void {
    this.scoreText?.setText(`Score: ${gameState.get('score')}`);
    this.streakText?.setText(`Streak: ${gameState.get('streak')}`);
  }

  shutdown(): void {
    // CRITICAL: Remove all EventBus listeners to avoid memory leaks
    if (this.boundNotePlayed) eventBus.off(Events.NOTE_PLAYED, this.boundNotePlayed);
    if (this.boundPause) eventBus.off(Events.GAME_PAUSE, this.boundPause);
    if (this.boundResume) eventBus.off(Events.GAME_RESUME, this.boundResume);

    this.noteSpawner?.destroy();
    this.noteSpawner = null;
    this.hitDetector = null;
    this.scorer = null;
    this.streakManager = null;
    this.scoreText = null;
    this.streakText = null;

    gameState.set('isPlaying', false);
  }
}
