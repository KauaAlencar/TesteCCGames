// Pixel art gerada em código: cada sprite é um mapa de caracteres + paleta,
// desenhado uma única vez num canvas fora da tela e depois só copiado.
// Os quadros são criados na primeira vez que são desenhados (nada disso roda em Node).

// --- Paletas: cada letra do mapa vira uma cor ---
const PALETTES = {
  player: {
    k: '#1a1a22', s: '#f0c090', S: '#c89060', e: '#1a1a22',
    h: '#d83a2a', H: '#9a2418', b: '#2f6fd6', B: '#1c428a',
    x: '#3a2a1a', p: '#b09a60', P: '#7d6a3a', w: '#4a3020',
  },
  soldier: {
    k: '#1a1a14', s: '#e0b080', S: '#b08050', e: '#1a1a14',
    h: '#6a7a3a', H: '#4a5626', b: '#7a8a4a', B: '#56622f',
    x: '#3a3020', p: '#5d6a32', P: '#3d4a22', w: '#2a2a1a',
  },
  runner: {
    k: '#1a1414', s: '#e0b080', S: '#b08050', e: '#1a1414', m: '#3a2010',
    h: '#3a3a3a', H: '#222222', b: '#b8563a', B: '#7a3624',
    x: '#2a1a10', p: '#4a4a5a', P: '#30303c', w: '#222222',
  },
  pow: {
    k: '#1a1a1a', s: '#f0c090', S: '#c89060', e: '#1a1a1a', m: '#ece4d4',
    h: '#c89060', H: '#c89060', b: '#c8b890', B: '#9a8a60',
    x: '#6a5a3a', p: '#9a8a60', P: '#7a6a44', w: '#5a4028',
  },
};

// --- Cabeças (8x8, olhando para a direita) ---
const HEADS = {
  bandana: [
    '..kkkk..',
    '.khhhhk.',
    'khhhhhhk',
    'kHhsssek',
    'kksssssk',
    '.kssSsk.',
    '..kssk..',
    '...kk...',
  ],
  helmet: [
    '..kkkk..',
    '.khhhhk.',
    'khhhhhhk',
    'kHHHHHHk',
    'kssssesk',
    '.kssssk.',
    '..kssk..',
    '...kk...',
  ],
  mustache: [
    '..kkkk..',
    '.khhhhk.',
    'khhhhhhk',
    'ksssssek',
    'ksssmmsk',
    '.kssssk.',
    '..kssk..',
    '...kk...',
  ],
  beard: [
    '..kkkk..',
    '.kSSSSk.',
    'kSsssssk',
    'ksssssek',
    'kmmmmmmk',
    '.kmmmmk.',
    '..kmmk..',
    '...kk...',
  ],
};

const TORSO = [
  '.kkkkkkkk.',
  'kbbbbbbbbk',
  'kBbbbbbbbk',
  'kBbbbbbbbk',
  'kBbbbbbbbk',
  'kBbbbbbbbk',
  'kxxxxxxxxk',
  '.kkkkkkkk.',
];

const TORSO_CROUCH = [
  '.kkkkkkkk.',
  'kBbbbbbbbk',
  'kBbbbbbbbk',
  'kxxxxxxxxk',
  '.kkkkkkkk.',
];

// Pernas: [x, altura] de cada perna (a de trás primeiro). Altura menor = pé levantado.
const LEG_POSES = {
  stand: [[3, 8], [9, 8]],
  run0: [[2, 8], [10, 8]],
  run1: [[8, 6], [4, 8]],
  run2: [[10, 8], [2, 8]],
  run3: [[4, 8], [8, 6]],
  jump: [[3, 6], [9, 5]],
  fall: [[2, 8], [10, 7]],
};

export const FRAME_W = 16;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function blit(ctx, map, ox, oy, pal) {
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = pal[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  });
}

function drawLeg(ctx, x, top, h, pal) {
  ctx.fillStyle = pal.k;
  ctx.fillRect(x, top, 4, h - 3);
  ctx.fillRect(x, top + h - 3, 5, 3); // bota, um pouco para a frente
  ctx.fillStyle = pal.p;
  ctx.fillRect(x + 1, top, 2, h - 3);
  ctx.fillStyle = pal.P;
  ctx.fillRect(x + 1, top, 1, h - 3);
  ctx.fillStyle = pal.w;
  ctx.fillRect(x + 1, top + h - 2, 3, 1);
}

// Personagem em pé (16x24): cabeça + tronco + pernas na pose pedida.
function standingFrame(head, pal, legs, bob = 0) {
  const c = makeCanvas(FRAME_W, 24);
  const ctx = c.getContext('2d');
  for (const [x, h] of LEG_POSES[legs]) drawLeg(ctx, x, 16, h, pal);
  blit(ctx, TORSO, 3, 8 + bob, pal);
  blit(ctx, HEADS[head], 5, bob, pal);
  return c;
}

// Agachado (16x16): pernas dobradas; step alterna os pés para rastejar.
function crouchFrame(head, pal, step = 0, headBob = 0) {
  const c = makeCanvas(FRAME_W, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = pal.k;
  ctx.fillRect(1, 12, 14, 4);
  ctx.fillStyle = pal.p;
  ctx.fillRect(2, 12, 12, 2);
  ctx.fillStyle = pal.P;
  ctx.fillRect(2, 13, 12, 1);
  ctx.fillStyle = pal.w;
  ctx.fillRect(2 + step, 14, 3, 1);
  ctx.fillRect(10 - step, 14, 3, 1);
  blit(ctx, TORSO_CROUCH, 3, 7, pal);
  blit(ctx, HEADS[head], 5, headBob, pal);
  return c;
}

// Prisioneiro amarrado: agachado, com cordas no tronco, balançando a cabeça.
function tiedFrame(headBob) {
  const c = crouchFrame('beard', PALETTES.pow, 0, headBob);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8c860';
  ctx.fillRect(3, 8, 10, 1);
  ctx.fillRect(3, 10, 10, 1);
  return c;
}

// Prisioneiro solto batendo continência.
function saluteFrame() {
  const pal = PALETTES.pow;
  const c = standingFrame('beard', pal, 'stand');
  const ctx = c.getContext('2d');
  ctx.fillStyle = pal.k;
  ctx.fillRect(10, 1, 3, 9);
  ctx.fillStyle = pal.s;
  ctx.fillRect(11, 2, 1, 7);
  return c;
}

function flip(canvas) {
  const c = makeCanvas(canvas.width, canvas.height);
  const ctx = c.getContext('2d');
  ctx.scale(-1, 1);
  ctx.drawImage(canvas, -canvas.width, 0);
  return c;
}

// Silhueta branca do quadro (piscar ao levar dano).
function whiten(canvas) {
  const c = makeCanvas(canvas.width, canvas.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function character(head, palName) {
  const pal = PALETTES[palName];
  return {
    idle: [standingFrame(head, pal, 'stand'), standingFrame(head, pal, 'stand', 1)],
    run: ['run0', 'run1', 'run2', 'run3'].map((p) => standingFrame(head, pal, p)),
    jump: [standingFrame(head, pal, 'jump')],
    fall: [standingFrame(head, pal, 'fall')],
    crouch: [crouchFrame(head, pal)],
    crawl: [crouchFrame(head, pal, 0), crouchFrame(head, pal, 1)],
  };
}

const BUILDERS = {
  player: () => character('bandana', 'player'),
  soldier: () => character('helmet', 'soldier'),
  runner: () => character('mustache', 'runner'),
  pow: () => ({
    ...character('beard', 'pow'),
    tied: [tiedFrame(0), tiedFrame(1)],
    salute: [saluteFrame()],
  }),
};

const cache = new Map();

// Cada animação vira uma lista de { right, left, whiteRight, whiteLeft }
// (as versões espelhadas e brancas são geradas uma vez).
function getSet(name) {
  if (!cache.has(name)) {
    const raw = BUILDERS[name]();
    const set = {};
    for (const [anim, frames] of Object.entries(raw)) {
      set[anim] = frames.map((f) => {
        const white = whiten(f);
        return { right: f, left: flip(f), whiteRight: white, whiteLeft: flip(white) };
      });
    }
    cache.set(name, set);
  }
  return cache.get(name);
}

// Desenha o quadro da animação com os pés em `bottom` e centralizado em `centerX`.
export function drawSprite(ctx, setName, anim, time, centerX, bottom, facing, fps = 10, white = false) {
  const frames = getSet(setName)[anim];
  const frame = frames[Math.floor(time * fps) % frames.length];
  const img = white
    ? facing < 0 ? frame.whiteLeft : frame.whiteRight
    : facing < 0 ? frame.left : frame.right;
  ctx.drawImage(img, Math.round(centerX - img.width / 2), Math.round(bottom - img.height));
  return img;
}

// --- Tiles (16x16) com textura de terra e grama, em algumas variações ---

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TILE_VARIANTS = 4;
let tileCache = null;

function buildTile(top, seed) {
  const rand = mulberry32(seed);
  const c = makeCanvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b4a2e';
  ctx.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#5a3d25' : '#7d5a38';
    ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 1, 1);
  }
  if (rand() < 0.5) {
    // Pedrinha
    const sx = 2 + Math.floor(rand() * 10);
    const sy = 6 + Math.floor(rand() * 7);
    ctx.fillStyle = '#8a7a6a';
    ctx.fillRect(sx, sy, 3, 2);
    ctx.fillStyle = '#a89888';
    ctx.fillRect(sx, sy, 2, 1);
  }
  if (top) {
    ctx.fillStyle = '#8fbf4a';
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#b0dc6a';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = '#5f8f2a';
    for (let x = 0; x < 16; x++) {
      if (rand() < 0.5) ctx.fillRect(x, 3, 1, 1 + Math.floor(rand() * 2));
    }
  }
  return c;
}

export function getTile(top, col, row) {
  if (!tileCache) {
    tileCache = { top: [], fill: [] };
    for (let i = 0; i < TILE_VARIANTS; i++) {
      tileCache.top.push(buildTile(true, 100 + i));
      tileCache.fill.push(buildTile(false, 200 + i));
    }
  }
  const variant = Math.abs((col * 73856093) ^ (row * 19349663)) % TILE_VARIANTS;
  return (top ? tileCache.top : tileCache.fill)[variant];
}

// --- Caixa de item (12x12) com a letra da arma em fonte 3x5 ---

const GLYPHS = {
  H: ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'],
  R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
  F: ['xxx', 'x..', 'xx.', 'x..', 'x..'],
  B: ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
};
const itemCache = new Map();

export function getItemSprite(letter, color) {
  const key = letter + color;
  if (!itemCache.has(key)) {
    const c = makeCanvas(12, 12);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 12, 12);
    ctx.fillStyle = color;
    ctx.fillRect(1, 1, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(1, 1, 10, 1);
    ctx.fillRect(1, 1, 1, 10);
    blit(ctx, GLYPHS[letter], 5 - 1, 4 - 1, { x: '#1a1a1a' });
    blit(ctx, GLYPHS[letter], 5 - 1, 3 - 1, { x: '#ffffff' });
    itemCache.set(key, c);
  }
  return itemCache.get(key);
}
