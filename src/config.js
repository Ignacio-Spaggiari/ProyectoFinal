// Constantes globales del juego (valores tomados del GDD de Penalty Lock)
// Los textos visibles (label, name, short) son keys de Traducila: se muestran con getPhrase(...).
import { KEYS } from './enums/keys.js';

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
  facil: { key: 'facil', label: KEYS.FACIL, guess: 0.15, aimSpeed: 300, reactionMs: 1000 },
  normal: { key: 'normal', label: KEYS.NORMAL, guess: 0.25, aimSpeed: 440, reactionMs: 800 },
  dificil: { key: 'dificil', label: KEYS.DIFICIL, guess: 0.35, aimSpeed: 620, reactionMs: 650 },
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

// Hombres barrera (defensores de la CPU parados delante del arco). No se mueven:
// solo tapan los tiros del jugador que van directo hacia su cuerpo.
export const BARRIER = {
  feetY: 318, // un poco delante de la línea del arco
  scale: 1.2,
  halfWidth: 19, // medio ancho del cuerpo + radio de la pelota
  top: 210, // altura de la cabeza: los tiros más altos pasan por arriba
};

// Torneo: cuartos -> semifinal -> final. barriers() devuelve la X de cada hombre barrera.
export const STAGES = [
  { key: 'cuartos', name: KEYS.CUARTOS_DE_FINAL, short: KEYS.CUARTOS, barriers: () => [] },
  // Uno pegado a un palo (al azar), dejando libre el tiro bien ajustado al poste
  { key: 'semi', name: KEYS.SEMIFINAL, short: KEYS.SEMIFINAL_2, barriers: () => [Math.random() < 0.5 ? 312 : 648] },
  // Uno a cada lado del arquero, sin tapar los tiros ajustados a los palos
  { key: 'final', name: KEYS.FINAL, short: KEYS.FINAL_2, barriers: () => [392, 568] },
];

// Teclas para atajar: Q W E (arriba) / A S D (abajo)
export const ZONE_KEYS = { q: 1, w: 2, e: 3, a: 4, s: 5, d: 6 };
export const ZONE_LABELS = ['Q', 'W', 'E', 'A', 'S', 'D'];
