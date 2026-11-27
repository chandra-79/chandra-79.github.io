// Today / Practice for games that open today's puzzle by address (2.26): word search, crossword and Sudoku. The same pair of buttons
// sits in every daily game's title bar; here a press reloads the page with or without ?daily=1. Loaded on demand by the game frame.
// The address is read live: a game may tidy it after loading (the Games menu's ?resume=1 becomes ?daily=1 or plain), then says so with "ziggle:address".
const box = document.querySelector('.game-bar [data-url-switch]');
if (box) {
  const [today, practice] = box.querySelectorAll('button');
  const now = () => new URL(location.href), onToday = () => now().searchParams.has('daily') && !now().searchParams.has('date');
  const show = () => { today.setAttribute('aria-pressed', String(onToday())); practice.setAttribute('aria-pressed', String(!onToday())); };
  show(); addEventListener('ziggle:address', show);
  const go = daily => { const url = now(); url.searchParams.delete('date'); url.searchParams.delete('resume'); if (daily) url.searchParams.set('daily', '1'); else url.searchParams.delete('daily'); location.assign(url); };
  today.addEventListener('click', () => { if (!onToday()) go(true); });
  practice.addEventListener('click', () => { if (onToday() || now().searchParams.has('date')) go(false); });
}
// Arrow Escape's third choice (2.78): Today, Practice and Twists share one switch across its two pages; a button with data-go opens that page.
for (const button of document.querySelectorAll('.game-bar .mode-switch [data-go]')) button.addEventListener('click', () => location.assign(button.dataset.go));
