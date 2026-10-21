import { STAGES } from '../config.js';
import { createButton, MenuNav } from '../ui/Button.js';
import { addMuteButton } from '../ui/MuteButton.js';
import { textStyle, goTo } from '../ui/theme.js';

/**
 * Partes comunes de las pantallas de Victoria y Derrota: marcador final y botones.
 * playAgain: { label, stage } -> botón principal que juega esa fase del torneo.
 */
export function buildResultScreen(scene, data, overlayAlpha, playAgain) {
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

  const play = () => {
    scene.registry.set('stage', playAgain.stage);
    goTo(scene, 'Match');
  };
  const again = createButton(scene, 340, 470, playAgain.label, play, { width: 260, size: 20 });
  const menu = createButton(scene, 620, 470, 'MENÚ', () => goTo(scene, 'Menu'), { width: 260, size: 20 });
  new MenuNav(scene, [again, menu]);

  addMuteButton(scene, 930, 30);
  scene.cameras.main.fadeIn(350, 0, 0, 0);
}

/**
 * Llave del torneo: CUARTOS -> SEMIFINAL -> FINAL.
 * Las fases antes de "current" salen ganadas (verde); "current" se pinta según status:
 * 'next' (amarillo, la que sigue), 'won' (verde) o 'lost' (rojo).
 */
export function drawBracket(scene, y, current, status) {
  const g = scene.add.graphics().setDepth(10);
  const gap = 190;
  const x0 = 480 - gap;
  g.lineStyle(4, 0xffffff, 0.35);
  g.lineBetween(x0, y, x0 + gap * 2, y);

  STAGES.forEach((stage, i) => {
    const x = x0 + i * gap;
    let fill = 0x374151;
    let label = stage.short;
    let color = '#9ca3af';
    if (i < current || (i === current && status === 'won')) {
      fill = 0x16a34a;
      label = `✔ ${stage.short}`;
      color = '#ffffff';
    } else if (i === current && status === 'next') {
      fill = 0xffd23f;
      color = '#1a1a1a';
    } else if (i === current && status === 'lost') {
      fill = 0xdc2626;
      label = `✖ ${stage.short}`;
      color = '#ffffff';
    }
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x - 80, y - 17, 160, 34, 17);
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeRoundedRect(x - 80, y - 17, 160, 34, 17);
    scene.add.text(x, y, label, textStyle(15, color)).setOrigin(0.5).setDepth(11);
  });
}
