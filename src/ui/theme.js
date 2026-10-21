export const FONT = '"Arial Black", "Segoe UI", Arial, sans-serif';

export function textStyle(size, color = '#ffffff', extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, color, ...extra };
}

/** Reproduce un efecto si existe en la caché (si el navegador no tiene Web Audio, no hace nada). */
export function playSfx(scene, key, config = {}) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key, config);
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
