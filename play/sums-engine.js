// Sum Spark (2.4): reach the target with a chain of number tiles. Pick a tile, then an operator and the
// next tile, and so on; the running total updates after every step (worked left to right, like a
// calculator). Each tile once. Every round is built from a real chain, so an exact answer always exists.
// The daily has three rounds: Add up (+), Add and take away (+ −), All four (+ − × ÷).

export const OPS = Object.freeze(['+', '−', '×', '÷']);
export const KINDS = Object.freeze([
  { id: 'add', name: 'Add up', ops: ['+'], tiles: 6 },
  { id: 'mix', name: 'Add and take away', ops: ['+', '−'], tiles: 6 },
  { id: 'all', name: 'All four', ops: ['+', '−', '×', '÷'], tiles: 6 },
]);
export const kindById = id => KINDS.find(kind => kind.id === id) || KINDS[0];
export const MAX_VALUE = 9999;

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6d2b79f5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (random, list) => list[Math.floor(random() * list.length)];

/** One step of the chain. Results must stay whole numbers from 0 to 9,999 (division only when exact). */
export function apply(total, op, value) {
  let next;
  if (op === '+') next = total + value;
  else if (op === '−') next = total - value;
  else if (op === '×') next = total * value;
  else if (op === '÷') next = value !== 0 && total % value === 0 ? total / value : NaN;
  else return { ok: false, reason: 'Pick +, −, × or ÷.' };
  if (!Number.isInteger(next)) return { ok: false, reason: 'That doesn’t divide evenly.' };
  if (next < 0) return { ok: false, reason: 'The total can’t go below zero.' };
  if (next > MAX_VALUE) return { ok: false, reason: 'That’s too big for the board.' };
  return { ok: true, value: next };
}
/** Work out a chain: steps are [{ tile, op }] with no op on the first. */
export function chainValue(round, steps) {
  const used = new Set();
  let total = null;
  for (const [i, step] of steps.entries()) {
    if (!Number.isInteger(step?.tile) || step.tile < 0 || step.tile >= round.numbers.length || used.has(step.tile)) return { ok: false, reason: 'Each tile can be used once.' };
    used.add(step.tile);
    const value = round.numbers[step.tile];
    if (i === 0) { total = value; continue; }
    if (!kindById(round.kind).ops.includes(step.op)) return { ok: false, reason: `This round uses ${kindById(round.kind).ops.join(' ')} only.` };
    const next = apply(total, step.op, value);
    if (!next.ok) return next;
    total = next.value;
  }
  return { ok: true, value: total };
}

/** A round: six tiles and a target that a hidden chain of three to five tiles reaches. */
export function generateRound(kindId, seed) {
  const kind = kindById(kindId);
  for (let attempt = 0; attempt < 500; attempt++) {
    const random = seeded(seed * 2654435761 + attempt * 40503 + kind.id.length);
    let numbers;
    if (kind.id === 'add') numbers = Array.from({ length: 6 }, () => 1 + Math.floor(random() * 25));
    else if (kind.id === 'mix') numbers = Array.from({ length: 6 }, () => 1 + Math.floor(random() * 40));
    else numbers = [...Array.from({ length: 4 }, () => 1 + Math.floor(random() * 10)), pick(random, [25, 50, 75, 100]), pick(random, [10, 12, 15, 20, 25, 50])];
    // Fisher–Yates, never sort() with a random comparator: that order differs between browsers.
    const order = numbers.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const length = kind.id === 'add' ? 3 + Math.floor(random() * 2) : 3 + Math.floor(random() * 3);
    const steps = [{ tile: order[0], op: null }];
    let total = numbers[order[0]], ok = true;
    for (let i = 1; i < length; i++) {
      const op = pick(random, kind.ops), next = apply(total, op, numbers[order[i]]);
      if (!next.ok) { ok = false; break; }
      steps.push({ tile: order[i], op }); total = next.value;
    }
    if (!ok) continue;
    const range = { add: [20, 80], mix: [10, 70], all: [101, 999] }[kind.id];
    if (total < range[0] || total > range[1] || numbers.includes(total)) continue;
    if (kind.id !== 'add' && new Set(steps.slice(1).map(step => step.op)).size < 2) continue; // use the round's twist
    // No shortcut: two tiles alone must not hit the target, or the round is over before it starts.
    const two = numbers.some((a, i) => numbers.some((b, j) => i !== j && kind.ops.some(op => apply(a, op, b).value === total)));
    if (two) continue;
    return { kind: kind.id, numbers, target: total, sample: steps };
  }
  throw new Error('Could not build a round.');
}

/** Today's three rounds for a Ziggle day number. */
// Daily levels (2.8): medium is the original three rounds (add, mix, all four). Easy is two adding rounds and one
// add-and-take-away; hard is add-and-take-away then two all-four rounds. Each level has its own seeds.
// Until SUMS_SPREAD_FROM Expert's first seed (base + 53) was Easy's third (base + 31 + 2 × 11), so those two rounds
// were the same puzzle; days before it stay as published. From day 27 (2026-11-27) every level has its own seeds:
// Medium base + 0/7/14, Easy base + 31/42/53, Expert base + 60/71/82, all below the next day's base (+97).
export const SUMS_SPREAD_FROM = 27;
const TIER_ROUNDS = Object.freeze({ easy: ['add', 'add', 'mix'], hard: ['mix', 'all', 'all'] });
export function dailyRounds(dayNumber, tier = 'medium') {
  const day = Math.max(1, dayNumber), base = 20261105 + day * 97;
  if (!Object.hasOwn(TIER_ROUNDS, tier)) return KINDS.map((kind, i) => generateRound(kind.id, base + i * 7));
  const salt = tier === 'easy' ? 31 : day >= SUMS_SPREAD_FROM ? 60 : 53;
  return TIER_ROUNDS[tier].map((kind, i) => generateRound(kind, base + salt + i * 11));
}

/** A bonus set on today's ladder (2.11): three new rounds of a level's kinds, seeded by the day, level and place. */
export function climbRounds(dayNumber, tier = 'medium', index = 1) {
  const kinds = TIER_ROUNDS[tier] || KINDS.map(kind => kind.id);
  const base = 40261105 + Math.max(1, dayNumber) * 389 + Math.max(1, index) * 1013 + (tier === 'easy' ? 17 : tier === 'hard' ? 29 : 0);
  return kinds.map((kind, i) => generateRound(kind, base + i * 13));
}

/**
 * Search for a chain that reaches the target, extending `prefix` (the player's steps so far) when it can.
 * Returns { exact: steps|null, best: steps, bestValue }. Bounded so it stays quick.
 */
export function search(round, prefix = [], { limit = 300_000 } = {}) {
  const kind = kindById(round.kind), n = round.numbers.length;
  let best = null, bestGap = Infinity, exact = null, visits = 0;
  const walk = (steps, total, used) => {
    if (exact || visits++ > limit) return;
    if (steps.length) {
      const gap = Math.abs(total - round.target);
      if (gap < bestGap) { bestGap = gap; best = steps.slice(); }
      if (gap === 0) { exact = steps.slice(); return; }
    }
    for (let tile = 0; tile < n; tile++) {
      if (used & (1 << tile)) continue;
      if (!steps.length) { walk([{ tile, op: null }], round.numbers[tile], used | (1 << tile)); continue; }
      for (const op of kind.ops) {
        const next = apply(total, op, round.numbers[tile]);
        if (next.ok) walk([...steps, { tile, op }], next.value, used | (1 << tile));
      }
    }
  };
  const start = chainValue(round, prefix);
  if (start.ok && prefix.length) walk(prefix.slice(), start.value, prefix.reduce((mask, step) => mask | (1 << step.tile), 0));
  if (!exact && prefix.length) walk([], 0, 0);
  else if (!prefix.length) walk([], 0, 0);
  return { exact, best, bestValue: best ? chainValue(round, best).value : null };
}

/** Points for a round: 100 on target, then 60 / 40 / 20 for within 2 / 5 / 10. Hints cost 15 each. */
export function roundScore(round, steps, hints = 0) {
  const result = steps.length ? chainValue(round, steps) : { ok: false };
  if (!result.ok) return { points: 0, gap: null, mark: 'a' };
  const gap = Math.abs(result.value - round.target);
  const base = gap === 0 ? 100 : gap <= 2 ? 60 : gap <= 5 ? 40 : gap <= 10 ? 20 : 0;
  return { points: Math.max(base ? 10 : 0, base - 15 * hints), gap, mark: gap === 0 ? 'e' : gap <= 10 ? 'c' : 'a' };
}
export const MARK_EMOJI = Object.freeze({ e: '🎯', c: '🟨', a: '⬜' });
