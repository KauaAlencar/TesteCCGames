// Fase em tiles e colisão.
//
// Legenda:
//   '#' = bloco sólido      '.' = vazio
//   'P' = início do jogador 'F' = bandeira de chegada
//   'S' = soldado           'R' = corredor           'T' = torreta
// Entidades ficam no tile onde "pisam" (o tile de baixo deve ser sólido).

import { CONFIG } from './config.js';

const LEVEL_1 = [
  '#......................................................................................................................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#.....................................####.............................................................................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#...............................................................................................S......................................................................................................#',
  '#..............................#####..........................................................####.....................................................................................................#',
  '#......................................................................................................................................................................................................#',
  '#.........................S.................................................########......S...........T.....................................T.........................S................................#',
  '#.......................######.........................##...........T.......########....####........####..........S.....S..R..............#####....................#######.............................#',
  '#.................................................###..##.......#########...########........................#################...................................................T......................#',
  '#.................###..................................##...................########........................#################....................##............................###.....................#',
  '#..P........###...###.........S.........R..............##...S.........................R.....................#################....................##..S.....S.....R.........S...###....S...R..S.T...F...#',
  '############################################....####################################################################################....###############...##...#########################################',
  '############################################....####################################################################################....###############...##...#########################################',
];

const SOLID = new Set(['#']);
const ENTITY_MARKERS = new Set(['S', 'R', 'T']);
// Folga para que um corpo encostado na borda de um tile não conte como sobreposto a ele.
const EPS = 1e-6;

export class Level {
  constructor(rows = LEVEL_1) {
    const width = rows[0].length;
    rows.forEach((row, i) => {
      if (row.length !== width) {
        throw new Error(`Linha ${i} da fase tem ${row.length} colunas, esperado ${width}`);
      }
    });

    this.tile = CONFIG.TILE;
    this.cols = width;
    this.rows = rows.length;
    this.width = this.cols * this.tile;
    this.height = this.rows * this.tile;
    this.spawn = { col: 1, row: 1 };
    this.goal = null;
    this.entities = []; // { type, col, row }, em ordem de coluna

    this.grid = rows.map((row, r) =>
      [...row].map((ch, c) => {
        if (ch === 'P') this.spawn = { col: c, row: r };
        else if (ch === 'F') this.goal = { col: c, row: r };
        else if (ENTITY_MARKERS.has(ch)) this.entities.push({ type: ch, col: c, row: r });
        else return ch;
        return '.';
      }),
    );
    this.entities.sort((a, b) => a.col - b.col);
  }

  // Caixa da bandeira de chegada (um tile de largura, dois de altura).
  goalBox() {
    if (!this.goal) return null;
    const T = this.tile;
    return { x: this.goal.col * T, y: (this.goal.row - 1) * T, w: T, h: 2 * T };
  }

  // Fora da fase: laterais são sólidas, acima e abaixo são vazios
  // (dá para cair no buraco e sair por baixo).
  isSolid(col, row) {
    if (col < 0 || col >= this.cols) return true;
    if (row < 0 || row >= this.rows) return false;
    return SOLID.has(this.grid[row][col]);
  }

  isSolidAt(x, y) {
    return this.isSolid(Math.floor(x / this.tile), Math.floor(y / this.tile));
  }

  rectOverlapsSolid(x, y, w, h) {
    const T = this.tile;
    const c0 = Math.floor(x / T);
    const c1 = Math.floor((x + w - EPS) / T);
    const r0 = Math.floor(y / T);
    const r1 = Math.floor((y + h - EPS) / T);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (this.isSolid(c, r)) return true;
      }
    }
    return false;
  }

  // Move o corpo {x, y, w, h} no eixo X em sub-passos menores que um tile,
  // testando só a coluna da borda que avança. Retorna true se bateu.
  moveX(body, dx) {
    if (dx === 0) return false;
    const T = this.tile;
    const steps = Math.ceil(Math.abs(dx) / CONFIG.PHYSICS.MAX_SUBSTEP);
    const step = dx / steps;

    for (let i = 0; i < steps; i++) {
      body.x += step;
      const col = step > 0 ? Math.floor((body.x + body.w - EPS) / T) : Math.floor(body.x / T);
      const r0 = Math.floor(body.y / T);
      const r1 = Math.floor((body.y + body.h - EPS) / T);
      for (let r = r0; r <= r1; r++) {
        if (this.isSolid(col, r)) {
          body.x = step > 0 ? col * T - body.w : (col + 1) * T;
          return true;
        }
      }
    }
    return false;
  }

  // Igual a moveX, no eixo Y.
  moveY(body, dy) {
    if (dy === 0) return false;
    const T = this.tile;
    const steps = Math.ceil(Math.abs(dy) / CONFIG.PHYSICS.MAX_SUBSTEP);
    const step = dy / steps;

    for (let i = 0; i < steps; i++) {
      body.y += step;
      const row = step > 0 ? Math.floor((body.y + body.h - EPS) / T) : Math.floor(body.y / T);
      const c0 = Math.floor(body.x / T);
      const c1 = Math.floor((body.x + body.w - EPS) / T);
      for (let c = c0; c <= c1; c++) {
        if (this.isSolid(c, row)) {
          body.y = step > 0 ? row * T - body.h : (row + 1) * T;
          return true;
        }
      }
    }
    return false;
  }

  draw(ctx, camX, camY, debug) {
    const T = this.tile;
    const { COLORS } = CONFIG;
    const c0 = Math.max(0, Math.floor(camX / T));
    const c1 = Math.min(this.cols - 1, Math.floor((camX + CONFIG.WIDTH) / T));
    const r0 = Math.max(0, Math.floor(camY / T));
    const r1 = Math.min(this.rows - 1, Math.floor((camY + CONFIG.HEIGHT) / T));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!this.isSolid(c, r)) continue;
        const x = c * T - camX;
        const y = r * T - camY;
        ctx.fillStyle = COLORS.TILE;
        ctx.fillRect(x, y, T, T);
        ctx.fillStyle = COLORS.TILE_EDGE;
        ctx.fillRect(x, y + T - 1, T, 1);
        ctx.fillRect(x + T - 1, y, 1, T);
        if (!this.isSolid(c, r - 1)) {
          ctx.fillStyle = COLORS.TILE_TOP;
          ctx.fillRect(x, y, T, 3);
        }
        if (debug) {
          ctx.strokeStyle = COLORS.DEBUG_TILE;
          ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
        }
      }
    }

    // Bandeira de chegada: mastro + pano.
    if (this.goal) {
      const gx = this.goal.col * T - camX;
      const gy = (this.goal.row + 1) * T - camY;
      ctx.fillStyle = COLORS.FLAG_POLE;
      ctx.fillRect(gx + 7, gy - 40, 2, 40);
      ctx.fillStyle = COLORS.FLAG;
      ctx.fillRect(gx + 9, gy - 40, 12, 8);
    }
  }
}
