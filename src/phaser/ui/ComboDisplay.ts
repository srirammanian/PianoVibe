import Phaser from 'phaser';

export class ComboDisplay {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private lastMultiplier = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add
      .text(scene.scale.width - 20, 60, '', {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  update(streak: number, multiplier: number): void {
    if (streak > 0) {
      this.text.setText(`${streak} × ${multiplier}`);
      const color =
        multiplier === 4 ? '#F39C12' : multiplier === 3 ? '#E67E22' : '#ffffff';
      this.text.setColor(color);
    } else {
      this.text.setText('');
    }

    // Pulse on multiplier increase
    if (multiplier > this.lastMultiplier) {
      this.scene.tweens.add({
        targets: this.text,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 100,
        yoyo: true,
        ease: 'Power2Out',
      });
    }

    this.lastMultiplier = multiplier;
  }

  destroy(): void {
    this.text.destroy();
  }
}
