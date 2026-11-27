// Ziggle emoji and flags learner: pure question logic (no DOM), tested in unicode.test.js.
// Data arrives as plain arrays so the page can load emoji groups only when a level needs them.

/** Emoji versions and the year each was released, for history questions. */
export const EMOJI_YEARS = Object.freeze({ 0.6: 2010, 0.7: 2014, 1: 2015, 2: 2015, 3: 2016, 4: 2016, 5: 2017, 11: 2018, 12: 2019, 12.1: 2019, 13: 2020, 13.1: 2020, 14: 2021, 15: 2022, 15.1: 2023, 16: 2024, 17: 2025 });
export const yearOf = version => EMOJI_YEARS[version] ?? null;
export const versionLabel = version => `Emoji ${Number.isInteger(version) ? version.toFixed(1) : version}${yearOf(version) ? ` (${yearOf(version)})` : ''}`;

export const PASS_SCORE = 8;
export const ROUND = 10;
export const LEVELS = Object.freeze([
  { n: 1, name: 'Faces and hearts', groups: ['smileys-emotion'], modes: ['name', 'pick'], blurb: 'Smiles, frowns and every heart. Learn their official names.' },
  { n: 2, name: 'Hands and people', groups: ['people-body'], modes: ['name', 'pick'], simple: true, blurb: 'Waves, thumbs, jobs and people doing things.' },
  { n: 3, name: 'Animals and food', groups: ['animals-nature', 'food-drink'], modes: ['name', 'pick', 'group'], blurb: 'From octopus to oyster, and which family each belongs to.' },
  { n: 4, name: 'Travel, play and things', groups: ['travel-places', 'activities', 'objects'], modes: ['name', 'pick', 'group'], blurb: 'Places, sports, tools and everyday objects.' },
  { n: 5, name: 'Flags of the world', flags: ['Europe', 'North America', 'South America'], modes: ['flag', 'country'], blurb: 'Flags from Europe and the Americas, drawn by Ziggle.' },
  { n: 6, name: 'Codes and sequences', groups: ['smileys-emotion', 'animals-nature', 'food-drink', 'people-body'], modes: ['code', 'build'], blurb: 'Every emoji has a number, and some are built from others.' },
  { n: 7, name: 'Emoji history', groups: ['smileys-emotion', 'people-body', 'animals-nature', 'food-drink', 'objects'], modes: ['first'], blurb: 'Which arrived first? From the 2010 originals to 2023’s newcomers.' },
  { n: 8, name: 'Symbols, arrows and maths', symbols: true, modes: ['symbol'], blurb: 'Arrows, maths, money, music and keyboard symbols, by their Unicode names.' },
  { n: 9, name: 'All the flags', flags: ['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania', ''], modes: ['flag', 'country', 'capital'], blurb: 'Every flag Ziggle draws, with capitals.' },
  { n: 10, name: 'Mastery', groups: ['smileys-emotion', 'people-body', 'animals-nature', 'food-drink', 'travel-places', 'activities', 'objects', 'symbols'], flags: ['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania', ''], symbols: true, modes: ['name', 'pick', 'code', 'build', 'first', 'flag', 'capital', 'symbol'], blurb: 'Anything at all, in any order.' },
]);
export const levelInfo = n => LEVELS[Math.max(1, Math.min(LEVELS.length, n)) - 1];

export function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6d2b79f5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (list, random) => list[Math.floor(random() * list.length)];
function shuffle(list, random) { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
/** `count` distinct items other than `answer`, preferring `near` ones (same subgroup, continent or family). */
function distractors(answer, pool, near, random, count = 3, same = (a, b) => a === b) {
  const close = shuffle(pool.filter(item => !same(item, answer) && near(item)), random);
  const far = shuffle(pool.filter(item => !same(item, answer) && !near(item)), random);
  return [...close, ...far].slice(0, count);
}

// ---- Emoji helpers ----------------------------------------------------------------
/** An emoji record: [emoji, name, hexcode, version, subgroup]. */
export const emojiId = record => `e:${record[2]}`;
export const codeLabel = hex => hex.split('-').filter(part => part !== 'FE0F').map(part => `U+${part}`).join(' ');
export const isSequence = record => record[2].includes('200D');
/** The emoji a ZWJ sequence is built from, as characters. */
export function sequenceParts(record) {
  return record[2].split('-200D-').map(part => String.fromCodePoint(...part.split('-').filter(code => code !== 'FE0F').map(code => parseInt(code, 16))));
}

// ---- Questions ------------------------------------------------------------------------
// Each question: { id, mode, prompt: {kind, value, label?}, options: [{value, kind, label}], answer: index, explain }
function nameQuestion(record, pool, random) {
  const others = distractors(record, pool, item => item[4] === record[4], random, 3, (a, b) => a[1] === b[1]);
  const options = shuffle([record, ...others], random);
  return { id: emojiId(record), mode: 'name', prompt: { kind: 'emoji', value: record[0] }, question: 'What is this emoji called?', options: options.map(item => ({ kind: 'text', value: item[1] })), answer: options.indexOf(record), explain: `${record[0]} ${record[1]} · ${codeLabel(record[2])} · ${versionLabel(record[3])}` };
}
function pickQuestion(record, pool, random) {
  const others = distractors(record, pool, item => item[4] === record[4], random, 3, (a, b) => a[0] === b[0]);
  const options = shuffle([record, ...others], random);
  return { id: emojiId(record), mode: 'pick', prompt: { kind: 'text', value: record[1] }, question: 'Which emoji is this?', options: options.map(item => ({ kind: 'emoji', value: item[0], label: `Option: ${item[1]}` })), answer: options.indexOf(record), explain: `${record[0]} ${record[1]} · ${codeLabel(record[2])}` };
}
function codeQuestion(record, pool, random) {
  const others = distractors(record, pool, item => item[4] === record[4], random, 3, (a, b) => a[0] === b[0]);
  const options = shuffle([record, ...others], random);
  return { id: `${emojiId(record)}:code`, mode: 'code', prompt: { kind: 'code', value: codeLabel(record[2]) }, question: 'Which emoji has this code?', options: options.map(item => ({ kind: 'emoji', value: item[0], label: `Option: ${item[1]}` })), answer: options.indexOf(record), explain: `${codeLabel(record[2])} is ${record[0]} ${record[1]}.` };
}
function groupQuestion(record, groupId, groups, random) {
  const names = Object.fromEntries(groups.map(group => [group.id, group.name]));
  const others = shuffle(groups.filter(group => group.id !== groupId), random).slice(0, 3).map(group => group.id);
  const options = shuffle([groupId, ...others], random);
  return { id: `${emojiId(record)}:group`, mode: 'group', prompt: { kind: 'emoji', value: record[0] }, question: 'Which Unicode group is it filed under?', options: options.map(id => ({ kind: 'text', value: names[id] })), answer: options.indexOf(groupId), explain: `${record[0]} ${record[1]} lives in ${names[groupId]}.` };
}
function buildQuestion(record, pool, random) {
  const parts = sequenceParts(record);
  const singles = pool.filter(item => !isSequence(item) && !item[2].includes('-'));
  const wrongs = [];
  for (let tries = 0; wrongs.length < 3 && tries < 40; tries++) {
    const swap = Math.floor(random() * parts.length);
    const replacement = pick(singles, random)[0];
    const combo = parts.map((part, i) => (i === swap ? replacement : part)).join(' + ');
    if (!parts.includes(replacement) && !wrongs.includes(combo)) wrongs.push(combo);
  }
  const correct = parts.join(' + ');
  const options = shuffle([correct, ...wrongs], random);
  return { id: `${emojiId(record)}:build`, mode: 'build', prompt: { kind: 'emoji', value: record[0] }, question: `Which emoji are joined to make ${record[1]}?`, options: options.map(value => ({ kind: 'emoji-text', value })), answer: options.indexOf(correct), explain: `${record[0]} is ${correct}, glued with invisible zero-width joiners (U+200D).` };
}
function firstQuestion(pool, random) {
  for (let tries = 0; tries < 50; tries++) {
    const a = pick(pool, random), b = pick(pool, random);
    if (yearOf(a[3]) && yearOf(b[3]) && yearOf(a[3]) !== yearOf(b[3])) {
      const older = yearOf(a[3]) < yearOf(b[3]) ? a : b;
      const options = shuffle([a, b], random);
      return { id: `${emojiId(older)}:first`, mode: 'first', prompt: { kind: 'text', value: 'Which came first?' }, question: 'Which of these joined Unicode earlier?', options: options.map(item => ({ kind: 'emoji', value: item[0], label: `Option: ${item[1]}` })), answer: options.indexOf(older), explain: `${a[0]} ${a[1]}: ${versionLabel(a[3])} · ${b[0]} ${b[1]}: ${versionLabel(b[3])}` };
    }
  }
  return null;
}
function flagQuestion(flag, flags, random, mode) {
  const near = item => item.continent && item.continent === flag.continent;
  const others = distractors(flag, flags, near, random, 3, (a, b) => a.code === b.code);
  const options = shuffle([flag, ...others], random);
  const answer = options.indexOf(flag);
  const note = flag.note ? ` ${flag.note}` : '';
  if (mode === 'country') return { id: `f:${flag.code}:country`, mode, prompt: { kind: 'text', value: flag.name }, question: 'Which flag is this?', options: options.map(item => ({ kind: 'flag', value: item.code, label: 'Flag option' })), answer, explain: `${flag.name}: capital ${flag.capital}.${note}` };
  if (mode === 'capital') {
    const capitals = options.map(item => item.capital);
    return { id: `f:${flag.code}:capital`, mode, prompt: { kind: 'flag', value: flag.code }, question: 'What is the capital?', options: capitals.map(value => ({ kind: 'text', value })), answer, explain: `${flag.name}: ${flag.capital}.${note}` };
  }
  return { id: `f:${flag.code}`, mode: 'flag', prompt: { kind: 'flag', value: flag.code }, question: 'Whose flag is this?', options: options.map(item => ({ kind: 'text', value: item.name })), answer, explain: `${flag.name}${flag.continent ? ` (${flag.continent})` : ''}: capital ${flag.capital}.${note}` };
}
function symbolQuestion(symbol, symbols, random) {
  const others = distractors(symbol, symbols, item => item[3] === symbol[3], random, 3, (a, b) => a[0] === b[0]);
  const options = shuffle([symbol, ...others], random);
  return { id: `s:${symbol[2]}`, mode: 'symbol', prompt: { kind: 'text', value: symbol[1] }, question: 'Which symbol has this Unicode name?', options: options.map(item => ({ kind: 'symbol', value: item[0], label: `Option: ${item[1]}` })), answer: options.indexOf(symbol), explain: `${symbol[0]} is ${symbol[1]}, U+${symbol[2]} (${symbol[3].toLowerCase()}).` };
}

/**
 * Build a round of questions for a level.
 * data: { emoji: {groupId: records[]}, groups: [{id,name}], flags: [...], symbols: [...] }
 * review: ids due for spaced review, asked first when they belong to this level (up to reviewShare of the round).
 */
export function buildRound(n, data, { seed = 1, count = ROUND, review = [], reviewShare = 0.5 } = {}) {
  const info = levelInfo(n), random = seeded(seed);
  const emojiPool = (info.groups || []).flatMap(group => (data.emoji[group] || []).map(record => ({ record, group })));
  const usable = info.simple ? emojiPool.filter(item => !isSequence(item.record)) : emojiPool;
  const records = usable.map(item => item.record);
  const sequences = emojiPool.filter(item => isSequence(item.record) && sequenceParts(item.record).length <= 3);
  const flags = info.flags ? data.flags.filter(flag => info.flags.includes(flag.continent)) : [];
  const symbols = info.symbols ? data.symbols : [];
  const questions = [], used = new Set();
  const make = (mode) => {
    if (['name', 'pick', 'code', 'group'].includes(mode) && records.length >= 4) {
      const item = pick(usable, random);
      if (mode === 'name') return nameQuestion(item.record, records, random);
      if (mode === 'pick') return pickQuestion(item.record, records, random);
      if (mode === 'code') return codeQuestion(item.record, records, random);
      return groupQuestion(item.record, item.group, data.groups, random);
    }
    if (mode === 'build' && sequences.length) return buildQuestion(pick(sequences, random).record, records, random);
    if (mode === 'first' && records.length >= 2) return firstQuestion(records, random);
    if (['flag', 'country', 'capital'].includes(mode) && flags.length >= 4) return flagQuestion(pick(flags, random), flags, random, mode);
    if (mode === 'symbol' && symbols.length >= 4) return symbolQuestion(pick(symbols, random), symbols, random);
    return null;
  };
  // Spaced review first: rebuild due cards that belong to this level.
  for (const id of review) {
    if (questions.length >= Math.ceil(count * reviewShare)) break;
    const q = reviewQuestion(id, info, data, records, flags, symbols, random);
    if (q && !used.has(q.id)) { used.add(q.id); questions.push(q); }
  }
  for (let tries = 0; questions.length < count && tries < count * 20; tries++) {
    const q = make(info.modes[questions.length % info.modes.length]);
    if (q && !used.has(q.id)) { used.add(q.id); questions.push(q); }
  }
  return shuffle(questions, random);
}
function reviewQuestion(id, info, data, records, flags, symbols, random) {
  const [kind, code, mode] = id.split(':');
  if (kind === 'e') { const record = records.find(item => item[2] === code); if (!record) return null; if (mode === 'code') return codeQuestion(record, records, random); return info.modes.includes('pick') && random() < 0.5 ? pickQuestion(record, records, random) : info.modes.includes('name') ? nameQuestion(record, records, random) : null; }
  if (kind === 'f') { const flag = flags.find(item => item.code === code); return flag ? flagQuestion(flag, flags, random, mode || 'flag') : null; }
  if (kind === 's') { const symbol = symbols.find(item => item[2] === code); return symbol ? symbolQuestion(symbol, symbols, random) : null; }
  return null;
}
/** Modes whose answers feed spaced review (the others are one-off puzzles about an emoji). */
export const CARD_MODES = Object.freeze(['name', 'pick', 'code', 'flag', 'country', 'capital', 'symbol']);
/** A stable number for a date, so the Daily 10 is the same for everyone. */
export function dateSeed(date) { let h = 2166136261; for (const ch of `ziggle-unicode-${date}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Did a round pass? 8 of 10 or better. */
export const passed = (right, total = ROUND) => right >= Math.ceil((PASS_SCORE / ROUND) * total);
