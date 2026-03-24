import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
import { gameState } from '../../core/GameState';
import { GAME, NOTE, TIMING } from '../../core/Constants';
import { HitDetector } from '../systems/HitDetector';
import { Scorer } from '../systems/Scorer';
import { StreakManager } from '../systems/StreakManager';
import { NoteSpawner } from '../systems/NoteSpawner';
import { ABLoopController } from '../systems/ABLoopController';
import { ParticleManager } from '../systems/ParticleManager';
import { FeedbackText } from '../objects/FeedbackText';
import { PlayLine } from '../objects/PlayLine';
import { StreakCounter } from '../ui/StreakCounter';
import { ComboDisplay } from '../ui/ComboDisplay';
import { PauseOverlay } from '../ui/PauseOverlay';
import type { GameStartData, InputEvent, GameReadyNote } from '../../core/types';

export class GameScene extends Phaser.Scene {
  private noteSpawner: NoteSpawner | null = null;
  private hitDetector: HitDetector | null = null;
  private scorer: Scorer | null = null;
  private streakManager: StreakManager | null = null;
  private gameClock = 0;
  private songEndTimeMs = 0;

  // HUD
  private scoreText: Phaser.GameObjects.Text | null = null;

  // Iter-5 UI components
  private streakCounter: StreakCounter | null = null;
  private comboDisplay: ComboDisplay | null = null;
  private pauseOverlay: PauseOverlay | null = null;
  private particleManager: ParticleManager | null = null;

  // Practice tools
  private abLoop: ABLoopController | null = null;

  // Keyboard keys
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private aKey: Phaser.Input.Keyboard.Key | null = null;
  private bKey: Phaser.Input.Keyboard.Key | null = null;

  // Song data
  private songData: GameReadyNote[] = [];

  // Bound EventBus handlers for cleanup
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

    // Calculate song end time: last note end + fall duration buffer
    if (data.songData && data.songData.length > 0) {
      const lastNoteTime = Math.max(...data.songData.map(n => n.time + n.duration));
      this.songEndTimeMs = (lastNoteTime + 2.5) * 1000; // +2.5 s fall buffer
    } else {
      this.songEndTimeMs = 0;
    }
  }

  create(): void {
    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(
      GAME.WIDTH / 2,
      GAME.HEIGHT / 2,
      GAME.WIDTH,
      GAME.HEIGHT,
      GAME.BACKGROUND_COLOR
    );

    // ── Play line (replaces raw rectangle) ───────────────────────────────
    PlayLine.create(this);

    // ── HUD (score — top right) ───────────────────────────────────────────
    this.scoreText = this.add
      .text(GAME.WIDTH - 20, 20, 'Score: 0', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(1, 0);

    // ── Iter-5 UI components ─────────────────────────────────────────────
    this.streakCounter = new StreakCounter(this);
    this.comboDisplay = new ComboDisplay(this);
    this.pauseOverlay = new PauseOverlay(this);
    this.particleManager = new ParticleManager(this);

    // ── Practice tools ────────────────────────────────────────────────────
    this.abLoop = new ABLoopController();

    // ── Systems ───────────────────────────────────────────────────────────
    this.hitDetector = new HitDetector();
    this.scorer = new Scorer();
    this.streakManager = new StreakManager();

    if (this.songData.length > 0) {
      this.noteSpawner = new NoteSpawner(
        this,
        this.songData,
        gameState.get('speed')
      );
    }

    // ── Keyboard controls ─────────────────────────────────────────────────
    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null;
    this.aKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) ?? null;
    this.bKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.B) ?? null;

    // ── EventBus listeners ────────────────────────────────────────────────
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

    // ── Escape — toggle pause ─────────────────────────────────────────────
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (gameState.get('isPaused')) {
        eventBus.emit(Events.GAME_RESUME, {});
      } else {
        eventBus.emit(Events.GAME_PAUSE, {});
      }
    }

    const speed = gameState.get('speed');
    const adjustedDelta = delta * speed;
    this.gameClock += adjustedDelta;

    // ── A-B loop (practice mode only) ─────────────────────────────────────
    if (gameState.get('mode') === 'practice' && this.abLoop) {
      if (this.aKey && Phaser.Input.Keyboard.JustDown(this.aKey)) {
        this.abLoop.markA(this.gameClock / 1000);
      }
      if (this.bKey && Phaser.Input.Keyboard.JustDown(this.bKey)) {
        this.abLoop.markB(this.gameClock / 1000);
      }
      // Jump back when loop end is reached
      if (this.abLoop.shouldLoop(this.gameClock / 1000)) {
        const loopStartSec = this.abLoop.getLoopStart();
        if (loopStartSec !== null) {
          this.gameClock = loopStartSec * 1000;
          this.noteSpawner?.resetLoop(loopStartSec);
        }
      }
    }

    if (!this.noteSpawner) return;

    const windowMs = gameState.get('timingWindowMs');
    const { missedNoteIds } = this.noteSpawner.update(this.gameClock, adjustedDelta, windowMs);

    // Handle missed notes
    for (const noteId of missedNoteIds) {
      this.handleMissedNote(noteId);
    }

    // ── Update UI ─────────────────────────────────────────────────────────
    this.scoreText?.setText(`Score: ${gameState.get('score')}`);

    const streakState = this.streakManager?.getState();
    if (streakState) {
      this.streakCounter?.update(streakState.count);
      this.comboDisplay?.update(streakState.count, streakState.multiplier);
    }

    // ── Song completion ───────────────────────────────────────────────────
    if (this.songEndTimeMs > 0 && this.gameClock > this.songEndTimeMs) {
      this.scene.start('Results');
    }
  }

  private handleNotePlayed(inputEvent: InputEvent): void {
    if (!this.hitDetector || !this.scorer || !this.streakManager || !this.noteSpawner) return;
    if (!gameState.get('isPlaying') || gameState.get('isPaused')) return;

    const windowMs = gameState.get('timingWindowMs');
    const preset = gameState.get('timingPreset');

    // Find the closest matching note by MIDI note number
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

      // Show "Wrong!" feedback at centre stage
      FeedbackText.show(this, this.scale.width / 2, this.scale.height * 0.4, 'Wrong');
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

      FeedbackText.show(this, this.scale.width / 2, this.scale.height * 0.4, 'Miss');
    } else {
      const streakState = this.streakManager.getState();
      this.streakManager.hit();
      const newStreakState = this.streakManager.getState();

      const points = this.scorer.calculatePoints(
        result.grade,
        streakState.multiplier,
        result.isEarly,
        result.isLate,
        preset
      );

      const newScore = gameState.get('score') + points;
      gameState.set('score', newScore);
      gameState.set('streak', newStreakState.count);
      gameState.set('notesHit', gameState.get('notesHit') + 1);

      closestNote.showHitFeedback(result.grade);

      // ── Visual feedback ──────────────────────────────────────────────
      FeedbackText.show(this, this.scale.width / 2, this.scale.height * 0.4, result.grade);

      // Particle burst for successful hits
      const noteColor =
        closestNote.noteData.hand === 'right'
          ? NOTE.RIGHT_HAND_COLOR
          : NOTE.LEFT_HAND_COLOR;
      this.particleManager?.hitBurst(closestNote.x, closestNote.y, noteColor);

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
    this.pauseOverlay?.show();
  }

  private handleResume(): void {
    gameState.set('isPaused', false);
    this.pauseOverlay?.hide();
  }

  private updateScoreDisplay(): void {
    this.scoreText?.setText(`Score: ${gameState.get('score')}`);
  }

  shutdown(): void {
    // Remove all EventBus listeners
    if (this.boundNotePlayed) eventBus.off(Events.NOTE_PLAYED, this.boundNotePlayed);
    if (this.boundPause) eventBus.off(Events.GAME_PAUSE, this.boundPause);
    if (this.boundResume) eventBus.off(Events.GAME_RESUME, this.boundResume);

    // Destroy systems
    this.noteSpawner?.destroy();
    this.noteSpawner = null;
    this.hitDetector = null;
    this.scorer = null;
    this.streakManager = null;

    // Destroy UI components
    this.streakCounter?.destroy();
    this.streakCounter = null;
    this.comboDisplay?.destroy();
    this.comboDisplay = null;
    this.pauseOverlay?.destroy();
    this.pauseOverlay = null;
    this.particleManager?.destroy();
    this.particleManager = null;

    // abLoop is a pure class — no destroy needed
    this.abLoop = null;

    this.scoreText = null;
    gameState.set('isPlaying', false);
  }
}
