// The cube coach (2.6): reads the cube as it is right now and says what to do next, in moves you can follow.
// It works out which beginner step you are on, how far through it you are ("2 of 4 white edges"), and the next
// few turns that make progress without undoing what is already done. After every turn it checks again, so the
// advice follows the cube: do the moves and they tick off; turn something else and it finds a new way.
// No DOM here; tested in cube-coach.test.js.
import { apply, clone, parseMove, tokens, turn } from './cube-engine.js';

const NORMAL = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const faceAt = normal => Object.keys(NORMAL).find(face => same(NORMAL[face], normal));
const key = pos => pos.join(',');
const COLOR_WORD = { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' };
const FACE_WORD = { U: 'top', D: 'bottom', F: 'front', B: 'back', R: 'right', L: 'left' };

/** Which face each centre colour is on (3×3). */
export function centres(cube) {
  const out = {};
  for (const s of cube.stickers) if (s.pos.filter(v => v !== 0).length === 1) out[s.color] = faceAt(s.normal);
  return out;
}
/** Pieces of a 3×3: stickers grouped by position. */
function pieces(cube) {
  const map = new Map();
  for (const s of cube.stickers) { const k = key(s.pos); if (!map.has(k)) map.set(k, []); map.get(k).push(s); }
  return [...map.values()];
}
/** A piece is home when every sticker faces the centre of its own colour. */
const home = (piece, at) => piece.every(s => same(s.normal, NORMAL[at[s.color]]));
const colours = piece => piece.map(s => s.color);

// ---- The beginner steps, measured -----------------------------------------------------------------------
/** The colour on the bottom and top centres. */
const ends = at => ({ down: Object.keys(at).find(c => at[c] === 'D'), up: Object.keys(at).find(c => at[c] === 'U') });
function groups(cube, at) {
  const { down, up } = ends(at), all = pieces(cube);
  const edges = all.filter(p => p.length === 2), corners = all.filter(p => p.length === 3);
  return {
    cross: edges.filter(p => colours(p).includes(down)),
    corners: corners.filter(p => colours(p).includes(down)),
    middle: edges.filter(p => !colours(p).includes(down) && !colours(p).includes(up)),
    topEdges: edges.filter(p => colours(p).includes(up)),
    topCorners: corners.filter(p => colours(p).includes(up)),
    up, down,
  };
}
const facingUp = (piece, up) => piece.some(s => s.color === up && same(s.normal, NORMAL.U));
/** Is a top corner in its place (any twist)? */
const cornerPlaced = (piece, at) => key(piece[0].pos) === key(colours(piece).reduce((sum, c) => sum.map((v, i) => v + NORMAL[at[c]][i] * 2), [0, 0, 0]));
/** How far each step has got. Only what is asked for is counted (the search calls this a lot). */
function measure(cube, only) {
  const at = centres(cube), g = groups(cube, at), out = { at };
  const want = name => !only || only.includes(name);
  const count = list => list.filter(p => home(p, at)).length;
  if (want('cross')) out.cross = count(g.cross);
  if (want('corners')) out.corners = count(g.corners);
  if (want('middle')) out.middle = count(g.middle);
  if (want('topCross')) out.topCross = g.topEdges.filter(p => facingUp(p, g.up)).length;
  if (want('topFace')) out.topFace = g.topCorners.filter(p => facingUp(p, g.up)).length;
  if (want('cornersPlaced')) out.cornersPlaced = ['', 'U', 'U2', "U'"].some(u => { const c = apply(clone(cube), u), a = centres(c); return groups(c, a).topCorners.every(p => cornerPlaced(p, a)); });
  if (want('solvedPieces')) out.solvedPieces = pieces(cube).filter(p => p.length > 1 && home(p, at)).length;
  return out;
}
/** The step you are on: 0 cross … 6 last edges, 7 solved. -1 when white is not on the bottom. */
export function coachStage(cube) {
  if (cube.n !== 3) return null;
  const at = centres(cube);
  if (at.W !== 'D') return -1;
  const m = measure(cube);
  if (m.cross < 4) return 0;
  if (m.corners < 4) return 1;
  if (m.middle < 4) return 2;
  if (m.topCross < 4) return 3;
  if (m.topFace < 4) return 4;
  if (!m.cornersPlaced) return 5;
  if (m.solvedPieces < 20) return 6;
  return 7;
}

// ---- Searching for the next moves ----------------------------------------------------------------------
const FACE_MOVES = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap(f => [f, `${f}'`, `${f}2`]);
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
/** The cross: a short search over plain turns that places one more edge and keeps the placed ones. */
function crossMoves(cube, maxDepth = 6, budget = 400_000) {
  const at = centres(cube);
  const subset = { n: 3, stickers: groups(cube, at).cross.flat().map(s => ({ pos: [...s.pos], normal: [...s.normal], color: s.color })) };
  const edges = () => pieces(subset);
  const placed = () => edges().filter(p => home(p, at)).map(p => colours(p).sort().join(''));
  const before = placed(), keep = new Set(before);
  const good = () => { const now = placed(); return now.length > before.length && [...keep].every(c => now.includes(c)); };
  const moves = FACE_MOVES.map(t => parseMove(t, 3));
  const path = []; let nodes = 0;
  const dfs = depth => {
    if (depth === 0) return good();
    for (let i = 0; i < moves.length; i++) {
      const face = FACE_MOVES[i][0], last = path.at(-1)?.[0];
      if (last === face || (last === OPPOSITE[face] && face < last)) continue;
      if (++nodes > budget) return false;
      const m = moves[i]; turn(subset, m.axis, m.layers, m.quarter); path.push(FACE_MOVES[i]);
      if (dfs(depth - 1)) return true;
      path.pop(); turn(subset, m.axis, m.layers, -m.quarter);
    }
    return false;
  };
  for (let depth = 1; depth <= maxDepth; depth++) if (dfs(depth)) return path.join(' ');
  return null;
}
/** Relabel an algorithm for another slot: frame 1 holds the right face as the front, and so on. */
const FRAMES = [{}, { F: 'R', R: 'B', B: 'L', L: 'F' }, { F: 'B', R: 'L', B: 'F', L: 'R' }, { F: 'L', R: 'F', B: 'R', L: 'B' }];
const relabel = (alg, frame) => tokens(alg).map(t => (FRAMES[frame][t[0]] || t[0]) + t.slice(1)).join(' ');
const SETUPS = ['', 'U', "U'", 'U2'];
const join = (...parts) => parts.filter(Boolean).join(' ');
/** Try short chains of known algorithms (each after a turn of the top) and keep the shortest that works. */
function chain(cube, pieces, isGoal, depth) {
  let level = [{ state: cube, moves: '' }];
  for (let d = 1; d <= depth; d++) {
    let best = null; const next = [];
    for (const { state, moves } of level) for (const piece of pieces) {
      const after = apply(clone(state), piece), all = join(moves, piece);
      if (isGoal(after)) { if (!best || tokens(all).length < tokens(best).length) best = all; }
      else if (d < depth) next.push({ state: after, moves: all });
    }
    if (best) return best;
    level = next;
  }
  return null;
}
const repeat = (alg, k) => Array(k).fill(alg).join(' ');
const STEPS = [
  { name: 'The white cross', unit: 'white edges', of: 'cross' },
  { name: 'White corners', unit: 'white corners', of: 'corners' },
  { name: 'Middle edges', unit: 'middle edges', of: 'middle' },
  { name: 'Yellow cross', unit: 'yellow edges facing up', of: 'topCross' },
  { name: 'Yellow face', unit: 'yellow corners facing up', of: 'topFace' },
  { name: 'Yellow corners in place', unit: '', of: null },
  { name: 'Yellow edges in place', unit: '', of: null },
];
function nextMoves(cube, stage) {
  const m = measure(cube, ['cross', 'corners', 'middle']);
  const keeps = {
    1: c => measure(c, ['cross']).cross === 4,
    2: c => { const n = measure(c, ['cross', 'corners']); return n.cross === 4 && n.corners === 4; },
    3: c => { const n = measure(c, ['cross', 'corners', 'middle']); return n.cross === 4 && n.corners === 4 && n.middle === 4; },
  };
  if (stage === 0) return { moves: crossMoves(cube), why: 'This places one more white edge and keeps the ones already in.' };
  if (stage === 1) {
    const pieces = [];
    for (let f = 0; f < 4; f++) for (const s of SETUPS) for (let k = 1; k <= 5; k++) pieces.push(join(s, relabel(repeat("R U R' U'", k), f)));
    const moves = chain(cube, pieces, c => measure(c, ['corners']).corners > m.corners && keeps[1](c), 2);
    return { moves, why: 'R U R’ U’ (or the same at another corner) drops a white corner into its slot, white side down.' };
  }
  if (stage === 2) {
    const pieces = [];
    for (let f = 0; f < 4; f++) for (const s of SETUPS) for (const alg of ["U R U' R' U' F' U F", "U' L' U L U F U' F'"]) pieces.push(join(s, relabel(alg, f)));
    const moves = chain(cube, pieces, c => measure(c, ['middle']).middle > m.middle && keeps[2](c), 2);
    return { moves, why: 'The edge goes down into the middle layer and its corner partner comes back up.' };
  }
  const top = alg => SETUPS.map(s => join(s, alg));
  if (stage === 3) return { moves: chain(cube, top("F R U R' U' F'"), c => measure(c, ['topCross']).topCross === 4 && keeps[3](c), 3), why: 'F R U R’ U’ F’ flips top edges up without touching the first two layers.' };
  if (stage === 4) return { moves: chain(cube, top("R U R' U R U2 R'"), c => measure(c, ['topFace']).topFace === 4 && keeps[3](c), 3), why: 'The Sune twists the top corners; hold a yellow-up corner at the front left first.' };
  if (stage === 5) return { moves: chain(cube, top("R' F R' B2 R F' R' B2 R2"), c => { const n = measure(c, ['topFace', 'cornersPlaced']); return n.topFace === 4 && n.cornersPlaced && keeps[3](c); }, 2), why: 'This swaps two top corners and keeps everything else.' };
  if (stage === 6) return { moves: chain(cube, [...top("R U' R U R U R U' R' U' R2"), ...SETUPS.slice(1)], c => measure(c, ['solvedPieces']).solvedPieces === 20, 3), why: 'This cycles three top edges; a last turn of the top lines everything up.' };
  return { moves: '', why: '' };
}

/**
 * Advice for the cube as it is now. Returns { stage, name, progress, moves, why, text } where moves is the next
 * few turns (may be '' when solved, or null if no short way was found and the tip is all there is).
 */
export function coach(cube) {
  const stage = coachStage(cube);
  if (stage === null) return null;
  if (stage === -1) {
    const turnTo = ['x2', "x'", 'x', 'z', "z'"].find(r => centres(apply(clone(cube), r)).W === 'D');
    return { stage, name: 'Hold white underneath', progress: '', moves: turnTo, why: 'Every step here is told with the white centre on the bottom and yellow on top.', text: `Turn the whole cube so the white centre is on the bottom: ${turnTo}.` };
  }
  if (stage === 7) return { stage, name: 'Solved', progress: '', moves: '', why: '', text: 'Solved! Nicely done.' };
  const step = STEPS[stage], m = measure(cube);
  const progress = step.of ? `${m[step.of]} of 4 ${step.unit}` : '';
  const { moves, why } = nextMoves(cube, stage);
  return { stage, name: step.name, progress, moves, why, text: `${step.name}${progress ? ` (${progress})` : ''}.` };
}

// ---- Following a sequence -------------------------------------------------------------------------------
/**
 * Follow a sequence of moves from a starting cube. track(cube) says how far along you are by comparing the cube
 * itself, so it does not matter how a move was made (drag, keys, a half turn in two quarters).
 * Returns { done, total, halfway, off, back } — back is the moves that return you to the sequence when off it.
 */
export function follower(start, alg) {
  const steps = tokens(alg), states = [], halves = new Map();
  let state = clone(start);
  const sig = cube => cube.stickers.map(s => s.color + key(s.pos) + key(s.normal)).sort().join('|');
  states.push(sig(state));
  steps.forEach((step, i) => {
    if (step.endsWith('2')) for (const q of [step[0], `${step[0]}'`]) halves.set(sig(apply(clone(state), q)), i);
    state = apply(state, step); states.push(sig(state));
  });
  let lastOn = 0, extra = [];
  return {
    steps,
    track(cube, moveName) {
      const s = sig(cube);
      for (let i = states.length - 1; i >= 0; i--) if (states[i] === s) { lastOn = i; extra = []; return { done: i, total: steps.length, off: false }; }
      if (halves.has(s)) { extra = []; return { done: halves.get(s), total: steps.length, halfway: true, off: false }; }
      if (moveName) extra.push(moveName);
      const back = extra.length && extra.length <= 3 ? extra.slice().reverse().map(t => (t.endsWith("'") ? t.slice(0, -1) : t.endsWith('2') ? t : `${t}'`)).join(' ') : '';
      return { done: lastOn, total: steps.length, off: true, back };
    },
  };
}
export const describe = { colour: c => COLOR_WORD[c] || c, face: f => FACE_WORD[f] || f };
