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

    // ── Mic Debug shortcut ────────────────────────────────────────────────────
    // Visible while the Boot scene is waiting for a React GAME_START event.
    // Clicking launches the standalone mic visualiser without starting a song.
    const micDebugBtn = this.add
      .text(GAME.WIDTH / 2, 350, '🎤  Mic Debug Mode', {
        fontSize: '24px',
        color: '#3498DB',
        backgroundColor: '#161B22',
        padding: { x: 30, y: 15 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    micDebugBtn.on('pointerover',  () => micDebugBtn.setColor('#5DADE2'));
    micDebugBtn.on('pointerout',   () => micDebugBtn.setColor('#3498DB'));
    micDebugBtn.on('pointerdown',  () => {
      // Remove any pending GAME_START listener before leaving so it doesn't
      // fire stale when we return from MicDebug and Boot re-creates.
      eventBus.clear(Events.GAME_START);
      this.scene.start('MicDebug');
    });
  }
}
