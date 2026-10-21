// Genera todas las imágenes del juego por código (estilo cartoon plano / pixel art),
// así el proyecto no depende de archivos externos.
import { KITS, kitTexture } from '../skins.js';

const KEEPER_FRAMES = ['idle', 'diveLeft', 'diveRight', 'jump', 'celebrate'];
const KICKER_FRAMES = ['idle', 'run', 'kick', 'celebrate', 'lament'];
const FRAME_W = 64;
const FRAME_H = 96;

// Generador pseudoaleatorio con semilla: el fondo sale siempre igual.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function generateTextures(scene) {
  const g = scene.add.graphics();
  makeStadium(scene, g);
  makeGoal(g);
  makeBall(g);
  makeCharacters(scene, g);
  makeUi(g);
  makeTrophy(g);
  makeDefeat(g);
  g.destroy();
}

function makeStadium(scene, g) {
  const rnd = seeded(2026);
  g.clear();

  // Techo y cielo nocturno
  g.fillStyle(0x050b1f);
  g.fillRect(0, 0, 960, 44);
  g.fillStyle(0x0d1530);
  g.fillRect(0, 30, 960, 14);

  // Reflectores
  [90, 300, 660, 870].forEach((x) => {
    g.fillStyle(0xffffff, 0.06);
    g.fillCircle(x, 16, 60);
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(x, 16, 32);
    g.fillStyle(0x2b2f3a);
    g.fillRect(x - 30, 6, 60, 20);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        g.fillStyle(0xfffbe0);
        g.fillRect(x - 26 + i * 11, 9 + j * 8, 8, 5);
      }
    }
  });

  // Tribuna con hinchada pixelada
  g.fillStyle(0x1b2340);
  g.fillRect(0, 44, 960, 192);
  const shirts = [0x2563eb, 0x60a5fa, 0xffffff, 0xdc2626, 0xfacc15, 0x1e3a8a, 0xf97316, 0x9ca3af];
  const skins = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
  for (let row = 0; row < 19; row++) {
    const y = 50 + row * 10;
    if (row % 5 === 4) {
      g.fillStyle(0x10162b);
      g.fillRect(0, y + 6, 960, 4);
      continue;
    }
    for (let x = 1; x < 960; x += 7) {
      if (rnd() < 0.08) continue;
      const ox = x + (row % 2) * 3;
      g.fillStyle(shirts[Math.floor(rnd() * shirts.length)]);
      g.fillRect(ox, y + 3, 5, 5);
      g.fillStyle(skins[Math.floor(rnd() * skins.length)]);
      g.fillRect(ox + 1, y, 3, 3);
    }
  }

  // Carteles de publicidad
  g.fillStyle(0x0a0a0a);
  g.fillRect(0, 234, 960, 30);
  const boards = [0x2563eb, 0xfacc15, 0xdc2626, 0x16a34a, 0x7c3aed, 0xf97316];
  boards.forEach((c, i) => {
    g.fillStyle(c);
    g.fillRect(i * 160 + 2, 237, 156, 24);
  });

  // Césped con franjas en perspectiva
  let y = 264;
  let h = 10;
  let alt = false;
  while (y < 540) {
    g.fillStyle(alt ? 0x3c9d48 : 0x46ad52);
    g.fillRect(0, y, 960, Math.ceil(h));
    y += h;
    h *= 1.32;
    alt = !alt;
  }

  // Líneas de la cancha
  g.lineStyle(3, 0xffffff, 0.9);
  g.lineBetween(0, 310, 960, 310);
  g.strokePoints(
    [
      { x: 288, y: 310 },
      { x: 266, y: 348 },
      { x: 694, y: 348 },
      { x: 672, y: 310 },
    ],
    false
  );
  g.lineBetween(120, 310, -40, 540);
  g.lineBetween(840, 310, 1000, 540);
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(480, 458, 12, 5);

  g.generateTexture('stadium', 960, 540);
}

function makeGoal(g) {
  g.clear();
  // Fondo de la red
  g.fillStyle(0x000000, 0.22);
  g.fillRect(10, 10, 460, 190);
  // Red
  g.lineStyle(1, 0xffffff, 0.45);
  for (let x = 10; x <= 470; x += 14) g.lineBetween(x, 10, x, 200);
  for (let y = 10; y <= 200; y += 14) g.lineBetween(10, y, 470, y);
  // Palos y travesaño
  g.fillStyle(0xd4d4d8);
  g.fillRect(0, 0, 10, 200);
  g.fillRect(470, 0, 10, 200);
  g.fillRect(0, 0, 480, 10);
  g.fillStyle(0xffffff);
  g.fillRect(1, 1, 5, 199);
  g.fillRect(471, 1, 5, 199);
  g.fillRect(1, 1, 478, 5);
  g.generateTexture('goal', 480, 200);
}

function polygon(cx, cy, r, sides, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

function makeBall(g) {
  g.clear();
  g.fillStyle(0xffffff);
  g.fillCircle(16, 16, 15);
  g.fillStyle(0x1f2937);
  const center = polygon(16, 16, 5.5, 5);
  g.fillPoints(center, true);
  g.lineStyle(1.5, 0x1f2937);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const px = 16 + Math.cos(a) * 12;
    const py = 16 + Math.sin(a) * 12;
    g.lineBetween(center[i].x, center[i].y, px, py);
    g.fillPoints(polygon(px, py, 3.5, 5, a + Math.PI), true);
  }
  g.lineStyle(1.5, 0x111827);
  g.strokeCircle(16, 16, 15);
  g.generateTexture('ball', 32, 32);
}

// ---------- Personajes ----------

const mirror = (p) => ({
  lHand: [FRAME_W - p.rHand[0], p.rHand[1]],
  rHand: [FRAME_W - p.lHand[0], p.lHand[1]],
  lFoot: [FRAME_W - p.rFoot[0], p.rFoot[1]],
  rFoot: [FRAME_W - p.lFoot[0], p.lFoot[1]],
});

const DIVE_LEFT = { lHand: [6, 8], rHand: [16, 5], lFoot: [30, 92], rFoot: [44, 84] };

const KEEPER_POSES = {
  idle: { lHand: [13, 46], rHand: [51, 46], lFoot: [21, 92], rFoot: [43, 92] },
  diveLeft: DIVE_LEFT,
  diveRight: mirror(DIVE_LEFT),
  jump: { lHand: [22, 6], rHand: [42, 6], lFoot: [27, 90], rFoot: [37, 90] },
  celebrate: { lHand: [9, 7], rHand: [55, 7], lFoot: [20, 92], rFoot: [44, 92] },
};

const KICKER_POSES = {
  idle: { lHand: [19, 57], rHand: [45, 57], lFoot: [26, 92], rFoot: [38, 92] },
  run: { lHand: [15, 46], rHand: [47, 58], lFoot: [22, 90], rFoot: [41, 80] },
  kick: { lHand: [9, 40], rHand: [55, 44], lFoot: [27, 92], rFoot: [41, 72] },
  celebrate: { lHand: [11, 6], rHand: [53, 6], lFoot: [23, 92], rFoot: [41, 92] },
  lament: { lHand: [23, 64], rHand: [41, 64], lFoot: [28, 92], rFoot: [36, 92], headDY: 5 },
};

// Ropa de la CPU (las del jugador están en skins.js)
const CPU_PALETTES = {
  kicker_cpu: { shirt: 0xdc2626, shorts: 0x111827, socks: 0xdc2626, skin: 0xc68642, hair: 0x111111, number: 0xffffff },
  keeper_cpu: { shirt: 0xf97316, shorts: 0x111827, socks: 0xf97316, skin: 0x8d5524, hair: 0x111111, gloves: 0xffffff },
};

const lerp = (a, b, t) => a + (b - a) * t;

function limb(g, x1, y1, x2, y2, width, color) {
  g.lineStyle(width, color, 1);
  g.lineBetween(x1, y1, x2, y2);
}

function drawFigure(g, ox, pose, pal, view) {
  const hips = [
    [28, 60],
    [36, 60],
  ];
  const shoulders = [
    [24, 29],
    [40, 29],
  ];

  // Piernas (piel + medias + botines)
  [pose.lFoot, pose.rFoot].forEach((foot, i) => {
    const hx = ox + hips[i][0];
    const hy = hips[i][1];
    const fx = ox + foot[0];
    const fy = foot[1];
    limb(g, hx, hy, fx, fy, 6, pal.skin);
    limb(g, lerp(hx, fx, 0.5), lerp(hy, fy, 0.5), fx, fy, 6.5, pal.socks);
    g.fillStyle(0x111111);
    g.fillEllipse(fx, fy + 1, 10, 5);
  });

  // Short y camiseta
  g.fillStyle(pal.shorts);
  g.fillRect(ox + 22, 49, 20, 13);
  g.fillStyle(pal.shirt);
  g.fillRoundedRect(ox + 21, 23, 22, 29, 4);

  // Diseño de la camiseta: bastones, franjas horizontales o banda cruzada
  if (pal.stripes) {
    g.fillStyle(pal.stripes);
    for (let x = 24; x < 42; x += 6) g.fillRect(ox + x, 24, 3, 27);
  }
  if (pal.hoops) {
    g.fillStyle(pal.hoops);
    g.fillRect(ox + 21, 33, 22, 3);
    g.fillRect(ox + 21, 43, 22, 3);
  }
  if (pal.sash) {
    g.fillStyle(pal.sash);
    g.fillPoints(
      [
        { x: ox + 21, y: 24 },
        { x: ox + 28, y: 24 },
        { x: ox + 43, y: 44 },
        { x: ox + 43, y: 52 },
      ],
      true
    );
  }

  if (view === 'back') {
    // Número 9 en la espalda
    g.fillStyle(pal.number);
    g.fillRect(ox + 29, 30, 7, 2);
    g.fillRect(ox + 29, 30, 2, 8);
    g.fillRect(ox + 34, 30, 2, 14);
    g.fillRect(ox + 29, 36, 7, 2);
    g.fillRect(ox + 29, 42, 7, 2);
  } else {
    g.fillStyle(0x000000, 0.18);
    g.fillRect(ox + 21, 36, 22, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(ox + 37, 29, 2.5);
  }

  // Cabeza
  const hx = ox + 32;
  const hy = 14 + (pose.headDY || 0);
  g.fillStyle(pal.skin);
  g.fillRect(ox + 29, 19, 6, 6);
  if (view === 'front') {
    g.fillStyle(pal.hair);
    g.fillCircle(hx, hy - 1, 9.5);
    g.fillStyle(pal.skin);
    g.fillCircle(hx, hy + 1.5, 8.2);
    g.fillStyle(0x1f1f1f);
    g.fillRect(hx - 4, hy + 1, 2, 3);
    g.fillRect(hx + 2, hy + 1, 2, 3);
  } else {
    g.fillStyle(pal.skin);
    g.fillCircle(hx - 9, hy + 2, 2.5);
    g.fillCircle(hx + 9, hy + 2, 2.5);
    g.fillStyle(pal.hair);
    g.fillCircle(hx, hy, 9);
  }

  // Brazos (manga + piel + mano/guante)
  [pose.lHand, pose.rHand].forEach((hand, i) => {
    const sx = ox + shoulders[i][0];
    const sy = shoulders[i][1];
    const px = ox + hand[0];
    const py = hand[1];
    limb(g, sx, sy, px, py, 5, pal.skin);
    limb(g, sx, sy, lerp(sx, px, 0.45), lerp(sy, py, 0.45), 6.5, pal.shirt);
    g.fillStyle(pal.gloves || pal.skin);
    g.fillCircle(px, py, pal.gloves ? 4.5 : 3);
  });
}

function makeSheet(scene, g, key, frames, poses, view, pal) {
  g.clear();
  frames.forEach((name, i) => drawFigure(g, i * FRAME_W, poses[name], pal, view));
  g.generateTexture(key, frames.length * FRAME_W, FRAME_H);
  const tex = scene.textures.get(key);
  frames.forEach((name, i) => tex.add(name, 0, i * FRAME_W, 0, FRAME_W, FRAME_H));
}

function makeCharacters(scene, g) {
  makeSheet(scene, g, 'keeper_cpu', KEEPER_FRAMES, KEEPER_POSES, 'front', CPU_PALETTES.keeper_cpu);
  makeSheet(scene, g, 'kicker_cpu', KICKER_FRAMES, KICKER_POSES, 'back', CPU_PALETTES.kicker_cpu);
  KITS.forEach((kit) => {
    makeSheet(scene, g, kitTexture('keeper', kit.id), KEEPER_FRAMES, KEEPER_POSES, 'front', kit.keeper);
    makeSheet(scene, g, kitTexture('kicker', kit.id), KICKER_FRAMES, KICKER_POSES, 'back', kit.kicker);
  });
}

// ---------- Interfaz ----------

function makeUi(g) {
  // Mira: amarillo brillante con contorno negro para que contraste con la red y la tribuna
  const crosshair = (width, color) => {
    g.lineStyle(width, color);
    g.strokeCircle(18, 18, 12);
    g.lineBetween(18, 2, 18, 11);
    g.lineBetween(18, 25, 18, 34);
    g.lineBetween(2, 18, 11, 18);
    g.lineBetween(25, 18, 34, 18);
  };
  g.clear();
  crosshair(7, 0x000000);
  crosshair(3.5, 0xffee00);
  g.fillStyle(0x000000);
  g.fillCircle(18, 18, 4);
  g.fillStyle(0xffffff);
  g.fillCircle(18, 18, 2.5);
  g.generateTexture('crosshair', 36, 36);

  // Indicadores de penal
  g.clear();
  g.fillStyle(0x22c55e);
  g.fillCircle(10, 10, 8);
  g.lineStyle(2, 0xffffff);
  g.strokeCircle(10, 10, 8);
  g.generateTexture('ind_goal', 20, 20);

  g.clear();
  g.fillStyle(0xef4444);
  g.fillCircle(10, 10, 8);
  g.lineStyle(2.5, 0xffffff);
  g.lineBetween(6.5, 6.5, 13.5, 13.5);
  g.lineBetween(13.5, 6.5, 6.5, 13.5);
  g.generateTexture('ind_miss', 20, 20);

  g.clear();
  g.lineStyle(2, 0x9ca3af);
  g.strokeCircle(10, 10, 7);
  g.generateTexture('ind_pending', 20, 20);

  // Parlante encendido / apagado
  const speaker = () => {
    g.fillStyle(0x000000, 0.45);
    g.fillCircle(16, 16, 16);
    g.fillStyle(0xffffff);
    g.fillRect(6, 12, 5, 8);
    g.fillPoints(
      [
        { x: 11, y: 12 },
        { x: 17, y: 6 },
        { x: 17, y: 26 },
        { x: 11, y: 20 },
      ],
      true
    );
  };
  g.clear();
  speaker();
  g.lineStyle(2.5, 0xffffff);
  g.beginPath();
  g.arc(17, 16, 5, -0.9, 0.9);
  g.strokePath();
  g.beginPath();
  g.arc(17, 16, 9, -0.9, 0.9);
  g.strokePath();
  g.generateTexture('icon_sound_on', 32, 32);

  g.clear();
  speaker();
  g.lineStyle(2.5, 0xff4d4d);
  g.lineBetween(20, 12, 27, 20);
  g.lineBetween(27, 12, 20, 20);
  g.generateTexture('icon_sound_off', 32, 32);

  // Pausa
  g.clear();
  g.fillStyle(0x000000, 0.45);
  g.fillCircle(16, 16, 16);
  g.fillStyle(0xffffff);
  g.fillRect(10, 9, 4, 14);
  g.fillRect(18, 9, 4, 14);
  g.generateTexture('icon_pause', 32, 32);

  // Partícula de papelito
  g.clear();
  g.fillStyle(0xffffff);
  g.fillRect(0, 0, 8, 5);
  g.generateTexture('confetti', 8, 5);
}

function makeTrophy(g) {
  const gold = 0xf5c518;
  const dark = 0xc99a06;
  g.clear();
  // Base
  g.fillStyle(0x8a5428);
  g.fillRect(70, 200, 116, 10);
  g.fillStyle(0x6b3f1d);
  g.fillRect(78, 210, 100, 34);
  g.fillStyle(gold);
  g.fillRect(104, 218, 48, 14);
  // Pie
  g.fillStyle(dark);
  g.fillRect(116, 150, 24, 52);
  g.fillStyle(gold);
  g.fillEllipse(128, 172, 44, 14);
  g.fillEllipse(128, 200, 70, 12);
  // Asas
  g.lineStyle(11, dark);
  g.beginPath();
  g.arc(64, 80, 26, Math.PI * 0.5, Math.PI * 1.5);
  g.strokePath();
  g.beginPath();
  g.arc(192, 80, 26, -Math.PI * 0.5, Math.PI * 0.5);
  g.strokePath();
  // Copa
  g.fillStyle(gold);
  g.fillPoints(
    [
      { x: 58, y: 40 },
      { x: 198, y: 40 },
      { x: 192, y: 90 },
      { x: 172, y: 128 },
      { x: 142, y: 152 },
      { x: 114, y: 152 },
      { x: 84, y: 128 },
      { x: 64, y: 90 },
    ],
    true
  );
  g.fillStyle(dark);
  g.fillEllipse(128, 40, 142, 22);
  g.fillStyle(0x7a5c00);
  g.fillEllipse(128, 39, 124, 13);
  // Brillo
  g.fillStyle(0xffffff, 0.45);
  g.fillPoints(
    [
      { x: 80, y: 54 },
      { x: 92, y: 54 },
      { x: 100, y: 122 },
      { x: 90, y: 118 },
    ],
    true
  );
  // Estrella
  const star = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 20 : 8;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    star.push({ x: 128 + Math.cos(a) * r, y: 92 + Math.sin(a) * r });
  }
  g.fillStyle(0xffffff, 0.95);
  g.fillPoints(star, true);
  g.generateTexture('trophy', 256, 256);
}

function makeDefeat(g) {
  g.clear();
  // Nube gris
  g.fillStyle(0x6b7280);
  g.fillCircle(88, 80, 36);
  g.fillCircle(130, 62, 46);
  g.fillCircle(174, 84, 34);
  g.fillRect(70, 80, 130, 38);
  g.fillStyle(0x4b5563);
  g.fillRect(70, 110, 130, 8);
  // Lluvia
  g.lineStyle(4, 0x60a5fa, 0.9);
  for (let i = 0; i < 7; i++) {
    const x = 82 + i * 17;
    const y = 132 + (i % 2) * 18;
    g.lineBetween(x, y, x - 6, y + 18);
  }
  // Pelota desinflada
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(128, 236, 120, 16);
  g.fillStyle(0xffffff);
  g.fillEllipse(128, 216, 104, 40);
  g.fillStyle(0x1f2937);
  g.fillEllipse(128, 210, 22, 12);
  g.fillEllipse(92, 216, 14, 10);
  g.fillEllipse(164, 216, 14, 10);
  g.lineStyle(2, 0x111827);
  g.strokeEllipse(128, 216, 104, 40);
  g.generateTexture('defeat_img', 256, 256);
}
