import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
import { GAME } from '../../core/Constants';
import type { GameStartData } from '../../core/types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    // Wait for GAME_START event from React, then pass data through to Preloader
    eventBus.once(Events.GAME_START, (data: unknown) => {
      this.scene.start('Preloader', data as GameStartData);
    });

    // ── Dark background ────────────────────────────────────────────────────
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, GAME.BACKGROUND_COLOR);

    // ── Title ─────────────────────────────────────────────────────────
    this.add.text(GAME.WIDTH / 2, 60, '🎹 PianoVibe', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, 105, 'Learn piano. Play games.', {
      fontSize: '18px',
      color: '#8B949E',
    }).setOrigin(0.5);

    // ── Menu buttons ────────────────────────────────────────────────────
    const centerX = GAME.WIDTH / 2;
    const btnW = 300;
    const btnH = 60;
    const btnSpacing = 80;

    const buttons: { label: string; y: number; key: string; color: string }[] = [
      { label: '🎮  Play Game', y: 240, key: 'Preloader', color: '#E74C3C' },
      { label: '🎤  Mic Debug (free play)', y: 320, key: 'MicDebug', color: '#3498DB' },
      { label: '🎵  Mic Debug — Song Mode', y: 400, key: 'MicDebugSong', color: '#2ECC71' },
      { label: '⚙️  Settings', y: 480, key: 'Boot', color: '#8B949E' },
    ];

    for (const btn of buttons) {
      const rect = this.add.rectangle(centerX, btn.y, btnW, btnH, 0x161B22, 0.8);
      rect.setStrokeStyle(1, 0x30363D);
      rect.setInteractive({ useHandCursor: true });

      const text = this.add.text(centerX, btn.y, btn.label, {
        fontSize: '22px',
        color: btn.color,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      rect.on('pointerover', () => {
        rect.setFillStyle(0x1f2937, 0.9);
        rect.setStrokeStyle(1, btn.color);
        text.setColor('#ffffff');
      });
      rect.on('pointerout', () => {
        rect.setFillStyle(0x161B22, 0.8);
        rect.setStrokeStyle(1, 0x30363D);
        text.setColor(btn.color);
      });
      rect.on('pointerdown', () => {
        eventBus.clear(Events.GAME_START);
        this.scene.start(btn.key);
      });
    }

    // ── Version ───────────────────────────────────────────────────────
    this.add.text(20, GAME.HEIGHT - 20, 'v0.1.0', {
      fontSize: '12px',
      color: '#30363D',
    });
  }
}
