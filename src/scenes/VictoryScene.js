import Phaser from 'phaser';
import { buildResultScreen, drawBracket } from './resultScreen.js';
import { STAGES } from '../config.js';
import { textStyle, playSfx } from '../ui/theme.js';
import { playerTextures } from '../skins.js';

/** Victoria: trofeo, festejo y marcador final. */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(data) {
    const stage = (data && data.stage) || 0;
    const champion = stage >= STAGES.length - 1;
    // Campeón: se vuelve a empezar desde cuartos. Si no, se pasa a la fase siguiente.
    buildResultScreen(
      this,
      data,
      0.45,
      champion ? { label: 'JUGAR DE NUEVO', stage: 0 } : { label: 'SIGUIENTE FASE', stage: stage + 1 }
    );
    drawBracket(this, 112, champion ? stage : stage + 1, champion ? 'won' : 'next');

    this.add
      .particles(0, -10, 'confetti', {
        x: { min: 0, max: 960 },
        speedY: { min: 80, max: 200 },
        speedX: { min: -40, max: 40 },
        rotate: { min: 0, max: 360 },
        lifespan: 4500,
        frequency: 40,
        quantity: 2,
        tint: [0xffd23f, 0x22c55e, 0x3b82f6, 0xef4444, 0xffffff],
      })
      .setDepth(5);

    const title = this.add
      .text(480, 52, champion ? '¡CAMPEÓN!' : '¡GANASTE!', textStyle(64, '#ffd23f', { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: title, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    if (champion) {
      const trophy = this.add.image(480, 232, 'trophy').setScale(0).setDepth(10);
      this.tweens.add({ targets: trophy, scale: 0.7, duration: 700, ease: 'Back.easeOut' });
      this.tweens.add({ targets: trophy, y: 224, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700 });
    } else {
      const next = this.add
        .text(480, 215, `¡PASÁS A LA ${STAGES[stage + 1].name.toUpperCase()}!`, textStyle(30, '#ffffff', { stroke: '#000', strokeThickness: 6 }))
        .setOrigin(0.5)
        .setDepth(10)
        .setScale(0);
      this.tweens.add({ targets: next, scale: 1, duration: 500, ease: 'Back.easeOut', delay: 200 });
      const ball = this.add.image(480, 285, 'ball').setScale(1.6).setDepth(10);
      this.tweens.add({ targets: ball, y: 265, duration: 380, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: ball, angle: 360, duration: 1600, repeat: -1 });
    }

    // Festejo de los jugadores
    const kit = playerTextures(this);
    const kicker = this.add.sprite(250, 340, kit.kicker, 'celebrate').setOrigin(0.5, 1).setScale(2).setDepth(10);
    const keeper = this.add.sprite(710, 340, kit.keeper, 'celebrate').setOrigin(0.5, 1).setScale(2).setDepth(10);
    this.tweens.add({ targets: [kicker, keeper], y: 320, duration: 300, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });

    const message = champion ? '¡La copa es tuya!' : `Ganaste ${STAGES[stage].name.toLowerCase()}`;
    this.add.text(480, 334, message, textStyle(18, '#ffffff')).setOrigin(0.5).setDepth(10);
    playSfx(this, 'victory', { volume: 0.7 });
    playSfx(this, 'goal', { volume: 0.5 });
  }
}
