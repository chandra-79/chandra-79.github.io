// Lexicon Atlas (2.28): the pure logic of a personal map of English. No page needed, so it is tested on its own (atlas.test.js).
// The save ('ziggle-atlas-v1') is { words: { "<word>": { first: "YYYY-MM-DD", from: ["vocab", "cloud", ...] } } }.
// Words only ever join the atlas: nothing here removes one, and the merge in hub-core.js keeps the earliest day and every place met.
// Meeting words never touches the streak, points or trophies (CLAUDE.md rule 5).
export const ATLAS_KEY = 'ziggle-atlas-v1';
export const GOAL = 5000;
export const MAX_WORDS = 12000;
export const SOURCE_NAMES = Object.freeze({ vocab: 'Word Builder', cloud: 'Word Cloud', search: 'Word Search', lock: 'Letter Lock', library: 'Practice puzzles', today: 'Word of the day' });
/** Marks on the way to the goal: the bar names the next one. */
export const MILESTONES = Object.freeze([10, 25, 50, 100, 250, 500, 1000, 2000, 3000, 4000, 5000]);

const WORD = /^[a-z]{2,32}$/, DAY = /^\d{4}-\d{2}-\d{2}$/, SOURCE = /^[a-z]{2,12}$/;
/** A word as the atlas keeps it: lowercase letters only, or '' when it is not a word we can keep. */
export const cleanWord = text => { const word = String(text ?? '').trim().toLowerCase(); return WORD.test(word) ? word : ''; };
export const dateKey = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
/** The local day a timestamp (milliseconds) falls on, or '' if it is not one. */
export const dayOf = ms => (Number.isFinite(ms) && ms > 0 ? dateKey(new Date(ms)) : '');

const plain = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
/** A safe copy of a saved atlas. Bad entries are dropped, good ones are kept as they are. */
export function normalizeAtlas(value) {
  const words = {};
  if (plain(value) && plain(value.words)) {
    for (const [raw, entry] of Object.entries(value.words)) {
      const word = cleanWord(raw);
      if (!word || !plain(entry) || Object.keys(words).length >= MAX_WORDS) continue;
      const from = Array.isArray(entry.from) ? [...new Set(entry.from.filter(source => typeof source === 'string' && SOURCE.test(source)))].slice(0, 8) : [];
      words[word] = { first: DAY.test(entry.first) ? entry.first : '', from };
    }
  }
  return { words };
}
export const wordCount = atlas => Object.keys(atlas.words).length;

/** Add one word met in `source` on `first`. Returns 'new' for a new word, 'more' when only a new source or an earlier day was added, '' for no change. */
export function addWord(atlas, raw, source, first) {
  const word = cleanWord(raw), day = DAY.test(first) ? first : '';
  if (!word || !SOURCE.test(source)) return '';
  const have = atlas.words[word];
  if (!have) { if (wordCount(atlas) >= MAX_WORDS) return ''; atlas.words[word] = { first: day, from: [source] }; return 'new'; }
  let changed = false;
  if (!have.from.includes(source)) { have.from.push(source); changed = true; }
  if (day && (!have.first || day < have.first)) { have.first = day; changed = true; }
  return changed ? 'more' : '';
}
/** Add many { word, from, first } records; returns how many words were new. */
export function addWords(atlas, found) {
  let fresh = 0;
  for (const item of found) if (addWord(atlas, item.word, item.from, item.first) === 'new') fresh++;
  return fresh;
}

/** The words met most recently: newest day first, and within a day the ones added last. */
export function latestWords(atlas, count = 12) {
  return Object.entries(atlas.words).map(([word, entry], order) => ({ word, first: entry.first, from: entry.from, order }))
    .sort((a, b) => (b.first || '').localeCompare(a.first || '') || b.order - a.order).slice(0, count);
}
/** How many of a region's words are lit, and which. */
export function regionLit(atlas, words) { const lit = words.filter(word => atlas.words[word]); return { lit: lit.length, total: words.length, words: lit }; }
/** The next mark on the way to the goal (the goal itself once reached). */
export const nextMilestone = count => MILESTONES.find(mark => mark > count) ?? GOAL;
export const percent = count => Math.min(100, Math.floor((100 * count) / GOAL));
/** True when a clue would spell out (or nearly spell out) its word, so it is not shown for a word not met yet. */
export const givesAway = (clue, word) => Boolean(clue) && new RegExp(word.slice(0, Math.max(3, word.length - 3)), 'i').test(clue);
/** A dim silhouette for a word not met yet: its length, never its letters. */
export const silhouette = word => '•'.repeat(Math.min(word.length, 14));
/** How many words each place has given, most first. */
export function sourceTotals(atlas) {
  const totals = {};
  for (const entry of Object.values(atlas.words)) for (const source of entry.from) totals[source] = (totals[source] || 0) + 1;
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}
/** Read the atlas from a storage object, never throwing. */
export function loadAtlas(storage) {
  try { return normalizeAtlas(JSON.parse(storage?.getItem(ATLAS_KEY) || 'null')); } catch { return normalizeAtlas(null); }
}
/** Save it. Returns false when the browser will not keep it. */
export function saveAtlas(storage, atlas) {
  try { storage.setItem(ATLAS_KEY, JSON.stringify({ words: atlas.words })); return true; } catch { return false; }
}
