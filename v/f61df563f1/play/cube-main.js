import { registerHowTo } from './howto-boot.js';
import { solved, clone, apply, invert, facelets, isSolved, layerSolved, topOriented, beginnerStage, scramble, average, mean, shuffled, formatTime, effective, faceGrid, validAlg, SCRAMBLE_LENGTH } from './cube-engine.js';
import { renderPager } from './pager.js';
import { BEGINNER, TWO_LOOK, PLL, OLL, ORTEGA_PBL, PARITY } from './cube-algs.js';
import { f2lCases, algorithmCase, algorithmSetup, stageCase, goalMet, llDiagram, netDiagram } from './cube-cases.js';
import { mountCube } from './cube-view.js';
import { coach, follower } from './cube-coach.js';
import { newCard, review, dueCards } from './review-core.js';
import { feedback, play, haptic, burstFrom } from './fx.js';

const $ = id => document.getElementById(id);
const hub = () => globalThis.Ziggle;
const STORAGE_KEY = 'ziggle-cube-v1';
const SIZES = [2, 3, 4, 5, 6, 7];
/** replaceChildren without the stray "null" text a skipped part would leave. */
const fill = (box, ...kids) => box.replaceChildren(...kids.flat().filter(kid => kid != null && kid !== false));
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value; // only Ziggle's own SVG strings
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return el;
}

// ---- Saves ----------------------------------------------------------------------------------------
const blank = () => ({ version: 1, level: 1, passed: [], stages: [], parts: [], best: {}, cards: {}, learned: [], times: {}, history: [], settings: { letters: false, view: '3d', inspection: true, size: 3, bpm: 60, metronome: false } });
const finite = (v, min, max, fallback) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
const ALG_ID = /^(oll-\d{1,2}|pll-[A-Za-z]{1,2}|f2l-\d{1,2}|eo-[a-z]+|co-[a-z]+|cp-[a-z]+|ep-[a-z]+|pbl-[a-z-]+|parity-[a-z]+)$/;
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!v || v.version !== 1) return blank();
    const times = {};
    for (const size of SIZES) times[size] = (Array.isArray(v.times?.[size]) ? v.times[size] : []).filter(t => t && Number.isFinite(t.ms)).slice(-500).map(t => ({ ms: finite(t.ms, 0, 36e5, 0), penalty: ['+2', 'dnf'].includes(t.penalty) ? t.penalty : '', at: String(t.at || '').slice(0, 30), scramble: String(t.scramble || '').slice(0, 800), metronome: t.metronome === true }));
    const cards = {};
    for (const [id, c] of Object.entries(v.cards || {})) if (ALG_ID.test(id.replace(/^r:/, '')) && c) cards[id] = { id, box: finite(c.box, 0, 5, 0), due: finite(c.due, 0, 1e14, 0), seen: finite(c.seen, 0, 1e6, 0), right: finite(c.right, 0, 1e6, 0), last: finite(c.last, 0, 1e14, 0) };
    const s = v.settings || {};
    return {
      version: 1, level: finite(v.level, 1, 10, 1), times, cards,
      passed: Array.isArray(v.passed) ? [...new Set(v.passed.filter(n => Number.isInteger(n) && n >= 1 && n <= 10))] : [],
      stages: Array.isArray(v.stages) ? [...new Set(v.stages.filter(id => BEGINNER.some(b => b.id === id)))] : [],
      parts: Array.isArray(v.parts) ? [...new Set(v.parts.filter(id => typeof id === 'string' && id.length < 30))] : [],
      best: Object.fromEntries(Object.entries(v.best || {}).filter(([k]) => /^[1-9]0?$/.test(k)).map(([k, x]) => [k, finite(x, 0, 10, 0)])),
      learned: Array.isArray(v.learned) ? [...new Set(v.learned.filter(id => ALG_ID.test(id)))] : [],
      history: (Array.isArray(v.history) ? v.history : []).filter(x => x && typeof x.at === 'string').slice(-200),
      settings: { letters: s.letters === true, view: s.view === 'net' ? 'net' : '3d', inspection: s.inspection !== false, size: SIZES.includes(s.size) ? s.size : 3, bpm: finite(s.bpm, 30, 240, 60), metronome: s.metronome === true },
    };
  } catch { return blank(); }
}
let save = load();
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); $('save-status').textContent = 'Progress saves in this browser'; }
  catch { $('save-status').textContent = 'Browser storage unavailable — keep this tab open'; }
}

// ---- The cube on screen ------------------------------------------------------------------------------
let onCubeMove = () => {};
const view = mountCube($('cube-host'), { onMove: (name, move) => onCubeMove(name, move) });
view.set(solved(3));
view.intro();
view.setView(save.settings.view);
view.setLetters(save.settings.letters);
$('opt-letters').checked = save.settings.letters;
$('opt-net').checked = save.settings.view === 'net';
$('opt-letters').addEventListener('change', event => { save.settings.letters = event.target.checked; persist(); view.setLetters(save.settings.letters); renderAlgs(); });
$('opt-net').addEventListener('change', event => { save.settings.view = event.target.checked ? 'net' : '3d'; persist(); view.setView(save.settings.view); });
$('cam-reset').addEventListener('click', () => view.resetCamera());

function movePad(n) {
  const pad = $('move-pad');
  const faces = ['U', 'D', 'R', 'L', 'F', 'B'];
  const wide = n >= 4 && $('opt-wide')?.checked;
  const rows = faces.map(f => [f, `${f}'`, `${f}2`].map(t => (wide ? t.replace(f, `${f}w`) : t)));
  if (n % 2 === 1) rows.push(['M', "M'", 'M2'], ['E', "E'", 'S']);
  rows.push(['x', 'y', 'z'], ["x'", "y'", "z'"]);
  pad.replaceChildren(...rows.flat().map(token => h('button', { type: 'button', class: 'pad-key', onclick: () => view.play(token) }, token)));
  $('wide-row').hidden = n < 4;
}
$('opt-wide').addEventListener('change', () => movePad(view.cube.n));

// ---- Tabs -----------------------------------------------------------------------------------------------
let tab = 'learn';
function setTab(next) {
  tab = next;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
  for (const id of ['learn-panel', 'timer-panel', 'algs-panel', 'play-panel']) $(id).hidden = id !== `${tab}-panel`;
  $('cube-card').hidden = tab === 'algs' || (tab === 'timer');
  stopRound();
  if (tab === 'learn') renderLearn();
  if (tab === 'timer') renderTimer();
  if (tab === 'algs') renderAlgs();
  if (tab === 'play') renderPlay();
  renderSide();
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

// ---- Levels -------------------------------------------------------------------------------------------------
const LEVELS = [
  { n: 1, name: 'Meet the cube', blurb: 'Centres never move, edges have two stickers, corners three. Learn the letters every algorithm is written in.', lesson: ['Hold the cube with yellow on top and green facing you.', 'Each letter turns one face clockwise, as if you were looking straight at that face: U (up), D (down), R (right), L (left), F (front), B (back).', 'A dash (′) means anticlockwise; a 2 means a half turn. M turns the middle slice like L; x, y and z turn the whole cube like R, U and F.', 'Drill: do each move asked for. 9 of 10 to pass.'] },
  { n: 2, name: 'First solve', blurb: 'Layer by layer: the white cross, white corners, middle edges, then the yellow side in four steps.', lesson: ['Seven steps, each with one short move to learn. Practise each step on its own, then try a full solve.', 'White goes underneath; yellow on top.', 'Practise all seven steps for the star. Stuck in a full solve? The hint knows which step you’re on.'] },
  { n: 3, name: '2×2', blurb: 'The Ortega method: make one face, orient the top (7 cases), then fix both layers at once (6 cases).', lesson: ['Make a white face on the bottom (the side colours don’t need to match yet).', 'Orient the top with one of the 7 corner moves, the same ones as the 3×3’s Sune family.', 'Then one move fixes both layers: the PBL cases.', 'Round: 10 cases. 8 solved without peeking to pass.'] },
  { n: 4, name: 'Four-look last layer', blurb: 'Two-look OLL and two-look PLL: 16 algorithms that finish any 3×3 from the first two layers.', lesson: ['Look 1: make the yellow cross (3 cases). Look 2: make the yellow face (7 cases).', 'Look 3: put the corners in place (2 cases). Look 4: the edges (4 cases).', 'Round: 10 cases. 8 solved without peeking to pass.'] },
  { n: 5, name: 'F2L', blurb: 'Pair a corner with its edge and drop them in together: 41 cases, all solved with a few simple moves.', lesson: ['Find the white corner and the edge that matches its two side colours.', 'Join them in the top layer, then insert them together with R U R′ or F′ U′ F.', 'Ziggle’s solutions use only those inserts, the sledgehammer (R′ F R F′) and one edge flip: learn the idea, not 41 strings.', 'Round: 10 pairs. 8 solved without peeking to pass.'] },
  { n: 6, name: 'Full PLL', blurb: 'All 21 permutations, recognised from the top row of the sides.', lesson: ['Look at the side colours of the top layer: headlights (two matching corners) and bars (three in a row) give most cases away.', 'Round: 10 pictures. Name 8 to pass. Missed ones come back in review.'] },
  { n: 7, name: 'Full OLL', blurb: 'All 57 orientations, recognised by the shape of the yellow stickers.', lesson: ['Count the yellow edges first: none (dot), two (line or L) or four (cross). Then the corners.', 'Round: 10 pictures. Name 8 to pass.'] },
  { n: 8, name: 'Lookahead', blurb: 'Slow and smooth beats fast and choppy: solve to a metronome, one turn per beat, looking for the next piece while you turn.', lesson: ['Set a slow beat you can keep without pausing. Pauses are the time you lose.', 'While you insert one pair, find the next one.', 'Do five timed solves with the metronome on for the star.'] },
  { n: 9, name: 'Big cubes', blurb: '4×4 to 7×7: solve the centres, pair the edges, then finish like a 3×3. Even sizes add two parity cases.', lesson: ['Centres first: build each face’s centre block.', 'Pair up matching edge pieces into full edges.', 'Now solve it like a 3×3, turning only the outer layers.', 'On 4×4 and 6×6 you may meet one flipped edge (OLL parity) or two swapped edges (PLL parity). Practise both for the star.'] },
  { n: 10, name: 'Mastery', blurb: 'Your own goals: averages of five under 60, 30, 20, 15 and 10 seconds. The timer works with a real cube too.', lesson: ['Times are averages of five (the best and worst are dropped).', 'An average under 30 seconds on a 3×3 earns the star.', 'Records stay yours: nothing is sent anywhere.'] },
];
const levelInfo = n => LEVELS[Math.max(1, Math.min(10, n)) - 1];

function renderLearn() {
  const info = levelInfo(save.level);
  $('cube-kicker').textContent = `LEVEL ${info.n} OF 10${save.passed.includes(info.n) ? ' · ★ EARNED' : ''}`;
  $('cube-title').textContent = info.name;
  $('cube-blurb').textContent = info.blurb;
  const panel = $('learn-panel');
  const actions = [];
  const start = (label, run, primary = true) => h('button', { type: 'button', class: primary ? 'primary-button' : 'secondary-button', onclick: run }, label);
  if (info.n === 1) actions.push(start('Start the notation drill', () => notationRound()));
  if (info.n === 2) {
    actions.push(h('ol', { class: 'stage-list' }, ...BEGINNER.map((stage, i) => h('li', {}, h('button', { type: 'button', class: `stage${save.stages.includes(stage.id) ? ' done' : ''}`, onclick: () => stagePractice(i) }, h('span', { class: 'stage-mark', 'aria-hidden': 'true' }, save.stages.includes(stage.id) ? '✓' : String(i + 1)), h('span', {}, stage.name), save.stages.includes(stage.id) ? h('span', { class: 'sr-only' }, ' (practised)') : null)))));
    actions.push(start('Full solve with the coach', () => fullSolve(), false));
  }
  if (info.n === 3) actions.push(start('Start a 2×2 round', () => caseRound(3)));
  if (info.n === 4) actions.push(start('Start a last-layer round', () => caseRound(4)));
  if (info.n === 5) actions.push(start('Start an F2L round', () => caseRound(5)));
  if (info.n === 6) actions.push(start('Start PLL recognition', () => recognitionRound('pll')));
  if (info.n === 7) actions.push(start('Start OLL recognition', () => recognitionRound('oll')));
  if (info.n === 8) actions.push(start('Open the timer with the metronome', () => { save.settings.metronome = true; persist(); setTab('timer'); }), h('p', { class: 'note' }, `${metronomeSolves()} of 5 metronome solves done.`));
  if (info.n === 9) actions.push(...PARITY.map(p => start(`${save.parts.includes(p.id) ? '✓ ' : ''}${p.name}`, () => singleCase(p, 4, 'solved', () => { if (!save.parts.includes(p.id)) save.parts.push(p.id); checkLevel9(); }), false)), start('Free play on a 5×5', () => { setTab('play'); setSize(5); scrambleCube(); }, false));
  if (info.n === 10) actions.push(goalsList(), start('Open the timer', () => setTab('timer')));
  panel.replaceChildren(h('ol', { class: 'lesson' }, ...info.lesson.map(line => h('li', {}, line))), h('div', { class: 'learn-actions' }, ...actions), h('div', { class: 'round', id: 'round', hidden: true }));
  if (info.n !== 6 && info.n !== 7) { $('cube-card').hidden = false; if (!round) { setSize(info.n === 3 ? 2 : info.n === 9 ? 4 : 3); view.set(solved(view.cube.n)); } }
  else $('cube-card').hidden = true;
}
function goalsList() {
  const goals = [60, 30, 20, 15, 10];
  const best3 = bestAverage(3, 5), best2 = bestAverage(2, 5);
  return h('ul', { class: 'goals' }, ...goals.map(s => h('li', { class: best3 !== null && best3 < s * 1000 ? 'met' : '' }, h('span', { 'aria-hidden': 'true' }, best3 !== null && best3 < s * 1000 ? '★' : '☆'), ` 3×3 average of 5 under ${s} s`)), h('li', { class: best2 !== null && best2 < 10000 ? 'met' : '' }, h('span', { 'aria-hidden': 'true' }, best2 !== null && best2 < 10000 ? '★' : '☆'), ' 2×2 average of 5 under 10 s'));
}
function bestAverage(size, count) {
  const list = save.times[size] || [];
  let best = null;
  for (let i = count; i <= list.length; i++) { const a = average(list.slice(0, i), count); if (a !== null && a !== Infinity && (best === null || a < best)) best = a; }
  return best;
}
const metronomeSolves = () => Object.values(save.times).flat().filter(t => t.metronome && t.penalty !== 'dnf').length;
function earn(level) {
  if (save.passed.includes(level)) return false;
  save.passed = [...save.passed, level].sort((a, b) => a - b); persist(); renderSide();
  hub()?.toast?.(`★ Cube Level ${level} star earned`);
  return true;
}
function checkLevel9() { if (PARITY.every(p => save.parts.includes(p.id))) earn(9); persist(); }

// ---- Rounds: the shared engine for drills ------------------------------------------------------------------
let round = null;
function stopRound() { round = null; onCubeMove = () => {}; const el = $('round'); if (el) el.hidden = true; }
function setSize(n) { if (view.cube.n !== n) view.set(solved(n)); movePad(n); $('size-select').value = String(n); }
function roundBox() { const el = $('round'); el.hidden = false; return el; }

function notationRound() {
  const moves = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'L', "L'", 'D', "D'", 'B', "B'", 'M', "M'", 'x', 'y', "y'"];
  const prompts = Array.from({ length: 10 }, () => moves[Math.floor(Math.random() * moves.length)]);
  setSize(3); view.set(solved(3));
  round = { kind: 'notation', prompts, at: 0, right: 0, base: solved(3), pending: [] };
  const draw = () => {
    const box = roundBox();
    if (round.at >= prompts.length) return finishRound(1, round.right, prompts.length);
    fill(box, h('p', { class: 'round-count' }, `Move ${round.at + 1} of ${prompts.length} · ${round.right} right`), h('p', { class: 'prompt-move' }, `Do: ${prompts[round.at]}`), h('p', { class: 'note' }, 'Drag a sticker, press the letter (Shift for ′), or use the buttons. Half turns: do the quarter turn twice.'));
  };
  onCubeMove = () => {
    const want = apply(clone(round.base), prompts[round.at]);
    if (facelets(view.cube) === facelets(want)) { round.half = false; round.right += 1; round.at += 1; round.base = clone(view.cube); flash(true); draw(); return; }
    // Half turns take two moves; give the second one a chance.
    if (prompts[round.at].endsWith('2') && !round.half) { round.half = true; return; }
    round.half = false; flash(false); round.at += 1; view.set(want); round.base = clone(want); draw();
  };
  draw(); view.focus();
}
/** A solved cube spins and the confetti falls. */
function celebrateSolve() { view.celebrate(); feedback.win(); }
function flash(ok) { if (ok) { play('ding'); haptic(15); burstFrom($('cube-host'), { count: 12, spread: 90 }); } else { play('wrong'); haptic([25, 40, 25]); } const el = $('cube-host'); el.classList.remove('ok', 'no'); void el.offsetWidth; el.classList.add(ok ? 'ok' : 'no'); setTimeout(() => el.classList.remove('ok', 'no'), 500); }

/**
 * The live coach (2.6): under the steps, the next few turns for the cube as it is now. Each turn you make ticks
 * off; turn something else and it works out a new way from where the cube is. "Do the next turn" plays one.
 */
function mountCoach({ step = null } = {}) {
  const head = h('p', { class: 'coach-step' }), list = h('ol', { class: 'coach-moves', 'aria-label': 'Next turns' }), why = h('p', { class: 'coach-why' }), note = h('p', { class: 'coach-note', role: 'status', 'aria-live': 'polite' });
  const next = h('button', { type: 'button', class: 'secondary-button', onclick: () => { const token = plan?.moves && follow?.steps[at]; if (token) view.play(token); } }, 'Do the next turn');
  const el = h('div', { class: 'coach' }, head, list, why, note, h('div', { class: 'round-actions' }, next));
  let plan = null, follow = null, at = 0, stage = null, timer = 0;
  const draw = (pos, message = '') => {
    at = pos.done;
    head.textContent = plan.stage >= 0 && plan.stage < 7 ? `Step ${plan.stage + 1} of 7 · ${plan.name}${plan.progress ? ` · ${plan.progress}` : ''}` : plan.name;
    list.replaceChildren(...(follow?.steps || []).map((token, i) => h('li', { class: i < pos.done ? 'done' : i === pos.done ? 'now' : '', 'aria-current': i === pos.done ? 'step' : null }, i === pos.done && pos.halfway ? `${token} · one more` : token)));
    list.hidden = !follow;
    why.textContent = plan.moves === null ? 'No short way found from here. Use the tip above, and the coach will pick up again as you go.' : plan.why || '';
    note.textContent = message || (plan.stage === 7 ? 'Solved! Nicely done.' : follow ? 'Do these turns; each one ticks off. Any other turn is fine too: the plan follows your cube.' : '');
    next.hidden = !follow;
  };
  const fresh = message => {
    plan = coach(view.cube);
    if (!plan) { el.hidden = true; return; }
    el.hidden = false;
    let text = message;
    if (stage !== null && plan.stage > stage && plan.stage <= 7) text = plan.stage === 7 ? '' : `✓ ${BEGINNER[stage]?.name || 'Step'} done. On to ${plan.name.toLowerCase()}.`;
    stage = plan.stage;
    follow = plan.moves ? follower(view.cube, plan.moves) : null;
    draw({ done: 0 }, text);
  };
  const update = name => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!follow) return fresh();
      const pos = follow.track(view.cube, name);
      if (pos.off) return fresh(`That turn wasn’t in the plan${pos.back ? ` (${pos.back} would undo it)` : ''}, so here’s a new way from where your cube is now.`);
      if (pos.done >= pos.total) return fresh();
      draw(pos);
    }, 30);
  };
  fresh();
  return { el, update, fresh, get stage() { return stage; } };
}
/** Ticks for a known algorithm (cases): each turn lights up as the cube reaches it. */
function mountTicks(start, alg) {
  const follow = follower(start, alg);
  const list = h('ol', { class: 'coach-moves', 'aria-label': 'The algorithm, turn by turn' }, ...follow.steps.map((token, i) => h('li', { class: i === 0 ? 'now' : '' }, token)));
  const note = h('p', { class: 'coach-note', role: 'status', 'aria-live': 'polite' });
  const el = h('div', { class: 'coach coach-ticks' }, list, note);
  const update = name => {
    const pos = follow.track(view.cube, name);
    [...list.children].forEach((li, i) => { li.className = i < pos.done ? 'done' : i === pos.done ? 'now' : ''; li.textContent = follow.steps[i] + (i === pos.done && pos.halfway ? ' · one more' : ''); });
    note.textContent = pos.off ? `Off the algorithm${pos.back ? `: ${pos.back} takes you back` : ''}. Or solve it your own way.` : '';
  };
  return { el, update };
}
function stagePractice(index) {
  const stage = BEGINNER[index];
  setSize(3); view.set(stageCase(index));
  round = { kind: 'stage', index };
  const box = roundBox();
  const live = mountCoach();
  fill(box, h('p', { class: 'round-count' }, `Step ${index + 1} of 7: ${stage.name}`), h('p', {}, stage.tip), stage.alg ? h('p', { class: 'alg' }, stage.alg) : null, stage.alt ? h('p', { class: 'alg' }, stage.alt) : null, h('p', { class: 'note', id: 'stage-status', 'aria-live': 'polite' }, 'Finish this step to tick it off.'), live.el,
    h('div', { class: 'round-actions' }, h('button', { type: 'button', class: 'secondary-button', onclick: () => stagePractice(index) }, 'New practice cube')));
  let ticked = false;
  onCubeMove = name => {
    live.update(name);
    if (ticked || !goalMet(stage.goal, view.cube)) return;
    ticked = true;
    if (!save.stages.includes(stage.id)) { save.stages.push(stage.id); persist(); }
    $('stage-status').textContent = `✓ ${stage.name} done.${index < 6 ? ' On to the next step.' : ' The cube is solved!'}`;
    if (stage.goal === 'solved') celebrateSolve(); else flash(true);
    const button = document.querySelector(`.stage-list li:nth-child(${index + 1}) .stage`);
    if (button) { button.classList.add('done'); button.querySelector('.stage-mark').textContent = '✓'; }
    if (BEGINNER.every(b => save.stages.includes(b.id))) earn(2);
  };
  view.focus();
}
function fullSolve() {
  setSize(3); view.set(apply(solved(3), scramble(3)));
  round = { kind: 'full' };
  const box = roundBox();
  const live = mountCoach();
  live.el.hidden = true;
  const show = h('button', { type: 'button', class: 'secondary-button', 'aria-expanded': 'false', onclick: () => { live.el.hidden = !live.el.hidden; if (!live.el.hidden) live.fresh(); show.setAttribute('aria-expanded', String(!live.el.hidden)); show.textContent = live.el.hidden ? 'Coach me' : 'Hide the coach'; } }, 'Coach me');
  fill(box, h('p', { class: 'round-count' }, 'Full solve'), h('p', { class: 'note' }, 'Use the steps you’ve practised. The coach can follow along and show the next turns from wherever your cube is.'), live.el, h('div', { class: 'round-actions' }, show, h('button', { type: 'button', class: 'secondary-button', onclick: fullSolve }, 'New scramble')));
  let done = false;
  onCubeMove = name => {
    if (!live.el.hidden) live.update(name);
    if (!done && isSolved(view.cube)) { done = true; celebrateSolve(); save.history.push({ at: new Date().toISOString(), kind: 'full-solve' }); persist(); }
  };
  view.focus();
}

/** Case sets for Levels 3–5 and review. Each case: { id, name, alg, n, goal }. */
function casesFor(level) {
  if (level === 3) return [...TWO_LOOK.filter(t => t.set === 'oll2').map(t => ({ ...t, id: t.id, n: 2, goal: 'oriented2' })), ...ORTEGA_PBL.map(p => ({ ...p, n: 2, goal: 'solved-auf' }))];
  if (level === 4) return TWO_LOOK.map(t => ({ ...t, n: 3, goal: { oll1: 'top-cross', oll2: 'top-face', pll1: 'top-corners', pll2: 'solved-auf' }[t.set] }));
  if (level === 5) return f2lCases().map(c => ({ ...c, n: 3, goal: 'layer2' }));
  return [];
}
function goalReached(goal, cube) {
  if (goal === 'oriented2') return topOriented(cube) && new Set(faceGrid(cube, 'D').flat()).size === 1;
  if (goal === 'solved-auf') return ['', 'U', 'U2', "U'"].some(u => isSolved(apply(clone(cube), u)));
  return goalMet(goal, cube);
}
function caseRound(level) {
  const pool = casesFor(level);
  const due = dueCards(Object.values(save.cards), Date.now(), 50).map(c => c.id).filter(id => pool.some(p => p.id === id));
  const order = [...due, ...shuffled(pool.map(p => p.id))].filter((id, i, list) => list.indexOf(id) === i).slice(0, 10);
  round = { kind: 'cases', level, queue: order.map(id => pool.find(p => p.id === id)), at: 0, right: 0, peeked: false };
  nextCase();
}
function nextCase() {
  const r = round;
  if (r.at >= r.queue.length) return finishRound(r.level, r.right, r.queue.length);
  const item = r.queue[r.at];
  setSize(item.n);
  const setup = item.setup ? { cube: apply(solved(item.n), item.setup), lineUp: '' } : algorithmSetup(item.alg, item.n);
  view.set(setup.cube);
  r.peeked = false;
  const box = roundBox();
  const algLine = h('p', { class: 'alg', id: 'case-alg', hidden: true }, item.alg);
  const startCube = clone(setup.cube); let ticks = null, demonstrating = false;
  const showTicks = () => { if (ticks) return; ticks = mountTicks(startCube, `${setup.lineUp} ${item.alg}`); algLine.after(ticks.el); ticks.update(); };
  fill(box, h('p', { class: 'round-count' }, `Case ${r.at + 1} of ${r.queue.length} · ${r.right} solved`), h('p', { class: 'case-name' }, item.name), h('p', { class: 'note' }, goalText(item.goal)), algLine,
    h('div', { class: 'round-actions' },
      h('button', { type: 'button', class: 'secondary-button', onclick: () => { r.peeked = true; algLine.hidden = false; showTicks(); } }, 'Show the algorithm'),
      h('button', { type: 'button', class: 'secondary-button', onclick: async () => { if (demonstrating) return; demonstrating = true; r.peeked = true; try { await view.busy; algLine.hidden = false; showTicks(); view.set(startCube); ticks.update(); await view.playAll(`${setup.lineUp} ${item.alg}`); } finally { demonstrating = false; } } }, 'Show me'),
      h('button', { type: 'button', class: 'secondary-button', onclick: () => { cardResult(item.id, false); r.at += 1; nextCase(); } }, 'Skip')));
  onCubeMove = name => {
    ticks?.update(name);
    if (!goalReached(item.goal, view.cube)) return;
    const ok = !r.peeked;
    if (ok) r.right += 1;
    cardResult(item.id, ok); flash(ok);
    r.at += 1; onCubeMove = () => {};
    setTimeout(nextCase, 450);
  };
  view.focus();
}
const goalText = goal => ({ oriented2: 'Make the top yellow (the bottom stays white).', 'solved-auf': 'Solve the cube (a last turn of the top is fine).', 'top-cross': 'Make the yellow cross.', 'top-face': 'Make the top all yellow.', 'top-corners': 'Put the yellow corners in place.', layer2: 'Put the pair in the front-right slot.', solved: 'Solve the cube.' }[goal] || '');
function cardResult(id, ok) { save.cards[id] = review(save.cards[id] || newCard(id), ok); persist(); }

function recognitionRound(kind) {
  const pool = kind === 'pll' ? PLL : OLL;
  const due = dueCards(Object.values(save.cards), Date.now(), 50).map(c => c.id.replace(/^r:/, '')).filter(id => pool.some(p => p.id === id));
  const ids = [...due, ...shuffled(pool.map(p => p.id))].filter((id, i, list) => list.indexOf(id) === i).slice(0, 10);
  round = { kind: 'recognise', set: kind, queue: ids.map(id => pool.find(p => p.id === id)), at: 0, right: 0 };
  nextPicture();
}
function nextPicture() {
  const r = round;
  if (r.at >= r.queue.length) return finishRound(r.set === 'pll' ? 6 : 7, r.right, r.queue.length);
  const item = r.queue[r.at], pool = r.set === 'pll' ? PLL : OLL;
  const cube = algorithmCase(item.alg, 3);
  const options = shuffled([item, ...shuffled(pool.filter(p => p.id !== item.id)).slice(0, 3)]);
  const box = roundBox();
  const feedback = h('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  fill(box, h('p', { class: 'round-count' }, `Picture ${r.at + 1} of ${r.queue.length} · ${r.right} right`), h('div', { class: 'll-big', role: 'img', 'aria-label': 'The last layer from above, with the top row of each side', html: llDiagram(cube, { mode: r.set, letters: save.settings.letters }) }),
    h('p', {}, r.set === 'pll' ? 'Which PLL is this?' : 'Which OLL is this?'),
    h('div', { class: 'options' }, ...options.map((opt, i) => h('button', { type: 'button', class: 'option', 'data-first': i === 0 || null, onclick: event => {
      const ok = opt.id === item.id;
      if (ok) r.right += 1;
      save.cards[`r:${item.id}`] = review(save.cards[`r:${item.id}`] || newCard(`r:${item.id}`), ok); persist();
      box.querySelectorAll('.option').forEach(b => { b.disabled = true; if (b.textContent === item.name) b.classList.add('is-answer'); });
      if (!ok) event.currentTarget.classList.add('is-wrong');
      feedback.textContent = `${ok ? 'Right.' : 'Not quite.'} ${item.name}: ${item.alg}`;
      const next = h('button', { type: 'button', class: 'primary-button', id: 'pic-next', onclick: () => { r.at += 1; nextPicture(); } }, r.at + 1 < r.queue.length ? 'Next →' : 'See how you did →');
      box.append(next); next.focus();
    } }, opt.name))), feedback);
  box.querySelector('[data-first]')?.focus();
}
function singleCase(item, n, goal, onDone) {
  setSize(n); const setup = algorithmSetup(item.alg, n); view.set(setup.cube);
  round = { kind: 'single' };
  let demonstrating = false;
  const box = roundBox();
  const ticks = mountTicks(clone(setup.cube), `${setup.lineUp} ${item.alg}`);
  fill(box, h('p', { class: 'round-count' }, item.name), h('p', { class: 'alg' }, item.alg), ticks.el, h('p', { class: 'note', id: 'single-status', 'aria-live': 'polite' }, 'Do the algorithm (or solve it your way).'), h('div', { class: 'round-actions' }, h('button', { type: 'button', class: 'secondary-button', onclick: async () => { if (demonstrating) return; demonstrating = true; try { await view.busy; view.set(setup.cube); ticks.update(); await view.playAll(`${setup.lineUp} ${item.alg}`); } finally { demonstrating = false; } } }, 'Show me')));
  onCubeMove = name => {
    ticks.update(name); if (goalReached(goal === 'solved' ? 'solved-auf' : goal, view.cube)) { $('single-status').textContent = '✓ Done.'; flash(true); onDone(); onCubeMove = () => {}; renderLearn(); } };
  view.focus();
}
function finishRound(level, right, total) {
  const pass = level > 0 && total >= 10 && right >= (level === 1 ? 9 : 8);
  if (level > 0) save.best[level] = Math.max(save.best[level] || 0, right);
  save.history.push({ at: new Date().toISOString(), kind: level ? 'round' : 'review', level, right, total });
  const earned = pass && earn(level);
  persist();
  if (earned) feedback.win(); else if (pass) { play('ding'); haptic(20); }
  const box = roundBox();
  fill(box, h('p', { class: 'result-score' }, `${right} of ${total}`), h('p', {}, level === 0 ? 'Right answers wait longer before they come back.' : earned ? `★ Level ${level} star earned.` : pass ? 'Passed.' : `Get ${level === 1 ? 9 : 8} for the star. Missed ones come back sooner.`),
    h('div', { class: 'round-actions' }, h('button', { type: 'button', class: 'secondary-button', id: 'again', onclick: () => (level === 0 ? reviewRound() : level === 1 ? notationRound() : level >= 6 && level <= 7 ? recognitionRound(level === 6 ? 'pll' : 'oll') : caseRound(level)) }, 'Go again'),
      pass && level > 0 && level < 10 ? h('button', { type: 'button', class: 'primary-button', onclick: () => { save.level = level + 1; persist(); setTab('learn'); } }, 'Next level →') : null));
  onCubeMove = () => {};
  $('again').focus();
  renderSide();
}

// ---- Free play ----------------------------------------------------------------------------------------------
let history = [];
function renderPlay() {
  $('cube-kicker').textContent = 'FREE PLAY'; $('cube-title').textContent = `${view.cube.n}×${view.cube.n} cube`;
  $('cube-blurb').textContent = 'Scramble it, solve it, try algorithms. Drag stickers to turn layers, drag the background to look around.';
  $('cube-card').hidden = false;
  movePad(view.cube.n);
  onCubeMove = (name, move) => { history.push(move); updatePlayStatus(); if (history.length > 2 && isSolved(view.cube)) celebrateSolve(); };
  updatePlayStatus();
}
function updatePlayStatus() {
  const n = view.cube.n;
  const stage = n === 3 ? beginnerStage(view.cube) : null;
  $('play-status').textContent = isSolved(view.cube) ? `Solved${history.length ? ` in ${history.length} moves` : ''}.` : `${history.length} moves.${stage !== null && stage < 7 ? ` Next beginner step: ${BEGINNER[stage].name}.` : ''}`;
}
function scrambleCube() { const s = scramble(view.cube.n); view.set(apply(solved(view.cube.n), s)); history = []; $('play-scramble').textContent = s; updatePlayStatus(); view.focus(); }
$('size-select').addEventListener('change', event => { const n = Number(event.target.value); view.set(solved(n)); movePad(n); history = []; $('play-scramble').textContent = ''; if (tab === 'play') renderPlay(); });
$('play-scramble-btn').addEventListener('click', scrambleCube);
$('play-reset').addEventListener('click', () => { view.set(solved(view.cube.n)); history = []; $('play-scramble').textContent = ''; updatePlayStatus(); });
$('play-undo').addEventListener('click', () => { const last = history.pop(); if (last) view.play({ ...last, quarter: -last.quarter }, { silent: true }).then(updatePlayStatus); });
$('alg-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('alg-input').value.trim();
  if (!validAlg(text, view.cube.n)) { $('alg-status').textContent = `Couldn’t read that for a ${view.cube.n}×${view.cube.n}. Use moves like R U R' U'.`; return; }
  $('alg-status').textContent = '';
  view.playAll(text);
});

// ---- Algorithms library ----------------------------------------------------------------------------------------
function renderAlgs() {
  $('cube-kicker').textContent = 'THE LIBRARY'; $('cube-title').textContent = 'Algorithms';
  $('cube-blurb').textContent = 'Every algorithm the trainer teaches, with a picture of its case. Mark the ones you know: they join your spaced review.';
  const letters = save.settings.letters;
  // One set at a time, 12 cards a page (2.6.5): the library never becomes an endless wall of 150 cards.
  const ALG_PAGE = 12;
  const section = (title, all, n, mode, setNote = '') => { const pages = Math.max(1, Math.ceil(all.length / ALG_PAGE)); algPage = Math.min(algPage, pages); const items = all.slice((algPage - 1) * ALG_PAGE, algPage * ALG_PAGE); const nav = h('nav', { 'aria-label': `${title} pages` }); renderPager(nav, algPage, pages, page => { algPage = page; renderAlgs(); $('algs-panel').scrollIntoView({ block: 'start' }); }); return h('section', { class: 'alg-section' }, h('h3', {}, title, h('small', {}, ` · ${all.length}${pages > 1 ? ` · page ${algPage} of ${pages}` : ''}`)), setNote ? h('p', { class: 'note' }, setNote) : null,
    h('ul', { class: 'alg-grid' }, ...items.map(item => {
      const cube = item.setup ? apply(solved(n), item.setup) : algorithmCase(item.alg, n, () => 0);
      const learned = save.learned.includes(item.id);
      return h('li', { class: 'alg-card' }, h('span', { class: 'alg-pic', html: mode === 'net' ? netDiagram(cube, { letters, cell: 8 }) : llDiagram(cube, { mode, letters }) }), h('strong', {}, item.name), h('code', {}, item.alg),
        h('span', { class: 'alg-actions' }, h('button', { type: 'button', class: 'mini-button', onclick: () => { setTab('play'); setSize(n); view.set(cube); history = []; $('play-scramble').textContent = `Case: ${item.name}. Try ${item.alg}`; updatePlayStatus(); } }, 'Practise'),
          h('label', { class: 'mini-check' }, h('input', { type: 'checkbox', checked: learned, onchange: event => { save.learned = event.target.checked ? [...save.learned, item.id] : save.learned.filter(id => id !== item.id); if (event.target.checked && !save.cards[item.id]) save.cards[item.id] = newCard(item.id); persist(); renderSide(); } }), ' I know it')));
    })), nav); };
  const due = dueCards(Object.values(save.cards), Date.now(), 200).filter(c => save.learned.includes(c.id.replace(/^r:/, ''))).length;
  $('algs-panel').replaceChildren(h('div', { class: 'review-bar' }, h('p', {}, due ? `${due} known algorithm${due === 1 ? ' is' : 's are'} due for review.` : 'Nothing due. Mark algorithms you know and they come back for review, spaced out over days.'), h('button', { type: 'button', class: 'primary-button', disabled: !due, onclick: reviewRound }, 'Review now')),
    h('div', { class: 'section-chips', role: 'group', 'aria-label': 'Algorithm sets' }, ...ALG_SETS.map(([key, label, items]) => h('button', { type: 'button', 'aria-pressed': String(key === algSet), onclick: () => { algSet = key; algPage = 1; renderAlgs(); } }, `${label} · ${items().length}`))),
    (() => { const [, label, items, n, mode, note] = ALG_SETS.find(set => set[0] === algSet) || ALG_SETS[0]; return section(label, items(), n, mode, note); })());
}
const ALG_SETS = [
  ['beginner', 'Beginner method', () => BEGINNER.filter(b => b.alg), 3, 'net', 'Hold yellow on top, white underneath.'],
  ['oll2', 'Two-look OLL', () => TWO_LOOK.filter(t => t.set.startsWith('oll')), 3, 'oll'],
  ['pll2', 'Two-look PLL', () => TWO_LOOK.filter(t => t.set.startsWith('pll')), 3, 'pll'],
  ['f2l', 'F2L pairs', () => f2lCases(), 3, 'net', 'The pair belongs in the front-right slot.'],
  ['pll', 'PLL', () => PLL, 3, 'pll'], ['oll', 'OLL', () => OLL, 3, 'oll'],
  ['pbl', '2×2 Ortega PBL', () => ORTEGA_PBL, 2, 'pll'], ['parity', '4×4 parity', () => PARITY, 4, 'net'],
];
let algSet = 'beginner', algPage = 1;
function reviewRound() {
  const all = [...TWO_LOOK.map(t => ({ ...t, n: 3, goal: { oll1: 'top-cross', oll2: 'top-face', pll1: 'top-corners', pll2: 'solved-auf' }[t.set] })), ...PLL.map(p => ({ ...p, n: 3, goal: 'solved-auf' })), ...OLL.map(o => ({ ...o, n: 3, goal: 'top-face' })), ...f2lCases().map(c => ({ ...c, n: 3, goal: 'layer2' })), ...ORTEGA_PBL.map(p => ({ ...p, n: 2, goal: 'solved-auf' })), ...PARITY.map(p => ({ ...p, n: 4, goal: 'solved-auf' }))];
  const due = dueCards(Object.values(save.cards), Date.now(), 20).map(c => c.id.replace(/^r:/, '')).filter((id, i, list) => save.learned.includes(id) && list.indexOf(id) === i);
  setTab('learn');
  round = { kind: 'cases', level: 0, queue: due.map(id => all.find(a => a.id === id)).filter(Boolean).slice(0, 10), at: 0, right: 0, peeked: false };
  $('cube-card').hidden = false;
  $('cube-kicker').textContent = 'REVIEW'; $('cube-title').textContent = 'Algorithms you know';
  nextCase();
}

// ---- Timer --------------------------------------------------------------------------------------------------
let timer = { state: 'idle', start: 0, raf: 0, inspectStart: 0, holdTimer: 0, scramble: '' }, audio = null, beat = 0;
function renderTimer() {
  $('cube-kicker').textContent = 'TIMER'; $('cube-title').textContent = 'Timer';
  $('cube-blurb').textContent = 'For your real cube or the virtual one. Hold space (or press and hold the timer) until it turns green, then let go to start. Any key stops it.';
  $('timer-size').value = String(save.settings.size);
  $('opt-inspection').checked = save.settings.inspection;
  $('opt-metronome').checked = save.settings.metronome;
  $('bpm').value = String(save.settings.bpm); $('bpm-out').textContent = `${save.settings.bpm} beats a minute`;
  if (!timer.scramble) newScramble();
  renderTimes();
}
function newScramble() {
  const n = save.settings.size;
  timer.scramble = scramble(n);
  $('timer-scramble').textContent = timer.scramble;
  $('timer-display').focus({ preventScroll: true });
  $('scramble-preview').innerHTML = netDiagram(apply(solved(n, 'wca'), timer.scramble), { letters: save.settings.letters, cell: Math.max(6, Math.round(42 / n)) });
}
function setDisplay(text, state) { $('timer-display').textContent = text; $('timer-display').dataset.state = state; }
function tick() {
  if (timer.state === 'running') { setDisplay(formatTime(performance.now() - timer.start), 'running'); timer.raf = requestAnimationFrame(tick); }
  else if (timer.state === 'inspecting') {
    const s = (performance.now() - timer.inspectStart) / 1000;
    setDisplay(s < 15 ? String(Math.ceil(15 - s)) : s < 17 ? '+2' : 'DNF', s >= 8 && s < 15 ? (s >= 12 ? 'warn2' : 'warn') : 'inspect');
    timer.raf = requestAnimationFrame(tick);
  }
}
function holdStart() {
  if (timer.state === 'running') return stopTimer();
  if (timer.state !== 'idle' && timer.state !== 'inspecting') return;
  timer.prev = timer.state;
  if (save.settings.inspection && timer.state === 'idle') { timer.state = 'inspecting'; timer.inspectStart = performance.now(); timer.armed = false; tick(); return; }
  timer.state = timer.prev === 'inspecting' ? 'inspect-hold' : 'holding';
  setDisplay($('timer-display').textContent, 'holding');
  timer.holdTimer = setTimeout(() => { timer.armed = true; setDisplay($('timer-display').textContent, 'ready'); }, 300);
}
function holdEnd() {
  if (timer.state !== 'holding' && timer.state !== 'inspect-hold') return;
  clearTimeout(timer.holdTimer);
  if (!timer.armed) { timer.state = timer.prev; if (timer.state === 'idle') setDisplay($('timer-display').textContent, 'idle'); return; }
  timer.armed = false;
  const inspected = timer.prev === 'inspecting' ? (performance.now() - timer.inspectStart) / 1000 : 0;
  timer.penalty = inspected > 17 ? 'dnf' : inspected > 15 ? '+2' : '';
  timer.state = 'running'; timer.start = performance.now(); beat = 0;
  if (save.settings.metronome) startMetronome();
  tick();
}
function stopTimer() {
  cancelAnimationFrame(timer.raf);
  const ms = Math.round(performance.now() - timer.start);
  timer.state = 'idle'; stopMetronome();
  const n = save.settings.size;
  (save.times[n] ||= []).push({ ms, penalty: timer.penalty || '', at: new Date().toISOString(), scramble: timer.scramble, metronome: save.settings.metronome });
  save.times[n] = save.times[n].slice(-500);
  persist();
  setDisplay(formatTime(effective({ ms, penalty: timer.penalty })), 'idle');
  $('timer-live').textContent = `Time: ${formatTime(effective({ ms, penalty: timer.penalty }))}`;
  if (metronomeSolves() >= 5) earn(8);
  const ao5 = average(save.times[3] || [], 5);
  if (n === 3 && ao5 !== null && ao5 < 30000) earn(10);
  newScramble(); renderTimes();
}
function startMetronome() {
  try {
    audio ||= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    const gap = 60 / save.settings.bpm;
    let next = audio.currentTime + 0.05;
    const schedule = () => {
      if (timer.state !== 'running') return;
      while (next < audio.currentTime + 0.2) {
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.frequency.value = beat % 4 === 0 ? 1200 : 900; gain.gain.setValueAtTime(0.15, next); gain.gain.exponentialRampToValueAtTime(0.001, next + 0.05);
        osc.connect(gain).connect(audio.destination); osc.start(next); osc.stop(next + 0.06);
        next += gap; beat += 1;
      }
      timer.metro = setTimeout(schedule, 50);
    };
    schedule();
  } catch { /* No audio here: the solve still times. */ }
}
function stopMetronome() { clearTimeout(timer.metro); }
function renderTimes() {
  const n = save.settings.size, list = save.times[n] || [];
  const stats = [['Best', list.length ? Math.min(...list.map(effective)) : null], ['Average of 5', average(list, 5)], ['Average of 12', average(list, 12)], ['Mean of 3', mean(list, 3)], ['Solves', list.length]];
  $('timer-stats').replaceChildren(...stats.map(([label, value]) => h('div', {}, h('strong', {}, label === 'Solves' ? String(value) : formatTime(value)), h('small', {}, label))));
  $('times').replaceChildren(...(list.length ? list.slice(-50).reverse().map((t, k) => {
    const index = list.length - 1 - k;
    return h('li', {}, h('span', { class: 'time' }, `${formatTime(effective(t))}${t.penalty === '+2' ? '+' : ''}`), t.metronome ? h('small', { title: 'With the metronome' }, '♩') : null,
      h('button', { type: 'button', class: 'mini-button', 'aria-pressed': String(t.penalty === '+2'), 'aria-label': `Plus two seconds for solve ${index + 1}`, onclick: () => { t.penalty = t.penalty === '+2' ? '' : '+2'; persist(); renderTimes(); } }, '+2'),
      h('button', { type: 'button', class: 'mini-button', 'aria-pressed': String(t.penalty === 'dnf'), 'aria-label': `Did not finish, solve ${index + 1}`, onclick: () => { t.penalty = t.penalty === 'dnf' ? '' : 'dnf'; persist(); renderTimes(); } }, 'DNF'),
      h('button', { type: 'button', class: 'mini-button', 'aria-label': `Delete solve ${index + 1}`, onclick: () => { list.splice(index, 1); persist(); renderTimes(); } }, '✕'));
  }) : [h('li', { class: 'empty' }, 'No solves yet on this size.')]));
}
$('timer-size').addEventListener('change', event => { save.settings.size = Number(event.target.value); persist(); newScramble(); renderTimes(); });
$('opt-inspection').addEventListener('change', event => { save.settings.inspection = event.target.checked; persist(); });
$('opt-metronome').addEventListener('change', event => { save.settings.metronome = event.target.checked; persist(); });
$('bpm').addEventListener('input', event => { save.settings.bpm = Number(event.target.value); $('bpm-out').textContent = `${save.settings.bpm} beats a minute`; persist(); });
$('new-scramble').addEventListener('click', newScramble);
document.addEventListener('keydown', event => {
  if (tab !== 'timer' || event.target.closest('input, select, textarea, button, a')) return;
  if (timer.state === 'running') { event.preventDefault(); stopTimer(); return; }
  if (event.code === 'Space' && !event.repeat) { event.preventDefault(); holdStart(); }
  if (event.key === 'Escape' && timer.state === 'inspecting') { timer.state = 'idle'; setDisplay('0.00', 'idle'); }
});
document.addEventListener('keyup', event => { if (tab === 'timer' && event.code === 'Space') { event.preventDefault(); holdEnd(); } });
$('timer-display').addEventListener('pointerdown', event => { event.preventDefault(); holdStart(); });
$('timer-display').addEventListener('pointerup', event => { event.preventDefault(); holdEnd(); });

// ---- Side panel -----------------------------------------------------------------------------------------------
function renderSide() {
  $('level-list').replaceChildren(...LEVELS.map(info => {
    const passed = save.passed.includes(info.n), current = info.n === save.level && tab === 'learn';
    return h('li', {}, h('button', { type: 'button', class: `level${passed ? ' passed' : ''}${current ? ' current' : ''}`, 'aria-current': current ? 'true' : null, 'aria-label': `Level ${info.n}, ${info.name}${passed ? ', star earned' : ''}`, 'data-tip': info.blurb, 'aria-description': info.blurb, onclick: () => { save.level = info.n; persist(); setTab('learn'); } },
      h('span', { class: 'lv-mark', 'aria-hidden': 'true' }, passed ? '★' : String(info.n)), h('span', { class: 'lv-name' }, info.name)));
  }));
  const rows = SIZES.map(n => { const list = save.times[n] || []; if (!list.length) return null; return h('li', {}, h('span', {}, `${n}×${n}`), h('strong', {}, formatTime(Math.min(...list.map(effective)))), h('small', {}, `ao5 ${formatTime(average(list, 5))}`)); }).filter(Boolean);
  $('records').replaceChildren(...(rows.length ? rows : [h('li', { class: 'empty' }, 'Your best times will show here.')]));
  $('known').textContent = save.learned.length ? `${save.learned.length} algorithms marked as known.` : 'Mark the algorithms you know in the library.';
}

// ---- Start -------------------------------------------------------------------------------------------------------
$('size-select').replaceChildren(...SIZES.map(n => h('option', { value: String(n) }, `${n}×${n}`)));
$('timer-size').replaceChildren(...SIZES.map(n => h('option', { value: String(n) }, `${n}×${n} (${SCRAMBLE_LENGTH[n]}-move scramble)`)));
movePad(3);
const dialog = $('cube-dialog');
$('cube-help').addEventListener('click', () => dialog.showModal());
$('close-cube-help').addEventListener('click', () => dialog.close());
$('cube-help-done').addEventListener('click', () => dialog.close());
const params = new URLSearchParams(location.search);
setTab(['learn', 'timer', 'algs', 'play'].includes(params.get('tab')) ? params.get('tab') : 'learn');

registerHowTo({ id:'cube', help:'cube-dialog', snapshot:()=>({ key:tab+(tab === 'play' ? view.cube.n : save.settings.size), fresh:tab !== 'algs', ready:timer.state === 'idle' && !round, rules:[tab === 'timer' && 'cube-timer', (tab === 'play' ? view.cube.n : save.settings.size) > 3 && 'cube-big'].filter(Boolean) }) });
