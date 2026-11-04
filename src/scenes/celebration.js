import Phaser from 'phaser';
import { textStyle, playSfx } from '../ui/theme.js';

const RUN_MS = 900;
const PARTY_MS = 1600;
const FADE_MS = 220;
const FAN_Y = 336;

/**
 * Escena corta de festejo después de un gol: el que convirtió corre al córner y
 * festeja con su hinchada. Se dibuja encima del partido (que sigue su curso al terminar).
 *
 * opts: { kicker, fans, title, color, score }
 * Devuelve { skip } para cortarla antes (ESPACIO o clic).
 */
export function playCelebration(scene, opts, onDone) {
  const layer = scene.add.container(0, 0).setDepth(45).setAlpha(0);
  const timers = [];
  let finished = false;

  layer.add(scene.add.image(0, 0, 'corner_bg').setOrigin(0));

  // Primera fila de hinchas, detrás del cartel de publicidad
  const fans = [];
  for (let i = 0; i < 15; i++) {
    const key = i % 3 === 2 ? 'fan_neutral' : opts.fans;
    const fan = scene.add
      .sprite(40 + i * 63 + Phaser.Math.Between(-6, 6), FAN_Y, key, 'down')
      .setOrigin(0.5, 1)
      .setScale(1.15);
    fans.push(fan);
    layer.add(fan);
  }

  // Cartel de publicidad delante de los hinchas
  const board = scene.add.graphics();
  board.fillStyle(0x0a0a0a);
  board.fillRect(0, 294, 960, 46);
  [0x2563eb, 0xfacc15, 0x16a34a, 0x7c3aed].forEach((c, i) => {
    board.fillStyle(c);
    board.fillRect(i * 240 + 3, 298, 234, 38);
  });
  layer.add(board);
  ['PENALTY LOCK', '4REAL STUDIOS', 'PENALTY LOCK', '4REAL STUDIOS'].forEach((t, i) =>
    layer.add(scene.add.text(i * 240 + 120, 317, t, textStyle(18, '#ffffff')).setOrigin(0.5))
  );

  // Banderín del córner
  const flag = scene.add.graphics();
  flag.fillStyle(0xffffff);
  flag.fillRect(857, 282, 5, 92);
  flag.fillStyle(0xffd23f);
  flag.fillTriangle(862, 284, 904, 296, 862, 310);
  layer.add(flag);

  // El que hizo el gol (de espaldas, mirando a la tribuna)
  const player = scene.add.sprite(250, 600, opts.kicker, 'run').setOrigin(0.5, 1).setScale(2.3);
  layer.add(player);

  const confetti = scene.add.particles(0, -10, 'confetti', {
    x: { min: 0, max: 960 },
    speedY: { min: 90, max: 220 },
    speedX: { min: -50, max: 50 },
    rotate: { min: 0, max: 360 },
    lifespan: 3000,
    frequency: 30,
    quantity: 3,
    tint: [0xffd23f, 0xffffff, opts.colorHex, 0x22c55e],
    emitting: false,
  });
  layer.add(confetti);

  const title = scene.add
    .text(480, 100, opts.title, textStyle(70, opts.color, { stroke: '#0b1220', strokeThickness: 12 }))
    .setOrigin(0.5)
    .setScale(0);
  const score = scene.add
    .text(480, 508, opts.score, textStyle(24, '#ffffff', { stroke: '#000', strokeThickness: 6 }))
    .setOrigin(0.5);
  layer.add([title, score]);

  const later = (ms, fn) => timers.push(scene.time.delayedCall(ms, fn));

  // 1) Aparece y el jugador corre al córner
  scene.tweens.add({ targets: layer, alpha: 1, duration: FADE_MS });
  playSfx(scene, 'goal', { volume: 0.6 });
  const steps = scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => player.setFrame(player.frame.name === 'run' ? 'idle' : 'run'),
  });
  timers.push(steps);
  scene.tweens.add({ targets: player, x: 790, y: 470, scale: 1.9, duration: RUN_MS, ease: 'Sine.easeOut' });

  // 2) Llega al córner: festejo, saltos y la hinchada enloquece
  later(RUN_MS, () => {
    steps.remove();
    player.setFrame('celebrate');
    scene.tweens.add({ targets: player, y: 440, duration: 200, yoyo: true, repeat: 3, ease: 'Quad.easeOut' });
    scene.tweens.add({ targets: title, scale: 1, duration: 380, ease: 'Back.easeOut' });
    confetti.start();
    fans.forEach((fan, i) => {
      fan.setFrame('up');
      scene.tweens.add({
        targets: fan,
        y: FAN_Y - 14,
        duration: 180 + (i % 4) * 30,
        yoyo: true,
        repeat: -1,
        delay: (i % 5) * 60,
        ease: 'Quad.easeOut',
      });
      timers.push(
        scene.time.addEvent({
          delay: 260 + (i % 3) * 70,
          loop: true,
          callback: () => fan.setFrame(fan.frame.name === 'up' ? 'down' : 'up'),
        })
      );
    });
  });

  // 3) Termina y vuelve al partido
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach((t) => t.remove());
    confetti.stop();
    scene.tweens.add({
      targets: layer,
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        scene.tweens.killTweensOf(layer.list);
        layer.destroy();
        onDone();
      },
    });
  };
  later(RUN_MS + PARTY_MS, finish);

  return { skip: finish };
}
