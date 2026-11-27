// Cases for the cube trainer: F2L pairs found by search, practice states for each beginner step, and
// last-layer pictures. Pure logic (tested in cube.test.js).
import { solved, clone, apply, invert, tokens, faceGrid, isSolved, layerSolved, crossSolved, topCross, topOriented, beginnerStage } from './cube-engine.js';
import { F2L_TRIGGERS, OLL, PLL, TWO_LOOK, BEGINNER } from './cube-algs.js';

/** Tidy a move list: join and cancel neighbouring turns of the same face (U U → U2, U U' → nothing). */
export function simplify(text) {
  const out = [];
  const amount = token => (token.endsWith("'") ? 3 : token.endsWith('2') ? 2 : 1);
  const base = token => token.replace(/['2]$/, '');
  for (const token of tokens(text)) {
    const last = out[out.length - 1];
    if (last && base(last) === base(token)) {
      const total = (amount(last) + amount(token)) % 4;
      out.pop();
      if (total) out.push(base(token) + ['', '', '2', "'"][total]);
    } else out.push(token);
  }
  return out.join(' ');
}

// ---- F2L: every way the front-right pair can sit, found by searching with the basic triggers ---------
const PAIR = { corner: ['W', 'G', 'O'], edge: ['G', 'O'] };
function pairKey(cube) {
  const parts = [];
  for (const s of cube.stickers) {
    const onCorner = s.pos.filter(v => Math.abs(v) === 2).length === 3, onEdge = s.pos.filter(v => Math.abs(v) === 2).length === 2;
    if (!onCorner && !onEdge) continue;
    // Find the colours of this sticker's piece.
    const piece = cube.stickers.filter(o => o.pos.every((v, i) => v === s.pos[i])).map(o => o.color).sort().join('');
    if ((onCorner && piece === [...PAIR.corner].sort().join('')) || (onEdge && piece === [...PAIR.edge].sort().join(''))) parts.push(`${s.color}${s.pos.join(',')}/${s.normal.join(',')}`);
  }
  return parts.sort().join(' ');
}
/** The pair's state, the same for any turn of the top layer (so a case is counted once). */
function caseKey(cube) {
  let best = null;
  for (const u of ['', 'U', 'U2', "U'"]) { const key = pairKey(apply(clone(cube), u)); if (best === null || key < best) best = key; }
  return best;
}
let f2lCache = null;
/** All F2L cases for the front-right slot, each with a short solution made of the basic triggers. */
export function f2lCases() {
  if (f2lCache) return f2lCache;
  // Search raw pair states (top-layer turns count as different states), then fold together cases that differ
  // only by a top-layer turn, keeping the shortest solution.
  const start = solved(3);
  const seen = new Map([[pairKey(start), { path: '', cube: start }]]);
  let frontier = [{ cube: start, path: '' }];
  for (let depth = 0; depth < 10 && frontier.length; depth++) {
    const next = [];
    for (const { cube, path } of frontier) {
      for (const trigger of F2L_TRIGGERS) {
        const moved = apply(clone(cube), trigger);
        const key = pairKey(moved);
        if (seen.has(key)) continue;
        const entry = { cube: moved, path: simplify(`${path} ${trigger}`) };
        seen.set(key, entry); next.push(entry);
      }
    }
    frontier = next;
  }
  const best = new Map();
  for (const { cube, path } of seen.values()) {
    const key = caseKey(cube), solution = simplify(invert(path)).replace(/^U[2']?\s*/, '');
    // A leading top-layer turn is dropped from the solution: the case is shown already lined up.
    if (!best.has(key) || tokens(best.get(key)).length > tokens(solution).length) best.set(key, solution);
  }
  const cases = [...best.entries()].map(([, solution]) => ({ path: simplify(invert(solution)), solution })).filter(c => c.solution);
  // The setup leaves the slot broken; drop anything that is only a top-layer turn.
  f2lCache = cases.filter(c => !layerSolved(apply(solved(3), c.path), 2)).sort((a, b) => tokens(a.solution).length - tokens(b.solution).length).map((c, i) => Object.freeze({ id: `f2l-${i + 1}`, name: `Pair ${i + 1}`, alg: c.solution, setup: c.path }));
  return f2lCache;
}

// ---- Practice states ---------------------------------------------------------------------------------
const pick = (list, random) => list[Math.floor(random() * list.length)];
/** A cube that needs exactly one algorithm (plus a top-layer turn) to solve that step. */
export function algorithmCase(alg, n = 3, random = Math.random) { return algorithmSetup(alg, n, random).cube; }
/** The case and the top-layer turn added to it, so "show me" can line it up first. */
export function algorithmSetup(alg, n = 3, random = Math.random) {
  const auf = pick(['', 'U', 'U2', "U'"], random);
  return { cube: apply(solved(n), `${invert(alg)} ${auf}`), auf, lineUp: auf ? invert(auf) : '' };
}
const GOALS = {
  cross: crossSolved, layer1: c => layerSolved(c, 1), layer2: c => layerSolved(c, 2), 'top-cross': c => layerSolved(c, 2) && topCross(c),
  'top-face': c => layerSolved(c, 2) && topOriented(c), 'top-corners': c => beginnerStage(c) >= 6, solved: isSolved,
};
export const goalMet = (goal, cube) => GOALS[goal]?.(cube) ?? false;
/** A practice cube for one beginner step: earlier steps done, this one not. */
export function stageCase(index, random = Math.random) {
  const stage = BEGINNER[index];
  for (let tries = 0; tries < 200; tries++) {
    let cube;
    if (index === 0) cube = apply(solved(3), scrambleText(random, 20));
    else if (index === 1) cube = apply(solved(3), Array.from({ length: 6 }, () => pick(["R U R'", "R U' R'", "L' U' L", "L' U L", "F' U' F", "B U B'", 'U', 'U2'], random)).join(' '));
    else if (index === 2) cube = apply(solved(3), Array.from({ length: 4 }, () => `${pick(['', 'U', 'U2', "U'"], random)} ${pick([BEGINNER[2].alg, BEGINNER[2].alt, invert(BEGINNER[2].alg), invert(BEGINNER[2].alt)], random)} ${pick(['y', "y'", 'y2', ''], random)}`).join(' '));
    else if (index === 3) cube = apply(solved(3), `${invert(pick(OLL, random).alg)} ${pick(['', 'U', 'U2'], random)} ${invert(pick(PLL, random).alg)}`);
    else if (index === 4) cube = apply(solved(3), `${invert(pick(TWO_LOOK.filter(t => t.set === 'oll2'), random).alg)} ${pick(['', 'U', 'U2'], random)} ${invert(pick(PLL, random).alg)}`);
    else if (index === 5) cube = apply(solved(3), `${invert(pick(PLL.filter(p => !['H perm', 'Ua perm', 'Ub perm', 'Z perm'].includes(p.name)), random).alg)} ${pick(['', 'U', 'U2', "U'"], random)}`);
    else cube = apply(solved(3), `${invert(pick(TWO_LOOK.filter(t => t.set === 'pll2'), random).alg)} ${pick(['', 'U', 'U2', "U'"], random)}`);
    const before = index === 0 ? true : goalMet(BEGINNER[index - 1].goal, cube);
    if (before && !goalMet(stage.goal, cube)) return cube;
  }
  return apply(solved(3), invert(stage.alg || 'F2'));
}
function scrambleText(random, length) {
  const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
  const out = [];
  while (out.length < length) { const f = pick(faces, random); if (out.length && out[out.length - 1][0] === f) continue; out.push(f + pick(['', "'", '2'], random)); }
  return out.join(' ');
}

// ---- Pictures ------------------------------------------------------------------------------------------
export const COLORS = Object.freeze({ W: '#ffffff', Y: '#ffd500', R: '#c41e3a', O: '#ff6a13', B: '#0051ba', G: '#009e60', '?': '#888888' });
export const COLOR_NAMES = Object.freeze({ W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' });
/**
 * A last-layer picture: the top face with the top row of each side around it.
 * mode 'oll' greys out everything but yellow, so the shape stands out.
 */
export function llDiagram(cube, { mode = 'pll', letters = false } = {}) {
  const n = cube.n, cell = 20, pad = 8, size = n * cell + 2 * pad + 2 * (cell * 0.45);
  const off = pad + cell * 0.45;
  const fill = color => (mode === 'oll' ? (color === 'Y' ? COLORS.Y : '#5b5866') : COLORS[color]);
  const u = faceGrid(cube, 'U');
  const parts = [];
  const sticker = (x, y, w, h, color) => parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${fill(color)}" stroke="#1b1b1f" stroke-width="1.5"/>${letters && mode !== 'oll' ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + 4).toFixed(1)}" font-size="9" font-weight="800" text-anchor="middle" fill="#1b1b1f">${color}</text>` : ''}`);
  u.forEach((row, r) => row.forEach((color, c) => sticker(off + c * cell, off + r * cell, cell, cell, color)));
  const strip = cell * 0.4;
  const top = (face, i) => faceGrid(cube, face)[0][i];
  for (let i = 0; i < n; i++) {
    sticker(off + i * cell, off - strip - 2, cell, strip, top('B', n - 1 - i)); // back, seen from the top
    sticker(off + i * cell, off + n * cell + 2, cell, strip, top('F', i));
    sticker(off - strip - 2, off + i * cell, strip, cell, top('L', i));
    sticker(off + n * cell + 2, off + i * cell, strip, cell, top('R', n - 1 - i));
  }
  return `<svg class="ll-svg" viewBox="0 0 ${size.toFixed(0)} ${size.toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(0)}" aria-hidden="true">${parts.join('')}</svg>`;
}
/** A flat net of the whole cube (U on top, L F R B across, D below). */
export function netDiagram(cube, { letters = false, cell = 0 } = {}) {
  const n = cube.n, c = cell || Math.max(9, Math.round(60 / n)), gap = 4, face = n * c;
  const at = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  const parts = [];
  for (const [name, [fx, fy]] of Object.entries(at)) {
    faceGrid(cube, name).forEach((row, r) => row.forEach((color, k) => {
      const x = fx * (face + gap) + k * c, y = fy * (face + gap) + r * c;
      parts.push(`<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${COLORS[color]}" stroke="#1b1b1f" stroke-width="1"/>`);
      if (letters) parts.push(`<text x="${x + c / 2}" y="${y + c / 2 + c * 0.18}" font-size="${(c * 0.5).toFixed(1)}" font-weight="800" text-anchor="middle" fill="#1b1b1f">${color}</text>`);
    }));
  }
  const w = 4 * face + 3 * gap, h = 3 * face + 2 * gap;
  return `<svg class="net-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${parts.join('')}</svg>`;
}
/** Describe a face in words, for screen readers: "Front: green, green, white …". */
export function describeFace(cube, face) {
  return faceGrid(cube, face).map(row => row.map(color => COLOR_NAMES[color] || color).join(', ')).join('; ');
}
