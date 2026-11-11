// Idioma del juego (Español o Inglés) para la integración con Traducila.
// Las traducciones las carga y resuelve el archivo oficial src/services/translations.js.
import { EN, ES } from './enums/languages.js';
import { KEYS } from './enums/keys.js';
import { getLanguageConfig, getPhrase } from './services/translations.js';

// Idiomas que ofrece la interfaz del juego, en el orden del selector del menú
export const GAME_LANGUAGES = [ES, EN];

const STORAGE_KEY = 'penalty-lock-lang';

/** Idioma guardado por el jugador; si no hay, el de la URL o el navegador (o español). */
export function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (GAME_LANGUAGES.includes(saved)) return saved;
  } catch {
    // Sin acceso al almacenamiento: se sigue con la configuración oficial
  }
  const lang = getLanguageConfig();
  return GAME_LANGUAGES.includes(lang) ? lang : ES;
}

export function saveLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // No importa si no se puede guardar
  }
}

/** "JUGADOR 2 – 1 CPU" traducido: la key tiene dos {goles} (jugador y CPU, en ese orden). */
export function formatScore(playerGoals, cpuGoals) {
  return getPhrase(KEYS.JUGADOR_GOLES_GOLES_CPU)
    .replace('{goles}', playerGoals)
    .replace('{goles}', cpuGoals);
}
