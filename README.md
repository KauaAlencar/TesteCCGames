# Run & Gun

Jogo de plataforma 2D no estilo Metal Slug, em HTML5 Canvas puro (sem frameworks nem dependências).

## Como rodar

ES modules não funcionam abrindo o `index.html` direto, então use um servidor local:

```bash
python3 -m http.server 8000
# ou: npx serve .
```

Depois abra http://localhost:8000.

## Controles

| Tecla | Ação |
|---|---|
| ← → ou A D | andar |
| ↓ ou S | agachar (no ar: mirar para baixo) |
| ↑ ou W | mirar para cima |
| Z ou Espaço | pular |
| X | atirar |
| C | granada |
| M | som liga/desliga |
| Enter | começar / recomeçar |
| F1 | debug (com ele ligado: F2 troca a arma, F3 invencibilidade) |

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/config.js` | todas as constantes (física, armas, inimigos, dificuldade, cores) |
| `src/main.js` | game loop com passo fixo, desenho, tela de título, sons |
| `src/game.js` | regras da partida e combate (roda sem navegador, dá para testar em Node) |
| `src/level.js` | mapa em texto e colisão com tiles |
| `src/player.js` | jogador: movimento, pulo, mira, granada |
| `src/weapon.js`, `src/projectiles.js` | armas e projéteis |
| `src/enemies.js` | soldado, corredor e torreta |
| `src/pickups.js` | prisioneiros e itens |
| `src/camera.js` | rolagem automática |
| `src/sprites.js`, `src/background.js` | pixel art gerada em código e fundo em parallax |
| `src/effects.js`, `src/audio.js`, `src/hud.js` | efeitos, sons sintetizados e HUD |

## Editando a fase

A fase é um array de strings em `src/level.js`: `#` bloco, `P` início, `F` bandeira,
`S` soldado, `R` corredor, `T` torreta, `W` prisioneiro. Entidades ficam no tile acima do chão.
