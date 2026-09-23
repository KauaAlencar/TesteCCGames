// Arma: cadência, buffer de tiro, munição e criação dos projéteis.
// O comportamento vem de CONFIG.WEAPONS, então cada arma nova é só uma entrada de dados.

import { CONFIG } from './config.js';

const DEFAULT_WEAPON = 'PISTOL';

export class Weapon {
  constructor(id = DEFAULT_WEAPON) {
    this.cooldown = 0;
    this.buffer = 0;
    this.setType(id);
  }

  setType(id) {
    this.id = id;
    this.def = CONFIG.WEAPONS[id];
    this.ammo = this.def.ammo;
  }

  // Retorna true se disparou neste passo.
  update(dt, input, shooter, projectiles) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.buffer = input.pressed('shoot')
      ? CONFIG.SHOOTING.SHOT_BUFFER
      : Math.max(0, this.buffer - dt);

    const wantsToFire = this.buffer > 0 || (this.def.auto && input.held('shoot'));
    if (!wantsToFire || this.cooldown > 0) return false;

    this.fire(shooter.getMuzzle(), projectiles);
    this.cooldown = this.def.cooldown;
    this.buffer = 0;

    this.ammo--;
    if (this.ammo <= 0) this.setType(DEFAULT_WEAPON); // acabou a munição especial
    return true;
  }

  fire(muzzle, projectiles) {
    const d = this.def;
    const angle = ((Math.random() * 2 - 1) * d.spread * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dirX = muzzle.dirX * cos - muzzle.dirY * sin;
    const dirY = muzzle.dirX * sin + muzzle.dirY * cos;

    projectiles.spawn({
      x: muzzle.x,
      y: muzzle.y,
      vx: dirX * d.speed,
      vy: dirY * d.speed,
      damage: d.damage,
      life: d.life,
      length: d.length,
      thickness: d.thickness,
      color: d.color,
    });
  }
}
