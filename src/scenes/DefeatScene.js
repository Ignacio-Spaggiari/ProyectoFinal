import Phaser from 'phaser';
import { buildResultScreen } from './resultScreen.js';
import { textStyle, playSfx } from '../ui/theme.js';
import { playerTextures } from '../skins.js';

/** Derrota: jugador abatido y marcador final. */
export class DefeatScene extends Phaser.Scene {
  constructor() {
    super('Defeat');
  }

  create(data) {
    buildResultScreen(this, data, 0.7);

    this.add
      .text(480, 52, 'PERDISTE', textStyle(64, '#f87171', { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(10);

    const cloud = this.add.image(480, 205, 'defeat_img').setScale(0.8).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: cloud, alpha: 1, duration: 600 });
    this.tweens.add({ targets: cloud, x: 490, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Jugador abatido
    const kicker = this.add
      .sprite(250, 340, playerTextures(this).kicker, 'lament')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setRotation(0.08)
      .setTint(0x9ca3af)
      .setDepth(10);
    this.tweens.add({ targets: kicker, scaleY: 1.94, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.sprite(710, 340, 'kicker_cpu', 'celebrate').setOrigin(0.5, 1).setScale(2).setDepth(10).setAlpha(0.8);

    this.add.text(480, 330, 'La próxima es tuya. ¡Revancha!', textStyle(18, '#ffffff')).setOrigin(0.5).setDepth(10);
    playSfx(this, 'defeat', { volume: 0.7 });
  }
}
