// Constantes globales del juego (valores tomados del GDD de Penalty Lock)

export const WIDTH = 960;
export const HEIGHT = 540;

// Arco de 480 x 200 px. Los palos miden 10 px de grosor.
export const GOAL = { x: 240, y: 110, width: 480, height: 200, post: 10 };
export const GOAL_LINE_Y = GOAL.y + GOAL.height; // 310

// Interior del arco (donde la pelota es gol)
export const INNER = {
  left: GOAL.x + GOAL.post, // 250
  right: GOAL.x + GOAL.width - GOAL.post, // 710
  top: GOAL.y + GOAL.post, // 120
  bottom: GOAL_LINE_Y, // 310
};

// Posiciones en la cancha
export const BALL_SPOT = { x: 480, y: 455 };
export const KICKER_START = { x: 398, y: 534 };
export const KICK_POS = { x: 469, y: 486 };
export const KEEPER_SCALE = 1.25;
export const KICKER_SCALE = 1.4;

// Recorrido de la mira: sobresale 70 px de cada palo, así se puede tirar afuera
export const AIM = { minX: 170, maxX: 790, minY: 92, maxY: 296, midY: 215 };

export const DIFFICULTIES = {
  facil: { key: 'facil', label: 'Fácil', guess: 0.15, aimSpeed: 300, reactionMs: 1000 },
  normal: { key: 'normal', label: 'Normal', guess: 0.25, aimSpeed: 440, reactionMs: 800 },
  dificil: { key: 'dificil', label: 'Difícil', guess: 0.35, aimSpeed: 620, reactionMs: 650 },
};
export const DIFFICULTY_ORDER = ['facil', 'normal', 'dificil'];

export const POWER = {
  weak: 0.35, // 0-35 %: tiro débil
  strong: 0.85, // 85-100 %: tiro fuerte
  cycleMs: 1200, // la barra se llena y vacía en 1,2 s
  maxDeviation: 20, // desvío aleatorio del tiro fuerte (px)
};

export const CPU = {
  missChance: 0.1, // 10 % de tirarla afuera o al palo
  hintAccuracy: 0.6, // la pista del cuerpo es correcta el 60 % de las veces
  runUpMs: 1000, // carrera del pateador
};

// Pesos del arquero CPU para las zonas 1..6 (más abajo y al centro, menos en los ángulos)
export const KEEPER_WEIGHTS = [0.6, 1.0, 0.6, 1.2, 1.5, 1.2];

export const REGULATION_KICKS = 5;

// Teclas para atajar: Q W E (arriba) / A S D (abajo)
export const ZONE_KEYS = { q: 1, w: 2, e: 3, a: 4, s: 5, d: 6 };
export const ZONE_LABELS = ['Q', 'W', 'E', 'A', 'S', 'D'];
