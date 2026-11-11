import Phaser from 'phaser';
import { buildResultScreen, drawBracket } from './resultScreen.js';
import { textStyle, playSfx } from '../ui/theme.js';
import { playerTextures } from '../skins.js';
import { KEYS } from '../enums/keys.js';
import { getPhrase } from '../services/translations.js';

/** Derrota: jugador abatido y marcador final. */
export class DefeatScene extends Phaser.Scene {
  constructor() {
    super('Defeat');
  }

  create(data) {
    const stage = (data && data.stage) || 0;
    // Reintentar repite la misma fase del torneo
    buildResultScreen(this, data, 0.7, { label: KEYS.REINTENTAR, stage });
    drawBracket(this, 112, stage, 'lost');

    this.add
      .text(480, 52, getPhrase(KEYS.PERDISTE), textStyle(64, '#f87171', { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(10);

    const cloud = this.add.image(480, 228, 'defeat_img').setScale(0.65).setAlpha(0).setDepth(10);
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

    playSfx(this, 'defeat', { volume: 0.7 });
  }
}
