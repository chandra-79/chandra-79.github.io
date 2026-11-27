// Back closes what is open first (2.43): a popup, the How to play guide, Settings or the game drawer.
// While something is open the page holds one extra history step. Back (browser button or phone back
// gesture) takes that step and closes the top layer; only the next Back leaves the page. A layer closed
// any other way leaves the spare step in place: the next Back passes straight through it, so Back never
// feels dead and this file never navigates on its own (that could cancel a link the player just tapped).
// Leaving is never blocked: every game saves as it is played. Loaded on demand by the game frame.
if (typeof history.pushState === 'function' && typeof MutationObserver === 'function') {
  const drawer = document.getElementById('game-drawer');
  let spare = false, href = location.href;
  const open = () => Boolean(document.querySelector('dialog[open]') || drawer?.classList.contains('open'));
  const closeTop = () => {
    const dialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    // The same path as Escape: each dialog's own cancel handler closes it its own way.
    if (dialog) { if (dialog.dispatchEvent(new Event('cancel', { cancelable: true })) && dialog.open) dialog.close(); }
    else globalThis.ZiggleDrawer?.close();
  };
  const sync = () => { href = location.href; if (open() && !spare) { history.pushState(history.state, '', href); spare = true; } };
  addEventListener('popstate', () => {
    if (!spare) return;
    spare = false;
    if (!open()) { history.back(); return; } // nothing to close: the player is leaving
    // Keep the address the game set while the layer was open (a level or mode picked from the drawer).
    if (location.href !== href) history.replaceState(history.state, '', href);
    closeTop(); queueMicrotask(sync);
  });
  // A page shown again (Back, Forward, or from the browser's page cache) starts with no spare step.
  addEventListener('pageshow', () => { spare = false; sync(); });
  const watch = new MutationObserver(sync);
  watch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  new MutationObserver(sync).observe(document.body, { childList: true });
  if (drawer) watch.observe(drawer, { attributes: true, attributeFilter: ['class'] });
  sync();
}
