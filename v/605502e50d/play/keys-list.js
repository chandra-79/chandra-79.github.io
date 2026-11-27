// The list of keyboard shortcuts for this page (2.67), opened with ? or Ctrl + /. Loaded only when asked for.
/** Keys each game has always had, shown in the list so everything is in one place. */
const gameKeys = (page, crossword) => [
  [page('sudoku.html'), [['← ↑ ↓ →', 'Move around the grid'], ['1 to 9', 'Fill the square'], ['⌫', 'Erase'], ['Ctrl Z', 'Undo'], ['Ctrl Y', 'Redo']]],
  [page('memory.html'), [['1 to 6', 'Pick a friend']]],
  [page('sums.html'), [['1 to 6', 'Pick a number'], ['+ − × ÷', 'Pick the sum'], ['⌫', 'Undo'], ['Esc', 'Clear'], ['Enter', 'Lock it in']]],
  [page(''), [['← ↑ ↓ →', 'Move between arrows'], ['Enter', 'Send the arrow'], ['/', 'Type an arrow’s ID']]],
  [page('weaver.html'), [['A to Z', 'Type your guess'], ['Enter', 'Guess it'], ['Esc', 'Clear']]],
  [page('lock.html'), [['A to Z', 'Type a letter'], ['Enter', 'Try the word'], ['⌫', 'Delete a letter']]],
  [page('words.html') && crossword, [['A to Z', 'Fill the square'], ['← ↑ ↓ →', 'Move around the grid'], ['⌫', 'Erase']]],
];

let list, back;
function row(keys, what) {
  const item = document.createElement('li'), key = document.createElement('kbd'), text = document.createElement('span');
  key.textContent = keys; text.textContent = what; item.append(key, text); return item;
}
function section(title, rows) {
  if (!rows.length) return [];
  const heading = document.createElement('h3'), items = document.createElement('ul');
  heading.textContent = title; items.className = 'keys-rows'; items.append(...rows);
  return [heading, items];
}
export function toggleList({ prefs, items, show, allTaken, lettersTaken, page, crossword, count = () => 0 }) {
  if (list?.open) { list.close(); return; }
  if (document.querySelector('dialog[open]')) return;
  if (!list) {
    list = document.createElement('dialog'); list.className = 'keys-dialog'; list.setAttribute('aria-labelledby', 'keys-title');
    list.innerHTML = '<div class="keys-head"><h2 id="keys-title">Keyboard shortcuts</h2><button type="button" class="keys-close" aria-label="Close keyboard shortcuts">×</button></div><div class="keys-body"></div><div class="keys-foot"><button type="button" class="keys-settings">Change in Settings</button><button type="button" class="keys-done">Done</button></div>';
    list.querySelector('.keys-close').addEventListener('click', () => list.close());
    list.querySelector('.keys-done').addEventListener('click', () => list.close());
    list.querySelector('.keys-settings').addEventListener('click', () => { list.close(); globalThis.ZiggleSettings?.open('key-shortcuts', document.querySelector('[data-settings-open]')); });
    list.addEventListener('click', event => { if (event.target === list) list.close(); });
    list.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === '?' || (event.key === '/' && (event.ctrlKey || event.metaKey))) { event.preventDefault(); list.close(); } });
    list.addEventListener('keyup', event => event.stopPropagation());
    list.addEventListener('close', () => { if (back?.isConnected && back !== document.body) back.focus({ preventScroll: true }); });
    document.body.append(list);
  }
  back = document.activeElement;
  const body = list.querySelector('.keys-body');
  const pick = { games: 'Pick a game from the Games menu', train: 'Pick a trainer from the Train menu' };
  const rows = group => items.filter(item => item.group === group).flatMap(item => [row(show(item.key), item.name), ...(pick[item.id] && count(item.id) ? [row(`${show(item.key)} then 1 to ${count(item.id)}`, pick[item.id])] : [])]);
  const own = (gameKeys(page, crossword).find(([here]) => here) || [0, []])[1].map(([keys, what]) => row(keys, what));
  const note = document.createElement('p'); note.className = 'keys-note';
  note.textContent = !prefs.on ? 'Single-key shortcuts are switched off. You can switch them back on in Settings.'
    : allTaken ? 'Every key is part of the practice on this page, so the shortcuts rest here.'
    : lettersTaken ? 'Letters are for typing in this game, so only the keys below work here.' : 'Press a key when you are not typing in a box.';
  body.replaceChildren(note, ...section('On this page', [...rows('page'), ...own]), ...section('Everywhere', rows('site')),
    ...section('Always', [row('Esc', 'Close a popup or a menu'), row('Tab', 'Move to the next control'), row('Ctrl /', 'Show or hide this list'), ...(prefs.on && !allTaken && !items.some(item => item.id === 'hint') ? [row('?', 'Show or hide this list')] : [])]));
  list.showModal();
  list.querySelector('.keys-done').focus();
}
