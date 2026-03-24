import Phaser from 'phaser';
import { eventBus, Events } from '../../core/EventBus';
import { GAME } from '../../core/Constants';

export class PauseOverlay {
  private container: Phaser.GameObjects.Container;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    // Semi-transparent backdrop
    const bg = scene.add.rectangle(cx, cy, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.75);

    // Title
    const title = scene.add
      .text(cx, cy - 60, 'PAUSED', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Resume button
    const resumeBtn = scene.add
      .text(cx, cy + 40, '[ Resume ]', {
        fontSize: '32px',
        color: '#2ECC71',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      eventBus.emit(Events.GAME_RESUME, {});
    });

    // Hover effect
    resumeBtn.on('pointerover', () => resumeBtn.setAlpha(0.75));
    resumeBtn.on('pointerout', () => resumeBtn.setAlpha(1));

    // Quit button
    const quitBtn = scene.add
      .text(cx, cy + 100, '[ Quit ]', {
        fontSize: '32px',
        color: '#E74C3C',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    quitBtn.on('pointerdown', () => {
      eventBus.emit(Events.GAME_END, {});
    });

    quitBtn.on('pointerover', () => quitBtn.setAlpha(0.75));
    quitBtn.on('pointerout', () => quitBtn.setAlpha(1));

    this.container = scene.add.container(0, 0, [bg, title, resumeBtn, quitBtn]);
    this.container.setDepth(110); // Above FeedbackText (depth 100)
    this.container.setVisible(false);
  }

  show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.container.destroy();
  }
}
