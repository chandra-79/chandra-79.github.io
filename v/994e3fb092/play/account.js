import { loadProgress, writeProgress, importBackup } from './progress.js';

const KEY = 'ziggle-account-v1';
const SYNCED_KEY = 'ziggle-account-synced';
const Z = () => globalThis.Ziggle;
const changed = () => document.dispatchEvent(new CustomEvent('ziggle:settings', { detail: { key: 'progress' } }));

export function readAccount() {
  try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); if (value && /^[a-f0-9]{32}$/.test(value.token) && typeof value.email === 'string') return value; } catch {}
  return null;
}
const writeAccount = value => { try { if (value) localStorage.setItem(KEY, JSON.stringify(value)); else localStorage.removeItem(KEY); } catch {} };
const blocked = () => !Z() || Z().kids?.() || Z().serverless?.();

/** A friendly name for this device, from the browser's own description ("iPhone · Safari"). Nothing else is sent. */
export function deviceName(ua = navigator.userAgent || '') {
  const device = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android phone' : 'Android tablet')
    : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows PC' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux computer' : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : globalThis.Capacitor ? 'Ziggle app' : 'Browser';
  return `${device} · ${globalThis.Capacitor ? 'Ziggle app' : browser}`;
}
const payload = () => JSON.parse(Z().exportAll(loadProgress()));
function mergeIn(remote) {
  if (!remote) return;
  const text = JSON.stringify(remote);
  writeProgress(importBackup(text, loadProgress()));
  Z().restoreExtras(text);
}

export async function askForCode(email) {
  if (blocked()) return { ok: false, message: 'Accounts are off in kids mode.' };
  return Z().api('/api/account/code', { method: 'POST', body: { email } });
}
export async function signIn(email, code) {
  if (blocked()) return { ok: false, message: 'Accounts are unavailable here.' };
  const result = await Z().api('/api/account/verify', { method: 'POST', body: { email, code, device: deviceName() } });
  if (!result.ok) return result;
  writeAccount({ email: email.trim().toLowerCase(), token: result.token });
  mergeIn(result.payload);
  const saved = await Z().api('/api/account/save', { method: 'POST', body: { token: result.token, payload: payload() } });
  if (saved.ok) { try { localStorage.setItem(SYNCED_KEY, String(Date.now())); } catch {} }
  changed();
  return saved.ok ? saved : { ...result, ...saved, ok: false, message: 'Signed in, but your progress could not be saved online. Please use Sync now to retry.' };
}
/** Pull, merge, push. Returns the account view ({ devices, weekly, email, … }) or a message. */
export async function syncAccount() {
  const account = readAccount();
  if (!account || blocked()) return { ok: false, message: 'Not signed in.' };
  const remote = await Z().api('/api/account/me', { method: 'POST', body: { token: account.token } });
  if (remote.signedOut) { writeAccount(null); changed(); return remote; }
  if (!remote.ok) return remote;
  try { mergeIn(remote.payload); } catch { return { ok: false, message: 'Your saved progress couldn’t be read. This device’s progress is unchanged.' }; }
  const saved = await Z().api('/api/account/save', { method: 'POST', body: { token: account.token, payload: payload() } });
  if (saved.ok) { try { localStorage.setItem(SYNCED_KEY, String(Date.now())); } catch {} }
  changed();
  return saved;
}
const call = async (action, extra = {}) => {
  const account = readAccount(); if (!account) return { ok: false, message: 'Not signed in.' };
  const result = await Z().api(`/api/account/${action}`, { method: 'POST', body: { token: account.token, ...extra } });
  if (result.signedOut || (result.ok && ['signout', 'delete'].includes(action))) { writeAccount(null); changed(); }
  return result;
};
export const setWeekly = on => call('weekly', { on, email: readAccount()?.email || '' });
export const removeDevice = id => call('remove', { device: id });
export const signOut = () => call('signout');
export const deleteAccount = () => call('delete');

/** Called by every page (hub.js): a quiet sync now and then, and a push when the page is put away. */
export function autoSync() {
  if (!readAccount() || blocked()) return;
  let last = 0; try { last = Number(localStorage.getItem(SYNCED_KEY)) || 0; } catch {}
  if (Date.now() - last > 10 * 60_000) syncAccount().catch(() => {});
  addEventListener('visibilitychange', () => {
    const account = readAccount();
    if (document.visibilityState !== 'hidden' || !account || blocked()) return;
    Z().api('/api/account/save', { method: 'POST', queue: true, body: { token: account.token, payload: payload() } }).catch(() => {});
  });
}

const when = time => new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
/** The account block in Settings → Progress. */
export function mountAccount(root) {
  root.innerHTML = `<section class="sync-panel account-panel" data-online data-grownups aria-labelledby="account-heading">
    <h3 id="account-heading">Your Ziggle account</h3>
    <div id="account-out">
      <p>Sign in with your email and your streak, trophies and saved games follow you to every phone, tablet and computer (up to 10). No password: we email you a 6-digit code.</p>
      <form class="inline-form" id="account-email-form"><label for="account-email">Email</label><input id="account-email" type="email" autocomplete="email" inputmode="email" maxlength="254" required><button class="primary-button" type="submit">Email me a code</button></form>
      <form class="inline-form" id="account-code-form" hidden><label for="account-code">6-digit code</label><input id="account-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" required><button class="primary-button" type="submit">Sign in</button><button class="secondary-button" type="button" id="account-back">Use another email</button></form>
    </div>
    <div id="account-in" hidden>
      <p id="account-who"></p>
      <div class="backup-actions"><button class="secondary-button" id="account-sync" type="button">Sync now</button><button class="secondary-button" id="account-signout" type="button">Sign out of this device</button></div>
      <label class="setting"><input type="checkbox" id="account-weekly"> <span><strong>Weekly email</strong><small>One email on Sundays: new blog posts, your streak and your leagues. Off unless you switch it on; stop it any time.</small></span></label>
      <h4>Your devices</h4>
      <ul class="device-list" id="account-devices"></ul>
      <p><button class="link-button" id="account-delete" type="button">Delete my account</button> <small>Removes the copy kept on Ziggle’s server. Progress on your devices stays.</small></p>
    </div>
    <p class="panel-status" id="account-status" role="status" aria-live="polite"></p>
  </section>`;
  const $ = id => root.querySelector(`#${id}`);
  const status = (text, failed = false) => { const el = $('account-status'); el.textContent = text || ''; el.classList.toggle('error', failed); };
  let email = '';
  function show(view) {
    const account = readAccount();
    $('account-out').hidden = Boolean(account); $('account-in').hidden = !account;
    if (!account) return;
    $('account-who').textContent = `Signed in as ${account.email}.`;
    if (!view?.devices) return;
    $('account-weekly').checked = view.weekly === true;
    $('account-devices').replaceChildren(...view.devices.map(device => {
      const item = document.createElement('li');
      item.innerHTML = `<span><strong></strong><small></small></span>`;
      item.querySelector('strong').textContent = device.me ? `${device.name} (this device)` : device.name;
      item.querySelector('small').textContent = `Added ${when(device.added)} · last used ${when(device.seen)}`;
      if (!device.me) {
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary-button'; remove.textContent = 'Sign out';
        remove.addEventListener('click', async () => { const result = await removeDevice(device.id); status(result.ok ? `${device.name} is signed out.` : result.message, !result.ok); if (result.ok) show(result); });
        item.append(remove);
      }
      return item;
    }));
  }
  $('account-email-form').addEventListener('submit', async event => {
    event.preventDefault();
    email = $('account-email').value.trim();
    status('Sending your code…');
    const result = await askForCode(email);
    status(result.message, !result.ok);
    if (result.ok) { $('account-email-form').hidden = true; $('account-code-form').hidden = false; $('account-code').focus(); }
  });
  $('account-back').addEventListener('click', () => { $('account-code-form').hidden = true; $('account-email-form').hidden = false; status(''); $('account-email').focus(); });
  $('account-code-form').addEventListener('submit', async event => {
    event.preventDefault();
    status('Signing in…');
    const result = await signIn(email, $('account-code').value);
    if (!result.ok && !readAccount()) { status(result.message, true); return; }
    $('account-code').value = ''; $('account-code-form').hidden = true; $('account-email-form').hidden = false;
    status(result.ok ? 'Signed in. Your progress is merged and saved.' : result.message, !result.ok);
    show(result);
  });
  $('account-sync').addEventListener('click', async () => { status('Syncing…'); const result = await syncAccount(); status(result.ok ? 'Progress merged and saved. Other devices update when they sync.' : result.message, !result.ok); show(result); });
  $('account-signout').addEventListener('click', async () => { const result = await signOut(); writeAccount(null); status(result.ok ? 'Signed out. Your progress stays on this device.' : 'Signed out on this device.'); show(); });
  $('account-weekly').addEventListener('change', async event => {
    const result = await setWeekly(event.target.checked);
    status(result.ok ? (event.target.checked ? 'Weekly email is on. Look out for it on Sunday.' : 'Weekly email is off.') : result.message, !result.ok);
    if (!result.ok) event.target.checked = !event.target.checked;
  });
  $('account-delete').addEventListener('click', async () => {
    if ($('account-delete').dataset.armed !== '1') { $('account-delete').dataset.armed = '1'; $('account-delete').textContent = 'Tap again to delete your account'; return; }
    const result = await deleteAccount();
    status(result.ok ? 'Your account is deleted. Progress on this device stays.' : result.message, !result.ok);
    show();
  });
  show();
  if (readAccount()) syncAccount().then(show).catch(() => {});
}
