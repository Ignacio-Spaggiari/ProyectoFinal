// Reglas de un penal: zonas del arco, palos, atajadas y decisiones de la CPU.
import { GOAL, INNER, KEEPER_WEIGHTS, CPU } from '../config.js';

const COL_W = (INNER.right - INNER.left) / 3;
const ROW_H = (INNER.bottom - INNER.top) / 2;
const BALL_MARGIN = 5; // radio aproximado de la pelota al llegar al arco

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const randBetween = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(randBetween(min, max + 1));

/** Zona (1..6) que corresponde a un punto dentro del arco. */
export function zoneOf(x, y) {
  const col = clamp(Math.floor((x - INNER.left) / COL_W), 0, 2);
  const row = y < INNER.top + ROW_H ? 0 : 1;
  return row * 3 + col + 1;
}

export function zoneColRow(zone) {
  return { col: (zone - 1) % 3, row: Math.floor((zone - 1) / 3) };
}

export function zoneRect(zone) {
  const { col, row } = zoneColRow(zone);
  return { x: INNER.left + col * COL_W, y: INNER.top + row * ROW_H, w: COL_W, h: ROW_H };
}

export function zoneCenter(zone) {
  const r = zoneRect(zone);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Zonas vecinas: misma fila y columna contigua, o misma columna y otra fila. */
export function areNeighbors(a, b) {
  const A = zoneColRow(a);
  const B = zoneColRow(b);
  return (A.row === B.row && Math.abs(A.col - B.col) === 1) || (A.col === B.col && A.row !== B.row);
}

/** 'post' si pega en un palo o el travesaño, 'out' si sale afuera, 'in' si entra. */
export function classifyPoint(x, y) {
  const hits = (rx, ry, rw, rh) =>
    x >= rx - BALL_MARGIN && x <= rx + rw + BALL_MARGIN && y >= ry - BALL_MARGIN && y <= ry + rh + BALL_MARGIN;

  if (
    hits(GOAL.x, GOAL.y, GOAL.post, GOAL.height) ||
    hits(GOAL.x + GOAL.width - GOAL.post, GOAL.y, GOAL.post, GOAL.height) ||
    hits(GOAL.x, GOAL.y, GOAL.width, GOAL.post)
  ) {
    return 'post';
  }
  if (x < INNER.left || x > INNER.right || y < INNER.top) return 'out';
  return 'in';
}

/** Atajada si el arquero eligió la zona exacta, o una vecina cuando el tiro es débil. */
export function isSaved(shotZone, keeperZone, weakShot) {
  if (!shotZone || !keeperZone) return false;
  return shotZone === keeperZone || (weakShot && areNeighbors(shotZone, keeperZone));
}

function weightedPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** El arquero CPU "lee" el tiro con la probabilidad de la dificultad; si no, elige por pesos. */
export function chooseKeeperZone(shotZone, guessChance) {
  if (shotZone && Math.random() < guessChance) return shotZone;
  return weightedPick(KEEPER_WEIGHTS) + 1;
}

const sideOfX = (x) => {
  if (x < INNER.left + COL_W) return 0;
  if (x > INNER.right - COL_W) return 2;
  return 1;
};

/** Tiro de la CPU: destino, potencia y si va afuera o al palo (10 %). */
export function pickCpuShot() {
  const power = randBetween(0.15, 1);

  if (Math.random() < CPU.missChance) {
    let tx;
    let ty;
    if (Math.random() < 0.5) {
      // Al palo o al travesaño
      const which = randInt(0, 2);
      if (which === 0) {
        tx = GOAL.x + GOAL.post / 2;
        ty = randBetween(150, 290);
      } else if (which === 1) {
        tx = GOAL.x + GOAL.width - GOAL.post / 2;
        ty = randBetween(150, 290);
      } else {
        tx = randBetween(280, 680);
        ty = GOAL.y + GOAL.post / 2;
      }
    } else {
      // Afuera: por un costado o por arriba
      const which = randInt(0, 2);
      if (which === 0) {
        tx = randBetween(196, 228);
        ty = randBetween(150, 290);
      } else if (which === 1) {
        tx = randBetween(732, 764);
        ty = randBetween(150, 290);
      } else {
        tx = randBetween(280, 680);
        ty = randBetween(70, 98);
      }
    }
    return { tx, ty, power, where: classifyPoint(tx, ty), zone: null, side: sideOfX(tx) };
  }

  const zone = randInt(1, 6);
  const c = zoneCenter(zone);
  const tx = clamp(c.x + randBetween(-45, 45), INNER.left + 16, INNER.right - 16);
  const ty = clamp(c.y + randBetween(-28, 28), INNER.top + 16, INNER.bottom - 12);
  return { tx, ty, power, where: 'in', zone, side: zoneColRow(zone).col };
}

/** Lado que "muestra" el cuerpo del pateador: coincide con el real el 60 % de las veces. */
export function pickHintSide(realSide) {
  if (Math.random() < CPU.hintAccuracy) return realSide;
  const others = [0, 1, 2].filter((s) => s !== realSide);
  return others[randInt(0, others.length - 1)];
}
