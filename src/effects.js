// Efeitos visuais passageiros (faíscas e explosões). Não afetam a jogabilidade.

import { CONFIG } from './config.js';

const SPARK_GRAVITY = 300;

export class Effects {
  constructor() {
    this.sparks = [];
    this.flashes = [];
  }

  // Faíscas que voltam na direção contrária à da bala.
  impact(x, y, vx, vy) {
    this.flashes.push({ x, y, life: 0.06, size: 5 });
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
        size: 1,
        color: CONFIG.COLORS.SPARK,
      });
    }
  }

  // Explosão em todas as direções, com pedaços maiores e cores de fogo.
  explosion(x, y, strength = 1) {
    const palette = CONFIG.COLORS.EXPLOSION;
    this.flashes.push({ x, y, life: 0.1, size: Math.round(10 * strength) });
    const count = Math.round(18 * strength);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (40 + Math.random() * 140) * strength;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 60,
        life: 0.25 + Math.random() * 0.35,
        size: Math.random() < 0.4 ? 2 : 1,
        color: palette[Math.floor(Math.random() * palette.length)],
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
      const half = Math.floor(f.size / 2);
      ctx.fillRect(Math.round(f.x) - half - camX, Math.round(f.y) - half - camY, f.size, f.size);
    }
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x) - camX, Math.round(s.y) - camY, s.size, s.size);
    }
  }
}
