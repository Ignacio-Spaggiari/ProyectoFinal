// Estado de la tanda: resultados de cada lado, definición anticipada y muerte súbita.
import { REGULATION_KICKS } from '../config.js';

export class Shootout {
  constructor(regulation = REGULATION_KICKS) {
    this.regulation = regulation;
    this.player = []; // resultados: 'gol' | 'atajado' | 'afuera' | 'palo'
    this.cpu = [];
  }

  get playerGoals() {
    return this.player.filter((r) => r === 'gol').length;
  }

  get cpuGoals() {
    return this.cpu.filter((r) => r === 'gol').length;
  }

  /** El jugador patea primero en cada ronda. */
  nextShooter() {
    return this.player.length <= this.cpu.length ? 'player' : 'cpu';
  }

  record(side, result) {
    this[side].push(result);
  }

  isSuddenDeath() {
    const n = this.regulation;
    if (this.player.length > n) return true;
    return this.player.length === n && this.cpu.length === n && this.playerGoals === this.cpuGoals;
  }

  /** Devuelve 'player', 'cpu' o null si la tanda sigue. */
  winner() {
    const n = this.regulation;
    const p = this.player.length;
    const c = this.cpu.length;
    const pg = this.playerGoals;
    const cg = this.cpuGoals;

    if (p <= n && c <= n) {
      // Definición anticipada: un equipo ya no puede alcanzar al otro
      if (pg + (n - p) < cg) return 'cpu';
      if (cg + (n - c) < pg) return 'player';
      return null;
    }

    // Muerte súbita: se define al completar cada ronda
    if (p === c && pg !== cg) return pg > cg ? 'player' : 'cpu';
    return null;
  }

  /** Resultados a mostrar en los 5 indicadores del HUD (en muerte súbita, las rondas extra). */
  visibleSlots(side) {
    const n = this.regulation;
    const rounds = Math.max(this.player.length, this.cpu.length);
    const start = rounds <= n ? 0 : n + Math.floor((rounds - n - 1) / n) * n;
    const list = this[side];
    const slots = [];
    for (let i = 0; i < n; i++) slots.push(list[start + i]);
    return slots;
  }
}
