// Prisioneiros (POWs) e itens.
// O prisioneiro fica amarrado até levar um tiro, uma explosão ou ser tocado; então
// bate continência, solta um item e foge pela esquerda. O item cai e é pego ao encostar.

import { CONFIG } from './config.js';
import { drawSprite, getItemSprite } from './sprites.js';
import { overlaps } from './utils.js';

const K = CONFIG.PICKUPS;

class Prisoner {
  constructor(col, row, tile) {
    this.isPrisoner = true;
    this.w = 12;
    this.h = 16;
    this.x = col * tile + (tile - this.w) / 2;
    this.y = (row + 1) * tile - this.h;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.state = 'tied'; // 'tied' | 'saluting' | 'escaping'
    this.timer = 0;
    this.animTime = Math.random();
  }

  get tied() {
    return this.state === 'tied';
  }

  update(dt, level) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    if (this.tied) return;

    this.timer += dt;
    if (this.state === 'saluting' && this.timer >= K.SALUTE_TIME) {
      this.state = 'escaping';
      this.vx = -K.ESCAPE_SPEED;
    }
    this.vy = Math.min(this.vy + K.GRAVITY * dt, 400);
    if (level.moveX(this, this.vx * dt) && this.state === 'escaping') this.vy = -200; // pula obstáculos
    if (level.moveY(this, this.vy * dt)) this.vy = 0;
  }

  draw(ctx, alpha, camX, camY) {
    const x = Math.round(this.prevX + (this.x - this.prevX) * alpha) - camX;
    const y = Math.round(this.prevY + (this.y - this.prevY) * alpha) - camY;
    const cx = x + this.w / 2;
    const bottom = y + this.h;
    if (this.state === 'tied') drawSprite(ctx, 'pow', 'tied', this.animTime, cx, bottom, 1, 3);
    else if (this.state === 'saluting') drawSprite(ctx, 'pow', 'salute', 0, cx, bottom, 1);
    else drawSprite(ctx, 'pow', 'run', this.animTime, cx, bottom, -1, 14);
  }
}

class Item {
  constructor(type, x, y) {
    this.type = type;
    this.info = K.ITEMS[type];
    this.w = 12;
    this.h = 12;
    this.x = x - this.w / 2;
    this.y = y - this.h;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vy = -160; // pula para fora do prisioneiro
    this.age = 0;
  }

  update(dt, level) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.age += dt;
    this.vy = Math.min(this.vy + K.GRAVITY * dt, 400);
    if (level.moveY(this, this.vy * dt)) this.vy = 0;
  }

  draw(ctx, alpha, camX, camY) {
    const x = Math.round(this.prevX + (this.x - this.prevX) * alpha) - camX;
    const y = Math.round(this.prevY + (this.y - this.prevY) * alpha) - camY;
    const bob = this.vy === 0 && Math.floor(this.age * 4) % 2 ? -1 : 0;
    ctx.drawImage(getItemSprite(this.info.letter, this.info.color), x, y + bob);
  }
}

export class Pickups {
  constructor(level) {
    this.pending = level.entities.filter((e) => e.type === 'W');
    this.prisoners = [];
    this.items = [];
    this.tile = level.tile;
    this.nextItem = 0;
  }

  get tiedPrisoners() {
    return this.prisoners.filter((p) => p.tied);
  }

  update(dt, world) {
    const { camera, level } = world;
    const wakeX = camera.x + CONFIG.WIDTH + CONFIG.ENEMIES.ACTIVATION_MARGIN;
    while (this.pending.length && this.pending[0].col * this.tile < wakeX) {
      const e = this.pending.shift();
      this.prisoners.push(new Prisoner(e.col, e.row, this.tile));
    }
    for (const p of this.prisoners) p.update(dt, level);
    for (const it of this.items) it.update(dt, level);

    // Quem ficou para trás da tela (que nunca volta) some.
    const left = camera.x - 32;
    this.prisoners = this.prisoners.filter((p) => p.x + p.w > left && p.y < level.height);
    this.items = this.items.filter((it) => it.x + it.w > left && it.y < level.height);
  }

  free(prisoner, world) {
    if (!prisoner.tied) return;
    prisoner.state = 'saluting';
    prisoner.timer = 0;
    const type = K.ITEM_SEQUENCE[this.nextItem++ % K.ITEM_SEQUENCE.length];
    this.items.push(new Item(type, prisoner.x + prisoner.w / 2, prisoner.y + prisoner.h));
    world.score += K.RESCUE_SCORE;
    world.effects.text(prisoner.x + prisoner.w / 2, prisoner.y - 6, 'OBRIGADO!');
    world.sounds.push('rescue');
  }

  // Encostar solta prisioneiros e pega itens.
  touch(player, world) {
    if (player.dead) return;
    for (const p of this.prisoners) {
      if (p.tied && overlaps(p, player)) this.free(p, world);
    }
    for (const it of this.items) {
      if (it.taken || it.age < 0.1 || !overlaps(it, player)) continue;
      it.taken = true;
      if (it.type === 'BOMBS') player.bombs += K.BOMB_REFILL;
      else player.weapon.give(it.type);
      world.effects.text(player.x + player.w / 2, player.y - 8, it.info.label, '#ffe030');
      world.sounds.push('pickup');
    }
    this.items = this.items.filter((it) => !it.taken);
  }

  draw(ctx, alpha, camX, camY) {
    for (const p of this.prisoners) p.draw(ctx, alpha, camX, camY);
    for (const it of this.items) it.draw(ctx, alpha, camX, camY);
  }
}
