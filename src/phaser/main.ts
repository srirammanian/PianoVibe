import Phaser from 'phaser';
import { phaserConfig } from './config';

export function createPhaserGame(): Phaser.Game {
  return new Phaser.Game(phaserConfig);
}
