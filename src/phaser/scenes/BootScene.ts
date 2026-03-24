import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
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
  }
}
