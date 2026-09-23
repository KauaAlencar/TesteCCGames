// Efeitos visuais passageiros (faíscas de impacto). Não afetam a jogabilidade.

import { CONFIG } from './config.js';

const SPARK_GRAVITY = 300;

export class Effects {
  constructor() {
    this.sparks = [];
    this.flashes = [];
  }

  // Faíscas que voltam na direção contrária à da bala.
  impact(x, y, vx, vy) {
    this.flashes.push({ x, y, life: 0.06 });
    const back = Math.atan2(-vy, -vx);
    for (let i = 0; i < 5; i++) {
      const a = back + (Math.random() * 2 - 1) * 1.2;
      const speed = 40 + Math.random() * 80;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.12 + Math.random() * 0.13,
      });
    }
  }

  update(dt) {
    for (const s of this.sparks) {
      s.vy += SPARK_GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    for (const f of this.flashes) f.life -= dt;
    this.sparks = this.sparks.filter((s) => s.life > 0);
    this.flashes = this.flashes.filter((f) => f.life > 0);
  }

  draw(ctx, camX, camY) {
    const { COLORS } = CONFIG;
    ctx.fillStyle = COLORS.MUZZLE_FLASH;
    for (const f of this.flashes) {
      ctx.fillRect(Math.round(f.x) - 2 - camX, Math.round(f.y) - 2 - camY, 5, 5);
    }
    ctx.fillStyle = COLORS.SPARK;
    for (const s of this.sparks) {
      ctx.fillRect(Math.round(s.x) - camX, Math.round(s.y) - camY, 1, 1);
    }
  }
}
