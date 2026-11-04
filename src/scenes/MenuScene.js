import Phaser from 'phaser';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../config.js';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo, playSfx, startMusic } from '../ui/theme.js';
import { KITS, getKit, saveKitId } from '../skins.js';

/** Menú principal: elegir dificultad, elegir equipación y jugar. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(0, 0, 'stadium').setOrigin(0);
    this.add.rectangle(0, 0, 960, 540, 0x050b1f, 0.55).setOrigin(0);
    this.add.image(240, 110, 'goal').setOrigin(0).setAlpha(0.35);

    const title = this.add
      .text(480, 96, 'PENALTY LOCK', textStyle(76, '#ffd23f', { stroke: '#0b1220', strokeThickness: 12 }))
      .setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add
      .text(480, 160, 'Apuntá, cargá la potencia y adiviná el palo del rival', textStyle(18, '#ffffff'))
      .setOrigin(0.5);

    const ball = this.add.image(480, 205, 'ball').setScale(1.3);
    this.tweens.add({ targets: ball, y: 190, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: ball, angle: 360, duration: 2000, repeat: -1 });

    const diffLabel = () => `DIFICULTAD: ◀ ${DIFFICULTIES[this.registry.get('difficulty')].label.toUpperCase()} ▶`;
    const changeDiff = (dir) => {
      const i = DIFFICULTY_ORDER.indexOf(this.registry.get('difficulty'));
      const next = DIFFICULTY_ORDER[(i + dir + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length];
      this.registry.set('difficulty', next);
      diffBtn.setLabel(diffLabel());
    };

    const size = { width: 380, height: 50 };
    // El torneo siempre empieza en cuartos de final
    const startTournament = () => {
      this.registry.set('stage', 0);
      goTo(this, 'Match');
    };
    const playBtn = createButton(this, 480, 280, 'JUGAR TORNEO', startTournament, size);
    const diffBtn = createButton(this, 480, 350, diffLabel(), () => changeDiff(1), { ...size, size: 20 });
    diffBtn.onLeft = () => {
      playSfx(this, 'click', { volume: 0.6 });
      changeDiff(-1);
    };
    diffBtn.onRight = () => {
      playSfx(this, 'click', { volume: 0.6 });
      changeDiff(1);
    };
    // Equipación: clic abre la pantalla de selección; flechas laterales la cambian acá mismo
    const kitLabel = () => `EQUIPACIÓN: ◀ ${getKit(this.registry.get('kit')).name.toUpperCase()} ▶`;
    const changeKit = (dir) => {
      playSfx(this, 'click', { volume: 0.6 });
      const i = KITS.findIndex((k) => k.id === getKit(this.registry.get('kit')).id);
      const kit = KITS[(i + dir + KITS.length) % KITS.length];
      this.registry.set('kit', kit.id);
      saveKitId(kit.id);
      kitBtn.setLabel(kitLabel());
    };
    const kitBtn = createButton(this, 480, 420, kitLabel(), () => goTo(this, 'Skins'), { ...size, size: 18 });
    kitBtn.onLeft = () => changeKit(-1);
    kitBtn.onRight = () => changeKit(1);

    new MenuNav(this, [playBtn, diffBtn, kitBtn]);

    this.add
      .text(480, 494, 'Mouse: clic en los botones  ·  Teclado: flechas + ENTER  ·  M: silenciar', textStyle(14, '#cbd5e1'))
      .setOrigin(0.5);
    this.add.text(480, 520, '© 4real studios', textStyle(12, '#94a3b8')).setOrigin(0.5);

    addMuteButton(this, 930, 30);
    startMusic(this);
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
