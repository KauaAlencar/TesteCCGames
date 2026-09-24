// Todas as constantes do jogo num só lugar.
// Distâncias em pixels, tempos em segundos, velocidades em px/s e acelerações em px/s².

export const CONFIG = {
  WIDTH: 480,
  HEIGHT: 270,
  TILE: 16,

  // Passo fixo da física: 60 atualizações por segundo.
  STEP: 1 / 60,
  // Tempo máximo acumulado por quadro (evita a "espiral da morte" após a aba ficar em segundo plano).
  MAX_FRAME_TIME: 0.25,

  PHYSICS: {
    // Deslocamento máximo por sub-passo de colisão. Precisa ser menor que TILE
    // para que nada atravesse blocos, não importa a velocidade.
    MAX_SUBSTEP: 4,
  },

  PLAYER: {
    WIDTH: 12,
    HEIGHT: 24,
    CROUCH_HEIGHT: 14,

    MAX_SPEED: 110,
    CRAWL_SPEED: 40,
    ACCEL: 900,
    DECEL: 1200,
    AIR_ACCEL: 650,
    AIR_DECEL: 350,

    GRAVITY: 1000,
    MAX_FALL_SPEED: 420,
    JUMP_SPEED: 380, // altura máxima ≈ JUMP_SPEED² / (2·GRAVITY) ≈ 72px (4,5 tiles)
    JUMP_CUT_SPEED: 140, // soltar o pulo limita a subida a esta velocidade

    COYOTE_TIME: 0.1, // ainda pode pular logo após sair da borda
    JUMP_BUFFER: 0.1, // pulo apertado pouco antes de tocar o chão é aceito

    LIVES: 3, // como no Metal Slug, um acerto = uma vida
    DEATH_TIME: 1.2, // duração da animação de morte antes de reaparecer
    RESPAWN_INVULNERABLE: 2, // segundos piscando sem tomar dano após reaparecer
    HURTBOX_INSET: 2, // caixa de dano um pouco menor que o corpo (mais justo)
    BOMBS: 10, // granadas no início e a cada vida
  },

  // Granada: lançada em arco, explode ao tocar em bloco ou inimigo.
  GRENADE: {
    SPEED_X: 150,
    SPEED_Y: 230,
    GRAVITY: 700,
    COOLDOWN: 0.35,
    RADIUS: 30,
    DAMAGE: 5,
    SIZE: 5,
    LIFE: 3,
  },

  // A tela anda sozinha para a direita e nunca volta.
  // Ficar para trás empurra o jogador; se ele estiver preso contra um bloco, morre esmagado.
  AUTO_SCROLL: {
    ENABLED: true,
    SPEED: 28, // px/s (rastejar agachado é 40, então o túnel continua possível)
    START_DELAY: 1.5,
  },

  SHOOTING: {
    SHOT_BUFFER: 0.1, // tiro apertado durante o cooldown sai assim que possível
    MUZZLE_FLASH_TIME: 0.05,
    MAX_PROJECTILES: 64,
    OFFSCREEN_MARGIN: 16, // balas somem ao passar disto além da borda da tela
  },

  // Armas definidas por dados: para criar uma nova, basta adicionar uma entrada.
  // spread = desvio aleatório máximo em graus; ammo = Infinity para munição infinita.
  WEAPONS: {
    PISTOL: {
      name: 'Pistola',
      auto: false, // um tiro por aperto
      cooldown: 0.1,
      speed: 360,
      damage: 1,
      spread: 0,
      life: 1.5,
      length: 6,
      thickness: 3,
      color: '#fff27a',
      ammo: Infinity,
    },
    HEAVY_MACHINE_GUN: {
      name: 'Heavy Machine Gun',
      auto: true, // segurar dispara continuamente
      cooldown: 0.07,
      speed: 420,
      damage: 1,
      spread: 4,
      life: 1.5,
      length: 9,
      thickness: 3,
      color: '#ffb02e',
      ammo: 200,
    },
    ROCKET_LAUNCHER: {
      name: 'Rocket Launcher',
      kind: 'rocket', // só muda o desenho
      auto: false,
      cooldown: 0.3,
      speed: 90,
      accel: 700, // começa devagar e acelera
      maxSpeed: 380,
      damage: 0,
      explosive: { radius: 26, damage: 4 },
      spread: 0,
      life: 2,
      length: 10,
      thickness: 4,
      color: '#c8c8c8',
      ammo: 30,
    },
    FLAME_SHOT: {
      name: 'Flame Shot',
      kind: 'flame',
      auto: false,
      cooldown: 0.22,
      speed: 230,
      damage: 3,
      pierce: true, // atravessa inimigos, acertando cada um uma vez
      spread: 0,
      life: 0.35,
      length: 20,
      thickness: 10,
      color: '#ff7a20',
      ammo: 30,
    },
  },

  // Prisioneiros e itens.
  PICKUPS: {
    GRAVITY: 800,
    RESCUE_SCORE: 100,
    SALUTE_TIME: 0.7, // continência antes de fugir
    ESCAPE_SPEED: 70,
    BOMB_REFILL: 10,
    // Cada prisioneiro solta o próximo item desta lista (em ciclo).
    ITEM_SEQUENCE: ['HEAVY_MACHINE_GUN', 'BOMBS', 'ROCKET_LAUNCHER', 'FLAME_SHOT'],
    ITEMS: {
      HEAVY_MACHINE_GUN: { letter: 'H', color: '#d0a030', label: 'HEAVY MACHINE GUN!' },
      ROCKET_LAUNCHER: { letter: 'R', color: '#c04040', label: 'ROCKET LAUNCHER!' },
      FLAME_SHOT: { letter: 'F', color: '#e07020', label: 'FLAME SHOT!' },
      BOMBS: { letter: 'B', color: '#4a8a4a', label: '+10 BOMBAS' },
    },
  },

  // Tremor de tela (em pixels) e duração.
  SHAKE: {
    EXPLOSION: 3,
    BIG_EXPLOSION: 5,
    PLAYER_DEATH: 4,
    DURATION: 0.25,
  },

  CAMERA: {
    SMOOTHING: 8, // maior = acompanha mais rápido
    ANCHOR: 0.4, // a câmera avança quando o jogador passa desta fração da tela
  },

  ENEMIES: {
    GRAVITY: 1000,
    MAX_FALL_SPEED: 420,
    ACTIVATION_MARGIN: 32, // inimigos "acordam" quando chegam a esta distância da tela
    HIT_FLASH_TIME: 0.08,

    BULLET: { speed: 130, size: 4, life: 4, color: '#ff4a4a' },

    SOLDIER: {
      width: 12,
      height: 24,
      hp: 2,
      speed: 30,
      sight: 220, // distância horizontal em que enxerga o jogador
      sightHeight: 40, // diferença de altura máxima para atirar
      fireInterval: 1.5,
      fireJitter: 0.5, // variação aleatória do intervalo
      windup: 0.35, // aviso visual antes do tiro
      muzzleY: 7, // altura do tiro: agachar desvia
      score: 100,
    },
    RUNNER: {
      width: 12,
      height: 22,
      hp: 1,
      speed: 95,
      jumpSpeed: 330,
      score: 150,
    },
    TURRET: {
      width: 16,
      height: 16,
      hp: 6,
      interval: 2.2,
      burst: 3,
      burstGap: 0.18,
      bulletSpeed: 110,
      score: 500,
    },
  },

  COLORS: {
    SKY: '#5c94c8',
    SKY_BOTTOM: '#a8c8e0',
    TILE: '#6b4a2e',
    TILE_TOP: '#8fbf4a',
    TILE_EDGE: '#4a321f',
    TILE_LIGHT: '#86603c',
    PLAYER: '#2f6fd6',
    PLAYER_DARK: '#1c428a',
    PLAYER_SKIN: '#f0c090',
    GUN: '#333333',
    MUZZLE_FLASH: '#fff6c0',
    MUZZLE_FLASH_OUTER: '#ffb02e',
    SPARK: '#ffe070',
    SOLDIER: '#5d7a3a',
    SOLDIER_DARK: '#3d5226',
    RUNNER: '#b8563a',
    RUNNER_DARK: '#7a3624',
    TURRET: '#6e6e78',
    TURRET_DARK: '#44444c',
    ENEMY_SKIN: '#e0b080',
    WARNING: '#ffe030',
    HIT_FLASH: '#ffffff',
    EXPLOSION: ['#fff6c0', '#ffd040', '#ff8a20', '#c0402a', '#555555'],
    FLAG: '#e03030',
    FLAG_POLE: '#dddddd',
    HUD_TEXT: '#ffffff',
    HUD_SHADOW: '#000000',
    HUD_LIFE: '#ff4a4a',
    DEBUG_HITBOX: '#ff3b3b',
    DEBUG_TILE: 'rgba(255, 255, 0, 0.5)',
    DEBUG_TEXT: '#ffffff',
  },
};
