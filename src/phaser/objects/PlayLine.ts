import Phaser from 'phaser';
import { GAME } from '../../core/Constants';

export class PlayLine {
  static create(scene: Phaser.Scene): void {
    const y = GAME.HEIGHT - GAME.PLAY_LINE_Y_OFFSET;

    // Subtle wide glow (behind the main line)
    const glow = scene.add.rectangle(GAME.WIDTH / 2, y, GAME.WIDTH, 6, 0xffffff);
    glow.setAlpha(0.1);

    // Main line
    const line = scene.add.rectangle(GAME.WIDTH / 2, y, GAME.WIDTH, 2, 0xffffff);
    line.setAlpha(0.4);

    // Label
    scene.add
      .text(GAME.WIDTH - 10, y - 10, 'Play Line', {
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(1, 1);
  }
}
