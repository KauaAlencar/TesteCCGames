// HUD (vidas, pontos, arma) e mensagens centrais (início, game over, vitória).

import { CONFIG } from './config.js';

const { WIDTH, HEIGHT, COLORS } = CONFIG;

function text(ctx, str, x, y, align = 'left', color = COLORS.HUD_TEXT) {
  ctx.textAlign = align;
  ctx.fillStyle = COLORS.HUD_SHADOW;
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawHud(ctx, { player, score }) {
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';

  text(ctx, 'VIDAS', 6, 6);
  for (let i = 0; i < player.lives; i++) {
    ctx.fillStyle = COLORS.HUD_SHADOW;
    ctx.fillRect(38 + i * 8, 8, 6, 6);
    ctx.fillStyle = COLORS.HUD_LIFE;
    ctx.fillRect(37 + i * 8, 7, 6, 6);
  }

  text(ctx, `PONTOS ${String(score).padStart(6, '0')}`, WIDTH / 2, 6, 'center');

  const ammo = Number.isFinite(player.weapon.ammo) ? player.weapon.ammo : '∞';
  text(ctx, `${player.weapon.def.name.toUpperCase()}  ${ammo}`, WIDTH - 6, 6, 'right');
  text(ctx, `BOMBAS ${player.bombs}`, WIDTH - 6, 16, 'right');
  ctx.textAlign = 'left';
}

// Tela de título com os controles.
export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 32px monospace';
  text(ctx, 'RUN & GUN', WIDTH / 2, 60, 'center', '#ffd040');
  ctx.font = '8px monospace';
  text(ctx, 'uma homenagem a Metal Slug', WIDTH / 2, 84, 'center', '#c8c8c8');

  const controls = [
    ['← →  ou  A D', 'andar'],
    ['↓  ou  S', 'agachar  (no ar: mirar para baixo)'],
    ['↑  ou  W', 'mirar para cima'],
    ['Z  ou  ESPAÇO', 'pular'],
    ['X', 'atirar'],
    ['C', 'granada'],
    ['M', 'som liga/desliga'],
  ];
  controls.forEach(([key, action], i) => {
    const y = 112 + i * 13;
    text(ctx, key, WIDTH / 2 - 12, y, 'right', '#ffe030');
    text(ctx, action, WIDTH / 2 + 4, y, 'left');
  });

  if (Math.floor(time * 2) % 2 === 0) {
    ctx.font = 'bold 8px monospace';
    text(ctx, 'APERTE ENTER PARA COMEÇAR', WIDTH / 2, 216, 'center');
  }
  ctx.font = '8px monospace';
  text(ctx, 'solte prisioneiros para ganhar armas • a tela não espera!', WIDTH / 2, 244, 'center', '#a0c0e0');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

export function drawBanner(ctx, title, subtitle) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, HEIGHT / 2 - 26, WIDTH, 52);
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px monospace';
  text(ctx, title, WIDTH / 2, HEIGHT / 2 - 8, 'center');
  if (subtitle) {
    ctx.font = '8px monospace';
    text(ctx, subtitle, WIDTH / 2, HEIGHT / 2 + 12, 'center');
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}
