import { registerHowTo } from './howto-boot.js';
import { LEVELS, ROUND, CARD_MODES, levelInfo, buildRound, passed as roundPassed, dateSeed, codeLabel, versionLabel, isSequence, sequenceParts } from './unicode-engine.js';
import { renderPager } from './pager.js';
import { newCard, review, dueCards, mastery } from './review-core.js';
import { flagSvg, artSvg } from './flags.js';
import { ALL_FLAGS as FLAGS } from './flags-data.js';
import { ART_FILES } from './flags-world.js';
import { GROUPS, SUBGROUPS } from './emoji/groups.js';
import { pop, shake, play, haptic, feedback, burstFrom, countUp } from './fx.js';

const $ = id => document.getElementById(id);
const hub = () => globalThis.Ziggle;
const STORAGE_KEY = 'ziggle-unicode-v1';
const pad = n => String(n).padStart(2, '0');
const today = () => hub()?.today?.() ?? (d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)(new Date());
const dayNumber = () => hub()?.dailyNumber?.() ?? 1;
const GROUP_IDS = GROUPS.map(group => group.id);

// ---- Saves ------------------------------------------------------------------------
const blank = () => ({ version: 1, level: 1, passed: [], cards: {}, best: {}, daily: {}, history: [] });
const finite = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
const CARD_ID = /^(e:[0-9A-F-]{2,60}|f:[A-Z-]{2,8}|s:[0-9A-F]{2,6})(:[a-z]{2,10})?$/;
function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || value.version !== 1) return blank();
    const cards = {};
    for (const [id, card] of Object.entries(value.cards || {}).slice(0, 6000)) {
      if (!CARD_ID.test(id) || !card || typeof card !== 'object') continue;
      cards[id] = { id, box: finite(card.box, 0, 5, 0), due: finite(card.due, 0, 1e14, 0), seen: finite(card.seen, 0, 1e6, 0), right: finite(card.right, 0, 1e6, 0), last: finite(card.last, 0, 1e14, 0) };
    }
    const best = {};
    for (const [level, right] of Object.entries(value.best || {})) if (/^[1-9]\d?$/.test(level) && Number(level) <= LEVELS.length) best[level] = finite(right, 0, ROUND, 0);
    const daily = {};
    for (const [date, right] of Object.entries(value.daily || {}).slice(-120)) if (/^\d{4}-\d{2}-\d{2}$/.test(date)) daily[date] = finite(right, 0, ROUND, 0);
    return {
      version: 1, level: finite(value.level, 1, LEVELS.length, 1), cards, best, daily,
      passed: Array.isArray(value.passed) ? [...new Set(value.passed.filter(n => Number.isInteger(n) && n >= 1 && n <= LEVELS.length))] : [],
      history: Array.isArray(value.history) ? value.history.filter(item => item && typeof item.at === 'string').slice(-200).map(item => ({ at: item.at, kind: ['level', 'review', 'daily'].includes(item.kind) ? item.kind : 'level', level: finite(item.level, 1, LEVELS.length, 1), right: finite(item.right, 0, ROUND, 0), total: finite(item.total, 1, ROUND, ROUND) })) : [],
    };
  } catch { return blank(); }
}
let save = load();
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); $('save-status').textContent = 'Progress saves in this browser'; }
  catch { $('save-status').textContent = 'Browser storage unavailable — keep this tab open'; }
}

// ---- Data: emoji groups load only when a level or the browser needs them ------------------
const emojiCache = {};
let symbolCache = null;
// Emoji 16 and 17 (2024–2025) are in the library, but only show where this device can draw them: an
// undrawable emoji renders like a missing-character box, and an undrawable sequence as two pictures.
const support = new Map();
let missing = null, single = 0;
function canDraw(emoji) {
  if (support.has(emoji)) return support.get(emoji);
  let ok = true;
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.font = '24px sans-serif'; ctx.textBaseline = 'top';
      const draw = text => { ctx.clearRect(0, 0, 32, 32); ctx.fillText(text, 0, 0); return ctx.getImageData(0, 0, 32, 32).data.join(','); };
      missing ??= draw('\u{10FFFD}');
      single ||= ctx.measureText('\u{1F600}').width;
      ok = draw(emoji) !== missing && (!emoji.includes('\u200D') || ctx.measureText(emoji).width < single * 1.5);
    }
  } catch { ok = true; }
  support.set(emoji, ok);
  return ok;
}
async function loadData(info) {
  const groups = (info.groups || []).filter(id => GROUP_IDS.includes(id) && !emojiCache[id]);
  await Promise.all(groups.map(async id => { emojiCache[id] = (await import(`./emoji/${id}.js`)).default.filter(record => record[3] < 16 || canDraw(record[0])); }));
  if (info.symbols && !symbolCache) symbolCache = (await import('./emoji/symbols-unicode.js')).default;
  return { emoji: emojiCache, groups: GROUPS, flags: FLAGS, symbols: symbolCache || [] };
}
const flagByCode = Object.fromEntries(FLAGS.map(flag => [flag.code, flag]));
// Flag pictures load a file at a time, only for the flags about to be shown. A place that flies another's flag shows that flag.
const artCache = {}, artFiles = {};
const shown = flag => (flag.same ? flagByCode[flag.same] : flag);
function loadArt(flags) {
  const files = [...new Set(flags.map(flag => shown(flag).art).filter(n => n >= 1 && n <= ART_FILES))];
  return Promise.all(files.map(n => (artFiles[n] ||= import(`./flag-art/${n}.js`).then(module => { Object.assign(artCache, module.default); }, error => { delete artFiles[n]; throw error; }))));
}
function flagPicture(flag) {
  const real = shown(flag);
  return real.art ? (artCache[real.code] ? artSvg(artCache[real.code]) : '') : flagSvg(real);
}
const roundFlags = questions => questions.flatMap(q => [q.prompt, ...q.options]).filter(part => part.kind === 'flag').map(part => flagByCode[part.value]);

// ---- State ---------------------------------------------------------------------------
let mode = 'level', round = null, roundRequest = 0;
const dueIds = () => dueCards(Object.values(save.cards), Date.now(), 200).map(card => card.id);

function setMode(next) {
  roundRequest++;
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('quiz').hidden = mode === 'browse';
  $('browse').hidden = mode !== 'browse';
  round = null;
  showStart();
  if (mode === 'browse') renderBrowse();
}
function showStart() {
  $('start').setAttribute('aria-busy', 'false');
  const info = levelInfo(save.level);
  $('quiz-live').hidden = true; $('round-result').hidden = true; $('quiz-start').hidden = false;
  const due = dueIds().length;
  if (mode === 'level') {
    $('uni-kicker').textContent = `LEVEL ${info.n} OF ${LEVELS.length}${save.passed.includes(info.n) ? ' · ★ EARNED' : ''}`;
    $('uni-title').textContent = info.name;
    $('uni-blurb').textContent = info.blurb;
    $('start').textContent = 'Start round';
    $('start').disabled = false;
    $('start-note').textContent = save.best[info.n] ? `Your best here: ${save.best[info.n]} of ${ROUND}.` : `Ten questions. ${8} right earns the star.`;
  } else if (mode === 'review') {
    $('uni-kicker').textContent = 'SPACED REVIEW';
    $('uni-title').textContent = 'Review';
    $('uni-blurb').textContent = 'Cards come back after a day, three days, a week, three weeks, then two months. A miss starts the climb again.';
    $('start').textContent = due ? `Review ${Math.min(ROUND, due)} card${due === 1 ? '' : 's'}` : 'Nothing due';
    $('start').disabled = !due;
    $('start-note').textContent = due ? `${due} card${due === 1 ? ' is' : 's are'} due.` : Object.keys(save.cards).length ? 'All caught up. Play a level to meet new cards.' : 'Play a level first. What you answer becomes review cards.';
  } else if (mode === 'daily') {
    const done = today() in save.daily;
    $('uni-kicker').textContent = `DAILY 10 · #${dayNumber()}`;
    $('uni-title').textContent = 'Today’s ten';
    $('uni-blurb').textContent = 'The same ten questions for everyone today, from every level. Just for fun: it never touches your streak.';
    $('start').textContent = done ? 'Play again' : 'Start today’s ten';
    $('start').disabled = false;
    $('start-note').textContent = done ? `Today you got ${save.daily[today()]} of ${ROUND}. Replays don’t change that.` : 'New questions every day at midnight.';
  } else if (mode === 'browse') {
    $('uni-kicker').textContent = 'THE LIBRARY';
    $('uni-title').textContent = 'Browse';
    $('uni-blurb').textContent = 'Every emoji, symbol and flag here, with its official name. Tap one to learn about it.';
  }
  updateDueBadge();
  renderSide();
}
function updateDueBadge() {
  const due = dueIds().length;
  $('due-badge').hidden = !due;
  $('due-badge').textContent = due > 99 ? '99+' : String(due);
}

// ---- A round ---------------------------------------------------------------------------
async function startRound() {
  const request = ++roundRequest;
  const kind = mode;
  const n = kind === 'level' ? save.level : 10;
  $('start').disabled = true;
  $('start').setAttribute('aria-busy', 'true');
  $('start').textContent = 'Loading…';
  $('start-note').textContent = 'Loading your questions…';
  let data;
  try { data = await loadData(levelInfo(n)); }
  catch { if (request !== roundRequest) return; showStart(); $('start-note').textContent = 'Couldn’t load the emoji list. Check your connection and try again.'; return; }
  if (request !== roundRequest) return;
  $('start').setAttribute('aria-busy', 'false');
  const due = dueIds();
  const options = kind === 'daily' ? { seed: dateSeed(today()) }
    : kind === 'review' ? { seed: Date.now() & 0xffffffff, review: due, reviewShare: 1, count: Math.min(ROUND, due.length) }
    : { seed: Date.now() & 0xffffffff, review: due };
  const questions = buildRound(n, data, options);
  try { await loadArt(roundFlags(questions)); }
  catch { if (request !== roundRequest) return; showStart(); $('start-note').textContent = 'Couldn’t load the flags. Check your connection and try again.'; return; }
  if (request !== roundRequest) return;
  if (!questions.length) { showStart(); $('start-note').textContent = 'Nothing to ask right now.'; return; }
  round = { kind, level: n, questions, at: 0, answers: [] };
  $('quiz-start').hidden = true; $('round-result').hidden = true; $('quiz-live').hidden = false;
  showQuestion();
}
function visual(kind, value) {
  const el = document.createElement('span');
  if (kind === 'flag') { el.className = 'flag-box'; el.innerHTML = flagPicture(flagByCode[value]); }
  else { el.className = kind === 'text' ? 'opt-text' : kind === 'code' ? 'opt-code' : 'opt-emoji'; el.textContent = value; }
  return el;
}
function showQuestion() {
  const q = round.questions[round.at];
  $('q-count').textContent = `Question ${round.at + 1} of ${round.questions.length}`;
  $('q-score').textContent = `${round.answers.filter(Boolean).length} right`;
  $('dots').replaceChildren(...round.questions.map((_, i) => { const dot = document.createElement('span'); dot.className = `dot${i < round.answers.length ? (round.answers[i] ? ' right' : ' wrong') : i === round.at ? ' now' : ''}`; return dot; }));
  const prompt = visual(q.prompt.kind, q.prompt.value);
  const box = $('prompt');
  box.className = `prompt prompt-${q.prompt.kind}`;
  // The prompt never reads its own answer aloud: emoji and flags get a neutral label.
  if (q.prompt.kind === 'emoji' || q.prompt.kind === 'flag') { box.setAttribute('role', 'img'); box.setAttribute('aria-label', q.prompt.kind === 'flag' ? 'The flag in question' : 'The emoji in question'); prompt.setAttribute('aria-hidden', 'true'); }
  else { box.removeAttribute('role'); box.removeAttribute('aria-label'); }
  box.replaceChildren(prompt);
  $('question').textContent = q.question;
  const grid = $('options');
  grid.className = `options options-${q.options[0].kind}${q.options.length === 2 ? ' two' : ''}`;
  grid.replaceChildren(...q.options.map((option, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    const key = document.createElement('span'); key.className = 'opt-key'; key.textContent = String(i + 1); key.setAttribute('aria-hidden', 'true');
    button.append(key, visual(option.kind, option.value));
    if (option.kind === 'flag') button.setAttribute('aria-label', `Flag ${i + 1}`);
    button.addEventListener('click', () => answer(i));
    return button;
  }));
  $('feedback').textContent = ''; $('feedback').className = 'feedback';
  $('next').hidden = true;
  grid.querySelector('button')?.focus({ preventScroll: true });
}
function answer(index) {
  const q = round.questions[round.at];
  if (round.answers.length > round.at) return;
  const correct = index === q.answer;
  round.answers.push(correct);
  [...$('options').children].forEach((button, i) => {
    button.disabled = true;
    if (i === q.answer) { button.classList.add('is-answer'); button.append(Object.assign(document.createElement('span'), { className: 'opt-mark', textContent: '✓ Answer' })); }
    else if (i === index) { button.classList.add('is-wrong'); button.append(Object.assign(document.createElement('span'), { className: 'opt-mark', textContent: '✗ Your pick' })); }
  });
  if (CARD_MODES.includes(q.mode)) save.cards[q.id] = review(save.cards[q.id] || newCard(q.id), correct);
  const buttons = [...$('options').children];
  if (correct) { pop(buttons[index], 1.08); burstFrom(buttons[index], { count: 10, spread: 50 }); play('ding'); haptic(15); }
  else { shake(buttons[index]); pop(buttons[q.answer], 1.05); play('wrong'); haptic([25, 40, 25]); }
  persist();
  const fb = $('feedback');
  fb.className = `feedback ${correct ? 'right' : 'wrong'}`;
  fb.replaceChildren(Object.assign(document.createElement('strong'), { textContent: correct ? pickLine(RIGHT) : pickLine(WRONG) }), document.createTextNode(` ${q.explain}`));
  $('q-score').textContent = `${round.answers.filter(Boolean).length} right`;
  $('next').hidden = false;
  $('next').textContent = round.at + 1 < round.questions.length ? 'Next →' : 'See how you did →';
  $('next').focus({ preventScroll: true });
}
const RIGHT = ['Right.', 'Yes.', 'Spot on.', 'Got it.', 'Nailed it.'];
const WRONG = ['Not quite.', 'Close.', 'Nope, but now you know.', 'Not this time.'];
const pickLine = lines => lines[Math.floor(Math.random() * lines.length)];
function next() {
  if (!round) return;
  if (round.at + 1 < round.questions.length) { round.at += 1; showQuestion(); return; }
  finish();
}
function finish() {
  const right = round.answers.filter(Boolean).length, total = round.questions.length;
  const at = new Date().toISOString();
  save.history = [...save.history, { at, kind: round.kind, level: round.level, right, total }].slice(-200);
  let earned = false;
  if (round.kind === 'level') {
    save.best[round.level] = Math.max(save.best[round.level] || 0, right);
    if (total === ROUND && roundPassed(right) && !save.passed.includes(round.level)) { save.passed = [...save.passed, round.level].sort((a, b) => a - b); earned = true; }
  }
  if (round.kind === 'daily' && !(today() in save.daily)) save.daily[today()] = right;
  persist();
  $('quiz-live').hidden = true; $('round-result').hidden = false;
  $('round-score').textContent = `0 of ${total}`; countUp($('round-score'), right, { format: n => `${Math.round(n)} of ${total}` });
  const pass = roundPassed(right, total);
  $('round-title').textContent = earned ? `★ Level ${round.level} star earned` : pass ? 'Lovely round' : right >= total / 2 ? 'Good going' : 'A learning round';
  $('round-detail').textContent = round.kind === 'level'
    ? (pass ? (earned ? 'That’s 8 or more. The star is yours.' : 'Another clean round.') : `Get 8 of 10 for the star. Missed ones come back in Review.`)
    : round.kind === 'review' ? 'Right answers wait longer before they return. Misses come back tomorrow.' : `Daily 10 #${dayNumber()}. Come back tomorrow for a new set.`;
  const missed = round.questions.filter((_, i) => !round.answers[i]);
  $('missed').replaceChildren(...missed.map(q => Object.assign(document.createElement('li'), { textContent: q.explain })));
  $('missed-count').textContent = missed.length;
  $('missed-review').hidden = missed.length === 0;
  $('missed-review').open = false;
  const nextLevel = round.kind === 'level' && pass && round.level < LEVELS.length;
  $('next-level').hidden = !nextLevel;
  $('share').hidden = round.kind !== 'daily';
  $('share-status').textContent = '';
  updateDueBadge();
  renderSide();
  (nextLevel ? $('next-level') : $('again')).focus({ preventScroll: true });
  if (earned) feedback.win(); else if (pass) { play('ding'); haptic(20); }
}

// ---- Side panel -----------------------------------------------------------------------------
function renderSide() {
  $('level-list').replaceChildren(...LEVELS.map(info => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const passed = save.passed.includes(info.n), current = info.n === save.level && mode === 'level';
    button.className = `level${passed ? ' passed' : ''}${current ? ' current' : ''}`;
    button.innerHTML = '<span class="lv-mark" aria-hidden="true"></span><span class="lv-name"></span><span class="lv-goal"></span>';
    button.querySelector('.lv-mark').textContent = passed ? '★' : String(info.n);
    button.querySelector('.lv-name').textContent = info.name;
    button.querySelector('.lv-goal').textContent = save.best[info.n] ? `${save.best[info.n]}/10` : '';
    button.setAttribute('aria-label', `Level ${info.n}, ${info.name}${passed ? ', star earned' : ''}${save.best[info.n] ? `, best ${save.best[info.n]} of 10` : ''}`);
    if (current) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => { save.level = info.n; persist(); setMode('level'); $('start').focus({ preventScroll: true }); });
    item.append(button);
    return item;
  }));
  const cards = Object.values(save.cards);
  const count = prefix => cards.filter(card => card.id.startsWith(prefix) && card.box >= 2).length;
  const known = $('known');
  if (!cards.length) { known.innerHTML = '<p class="empty">Nothing yet. Every question you answer becomes a card that comes back for review.</p>'; }
  else {
    known.innerHTML = '<div class="known-grid"><div><strong data-k="emoji"></strong><small>emoji</small></div><div><strong data-k="flags"></strong><small>flags</small></div><div><strong data-k="symbols"></strong><small>symbols</small></div></div><p class="known-note"></p>';
    known.querySelector('[data-k="emoji"]').textContent = count('e:');
    known.querySelector('[data-k="flags"]').textContent = count('f:');
    known.querySelector('[data-k="symbols"]').textContent = count('s:');
    known.querySelector('.known-note').textContent = `Counted once you’ve got a card right twice in a row. ${cards.length} cards in all, ${mastery(cards)}% at the top of the ladder.`;
  }
  const recent = save.history.slice(-6).reverse();
  $('history').replaceChildren(...(recent.length ? recent.map(item => {
    const li = document.createElement('li');
    const label = item.kind === 'daily' ? 'Daily 10' : item.kind === 'review' ? 'Review' : `Level ${item.level}`;
    li.textContent = `${label}: ${item.right} of ${item.total}`;
    return li;
  }) : [Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Your rounds will show here.' })]));
}

// ---- Browse ---------------------------------------------------------------------------------
const FLAGS_AZ = [...FLAGS].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const BROWSE_SETS = [...GROUPS.map(group => ({ id: group.id, name: `${group.name} (${group.count})` })), { id: 'flags', name: `Flags (${FLAGS.length})` }, { id: 'unicode', name: 'Unicode symbols' }];
let browseSet = 'smileys-emotion', browseItems = [];
async function renderBrowse() {
  const select = $('browse-set');
  if (!select.options.length) select.replaceChildren(...BROWSE_SETS.map(set => Object.assign(document.createElement('option'), { value: set.id, textContent: set.name })));
  select.value = browseSet;
  try {
    if (browseSet === 'flags') browseItems = FLAGS_AZ.map(flag => ({ kind: 'flag', flag, name: flag.name }));
    else if (browseSet === 'unicode') { await loadData({ symbols: true }); browseItems = symbolCache.map(symbol => ({ kind: 'symbol', symbol, name: symbol[1] })); }
    else { await loadData({ groups: [browseSet] }); browseItems = emojiCache[browseSet].map(record => ({ kind: 'emoji', record, name: record[1] })); }
  } catch { $('browse-count').textContent = 'Couldn’t load this set. Check your connection.'; return; }
  drawBrowse();
}
// Browse shows one page of tiles at a time, and a page is exactly what fits (2.74): whole rows, no box that scrolls
// inside the page. The rows come from the room between the grid and the bottom of the window, so the page buttons
// stay in view on a phone and on a desktop alike.
const TILE_ROW = { emoji: 52, flags: 60 };
let browsePage = 1, browseKey = '', browseSize = 0, browseDraw = 0;
function pageSize(grid) {
  const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
  const top = grid.getBoundingClientRect().top + window.scrollY;
  const pagerRoom = 64, rowHeight = TILE_ROW[grid.classList.contains('flags') ? 'flags' : 'emoji'];
  const detail = $('browse-detail').getBoundingClientRect().height + 12;
  let room = window.innerHeight - top - pagerRoom;
  // Keep the name card in view too when there is room for it (desktops and tablets).
  if ((room - detail) / rowHeight >= 5) room -= detail;
  const rows = Math.max(4, Math.min(10, Math.floor(room / rowHeight)));
  // A very short window (a phone on its side) still gets a useful page: at least 24 tiles.
  return columns * Math.max(rows, Math.ceil(24 / columns));
}
async function drawBrowse() {
  const request = ++browseDraw;
  const term = $('browse-search').value.trim().toLowerCase();
  const all = term ? browseItems.filter(item => item.name.toLowerCase().includes(term)) : browseItems;
  const grid = $('browse-grid');
  grid.className = `browse-grid${browseSet === 'flags' ? ' flags' : ''}`;
  const size = pageSize(grid);
  if (browseKey !== `${browseSet}|${term}`) { browseKey = `${browseSet}|${term}`; browsePage = 1; }
  // When the window changes shape, stay on the page that holds what was first on screen.
  else if (browseSize && size !== browseSize) browsePage = Math.floor(((browsePage - 1) * browseSize) / size) + 1;
  browseSize = size;
  const pages = Math.max(1, Math.ceil(all.length / size));
  browsePage = Math.min(browsePage, pages);
  const items = all.slice((browsePage - 1) * size, browsePage * size);
  $('browse-count').textContent = `${all.length} ${all.length === 1 ? 'item' : 'items'}${term ? ` matching “${term}”` : ''}${pages > 1 ? ` · page ${browsePage} of ${pages}` : ''}`;
  let nav = $('browse-pager');
  if (!nav) { nav = document.createElement('nav'); nav.id = 'browse-pager'; nav.setAttribute('aria-label', 'Browse pages'); grid.after(nav); }
  renderPager(nav, browsePage, pages, page => { browsePage = page; drawBrowse(); $('browse-count').scrollIntoView({ block: 'nearest' }); }, { short: window.innerWidth < 520 });
  try { await loadArt(items.filter(item => item.kind === 'flag').map(item => item.flag)); }
  catch { if (request === browseDraw) $('browse-count').textContent = 'Couldn’t load the flags. Check your connection.'; return; }
  if (request !== browseDraw) return;
  grid.replaceChildren(...items.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.setAttribute('aria-label', item.name);
    button.title = item.name;
    if (item.kind === 'flag') button.innerHTML = flagPicture(item.flag);
    else button.textContent = item.kind === 'emoji' ? item.record[0] : item.symbol[0];
    button.addEventListener('click', () => showDetail(item));
    return button;
  }));
}
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (mode === 'browse' && pageSize($('browse-grid')) !== browseSize) drawBrowse(); }, 150); });
function showDetail(item) {
  const box = $('browse-detail');
  const big = document.createElement('div'); big.className = 'detail-big'; big.setAttribute('aria-hidden', 'true');
  const title = document.createElement('h3');
  const lines = [];
  if (item.kind === 'flag') {
    const flag = item.flag;
    big.innerHTML = flagPicture(flag); big.classList.add('flag');
    title.textContent = flag.name;
    if (flag.capital) lines.push(`Capital: ${flag.capital}`);
    if (flag.continent) lines.push(`Continent: ${flag.continent}`); else if (!flag.territory) lines.push('Spans Europe and Asia');
    if (flag.territory) lines.push('Not a country of its own, but it has a flag in Unicode.');
    if (flag.same) lines.push(`It flies the flag of ${flagByCode[flag.same].name}.`);
    if (!shown(flag).art) lines.push(`Shape: ${flag.ratio[0]}:${flag.ratio[1]}`);
    if (flag.note) lines.push(flag.note);
    lines.push(`As an emoji, this flag is ${flag.code.length === 2 ? `two letters, ${flag.code.split('').join(' + ')}` : 'a black flag with hidden letters'}, which each device draws its own way.`);
  } else if (item.kind === 'symbol') {
    const [ch, name, hex, family] = item.symbol;
    big.textContent = ch;
    title.textContent = name;
    lines.push(`U+${hex} · ${family}`, 'A Unicode character, not an emoji: it takes the colour of the text around it.');
  } else {
    const [ch, name, hex, version, subgroup] = item.record;
    big.textContent = ch;
    title.textContent = name;
    lines.push(codeLabel(hex), versionLabel(version), `Filed under ${SUBGROUPS[subgroup] || 'its group'}`);
    if (isSequence(item.record)) lines.push(`Built from ${sequenceParts(item.record).join(' + ')} with zero-width joiners.`);
  }
  const list = document.createElement('ul');
  list.replaceChildren(...lines.map(line => Object.assign(document.createElement('li'), { textContent: line })));
  box.replaceChildren(big, title, list);
  // On a phone the name card sits under the grid: bring it into view so a tap always shows its answer.
  box.scrollIntoView({ block: 'nearest' });
}

// ---- Wiring ---------------------------------------------------------------------------------
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('start').addEventListener('click', startRound);
$('next').addEventListener('click', next);
$('again').addEventListener('click', () => { showStart(); startRound(); });
$('next-level').addEventListener('click', () => { save.level = Math.min(LEVELS.length, (round?.level || save.level) + 1); persist(); setMode('level'); $('start').focus({ preventScroll: true }); });
$('share').addEventListener('click', async () => {
  if (!round) return;
  const right = round.answers.filter(Boolean).length;
  const text = `Ziggle Emoji Daily 10 #${dayNumber()} · ${right}/${round.questions.length}\n${round.answers.map(ok => (ok ? '🟩' : '🟥')).join('')}\n${location.origin}/play/emoji.html`;
  $('share-status').textContent = await hub()?.shareRaw?.(text) || text;
});
$('browse-set').addEventListener('change', event => { browseSet = event.target.value; $('browse-search').value = ''; $('browse-detail').innerHTML = '<p class="empty">Pick anything to see its name, code and story.</p>'; renderBrowse(); });
$('browse-search').addEventListener('input', drawBrowse);
document.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || !round || $('quiz-live').hidden || $('uni-dialog').open) return;
  if (/^[1-4]$/.test(event.key) && round.answers.length === round.at) {
    const index = Number(event.key) - 1;
    if (index < round.questions[round.at].options.length) { event.preventDefault(); answer(index); }
  }
});
const dialog = $('uni-dialog');
const openHelp = () => (dialog.showModal ? dialog.showModal() : dialog.setAttribute('open', ''));
$('uni-help').addEventListener('click', openHelp);
$('close-uni-help').addEventListener('click', () => dialog.close());
$('uni-help-done').addEventListener('click', () => dialog.close());
const params = new URLSearchParams(location.search);
setMode(['level', 'review', 'daily', 'browse'].includes(params.get('mode')) ? params.get('mode') : 'level');

registerHowTo({ id:'emoji', help:'uni-dialog', snapshot:()=>({ key:mode+save.level, fresh:mode !== 'browse', ready:!round, rules:[levelInfo(save.level).flags && 'emoji-flags', ...levelInfo(save.level).modes.filter(m=>['build','group','code','symbol','first'].includes(m)).map(m=>'emoji-'+(m==='first'?'history':m))].filter(Boolean) }) });
