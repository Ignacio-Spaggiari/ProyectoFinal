export const FONT = '"Arial Black", "Segoe UI", Arial, sans-serif';

export function textStyle(size, color = '#ffffff', extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, color, ...extra };
}

/** Reproduce un efecto si existe en la caché (si el navegador no tiene Web Audio, no hace nada). */
export function playSfx(scene, key, config = {}) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key, config);
}

/**
 * Canción principal en bucle. El SoundManager es global, así que sigue sonando
 * al cambiar de escena. Si el navegador todavía bloquea el audio, arranca con
 * el primer clic o tecla.
 */
export function startMusic(scene) {
  if (!scene.cache.audio.exists('music')) return;
  const playing = scene.sound.getAll('music').some((s) => s.isPlaying);
  if (playing || scene.game.__musicPending) return;

  const play = () => {
    scene.game.__musicPending = false;
    if (!scene.sound.getAll('music').some((s) => s.isPlaying)) {
      scene.sound.play('music', { loop: true, volume: 0.35 });
    }
  };
  if (scene.sound.locked) {
    scene.game.__musicPending = true;
    scene.sound.once('unlocked', play);
  } else {
    play();
  }
}

/** Cambia de escena con un fundido; evita dobles activaciones mientras sale. */
export function goTo(scene, key, data) {
  if (scene.__leaving) return;
  scene.__leaving = true;
  scene.events.once('shutdown', () => {
    scene.__leaving = false;
  });
  scene.cameras.main.fadeOut(250, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
