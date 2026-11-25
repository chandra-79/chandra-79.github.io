import { registerAssistance } from './play-assist.js';
import { SUDOKU_VARIANTS, SUDOKU_DIFFICULTIES, SUDOKU_PRACTICE_V2, SUDOKU_LADDER_V2, SUDOKU_GEN2_DAY, SUDOKU_PRACTICE_V3, SUDOKU_LADDER_V3, SUDOKU_TUNE_DAY, sudokuTunedStyle, generatePuzzle, getConflicts, isSolved, candidateMask, explainHint } from './sudoku-engine.js';
import { loadSudokuProgress, saveSudokuProgress, sudokuKey, recordSudokuWin } from './sudoku-progress.js';
import { pop, shake, wave, play, haptic, feedback } from './fx.js';
import { showLevelEnd } from './level-end.js';

const $ = id => document.getElementById(id);
const hub = () => globalThis.Ziggle;
const VARIANTS = {
  classic: { name: 'Classic', emoji: '9', blurb: 'Fill every row, column and 3×3 box with 1–9.' },
  addoku: { name: 'Addoku', emoji: '+', blurb: 'Classic rules, and each dashed cage adds up to its number with no repeats.' },
  diagonal: { name: 'Diagonal', emoji: '╳', blurb: 'Classic rules, and both long diagonals hold 1–9 too.' },
  mini: { name: 'Mini 6×6', emoji: '6', blurb: 'A quick warm-up: rows, columns and 2×3 boxes hold 1–6.' },
  'even-odd': { name: 'Even / Odd', emoji: 'e/o', blurb: 'Classic rules. Round markers hold even digits; square markers hold odd.' },
};
const LEVELS_SHOWN = 1000;
// Practice puzzles 1–1000 are levels 201000–201999 (generation 2, 27 Nov 2026: fresh grids, each difficulty its own).
// Generation 1 practice (levels 1–50 and 200000–200949) still opens a half-played save; Next and Prev lead on to generation 2.
// Tuning 3 (28 Nov 2026) changed Addoku, Even/Odd and Mini Expert only, so only those styles moved on to levels
// 202000–202999; their earlier puzzles (201000–201999) still open a half-played save, and every other style stays put.
const practiceAt=(i,style=progress.current)=>(sudokuTunedStyle(style.variant,style.difficulty)?SUDOKU_PRACTICE_V3:SUDOKU_PRACTICE_V2)+i;
const practiceIndex=n=>n>=SUDOKU_PRACTICE_V3&&n<SUDOKU_PRACTICE_V3+LEVELS_SHOWN?n-SUDOKU_PRACTICE_V3:n>=SUDOKU_PRACTICE_V2&&n<SUDOKU_PRACTICE_V2+LEVELS_SHOWN?n-SUDOKU_PRACTICE_V2:n>=1&&n<=50?n-1:n>=200000&&n<200950?n-199950:-1;
/** The current practice puzzle at the same number in a style (puzzle 1 for a daily or ladder grid). */
const practiceLevel=(n,style=progress.current)=>practiceAt(Math.max(0,practiceIndex(n)),style);
/** Ladder bonus grids: 700000 and up, and from daily #28 levels 210000–219999. */
const ladderLevel=n=>n>=700_000||n>=SUDOKU_LADDER_V3&&n<SUDOKU_LADDER_V3+10_000;
// What changes from level to level (2.6), shown when you hover or focus a difficulty. Easy and medium help more.
const DIFFICULTY_TIPS = {
  easy: 'Most numbers given. Rule conflicts are marked when enabled. A number’s key switches off after all its copies are placed without a current conflict.',
  medium: 'Fewer numbers given. Rule-conflict feedback and finished-number keys work as on Easy.',
  hard: 'Fewer numbers again, and no marking of wrong entries or finished numbers: just rule clashes (if switched on) and 3 hints.',
  expert: 'The fewest numbers given and the same light help as Hard. Expect to use notes.',
};
const progress = loadSudokuProgress();
let puzzle, session, key, selected = 0, notesMode = false, paused = false, complete = false, lastTick = Date.now();
// Undo and redo (this tab, this puzzle): each change keeps the board's values and notes. Hints used stay used.
const history = [], future = [], snap = () => ({ v: [...session.values], n: [...session.notes] });
const remember = () => { history.push(snap()); if (history.length > 300) history.shift(); future.length = 0; };
let cells = [];

const params = new URLSearchParams(location.search);
// Three dailies a day (2.3): easy, medium and hard. Any one keeps the streak; each one solved adds points.
const DAILY_LEVELS = ['easy', 'medium', 'hard'];
const todayDaily = level => hub()?.sudokuDaily?.(undefined, level) || null;
/** Which of today's dailies this puzzle is, or null. */
const dailyLevel = () => DAILY_LEVELS.find(level => { const daily = todayDaily(level); return daily && key === sudokuKey(daily); }) || null;
const isDaily = () => dailyLevel() !== null;
// Today's ladder (2.11): after the day's first daily, Next climbs (6 Easy, 10 Medium, then Expert for ever). A
// level's first ladder puzzle is that level's daily; bonus grids at that level follow, with no end.
const ladder = () => { const c = hub()?.climb?.('sudoku'); return c?.on ? c : null; };
const LADDER_STYLES = ['classic', 'addoku', 'diagonal', 'even-odd', 'classic', 'mini'];
function ladderPuzzle(place) {
  if (place.daily) return todayDaily(place.tier);
  const number = hub().dailyNumber();
  const slot = number * 53 + place.index;
  const level = number >= SUDOKU_TUNE_DAY ? SUDOKU_LADDER_V3 + slot % 10_000 : number >= SUDOKU_GEN2_DAY ? SUDOKU_LADDER_V2 + slot % 10_000 : 700_000 + slot % 290_000;
  return { variant: LADDER_STYLES[(number + place.index) % LADDER_STYLES.length], difficulty: place.tier, level };
}
let onLadder = false;
// The Games menu opens ?resume=1: carry on with a half-played puzzle, otherwise today's daily. ?daily=… always means today's.
const resuming = params.get('resume') === '1';
const dailyLevelOf = cur => DAILY_LEVELS.find(level => { const daily = todayDaily(level); return daily && sudokuKey(daily) === sudokuKey(cur); }) || null;
const halfPlayed = cur => { const saved = progress.sessions[sudokuKey(cur)]; if (!saved?.values || (progress.wins || []).includes(sudokuKey(cur))) return false; const given = generatePuzzle(cur).givens; return saved.values.length === given.length && saved.values.some((value, index) => value && !given[index]); };
if ((params.get('daily') || (resuming && !halfPlayed(progress.current))) && todayDaily()) progress.current = todayDaily(DAILY_LEVELS.includes(params.get('daily')) ? params.get('daily') : undefined);
// ?date=YYYY-MM-DD opens that day's Sudoku from the archive (just for fun: no streak or points).
const archiveDate = (() => { const date = params.get('date'); return date && hub()?.isArchiveDate?.(date) ? date : null; })();
if (archiveDate) progress.current = hub().sudokuDaily(archiveDate);
const isArchiveDaily = () => Boolean(archiveDate) && key === sudokuKey(hub().sudokuDaily(archiveDate));
// Resume, don't replay (2.6): opened plainly, Sudoku never reopens an old day's daily or a puzzle you've finished;
// it opens your half-done one, or the next unsolved one.
if (!params.get('daily') && !archiveDate && !(resuming && dailyLevelOf(progress.current))) {
  const cur = progress.current, wins = new Set(progress.wins || []);
  const oldDaily = practiceIndex(cur.level)<0 && !DAILY_LEVELS.some(level => { const daily = todayDaily(level); return daily && sudokuKey(daily) === sudokuKey(cur); });
  if (oldDaily || wins.has(sudokuKey(cur))) {
    const base = { ...cur, level: practiceLevel(cur.level, cur) };
    let level = null;
    for (let step = 0; step < LEVELS_SHOWN && level === null; step++) { const n = practiceAt((practiceIndex(base.level)+step)%LEVELS_SHOWN, base); if (!wins.has(sudokuKey({ ...base, level: n }))) level = n; }
    progress.current = { ...base, level: level ?? base.level };
  }
}
if (resuming) { const url = new URL(location.href), level = dailyLevelOf(progress.current); url.searchParams.delete('resume'); if (level) url.searchParams.set('daily', level); else url.searchParams.delete('daily');window.history.replaceState(null, '', url); dispatchEvent(new Event('ziggle:address')); } // the Today / Practice switch reads the address
// A daily left open past midnight moves to the new day's daily at the same level.
let openedOn = hub()?.today?.();
function checkNewDay() {
  const now = hub()?.today?.();
  if (!now || now === openedOn) return;
  const level = dailyLevelOn(openedOn);
  openedOn = now;
  if (level && todayDaily(level)) { loadPuzzle(todayDaily(level)); $('game-message').textContent = 'A new day: here is today’s daily.'; }
}
function dailyLevelOn(date) { return DAILY_LEVELS.find(level => { const daily = hub()?.sudokuDaily?.(date, level); return daily && key === sudokuKey(daily); }) || null; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });
setInterval(checkNewDay, 60_000);

const formatTime = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const blankSession = () => ({ values: [...puzzle.givens], notes: puzzle.givens.map(() => 0), elapsed: 0, hints: 3 });
function persist() {
  if (session && key) progress.sessions[key] = session;
  const saved = saveSudokuProgress(progress);
  $('save-status').textContent = saved ? 'Progress saves in this browser' : 'Browser storage unavailable — keep this tab open';
  $('wins-count').textContent = progress.wins.length;
}
const rowOf = index => Math.floor(index / puzzle.size), colOf = index => index % puzzle.size;
const boxOf = index => Math.floor(rowOf(index) / puzzle.boxRows) * (puzzle.size / puzzle.boxCols) + Math.floor(colOf(index) / puzzle.boxCols);
const onDiagonal = index => puzzle.variant === 'diagonal' && (rowOf(index) === colOf(index) || rowOf(index) + colOf(index) === puzzle.size - 1);

function buildBoard() {
  const board = $('sudoku-board');
  board.replaceChildren();
  board.style.setProperty('--size', puzzle.size);
  board.setAttribute('aria-label', `${VARIANTS[puzzle.variant].name} Sudoku, ${puzzle.size} by ${puzzle.size}`);
  const cageOf = new Map();
  puzzle.cages.forEach((cage, index) => cage.cells.forEach(cell => cageOf.set(cell, index)));
  cells = Array.from({ length: puzzle.size * puzzle.size }, (_, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = index;
    cell.tabIndex = index === selected ? 0 : -1;
    const r = rowOf(index), c = colOf(index);
    if (c % puzzle.boxCols === 0 && c) cell.classList.add('box-left');
    if (r % puzzle.boxRows === 0 && r) cell.classList.add('box-top');
    if (onDiagonal(index)) cell.classList.add('diagonal');
    if (puzzle.parity[index]) cell.dataset.parity = puzzle.parity[index];
    if (cageOf.has(index)) {
      const cage = cageOf.get(index), same = other => other >= 0 && other < puzzle.size ** 2 && cageOf.get(other) === cage;
      const outline = document.createElement('span');
      outline.className = 'cage';
      const edges = { top: r === 0 || !same(index - puzzle.size), right: c === puzzle.size - 1 || !same(index + 1), bottom: r === puzzle.size - 1 || !same(index + puzzle.size), left: c === 0 || !same(index - 1) };
      for (const [side, edge] of Object.entries(edges)) { outline.style[side] = edge ? 'var(--cage-inset)' : '0'; if (!edge) outline.style[`border-${side}-color`] = 'transparent'; }
      cell.append(outline);
      if (puzzle.cages[cage].cells[0] === index) {
        const sum = document.createElement('span');
        sum.className = 'cage-sum';
        sum.textContent = puzzle.cages[cage].sum;
        cell.append(sum);
      }
    }
    const value = document.createElement('span'); value.className = 'value'; cell.append(value);
    const notes = document.createElement('span'); notes.className = 'notes'; notes.setAttribute('aria-hidden', 'true');
    for (let digit = 1; digit <= puzzle.size; digit++) { const note = document.createElement('i'); note.textContent = digit; notes.append(note); }
    cell.append(notes);
    cell.addEventListener('click', () => select(index));
    board.append(cell);
    return cell;
  });
  $('number-pad').style.setProperty('--pad', puzzle.size);
  $('number-pad').replaceChildren(...Array.from({ length: puzzle.size }, (_, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'pad-key'; button.textContent = i + 1;
    button.setAttribute('aria-label', `Enter ${i + 1}`);
    button.addEventListener('click', () => { enter(i + 1); backToBoard(); });
    return button;
  }));
}

function paint() {
  const conflicts = progress.showMistakes ? new Set(getConflicts(puzzle, session.values)) : new Set();
  const chosen = session.values[selected];
  cells.forEach((cell, index) => {
    const value = session.values[index], given = puzzle.givens[index] > 0;
    cell.querySelector('.value').textContent = value || '';
    const notes = cell.querySelectorAll('.notes i');
    notes.forEach((note, i) => { note.classList.toggle('on', !value && Boolean(session.notes[index] & (1 << i))); });
    cell.classList.toggle('given', given);
    cell.classList.toggle('selected', index === selected);
    cell.classList.toggle('related', index !== selected && (rowOf(index) === rowOf(selected) || colOf(index) === colOf(selected) || boxOf(index) === boxOf(selected)));
    cell.classList.toggle('same', Boolean(chosen) && value === chosen && index !== selected);
    cell.classList.toggle('conflict', conflicts.has(index) && !given);
    const state=given?'fixed':!value?'empty':!progress.showMistakes?'entered':conflicts.has(index)?'conflict':'valid';
    cell.dataset.entryState=state;cell.classList.toggle('valid-entry',state==='valid');cell.setAttribute('aria-current',index===selected?'true':'false');
    cell.tabIndex = index === selected ? 0 : -1;
    const extras = [puzzle.parity[index] ? `${puzzle.parity[index]} cell` : '', given ? 'fixed clue, cannot edit' : 'editable', index===selected?'current cell':'', progress.showMistakes&&value&&!given?(conflicts.has(index)?'rule conflict':'no current rule conflict'):''].filter(Boolean).join(', ');
    cell.setAttribute('aria-label', `Row ${rowOf(index) + 1}, column ${colOf(index) + 1}: ${value || 'empty'}${extras ? `, ${extras}` : ''}`);
  });
  const filled = session.values.filter(Boolean).length;
  $('progress-label').textContent = `${filled} of ${session.values.length} cells filled`;
  $('progress-fill').style.width = `${Math.round(filled / session.values.length * 100)}%`;
  $('hint-count').textContent = session.hints;
  $('hint-button').disabled = paused || complete || !session.hints;
  $('notes-button').setAttribute('aria-pressed', String(notesMode));
  $('notes-button').textContent = notesMode ? 'Notes: on' : 'Notes: off';
  const fixed=Boolean(puzzle.givens[selected]);
  $('erase-button').disabled = paused || complete || fixed;
  $('fill-notes-button').disabled = paused || complete;
  $('undo-button').disabled = paused || complete || !history.length;
  $('redo-button').disabled = paused || complete || !future.length;
  $('notes-button').disabled = paused || complete || fixed;
  const state=cells[selected].dataset.entryState;
  $('cell-status').dataset.state=state;
  if(paused||complete)$('cell-status').textContent=paused?'Paused':'Puzzle complete';
  else{ // The row and column are for screen readers; sighted players see the cell itself, so only a state worth a word is shown.
    const words={fixed:'Fixed clue',empty:'Empty · editable',conflict:'Rule conflict',valid:'Valid so far',entered:'Your entry'}[state],plain=state==='empty'||state==='entered';
    const where=document.createElement('span');where.className='visually-hidden';where.textContent=`R${rowOf(selected)+1} C${colOf(selected)+1} · ${plain?words:''}`;
    $('cell-status').replaceChildren(where,...(plain?[]:[words]));
  }
  $('mistakes-toggle').checked = progress.showMistakes;
  // Easy and medium: once every copy is placed without a current conflict, its key turns
  // off with a tick, so you can see what's left. Hard and expert leave the pad as it is.
  const done = doneDigits();
  document.querySelectorAll('.pad-key').forEach((button, i) => {
    const finished = done.has(i + 1);
    button.disabled = paused || complete || fixed || finished;
    button.classList.toggle('done', finished);
    button.setAttribute('aria-label', finished ? `${i + 1} is complete` : `Enter ${i + 1}`);
    button.title = finished ? `Every ${i + 1} is in place` : '';
  });
  $('completion').hidden = !complete;
}

/** Numbers with all copies placed and no current rule conflict (easy and medium). */
function doneDigits() {
  if (!['easy', 'medium'].includes(puzzle.difficulty)) return new Set();
  const done = new Set();
  for (let digit = 1; digit <= puzzle.size; digit++) {
    if(session.values.filter(value=>value===digit).length===puzzle.size&&!getConflicts(puzzle,session.values).some(index=>session.values[index]===digit))done.add(digit);
  }
  return done;
}
function select(index, focus = true) {
  selected = Math.max(0, Math.min(puzzle.size ** 2 - 1, index));
  paint();
  if (focus) cells[selected].focus({ preventScroll: true });
}

function enter(digit) {
  if(paused||complete)return;
  if(puzzle.givens[selected]){$('game-message').textContent='That is a fixed clue. Choose an editable cell.';return;}
  if (digit && doneDigits().has(digit)) { $('game-message').textContent = `Every ${digit} is already in place.`; return; }
  if (notesMode && digit) {
    if (session.values[selected]) return;
    remember();
    session.notes[selected] ^= 1 << (digit - 1);
  } else {
    remember();
    session.values[selected] = session.values[selected] === digit ? 0 : digit;
    if (digit && session.values[selected]) placed = selected;
    $('game-message').textContent='';
    if (digit) {
      // Clear that digit from notes in the same row, column and box.
      session.notes.forEach((mask, index) => { if (rowOf(index) === rowOf(selected) || colOf(index) === colOf(selected) || boxOf(index) === boxOf(selected)) session.notes[index] = mask & ~(1 << (digit - 1)); });
    }
  }
  afterChange();
}
function erase() {
  if (paused || complete || puzzle.givens[selected]) return;
  remember();
  session.values[selected] = 0; session.notes[selected] = 0;
  afterChange();
}
function travel(from, to, word) {
  if (paused || complete || !from.length) return;
  to.push(snap());
  const state = from.pop();
  state.v.forEach((value, index) => { session.values[index] = value; session.notes[index] = state.n[index]; });
  $('game-message').textContent = `${word} your last move.`;
  afterChange();
}
const undo = () => travel(history, future, 'Undid'), redo = () => travel(future, history, 'Redid');
/** One tap: pencil in the possible digits for every empty cell that has no notes yet. Notes you wrote yourself are never changed. */
function fillNotes() {
  if (paused || complete) return;
  const targets = session.values.map((value, index) => index).filter(index => !puzzle.givens[index] && !session.values[index] && !session.notes[index]);
  if (!targets.length) { $('game-message').textContent = 'Every empty cell already has notes.'; return; }
  remember();
  targets.forEach(index => { session.notes[index] = candidateMask(puzzle, session.values, index); });
  $('game-message').textContent = `Notes added to ${targets.length} cells from the rules. If a digit you placed is wrong, they can be off.`;
  afterChange();
}
function hint() {
  if (paused || complete || !session.hints) return;
  const wrong = session.values.map((value, index) => index).filter(index => !puzzle.givens[index] && session.values[index] !== puzzle.solution[index]);
  if (!wrong.length) return;
  // Prefer the selected cell, then a cell a simple pattern explains, so the hint teaches something.
  const pool = wrong.includes(selected) ? [selected] : wrong, explained = pool.map(index => explainHint(puzzle, session.values, index));
  const start = (Date.now() >>> 0) % pool.length, pick = explained.map((_, i) => (i + start) % pool.length).find(i => explained[i].kind !== 'direct') ?? start;
  const target = pool[pick], was = session.values[target];
  remember();
  session.values[target] = puzzle.solution[target]; session.notes[target] = 0; session.hints--;
  selected = target;
  $('game-message').textContent = `${was ? 'That digit was not right. ' : ''}${explained[pick].text}`;
  afterChange();
}
let placed = null;
/** Rows, columns and boxes that are full and break no rule, so a newly finished one can ripple. */
function finishedUnits(values) {
  const n = puzzle.size, all = [...Array(n * n).keys()], units = [];
  for (let i = 0; i < n; i++) units.push(['row', i, all.filter(x => rowOf(x) === i)], ['col', i, all.filter(x => colOf(x) === i)], ['box', i, all.filter(x => boxOf(x) === i)]);
  const conflicts = new Set(getConflicts(puzzle, values));
  return units.filter(([, , cellsIn]) => cellsIn.every(x => values[x] && !conflicts.has(x))).map(([kind, i, cellsIn]) => ({ id: `${kind}${i}`, cells: cellsIn }));
}
let lastUnits = new Set();
function afterChange() {
  const wasComplete = complete;
  complete = isSolved(puzzle, session.values);
  // Game feel: a placed digit pops; a clash shakes; a finished row, column or box ripples.
  if (placed !== null) {
    const cell = cells[placed], conflict = progress.showMistakes && getConflicts(puzzle, session.values).includes(placed);
    if (conflict) { shake(cell, 4); play('wrong'); haptic([25, 40, 25]); } else { pop(cell, 1.12); play('tick'); }
    const now = finishedUnits(session.values);
    if (!complete) for (const unit of now) if (!lastUnits.has(unit.id) && unit.cells.includes(placed)) { wave(unit.cells.map(x => cells[x]), { lift: 4, step: 25 }); play('ding'); haptic(15); }
    lastUnits = new Set(now.map(unit => unit.id));
    placed = null;
  }
  if (complete && !wasComplete) { wave(cells, { lift: 6, step: 6 }); feedback.win(); }
  if (complete && !wasComplete) {
    if (!isDaily() || !hub()?.helped?.('sudoku')) recordSudokuWin(progress, key);
    const result = { time: session.elapsed, hints: session.hints };
    if (isDaily()) { hub()?.recordDaily?.('sudoku', { ...result, difficulty: dailyLevel() }); postDailyScore(); }
    const c = ladder();
    if (c && key === sudokuKey(ladderPuzzle(c.place))) { if (!c.place.daily) hub()?.earnLevel?.(); hub()?.climbDone?.('sudoku', c.place); }
    onLadder = Boolean(ladder()) && (isDaily() || key.length > 0 && ladderLevel(progress.current.level));
    $('completion-detail').textContent = `Solved in ${formatTime(session.elapsed)}${3 - session.hints ? ` with ${3 - session.hints} hint${3 - session.hints === 1 ? '' : 's'}` : ' with no hints'}.`;
    $('share-sudoku').hidden = !isDaily();
    $('share-sudoku').onclick = async () => { $('share-sudoku-status').textContent = await hub()?.share?.('sudoku', result) || ''; };
    $('game-message').textContent = 'Solved! A tidy little win.';
    // The end of a level (2.5).
    const info = VARIANTS[puzzle.variant], used = 3 - session.hints;
    showLevelEnd({ outcome: 'win', symbol: '🔢', kicker: isDaily() ? `ZIGGLE #${hub().dailyNumber()} · TODAY’S ${dailyLevel().toUpperCase()} SUDOKU` : `${info.name.toUpperCase()} · ${progress.current.difficulty.toUpperCase()} · ${ladderLevel(progress.current.level) ? 'LADDER BONUS' : `PUZZLE ${practiceIndex(progress.current.level)+1}`}`,
      title: used ? 'Solved!' : 'Solved with no hints!', earn: !isDaily() && !isArchiveDaily(),
      stats: [['time', formatTime(session.elapsed)], ['hints used', used], ['size', `${puzzle.size}×${puzzle.size}`]],
      actions: [{ id: 'next', label: onLadder ? `Next: ${ladder().label} →` : 'Next puzzle →', primary: true, run: () => $('play-next').click() },
        ...(isDaily() ? [{ id: 'share', label: 'Share result', keepOpen: true, run: () => hub()?.share?.('sudoku', result) }] : []),
        { id: 'stay', label: 'Look at the grid' }],
      onDismiss: () => {}, focus:()=>complete?$('play-next'):cells[selected] });
  }
  persist(); paint();
}

function loadPuzzle(changes = {}) {
  if (session) persist();
  progress.current = { ...progress.current, ...changes };
  key = sudokuKey(progress.current);
  puzzle = generatePuzzle(progress.current);
  const saved = progress.sessions[key];
  session = saved && saved.values.length === puzzle.size ** 2 ? saved : blankSession();
  history.length = future.length = 0;
  // Givens always win over a tampered save.
  puzzle.givens.forEach((given, index) => { if (given) session.values[index] = given; });
  selected = Math.max(0, puzzle.givens.findIndex(value => !value));
  paused = false; complete = isSolved(puzzle, session.values); lastTick = Date.now();
  showPaused(); // A new puzzle always starts unpaused: no cover, a live board and a pause (not play) button.
  const info = VARIANTS[puzzle.variant];
  $('puzzle-title').textContent = info.name;
  paintDailyButtons();
  $('puzzle-kicker').textContent = isDaily() ? `ZIGGLE #${hub().dailyNumber()} · TODAY’S ${dailyLevel().toUpperCase()} SUDOKU` : isArchiveDaily() ? `ZIGGLE #${hub().dailyNumber(archiveDate)} · FROM THE ARCHIVE` : `${progress.current.difficulty.toUpperCase()} · ${ladderLevel(progress.current.level) ? 'LADDER BONUS' : `PUZZLE ${practiceIndex(progress.current.level)+1}`}`;
  $('variant-blurb').textContent = info.blurb;
  $('legend').hidden = puzzle.variant !== 'even-odd';
  document.querySelectorAll('[data-variant]').forEach(button => { const active = button.dataset.variant === puzzle.variant; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll('[data-difficulty]').forEach(button => { const active = button.dataset.difficulty === puzzle.difficulty; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  const select = $('puzzle-number');
  // The picker lists this style's practice levels (Addoku, Even/Odd and Mini Expert have their own since tuning 3).
  if (select.options[0]?.value !== String(practiceAt(0))) select.replaceChildren(...Array.from({ length: LEVELS_SHOWN }, (_, i) => new Option(`${i + 1} / ${LEVELS_SHOWN}`, String(practiceAt(i)))));
  if (practiceIndex(progress.current.level)<0) { select.disabled = true; $('daily-note').textContent = 'Today’s daily puzzle'; }
  else { select.disabled = false; select.value = String(practiceLevel(progress.current.level)); $('daily-note').textContent = ''; }
  $('previous-puzzle').disabled = practiceIndex(progress.current.level)<=0;
  $('next-puzzle').disabled = practiceIndex(progress.current.level)===LEVELS_SHOWN-1;
  $('share-sudoku').hidden = !(complete && isDaily());
  $('timer').textContent = formatTime(session.elapsed);
  $('game-message').textContent = complete ? 'Already solved. Pick another puzzle or replay this one.' : '';
  if (complete) $('completion-detail').textContent = 'You’ve already solved this one.';
  buildBoard(); paint(); persist();
}
function showPaused() {
  $('pause-overlay').hidden = !paused;
  $('sudoku-board').inert = paused;
  $('pause-button').setAttribute('aria-label', paused ? 'Resume puzzle' : 'Pause puzzle');
  $('pause-symbol').textContent = paused ? '▶' : 'Ⅱ';
}
function setPaused(value) {
  if (complete) return;
  paused = value;
  showPaused();
  lastTick = Date.now();
  paint();
  if(paused)$('resume-button').focus({preventScroll:true});else cells[selected]?.focus({preventScroll:true});
}

// ---- Controls --------------------------------------------------------
$('variant-list').append(...SUDOKU_VARIANTS.map(variant => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'variant-option'; button.dataset.variant = variant;
  button.innerHTML = `<span class="variant-icon" aria-hidden="true">${VARIANTS[variant].emoji}</span><span>${VARIANTS[variant].name}</span>`;
  button.addEventListener('click', () => loadPuzzle({ variant, level: practiceLevel(progress.current.level, { ...progress.current, variant }) }));
  return button;
}));
$('difficulty-tabs').append(...SUDOKU_DIFFICULTIES.map(difficulty => {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.difficulty = difficulty; button.textContent = difficulty[0].toUpperCase() + difficulty.slice(1);
  button.dataset.tip = DIFFICULTY_TIPS[difficulty]; button.setAttribute('aria-description', DIFFICULTY_TIPS[difficulty]);
  button.addEventListener('click', () => loadPuzzle({ difficulty, level: practiceLevel(progress.current.level, { ...progress.current, difficulty }) }));
  return button;
}));
$('puzzle-number').addEventListener('change', event => loadPuzzle({ level: Number(event.target.value) }));
$('previous-puzzle').addEventListener('click', () => loadPuzzle({ level: practiceAt(Math.max(0,practiceIndex(progress.current.level)-1)) }));
$('next-puzzle').addEventListener('click', () => loadPuzzle({ level: practiceAt(Math.min(LEVELS_SHOWN-1,practiceIndex(progress.current.level)+1)) }));
document.querySelectorAll('[data-daily-level]').forEach(button => button.addEventListener('click', () => {
  const daily = todayDaily(button.dataset.dailyLevel);
  if (daily) loadPuzzle(daily); else $('game-message').textContent = 'The daily puzzle needs the Ziggle hub script.';
}));
/** The daily buttons show which of today's three is open and which are solved. */
function paintDailyButtons() {
  const level = dailyLevel(), day = hub()?.profile?.()?.days?.[hub()?.today?.()]?.sudoku;
  document.querySelectorAll('[data-daily-level]').forEach(button => {
    const done = (day?.levels || []).includes(button.dataset.dailyLevel) || (progress.wins || []).includes(sudokuKey(todayDaily(button.dataset.dailyLevel) || {}));
    button.setAttribute('aria-pressed', String(button.dataset.dailyLevel === level));
    button.classList.toggle('done', done);
    button.textContent = `${done ? '✓ ' : ''}${button.dataset.dailyLevel[0].toUpperCase()}${button.dataset.dailyLevel.slice(1)}`;
    // Daily levels (2.8): the player's level for today is marked; any of the three keeps the streak.
    const mine = hub()?.tier?.('sudoku') === button.dataset.dailyLevel;
    button.classList.toggle('my-level', mine);
    button.title = mine ? 'Your level today (Settings → Play)' : '';
  });
}
// Today's verified time goes to the Sudoku leaderboard (needs a leaderboard name; never in kids mode).
async function postDailyScore() {
  const status = $('sudoku-board-status'), Z = hub(), level = dailyLevel();
  if (!status || !Z || !level || Z.kids?.() || Z.serverless?.()) return;
  const profile = Z.profile();
  if (!profile.nickname) { status.textContent = 'Choose a leaderboard name in Settings to join today’s Sudoku board.'; return; }
  status.textContent = 'Checking your solution…';
  const response = await Z.api('/api/scores/sudoku', { method: 'POST', queue: true, body: { date: Z.today(), difficulty: level, values: [...session.values], elapsed: session.elapsed, hints: 3 - session.hints, playerId: Z.playerId(), nickname: profile.nickname } });
  status.textContent = response.ok ? `Verified! You’re #${response.rank} of ${response.total} on today’s ${level} board.` : response.message || 'The leaderboard is unavailable right now.';
}
// Next puzzle (2.4.1): the next one in this style and difficulty you haven't solved (opening a finished one
// looked like nothing happened). After a daily it starts from puzzle 1.
function nextUnsolvedLevel() {
  const from = practiceIndex(progress.current.level), wins = new Set(progress.wins || []);
  for (let step = 1; step <= LEVELS_SHOWN; step++) {
    const level = practiceAt((from+step+LEVELS_SHOWN)%LEVELS_SHOWN);
    if (level !== progress.current.level && !wins.has(sudokuKey({ ...progress.current, level }))) return level;
  }
  return practiceAt((from+1)%LEVELS_SHOWN);
}
$('play-next').addEventListener('click', () => {
  const c = ladder();
  if (c && complete && (isDaily() || ladderLevel(progress.current.level))) {
    loadPuzzle(ladderPuzzle(c.place));
    $('game-message').textContent = `Today’s ladder: ${c.label}${c.place.daily ? `, today’s ${hub().tierNames[c.place.tier]} daily` : ''}.`;
    return;
  }
  const level = nextUnsolvedLevel();
  loadPuzzle({ level });
  $('game-message').textContent = `Puzzle ${practiceIndex(level)+1} of ${LEVELS_SHOWN}.`;
  document.querySelector('#sudoku-board .cell:not(.given), #sudoku-board button')?.focus({ preventScroll: true });
});
$('hint-button').addEventListener('click', () => { hint(); backToBoard(); });
$('erase-button').addEventListener('click', () => { erase(); backToBoard(); });
$('fill-notes-button').addEventListener('click', () => { fillNotes(); backToBoard(); });
$('undo-button').addEventListener('click', () => { undo(); backToBoard(); });
$('redo-button').addEventListener('click', () => { redo(); backToBoard(); });
// Tools hand focus back to the board, so typing a digit right after a click works.
const backToBoard = () => cells[selected]?.focus({ preventScroll: true });
$('notes-button').addEventListener('click', () => { notesMode = !notesMode; paint(); backToBoard(); });
$('pause-button').addEventListener('click', () => setPaused(!paused));
$('resume-button').addEventListener('click', () => setPaused(false));
$('restart-button').addEventListener('click', () => { session = blankSession(); history.length = future.length = 0; complete = false; afterChange(); $('game-message').textContent = 'Fresh start. Same puzzle.';backToBoard(); });
$('mistakes-toggle').addEventListener('change', event => { progress.showMistakes = event.target.checked; persist(); paint(); });
$('sudoku-help').addEventListener('click', () => { setPaused(true); $('sudoku-dialog').showModal(); });
$('close-help').addEventListener('click', () => $('sudoku-dialog').close());
$('help-done').addEventListener('click', () => $('sudoku-dialog').close());
$('sudoku-board').addEventListener('keydown', event => {
  if(event.isComposing||event.altKey)return;
  if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();if(!event.repeat)(event.key.toLowerCase()==='y'||event.shiftKey?redo:undo)();return;}
  if(event.metaKey)return;
  if(event.ctrlKey){if(['Home','End'].includes(event.key)){event.preventDefault();select(event.key==='Home'?0:puzzle.size**2-1);}return;}
  const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if(moves[event.key]){event.preventDefault();const [dr,dc]=moves[event.key];select(((rowOf(selected)+dr+puzzle.size)%puzzle.size)*puzzle.size+(colOf(selected)+dc+puzzle.size)%puzzle.size);}
  else if(['Home','End'].includes(event.key)){event.preventDefault();select(rowOf(selected)*puzzle.size+(event.key==='End'?puzzle.size-1:0));}
  else if(/^[1-9]$/.test(event.key)){event.preventDefault();if(!event.repeat){const digit=Number(event.key);if(digit<=puzzle.size)enter(digit);else $('game-message').textContent=`This grid uses 1–${puzzle.size}.`;}}
  else if(['Backspace','Delete','0'].includes(event.key)){event.preventDefault();erase();}
  else if(event.key.toLowerCase()==='f'&&!event.repeat){event.preventDefault();fillNotes();}
  else if(event.key.toLowerCase()==='n'&&!event.repeat){event.preventDefault();if(!puzzle.givens[selected]){notesMode=!notesMode;paint();}}
});
document.addEventListener('keydown', event => {
  if (event.target.closest?.('input,select,textarea,dialog')) return;
  if (event.key.toLowerCase() === 'p' && !event.repeat) setPaused(!paused);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!complete && !paused) setPaused(true); persist(); } });
addEventListener('pagehide', persist);
setInterval(() => {
  const now = Date.now();
  if (!paused && !complete && !document.hidden) {
    const seconds = Math.floor((now - lastTick) / 1000);
    if (seconds > 0) { session.elapsed += seconds; lastTick += seconds * 1000; $('timer').textContent = formatTime(session.elapsed); if (session.elapsed % 5 === 0) persist(); }
  } else lastTick = now;
}, 1000);
loadPuzzle();
// The shared fit frame sizes the board and tools. Do not move the viewport later while someone is navigating.

// Adopt an explicit account/backup merge before a timer or pagehide can write the old board back.
document.addEventListener('ziggle:restored', event => {
  if (!event.detail?.keys?.includes('ziggle-sudoku-v1')) return;
  Object.assign(progress, loadSudokuProgress());
  session = null;
  loadPuzzle();
});

registerAssistance({ id: 'sudoku', demoHelp: 'sudoku-dialog',
  howto: () => ({ key, ready: Boolean(puzzle), fresh: !complete && session.values.every((value,i) => value === puzzle.givens[i]), rules: puzzle.variant === 'classic' ? [] : ['sudoku-'+puzzle.variant] }), isDaily,
  canHint: () => !complete && session.hints > 0, hint: () => $('hint-button').click(), refillAvailable: () => !complete && session.hints === 0,
  refill: () => { session.hints = 3; persist(); paint(); },
  suspend: () => { const was = paused; if (!complete) setPaused(true); return () => { if (!complete) setPaused(was); }; },
  steps: () => Array.from({ length: puzzle.size }, (_, row) => `Row ${row+1}: ${puzzle.solution.slice(row*puzzle.size,(row+1)*puzzle.size).join(' · ')}`).concat(puzzle.cages.map(cage => `Cage ${cage.sum}: ${cage.cells.map(i => puzzle.solution[i]).join(' + ')} = ${cage.sum}.`)) });
