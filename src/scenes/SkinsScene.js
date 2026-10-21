import Phaser from 'phaser';
import { KITS, getKit, kitTexture, saveKitId } from '../skins.js';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo, playSfx } from '../ui/theme.js';

const THUMB_Y = 448;
const THUMB_GAP = 74;
const THUMB_X0 = 480 - ((KITS.length - 1) * THUMB_GAP) / 2;

/** Selección de equipación: vista previa del pateador y del arquero. */
export class SkinsScene extends Phaser.Scene {
  constructor() {
    super('Skins');
  }

  create() {
    this.index = Math.max(0, KITS.findIndex((k) => k.id === getKit(this.registry.get('kit')).id));

    this.add.image(0, 0, 'stadium').setOrigin(0);
    this.add.rectangle(0, 0, 960, 540, 0x050b1f, 0.72).setOrigin(0);
    this.add.text(480, 40, 'EQUIPACIÓN', textStyle(38, '#ffd23f', { stroke: '#000', strokeThickness: 6 })).setOrigin(0.5);

    // Vista previa grande
    const floor = this.add.graphics();
    floor.fillStyle(0x000000, 0.35);
    floor.fillEllipse(380, 330, 120, 22);
    floor.fillEllipse(580, 330, 120, 22);
    this.kicker = this.add.sprite(380, 332, 'kicker_cpu', 'idle').setOrigin(0.5, 1).setScale(2.4);
    this.keeper = this.add.sprite(580, 332, 'keeper_cpu', 'idle').setOrigin(0.5, 1).setScale(2.4);
    this.tweens.add({ targets: [this.kicker, this.keeper], y: 324, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(380, 345, 'PATEADOR', textStyle(13, '#cbd5e1')).setOrigin(0.5);
    this.add.text(580, 345, 'ARQUERO', textStyle(13, '#cbd5e1')).setOrigin(0.5);

    // Nombre con flechas
    this.nameText = this.add.text(480, 385, '', textStyle(28, '#ffffff', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);
    const arrow = (x, label, dir) =>
      this.add
        .text(x, 385, label, textStyle(34, '#ffd23f', { stroke: '#000', strokeThickness: 5 }))
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.change(dir));
    arrow(250, '◀', -1);
    arrow(710, '▶', 1);

    // Miniaturas de todas las equipaciones
    this.thumbFrame = this.add.graphics();
    this.thumbs = KITS.map((kit, i) =>
      this.add
        .sprite(THUMB_X0 + i * THUMB_GAP, THUMB_Y + 30, kitTexture('kicker', kit.id), 'idle')
        .setOrigin(0.5, 1)
        .setScale(0.62)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.select(i))
    );

    // Botones
    const confirm = () => {
      const kit = KITS[this.index];
      this.registry.set('kit', kit.id);
      saveKitId(kit.id);
      goTo(this, 'Menu');
    };
    const back = () => goTo(this, 'Menu');
    const buttons = [
      createButton(this, 370, 506, 'ELEGIR', confirm, { width: 200, height: 46, size: 20 }),
      createButton(this, 590, 506, 'VOLVER', back, { width: 200, height: 46, size: 20 }),
    ];
    // Las flechas laterales cambian la equipación; arriba/abajo se mueve entre botones
    buttons.forEach((b) => {
      b.onLeft = () => this.change(-1);
      b.onRight = () => this.change(1);
    });
    new MenuNav(this, buttons, { onBack: back });

    addMuteButton(this, 930, 30);
    this.refresh(false);
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  change(dir) {
    this.select((this.index + dir + KITS.length) % KITS.length);
  }

  select(i) {
    if (i === this.index) return;
    this.index = i;
    playSfx(this, 'click', { volume: 0.6 });
    this.refresh(true);
  }

  refresh(animate) {
    const kit = KITS[this.index];
    this.kicker.setTexture(kitTexture('kicker', kit.id), 'idle');
    this.keeper.setTexture(kitTexture('keeper', kit.id), 'idle');
    this.nameText.setText(kit.name.toUpperCase());

    if (animate) {
      this.kicker.setScale(2.1);
      this.keeper.setScale(2.1);
      this.tweens.add({ targets: [this.kicker, this.keeper], scale: 2.4, duration: 220, ease: 'Back.easeOut' });
    }

    const x = THUMB_X0 + this.index * THUMB_GAP;
    this.thumbFrame.clear();
    this.thumbFrame.fillStyle(0xffd23f, 0.25);
    this.thumbFrame.fillRoundedRect(x - 30, THUMB_Y - 34, 60, 68, 10);
    this.thumbFrame.lineStyle(3, 0xffd23f, 1);
    this.thumbFrame.strokeRoundedRect(x - 30, THUMB_Y - 34, 60, 68, 10);
    this.thumbs.forEach((t, j) => t.setAlpha(j === this.index ? 1 : 0.6));
  }
}
