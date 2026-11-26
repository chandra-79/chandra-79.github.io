// Ziggle blog post reading aids (2.21): a thin progress bar and a Share button (the system share sheet where there is one,
// otherwise a copied link). Posts read fine without this script; nothing is stored or sent anywhere.
(() => {
  const body = document.querySelector('.post-body');
  if (!body) return;
  const toc = document.querySelector('.toc'); if (toc && innerWidth >= 900) toc.open = true; // the contents list starts open where there is room
  const bar = Object.assign(document.createElement('div'), { className: 'read-progress', innerHTML: '<span></span>' });
  bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const fill = bar.firstChild; let waiting = false;
  const paint = () => {
    waiting = false;
    const box = body.getBoundingClientRect(), span = box.height - innerHeight * 0.6;
    fill.style.transform = `scaleX(${span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 1})`;
  };
  const queue = () => { if (!waiting) { waiting = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); paint();
  const button = document.querySelector('.share-btn'), note = document.querySelector('.share-note');
  if (!button) return;
  const say = text => { if (note) { note.textContent = text; setTimeout(() => { note.textContent = ''; }, 2600); } };
  const data = { title: document.querySelector('h1')?.textContent || document.title, url: location.href.split('#')[0] };
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.url); say('Link copied');
    } catch (error) { if (error?.name !== 'AbortError') say('Copy the address from your browser'); }
  });
})();
