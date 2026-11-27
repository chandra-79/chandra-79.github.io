// Ziggle's own twisty-cube engine for every size from 2×2 to 7×7 (no DOM; tested in cube.test.js).
// Each sticker has a 3D position and a facing; a move turns every sticker in the chosen layers 90°.
// Coordinates: x to the right, y up, z towards you. Positions run from -(N-1) to N-1 in steps of 2.

export const FACES = Object.freeze(['U', 'R', 'F', 'D', 'L', 'B']);
/** Colour of each face when solved. Lessons hold yellow on top (white cross underneath); scrambles use the WCA hold, white on top. */
export const SCHEMES = Object.freeze({
  lesson: Object.freeze({ U: 'Y', R: 'O', F: 'G', D: 'W', L: 'R', B: 'B' }),
  wca: Object.freeze({ U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' }),
});
export const FACE_COLOR = SCHEMES.lesson;
const NORMAL = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
const AXIS = { x: 0, y: 1, z: 2 };
/** Each face turn: which axis, which side, and the quarter-turn direction of a clockwise turn (right-hand rule). */
const FACE_TURN = { U: ['y', 1, -1], D: ['y', -1, 1], R: ['x', 1, -1], L: ['x', -1, 1], F: ['z', 1, -1], B: ['z', -1, 1] };

function rotate([x, y, z], axis, quarter) {
  const q = ((quarter % 4) + 4) % 4;
  let v = [x, y, z];
  for (let i = 0; i < q; i++) {
    const [a, b, c] = v;
    v = axis === 'x' ? [a, -c, b] : axis === 'y' ? [c, b, -a] : [-b, a, c];
  }
  return v;
}

/** A solved N×N cube. */
export function solved(n, scheme = 'lesson') {
  const colors = SCHEMES[scheme] || SCHEMES.lesson;
  if (!Number.isInteger(n) || n < 2 || n > 7) throw new Error('Cube size must be 2 to 7');
  const stickers = [];
  const coords = Array.from({ length: n }, (_, i) => -(n - 1) + 2 * i);
  for (const face of FACES) {
    const normal = NORMAL[face];
    const k = normal.findIndex(v => v !== 0);
    for (const a of coords) for (const b of coords) {
      const pos = [0, 0, 0];
      pos[k] = normal[k] * (n - 1);
      const others = [0, 1, 2].filter(i => i !== k);
      pos[others[0]] = a; pos[others[1]] = b;
      stickers.push({ pos, normal: [...normal], color: colors[face] });
    }
  }
  return { n, stickers };
}
export const clone = cube => ({ n: cube.n, stickers: cube.stickers.map(s => ({ pos: [...s.pos], normal: [...s.normal], color: s.color })) });

/**
 * A move as numbers: turn the layers whose coordinate on `axis` is in `layers`, by `quarter` (+1 = counter-clockwise
 * seen from the positive end of the axis).
 */
export function turn(cube, axis, layers, quarter) {
  const k = AXIS[axis];
  const set = new Set(layers);
  for (const s of cube.stickers) {
    // A sticker sits at its piece's grid position, so its coordinate says which layer it is in.
    if (!set.has(s.pos[k])) continue;
    s.pos = rotate(s.pos, axis, quarter);
    s.normal = rotate(s.normal, axis, quarter);
  }
  return cube;
}

// ---- Notation --------------------------------------------------------------------------------
// R U F L D B (outer layer), Rw or r (outer two), 3Rw (outer three), 2R (second layer only),
// M E S (middle slice, odd sizes), x y z (whole cube); then ' (anticlockwise) or 2 (half turn).
const TOKEN = /^(\d*)([URFDLBurfdlbMESxyz])(w?)('|2'?|)$/;
export function parseMove(token, n) {
  const m = TOKEN.exec(token);
  if (!m) return null;
  let [, prefix, letter, wide, suffix] = m;
  const amount = suffix === "'" ? -1 : suffix.startsWith('2') ? 2 : 1;
  const coordOf = depth => (n - 1) - 2 * (depth - 1); // depth 1 = the outer layer on the positive side
  if ('xyz'.includes(letter)) {
    const [axis, , dir] = { x: FACE_TURN.R, y: FACE_TURN.U, z: FACE_TURN.F }[letter];
    return { axis, layers: Array.from({ length: n }, (_, i) => -(n - 1) + 2 * i), quarter: dir * amount, token };
  }
  if ('MES'.includes(letter)) {
    if (n % 2 === 0) return null;
    const [axis, , dir] = { M: FACE_TURN.L, E: FACE_TURN.D, S: FACE_TURN.F }[letter];
    return { axis, layers: [0], quarter: dir * amount, token };
  }
  if (letter === letter.toLowerCase()) { letter = letter.toUpperCase(); if (wide) return null; wide = 'w'; }
  const [axis, side, dir] = FACE_TURN[letter];
  let depths;
  if (wide) { const deep = prefix ? Number(prefix) : 2; if (deep < 2 || deep > n) return null; depths = Array.from({ length: deep }, (_, i) => i + 1); }
  else if (prefix) { const layer = Number(prefix); if (layer < 1 || layer > n) return null; depths = [layer]; }
  else depths = [1];
  const layers = depths.map(depth => side * coordOf(depth));
  return { axis, layers, quarter: dir * amount, token };
}
/** Split an algorithm string into move tokens; brackets and extra spaces are ignored. */
export const tokens = text => String(text).replace(/[()[\]]/g, ' ').replace(/’/g, "'").trim().split(/\s+/).filter(Boolean);
export function apply(cube, text) {
  for (const token of tokens(text)) {
    const move = parseMove(token, cube.n);
    if (!move) throw new Error(`Unknown move ${token} for a ${cube.n}×${cube.n}`);
    turn(cube, move.axis, move.layers, move.quarter);
  }
  return cube;
}
/** The moves that undo an algorithm: reversed, each one inverted. */
export function invert(text) {
  return tokens(text).reverse().map(token => (token.endsWith("'") ? token.slice(0, -1) : /2'?$/.test(token) ? token.replace(/2'$/, '2') : `${token}'`)).join(' ');
}
export const validAlg = (text, n) => tokens(text).length > 0 && tokens(text).every(token => parseMove(token, n));

// ---- Reading the cube -----------------------------------------------------------------------
/** The stickers of one face as rows (top to bottom) of colours, as you'd see the face looking straight at it. */
export function faceGrid(cube, face) {
  const n = cube.n, normal = NORMAL[face], k = normal.findIndex(v => v !== 0);
  // Screen axes for each face: [index of the right axis, its sign, index of the down axis, its sign].
  const view = { U: [0, 1, 2, 1], D: [0, 1, 2, -1], F: [0, 1, 1, -1], B: [0, -1, 1, -1], R: [2, -1, 1, -1], L: [2, 1, 1, -1] }[face];
  const grid = Array.from({ length: n }, () => Array(n).fill('?'));
  for (const s of cube.stickers) {
    if (s.normal[k] !== normal[k] || s.normal.some((v, i) => i !== k && v !== 0)) continue;
    const col = ((view[1] * s.pos[view[0]]) + (n - 1)) / 2, row = ((view[3] * s.pos[view[2]]) + (n - 1)) / 2;
    grid[row][col] = s.color;
  }
  return grid;
}
/** All six faces as one string per face (row by row), e.g. for comparing states. */
export const facelets = cube => FACES.map(face => faceGrid(cube, face).flat().join('')).join(' ');
export const isSolved = cube => FACES.every(face => new Set(faceGrid(cube, face).flat()).size === 1);
/** Same state, ignoring how the whole cube is held. */
export function sameUpToRotation(a, b) {
  const target = facelets(b);
  const turns = ['', 'y', 'y2', "y'"], tops = ['', 'x', 'x2', "x'", 'z', "z'"];
  for (const top of tops) for (const t of turns) { const c = apply(clone(a), `${top} ${t}`); if (facelets(c) === target) return true; }
  return false;
}

// ---- Piece checks for lessons ------------------------------------------------------------------
/** Is the bottom layer (D face plus the bottom row of each side) solved? */
export function layerSolved(cube, depth = 1) {
  const n = cube.n, d = faceGrid(cube, 'D').flat();
  if (depth >= 1 && new Set(d).size !== 1) return false;
  for (const face of ['F', 'R', 'B', 'L']) {
    const grid = faceGrid(cube, face), center = grid[Math.floor(n / 2)][Math.floor(n / 2)];
    for (let r = n - depth; r < n; r++) if (grid[r].some(color => color !== center)) return false;
  }
  return true;
}
/** The bottom cross on a 3×3: D edges matching the D centre and their side centres. */
export function crossSolved(cube) {
  if (cube.n !== 3) return false;
  const d = faceGrid(cube, 'D');
  if ([d[0][1], d[1][0], d[1][2], d[2][1]].some(c => c !== d[1][1])) return false;
  return ['F', 'R', 'B', 'L'].every(face => { const g = faceGrid(cube, face); return g[2][1] === g[1][1]; });
}
/** Top face all one colour. */
export const topOriented = cube => new Set(faceGrid(cube, 'U').flat()).size === 1;
/** Top cross on a 3×3 (edges oriented). */
export function topCross(cube) { const u = faceGrid(cube, 'U'); return [u[0][1], u[1][0], u[1][2], u[2][1]].every(c => c === u[1][1]); }
/** The stage of a 3×3 beginner solve that's done (0 to 7), with white on the bottom. */
export function beginnerStage(cube) {
  if (cube.n !== 3) return 0;
  if (isSolved(cube)) return 7;
  if (!crossSolved(cube)) return 0;
  if (!layerSolved(cube, 1)) return 1;
  if (!layerSolved(cube, 2)) return 2;
  if (!topCross(cube)) return 3;
  if (!topOriented(cube)) return 4;
  const sides = ['F', 'R', 'B', 'L'].map(face => faceGrid(cube, face)[0]);
  const cornersPlaced = sides.every(row => row[0] === row[2]);
  return cornersPlaced ? 6 : 5;
}

// ---- Scrambles --------------------------------------------------------------------------------
export const SCRAMBLE_LENGTH = Object.freeze({ 2: 11, 3: 25, 4: 40, 5: 60, 6: 80, 7: 100 });
export function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6d2b79f5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** A random-move scramble: no face twice in a row, and no A B A on the same axis. */
export function scramble(n, random = Math.random, length = SCRAMBLE_LENGTH[n]) {
  const faces = n === 2 ? ['U', 'R', 'F'] : FACES;
  const axisOf = { U: 'y', D: 'y', R: 'x', L: 'x', F: 'z', B: 'z' };
  const out = [];
  let last = '', lastAxis = '', axisRun = [];
  while (out.length < length) {
    const face = faces[Math.floor(random() * faces.length)];
    if (face === last) continue;
    if (axisOf[face] === lastAxis && axisRun.includes(face)) continue;
    const deep = n >= 4 ? 1 + Math.floor(random() * Math.floor(n / 2)) : 1;
    const token = (deep === 1 ? face : deep === 2 ? `${face}w` : `${deep}${face}w`) + ['', "'", '2'][Math.floor(random() * 3)];
    out.push(token);
    axisRun = axisOf[face] === lastAxis ? [...axisRun, face] : [face];
    last = face; lastAxis = axisOf[face];
  }
  return out.join(' ');
}

// ---- Timing -------------------------------------------------------------------------------------
/** A solve's time with its penalty: +2 adds two seconds; DNF counts as no time. */
export const effective = solve => (solve.penalty === 'dnf' ? Infinity : solve.ms + (solve.penalty === '+2' ? 2000 : 0));
/** WCA-style average of the last `count` solves: drop the best and worst, mean the rest. Two DNFs make a DNF. */
export function average(solves, count) {
  if (solves.length < count) return null;
  const times = solves.slice(-count).map(effective).sort((a, b) => a - b);
  const trim = count >= 5 ? Math.max(1, Math.round(count * 0.05)) : 0;
  const kept = times.slice(trim, times.length - trim);
  if (kept.some(t => t === Infinity)) return Infinity;
  return Math.round(kept.reduce((s, t) => s + t, 0) / kept.length);
}
export const mean = (solves, count) => { if (solves.length < count) return null; const t = solves.slice(-count).map(effective); return t.some(x => x === Infinity) ? Infinity : Math.round(t.reduce((s, x) => s + x, 0) / count); };
export function formatTime(ms) {
  if (ms == null) return '–';
  if (ms === Infinity) return 'DNF';
  const total = ms / 1000;
  if (total < 60) return total.toFixed(2);
  const m = Math.floor(total / 60), s = total - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

// ---- Drag to turn ---------------------------------------------------------------------------------
/**
 * Work out the turn a drag makes. sticker: {pos, normal}; dragAxis: the 3D direction along the face that the
 * finger moved (one of ±x, ±y, ±z). The turn spins the stickers so this sticker moves that way.
 */
export function dragTurn(n, sticker, dragAxis) {
  const [nx, ny, nz] = sticker.normal, [tx, ty, tz] = dragAxis;
  const r = [ny * tz - nz * ty, nz * tx - nx * tz, nx * ty - ny * tx];
  const k = r.findIndex(v => v !== 0);
  if (k < 0) return null;
  const axis = 'xyz'[k];
  const piece = sticker.pos[k];
  return { axis, layers: [piece], quarter: r[k] > 0 ? 1 : -1 };
}
/** Name a single-layer turn in notation (R, 2R, M, U'...), or the nearest description for big cubes. */
export function moveName(n, { axis, layers, quarter }) {
  if (layers.length !== 1) return null;
  const c = layers[0];
  const faces = { x: ['R', 'L'], y: ['U', 'D'], z: ['F', 'B'] }[axis];
  if (c === 0) {
    const slice = { x: 'M', y: 'E', z: 'S' }[axis];
    const dir = { x: FACE_TURN.L[2], y: FACE_TURN.D[2], z: FACE_TURN.F[2] }[axis];
    return slice + (quarter === dir ? '' : "'");
  }
  const face = c > 0 ? faces[0] : faces[1];
  const depth = ((n - 1) - Math.abs(c)) / 2 + 1;
  const clockwise = quarter === FACE_TURN[face][2];
  return `${depth > 1 ? depth : ''}${face}${clockwise ? '' : "'"}`;
}

/** Unbiased Fisher–Yates copy (a random-comparator sort() is biased and engine-dependent). */
export function shuffled(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
