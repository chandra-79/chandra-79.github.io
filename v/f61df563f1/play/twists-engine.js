// Arrow Twists (2.3): bonus Arrow Escape boards with three new rules. The daily board never uses them.
//  - Two-headed arrows can leave from either end.
//  - One-way tiles let an arrow pass only in the tile's direction.
//  - Colour gates stay shut until every arrow of their colour has left.
// Removing an arrow never blocks another (gates only open), so a board is solvable exactly when greedily
// removing any free arrow clears it. Every board here is checked that way.

export const DIRS = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
const dirName = ([dx, dy]) => (dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
export const COLORS = 5;

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6d2b79f5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const key = (x, y) => `${x},${y}`;

/** The ways an arrow can leave: its head, and for a two-headed arrow its tail too. */
export function heads(arrow) {
  const list = [{ end: 'head', cell: arrow.cells.at(-1), dir: arrow.dir }];
  if (arrow.double) {
    const [a, b] = arrow.cells;
    list.push({ end: 'tail', cell: a, dir: b ? [Math.sign(a[0] - b[0]), Math.sign(a[1] - b[1])] : arrow.dir.map(v => -v) });
  }
  return list;
}

/** Is the way out from one end clear right now? Returns null when clear, or what is in the way. */
export function blockerFor(board, remaining, arrow, end = 'head') {
  const way = heads(arrow).find(item => item.end === end);
  if (!way) return { kind: 'none' };
  const occupied = new Map();
  for (const other of remaining) if (other.id !== arrow.id) for (const [x, y] of other.cells) occupied.set(key(x, y), other.id);
  const colorsLeft = new Set(remaining.filter(other => other.id !== arrow.id).map(other => other.color));
  let [x, y] = way.cell;
  const [dx, dy] = way.dir;
  for (x += dx, y += dy; x >= 0 && y >= 0 && x < board.size && y < board.size; x += dx, y += dy) {
    const here = key(x, y);
    if (occupied.has(here)) return { kind: 'arrow', id: occupied.get(here), cell: [x, y] };
    const tile = board.oneWay[here];
    if (tile && (DIRS[tile][0] !== dx || DIRS[tile][1] !== dy)) return { kind: 'one-way', cell: [x, y], tile };
    const gate = board.gates[here];
    if (gate !== undefined && colorsLeft.has(gate)) return { kind: 'gate', cell: [x, y], color: gate };
  }
  return null;
}
/** Ends of an arrow that are free right now. */
export const freeEnds = (board, remaining, arrow) => heads(arrow).filter(way => !blockerFor(board, remaining, arrow, way.end)).map(way => way.end);
export const available = (board, remaining) => remaining.filter(arrow => freeEnds(board, remaining, arrow).length);

/** Greedy clearing order (removing never hurts), or null if the board gets stuck. */
export function solve(board) {
  let remaining = [...board.arrows];
  const order = [];
  while (remaining.length) {
    const next = remaining.find(arrow => freeEnds(board, remaining, arrow).length);
    if (!next) return null;
    order.push({ id: next.id, end: freeEnds(board, remaining, next)[0] });
    remaining = remaining.filter(arrow => arrow.id !== next.id);
  }
  return order;
}

/** A tile or gate only counts if it changes something: it blocks at least one way out at the start. */
function matters(board) {
  const used = { double: board.arrows.some(arrow => arrow.double), oneWay: false, gate: false };
  for (const arrow of board.arrows) for (const way of heads(arrow)) {
    const block = blockerFor(board, board.arrows, arrow, way.end);
    if (block?.kind === 'one-way') used.oneWay = true;
    if (block?.kind === 'gate') used.gate = true;
  }
  return used;
}

/** A seeded board: arrows walked across the grid, then the level's twists, kept only if it can be cleared. */
// `clearable` (2.11.1, endless twists): each new arrow is kept only if it has a clear way out past the arrows already
// placed, so removing them in reverse order always works. Most random boards used to be thrown away as unsolvable
// (up to 700 tries, 2 seconds); now nearly every try succeeds. The named boards keep their original layouts.
export function generateTwist({ size = 7, seed = 1, arrows: target = 12, double = 0, oneWay = 0, gates = 0, clearable = false } = {}) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const random = seeded(seed * 7919 + attempt * 104729 + size);
    const taken = new Set(), list = [];
    for (let tries = 0; list.length < target && tries < target * 30; tries++) {
      let x = Math.floor(random() * size), y = Math.floor(random() * size);
      if (taken.has(key(x, y))) continue;
      const cells = [[x, y]], length = 2 + Math.floor(random() * 4);
      let dir = Object.values(DIRS)[Math.floor(random() * 4)];
      for (let step = 1; step < length; step++) {
        if (random() < 0.35) dir = Object.values(DIRS)[Math.floor(random() * 4)];
        const nx = x + dir[0], ny = y + dir[1];
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || taken.has(key(nx, ny)) || cells.some(([cx, cy]) => cx === nx && cy === ny)) break;
        x = nx; y = ny; cells.push([x, y]);
      }
      if (cells.length < 2) continue;
      const [ax, ay] = cells.at(-2), [bx, by] = cells.at(-1);
      const arrow = { id: list.length, cells, dir: [bx - ax, by - ay], double: random() < double, color: Math.floor(random() * COLORS) };
      if (clearable && !freeEnds({ size, arrows: list, oneWay: {}, gates: {} }, [...list, arrow], arrow).length) continue;
      for (const [cx, cy] of cells) taken.add(key(cx, cy));
      list.push(arrow);
    }
    const free = [];
    for (let fy = 0; fy < size; fy++) for (let fx = 0; fx < size; fx++) if (!taken.has(key(fx, fy))) free.push([fx, fy]);
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    const board = { size, arrows: list, oneWay: {}, gates: {} };
    const tiles = Math.round(free.length * oneWay), gateCount = Math.round(free.length * gates);
    // A tile on a one-headed arrow's way points the way that arrow travels (else it could never leave).
    const ways = new Map();
    for (const arrow of list) for (const way of heads(arrow)) {
      if (arrow.double) continue;
      for (let [wx, wy] = way.cell, i = 0; i < size; i++) { wx += way.dir[0]; wy += way.dir[1]; if (wx < 0 || wy < 0 || wx >= size || wy >= size) break; const here = key(wx, wy); (ways.get(here) || ways.set(here, new Set()).get(here)).add(dirName(way.dir)); }
    }
    let placed = 0;
    for (const [fx, fy] of [...free]) {
      if (placed >= tiles) break;
      const forced = ways.get(key(fx, fy));
      if (forced && forced.size > 1) continue;
      board.oneWay[key(fx, fy)] = forced ? [...forced][0] : Object.keys(DIRS)[Math.floor(random() * 4)];
      free.splice(free.findIndex(([cx, cy]) => cx === fx && cy === fy), 1); placed++;
    }
    for (const [fx, fy] of free.splice(0, gateCount)) board.gates[key(fx, fy)] = list[Math.floor(random() * list.length)].color;
    if (!solve(board)) continue;
    const used = matters(board);
    if ((double > 0 && !used.double) || (oneWay > 0 && !used.oneWay) || (gates > 0 && !used.gate)) continue;
    return board;
  }
  throw new Error('Could not build a twist board.');
}

// Three small teaching boards, then twelve mixed boards that grow.
const TEACH = [
  { name: 'Two ways out', rule: 'double', teach: 'This arrow has a head at each end. Tap near the end you want it to leave from.',
    board: { size: 5, oneWay: {}, gates: {}, arrows: [
      { id: 0, cells: [[1, 2], [2, 2], [3, 2]], dir: [1, 0], double: true, color: 0 },
      { id: 1, cells: [[4, 1], [4, 2], [4, 3]], dir: [0, 1], double: false, color: 1 },
      { id: 2, cells: [[2, 0], [2, 1]], dir: [0, 1], double: false, color: 2 },
      { id: 3, cells: [[2, 4], [1, 4], [0, 4]], dir: [-1, 0], double: true, color: 3 },
    ] } },
  { name: 'One-way streets', rule: 'oneWay', teach: 'An arrow can cross a striped tile only the way its chevrons point.',
    board: { size: 5, gates: {}, oneWay: { '4,2': 'left', '0,2': 'left', '2,3': 'down' }, arrows: [
      { id: 0, cells: [[1, 2], [2, 2], [3, 2]], dir: [1, 0], double: true, color: 0 },
      { id: 1, cells: [[2, 0], [2, 1]], dir: [0, 1], double: false, color: 2 },
      { id: 2, cells: [[3, 4], [4, 4]], dir: [1, 0], double: false, color: 1 },
      { id: 3, cells: [[0, 1], [0, 0]], dir: [0, -1], double: false, color: 3 },
    ] } },
  { name: 'Colour gates', rule: 'gate', teach: 'A gate stays shut until every arrow of its colour has left the board.',
    board: { size: 5, oneWay: {}, gates: { '3,1': 1, '1,3': 2 }, arrows: [
      { id: 0, cells: [[0, 1], [1, 1], [2, 1]], dir: [1, 0], double: false, color: 0 },
      { id: 1, cells: [[4, 3], [4, 4]], dir: [0, 1], double: false, color: 1 },
      { id: 2, cells: [[1, 4], [2, 4], [3, 4]], dir: [1, 0], double: false, color: 2 },
      { id: 3, cells: [[3, 3], [2, 3]], dir: [-1, 0], double: false, color: 3 },
      { id: 4, cells: [[0, 2], [0, 3]], dir: [0, 1], double: false, color: 4 },
    ] } },
];
const MIXED = [
  { size: 6, arrows: 9, double: 0.35 }, { size: 6, arrows: 9, double: 0.35, oneWay: 0.2 }, { size: 6, arrows: 9, gates: 0.12 },
  { size: 7, arrows: 13, double: 0.3, oneWay: 0.12 }, { size: 7, arrows: 13, double: 0.25, oneWay: 0.12, gates: 0.08 }, { size: 7, arrows: 14, double: 0.3, gates: 0.1 },
  { size: 8, arrows: 18, double: 0.25, oneWay: 0.12, gates: 0.08 }, { size: 8, arrows: 19, double: 0.3, oneWay: 0.15 }, { size: 8, arrows: 19, double: 0.25, oneWay: 0.1, gates: 0.12 },
  { size: 9, arrows: 24, double: 0.25, oneWay: 0.12, gates: 0.08 }, { size: 9, arrows: 25, double: 0.3, oneWay: 0.14, gates: 0.1 }, { size: 10, arrows: 30, double: 0.25, oneWay: 0.12, gates: 0.1 },
];
const NAMES = ['Either way', 'Side streets', 'Locked colours', 'Crossroads', 'Toll booths', 'Double gates', 'Rush hour', 'One-way city', 'Gatekeepers', 'Grand tour', 'Twister', 'The big twist'];
export const TWIST_COUNT = TEACH.length + MIXED.length;
/** Every board's name, for the level list (no need to build the boards). */
export const TWIST_NAMES = Object.freeze([...TEACH.map(item => item.name), ...NAMES]);
/** Level n (0-based): a teaching board for the first three, then mixed boards. */
/**
 * Endless twists (2.11): after the last named board, every board is new, a little bigger and busier each time
 * (up to 12 × 12 and 36 arrows), mixing two-headed arrows, one-way tiles and gates. Boards never run out.
 */
export function endlessTwist(k) {
  const size = Math.min(12, 10 + Math.floor(k / 8));
  return { size, arrows: Math.min(36, Math.round(size * size * 0.3), 28 + Math.floor(k / 2)), double: 0.25, oneWay: 0.12, gates: 0.1, seed: 9001 + k * 37 };
}
// A dense board can fail to build: step down a few arrows until it does (the same k always gives the same board).
function buildEndless(k) {
  const spec = endlessTwist(k);
  for (let arrows = spec.arrows; arrows >= 12; arrows -= 2) { try { return generateTwist({ ...spec, arrows, clearable: true }); } catch { /* try fewer */ } }
  return generateTwist({ size: 8, arrows: 12, seed: spec.seed });
}
export function twistLevel(n) {
  const index = Math.max(0, Math.trunc(Number(n) || 0));
  if (index >= TWIST_COUNT) { const k = index - TWIST_COUNT + 1; return { index, name: `Endless twist ${k}`, rule: 'mixed', teach: '', endless: k, board: buildEndless(k) }; }
  if (index < TEACH.length) { const { board, ...info } = TEACH[index]; return { index, ...info, board: structuredClone(board) }; }
  const spec = MIXED[index - TEACH.length];
  return { index, name: NAMES[index - TEACH.length], rule: 'mixed', teach: '', board: generateTwist({ ...spec, seed: 2026 + index * 13 }) };
}
export const directionName = dirName;
