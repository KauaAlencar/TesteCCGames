// Câmera com rolagem automática: anda sozinha para a direita, acompanha o jogador
// quando ele avança mais rápido e nunca volta para trás.

import { CONFIG } from './config.js';

const { WIDTH, HEIGHT } = CONFIG;

export class Camera {
  constructor(level) {
    this.level = level;
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.scrollDelay = CONFIG.AUTO_SCROLL.START_DELAY;
  }

  targetX(player) {
    return player.x + player.w / 2 - WIDTH * CONFIG.CAMERA.ANCHOR;
  }

  get maxX() {
    return Math.max(0, this.level.width - WIDTH);
  }

  get atEnd() {
    return this.x >= this.maxX;
  }

  snapTo(player) {
    this.x = Math.min(Math.max(this.targetX(player), 0), this.maxX);
    this.y = Math.max(0, this.level.height - HEIGHT);
    this.prevX = this.x;
    this.prevY = this.y;
  }

  update(dt, player) {
    this.prevX = this.x;
    this.prevY = this.y;

    let x = this.x;
    // Acompanha o jogador só para frente, com suavização.
    const target = this.targetX(player);
    if (!player.dead && target > x) {
      x += (target - x) * (1 - Math.exp(-CONFIG.CAMERA.SMOOTHING * dt));
    }
    // Rolagem automática: a tela avança pelo menos nesta velocidade.
    const { ENABLED, SPEED } = CONFIG.AUTO_SCROLL;
    this.scrollDelay = Math.max(0, this.scrollDelay - dt);
    if (ENABLED && this.scrollDelay === 0) x = Math.max(x, this.x + SPEED * dt);

    this.x = Math.min(Math.max(x, this.x), this.maxX);
    // A fase tem só uma tela de altura: a câmera fica encostada no chão.
    this.y = Math.max(0, this.level.height - HEIGHT);
  }
}
