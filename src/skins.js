// Equipaciones (skins) que puede elegir el jugador. Cada una tiene la ropa del
// pateador y la del arquero. Ninguna es roja/naranja para no confundirse con la CPU.

const SKIN = 0xe0ac69;
const HAIR = 0x3b2314;

export const KITS = [
  {
    id: 'clasica',
    name: 'Clásica',
    kicker: { shirt: 0x2563eb, shorts: 0xffffff, socks: 0x2563eb, number: 0xffffff },
    keeper: { shirt: 0xfacc15, shorts: 0x1f2937, socks: 0xfacc15, gloves: 0x22c55e },
  },
  {
    id: 'celeste',
    name: 'Celeste y Blanca',
    kicker: { shirt: 0x7dd3fc, stripes: 0xffffff, shorts: 0x111827, socks: 0xffffff, number: 0x111827 },
    keeper: { shirt: 0x16a34a, shorts: 0x111827, socks: 0x16a34a, gloves: 0xffffff },
  },
  {
    id: 'selva',
    name: 'Selva',
    kicker: { shirt: 0x15803d, shorts: 0xffffff, socks: 0x15803d, number: 0xfacc15, hoops: 0xfacc15 },
    keeper: { shirt: 0xa855f7, shorts: 0x1f2937, socks: 0xa855f7, gloves: 0xfacc15 },
  },
  {
    id: 'oro',
    name: 'Negro y Oro',
    kicker: { shirt: 0x111111, shorts: 0x111111, socks: 0xfacc15, number: 0xfacc15, stripes: 0x2a2a2a },
    keeper: { shirt: 0x06b6d4, shorts: 0x111827, socks: 0x06b6d4, gloves: 0xffffff },
  },
  {
    id: 'fucsia',
    name: 'Fucsia',
    kicker: { shirt: 0xec4899, shorts: 0x111827, socks: 0xec4899, number: 0xffffff },
    keeper: { shirt: 0x84cc16, shorts: 0x111827, socks: 0x84cc16, gloves: 0xec4899 },
  },
  {
    id: 'banda',
    name: 'Blanca con Banda',
    kicker: { shirt: 0xf8fafc, sash: 0x1e3a8a, shorts: 0x1e3a8a, socks: 0xf8fafc, number: 0x1e3a8a },
    keeper: { shirt: 0x111827, shorts: 0x111827, socks: 0x111827, gloves: 0x38bdf8 },
  },
].map((kit) => ({
  ...kit,
  kicker: { skin: SKIN, hair: HAIR, ...kit.kicker },
  keeper: { skin: SKIN, hair: HAIR, ...kit.keeper },
}));

export const DEFAULT_KIT = 'clasica';
const STORAGE_KEY = 'penalty-lock-kit';

export const kitTexture = (role, kitId) => `${role}_${kitId}`;

export function getKit(id) {
  return KITS.find((k) => k.id === id) || KITS[0];
}

/** Equipación guardada (se recuerda entre partidas en este navegador). */
export function loadKitId() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (KITS.some((k) => k.id === id)) return id;
  } catch {
    // Sin acceso al almacenamiento: se usa la equipación por defecto
  }
  return DEFAULT_KIT;
}

export function saveKitId(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // No importa si no se puede guardar
  }
}

/** Texturas del jugador según la equipación elegida (guardada en el registry). */
export function playerTextures(scene) {
  const id = getKit(scene.registry.get('kit')).id;
  return { kicker: kitTexture('kicker', id), keeper: kitTexture('keeper', id), fans: kitTexture('fan', id) };
}
