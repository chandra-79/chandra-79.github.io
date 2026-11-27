// Saved articles (2.67): a "Save for later" button on every blog article and a short "Saved articles" list on the blog
// page. The list lives in this browser only (ziggle-bookmarks-v1); nothing is sent anywhere.
export const BOOKMARKS_STORE = 'ziggle-bookmarks-v1';
const MOST = 100;
export function readBookmarks() {
  try { const list = JSON.parse(localStorage.getItem(BOOKMARKS_STORE) || '[]'); return Array.isArray(list) ? list.filter(item => item && typeof item.p === 'string' && /^\/play\/blog\/[a-z0-9-]+\.html$/.test(item.p) && typeof item.t === 'string').slice(0, MOST) : []; } catch { return []; }
}
function write(list) { try { localStorage.setItem(BOOKMARKS_STORE, JSON.stringify(list.slice(0, MOST))); return true; } catch { return false; } }
export function toggleBookmark(path, title) {
  const list = readBookmarks(), at = list.findIndex(item => item.p === path);
  if (at >= 0) list.splice(at, 1); else list.unshift({ p: path, t: String(title).slice(0, 140), d: new Date().toISOString().slice(0, 10) });
  return write(list) ? at < 0 : null;
}

const article = document.querySelector('.post-body'), share = document.querySelector('.share-btn'), note = document.querySelector('.share-note');
const say = text => { if (!note) return; note.textContent = text; setTimeout(() => { if (note.textContent === text) note.textContent = ''; }, 2600); };
if (article && share) {
  const path = location.pathname, title = document.querySelector('h1')?.textContent.trim() || document.title;
  const button = document.createElement('button');
  button.type = 'button'; button.className = `${share.className.replace('share-btn', '').trim()} bookmark-btn`.trim();
  const paint = () => { const saved = readBookmarks().some(item => item.p === path); button.textContent = saved ? '★ Saved' : '☆ Save for later'; button.setAttribute('aria-pressed', String(saved)); };
  button.addEventListener('click', () => {
    const saved = toggleBookmark(path, title);
    paint(); say(saved === null ? 'This browser could not save it' : saved ? 'Saved. Find it on the blog page.' : 'Removed from your saved articles');
  });
  paint(); share.after(button);
  addEventListener('storage', event => { if (event.key === BOOKMARKS_STORE) paint(); });
  // S copies the link straight away (the Share button may open the device's share sheet instead).
  globalThis.ZiggleBlog = { copyLink: async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); say('Link copied'); } catch { say('Copy the address from your browser'); }
  } };
}

const grid = document.getElementById('post-grid');
if (grid) {
  const box = document.createElement('details'); box.className = 'saved-posts'; box.open = true;
  const paint = () => {
    const list = readBookmarks();
    box.hidden = !list.length; if (!list.length) return;
    const summary = document.createElement('summary'); summary.textContent = `★ Saved articles (${list.length})`;
    const items = document.createElement('ul');
    for (const item of list) {
      const li = document.createElement('li'), link = document.createElement('a'), remove = document.createElement('button');
      link.href = item.p; link.textContent = item.t;
      remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${item.t} from saved articles`);
      remove.addEventListener('click', () => { toggleBookmark(item.p, item.t); paint(); (box.querySelector('a') || document.getElementById('post-search') || grid.querySelector('a'))?.focus(); });
      li.append(link, remove); items.append(li);
    }
    box.replaceChildren(summary, items);
  };
  paint(); (document.querySelector('.cat-filter') || grid).before(box);
  addEventListener('storage', event => { if (event.key === BOOKMARKS_STORE) paint(); });
  addEventListener('pageshow', paint);
}
