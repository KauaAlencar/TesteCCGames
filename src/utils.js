// Funções pequenas usadas por vários módulos.

export function approach(value, target, amount) {
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}

// Sobreposição de dois retângulos {x, y, w, h}.
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
