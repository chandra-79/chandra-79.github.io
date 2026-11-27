// Word Builder logic (2.23): pure functions, no page needed. Words come from vocab-data.js (Open English WordNet, CC BY 4.0).
// Entry: [word, part of speech, definition, example, synonyms, opposites, tier].
// Daily picks and quiz questions are seeded, so everyone gets the same word of the day and the same first round (rule 13: seeded
// Fisher–Yates, never a random sort).
export const POS_NAMES = Object.freeze({ n: 'noun', v: 'verb', a: 'adjective', r: 'adverb' });
export const TIER_NAMES = Object.freeze(['Everyday, but worth sharpening', 'Handy for reading and writing', 'Words that stretch you']);
const DAY = 86_400_000;

/** mulberry32: a tiny seeded random number generator (0 to 1). */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Fisher–Yates shuffle of a copy, driven by the seeded generator. */
export function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
/** Days since 1 Jan 1970 for a "YYYY-MM-DD" key (UTC, so it never depends on the device's zone). */
export const dayNumber = key => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY);
const hash = text => { let h = 2166136261; for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/** The word of the day: the whole list in one fixed shuffled order, one word a day, then round again. */
export function wordOfDay(list, key) {
  if (!list.length) return null;
  const order = shuffled(list.map((_, i) => i), seeded(0x5A1D));
  return list[order[((dayNumber(key) % list.length) + list.length) % list.length]];
}
export const asEntry = row => ({ word: row[0], pos: row[1], def: row[2], example: row[3], syn: row[4], ant: row[5], tier: row[6] });

/** The example with the word hidden ("_____"), or '' if the word does not appear in it (inflected forms are matched by their stem). */
export function blank(example, word) {
  if (!example) return '';
  const stem = word.slice(0, Math.max(4, word.length - 3)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${stem}\\w*`, 'i');
  return pattern.test(example) ? example.replace(pattern, '_____') : '';
}
const sentence = text => text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?…]$/.test(text) ? '' : '.');
export { sentence };

/**
 * One question. kind: 'meaning' (word shown, pick what it means), 'word' (meaning shown, pick the word), 'blank' (a sentence with a gap).
 * Four choices, shuffled; the other three come from the same part of speech where possible.
 */
export function makeQuestion(list, entry, kind, random) {
  const others = list.filter(row => row[0] !== entry.word);
  const same = others.filter(row => row[1] === entry.pos), pool = shuffled(same.length >= 3 ? same : others, random);
  const picks = [];
  for (const row of pool) { if (!picks.some(p => p[0] === row[0] || (kind !== 'word' && p[2] === row[2])) && row[2] !== entry.def) picks.push(row); if (picks.length === 3) break; }
  const choices = shuffled([asEntry([entry.word, entry.pos, entry.def, entry.example, entry.syn, entry.ant, entry.tier]), ...picks.map(asEntry)], random);
  const prompt = kind === 'meaning' ? entry.word : kind === 'word' ? sentence(entry.def) : blank(entry.example, entry.word);
  return { kind, word: entry.word, prompt, choices: choices.map(choice => ({ word: choice.word, label: kind === 'word' || kind === 'blank' ? choice.word : sentence(choice.def) })), answer: choices.findIndex(choice => choice.word === entry.word), entry };
}

/**
 * A round of questions. Words due for review come first, then new words from the chosen tier, topped up from any tier.
 * `cards` is the saved deck ({ word: { box, due, seen, right } }); the round is seeded by the date and the round number.
 */
export function buildRound(list, { cards = {}, tier = 0, key, round = 0, size = 5, now = Date.now() } = {}) {
  const random = seeded(hash(`${key}:${round}`));
  const rows = list.map(asEntry);
  const due = rows.filter(row => cards[row.word] && cards[row.word].due <= now).sort((a, b) => cards[a.word].due - cards[b.word].due);
  const fresh = shuffled(rows.filter(row => !cards[row.word] && (!tier || row.tier === tier)), random);
  const rest = shuffled(rows.filter(row => !cards[row.word] && tier && row.tier !== tier), random);
  const chosen = [...due, ...fresh, ...rest].slice(0, size);
  const kinds = ['meaning', 'word', 'blank'];
  return chosen.map((entry, i) => {
    let kind = kinds[(i + Math.floor(random() * 3)) % 3];
    if (kind === 'blank' && !blank(entry.example, entry.word)) kind = i % 2 ? 'word' : 'meaning';
    // A meaning that contains the word (or its stem) would give it away: ask it the other way round.
    if (kind === 'word' && new RegExp(entry.word.slice(0, Math.max(4, entry.word.length - 3)), 'i').test(entry.def)) kind = 'meaning';
    return makeQuestion(list, entry, kind, random);
  });
}

/** Mastery of the saved deck: share of cards in the top two review boxes (the same measure the other trainers use). */
export const known = cards => Object.values(cards).filter(card => card.box >= 4).length;
export const dateKey = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
