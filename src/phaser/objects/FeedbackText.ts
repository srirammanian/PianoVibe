import Phaser from 'phaser';
import type { TimingGrade } from '../../core/types';

const GRADE_LABELS: Record<TimingGrade, string> = {
  Perfect: 'Perfect!',
  Good: 'Good!',
  OK: 'OK!',
  Miss: 'Miss!',
  Wrong: 'Wrong!',
};

const GRADE_COLORS: Record<TimingGrade, string> = {
  Perfect: '#2ECC71',
  Good: '#F39C12',
  OK: '#E67E22',
  Miss: '#E74C3C',
  Wrong: '#C0392B',
};

export class FeedbackText {
  static show(scene: Phaser.Scene, x: number, y: number, grade: TimingGrade): void {
    const text = scene.add
      .text(x, y, GRADE_LABELS[grade], {
        fontSize: '28px',
        fontStyle: 'bold',
        color: GRADE_COLORS[grade],
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScale(0.5)
      .setDepth(100);

    scene.tweens.chain({
      targets: text,
      tweens: [
        // 1. Scale 0.5 → 1.2 over 100ms
        { scaleX: 1.2, scaleY: 1.2, duration: 100, ease: 'Power2Out' },
        // 2. Hold at 1.2 for 50ms
        { duration: 50 },
        // 3. Scale 1.2 → 1.0 while floating up 30px over 200ms
        { scaleX: 1.0, scaleY: 1.0, y: y - 30, duration: 200, ease: 'Power2Out' },
        // 4. Fade to 0 over 100ms
        { alpha: 0, duration: 100, onComplete: () => text.destroy() },
      ],
    });
  }
}
