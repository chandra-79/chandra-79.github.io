// Arrow Escape click effects (2.29.1): one soft ring that grows from a point, where the arrow was clicked or reached the edge.
// (The screen-edge flash, board pulse, afterimages and glow of 2.27.5 were too much and are gone.) Nothing here runs with Calmer motion or reduced motion.
const calm = () => globalThis.Ziggle?.calm?.() ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
// 2.77: an arrow leaves at one steady speed (no slow start), quick enough that a tap never feels like a wait. travel and step are in board units (the board is 530 across).
export const escapeDuration = (travel, step) => Math.round(Math.max(180, Math.min(1400, travel / Math.max(step * 24, 430) * 1000)));
export function ringFx(x, y, color = '#f57863', size = 100, delay = 0) {
  if (calm()) return;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true'); layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden'; document.body.append(layer);
  const ring = document.createElement('i');
  ring.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color}`; layer.append(ring);
  ring.animate?.([{ transform: 'scale(.2)', opacity: .7 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 280, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
  setTimeout(() => layer.remove(), 320 + delay);
}
// Where a blocked arrow meets the one in its way: a crisp thin ring and a few small sparks (no blur, no scaling of the arrows).
export function contactFx(board, sx, sy, viewport) {
  if (calm()) return;
  const matrix = board.getScreenCTM?.(); if (!matrix || !board.createSVGPoint) return;
  const pt = board.createSVGPoint(); pt.x = sx; pt.y = sy; const p = pt.matrixTransform(matrix), view = viewport?.getBoundingClientRect?.();
  const x = view ? Math.max(view.left + 6, Math.min(view.right - 6, p.x)) : p.x, y = view ? Math.max(view.top + 6, Math.min(view.bottom - 6, p.y)) : p.y;
  ringFx(x, y, '#e5484d', 56, 0);
}
export function clickFx(group, color = '#f57863', board) {
  if (calm()) return;
  const r = group.getBoundingClientRect?.(); if (!r) return;
  ringFx(r.left + r.width / 2, r.top + r.height / 2, color, 64, 0);
}
