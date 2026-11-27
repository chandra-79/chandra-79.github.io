// Arrow Escape extras that are only needed now and then, so they load on demand (2.77):
// the three warm-up boards a first-time player learns on, and the ripple of dots when a board is cleared.
const arrow = (id, color, direction, cells) => ({ id, color, direction, cells });
export const LEARN = [
  { size: 4, shape: 'learn', tip: 'Tap an arrow. It slides out the way it points.', paths: [
    arrow(0, 0, [1, 0], [[0, 1], [1, 1], [2, 1]]),
    arrow(1, 2, [-1, 0], [[3, 3], [2, 3], [1, 3]]) ] },
  { size: 5, shape: 'learn', tip: 'An arrow can only leave when nothing is in its way. Look where each one points.', paths: [
    arrow(0, 3, [1, 0], [[0, 0], [1, 0], [2, 0]]),
    arrow(1, 1, [0, -1], [[2, 2], [2, 1]]),
    arrow(2, 4, [0, -1], [[4, 4], [4, 3], [4, 2]]),
    arrow(3, 2, [1, 0], [[0, 3], [1, 3], [2, 3]]) ] },
  { size: 6, shape: 'learn', tip: 'Only one arrow can leave at first. Find it, and each one you free opens the way for the next.', paths: [
    arrow(0, 0, [0, 1], [[0, 0], [0, 1], [0, 2]]),
    arrow(1, 2, [-1, 0], [[2, 4], [1, 4], [0, 4]]),
    arrow(2, 3, [-1, 0], [[5, 0], [4, 0], [3, 0], [2, 0]]),
    arrow(3, 1, [0, -1], [[3, 2], [3, 1]]),
    arrow(4, 4, [0, -1], [[5, 5], [5, 4], [5, 3], [5, 2]]),
    arrow(5, 5, [0, 1], [[2, 2], [2, 3]]),
    arrow(6, 0, [1, 0], [[3, 5], [4, 5]]) ] },
];
// One soft wave of dots from the middle of the board outwards. The caller skips this with Calmer motion or reduced motion.
export function ripple(layer, board) {
  if (!layer?.ownerDocument || !layer.animate) return;
  const step = 460 / board.size, offset = (600 - step * (board.size - 1)) / 2, far = Math.hypot(265, 265), seen = new Set();
  const group = layer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
  const cells = board.paths.flatMap(path => path.cells), skip = Math.ceil(cells.length / 700);
  cells.forEach(([x, y], index) => {
    const key = x + ',' + y; if (index % skip || seen.has(key)) return; seen.add(key);
    const dot = layer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle'), cx = offset + x * step, cy = offset + y * step;
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', Math.max(1.4, step * .13)); dot.setAttribute('class', 'ripple-dot'); dot.setAttribute('opacity', '0');
    group.append(dot);
    dot.animate([{ opacity: 0 }, { opacity: .95, offset: .35 }, { opacity: 0 }], { duration: 380, delay: Math.hypot(cx - 300, cy - 300) / far * 520 });
  });
  layer.append(group); setTimeout(() => group.remove(), 950);
}
