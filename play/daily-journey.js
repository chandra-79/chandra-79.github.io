const Z = () => globalThis.Ziggle;
export function dailyHref(game, date = Z().today()) {
  const url = new URL(game.daily, location.origin);
  url.searchParams.set('dailyRun', date);
  return url.pathname + url.search;
}
const runDate = () => new URLSearchParams(location.search).get('dailyRun');
export function journeyGame() {
  return Z()?.games?.find(game => {
    const url = new URL(game.href, location.origin);
    return url.pathname === location.pathname && (url.searchParams.get('game') || '') === (new URLSearchParams(location.search).get('game') || '');
  });
}
export function journeyActive() { return runDate() === Z()?.today(); }
function queue() { return Z()?.dailyQueue?.() || []; }
function onward(excluding = '') { return queue().find(game => !game.done && game.id !== excluding); }
export function continueAction() {
  const next = onward();
  return { id: 'daily-continue', label: next ? `Continue: ${next.name} →` : 'Your daily set is finished →', primary: true, run: () => { location.href = next ? dailyHref(next) : '/#today'; } };
}
let completed = false;
if (typeof document !== 'undefined') document.addEventListener('ziggle:daily', event => {
  if (journeyActive() && (!event.detail || (event.detail.game === journeyGame()?.id && event.detail.date === Z().today()))) completed = queue().some(game => game.id === journeyGame()?.id && game.done);
  renderRoute();
});
function pickActions() {
  const next = onward();
  return queue().filter(game => !game.done && game.id !== next?.id).map(game => ({ id: `daily-pick-${game.id}`, label: game.name, pick: game.id, run: () => { location.href = dailyHref(game); } }));
}
export function dailyEnd(options) {
  if (!journeyActive() || !completed) return options;
  completed = false;
  const games = queue(), done = games.filter(game => game.done).length;
  return { ...options, note: `${options.note || ''}${options.note ? '\n' : ''}${done} of ${games.length} in your daily set finished.`, actions: [continueAction(), ...pickActions(), ...(options.actions || []).filter(action => action.id !== 'daily-continue').map(action => action.primary ? { ...action, primary: false, label: 'Keep playing this game', run: () => { leaveJourney(); action.run?.(); } } : action)] };
}
function leaveJourney() {
  const url = new URL(location.href); url.searchParams.delete('dailyRun'); history.replaceState(null, '', url);
  document.getElementById('daily-route')?.remove(); document.documentElement.removeAttribute('data-daily-run');
  document.querySelectorAll('[data-daily-label]').forEach(button => { button.textContent = button.dataset.dailyLabel; delete button.dataset.dailyLabel; });
}
function renderRoute() {
  const route = document.getElementById('daily-route'); if (!route) return;
  if (!journeyActive()) { route.remove(); return; }
  const games = queue(), pending = games.filter(game => !game.done);
  route.querySelector('summary').textContent = `Daily Ziggle · ${pending.length} remaining`;
  if (games.some(game => game.id === journeyGame()?.id && game.done)) {
    for (const button of document.querySelectorAll('#play-next,#lock-next,#sum-next,#continue-arrow,#mm-continue')) {
      button.dataset.dailyLabel ||= button.textContent;
      button.textContent = continueAction().label;
      if (!button.dataset.dailyBound) { button.dataset.dailyBound = 'true'; button.addEventListener('click', event => {
        if (journeyActive() && queue().some(game => game.id === journeyGame()?.id && game.done)) { event.preventDefault(); event.stopImmediatePropagation(); continueAction().run(); }
      }, true); }
    }
  }
  const list = route.querySelector('ul'); list.replaceChildren(...games.map(game => {
    const li = document.createElement('li'), link = document.createElement('a');
    link.href = dailyHref(game); link.textContent = `${game.done ? '✓ ' : ''}${game.name}${game.guided ? ' · with help' : ''}`;
    if (game.id === journeyGame()?.id) link.setAttribute('aria-current', 'page');
    li.append(link); return li;
  }));
  const skip = route.querySelector('button');
  skip.onclick = () => { const next = onward(journeyGame()?.id); location.href = next ? dailyHref(next) : '/#today'; };
}
export function bootJourney() {
  if (!Z()) { addEventListener('load', bootJourney, { once: true }); return; }
  if (!journeyActive() || document.getElementById('daily-route')) return;
  if (!queue().some(game => !game.done)) { leaveJourney(); return; }
  const bar = document.querySelector('.game-bar'); if (!bar) return;
  const route = document.createElement('details'); route.id = 'daily-route'; route.className = 'daily-route';
  route.innerHTML = '<summary>Daily Ziggle</summary><div><ul></ul><button type="button" class="secondary-button">Skip for now — keep progress</button><a href="/#today">Back to today’s list</a></div>';
  bar.after(route); document.documentElement.setAttribute('data-daily-run', ''); renderRoute();
  document.addEventListener('click', event => { if (event.target.closest('#mode-practice,#mm-daily,[data-game],.theme-button,[data-difficulty],[data-variant],[data-daily-level],#puzzle-select')) leaveJourney(); });
}

export function finishDailyScreen(note = '') {
  if (!journeyActive() || !completed) return;
  import('./level-end.js').then(({showLevelEnd}) => showLevelEnd({ outcome: 'win', title: 'A puzzle explored', praise: 'One more part of your Daily Ziggle finished.', note, actions: [continueAction()] }));
}
