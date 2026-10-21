import Phaser from 'phaser';
import { generateTextures } from '../gfx/textures.js';
import { generateSounds } from '../audio/synth.js';
import { textStyle } from '../ui/theme.js';
import musicUrl from '../audio/cancionprincipal.mp3';
import { loadKitId } from '../skins.js';

/** Escena de Carga: carga la canción, genera imágenes y sonidos y pasa al menú. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.registry.set('difficulty', this.registry.get('difficulty') || 'normal');
    this.registry.set('kit', this.registry.get('kit') || loadKitId());

    this.add.text(480, 220, 'PENALTY LOCK', textStyle(48, '#ffd23f', { stroke: '#000', strokeThickness: 8 })).setOrigin(0.5);
    this.label = this.add.text(480, 330, 'Cargando imágenes y sonidos...', textStyle(16)).setOrigin(0.5);
    const box = this.add.graphics();
    box.fillStyle(0xffffff, 0.15);
    box.fillRoundedRect(330, 290, 300, 20, 8);
    const bar = this.add.graphics();

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0x22c55e, 1);
      bar.fillRoundedRect(332, 292, Math.max(8, 296 * value), 16, 7);
    });

    this.load.audio('music', musicUrl);
  }

  create() {
    generateTextures(this);
    const audioOk = generateSounds(this);
    if (!audioOk) this.label.setText('Tu navegador no soporta Web Audio: el juego va sin sonido.');
    this.time.delayedCall(audioOk ? 200 : 1200, () => this.scene.start('Menu'));
  }
}
