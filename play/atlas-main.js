// Lexicon Atlas (2.28): a personal map of English that lights up as the player meets words. Tap a region to see its words.
// Words are collected from the games' own saves (atlas-collect.js); nothing here counts toward the streak, points or trophies.
// The word lists load on demand, so the page opens at once and shows the saved count first.
import { GOAL, SOURCE_NAMES, addWord, dateKey, givesAway, latestWords, loadAtlas, nextMilestone, percent, regionLit, saveAtlas, silhouette, sourceTotals, wordCount } from './atlas-core.js';

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const node = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else if (k.startsWith('on')) node.addEventListener(k.slice(2), v); else node.setAttribute(k, v); } node.append(...kids.flat().filter(kid => kid !== null && kid !== undefined && kid !== false)); return node; };
const storage = (() => { try { return localStorage; } catch { return null; } })();
const PLAY = { cloud: ['/play/weaver.html', 'Word Cloud'], theme: ['/play/words.html?game=search', 'Word Search'], vocab: ['/play/vocab.html', 'Word Builder'], lock: ['/play/lock.html', 'Letter Lock'] };
const number = n => Number(n).toLocaleString();
const sourceList = from => (from.length ? from.map(source => SOURCE_NAMES[source] || source).join(', ') : 'your games');
const prettyDay = day => { try { return day ? new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'earlier'; } catch { return day || 'earlier'; } };

let atlas = loadAtlas(storage), data = null, todayEntry = null, fx = null;
let tab = 'map', openRegion = '', filter = 'all', selected = '', lastRegion = '';
const fresh = new Set(), popped = new Set();

const flash = text => { $('atlas-status').textContent = text; };
const persist = () => { const ok = saveAtlas(storage, atlas); $('save-status').textContent = ok ? 'Progress saves in this browser' : 'Browser saving is off: this map will not be kept'; return ok; };
const loadFx = () => (fx ||= import('./fx.js').catch(() => ({})));
const pop = async node => { const m = await loadFx(); m.pop?.(node); };

// ---- The regions, with the words met elsewhere gathered in "Wider world" ----------------------------------
function regions() {
  if (!data) return [];
  const extra = Object.keys(atlas.words).filter(word => !data.known(word)).sort();
  return [...data.regions, ...(extra.length ? [{ id: 'more', group: 'more', name: 'Practice finds', emoji: '🧭', words: extra }] : [])];
}
const regionState = region => { const { lit, total } = regionLit(atlas, region.words); return { lit, total, state: !lit ? 'empty' : lit === total ? 'full' : 'some' }; };

// ---- Progress ---------------------------------------------------------------------------------------------------
let shown = -1;
function renderMeter() {
  const count = wordCount(atlas), mark = nextMilestone(count), done = count >= GOAL;
  const sub = done ? 'You reached 5,000 words. The map keeps on glowing.' : `${number(GOAL - count)} to go · next mark ${number(mark)} (${number(mark - count)} away)`;
  const countNode = el('span', { class: 'meter-count', id: 'meter-count', text: number(count) });
  $('atlas-meter').replaceChildren(
    el('div', { class: 'meter-line' }, countNode, el('span', { class: 'meter-goal', text: `of ${number(GOAL)} words` })),
    el('div', { class: 'meter-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(GOAL), 'aria-valuenow': String(Math.min(count, GOAL)), 'aria-valuetext': `${number(count)} of ${number(GOAL)} words` }, el('div', { class: 'meter-fill', style: `width:${Math.max(percent(count), count ? 1 : 0)}%` })),
    el('p', { class: 'meter-sub', text: sub }));
  if (shown >= 0 && count > shown) loadFx().then(m => m.countUp?.(countNode, count, { format: n => number(Math.round(n)) }));
  shown = count;
}

// ---- Today's word ----------------------------------------------------------------------------------------------
function todayCard() {
  if (!todayEntry) return null;
  const word = todayEntry.word, lit = Boolean(atlas.words[word]);
  const button = el('button', { type: 'button', class: lit ? 'secondary-button' : 'primary-button', id: 'light-today', text: lit ? 'On your map ✓' : 'Light it up ✦', onclick: () => lightToday() });
  if (lit) button.disabled = true;
  return el('section', { class: `today-card${lit ? ' lit' : ''}`, 'aria-label': 'Today’s word' },
    el('span', { class: 'atlas-kicker', text: 'TODAY’S WORD' }), el('h3', { text: word }),
    el('p', { text: todayEntry.def.charAt(0).toUpperCase() + todayEntry.def.slice(1) + '.' }),
    el('div', { class: 'actions-row' }, button, el('a', { class: 'today-link', href: '/play/vocab.html', text: 'Practise it in Word Builder' })),
    lit ? null : el('p', { class: 'note', text: 'Light it up to add it to your map. A new word arrives at midnight.' }));
}
function lightToday() {
  if (!todayEntry) return;
  addWord(atlas, todayEntry.word, 'today', dateKey());
  fresh.add(todayEntry.word); persist(); flash(`✦ “${todayEntry.word}” is on your map.`); renderAll();
  pop(document.querySelector('.meter-count'));
}

// ---- The map ------------------------------------------------------------------------------------------------------
function regionTile(region) {
  const { lit, total, state } = regionState(region), isMore = region.group === 'more';
  return el('li', {}, el('button', { type: 'button', class: 'region-tile', 'data-region': region.id, 'data-state': state, 'aria-label': isMore ? `${region.name}: ${number(lit)} words` : `${region.name}: ${lit} of ${total} words lit`, onclick: () => open(region.id) },
    el('span', { class: 'r-emoji', 'aria-hidden': 'true', text: region.emoji }), el('span', { class: 'r-name', text: region.name }), region.sub ? el('span', { class: 'r-sub', text: region.sub }) : null,
    el('span', { class: 'r-count', text: isMore ? `${number(lit)} words` : `${lit} / ${total}` }), isMore ? null : el('span', { class: 'r-bar', 'aria-hidden': 'true' }, el('i', { style: `width:${total ? Math.round((100 * lit) / total) : 0}%` }))));
}
function renderMap() {
  if (!data) { $('stage').replaceChildren(el('p', { class: 'note', text: 'Opening your map…' })); return; }
  const list = regions(), parts = [todayCard()];
  for (const group of data.groups) {
    const here = list.filter(region => region.group === group.id);
    if (!here.length) continue;
    const lit = here.reduce((sum, region) => sum + regionState(region).lit, 0);
    parts.push(el('h3', { class: 'group-head' }, group.title, el('small', { text: group.id === 'more' ? `${number(lit)} words` : `${group.note} · ${lit} lit` })), el('ul', { class: 'region-grid', role: 'list' }, here.map(regionTile)));
  }
  if (!wordCount(atlas)) parts.push(el('p', { class: 'note', text: 'Nothing is lit yet. Play a word game, or light up today’s word, and your first region will start to glow.' }));
  $('stage').replaceChildren(...parts.filter(Boolean));
  if (lastRegion) { document.querySelector(`[data-region="${lastRegion}"]`)?.focus({ preventScroll: false }); lastRegion = ''; }
}

// ---- A region -------------------------------------------------------------------------------------------------------
function detailFor(region, word) {
  const entry = atlas.words[word], clue = data?.clue(word) || '';
  if (entry) return [el('h4', { text: word }), clue ? el('p', { text: clue.charAt(0).toUpperCase() + clue.slice(1) + (/[.!?]$/.test(clue) ? '' : '.') }) : null, el('p', { class: 'dim', text: `First met ${prettyDay(entry.first)} · ${sourceList(entry.from)}` })];
  const play = PLAY[region.group];
  return [el('h4', { text: silhouette(word) }), el('p', { text: `Not met yet · ${word.length} letters.` }), clue && !givesAway(clue, word) ? el('p', { class: 'dim', text: `Clue: ${clue}` }) : null, play ? el('p', { class: 'dim' }, 'Meet it in ', el('a', { href: play[0], text: play[1] }), '.') : null];
}
function renderRegion() {
  const region = regions().find(item => item.id === openRegion);
  if (!region) { openRegion = ''; renderMap(); return; }
  const { lit, total } = regionState(region), isMore = region.group === 'more', play = PLAY[region.group];
  const words = region.words.filter(word => filter === 'all' || (filter === 'lit') === Boolean(atlas.words[word]));
  const tiles = words.map(word => {
    const on = atlas.words[word], isFresh = fresh.has(word);
    return el('li', {}, el('button', { type: 'button', class: `word-tile${isFresh ? ' fresh' : ''}${word.length >= 11 ? ' xlong' : word.length >= 9 ? ' long' : ''}`, 'data-word': word, ...(on ? { 'data-lit': '' } : {}), 'aria-pressed': String(selected === word), 'aria-label': on ? word : `Not met yet, ${word.length} letters`, onclick: () => pick(region, word) }, on ? word : silhouette(word)));
  });
  const detail = el('div', { class: 'word-detail', id: 'word-detail', 'aria-live': 'polite' }, ...(selected && region.words.includes(selected) ? detailFor(region, selected) : [el('p', { class: 'dim', text: 'Tap a word to see what it means.' })]));
  const chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Show' }, [['all', 'All'], ['lit', 'Lit'], ['dim', 'Not yet']].filter(([id]) => !isMore || id !== 'dim').map(([id, label]) => el('button', { type: 'button', 'data-filter': id, 'aria-pressed': String(filter === id), text: label, onclick: () => { filter = id; renderRegion(); document.querySelector(`[data-filter="${id}"]`)?.focus(); } })));
  $('stage').replaceChildren(
    el('div', { class: 'region-head' }, el('button', { type: 'button', class: 'secondary-button', id: 'back-to-map', text: '← Map', onclick: close }), el('h3', {}, `${region.emoji} ${region.name}${region.sub ? ` · ${region.sub}` : ''}`)),
    el('p', { class: 'region-meta' }, isMore ? `${number(lit)} words met in practice puzzles.` : `${lit} of ${total} words lit. `, play ? ['Meet more in ', el('a', { href: play[0], text: play[1] }), '.'] : null),
    chips, detail, tiles.length ? el('ul', { class: 'word-grid', role: 'list', id: 'word-grid' }, tiles) : el('p', { class: 'note', text: filter === 'lit' ? 'No words lit here yet.' : 'Every word here is lit. Lovely.' }));
  document.querySelectorAll('.word-tile.fresh').forEach(node => { if (!popped.has(node.dataset.word)) { popped.add(node.dataset.word); pop(node); } });
}
function pick(region, word) {
  selected = selected === word ? '' : word;
  document.querySelectorAll('.word-tile').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.word === selected)));
  const detail = $('word-detail');
  detail.replaceChildren(...(selected ? detailFor(region, selected) : [el('p', { class: 'dim', text: 'Tap a word to see what it means.' })]));
}
function open(id) { openRegion = id; selected = ''; filter = 'all'; lastRegion = id; renderAll(); $('stage').focus({ preventScroll: true }); $('stage').scrollIntoView({ block: 'start' }); }
function close() { const back = openRegion; openRegion = ''; selected = ''; lastRegion = back; renderAll(); }

// ---- Latest words -----------------------------------------------------------------------------------------------------
function renderLatest() {
  const latest = latestWords(atlas, 30);
  if (!latest.length) { $('stage').replaceChildren(el('p', { class: 'note', text: 'Nothing here yet. Play any word game, or light up today’s word, and the words you meet will appear here.' })); return; }
  $('stage').replaceChildren(el('ul', { class: 'latest-list' }, latest.map(({ word, first, from }) => {
    const clue = data?.clue(word) || '';
    return el('li', {}, el('strong', { text: word }), el('span', { text: clue ? clue.charAt(0).toUpperCase() + clue.slice(1) : 'On your map' }), el('span', { text: `${prettyDay(first)} · ${sourceList(from)}` }));
  })));
}

// ---- The side drawer ------------------------------------------------------------------------------------------------------
function renderSide() {
  const list = regions().filter(region => region.group !== 'more'), states = list.map(regionState), days = Object.values(atlas.words).map(entry => entry.first).filter(Boolean).sort();
  const rows = [['Words lit', number(wordCount(atlas))], ['Regions with a light', data ? `${states.filter(s => s.lit).length} of ${list.length}` : '…'], ['Regions complete', data ? String(states.filter(s => s.lit && s.lit === s.total).length) : '…'], ['First word met', days.length ? prettyDay(days[0]) : 'Not yet']];
  $('records').replaceChildren(...rows.map(([label, value]) => el('li', {}, el('span', { text: label }), el('strong', { text: value }))));
  const totals = sourceTotals(atlas);
  $('sources').replaceChildren(...(totals.length ? totals.map(([source, n]) => el('li', {}, el('span', { text: SOURCE_NAMES[source] || source }), el('strong', { text: number(n) }))) : [el('li', {}, el('span', { class: 'note', text: 'Nothing yet.' }))]));
}

function renderAll() {
  document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
  renderMeter(); renderSide();
  if (tab === 'latest') renderLatest(); else if (openRegion) renderRegion(); else renderMap();
}

// ---- Collecting ------------------------------------------------------------------------------------------------------------
let collector = null;
async function collect(announce) {
  try {
    collector ||= await import('./atlas-collect.js');
    const before = new Set(Object.keys(atlas.words)), result = collector.collectAtlas(storage, dateKey());
    atlas = result.atlas;
    const added = Object.keys(atlas.words).filter(word => !before.has(word));
    added.forEach(word => fresh.add(word));
    if (added.length) { flash(`✦ ${added.length} ${added.length === 1 ? 'word' : 'words'} lit up from your games.`); renderAll(); }
    else if (announce) flash('Nothing new this time. Play a word game and check again.');
  } catch { if (announce) flash('Couldn’t check your games just now.'); }
}

// ---- Keyboard: arrow keys move across tiles ---------------------------------------------------------------------------------
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const dialog = document.querySelector('dialog[open]'), drawer = $('game-drawer')?.classList.contains('open');
  if (event.key === 'Escape' && openRegion && tab === 'map' && !dialog && !drawer) { event.preventDefault(); close(); return; }
  const current = document.activeElement;
  const grid = current?.closest?.('.region-grid,.word-grid');
  if (!grid || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const buttons = [...grid.querySelectorAll('button')], at = buttons.indexOf(current);
  if (at < 0) return;
  event.preventDefault();
  let next = at;
  if (event.key === 'ArrowRight') next = Math.min(buttons.length - 1, at + 1);
  else if (event.key === 'ArrowLeft') next = Math.max(0, at - 1);
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = buttons.length - 1;
  else {
    const box = current.getBoundingClientRect(), down = event.key === 'ArrowDown';
    const rows = buttons.filter(button => { const r = button.getBoundingClientRect(); return down ? r.top >= box.bottom - 2 : r.bottom <= box.top + 2; });
    if (rows.length) {
      const edge = down ? Math.min(...rows.map(button => button.getBoundingClientRect().top)) : Math.max(...rows.map(button => button.getBoundingClientRect().top));
      const line = rows.filter(button => Math.abs(button.getBoundingClientRect().top - edge) < 4);
      next = buttons.indexOf(line.reduce((best, button) => (Math.abs(button.getBoundingClientRect().left - box.left) < Math.abs(best.getBoundingClientRect().left - box.left) ? button : best)));
    }
  }
  buttons[next]?.focus();
});

// ---- Wiring --------------------------------------------------------------------------------------------------------------------
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { tab = button.dataset.tab; lastRegion = ''; openRegion = tab === 'map' ? openRegion : ''; renderAll(); }));
$('atlas-help').addEventListener('click', () => $('atlas-dialog').showModal());
$('close-atlas-help').addEventListener('click', () => $('atlas-dialog').close());
$('recheck').addEventListener('click', () => collect(true));
addEventListener('storage', event => { if (event.key === 'ziggle-atlas-v1') { atlas = loadAtlas(storage); renderAll(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && data) collect(false); });

renderAll();
(async () => {
  try {
    const [regionModule, vocabData, vocabCore] = await Promise.all([import('./atlas-regions.js'), import('./vocab-data.js'), import('./vocab-core.js')]);
    data = { ...regionModule.buildRegions(), groups: regionModule.GROUPS };
    const row = vocabCore.wordOfDay(vocabData.VOCAB, dateKey());
    todayEntry = row ? vocabCore.asEntry(row) : null;
  } catch { flash('The word lists did not load. Check your connection and try again.'); }
  await collect(false);
  const wanted = new URLSearchParams(location.search).get('region');
  if (wanted && regions().some(region => region.id === wanted)) openRegion = wanted;
  renderAll();
})();
