// utils.js
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function dist(a, b) {
  // a: {x,y}, b: {x,y}
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function moveTowards(p, target, maxStep) {
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return { ...p }; // already there
  const step = Math.min(maxStep, d); // don’t overshoot
  const ux = dx / d;
  const uy = dy / d;
  return { x: p.x + ux * step, y: p.y + uy * step };
}
