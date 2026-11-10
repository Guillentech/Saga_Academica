// 🔊 SFX de combate sintetizados con Web Audio (sin archivos externos).
// El contexto se crea de forma perezosa en el primer gesto del usuario.

const STORAGE_KEY = 'lms_sfx_mute';
let audioCtx = null;

export const isSfxMuted = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveSfxMuted = (muted) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Modo privado: el sonido sigue funcionando sin persistir la preferencia.
  }
};

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const note = (freq, duration, { type = 'square', volume = 0.06, delay = 0, slideTo = null } = {}) => {
  if (isSfxMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
};

const sequence = (notas) => {
  for (const [freq, duration, opciones] of notas) {
    note(freq, duration, opciones);
  }
};

export const sfx = {
  select: () => note(520, 0.05, { type: 'square', volume: 0.035 }),

  hit: () => {
    note(240, 0.1, { type: 'square', volume: 0.07, slideTo: 120 });
    note(360, 0.07, { type: 'triangle', volume: 0.04, delay: 0.02 });
  },

  crit: () => {
    note(320, 0.08, { type: 'square', volume: 0.07, slideTo: 180 });
    note(480, 0.08, { type: 'square', volume: 0.06, delay: 0.06 });
    note(720, 0.12, { type: 'triangle', volume: 0.05, delay: 0.12 });
  },

  miss: () => {
    note(180, 0.18, { type: 'sawtooth', volume: 0.06, slideTo: 90 });
    note(110, 0.14, { type: 'square', volume: 0.04, delay: 0.08 });
  },

  combo: () => sequence([
    [660, 0.05, { type: 'square', volume: 0.04 }],
    [880, 0.07, { type: 'square', volume: 0.04, delay: 0.05 }]
  ]),

  final: () => {
    note(220, 0.4, { type: 'sawtooth', volume: 0.05, slideTo: 880 });
    note(440, 0.5, { type: 'square', volume: 0.04, delay: 0.15, slideTo: 1200 });
    note(660, 0.6, { type: 'triangle', volume: 0.05, delay: 0.3 });
  },

  victory: () => sequence([
    [523, 0.12, { type: 'square', volume: 0.06 }],
    [659, 0.12, { type: 'square', volume: 0.06, delay: 0.12 }],
    [784, 0.2, { type: 'square', volume: 0.06, delay: 0.24 }],
    [1046, 0.3, { type: 'triangle', volume: 0.05, delay: 0.4 }]
  ]),

  defeat: () => sequence([
    [392, 0.18, { type: 'sawtooth', volume: 0.05 }],
    [330, 0.18, { type: 'sawtooth', volume: 0.05, delay: 0.18 }],
    [262, 0.3, { type: 'sawtooth', volume: 0.05, delay: 0.36 }]
  ])
};
