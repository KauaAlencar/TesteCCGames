// Projéteis: movimento, colisão com a fase e desenho.
//
// Campos opcionais de cada projétil (ver weapon.js e player.js):
//   kind      'bullet' | 'rocket' | 'flame' | 'grenade' | 'enemy' (só muda o desenho)
//   accel     aceleração ao longo da direção, até maxSpeed (foguete)
//   gravity   puxa para baixo (granada)
//   pierce    atravessa inimigos (chama)
//   explosive { radius, damage }: ao morrer, vira uma explosão em área

import { CONFIG } from './config.js';

export class Projectiles {
  constructor() {
    this.list = [];
    this.explosions = []; // explosões pendentes, resolvidas em game.js
  }

  // x, y = centro do projétil; owner = 'player' ou 'enemy'.
  spawn(opts) {
    if (this.list.length >= CONFIG.SHOOTING.MAX_PROJECTILES) this.list.shift();
    this.list.push({ kind: 'bullet', ...opts, prevX: opts.x, prevY: opts.y, alive: true });
  }

  // Caixa de colisão, alinhada ao eixo principal do movimento.
  static hitbox(b) {
    const horizontal = Math.abs(b.vx) >= Math.abs(b.vy);
    const w = horizontal ? b.length : b.thickness;
    const h = horizontal ? b.thickness : b.length;
    return { x: b.x - w / 2, y: b.y - h / 2, w, h };
  }

  // Encerra o projétil; se for explosivo, agenda a explosão.
  destroy(b, effects) {
    if (!b.alive) return;
    b.alive = false;
    if (b.explosive) {
      this.explosions.push({ x: b.x, y: b.y, owner: b.owner, ...b.explosive });
    } else if (b.kind !== 'flame') {
      effects.impact(b.x, b.y, b.vx, b.vy);
    }
  }

  takeExplosions() {
    const list = this.explosions;
    this.explosions = [];
    return list;
  }

  // view = retângulo visível da câmera, em coordenadas do mundo.
  update(dt, level, view, effects) {
    const margin = CONFIG.SHOOTING.OFFSCREEN_MARGIN;

    for (const b of this.list) {
      b.prevX = b.x;
      b.prevY = b.y;
      b.life -= dt;

      if (b.accel) {
        const speed = Math.hypot(b.vx, b.vy);
        const k = Math.min(speed + b.accel * dt, b.maxSpeed) / speed;
        b.vx *= k;
        b.vy *= k;
      }
      if (b.gravity) b.vy += b.gravity * dt;

      // Avança em sub-passos para nunca pular por cima de um bloco.
      const dist = Math.hypot(b.vx, b.vy) * dt;
      const steps = Math.max(1, Math.ceil(dist / CONFIG.PHYSICS.MAX_SUBSTEP));
      const sx = (b.vx * dt) / steps;
      const sy = (b.vy * dt) / steps;
      for (let i = 0; i < steps; i++) {
        b.x += sx;
        b.y += sy;
        if (level.isSolidAt(b.x, b.y)) {
          b.x -= sx; // explode/faísca do lado de fora do bloco
          b.y -= sy;
          this.destroy(b, effects);
          break;
        }
      }
      if (!b.alive) continue;

      const offscreen =
        b.x < view.x - margin ||
        b.x > view.x + view.w + margin ||
        b.y < view.y - margin * 4 || // granadas sobem um pouco acima da tela e voltam
        b.y > view.y + view.h + margin;
      if (offscreen) b.alive = false;
      else if (b.life <= 0) this.destroy(b, effects);
    }

    this.removeDead();
  }

  removeDead() {
    this.list = this.list.filter((b) => b.alive);
  }

  draw(ctx, alpha, camX, camY, debug) {
    const flicker = Math.floor(performance.now() / 50) % 2;
    for (const b of this.list) {
      const x = b.prevX + (b.x - b.prevX) * alpha;
      const y = b.prevY + (b.y - b.prevY) * alpha;
      const box = Projectiles.hitbox({ ...b, x, y });
      const bx = Math.round(box.x) - camX;
      const by = Math.round(box.y) - camY;
      const horizontal = box.w >= box.h;

      switch (b.kind) {
        case 'rocket': {
          // Corpo cinza, ponta vermelha e fogo saindo de trás.
          const dx = Math.sign(b.vx);
          const dy = Math.sign(b.vy);
          ctx.fillStyle = b.color;
          ctx.fillRect(bx, by, box.w, box.h);
          ctx.fillStyle = '#d83a2a';
          if (horizontal) ctx.fillRect(dx > 0 ? bx + box.w - 3 : bx, by, 3, box.h);
          else ctx.fillRect(bx, dy > 0 ? by + box.h - 3 : by, box.w, 3);
          ctx.fillStyle = flicker ? '#ffd040' : '#ff8a20';
          const f = 3 + flicker * 2;
          if (horizontal) ctx.fillRect(dx > 0 ? bx - f : bx + box.w, by + 1, f, box.h - 2);
          else ctx.fillRect(bx + 1, dy > 0 ? by - f : by + box.h, box.w - 2, f);
          break;
        }
        case 'flame': {
          // Labareda que tremula; o miolo amarelo encolhe perto do fim.
          ctx.fillStyle = flicker ? '#ff7a20' : '#ff5a10';
          ctx.fillRect(bx, by, box.w, box.h);
          ctx.fillStyle = '#ffd040';
          ctx.fillRect(bx + 2, by + 2, box.w - 4, box.h - 4);
          ctx.fillStyle = '#fff6c0';
          ctx.fillRect(bx + 4, by + 3, Math.max(1, box.w - 8), Math.max(1, box.h - 6));
          break;
        }
        case 'grenade':
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(bx, by, box.w, box.h);
          ctx.fillStyle = '#4a6a3a';
          ctx.fillRect(bx + 1, by + 1, box.w - 2, box.h - 2);
          ctx.fillStyle = '#8aaa6a';
          ctx.fillRect(bx + 1, by + 1, 1, 1);
          break;
        case 'enemy':
          ctx.fillStyle = b.color;
          ctx.fillRect(bx, by, box.w, box.h);
          ctx.fillStyle = '#ffd0d0';
          ctx.fillRect(bx + 1, by + 1, 1, 1);
          break;
        default:
          ctx.fillStyle = b.color;
          ctx.fillRect(bx, by, box.w, box.h);
          // Miolo claro para dar brilho.
          ctx.fillStyle = '#ffffff';
          if (horizontal) ctx.fillRect(bx + 1, by + 1, box.w - 2, 1);
          else ctx.fillRect(bx + 1, by + 1, 1, box.h - 2);
      }

      if (debug) {
        ctx.strokeStyle = CONFIG.COLORS.DEBUG_HITBOX;
        ctx.strokeRect(bx + 0.5, by + 0.5, box.w - 1, box.h - 1);
      }
    }
  }
}
