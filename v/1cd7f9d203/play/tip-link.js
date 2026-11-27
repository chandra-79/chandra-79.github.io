// The "Buy me a coffee" line in the finished-daily popup. Loaded only while the tip link is switched on
// (TIP_LINK_ON in engine-source/hub-core.mjs); with the switch off this file is never requested.
// It is a plain link to the tip page: nothing here loads or sends anything, and no cookie is set.
// What it remembers stays in this browser: the day it last showed, and the day "Not now" was pressed.
export const TIP_KEY = 'ziggle-tip-v1';
export const TIP_REST_DAYS = 30; // after "Not now", or after opening the tip page
export const TIP_FROM_STREAK = 3; // not before a player has come back three days running
export const MILESTONES = [7, 14, 30, 50, 100, 200, 365];

const dayOf = key => { const at = Date.parse(`${key}T00:00:00Z`); return Number.isFinite(at) ? Math.round(at / 86_400_000) : null; };
const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };

/** Should the line show? At most once a day, from a three-day streak, and not for 30 days after "Not now" or a visit to the tip page. */
export function tipDue(state, date, streak) {
  const now = dayOf(date);
  if (now === null || !(streak >= TIP_FROM_STREAK)) return false;
  const shown = dayOf(state?.shown), rest = dayOf(state?.rest);
  if (shown !== null && shown >= now) return false;
  return rest === null || now - rest >= TIP_REST_DAYS || now < rest;
}
/** The words: a streak milestone gets its own opening. */
export const tipWords = streak => MILESTONES.includes(streak) ? `${streak} days in a row! If Ziggle brightens your day, you can buy me a coffee.` : 'Enjoying Ziggle? It’s free to play. If it brightens your day, you can buy me a coffee.';

function read() { try { const value = JSON.parse(localStorage.getItem(TIP_KEY)); return value && typeof value === 'object' ? value : {}; } catch { return {}; } }
function write(state) { try { localStorage.setItem(TIP_KEY, JSON.stringify(state)); } catch { /* Private window: it simply shows again another day. */ } }

/** Put the line in the popup's card space. Returns false when it is not due, so the usual card can show. */
export function tipLine(slot, address, streak = 0, date = today()) {
  const state = read(), page = document.documentElement.dataset;
  if (!address || page.kids === 'true' || page.app === 'true' || !tipDue(state, date, streak)) return false; // never in kids mode or the store apps
  write({ ...state, shown: date });
  if (!document.querySelector('link[data-tip-style]')) { const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/play/tip-link.css'; style.dataset.tipStyle = ''; document.head.append(style); } // our own file, same site
  const words = document.createElement('p'); words.textContent = tipWords(streak);
  const go = document.createElement('a'); go.className = 'le-tip-go'; go.href = address; go.target = '_blank'; go.rel = 'noopener'; go.dataset.tipLink = ''; go.textContent = 'Buy me a coffee ☕';
  const no = document.createElement('button'); no.type = 'button'; no.className = 'le-tip-no'; no.textContent = 'Not now';
  const rest = () => write({ ...read(), rest: date });
  const close = () => { slot.hidden = true; slot.classList.remove('le-tip'); slot.setAttribute('aria-label', 'From Ziggle'); slot.replaceChildren(); };
  go.addEventListener('click', rest);
  no.addEventListener('click', () => { rest(); const next = slot.closest('dialog')?.querySelector('.le-actions button'); close(); next?.focus(); });
  const row = document.createElement('div'); row.className = 'le-tip-row'; row.append(go, no);
  slot.classList.add('le-tip'); slot.setAttribute('aria-label', 'Support Ziggle');
  slot.replaceChildren(words, row);
  slot.hidden = false;
  return true;
}
