// Inicialização, game loop com passo fixo, câmera e debug.

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Level } from './level.js';
import { Player } from './player.js';

const { WIDTH, HEIGHT, STEP } = CONFIG;

const canvas = document.getElementById('game');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Escala inteira: cada pixel do jogo vira um bloco NxN de pixels físicos da tela ---
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(
    1,
    Math.floor(Math.min((window.innerWidth * dpr) / WIDTH, (window.innerHeight * dpr) / HEIGHT)),
  );
  canvas.style.width = `${(WIDTH * scale) / dpr}px`;
  canvas.style.height = `${(HEIGHT * scale) / dpr}px`;
}
window.addEventListener('resize', resize);
resize();

// --- Câmera ---
class Camera {
  constructor(level) {
    this.level = level;
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
  }

  targetFor(player) {
    return {
      x: player.x + player.w / 2 + player.facing * CONFIG.CAMERA.LOOK_AHEAD - WIDTH / 2,
      y: player.y + player.h / 2 - HEIGHT / 2,
    };
  }

  clamp() {
    this.x = Math.min(Math.max(this.x, 0), Math.max(0, this.level.width - WIDTH));
    this.y = Math.min(Math.max(this.y, 0), Math.max(0, this.level.height - HEIGHT));
  }

  snapTo(player) {
    const t = this.targetFor(player);
    this.x = t.x;
    this.y = t.y;
    this.clamp();
    this.prevX = this.x;
    this.prevY = this.y;
  }

  update(dt, player) {
    this.prevX = this.x;
    this.prevY = this.y;
    const t = this.targetFor(player);
    // Suavização exponencial, independente do passo.
    const k = 1 - Math.exp(-CONFIG.CAMERA.SMOOTHING * dt);
    this.x += (t.x - this.x) * k;
    this.y += (t.y - this.y) * k;
    this.clamp();
  }
}

// --- Estado do jogo ---
const input = new Input();
const level = new Level();
const player = new Player(level);
const camera = new Camera(level);
camera.snapTo(player);

let debug = false;
let fps = 0;
let fpsFrames = 0;
let fpsTime = 0;

function update(dt) {
  input.update();
  if (input.pressed('debug')) debug = !debug;

  player.update(dt, input, level);
  camera.update(dt, player);
}

function render(alpha) {
  const { COLORS } = CONFIG;
  // Câmera arredondada para pixels inteiros: tudo fica alinhado à grade e nítido.
  const camX = Math.round(camera.prevX + (camera.x - camera.prevX) * alpha);
  const camY = Math.round(camera.prevY + (camera.y - camera.prevY) * alpha);

  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, COLORS.SKY);
  sky.addColorStop(1, COLORS.SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  level.draw(ctx, camX, camY, debug);
  player.draw(ctx, alpha, camX, camY);

  if (debug) drawDebug(alpha, camX, camY);
}

function drawDebug(alpha, camX, camY) {
  const { COLORS } = CONFIG;
  const px = Math.round(player.prevX + (player.x - player.prevX) * alpha) - camX;
  const py = Math.round(player.prevY + (player.y - player.prevY) * alpha) - camY;
  ctx.strokeStyle = COLORS.DEBUG_HITBOX;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, player.w - 1, player.h - 1);

  const lines = [
    `FPS ${fps}`,
    `pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
    `vel ${player.vx.toFixed(0)}, ${player.vy.toFixed(0)}`,
    `chão ${player.onGround ? 'sim' : 'não'}  agachado ${player.crouching ? 'sim' : 'não'}`,
  ];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(2, 2, 150, lines.length * 10 + 4);
  ctx.fillStyle = COLORS.DEBUG_TEXT;
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, 5, 5 + i * 10));
}

// --- Game loop: física em passo fixo, render a cada quadro do monitor ---
let last = performance.now();
let accumulator = 0;

function frame(now) {
  const frameTime = Math.min((now - last) / 1000, CONFIG.MAX_FRAME_TIME);
  last = now;
  accumulator += frameTime;

  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }

  fpsFrames++;
  fpsTime += frameTime;
  if (fpsTime >= 0.5) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }

  // alpha = quanto já andamos rumo ao próximo passo; usado para interpolar o desenho.
  render(accumulator / STEP);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
