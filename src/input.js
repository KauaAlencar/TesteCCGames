// Leitura do teclado mapeada em ações.
//
// Os eventos do navegador são guardados em filas e só "consumidos" em update(),
// que deve ser chamado uma vez por passo de física. Assim:
//  - pressed(ação) vale true por exatamente um passo;
//  - um toque rápido (apertar e soltar entre dois passos) nunca se perde.

const BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'Space'],
  shoot: ['KeyX'],
  debug: ['F1'],
  debugWeapon: ['F2'],
};

export class Input {
  constructor(target = window) {
    this.down = new Set(); // teclas seguradas agora
    this.justDown = new Set(); // apertadas desde o último update()
    this.justUp = new Set(); // soltas desde o último update()

    this.boundCodes = new Set(Object.values(BINDINGS).flat());
    this.state = {};
    for (const action of Object.keys(BINDINGS)) {
      this.state[action] = { held: false, pressed: false, released: false };
    }

    target.addEventListener('keydown', (e) => {
      if (!this.boundCodes.has(e.code)) return;
      e.preventDefault(); // evita rolar a página com setas/espaço e a ajuda do F1
      if (e.repeat) return;
      this.down.add(e.code);
      this.justDown.add(e.code);
    });

    target.addEventListener('keyup', (e) => {
      if (!this.boundCodes.has(e.code)) return;
      e.preventDefault();
      this.down.delete(e.code);
      this.justUp.add(e.code);
    });

    // Ao perder o foco, solta tudo para o jogador não ficar andando sozinho.
    window.addEventListener('blur', () => {
      for (const code of this.down) this.justUp.add(code);
      this.down.clear();
    });
  }

  update() {
    for (const [action, codes] of Object.entries(BINDINGS)) {
      const isDown = codes.some((c) => this.down.has(c));
      const pressed = codes.some((c) => this.justDown.has(c));
      const s = this.state[action];
      s.pressed = pressed;
      s.held = isDown || pressed;
      s.released = !isDown && codes.some((c) => this.justUp.has(c));
    }
    this.justDown.clear();
    this.justUp.clear();
  }

  held(action) {
    return this.state[action].held;
  }

  pressed(action) {
    return this.state[action].pressed;
  }

  released(action) {
    return this.state[action].released;
  }
}
