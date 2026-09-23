// Regras da partida: cria o mundo e avança um passo de física.
// Não depende do navegador, então dá para testar em Node.

import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Projectiles } from './projectiles.js';
import { Effects } from './effects.js';
import { Enemies } from './enemies.js';
import { overlaps } from './utils.js';

const { WIDTH, HEIGHT } = CONFIG;

// Tudo que é recriado ao reiniciar a partida.
export function createWorld() {
  const level = new Level();
  const player = new Player(level);
  const camera = new Camera(level);
  camera.snapTo(player);
  return {
    level,
    player,
    camera,
    projectiles: new Projectiles(),
    effects: new Effects(),
    enemies: new Enemies(level),
    score: 0,
    state: 'playing', // 'playing' | 'gameover' | 'victory'
    time: 0, // tempo desde o início da partida
    stateTime: 0, // tempo desde a última mudança de estado
  };
}

function setState(w, state) {
  w.state = state;
  w.stateTime = 0;
}

// A tela empurra quem fica para trás; preso contra um bloco, o jogador é esmagado.
// Também não deixa sair pela direita.
function keepPlayerOnScreen(w) {
  const { player, camera, level, effects } = w;
  if (player.dead) return;
  const left = camera.x;
  const right = camera.x + WIDTH - player.w;
  if (player.x < left) {
    level.moveX(player, left - player.x);
    if (player.x < left - 0.01) {
      player.kill();
      effects.explosion(player.x + player.w / 2, player.y + player.h / 2, 0.6);
    }
  } else if (player.x > right) {
    level.moveX(player, right - player.x);
  }
}

// Reaparece caindo do topo, na primeira posição da tela com chão firme embaixo
// e também logo à frente (para não nascer na beira de um buraco).
function respawnPlayer(w) {
  const { player, camera, level } = w;
  const T = level.tile;
  const hasGround = (col) => {
    for (let r = 0; r < level.rows; r++) if (level.isSolid(col, r)) return true;
    return false;
  };
  let x = camera.x + 64;
  while (x < camera.x + WIDTH - 32) {
    const c0 = Math.floor(x / T);
    const c1 = Math.floor((x + player.w - 1) / T) + 2;
    let ok = true;
    for (let c = c0; c <= c1; c++) if (!hasGround(c)) ok = false;
    if (ok) break;
    x += T;
  }
  player.facing = 1;
  player.respawnAt(x, camera.y - player.h);
}

// Um passo de física da partida em andamento.
export function stepWorld(w, dt, input) {
  const { player, camera, level, projectiles, effects, enemies } = w;
  w.time += dt;
  w.stateTime += dt;

  if (w.state !== 'playing') {
    effects.update(dt);
    return;
  }

  player.update(dt, input, level, projectiles);
  camera.update(dt, player);
  keepPlayerOnScreen(w);
  enemies.update(dt, w);
  projectiles.update(dt, level, { x: camera.x, y: camera.y, w: WIDTH, h: HEIGHT }, effects);
  w.score += enemies.handleCollisions(w);
  effects.update(dt);

  if (player.deathFinished) {
    if (player.lives > 0) respawnPlayer(w);
    else setState(w, 'gameover');
  }

  const goal = level.goalBox();
  if (!player.dead && goal && overlaps(player, goal)) {
    w.score += player.lives * 1000; // bônus por vida restante
    setState(w, 'victory');
  }
}
