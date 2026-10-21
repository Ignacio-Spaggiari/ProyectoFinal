import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo } from '../ui/theme.js';

/** Partes comunes de las pantallas de Victoria y Derrota: marcador final y botones. */
export function buildResultScreen(scene, data, overlayAlpha) {
  scene.add.image(0, 0, 'stadium').setOrigin(0);
  scene.add.rectangle(0, 0, 960, 540, 0x050b1f, overlayAlpha).setOrigin(0);

  const { player = 0, cpu = 0, suddenDeath = false, difficulty = '' } = data || {};

  scene.add
    .text(480, 372, `JUGADOR  ${player} – ${cpu}  CPU`, textStyle(30, '#ffffff', { stroke: '#000', strokeThickness: 6 }))
    .setOrigin(0.5);
  const detail = [suddenDeath ? 'Definido por muerte súbita' : 'Tanda regular', difficulty && `Dificultad: ${difficulty}`]
    .filter(Boolean)
    .join('  ·  ');
  scene.add.text(480, 406, detail, textStyle(14, '#cbd5e1')).setOrigin(0.5);

  const again = createButton(scene, 340, 470, 'JUGAR DE NUEVO', () => goTo(scene, 'Match'), { width: 260, size: 20 });
  const menu = createButton(scene, 620, 470, 'MENÚ', () => goTo(scene, 'Menu'), { width: 260, size: 20 });
  new MenuNav(scene, [again, menu]);

  addMuteButton(scene, 930, 30);
  scene.cameras.main.fadeIn(350, 0, 0, 0);
}
