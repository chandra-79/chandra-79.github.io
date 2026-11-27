// Focused play (2.28): the moment you start or carry on playing a game, everything else on the page fades away and only the board, its
// controls and the Ziggle logo stay. Anything that is not play brings it all back: a pause, a popup or drawer, Escape, leaving the tab, or
// moving the pointer to the top edge. The logo always stays, and always leads home. Loaded on demand by the game frame; trainers and
// browsing screens are left alone.
// 2.77: switched off. The showing and hiding felt wonky, so on a computer the menus, the game bar and the footer now stay where they are
// while you play, in every game; only Maximize, which the player chooses, hides them. The code stays in case a quiet mode is wanted later.
const QUIET_PLAY = false;
const root = document.documentElement;
const AREAS = '#board-viewport,#word-board,#weave-sky,#weave-input,#lock-board,#keyboard,#memory-board,.sum-board,#sum-keys,#sudoku-board,#twist-board';
if (document.querySelector(AREAS) && document.querySelector('.collection-header')) {
  const calm = () => globalThis.Ziggle?.calm?.() ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('./playing.css', import.meta.url).href; document.head.append(link);
  let playing = false, timer = 0;
  const resize = () => dispatchEvent(new Event('resize'));
  // On phones every game already starts full screen (focus-mode.js), so the first-move fade is for bigger screens only.
  const phone = matchMedia('(max-width:650px)');
  const enter = () => {
    if (!QUIET_PLAY || playing || phone.matches) return; playing = true; clearTimeout(timer);
    if (calm()) { root.setAttribute('data-playing', ''); resize(); return; }
    root.setAttribute('data-fading', '');
    timer = setTimeout(() => { root.setAttribute('data-playing', ''); root.removeAttribute('data-fading'); resize(); }, 320);
  };
  const leave = () => {
    if (!playing) return; playing = false; clearTimeout(timer);
    root.removeAttribute('data-fading'); root.removeAttribute('data-playing'); root.removeAttribute('data-peek');
    if (!calm()) { root.setAttribute('data-revealing', ''); requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-revealing'))); }
    resize();
  };
  const inPlay = event => event.target instanceof Element && event.target.closest(AREAS);
  // Start after the first move has landed, so the board never shifts under a finger.
  addEventListener('pointerup', event => { if (inPlay(event)) setTimeout(enter, 0); }, true);
  addEventListener('keyup', event => { if (!/^(Escape|Tab|Shift|Control|Alt|Meta)$/.test(event.key) && inPlay(event)) setTimeout(enter, 0); }, true);
  addEventListener('keydown', event => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) leave(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  // A popup, a drawer or the pause screen means you are not playing right now.
  const busy = () => document.querySelector('dialog[open],#modal-root:not([hidden]) .modal,#game-drawer.open,.pause-overlay:not([hidden])');
  new MutationObserver(() => { if (playing && busy()) leave(); }).observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['open', 'hidden', 'class'] });
  // Pointer to the very top edge shows the site header for a moment (a computer's way to reach the menu).
  addEventListener('pointermove', event => {
    if (!playing || event.pointerType === 'touch') return;
    if (event.clientY < 8) root.setAttribute('data-peek', ''); else if (event.clientY > 96) root.removeAttribute('data-peek');
  }, { passive: true });
}
