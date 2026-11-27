// Sudoku saves use their own key so every other game's progress stays untouched.
import { SUDOKU_VARIANTS, SUDOKU_DIFFICULTIES } from './sudoku-engine.js';

export const SUDOKU_STORAGE_KEY = 'ziggle-sudoku-v1';
const MAX_SESSIONS = 400;
const MAX_LEVEL = 1_000_000;
// New players start on generation 2 practice puzzle 1 (level 201000, see sudoku-engine.js sudokuGeneration).
const DEFAULT_CURRENT = { variant: 'classic', difficulty: 'easy', level: 201_000 };
const record = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function validSudokuOptions(options) {
  return record(options) && SUDOKU_VARIANTS.includes(options.variant) && SUDOKU_DIFFICULTIES.includes(options.difficulty)
    && Number.isSafeInteger(options.level) && options.level >= 1 && options.level <= MAX_LEVEL;
}
export function sudokuKey(options) {
  if (!validSudokuOptions(options)) throw new TypeError('Choose a valid Sudoku variant, difficulty and level.');
  return `${options.variant}:${options.difficulty}:${options.level}`;
}
function validKey(key) {
  if (typeof key !== 'string' || key.length > 40) return false;
  const [variant, difficulty, level, extra] = key.split(':');
  return extra === undefined && validSudokuOptions({ variant, difficulty, level: Number(level) }) && String(Number(level)) === level;
}
function normalizeSession(value) {
  if (!record(value) || !Array.isArray(value.values) || ![36, 81].includes(value.values.length)) return null;
  const size = value.values.length === 36 ? 6 : 9;
  const values = value.values.map(item => Number.isInteger(item) && item >= 0 && item <= size ? item : 0);
  const notes = Array.isArray(value.notes) && value.notes.length === values.length
    ? value.notes.map(mask => Number.isInteger(mask) && mask >= 0 && mask < (1 << size) ? mask : 0) : values.map(() => 0);
  return {
    values, notes,
    ...(typeof value.attempt === 'string' ? { attempt: value.attempt } : {}),
    hintsUsed: Number.isSafeInteger(value.hintsUsed) && value.hintsUsed >= 0 ? value.hintsUsed : 3 - (Number.isInteger(value.hints) && value.hints >= 0 && value.hints <= 3 ? value.hints : 3),
    elapsed: Number.isFinite(value.elapsed) && value.elapsed >= 0 ? Math.min(31_536_000, Math.floor(value.elapsed)) : 0,
    hints: Number.isInteger(value.hints) && value.hints >= 0 && value.hints <= 3 ? value.hints : 3,
  };
}
export function normalizeSudokuProgress(value) {
  const result = { version: 1, current: { ...DEFAULT_CURRENT }, sessions: {}, wins: [], showMistakes: true };
  if (!record(value) || value.version !== 1) return result;
  if (validSudokuOptions(value.current)) result.current = { variant: value.current.variant, difficulty: value.current.difficulty, level: value.current.level };
  if (record(value.sessions)) {
    for (const [key, session] of Object.entries(value.sessions).slice(-MAX_SESSIONS)) {
      const normalized = validKey(key) && normalizeSession(session);
      if (normalized) result.sessions[key] = normalized;
    }
  }
  if (Array.isArray(value.wins)) result.wins = [...new Set(value.wins.filter(validKey))].slice(-2000);
  result.showMistakes = value.showMistakes !== false;
  return result;
}
export function loadSudokuProgress(storage = globalThis.localStorage) {
  try { return normalizeSudokuProgress(JSON.parse(storage?.getItem(SUDOKU_STORAGE_KEY) || 'null')); } catch { return normalizeSudokuProgress(null); }
}
/** Save, keeping wins another tab already recorded. Returns false when storage is unavailable. */
export function saveSudokuProgress(data, storage = globalThis.localStorage) {
  try {
    if (!storage?.setItem) return false;
    const normalized = normalizeSudokuProgress(data);
    const latest = loadSudokuProgress(storage);
    normalized.wins = [...new Set([...latest.wins, ...normalized.wins])].slice(-2000);
    for (const [key, session] of Object.entries(normalized.sessions)) {
      const other = latest.sessions[key];
      if (other && session.attempt === other.attempt) session.hintsUsed = Math.max(session.hintsUsed, other.hintsUsed);
      if (data.sessions[key]) data.sessions[key].hintsUsed = session.hintsUsed;
    }
    storage.setItem(SUDOKU_STORAGE_KEY, JSON.stringify(normalized));
    data.wins = [...normalized.wins];
    return true;
  } catch { return false; }
}
export function recordSudokuWin(data, key) {
  if (!validKey(key)) return false;
  if (data.wins.includes(key)) return false;
  data.wins = [...data.wins, key];
  return true;
}
