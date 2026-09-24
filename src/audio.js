// Efeitos sonoros sintetizados com a Web Audio API (sem arquivos de áudio).
// O navegador só libera o som depois de uma interação, então unlockAudio()
// é chamado na primeira tecla apertada.

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;

export function unlockAudio() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    // 1s de ruído branco, reaproveitado por explosões e tiros.
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// Tom com queda/subida de frequência e volume decaindo.
function tone({ type = 'square', freq, to = freq, dur, vol = 0.5, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur);
}

// Ruído filtrado (explosões, rajadas, chamas).
function noise({ dur, vol = 0.5, filter = 'lowpass', freq = 1000, to = freq, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.setValueAtTime(freq, t);
  biquad.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(biquad).connect(gain).connect(master);
  src.start(t, Math.random() * Math.max(0, 1 - dur));
  src.stop(t + dur);
}

const SOUNDS = {
  pistol: () => tone({ freq: 880, to: 220, dur: 0.08, vol: 0.25 }),
  hmg: () => {
    noise({ dur: 0.06, vol: 0.35, filter: 'bandpass', freq: 2200 });
    tone({ freq: 300, to: 80, dur: 0.05, vol: 0.2 });
  },
  rocket: () => noise({ dur: 0.35, vol: 0.4, filter: 'bandpass', freq: 400, to: 1800 }),
  flame: () => noise({ dur: 0.25, vol: 0.35, filter: 'lowpass', freq: 3000, to: 600 }),
  throw: () => tone({ type: 'triangle', freq: 300, to: 700, dur: 0.12, vol: 0.3 }),
  jump: () => tone({ type: 'triangle', freq: 220, to: 440, dur: 0.1, vol: 0.2 }),
  enemyShot: () => tone({ freq: 440, to: 160, dur: 0.1, vol: 0.15 }),
  hit: () => tone({ type: 'square', freq: 180, to: 90, dur: 0.05, vol: 0.2 }),
  enemyDie: () => {
    noise({ dur: 0.3, vol: 0.4, freq: 1400, to: 200 });
    tone({ type: 'sawtooth', freq: 300, to: 60, dur: 0.25, vol: 0.2 });
  },
  explosion: () => {
    noise({ dur: 0.6, vol: 0.7, freq: 900, to: 60 });
    tone({ type: 'sine', freq: 90, to: 30, dur: 0.5, vol: 0.5 });
  },
  bigExplosion: () => {
    noise({ dur: 1, vol: 0.8, freq: 700, to: 40 });
    tone({ type: 'sine', freq: 70, to: 25, dur: 0.9, vol: 0.6 });
  },
  playerDie: () => {
    tone({ type: 'square', freq: 520, to: 60, dur: 0.6, vol: 0.3 });
    noise({ dur: 0.4, vol: 0.4, freq: 1200, to: 100 });
  },
  rescue: () => [523, 659, 784].forEach((f, i) =>
    tone({ type: 'triangle', freq: f, dur: 0.12, vol: 0.3, delay: i * 0.08 })),
  pickup: () => [659, 784, 988, 1319].forEach((f, i) =>
    tone({ type: 'square', freq: f, dur: 0.1, vol: 0.18, delay: i * 0.06 })),
  gameover: () => [392, 330, 262, 196].forEach((f, i) =>
    tone({ type: 'triangle', freq: f, dur: 0.35, vol: 0.35, delay: i * 0.3 })),
  victory: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
    tone({ type: 'square', freq: f, dur: 0.18, vol: 0.2, delay: i * 0.13 })),
};

export function playSound(name) {
  if (!ctx || muted || ctx.state !== 'running') return;
  SOUNDS[name]?.();
}
