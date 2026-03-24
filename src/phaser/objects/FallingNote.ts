import Phaser from 'phaser';
import { NOTE, FEEDBACK } from '../../core/Constants';
import type { GameReadyNote, TimingGrade } from '../../core/types';

export class FallingNote extends Phaser.GameObjects.Rectangle {
  public readonly noteData: GameReadyNote;
  private fingerText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, noteData: GameReadyNote) {
    const color = noteData.hand === 'left' ? NOTE.LEFT_HAND_COLOR : NOTE.RIGHT_HAND_COLOR;
    const width = Math.min(Math.max(noteData.duration * 80, NOTE.MIN_WIDTH), NOTE.MAX_WIDTH);
    super(scene, x, y, width, NOTE.HEIGHT, color);

    this.noteData = noteData;
    scene.add.existing(this);

    if (noteData.finger) {
      this.fingerText = scene.add.text(x, y, String(noteData.finger), {
        fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(0.5);
    }
  }

  showHitFeedback(grade: TimingGrade): void {
    if (grade === 'Miss' || grade === 'Wrong') return;
    const colorMap: Record<string, number> = {
      Perfect: FEEDBACK.COLORS.perfect,
      Good: FEEDBACK.COLORS.good,
      OK: FEEDBACK.COLORS.ok,
    };
    this.setFillStyle(colorMap[grade] ?? FEEDBACK.COLORS.ok);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.2,
      duration: 300,
      onComplete: () => {
        this.fingerText?.destroy();
        this.destroy();
      },
    });
  }

  showMissFeedback(): void {
    this.setFillStyle(FEEDBACK.COLORS.miss);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.fingerText?.destroy();
        this.destroy();
      },
    });
  }

  preUpdate(): void {
    if (this.fingerText) {
      this.fingerText.setPosition(this.x, this.y);
    }
  }
}
