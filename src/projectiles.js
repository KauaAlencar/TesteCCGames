// Projéteis: movimento, colisão com a fase e desenho.

import { CONFIG } from './config.js';

export class Projectiles {
  constructor() {
    this.list = [];
  }

  // x, y = centro da bala.
  spawn(opts) {
    if (this.list.length >= CONFIG.SHOOTING.MAX_PROJECTILES) this.list.shift();
    this.list.push({ ...opts, prevX: opts.x, prevY: opts.y, alive: true });
  }

  // Caixa de colisão da bala, alinhada ao eixo principal do movimento.
  // Fica pronta para testar acerto em inimigos.
  static hitbox(b) {
    const horizontal = Math.abs(b.vx) >= Math.abs(b.vy);
    const w = horizontal ? b.length : b.thickness;
    const h = horizontal ? b.thickness : b.length;
    return { x: b.x - w / 2, y: b.y - h / 2, w, h };
  }

  // view = retângulo visível da câmera, em coordenadas do mundo.
  update(dt, level, view, effects) {
    const margin = CONFIG.SHOOTING.OFFSCREEN_MARGIN;

    for (const b of this.list) {
      b.prevX = b.x;
      b.prevY = b.y;
      b.life -= dt;

      // Avança em sub-passos para nunca pular por cima de um bloco.
      const dist = Math.hypot(b.vx, b.vy) * dt;
      const steps = Math.max(1, Math.ceil(dist / CONFIG.PHYSICS.MAX_SUBSTEP));
      const sx = (b.vx * dt) / steps;
      const sy = (b.vy * dt) / steps;
      for (let i = 0; i < steps; i++) {
        b.x += sx;
        b.y += sy;
        if (level.isSolidAt(b.x, b.y)) {
          b.alive = false;
          effects.impact(b.x - sx, b.y - sy, b.vx, b.vy);
          break;
        }
      }

      const offscreen =
        b.x < view.x - margin ||
        b.x > view.x + view.w + margin ||
        b.y < view.y - margin ||
        b.y > view.y + view.h + margin;
      if (b.life <= 0 || offscreen) b.alive = false;
    }

    this.list = this.list.filter((b) => b.alive);
  }

  draw(ctx, alpha, camX, camY, debug) {
    for (const b of this.list) {
      const x = b.prevX + (b.x - b.prevX) * alpha;
      const y = b.prevY + (b.y - b.prevY) * alpha;
      const box = Projectiles.hitbox({ ...b, x, y });
      const bx = Math.round(box.x) - camX;
      const by = Math.round(box.y) - camY;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, box.w, box.h);
      // Miolo claro para dar brilho.
      ctx.fillStyle = '#ffffff';
      if (box.w > box.h) ctx.fillRect(bx + 1, by + 1, box.w - 2, 1);
      else ctx.fillRect(bx + 1, by + 1, 1, box.h - 2);

      if (debug) {
        ctx.strokeStyle = CONFIG.COLORS.DEBUG_HITBOX;
        ctx.strokeRect(bx + 0.5, by + 0.5, box.w - 1, box.h - 1);
      }
    }
  }
}
