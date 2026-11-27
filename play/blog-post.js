// Ziggle blog post reading aids (2.21): a thin progress bar and a Share button (the system share sheet where there is one,
// otherwise a copied link). Posts read fine without this script; nothing is sent anywhere.
// 2.65: a post you have read at least halfway is remembered in this browser only (ziggle-blog-read-v1: its address name and the time),
// so the blog can tag it "Read" and list your reading history. A first-time visitor gets a short welcome above the article.
(() => {
  const body = document.querySelector('.post-body');
  if (!body) return;
  const toc = document.querySelector('.toc'); if (toc && innerWidth >= 900) toc.open = true; // the contents list starts open where there is room
  const bar = Object.assign(document.createElement('div'), { className: 'read-progress', innerHTML: '<span></span>' });
  bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const fill = bar.firstChild; let waiting = false;
  const READ_KEY = 'ziggle-blog-read-v1', slug = location.pathname.split('/').pop().replace(/\.html$/, '');
  const store = { get: key => { try { return localStorage.getItem(key); } catch { return null; } }, set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* This visit only. */ } } };
  let marked = false;
  const markRead = () => {
    if (marked || !slug) return; marked = true;
    let list = {}; try { list = JSON.parse(store.get(READ_KEY)) || {}; } catch { /* Start again. */ }
    list[slug] = new Date().toISOString();
    const keep = Object.entries(list).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).slice(0, 400); // newest 400, so the list never grows without end
    store.set(READ_KEY, JSON.stringify(Object.fromEntries(keep)));
  };
  const paint = () => {
    waiting = false;
    const box = body.getBoundingClientRect(), span = box.height - innerHeight * 0.6, done = span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 1;
    fill.style.transform = `scaleX(${done})`;
    if (done >= 0.5 && (span > 0 || document.visibilityState === 'visible')) markRead();
  };
  // First visit to Ziggle, straight onto a post (a shared link): a short hello above the article. It sits in the page, so it never
  // covers the words; "Keep reading" or the cross retires it for good, and so does having played or read here before.
  const HELLO_KEY = 'ziggle-hello-v1';
  const newcomer = () => { if (store.get(HELLO_KEY) || store.get(READ_KEY)) return false; try { return !Object.keys(JSON.parse(store.get('ziggle-profile-v1') || '{}').days || {}).length; } catch { return false; } };
  const article = document.querySelector('article.post');
  if (article && newcomer()) {
    const games = [['search', 'Word Search', '/play/words.html?game=search'], ['crossword', 'Crossword', '/play/words.html?game=crossword'], ['weaver', 'Word Cloud', '/play/weaver.html'], ['lock', 'Letter Lock', '/play/lock.html'], ['arrows', 'Arrow Escape', '/play/index.html'], ['memory', 'Memory Mischief', '/play/memory.html'], ['sudoku', 'Sudoku', '/play/sudoku.html'], ['sums', 'Sum Spark', '/play/sums.html']];
    const card = document.createElement('aside'); card.className = 'blog-hello'; card.setAttribute('aria-labelledby', 'blog-hello-title');
    card.innerHTML = `<img class="blog-hello-mark" src="/play/art/still/ziggle.svg" width="64" height="64" alt=""><div class="blog-hello-words"><p class="blog-hello-kicker">New here?</p><h2 id="blog-hello-title">Welcome to Ziggle</h2><p>Eight little brain-teasers, fresh every day, and a blog about how practice works. Free to play. No sign-up, no cookies.</p><ul class="blog-hello-games" aria-label="The games">${games.map(([art, name, href]) => `<li><a href="${href}" title="${name}"><img src="/play/art/still/${art}.svg" width="40" height="40" alt="${name}" loading="lazy"></a></li>`).join('')}</ul><div class="blog-hello-actions"><a class="blog-hello-play" href="/">Play today’s puzzles →</a><button type="button" data-hello-read>Keep reading</button></div></div><button type="button" class="blog-hello-close" data-hello-read aria-label="Close this welcome">×</button>`;
    const done = () => { store.set(HELLO_KEY, 'seen'); card.remove(); };
    card.querySelectorAll('[data-hello-read]').forEach(b => b.addEventListener('click', done));
    card.querySelectorAll('a').forEach(a => a.addEventListener('click', () => store.set(HELLO_KEY, 'seen')));
    article.prepend(card);
  }
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
