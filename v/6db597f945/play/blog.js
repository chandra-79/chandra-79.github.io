// Ziggle blog index (2.6.5): filter by topic, sort, and pages of 12 posts (never an endless list). The choice
// lives in the address (?topic=…&sort=…&page=…), so a link, a reload or Back brings you to the same page.
// A search box (2.21) narrows by words in the title, summary or topic. Without this script every post simply shows, newest first.
(async () => {
  const grid = document.getElementById('post-grid'), filter = document.querySelector('.cat-filter');
  const tools = document.getElementById('blog-tools'), sortBox = document.getElementById('post-sort');
  const pager = document.getElementById('blog-pager'), count = document.getElementById('post-count');
  if (!grid || !filter) return;
  let items = [...grid.querySelectorAll(':scope > li:not(.ad-cell)')];
  // The page holds the newest twelve cards; the rest come from small data files so the page stays small however many posts there are.
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
  const make = p => {
    const li = document.createElement('li'), a = document.createElement('a'), img = document.createElement('img'), icon = document.createElement('span'), title = document.createElement('span'), dek = document.createElement('span'), meta = document.createElement('span');
    Object.assign(li.dataset, { cat: p.c, date: p.dt, mins: String(p.m) }); a.className = 'post-card'; a.href = `/play/blog/${p.s}.html`;
    Object.assign(img, { className: 'post-thumb', src: p.a, width: 1200, height: 630, alt: '', loading: 'lazy', decoding: 'async' });
    icon.className = 'post-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = p.i; title.className = 'post-card-title'; title.textContent = p.t; dek.className = 'post-card-dek'; dek.textContent = p.d;
    meta.className = 'post-card-meta'; meta.textContent = `${p.l > 1 ? `Level ${p.l} · ` : ''}${p.c} · ${longDate(p.dt)} · ${p.m} min`;
    a.append(img, icon, title, dek, meta); li.append(a); return li;
  };
  const shards = Number(grid.dataset.shards) || 0;
  if (shards) { try { const parts = await Promise.all(Array.from({ length: shards }, (_, i) => fetch(`/play/blog-index-${i + 1}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }))); items = parts.flat().map(make); } catch { /* keep the newest posts that are already on the page */ } }
  const ad = grid.querySelector(':scope > .ad-cell');
  const PER_PAGE = 12;
  const SORTS = {
    new: (a, b) => b.dataset.date.localeCompare(a.dataset.date),
    old: (a, b) => a.dataset.date.localeCompare(b.dataset.date),
    quick: (a, b) => a.dataset.mins - b.dataset.mins || b.dataset.date.localeCompare(a.dataset.date),
    long: (a, b) => b.dataset.mins - a.dataset.mins || b.dataset.date.localeCompare(a.dataset.date),
    az: (a, b) => a.querySelector('.post-card-title').textContent.localeCompare(b.querySelector('.post-card-title').textContent),
  };
  const LABELS = { new: 'newest first', old: 'oldest first', quick: 'quickest read first', long: 'longest read first', az: 'A to Z' };
  const cats = new Set(items.map(item => item.dataset.cat));
  filter.hidden = false; if (tools) tools.hidden = false;
  const search = Object.assign(document.createElement('label'), { className: 'search-box', innerHTML: '<span class="sr-only">Search posts</span><input type="search" id="post-search" placeholder="Search posts" autocomplete="off" enterkeyhint="search" maxlength="60">' });
  const box = search.querySelector('input');
  if (tools) tools.prepend(search);

  const read = () => {
    const url = new URL(location.href);
    const topic = cats.has(url.searchParams.get('topic')) ? url.searchParams.get('topic') : '';
    const sort = SORTS[url.searchParams.get('sort')] ? url.searchParams.get('sort') : 'new';
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page'), 10) || 1);
    return { topic, sort, page, q: (url.searchParams.get('q') || '').trim().slice(0, 60) };
  };
  const write = (state, push) => {
    const url = new URL(location.href);
    for (const [key, value, plain] of [['topic', state.topic, ''], ['sort', state.sort, 'new'], ['page', String(state.page), '1'], ['q', state.q, '']]) { if (value && value !== plain) url.searchParams.set(key, value); else url.searchParams.delete(key); }
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  };
  const button = (label, page, current, extra = {}) => {
    const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.dataset.page = String(page);
    if (current) el.setAttribute('aria-current', 'page');
    for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    return el;
  };
  const render = (state, { scroll = false } = {}) => {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const shown = items.filter(item => (!state.topic || item.dataset.cat === state.topic) && words.every(word => item.textContent.toLowerCase().includes(word))).sort(SORTS[state.sort]);
    const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PER_PAGE, onPage = shown.slice(start, start + PER_PAGE);
    // Rebuild the list in the chosen order: this page's posts, with the Ziggle card after the sixth.
    for (const item of items) item.hidden = true;
    grid.replaceChildren(...onPage, ...items.filter(item => !onPage.includes(item)));
    for (const item of onPage) item.hidden = false;
    if (ad) { ad.hidden = onPage.length < 7; grid.insertBefore(ad, onPage[6] || null); }
    filter.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === state.topic)));
    if (sortBox) sortBox.value = state.sort;
    if (box && box !== document.activeElement) box.value = state.q;
    const what = state.q ? `${shown.length} post${shown.length === 1 ? '' : 's'} for “${state.q}”${state.topic ? ` about ${state.topic.toLowerCase()}` : ''}` : state.topic ? `${shown.length} post${shown.length === 1 ? '' : 's'} about ${state.topic.toLowerCase()}` : `${shown.length} posts`;
    count.textContent = `${what}, ${LABELS[state.sort]}${pages > 1 ? ` · page ${state.page} of ${pages}` : ''}`;
    // Pages: Previous, numbers (with gaps on long runs), Next.
    if (pager) {
      pager.hidden = pages < 2;
      const nums = [];
      for (let n = 1; n <= pages; n++) if (n === 1 || n === pages || Math.abs(n - state.page) <= 1) nums.push(n); else if (nums.at(-1) !== '…') nums.push('…');
      pager.replaceChildren(
        button('← Previous', state.page - 1, false, state.page === 1 ? { disabled: '', 'aria-label': 'Previous page' } : { 'aria-label': 'Previous page' }),
        ...nums.map(n => n === '…' ? Object.assign(document.createElement('span'), { className: 'gap', textContent: '…' }) : button(String(n), n, n === state.page, { 'aria-label': `Page ${n}` })),
        button('Next →', state.page + 1, false, state.page === pages ? { disabled: '', 'aria-label': 'Next page' } : { 'aria-label': 'Next page' }),
      );
    }
    if (scroll) (filter.closest('section, main') ? filter : grid).scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm' ? 'auto' : 'smooth' });
    return state;
  };
  let state = render(read());
  write(state, false);
  const go = (changes, scroll) => { state = render({ ...state, ...changes }, { scroll }); write(state, true); };
  filter.addEventListener('click', event => { const b = event.target.closest('button[data-cat]'); if (b) go({ topic: b.dataset.cat, page: 1 }, false); });
  let typing = 0;
  box?.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => { state = render({ ...state, q: box.value.trim(), page: 1 }); write(state, false); }, 160); });
  sortBox?.addEventListener('change', () => go({ sort: sortBox.value, page: 1 }, false));
  pager?.addEventListener('click', event => { const b = event.target.closest('button[data-page]'); if (b && !b.disabled) go({ page: Number(b.dataset.page) }, true); });
  addEventListener('popstate', () => { state = render(read()); });
})();
