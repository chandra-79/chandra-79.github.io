// Word Builder (2.23): a word a day, short quizzes, and a spaced-review deck kept in this browser. Nothing counts toward the streak or leaderboards.
import { VOCAB } from './vocab-data.js';
import { POS_NAMES, TIER_NAMES, asEntry, buildRound, dateKey, known, sentence, wordOfDay } from './vocab-core.js';
import { newCard, review, dueCards, GAPS_DAYS } from './review-core.js';
import { showLevelEnd } from './level-end.js';

const KEY = 'ziggle-vocab-v1';
const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const node = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else if (k.startsWith('on')) node.addEventListener(k.slice(2), v); else node.setAttribute(k, v); } node.append(...kids.flat().filter(kid => kid !== null && kid !== undefined && kid !== false)); return node; };
const load = () => { try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); return { cards: saved.cards || {}, tier: saved.tier || 0, rounds: saved.rounds || {}, ...saved }; } catch { return { cards: {}, tier: 0, rounds: {} }; } };
let save = load(), tab = 'today', round = null;
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); $('save-status').textContent = 'Progress saves in this browser'; } catch { $('save-status').textContent = 'Browser saving is off: this list will not be kept'; } };
const today = () => dateKey();
// One wording for when a word comes back (2.65): “tomorrow”, never “in 1 day”.
const seeAgain = box => box >= GAPS_DAYS.length - 1 ? 'in a couple of months' : GAPS_DAYS[box] <= 1 ? 'tomorrow' : `in ${GAPS_DAYS[box]} days`;
const dueNow = () => dueCards(Object.values(save.cards).map(card => ({ ...card, id: card.id })), Date.now(), 999);
const entryFor = word => { const row = VOCAB.find(item => item[0] === word); return row ? asEntry(row) : null; };

function wordCard(entry, extra) {
  return el('div', { class: 'word-card' },
    el('div', { class: 'word-head' }, el('h3', { class: 'word-big', text: entry.word }), el('span', { class: 'word-pos', text: POS_NAMES[entry.pos] })),
    el('p', { class: 'word-def', text: sentence(entry.def) }),
    entry.example ? el('p', { class: 'word-example', text: `“${sentence(entry.example)}”` }) : null,
    entry.syn.length ? el('p', { class: 'word-links' }, el('strong', { text: 'Similar: ' }), entry.syn.join(', ')) : null,
    entry.ant.length ? el('p', { class: 'word-links' }, el('strong', { text: 'Opposite: ' }), entry.ant.join(', ')) : null, extra);
}
function renderToday() {
  const entry = asEntry(wordOfDay(VOCAB, today())), has = Boolean(save.cards[entry.word]);
  $('vocab-kicker').textContent = `WORD OF THE DAY · ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' }).toUpperCase()}`;
  $('vocab-title').textContent = 'Today’s word';
  const add = el('button', { type: 'button', class: has ? 'secondary-button' : 'primary-button', text: has ? 'In My words ✓' : 'Add to My words', onclick: () => { if (!save.cards[entry.word]) { save.cards[entry.word] = newCard(entry.word); persist(); } renderAll(); } });
  const quiz = el('button', { type: 'button', class: 'secondary-button', text: 'Quiz me on 5 words', onclick: () => go('practice') });
  $('stage').replaceChildren(wordCard(entry, el('div', { class: 'actions-row' }, add, quiz)), el('p', { class: 'note', text: `${VOCAB.length} words, one a day. A new word arrives at midnight.` }));
}

function startRound() {
  const n = (save.rounds[today()] || 0);
  round = { questions: buildRound(VOCAB, { cards: save.cards, tier: save.tier, key: today(), round: n }), index: 0, right: 0, results: [], answered: false };
  save.rounds[today()] = n + 1; persist();
}
function renderPractice() {
  $('vocab-kicker').textContent = save.tier ? `PRACTICE · LEVEL ${save.tier}` : 'PRACTICE · ALL LEVELS'; $('vocab-title').textContent = 'Five quick questions';
  if (!round) { const due = dueNow().length; $('stage').replaceChildren(el('p', { class: 'note', text: due ? `${due} ${due === 1 ? 'word is' : 'words are'} ready to review. They come first.` : 'New words first, then your own words as they come due.' }), el('div', { class: 'actions-row' }, el('button', { type: 'button', class: 'primary-button', text: 'Start', onclick: () => { startRound(); renderPractice(); } }))); return; }
  const q = round.questions[round.index];
  const prompt = q.kind === 'meaning' ? 'What does this word mean?' : q.kind === 'word' ? 'Which word means this?' : 'Which word fits the gap?';
  const text = q.kind === 'meaning' ? el('p', { class: 'q-text' }, q.prompt) : el('p', { class: 'q-text', text: q.kind === 'blank' ? `“${sentence(q.prompt)}”` : q.prompt });
  const feedback = el('div', { class: 'feedback', hidden: '', role: 'status', 'aria-live': 'polite' });
  feedback.hidden = true;
  const next = el('button', { type: 'button', class: 'primary-button', id: 'q-next', hidden: '', text: round.index === round.questions.length - 1 ? 'See how I did' : 'Next word →', onclick: () => { round.index++; round.answered = false; if (round.index >= round.questions.length) finishRound(); else renderPractice(); } });
  next.hidden = true;
  const buttons = q.choices.map((choice, i) => el('button', { type: 'button', class: 'choice', 'data-i': String(i), onclick: () => choose(i) }, el('kbd', { text: String(i + 1) }), el('span', { text: choice.label })));
  function choose(i) {
    if (round.answered) return; round.answered = true;
    const right = i === q.answer; if (right) round.right++;
    round.results.push({ word: q.word, right, wasNew: !save.cards[q.word] });
    const card = review(save.cards[q.word] || newCard(q.word), right); save.cards[q.word] = card; persist();
    buttons.forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    feedback.replaceChildren(el('strong', { text: right ? 'Yes! ' : 'Not quite. ' }), `${q.entry.word} (${POS_NAMES[q.entry.pos]}): ${q.entry.def}.`, ...(q.entry.example ? [el('em', { text: ` “${sentence(q.entry.example)}”` })] : []), el('br'), el('small', { text: `You’ll see it again ${right ? seeAgain(card.box) : 'tomorrow'}.` }));
    feedback.hidden = false; next.hidden = false; next.focus();
  }
  $('stage').replaceChildren(el('p', { class: 'progress', text: `Question ${round.index + 1} of ${round.questions.length} · ${round.right} right so far` }), el('p', { class: 'q-prompt', text: prompt.toUpperCase() }), text, el('div', { class: 'choices', role: 'group', 'aria-label': 'Choices' }, buttons), feedback, next);
  buttons[0].focus({ preventScroll: true });
}
function finishRound() {
  const { right, results, questions } = round, total = questions.length, fresh = results.filter(r => r.wasNew).length, missed = results.filter(r => !r.right).map(r => r.word);
  round = null; renderAll();
  showLevelEnd({ outcome: 'win', symbol: '📖', kicker: `WORD BUILDER · ${save.tier ? `LEVEL ${save.tier}` : 'ALL LEVELS'}`, title: `${right} of ${total} right`, praise: right === total ? 'Every word. Lovely.' : missed.length ? `Back tomorrow: ${missed.slice(0, 3).join(', ')}${missed.length > 3 ? '…' : ''}.` : undefined,
    stats: [['right', `${right}/${total}`], ['new words', fresh], ['in My words', Object.keys(save.cards).length]],
    actions: [{ id: 'next', label: 'Next: five more words →', primary: true, run: () => { go('practice'); startRound(); renderPractice(); } },
      { id: 'share', label: 'Share result', keepOpen: true, run: async () => { const text = `I knew ${right} of ${total} words on Ziggle Word Builder. ${location.origin}/play/vocab.html`; try { if (navigator.share) { await navigator.share({ text }); return 'Shared.'; } await navigator.clipboard.writeText(text); return 'Copied to your clipboard.'; } catch { return 'Sharing didn’t work here.'; } } },
      { id: 'stay', label: 'Look at the board', run: () => go('words') }], onDismiss: () => {} }); // Word Builder's board is My words: the round's words, each with when it comes back
}
function renderWords() {
  $('vocab-kicker').textContent = 'MY WORDS'; $('vocab-title').textContent = 'Your word list';
  const rows = Object.values(save.cards).sort((a, b) => (b.last || 0) - (a.last || 0));
  if (!rows.length) { $('stage').replaceChildren(el('p', { class: 'note', text: 'Nothing here yet. Add today’s word, or answer a few questions and the words you meet will appear here.' })); return; }
  $('stage').replaceChildren(el('ul', { class: 'deck' }, rows.map(card => { const e = entryFor(card.id || card.word); return e ? el('li', {}, el('strong', { text: e.word }), el('span', { class: 'def', text: e.def }), el('span', { class: 'boxes', 'aria-label': `Box ${card.box} of 5`, text: '●'.repeat(Math.max(1, card.box)) + '○'.repeat(Math.max(0, 5 - Math.max(1, card.box))) })) : null; })));
}
function renderSide() {
  const levels = [{ n: 0, label: 'All levels', sub: `${VOCAB.length} words` }, ...TIER_NAMES.map((name, i) => ({ n: i + 1, label: `Level ${i + 1}`, sub: `${name} · ${VOCAB.filter(r => r[6] === i + 1).length} words` }))];
  $('level-list').replaceChildren(...levels.map(l => el('li', {}, el('button', { type: 'button', 'aria-pressed': String(save.tier === l.n), onclick: () => { save.tier = l.n; round = null; persist(); go('practice'); document.querySelector('[data-drawer-close]')?.click(); } }, l.label, el('small', { text: l.sub })))));
  const cards = Object.values(save.cards);
  $('records').replaceChildren(...[['Words started', cards.length], ['Words known', known(save.cards)], ['Due for review', dueNow().length]].map(([label, value]) => el('li', {}, el('span', { text: label }), el('strong', { text: String(value) }))));
  const badge = $('due-badge'), due = dueNow().length; badge.hidden = !due; badge.textContent = String(due);
}
function go(next) { tab = next; document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab))); renderAll(); }
function renderAll() { renderSide(); if (tab === 'today') renderToday(); else if (tab === 'practice') renderPractice(); else renderWords(); }
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
$('vocab-help').addEventListener('click', () => $('vocab-dialog').showModal());
$('close-vocab-help').addEventListener('click', () => $('vocab-dialog').close());
document.addEventListener('keydown', event => { if (tab !== 'practice' || !round || round.answered || event.ctrlKey || event.metaKey || event.altKey) return; const i = '1234'.indexOf(event.key); if (i >= 0) document.querySelectorAll('.choice')[i]?.click(); });
document.addEventListener('keydown', event => { if (event.key === 'Enter' && round?.answered && document.activeElement?.tagName !== 'BUTTON') $('q-next')?.click(); });
renderAll();
