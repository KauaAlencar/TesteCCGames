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
  ctx.textAlign = 'left';
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
