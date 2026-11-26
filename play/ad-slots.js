// Ad spaces: a banner under the play area, slots on the home page and blog, and a rail beside the game on wide screens.
// They show Ziggle's own cards; never in kids mode and never over a board. Nothing is loaded from other sites.
// <meta name="ziggle-ads" content="house|off"> picks the mode (house by default).

const mode = () => document.querySelector('meta[name="ziggle-ads"]')?.content || 'house';
const kids = () => document.documentElement.dataset.kids === 'true' || globalThis.Ziggle?.kids?.() === true;

/** Free height between a slot's top and the footer when the page doesn't scroll (0 if it already does). */
function roomBelow(slot) {
  const top = slot.getBoundingClientRect().top + scrollY, footer = document.querySelector('body > footer');
  const footerHeight = footer ? footer.getBoundingClientRect().height + 28 : 28;
  return Math.max(0, innerHeight - top - footerHeight - 36);
}
let house;
async function fill() {
  house ||= await import('./house-ads.js');
  const { postsFor, pickPromos, pickSponsor, card, here, dayIndex } = house;
  const slots = [...document.querySelectorAll('[data-ad-slot]')];
  const off = mode() === 'off' || kids();
  const path = here(), day = dayIndex();
  const seen = new Map();
  for (const slot of slots) { const base = slot.getAttribute('aria-label') || 'From Ziggle'; const root = base.replace(/ · \d+$/, ''); const n = (seen.get(root) || 0) + 1; seen.set(root, n); slot.setAttribute('aria-label', n > 1 ? `${root} · ${n}` : root); }
  slots.forEach((slot, index) => {
    slot.hidden = off;
    slot.replaceChildren();
    if (off) return;
    const kind = slot.dataset.adSlot;
    const size = kind === 'rail' ? '160x600' : matchMedia('(max-width: 650px)').matches ? '320x50' : '728x90';
    slot.dataset.size = size;
    const label = document.createElement('span');
    label.className = 'ad-label';
    // Under a game on a computer the banner grows into the spare room (see CLIENT-CODE-NOTES.md).
    let promos;
    const grows = kind === 'banner' && size === '728x90' && Boolean(document.querySelector('.game-bar')) && !slot.closest('#post-grid');
    if (grows) {
      const room = roomBelow(slot), rows = Math.max(1, Math.min(3, Math.floor((room + 12) / 102))), cols = slot.parentElement.clientWidth >= 760 ? 2 : 1;
      const count = rows * cols, posts = postsFor(path).slice(0, Math.ceil(count / 2));
      const sponsor = pickSponsor(path, day, index);
      promos = [...posts, ...pickPromos(path, day, index, count - posts.length)].slice(0, count - (sponsor ? 1 : 0));
      if (sponsor) promos.push(sponsor);
      slot.dataset.rows = String(rows); slot.dataset.cols = String(cols);
      slot.classList.add('ad-grows');
    } else {
      const sponsor = pickSponsor(path, day, index), count = kind === 'rail' ? 3 : 1;
      promos = sponsor ? [sponsor, ...pickPromos(path, day, index, count - 1)] : pickPromos(path, day, index, count);
    }
    label.textContent = promos.some(promo => promo.external) ? 'Ad · From Ziggle & friends' : 'From Ziggle';
    const holder = document.createElement('div'); holder.className = 'promo-list';
    holder.append(...promos.map(promo => card(promo, false)));
    slot.append(label, holder);
    slot.dataset.filled = 'house';
  });
  document.querySelector('main')?.classList.toggle('has-ad-rail', !off && Boolean(document.querySelector('[data-ad-slot="rail"]')));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
  addEventListener('ziggle:settings', () => setTimeout(fill));
  // Kids mode switched on or off anywhere (Settings, a sync, another tab) shows or hides every slot.
  if (typeof MutationObserver === 'function') new MutationObserver(fill).observe(document.documentElement, { attributes: true, attributeFilter: ['data-kids'] });
  let resizeTimer = 0, lastHeight = innerHeight, lastWidth = innerWidth;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (Math.abs(innerHeight - lastHeight) > 40 || Math.abs(innerWidth - lastWidth) > 80) { lastHeight = innerHeight; lastWidth = innerWidth; fill(); } }, 250); });
  addEventListener('load', () => setTimeout(fill, 150));
  let wasPhone = matchMedia('(max-width: 650px)').matches;
  matchMedia('(max-width: 650px)').addEventListener?.('change', event => { if (event.matches !== wasPhone) { wasPhone = event.matches; fill(); } });
}
