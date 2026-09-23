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
  },

  CAMERA: {
    SMOOTHING: 8, // maior = acompanha mais rápido
    LOOK_AHEAD: 32, // desloca a câmera para onde o jogador está virado
  },

  COLORS: {
    SKY: '#5c94c8',
    SKY_BOTTOM: '#a8c8e0',
    TILE: '#6b4a2e',
    TILE_TOP: '#8fbf4a',
    TILE_EDGE: '#4a321f',
    PLAYER: '#2f6fd6',
    PLAYER_DARK: '#1c428a',
    PLAYER_SKIN: '#f0c090',
    GUN: '#333333',
    MUZZLE_FLASH: '#fff6c0',
    MUZZLE_FLASH_OUTER: '#ffb02e',
    SPARK: '#ffe070',
    DEBUG_HITBOX: '#ff3b3b',
    DEBUG_TILE: 'rgba(255, 255, 0, 0.5)',
    DEBUG_TEXT: '#ffffff',
  },
};
