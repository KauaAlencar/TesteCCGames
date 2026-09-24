// Fundo com parallax: céu, nuvens, montanhas e morros andando em velocidades diferentes.
// Desenhado em colunas de 4px para manter o visual de pixel art.

import { CONFIG } from './config.js';

const { WIDTH, HEIGHT } = CONFIG;
const COLUMN = 4;

// Relevo determinístico: soma de senos, igual em toda partida.
function ridge(x, a, b, c) {
  return Math.sin(x * a) * 0.5 + Math.sin(x * b + 1.7) * 0.3 + Math.sin(x * c + 4.1) * 0.2;
}

const LAYERS = [
  { factor: 0.15, base: 150, amp: 40, freq: [0.011, 0.023, 0.051], color: '#7d9cc0', top: '#93b0d0' },
  { factor: 0.35, base: 190, amp: 22, freq: [0.017, 0.041, 0.089], color: '#5f8a6a', top: '#76a07e' },
];

const CLOUDS = [
  { x: 40, y: 34, w: 48 },
  { x: 190, y: 58, w: 32 },
  { x: 320, y: 26, w: 56 },
  { x: 470, y: 50, w: 40 },
  { x: 610, y: 38, w: 44 },
];
const CLOUD_FACTOR = 0.08;
const CLOUD_SPAN = 720; // as nuvens se repetem a cada tanto de pixels

export function drawBackground(ctx, camX) {
  const { COLORS } = CONFIG;
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, COLORS.SKY);
  sky.addColorStop(1, COLORS.SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Nuvens
  ctx.fillStyle = '#e8f0f8';
  const cloudShift = Math.round(camX * CLOUD_FACTOR);
  for (const c of CLOUDS) {
    const x = ((((c.x - cloudShift) % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN) - 60;
    ctx.fillRect(x, c.y, c.w, 6);
    ctx.fillRect(x + 6, c.y - 4, c.w - 16, 4);
    ctx.fillRect(x + 12, c.y - 7, c.w / 3, 3);
  }

  // Montanhas e morros
  for (const layer of LAYERS) {
    const shift = Math.round(camX * layer.factor);
    const offset = shift % COLUMN;
    for (let sx = -offset; sx < WIDTH; sx += COLUMN) {
      const wx = sx + shift;
      const h = Math.round(layer.base - layer.amp * ridge(wx, ...layer.freq));
      ctx.fillStyle = layer.color;
      ctx.fillRect(sx, h, COLUMN, HEIGHT - h);
      ctx.fillStyle = layer.top;
      ctx.fillRect(sx, h, COLUMN, 2);
    }
  }
}
