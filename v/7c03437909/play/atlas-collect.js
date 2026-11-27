// Lexicon Atlas collector (2.28): reads the saves the games already keep and adds the words in them to the atlas.
// It never edits a game's script or save, and it only ever adds words. Loaded on demand by the Atlas page.
//   Word Builder   ziggle-vocab-v1          every word in the player's list (cards)
//   Word Cloud     ziggle-weaver-v1         every solved cloud (solved ids → the answer)
//   Word Search    ziggle-word-puzzles-v1   every word found in a search puzzle (sessions.*.found)
//   Letter Lock    ziggle-letter-lock-v1    every lock the player opened (the word is worked out from the game's day or number)
//   Practice       ziggle-library-v1        the last 256 words shown in practice puzzles (recent)
// Crossword saves only keep the letters typed into the grid, not the words, so a crossword adds none until its words are found elsewhere.
import { weaveById, weaveCount } from './weaver-engine.js';
import { answerAt, answerForLevel } from './lock-engine.js';
import { dailyNumber } from './hub-core.js';
import { ATLAS_KEY, addWords, cleanWord, dateKey, dayOf, loadAtlas, saveAtlas } from './atlas-core.js';

export const SAVE_SOURCES = Object.freeze({ vocab: 'ziggle-vocab-v1', weaver: 'ziggle-weaver-v1', words: 'ziggle-word-puzzles-v1', lock: 'ziggle-letter-lock-v1', library: 'ziggle-library-v1' });
const plain = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const DATED = /^c?(\d{4}-\d{2}-\d{2})(?::(easy|medium|hard))?/;

/** The word a saved Letter Lock game was playing, or '' if it cannot be worked out. */
export function lockTarget(key, game) {
  if (typeof game.libraryWord === 'string' && /^[A-Z]{5}$/.test(game.libraryWord)) return game.libraryWord;
  if (Number.isInteger(game.answer)) return answerAt(game.answer);
  const dated = DATED.exec(key);
  if (dated && !key.startsWith('c')) return answerForLevel(dailyNumber(dated[1]), game.tier || dated[2] || 'medium');
  return '';
}

/** Every { word, from, first } the saves hold. Pure: pass the parsed saves and today's date; nothing is read or written here. */
export function collectFromSaves(saves = {}, today = dateKey()) {
  const found = [], add = (word, from, first) => { const clean = cleanWord(word); if (clean) found.push({ word: clean, from, first: first || today }); };

  if (plain(saves.vocab) && plain(saves.vocab.cards)) {
    for (const [word, card] of Object.entries(saves.vocab.cards)) add(word, 'vocab', dayOf(plain(card) ? Number(card.last) : 0));
  }
  if (plain(saves.weaver) && Array.isArray(saves.weaver.solved)) {
    const count = weaveCount();
    for (const id of saves.weaver.solved) if (Number.isInteger(id) && id >= 0 && id < count) add(weaveById(id).answer, 'cloud', today); // ids from practice content (1,000,000 and up) are left to the Practice list
  }
  if (plain(saves.words) && plain(saves.words.sessions)) {
    for (const [key, session] of Object.entries(saves.words.sessions)) {
      if (!key.startsWith('search:') || !plain(session) || !Array.isArray(session.found)) continue;
      for (const word of session.found) add(word, 'search', today);
    }
  }
  if (plain(saves.lock) && plain(saves.lock.games)) {
    for (const [key, game] of Object.entries(saves.lock.games)) {
      if (!plain(game) || !Array.isArray(game.rows)) continue;
      let target = '';
      try { target = lockTarget(key, game); } catch { target = ''; }
      if (target && game.rows.includes(target)) add(target, 'lock', DATED.exec(key)?.[1] || today);
    }
  }
  if (plain(saves.library) && Array.isArray(saves.library.recent)) {
    for (const word of saves.library.recent) if (typeof word === 'string' && /^[A-Z]{3,13}$/.test(word)) add(word, 'library', today);
  }
  return found;
}

const readJson = (storage, key) => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } };
/**
 * Read the games' saves from `storage`, add their words to the atlas, and keep the atlas if anything joined.
 * Returns { atlas, fresh } where fresh is the number of words that were new this time. Never throws.
 */
export function collectAtlas(storage = globalThis.localStorage, today = dateKey()) {
  const before = loadAtlas(storage);
  try {
    const saves = Object.fromEntries(Object.entries(SAVE_SOURCES).map(([name, key]) => [name, readJson(storage, key)]));
    const atlas = loadAtlas(storage), had = JSON.stringify(atlas.words);
    const fresh = addWords(atlas, collectFromSaves(saves, today));
    if (JSON.stringify(atlas.words) !== had) saveAtlas(storage, atlas);
    return { atlas, fresh };
  } catch { return { atlas: before, fresh: 0 }; }
}
export { ATLAS_KEY };
