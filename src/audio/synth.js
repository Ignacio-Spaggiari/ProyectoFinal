// Sintetiza los efectos de sonido con Web Audio y los guarda en la caché de audio de Phaser.
// Así se pueden reproducir con this.sound.play('clave') como cualquier sonido cargado.

const TAU = Math.PI * 2;
const noise = () => Math.random() * 2 - 1;

function addTone(d, sr, { freq, start, dur, amp = 0.5, wave = 'sine', vibrato = 0, decay = 3, glide = 0 }) {
  const s0 = Math.floor(start * sr);
  const s1 = Math.min(d.length, Math.floor((start + dur) * sr));
  let ph = 0;
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / sr;
    const f = freq * (1 + glide * (t / dur)) * (1 + vibrato * Math.sin(TAU * 5.5 * t));
    ph += (TAU * f) / sr;
    let v;
    if (wave === 'square') v = Math.sin(ph) >= 0 ? 1 : -1;
    else if (wave === 'triangle') v = (2 / Math.PI) * Math.asin(Math.sin(ph));
    else v = Math.sin(ph);
    const env = Math.min(1, t / 0.01) * Math.exp((-t * decay) / dur) * Math.min(1, (dur - t) / 0.03);
    d[i] += v * amp * env;
  }
}

// Ruido de hinchada (ruido filtrado en banda) con una envolvente dada
function addCrowd(d, sr, start, dur, envFn, amp = 1) {
  let lp1 = 0;
  let lp2 = 0;
  const s0 = Math.floor(start * sr);
  const s1 = Math.min(d.length, Math.floor((start + dur) * sr));
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / sr;
    const w = noise();
    lp1 += 0.12 * (w - lp1);
    lp2 += 0.015 * (w - lp2);
    d[i] += (lp1 - lp2) * amp * envFn(t);
  }
}

export function generateSounds(scene) {
  const ctx = scene.sound && scene.sound.context;
  if (!ctx || typeof ctx.createBuffer !== 'function') return false;
  const sr = ctx.sampleRate;

  const add = (key, seconds, fill, peakLevel = 0.9) => {
    if (scene.cache.audio.exists(key)) return;
    const len = Math.floor(seconds * sr);
    const buffer = ctx.createBuffer(1, len, sr);
    const d = buffer.getChannelData(0);
    fill(d, sr);
    let peak = 0;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    if (peak > 0) for (let i = 0; i < len; i++) d[i] *= peakLevel / peak;
    scene.cache.audio.add(key, buffer);
  };

  // Patada: golpe seco
  add('kick', 0.3, (d) => {
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      const f = 50 + 150 * Math.exp(-t * 25);
      ph += (TAU * f) / sr;
      d[i] = Math.sin(ph) * Math.exp(-t * 14) + noise() * Math.exp(-t * 80) * 0.6;
    }
  });

  // Ambiente: murmullo de hinchada en loop (6 s; las modulaciones cierran justo en el loop)
  add(
    'crowd',
    6,
    (d) => {
      addCrowd(d, sr, 0, 6, (t) => 0.75 + 0.15 * Math.sin((TAU * t) / 3) + 0.1 * Math.sin((TAU * t) / 2 + 1));
      const fade = Math.floor(0.01 * sr);
      for (let i = 0; i < fade; i++) {
        d[i] *= i / fade;
        d[d.length - 1 - i] *= i / fade;
      }
    },
    0.7
  );

  // Gol: red + grito de hinchada
  add('goal', 2.4, (d) => {
    let lp = 0;
    for (let i = 0; i < 0.35 * sr; i++) {
      const t = i / sr;
      const w = noise();
      lp += 0.3 * (w - lp);
      d[i] += (w - lp) * Math.exp(-t * 10) * 0.8;
    }
    const env = (t) => (t < 0.25 ? t / 0.25 : Math.exp(-(t - 0.25) * 0.9));
    addCrowd(d, sr, 0.05, 2.35, env, 2.2);
    for (let v = 0; v < 6; v++) {
      addTone(d, sr, { freq: 260 + Math.random() * 260, start: 0.1, dur: 2.2, amp: 0.05, vibrato: 0.03, decay: 2 });
    }
  });

  // "Uuuh" de la hinchada
  const uuuh = (d, start) => {
    addCrowd(d, sr, start, 1.25, (t) => Math.sin((Math.PI * t) / 1.25), 0.9);
    for (let v = 0; v < 5; v++) {
      addTone(d, sr, {
        freq: 180 + Math.random() * 90,
        start,
        dur: 1.2,
        amp: 0.09,
        vibrato: 0.02,
        decay: 1.2,
        glide: -0.25,
      });
    }
  };

  // Atajada: golpe en guantes + "uuuh"
  add('save', 1.45, (d) => {
    let lp = 0;
    for (let i = 0; i < 0.2 * sr; i++) {
      const t = i / sr;
      lp += 0.08 * (noise() - lp);
      d[i] += lp * Math.exp(-t * 25) * 6;
    }
    uuuh(d, 0.15);
  });

  // Afuera: solo "uuuh"
  add('miss', 1.3, (d) => uuuh(d, 0.02));

  // Palo: sonido metálico (parciales inarmónicos)
  add('post', 1.2, (d) => {
    [523, 1187, 1840, 2630, 3410].forEach((f, i) => {
      addTone(d, sr, { freq: f, start: 0, dur: 1.2, amp: 0.5 / (i + 1), decay: 4 + i * 2 });
    });
    for (let i = 0; i < 0.02 * sr; i++) d[i] += noise() * 0.5 * (1 - i / (0.02 * sr));
  });

  // Silbato del árbitro
  add('whistle', 0.7, (d) => {
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      const env = Math.min(1, t / 0.02) * Math.min(1, (0.7 - t) / 0.08);
      const trem = 0.6 + 0.4 * Math.sin(TAU * 42 * t);
      d[i] = (Math.sin(TAU * 2900 * t) + 0.4 * Math.sin(TAU * 3120 * t)) * env * trem;
    }
  }, 0.5);

  // Clic de UI
  add('click', 0.07, (d) => {
    for (let i = 0; i < d.length; i++) {
      const t = i / sr;
      d[i] = (Math.sin(TAU * 900 * t) >= 0 ? 1 : -1) * Math.exp(-t * 60);
    }
  }, 0.4);

  // Jingle de victoria
  add('victory', 1.9, (d) => {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => addTone(d, sr, { freq: f, start: i * 0.15, dur: 0.16, amp: 0.35, wave: 'square', decay: 1 }));
    [1046.5, 783.99, 659.25].forEach((f) =>
      addTone(d, sr, { freq: f, start: 0.45, dur: 1.4, amp: 0.25, wave: 'triangle', decay: 2.5 })
    );
  });

  // Jingle triste
  add('defeat', 2.0, (d) => {
    [392, 370, 349.2].forEach((f, i) =>
      addTone(d, sr, { freq: f, start: i * 0.35, dur: 0.34, amp: 0.4, wave: 'triangle', decay: 1.2 })
    );
    addTone(d, sr, { freq: 329.6, start: 1.05, dur: 0.95, amp: 0.45, wave: 'triangle', decay: 2, vibrato: 0.012 });
  });

  return true;
}
