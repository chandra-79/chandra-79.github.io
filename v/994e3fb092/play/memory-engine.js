// Memory Mischief is an original Ziggle game. All rounds are generated locally.
export const BUDDIES = Object.freeze([
  Object.freeze({ id: 'star', name: 'Star', emoji: '⭐', color: '#e9b949' }),
  Object.freeze({ id: 'moon', name: 'Moon', emoji: '🌙', color: '#a797dc' }),
  Object.freeze({ id: 'leaf', name: 'Leaf', emoji: '🌿', color: '#75ad82' }),
  Object.freeze({ id: 'berry', name: 'Berry', emoji: '🍓', color: '#dc8093' }),
  Object.freeze({ id: 'cloud', name: 'Cloud', emoji: '☁️', color: '#75abc6' }),
  Object.freeze({ id: 'comet', name: 'Comet', emoji: '☄️', color: '#e79c65' }),
]);

const mode = (label, description, lengths, reverseRounds, watchMs) => Object.freeze({
  label, description, lengths: Object.freeze(lengths),
  reverseRounds: Object.freeze(reverseRounds), watchMs,
});

export const MODES = Object.freeze({
  cozy: mode('Cozy', 'A gentle start. Follow the trail at your own pace.', [3, 3, 4, 4, 5], [], 950),
  curious: mode('Curious', 'A little shuffle, a little rewind, a lot of aha.', [3, 4, 4, 5, 5], [3, 5], 750),
  daring: mode('Daring', 'Longer trails and more mischievous rewinds.', [4, 5, 5, 6, 7], [2, 4, 5], 600),
});

function randomFor(seed) {
  let state = 2166136261;
  for (const char of String(seed)) {
    state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// Every buddy changes places. Avoid repeating an earlier layout in this session.
function shiftedLayouts(ids, random, count) {
  const layouts = [];
  for (let round = 0; round < count; round++) {
    let layout;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = shuffle(ids, random);
      if (candidate.every((id, index) => id !== ids[index]) &&
        !layouts.some(previous => previous.every((id, index) => id === candidate[index]))) {
        layout = candidate;
        break;
      }
    }
    // Five nonzero rotations provide a bounded, always-valid fallback.
    if (!layout) {
      for (let offset = 1; offset < ids.length; offset++) {
        const candidate = [...ids.slice(offset), ...ids.slice(0, offset)];
        if (!layouts.some(previous => previous.every((id, index) => id === candidate[index]))) {
          layout = candidate;
          break;
        }
      }
    }
    layouts.push(layout);
  }
  return layouts;
}

/**
 * Round is 1-based (1–5). Use a shared string such as "daily-2026-11-02"
 * for a daily challenge, or a new random seed for a fresh adventure.
 * A sequence may revisit a buddy, but never twice in a row.
 */
export function createRound({ mode: modeId = 'curious', round = 1, seed = 1, ease = 0 } = {}) {
  if (!Object.hasOwn(MODES, modeId)) throw new RangeError('Unknown memory difficulty.');
  if (!Number.isInteger(round) || round < 1 || round > 5) throw new RangeError('Memory round must be an integer from 1 to 5.');
  if (!['string', 'number'].includes(typeof seed) || (typeof seed === 'number' && !Number.isFinite(seed))) {
    throw new TypeError('Memory seed must be a string or a finite number.');
  }
  if (!Number.isInteger(ease) || ease < 0 || ease > 2) throw new RangeError('Memory ease must be 0, 1 or 2.');
  const settings = MODES[modeId];
  const initialLayout = BUDDIES.map(buddy => buddy.id);
  const random = randomFor(`${seed}|${modeId}|sequence|${round}`);
  const sequence = [];
  // A fresh adventure can ease a trail by up to two friends (never below three); a shorter trail is the start of the longer one.
  for (let index = 0; index < Math.max(3, settings.lengths[round - 1] - ease); index++) {
    const choices = initialLayout.filter(id => id !== sequence.at(-1));
    sequence.push(choices[Math.floor(random() * choices.length)]);
  }
  const layout = shiftedLayouts(initialLayout, randomFor(`${seed}|${modeId}|layouts`), round).at(-1);
  const rule = settings.reverseRounds.includes(round) ? 'reverse' : 'echo';
  return {
    mode: modeId, round, sequence, initialLayout, layout, rule,
    answer: rule === 'reverse' ? [...sequence].reverse() : [...sequence],
    watchMs: settings.watchMs,
  };
}

/** Five perfect rounds earn 500 sparks. Longer trails forgive a little more. */
export function scoreRound({ length, mistakes = 0, peeks = 0 } = {}) {
  if (!Number.isInteger(length) || length < 1 ||
    !Number.isInteger(mistakes) || mistakes < 0 ||
    !Number.isInteger(peeks) || peeks < 0) {
    throw new RangeError('Scoring needs a positive trail length and nonnegative whole-number mistakes and peeks.');
  }
  return Math.max(0, 100 - mistakes * Math.ceil(60 / length) - peeks * 20);
}

// ---- An adventure under way: kept in the save's `active` field so Back, a reload or a dropped tab loses nothing.
// Only what cannot be rebuilt is kept: the trail and the shuffle come back from the seed, so a saved round can never
// hold a different board. `phase` is 'watch' (the trail is shown again, as after a pause), 'recall' (carry on at
// `cursor`, with no second look) or 'done' (the round is scored; the next one is waiting).
const whole = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
const TIERS = ['easy', 'medium', 'hard'];
export function saveRound({ day, mode: modeId, seed, daily = false, archive = false, climb = null, round, phase, cursor = 0, score = 0, mistakes = 0, peeks = 0, strain = 0, ease = 0, perfect = false, reverse = false, friends = null }) {
  return { v: 1, day, mode: modeId, seed, daily: Boolean(daily), archive: Boolean(archive), climb: climb ? { tier: climb.tier, index: climb.index, count: climb.count, daily: Boolean(climb.daily), step: climb.step } : null, round, phase, cursor: phase === 'recall' ? cursor : 0, score, mistakes, peeks, strain, ease, perfect: Boolean(perfect), reverse: Boolean(reverse), friends };
}
/**
 * Read a saved adventure back, or null when it is missing, damaged, or a daily or ladder trail from another day
 * (yesterday's half-played daily is never today's). Archive and practice adventures keep; the page decides where they fit.
 */
export function loadRound(raw, today) {
  const s = raw;
  if (!s || typeof s !== 'object' || s.v !== 1 || !Object.hasOwn(MODES, s.mode) || typeof s.seed !== 'string' || s.seed.length > 120) return null;
  if (typeof s.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.day) || !whole(s.round, 5) || s.round < 1 || !['watch', 'recall', 'done'].includes(s.phase)) return null;
  const daily = s.daily === true, archive = daily && s.archive === true;
  let climb = null;
  if (s.climb && !archive) {
    const c = s.climb;
    if (typeof c !== 'object' || !TIERS.includes(c.tier) || !whole(c.index, 100000) || !whole(c.step, 100000) || Boolean(c.daily) !== daily) return null;
    climb = { tier: c.tier, index: c.index, count: Number.isFinite(c.count) ? c.count : Infinity, daily, step: c.step };
  }
  if (!archive && (daily || climb) && s.day !== today) return null;
  const practice = !daily && !climb;
  if (!s.seed.startsWith(daily ? `daily:${s.day}` : climb ? `climb:${s.day}:${climb.tier}:${climb.index}` : 'fresh:')) return null;
  const done = s.phase === 'done', ease = s.ease === 1 && practice ? 1 : 0;
  if (done && s.round === 5) return null;
  const length = createRound({ mode: s.mode, round: s.round, seed: s.seed, ease }).answer.length;
  if (!whole(s.cursor, length - 1) || !whole(s.score, (s.round - (done ? 0 : 1)) * 100) || !whole(s.mistakes, 9999) || !whole(s.peeks, 9999) || !whole(s.strain, 5)) return null;
  let friends = null;
  if (practice && Array.isArray(s.friends) && s.friends.length === 6 && s.friends.every(row => Array.isArray(row) && row.length >= 2 && row.slice(0, 2).every(text => typeof text === 'string' && text.length > 0 && text.length <= 40))) friends = s.friends.map(row => [row[0], row[1]]);
  return { day: s.day, mode: s.mode, seed: s.seed, daily, archive, climb, round: s.round, phase: s.phase, cursor: s.phase === 'recall' ? s.cursor : 0, score: s.score, mistakes: s.mistakes, peeks: s.peeks, strain: s.strain, ease, perfect: s.perfect === true, reverse: s.reverse === true, friends };
}
