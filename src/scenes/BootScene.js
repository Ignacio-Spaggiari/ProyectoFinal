import Phaser from 'phaser';
import { generateTextures } from '../gfx/textures.js';
import { generateSounds } from '../audio/synth.js';
import { textStyle } from '../ui/theme.js';

/** Escena de Carga: genera imágenes y sonidos y pasa al menú. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.registry.set('difficulty', this.registry.get('difficulty') || 'normal');

    this.add.text(480, 220, 'PENALTY LOCK', textStyle(48, '#ffd23f', { stroke: '#000', strokeThickness: 8 })).setOrigin(0.5);
    const label = this.add.text(480, 330, 'Cargando imágenes y sonidos...', textStyle(16)).setOrigin(0.5);
    const box = this.add.graphics();
    box.fillStyle(0xffffff, 0.15);
    box.fillRoundedRect(330, 290, 300, 20, 8);
    const bar = this.add.graphics();

    const progress = { value: 0 };
    const drawBar = () => {
      bar.clear();
      bar.fillStyle(0x22c55e, 1);
      bar.fillRoundedRect(332, 292, Math.max(8, 296 * progress.value), 16, 7);
    };
    drawBar();

    // Se genera en el siguiente frame para que la pantalla de carga llegue a dibujarse.
    this.time.delayedCall(30, () => {
      generateTextures(this);
      const audioOk = generateSounds(this);
      if (!audioOk) label.setText('Tu navegador no soporta Web Audio: el juego va sin sonido.');

      this.tweens.add({
        targets: progress,
        value: 1,
        duration: 700,
        ease: 'Sine.easeInOut',
        onUpdate: drawBar,
        onComplete: () => this.time.delayedCall(audioOk ? 150 : 1200, () => this.scene.start('Menu')),
      });
    });
  }
}
