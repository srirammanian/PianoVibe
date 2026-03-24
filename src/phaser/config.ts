import Phaser from 'phaser';
import { GAME } from '../core/Constants';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';
import { MicDebugScene } from './scenes/MicDebugScene';
import { MicDebugSongScene } from './scenes/MicDebugSongScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  parent: 'phaser-container',
  scene: [BootScene, PreloaderScene, GameScene, ResultsScene, MicDebugScene, MicDebugSongScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: {
    disableWebAudio: true,
  },
};
