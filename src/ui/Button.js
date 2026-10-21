import { textStyle, playSfx } from './theme.js';

/** Botón redondeado clickeable. Se activa con clic o desde MenuNav (teclado). */
export function createButton(scene, x, y, label, onClick, { width = 300, height = 54, size = 24 } = {}) {
  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const txt = scene.add.text(0, 0, label, textStyle(size)).setOrigin(0.5);
  container.add([bg, txt]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.setDepth(40);

  const draw = (focused) => {
    bg.clear();
    bg.fillStyle(focused ? 0xffd23f : 0x1f3b73, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(4, focused ? 0xffffff : 0x0d1b3d, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    txt.setColor(focused ? '#1a1a1a' : '#ffffff');
  };

  container.setFocus = (focused) => {
    draw(focused);
    container.setScale(focused ? 1.06 : 1);
  };
  container.setLabel = (s) => txt.setText(s);
  container.activate = () => {
    playSfx(scene, 'click', { volume: 0.6 });
    onClick();
  };
  container.on('pointerdown', (pointer) => {
    if (pointer.button === 0) container.activate();
  });

  draw(false);
  return container;
}

/**
 * Navegación de menús con teclado: flechas para moverse, ENTER (o ESPACIO) para elegir.
 * Si el botón enfocado tiene onLeft/onRight, las flechas laterales lo usan (ej. dificultad).
 */
export class MenuNav {
  constructor(scene, buttons, { onBack } = {}) {
    this.buttons = buttons;
    this.index = 0;

    buttons.forEach((b, i) => b.on('pointerover', () => this.focus(i)));

    const kb = scene.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-LEFT', () => (this.current().onLeft ? this.current().onLeft() : this.move(-1)));
    kb.on('keydown-RIGHT', () => (this.current().onRight ? this.current().onRight() : this.move(1)));
    kb.on('keydown-ENTER', () => this.current().activate());
    kb.on('keydown-SPACE', () => this.current().activate());
    if (onBack) kb.on('keydown-ESC', onBack);

    this.focus(0);
  }

  current() {
    return this.buttons[this.index];
  }

  move(dir) {
    this.focus((this.index + dir + this.buttons.length) % this.buttons.length);
  }

  focus(i) {
    this.index = i;
    this.buttons.forEach((b, j) => b.setFocus(j === i));
  }
}
