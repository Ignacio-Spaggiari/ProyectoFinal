import Phaser from 'phaser';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle } from '../ui/theme.js';

/** Pausa: se lanza encima del partido (que queda pausado). */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.65).setOrigin(0);
    this.add.text(480, 150, 'PAUSA', textStyle(64, '#ffd23f', { stroke: '#000', strokeThickness: 10 })).setOrigin(0.5);

    const resume = () => {
      this.scene.resume('Match');
      this.scene.stop();
    };
    const restart = () => {
      this.scene.stop('Match');
      this.scene.start('Match');
    };
    const toMenu = () => {
      this.scene.stop('Match');
      this.scene.start('Menu');
    };

    const buttons = [
      createButton(this, 480, 260, 'CONTINUAR', resume),
      createButton(this, 480, 328, 'REINICIAR TANDA', restart),
      createButton(this, 480, 396, 'MENÚ PRINCIPAL', toMenu),
    ];
    new MenuNav(this, buttons);

    // Se espera un instante para que el mismo ESC que abrió la pausa no la cierre.
    this.time.delayedCall(200, () => this.input.keyboard.on('keydown-ESC', resume));

    this.add.text(480, 470, 'ESC: continuar', textStyle(14, '#cbd5e1')).setOrigin(0.5);
    addMuteButton(this, 68, 28);
  }
}
