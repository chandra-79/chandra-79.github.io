// Numbered pages (2.6.5): Ziggle never shows an endless list. One shared control: Previous, page numbers (with
// gaps on long runs), Next. renderPager(nav, page, pages, go) fills a <nav>; go(n) is called with the page chosen.
export function renderPager(nav, page, pages, go) {
  if (!nav) return;
  nav.classList.add('pager');
  nav.hidden = pages < 2;
  const make = (label, target, attrs = {}) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    for (const [k, v] of Object.entries(attrs)) if (v !== false) button.setAttribute(k, v === true ? '' : v);
    if (!attrs.disabled) button.addEventListener('click', () => go(target));
    return button;
  };
  const nums = [];
  for (let n = 1; n <= pages; n++) if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n); else if (nums.at(-1) !== '…') nums.push('…');
  nav.replaceChildren(
    make('← Previous', page - 1, { 'aria-label': 'Previous page', disabled: page <= 1 }),
    ...nums.map(n => n === '…' ? Object.assign(document.createElement('span'), { className: 'gap', textContent: '…' }) : make(String(n), n, { 'aria-label': `Page ${n}`, 'aria-current': n === page ? 'page' : false })),
    make('Next →', page + 1, { 'aria-label': 'Next page', disabled: page >= pages }),
  );
}
