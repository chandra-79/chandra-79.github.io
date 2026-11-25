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
