import Phaser from 'phaser';
import { FEEDBACK } from '../../core/Constants';

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Burst of particles at the hit position.
   * @param x  World x of the hit
   * @param y  World y of the hit
   * @param color  Tint colour (0xRRGGBB)
   */
  hitBurst(x: number, y: number, color: number): void {
    // Guard: 'particle' texture must exist in the cache.
    // PreloaderScene is expected to create it; skip gracefully if missing.
    if (!this.scene.textures.exists('particle')) return;

    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: FEEDBACK.PARTICLES.HIT_BURST_LIFESPAN,
      tint: color,
      quantity: FEEDBACK.PARTICLES.HIT_BURST_COUNT,
      emitting: false,
    });

    particles.explode(FEEDBACK.PARTICLES.HIT_BURST_COUNT);

    // Auto-destroy after animation completes
    this.scene.time.delayedCall(FEEDBACK.PARTICLES.HIT_BURST_LIFESPAN + 100, () => {
      particles.destroy();
    });
  }

  /**
   * Small trail burst used when a streak milestone is reached.
   */
  streakTrail(x: number, y: number, color: number): void {
    if (!this.scene.textures.exists('particle')) return;

    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 10, max: 40 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      lifespan: FEEDBACK.PARTICLES.STREAK_TRAIL_LIFESPAN,
      tint: color,
      quantity: FEEDBACK.PARTICLES.STREAK_TRAIL_COUNT,
      emitting: false,
    });

    particles.explode(FEEDBACK.PARTICLES.STREAK_TRAIL_COUNT);

    this.scene.time.delayedCall(FEEDBACK.PARTICLES.STREAK_TRAIL_LIFESPAN + 100, () => {
      particles.destroy();
    });
  }

  /** No-op — particle emitters are self-cleaning via delayedCall. */
  destroy(): void {
    // intentionally empty
  }
}
