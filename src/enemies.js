// Inimigos: soldado, corredor e torreta, mais o gerenciador que os cria a partir
// dos marcadores da fase e resolve as colisões com balas e com o jogador.

import { CONFIG } from './config.js';
import { Projectiles } from './projectiles.js';
import { overlaps } from './utils.js';

const E = CONFIG.ENEMIES;
const { COLORS } = CONFIG;

function onScreen(body, camera) {
  return body.x + body.w > camera.x && body.x < camera.x + CONFIG.WIDTH;
}

function spawnEnemyBullet(projectiles, x, y, dirX, dirY, speed = E.BULLET.speed) {
  const len = Math.hypot(dirX, dirY) || 1;
  projectiles.spawn({
    owner: 'enemy',
    x,
    y,
    vx: (dirX / len) * speed,
    vy: (dirY / len) * speed,
    damage: 1,
    life: E.BULLET.life,
    length: E.BULLET.size,
    thickness: E.BULLET.size,
    color: E.BULLET.color,
  });
}

class Enemy {
  constructor(def, col, row, tile) {
    this.def = def;
    this.w = def.width;
    this.h = def.height;
    // Pés apoiados no fundo do tile do marcador, centralizado nele.
    this.x = col * tile + (tile - this.w) / 2;
    this.y = (row + 1) * tile - this.h;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1; // chegam pela direita, então começam olhando para o jogador
    this.onGround = false;
    this.hp = def.hp;
    this.alive = true;
    this.hitFlash = 0;
    this.contactDamage = false;
  }

  get cx() {
    return this.x + this.w / 2;
  }

  get cy() {
    return this.y + this.h / 2;
  }

  hit(damage) {
    this.hp -= damage;
    this.hitFlash = E.HIT_FLASH_TIME;
    if (this.hp <= 0) this.alive = false;
  }

  // Gravidade + colisão. Retorna true se bateu numa parede.
  applyPhysics(dt, level) {
    this.vy = Math.min(this.vy + E.GRAVITY * dt, E.MAX_FALL_SPEED);
    const hitWall = level.moveX(this, this.vx * dt);
    this.onGround = false;
    if (level.moveY(this, this.vy * dt)) {
      if (this.vy > 0) this.onGround = true;
      this.vy = 0;
    }
    return hitWall;
  }

  // Há chão logo à frente dos pés?
  groundAhead(level) {
    const T = level.tile;
    const aheadX = this.facing > 0 ? this.x + this.w + 1 : this.x - 1;
    return level.isSolid(Math.floor(aheadX / T), Math.floor((this.y + this.h + 1) / T));
  }

  update(dt, world) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.think(dt, world);
  }

  screenPos(alpha, camX, camY) {
    return {
      x: Math.round(this.prevX + (this.x - this.prevX) * alpha) - camX,
      y: Math.round(this.prevY + (this.y - this.prevY) * alpha) - camY,
    };
  }
}

// Patrulha até ver o jogador; então para, avisa e atira na horizontal.
// O tiro sai baixo o bastante para passar por cima de quem estiver agachado.
class Soldier extends Enemy {
  constructor(col, row, tile) {
    super(E.SOLDIER, col, row, tile);
    this.fireTimer = this.nextFireDelay();
  }

  nextFireDelay() {
    return this.def.fireInterval + Math.random() * this.def.fireJitter;
  }

  sees(player, camera) {
    if (player.dead || !onScreen(this, camera)) return false;
    const dx = player.x + player.w / 2 - this.cx;
    const dy = player.y + player.h - (this.y + this.h); // compara a altura dos pés
    return Math.abs(dx) < this.def.sight && Math.abs(dy) < this.def.sightHeight;
  }

  think(dt, { level, player, camera, projectiles }) {
    if (this.sees(player, camera)) {
      this.facing = player.x + player.w / 2 < this.cx ? -1 : 1;
      this.vx = 0;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        const mx = this.facing > 0 ? this.x + this.w + 4 : this.x - 4;
        spawnEnemyBullet(projectiles, mx, this.y + this.def.muzzleY, this.facing, 0);
        this.fireTimer = this.nextFireDelay();
      }
    } else {
      this.fireTimer = Math.max(this.fireTimer, this.def.windup + 0.2);
      this.vx = this.facing * this.def.speed;
    }

    const hitWall = this.applyPhysics(dt, level);
    if (this.onGround && this.vx !== 0 && (hitWall || !this.groundAhead(level))) {
      this.facing = -this.facing;
    }
  }

  get warning() {
    return this.vx === 0 && this.fireTimer < this.def.windup;
  }

  draw(ctx, alpha, camX, camY) {
    const { x, y } = this.screenPos(alpha, camX, camY);
    const { w, h } = this;
    const flash = this.hitFlash > 0;
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.SOLDIER;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.SOLDIER_DARK;
    ctx.fillRect(x, y, w, 4); // capacete
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.fillStyle = COLORS.ENEMY_SKIN;
    ctx.fillRect(this.facing > 0 ? x + w - 6 : x + 1, y + 4, 5, 4);
    ctx.fillStyle = COLORS.GUN;
    ctx.fillRect(this.facing > 0 ? x + w - 2 : x - 5, y + this.def.muzzleY - 1, 7, 3);
    if (this.warning && Math.floor(performance.now() / 60) % 2) {
      ctx.fillStyle = COLORS.WARNING;
      ctx.fillRect(this.facing > 0 ? x + w + 4 : x - 7, y + this.def.muzzleY - 2, 3, 3);
    }
  }
}

// Corre na direção do jogador e pula obstáculos. Encostar nele mata.
class Runner extends Enemy {
  constructor(col, row, tile) {
    super(E.RUNNER, col, row, tile);
    this.contactDamage = true;
    this.awake = false;
  }

  think(dt, { level, player, camera }) {
    if (!this.awake && onScreen(this, camera)) this.awake = true;
    if (this.awake) {
      const dx = player.x + player.w / 2 - this.cx;
      if (!player.dead && Math.abs(dx) > 4) this.facing = Math.sign(dx);
      this.vx = this.facing * this.def.speed;
    }
    const hitWall = this.applyPhysics(dt, level);
    if (hitWall && this.onGround) this.vy = -this.def.jumpSpeed;
  }

  draw(ctx, alpha, camX, camY) {
    const { x, y } = this.screenPos(alpha, camX, camY);
    const { w, h } = this;
    const flash = this.hitFlash > 0;
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.RUNNER;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.RUNNER_DARK;
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.fillStyle = COLORS.ENEMY_SKIN;
    ctx.fillRect(this.facing > 0 ? x + w - 6 : x + 1, y + 2, 5, 5);
    // Faca
    ctx.fillStyle = COLORS.HIT_FLASH;
    ctx.fillRect(this.facing > 0 ? x + w : x - 5, y + 11, 5, 2);
  }
}

// Fixa no chão; dispara rajadas mirando no jogador enquanto está na tela.
class Turret extends Enemy {
  constructor(col, row, tile) {
    super(E.TURRET, col, row, tile);
    this.timer = this.def.interval * 0.6;
    this.shotsLeft = 0;
    this.aimX = -1;
    this.aimY = 0;
  }

  think(dt, { player, camera, projectiles }) {
    const tx = player.x + player.w / 2 - this.cx;
    const ty = player.y + player.h / 2 - (this.y + 4);
    const len = Math.hypot(tx, ty) || 1;
    this.aimX = tx / len;
    this.aimY = ty / len;

    if (player.dead || !onScreen(this, camera)) return;
    this.timer -= dt;
    if (this.timer > 0) return;

    if (this.shotsLeft === 0) this.shotsLeft = this.def.burst;
    const bx = this.cx + this.aimX * 16;
    const by = this.y + 4 + this.aimY * 16;
    spawnEnemyBullet(projectiles, bx, by, this.aimX, this.aimY, this.def.bulletSpeed);
    this.shotsLeft--;
    this.timer = this.shotsLeft > 0 ? this.def.burstGap : this.def.interval;
  }

  get warning() {
    return this.shotsLeft === 0 && this.timer < 0.4;
  }

  draw(ctx, alpha, camX, camY) {
    const { x, y } = this.screenPos(alpha, camX, camY);
    const flash = this.hitFlash > 0;
    // Cano: quadradinhos ao longo da direção da mira (fica em pixel art, sem rotação).
    ctx.fillStyle = COLORS.GUN;
    const ox = x + this.w / 2;
    const oy = y + 4;
    for (let i = 4; i <= 14; i += 2) {
      ctx.fillRect(Math.round(ox + this.aimX * i) - 1, Math.round(oy + this.aimY * i) - 1, 3, 3);
    }
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.TURRET;
    ctx.fillRect(x + 2, y, this.w - 4, 8);
    ctx.fillStyle = flash ? COLORS.HIT_FLASH : COLORS.TURRET_DARK;
    ctx.fillRect(x, y + 8, this.w, this.h - 8);
    ctx.fillStyle = this.warning && Math.floor(performance.now() / 60) % 2 ? COLORS.WARNING : '#222';
    ctx.fillRect(x + 6, y + 3, 4, 3);
  }
}

const ENEMY_TYPES = { S: Soldier, R: Runner, T: Turret };

export class Enemies {
  constructor(level) {
    // Na fila até a câmera se aproximar; assim ninguém age fora da tela.
    this.pending = level.entities.filter((e) => ENEMY_TYPES[e.type]);
    this.active = [];
    this.tile = level.tile;
  }

  update(dt, world) {
    const { camera, level } = world;
    const wakeX = camera.x + CONFIG.WIDTH + E.ACTIVATION_MARGIN;
    while (this.pending.length && this.pending[0].col * this.tile < wakeX) {
      const e = this.pending.shift();
      this.active.push(new ENEMY_TYPES[e.type](e.col, e.row, this.tile));
    }

    for (const enemy of this.active) enemy.update(dt, world);

    // Caiu num buraco ou ficou para trás da tela (que nunca volta).
    this.active = this.active.filter(
      (e) => e.y < level.height && e.x + e.w > camera.x - E.ACTIVATION_MARGIN,
    );
  }

  // Balas do jogador x inimigos, balas inimigas x jogador, contato x jogador.
  // Retorna os pontos ganhos neste passo.
  handleCollisions({ player, projectiles, effects }) {
    let score = 0;

    for (const b of projectiles.list) {
      if (!b.alive) continue;
      const box = Projectiles.hitbox(b);

      if (b.owner === 'player') {
        for (const enemy of this.active) {
          if (!enemy.alive || !overlaps(box, enemy)) continue;
          b.alive = false;
          enemy.hit(b.damage);
          effects.impact(b.x, b.y, b.vx, b.vy);
          if (!enemy.alive) {
            score += enemy.def.score;
            effects.explosion(enemy.cx, enemy.cy, enemy instanceof Turret ? 1.5 : 1);
          }
          break;
        }
      } else if (player.vulnerable && overlaps(box, player.hurtbox())) {
        b.alive = false;
        player.kill();
        effects.explosion(b.x, b.y, 0.5);
      }
    }

    if (player.vulnerable) {
      for (const enemy of this.active) {
        if (enemy.alive && enemy.contactDamage && overlaps(enemy, player.hurtbox())) {
          player.kill();
          break;
        }
      }
    }

    this.active = this.active.filter((e) => e.alive);
    projectiles.removeDead();
    return score;
  }

  draw(ctx, alpha, camX, camY, debug) {
    for (const enemy of this.active) {
      enemy.draw(ctx, alpha, camX, camY);
      if (debug) {
        const { x, y } = enemy.screenPos(alpha, camX, camY);
        ctx.strokeStyle = COLORS.DEBUG_HITBOX;
        ctx.strokeRect(x + 0.5, y + 0.5, enemy.w - 1, enemy.h - 1);
      }
    }
  }
}
