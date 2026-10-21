import Phaser from 'phaser';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo } from '../ui/theme.js';

const SECTIONS = [
  {
    title: 'PATEAR  (vos pateás primero)',
    lines: [
      '1. La mira recorre el arco de lado a lado: clic o ESPACIO fija la dirección.',
      '2. Después sube y baja: clic o ESPACIO fija la altura.',
      '3. La barra de potencia se llena y vacía: detenela con otro clic o ESPACIO.',
      '   Débil (0-35 %): el arquero la ataja aunque se tire a la zona vecina.',
      '   Fuerte (85-100 %): solo la ataja si adivina la zona, pero puede desviarse ±20 px.',
    ],
  },
  {
    title: 'ATAJAR',
    lines: [
      'Mirá la carrera del pateador: su cuerpo suele inclinarse hacia el lado del tiro.',
      'Cuando patea tenés un instante para elegir zona: Q W E (arriba) / A S D (abajo)',
      'o clic sobre la zona. Si no elegís a tiempo, te quedás en el centro.',
    ],
  },
  {
    title: 'LA TANDA',
    lines: [
      '5 penales por lado. Si un equipo ya no puede alcanzar al otro, termina antes.',
      'Si hay empate después de 5, se sigue de a uno por lado: ¡muerte súbita!',
      'ESC: pausa   ·   M: silenciar',
    ],
  },
];

export class InstructionsScene extends Phaser.Scene {
  constructor() {
    super('Instructions');
  }

  create() {
    this.add.image(0, 0, 'stadium').setOrigin(0);
    this.add.rectangle(0, 0, 960, 540, 0x050b1f, 0.8).setOrigin(0);

    this.add.text(480, 42, 'INSTRUCCIONES', textStyle(38, '#ffd23f', { stroke: '#000', strokeThickness: 6 })).setOrigin(0.5);

    let y = 88;
    SECTIONS.forEach((section) => {
      this.add.text(70, y, section.title, textStyle(18, '#7dd3fc'));
      y += 28;
      section.lines.forEach((line) => {
        this.add.text(80, y, line, { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '16px', color: '#ffffff' });
        y += 22;
      });
      y += 12;
    });

    const back = () => goTo(this, 'Menu');
    const backBtn = createButton(this, 480, 500, 'VOLVER AL MENÚ', back, { width: 320, height: 48, size: 20 });
    new MenuNav(this, [backBtn], { onBack: back });

    addMuteButton(this, 930, 30);
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }
}
