import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
import { gameState } from '../../core/GameState';
import { GAME } from '../../core/Constants';
import { Scorer } from '../systems/Scorer';
import type { ScoreResult } from '../../core/types';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Results' });
  }

  init(): void {
    // Calculate final results from gameState and broadcast
    const scorer = new Scorer();
    const notesHit = gameState.get('notesHit');
    const notesTotal = gameState.get('notesTotal');
    const notesMissed = gameState.get('notesMissed');
    const accuracy = notesTotal > 0 ? notesHit / notesTotal : 0;
    const grade = scorer.calculateGrade(accuracy);
    const xpEarned = scorer.calculateXP(grade, gameState.get('mode'), gameState.get('speed'));
    const maxStreak = gameState.get('maxStreak');

    const results: ScoreResult = {
      totalScore: gameState.get('score'),
      notesHit,
      notesMissed,
      notesTotal,
      accuracy,
      grade,
      xpEarned,
      bestStreak: maxStreak,
    };

    eventBus.emit(Events.RESULTS_SHOW, results);
  }

  create(): void {
    const scorer = new Scorer();
    const notesHit = gameState.get('notesHit');
    const notesTotal = gameState.get('notesTotal');
    const accuracy = notesTotal > 0 ? notesHit / notesTotal : 0;
    const grade = scorer.calculateGrade(accuracy);
    const xpEarned = scorer.calculateXP(grade, gameState.get('mode'), gameState.get('speed'));

    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x0D1117);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 120, 'Song Complete!', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, grade, {
      fontSize: '96px',
      color: '#F39C12',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20, `Score: ${gameState.get('score')}`, {
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 70, `Accuracy: ${Math.round(accuracy * 100)}%`, {
      fontSize: '28px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 110, `XP Earned: +${xpEarned}`, {
      fontSize: '28px',
      color: '#2ECC71',
    }).setOrigin(0.5);

    // Back to Menu button
    const menuBtn = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 180, '[ Back to Menu ]', {
      fontSize: '24px',
      color: '#3498DB',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      eventBus.emit(Events.GAME_END, {});
    });

    // Play Again button
    const playBtn = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 230, '[ Play Again ]', {
      fontSize: '24px',
      color: '#E74C3C',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerdown', () => {
      eventBus.emit(Events.GAME_RESTART, {});
    });
  }
}
