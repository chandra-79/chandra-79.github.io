// Lexicon Atlas regions (2.28): which words belong together, built from the word lists Ziggle already ships, so no new word data is added.
//   Word Cloud categories  (weaver-words*.js)      29 regions
//   Word game themes       (word-engine, banks)     16 regions: the easy, medium and hard lists of each theme together
//   Word Builder levels    (vocab-data.js)           3 regions
//   Letter Lock            (letter-lock-words.js)    6 regions: the answers in alphabetical bands
// Words met anywhere else (practice puzzles) gather in "Wider world", which the page builds from the atlas itself.
// Loaded on demand by the Atlas page. Pure, so atlas.test.js can check it.
import { WEAVES } from './weaver-words.js';
import { MORE_WEAVES } from './weaver-words-2.js';
import { THIRD_WEAVES } from './weaver-words-3.js';
import { WORD_THEMES } from './word-engine.js';
import { MEDIUM } from './word-bank-medium.js';
import { HARD } from './word-bank-hard.js';
import { ANSWERS } from './letter-lock-words.js';
import { VOCAB } from './vocab-data.js';
import { TIER_NAMES, POS_NAMES } from './vocab-core.js';
import { cleanWord } from './atlas-core.js';

export const GROUPS = Object.freeze([
  { id: 'cloud', title: 'Word Cloud', note: 'The words behind the clues' },
  { id: 'theme', title: 'Word search and crossword themes', note: 'Sixteen themed word lists' },
  { id: 'vocab', title: 'Word Builder', note: 'Three levels of stretching words' },
  { id: 'lock', title: 'Letter Lock', note: 'Five-letter words, A to Z' },
  { id: 'more', title: 'Wider world', note: 'Words met in practice puzzles' },
]);
const CATEGORY_EMOJI = { Feelings: '😊', Character: '🦁', Mind: '🧠', Time: '⏳', Speed: '⚡', Size: '📏', Light: '💡', Sound: '🔊', Things: '🧸', Art: '🎨', Nature: '🌿', Weather: '⛅', Earth: '🌍', Space: '🪐', Science: '🔬', Play: '🎲', Sport: '🏅', Music: '🎵', Travel: '✈️', Home: '🏠', Food: '🍋', Animals: '🦊', Places: '📍', Adventure: '🧭', Making: '🔨', Amounts: '🔢', Actions: '🏃', Luck: '🍀', Words: '💬' };
const TIER_EMOJI = ['🌱', '🌿', '🌳'];
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const parseBank = text => (text || '').split('|').filter(Boolean).map(item => { const at = item.indexOf(':'); return [item.slice(0, at), item.slice(at + 1)]; });
const sorted = set => [...set].sort();

/** Build every region and a lookup for what each word means. The shape is the same on every device. */
export function buildRegions() {
  const regions = [], clues = new Map();
  const note = (word, clue, rank) => { const have = clues.get(word); if (!have || rank < have.rank) clues.set(word, { clue, rank }); };

  const categories = new Map();
  for (const [answer, category, meanings] of [...WEAVES, ...MORE_WEAVES, ...THIRD_WEAVES]) {
    const word = cleanWord(answer); if (!word) continue;
    if (!categories.has(category)) categories.set(category, new Set());
    categories.get(category).add(word); note(word, meanings[0], 2);
  }
  for (const [category, words] of categories) regions.push({ id: `cloud-${slug(category)}`, group: 'cloud', name: category, emoji: CATEGORY_EMOJI[category] || '☁️', words: sorted(words) });

  for (const theme of WORD_THEMES) {
    const words = new Set();
    for (const { answer, clue } of theme.words) { const word = cleanWord(answer); if (word) { words.add(word); note(word, clue, 3); } }
    for (const bank of [MEDIUM, HARD]) for (const [answer, clue] of parseBank(bank[theme.id])) { const word = cleanWord(answer); if (word) { words.add(word); note(word, clue, 3); } }
    regions.push({ id: `theme-${theme.id}`, group: 'theme', name: theme.title, emoji: theme.emoji, color: theme.color, words: sorted(words) });
  }

  const tiers = [new Set(), new Set(), new Set()];
  for (const row of VOCAB) { const word = cleanWord(row[0]); if (!word) continue; tiers[Math.max(0, Math.min(2, row[6] - 1))].add(word); note(word, `${POS_NAMES[row[1]] || 'word'}: ${row[2]}`, 1); }
  tiers.forEach((set, i) => regions.push({ id: `vocab-${i + 1}`, group: 'vocab', name: `Level ${i + 1}`, sub: TIER_NAMES[i], emoji: TIER_EMOJI[i], words: sorted(set) }));

  const lock = sorted(new Set(ANSWERS.map(cleanWord).filter(Boolean))), bands = 6, size = Math.ceil(lock.length / bands);
  for (let i = 0; i < bands; i++) {
    const words = lock.slice(i * size, (i + 1) * size); if (!words.length) continue;
    regions.push({ id: `lock-${i + 1}`, group: 'lock', name: `${words[0][0].toUpperCase()}–${words.at(-1)[0].toUpperCase()}`, emoji: '🔐', words });
    for (const word of words) note(word, 'A five-letter word from Letter Lock.', 4);
  }
  const all = new Set(regions.flatMap(region => region.words));
  return { regions, total: all.size, clue: word => clues.get(word)?.clue || '', known: word => all.has(word) };
}
