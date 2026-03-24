import Phaser from 'phaser';
import type { GameStartData } from '../../core/types';

export class PreloaderScene extends Phaser.Scene {
  private startData: GameStartData | null = null;

  constructor() {
    super({ key: 'Preloader' });
  }

  init(data: GameStartData): void {
    this.startData = data;
  }

  preload(): void {
    // Create a simple particle texture (8x8 white circle) programmatically
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  create(): void {
    this.scene.start('Game', this.startData ?? {});
  }
}
