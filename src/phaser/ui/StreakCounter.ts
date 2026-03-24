import Phaser from 'phaser';
import { FEEDBACK } from '../../core/Constants';

export class StreakCounter {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private lastStreak = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add
      .text(20, 60, 'Streak: 0', {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0, 0)
      .setDepth(10);
  }

  update(streak: number): void {
    const hasFlame = streak >= FEEDBACK.STREAK_EFFECTS.FLAME_THRESHOLD;
    const label = hasFlame ? `🔥 ${streak}` : `Streak: ${streak}`;
    this.text.setText(label);

    // Pulse animation on increment
    if (streak > this.lastStreak && streak > 0) {
      this.scene.tweens.add({
        targets: this.text,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 80,
        yoyo: true,
        ease: 'Power2Out',
      });
    }

    this.lastStreak = streak;
  }

  destroy(): void {
    this.text.destroy();
  }
}
