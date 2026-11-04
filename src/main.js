import Phaser from 'phaser';
import { WIDTH, HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { SkinsScene } from './scenes/SkinsScene.js';
import { MatchScene } from './scenes/MatchScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { DefeatScene } from './scenes/DefeatScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#050b1f',
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SkinsScene, MatchScene, PauseScene, VictoryScene, DefeatScene],
};

const game = new Phaser.Game(config);

// Solo en desarrollo: acceso desde la consola del navegador para depurar
if (import.meta.env.DEV) window.game = game;

export default game;
