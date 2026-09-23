// Jogador: movimento, física e desenho.

import { CONFIG } from './config.js';

const P = CONFIG.PLAYER;

function approach(value, target, amount) {
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}

export class Player {
  constructor(level) {
    this.w = P.WIDTH;
    this.h = P.HEIGHT;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = direita, -1 = esquerda
    this.onGround = false;
    this.crouching = false;
    this.isJumping = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.respawn(level);
  }

  respawn(level) {
    const T = level.tile;
    this.crouching = false;
    this.h = P.HEIGHT;
    this.x = level.spawn.col * T + (T - this.w) / 2;
    this.y = (level.spawn.row + 1) * T - this.h;
    this.vx = 0;
    this.vy = 0;
    // Sem posição anterior diferente, a interpolação não "arrasta" o sprite.
    this.prevX = this.x;
    this.prevY = this.y;
  }

  // Muda a altura mantendo os pés no lugar. Levantar só acontece se houver espaço.
  setCrouch(crouch, level) {
    const newH = crouch ? P.CROUCH_HEIGHT : P.HEIGHT;
    const newY = this.y + this.h - newH;
    if (!crouch && level.rectOverlapsSolid(this.x, newY, this.w, newH)) return;
    this.crouching = crouch;
    this.y = newY;
    this.h = newH;
    this.prevY = this.y;
  }

  update(dt, input, level) {
    this.prevX = this.x;
    this.prevY = this.y;

    // --- Agachar (só no chão) ---
    const wantsCrouch = input.held('down') && this.onGround;
    if (wantsCrouch !== this.crouching) this.setCrouch(wantsCrouch, level);

    // --- Movimento horizontal com aceleração/desaceleração ---
    const dir = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
    if (dir !== 0) this.facing = dir;

    const maxSpeed = this.crouching ? P.CRAWL_SPEED : P.MAX_SPEED;
    let rate;
    if (dir === 0) {
      rate = this.onGround ? P.DECEL : P.AIR_DECEL;
    } else {
      rate = this.onGround ? P.ACCEL : P.AIR_ACCEL;
      // Virar para o lado oposto freia pelo menos tão rápido quanto parar.
      if (this.vx !== 0 && Math.sign(this.vx) !== dir) {
        rate = Math.max(rate, this.onGround ? P.DECEL : P.AIR_DECEL);
      }
    }
    this.vx = approach(this.vx, dir * maxSpeed, rate * dt);

    // --- Pulo: coyote time + buffer ---
    this.coyoteTimer = this.onGround ? P.COYOTE_TIME : Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = input.pressed('jump')
      ? P.JUMP_BUFFER
      : Math.max(0, this.jumpBufferTimer - dt);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = -P.JUMP_SPEED;
      this.isJumping = true;
      this.onGround = false;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    // Altura variável: soltar o botão cedo corta a subida.
    if (this.isJumping && !input.held('jump') && this.vy < -P.JUMP_CUT_SPEED) {
      this.vy = -P.JUMP_CUT_SPEED;
    }
    if (this.vy >= 0) this.isJumping = false;

    // --- Gravidade ---
    this.vy = Math.min(this.vy + P.GRAVITY * dt, P.MAX_FALL_SPEED);

    // --- Colisão: eixo X, depois eixo Y ---
    if (level.moveX(this, this.vx * dt)) this.vx = 0;

    this.onGround = false;
    if (level.moveY(this, this.vy * dt)) {
      if (this.vy > 0) this.onGround = true;
      this.vy = 0; // pousou ou bateu a cabeça
      this.isJumping = false;
    }

    // Caiu no buraco.
    if (this.y > level.height + 64) this.respawn(level);
  }

  draw(ctx, alpha, camX, camY) {
    const { COLORS } = CONFIG;
    const x = Math.round(this.prevX + (this.x - this.prevX) * alpha) - camX;
    const y = Math.round(this.prevY + (this.y - this.prevY) * alpha) - camY;
    const { w, h } = this;

    // Corpo
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(x, y, w, h);
    // Pernas / calça
    ctx.fillStyle = COLORS.PLAYER_DARK;
    ctx.fillRect(x, y + h - 5, w, 5);
    // Rosto, do lado para onde está virado
    ctx.fillStyle = COLORS.PLAYER_SKIN;
    const faceX = this.facing > 0 ? x + w - 6 : x + 1;
    ctx.fillRect(faceX, y + 2, 5, 5);
    // Arma apontando para frente
    ctx.fillStyle = COLORS.GUN;
    const gunY = y + Math.floor(h / 2);
    const gunX = this.facing > 0 ? x + w - 2 : x - 6;
    ctx.fillRect(gunX, gunY, 8, 3);
  }
}
