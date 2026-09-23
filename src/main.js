// Inicialização, game loop com passo fixo, desenho e debug.

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { createWorld, stepWorld } from './game.js';
import { drawHud, drawBanner } from './hud.js';

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

const input = new Input();
let world = createWorld();
const weaponIds = Object.keys(CONFIG.WEAPONS);

let debug = false;
let fps = 0;
let fpsFrames = 0;
let fpsTime = 0;

function update(dt) {
  input.update();
  if (input.pressed('debug')) debug = !debug;

  const { player } = world;
  // Só para testes, com o debug ligado: F2 troca a arma, F3 liga/desliga invencibilidade.
  if (debug && input.pressed('debugWeapon')) {
    const next = weaponIds[(weaponIds.indexOf(player.weapon.id) + 1) % weaponIds.length];
    player.weapon.setType(next);
  }
  if (debug && input.pressed('debugGod')) player.godMode = !player.godMode;

  if (world.state !== 'playing' && world.stateTime > 0.8) {
    if (input.pressed('start') || input.pressed('jump')) world = createWorld();
  }
  stepWorld(world, dt, input);
}

function render(alpha) {
  const { COLORS } = CONFIG;
  const { player, camera, level, projectiles, effects, enemies } = world;
  // Câmera arredondada para pixels inteiros: tudo fica alinhado à grade e nítido.
  const camX = Math.round(camera.prevX + (camera.x - camera.prevX) * alpha);
  const camY = Math.round(camera.prevY + (camera.y - camera.prevY) * alpha);

  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, COLORS.SKY);
  sky.addColorStop(1, COLORS.SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  level.draw(ctx, camX, camY, debug);
  enemies.draw(ctx, alpha, camX, camY, debug);
  projectiles.draw(ctx, alpha, camX, camY, debug);
  player.draw(ctx, alpha, camX, camY);
  effects.draw(ctx, camX, camY);

  drawHud(ctx, world);
  if (world.state === 'gameover') {
    drawBanner(ctx, 'GAME OVER', `PONTOS ${world.score}  -  ENTER PARA TENTAR DE NOVO`);
  } else if (world.state === 'victory') {
    drawBanner(ctx, 'MISSÃO COMPLETA!', `PONTOS ${world.score}  -  ENTER PARA JOGAR DE NOVO`);
  } else if (world.time < 2.5) {
    drawBanner(ctx, 'MISSÃO 1', 'A TELA NÃO ESPERA: AVANCE!');
  }

  if (debug) drawDebug(alpha, camX, camY);
}

function drawDebug(alpha, camX, camY) {
  const { COLORS } = CONFIG;
  const { player, camera, projectiles, enemies } = world;
  const px = Math.round(player.prevX + (player.x - player.prevX) * alpha) - camX;
  const py = Math.round(player.prevY + (player.y - player.prevY) * alpha) - camY;
  ctx.strokeStyle = COLORS.DEBUG_HITBOX;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, player.w - 1, player.h - 1);

  const lines = [
    `FPS ${fps}`,
    `pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}  câmera ${camera.x.toFixed(0)}`,
    `vel ${player.vx.toFixed(0)}, ${player.vy.toFixed(0)}`,
    `chão ${player.onGround ? 'sim' : 'não'}  agachado ${player.crouching ? 'sim' : 'não'}`,
    `balas ${projectiles.list.length}  inimigos ${enemies.active.length} (+${enemies.pending.length})`,
    `F2 troca arma   F3 invencível: ${player.godMode ? 'SIM' : 'não'}`,
  ];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(2, 18, 200, lines.length * 10 + 4);
  ctx.fillStyle = COLORS.DEBUG_TEXT;
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  lines.forEach((line, i) => ctx.fillText(line, 5, 21 + i * 10));
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
