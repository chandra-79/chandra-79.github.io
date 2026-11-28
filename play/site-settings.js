import { demoPreferences, saveDemoPreferences } from './howto-store.js';
import { KIDS_MODE_AVAILABLE } from './hub-core.js';
import { soundOn, isTouch, play, haptic } from './fx.js';
import './fit.js';
import './game-frame.js';
import './ad-slots.js';
import { readKeys, saveKeys, keyboardHere } from './shortcuts.js';

const hub = () => globalThis.Ziggle;
const LOOKS = Object.freeze([
  { id: 'paper', name: 'Cream' }, { id: 'press', name: 'Stone' }, { id: 'storybook', name: 'Meadow' },
  { id: 'swiss', name: 'Bold' }, { id: 'rec', name: 'Sand' }, { id: 'harbour', name: 'Sky' },
  { id: 'amber', name: 'Amber' }, { id: 'slate', name: 'Slate' }, { id: 'contrast', name: 'High Contrast' },
]);
const svg = path => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`;
const MODES = Object.freeze([
  { id: 'auto', name: 'Match device', icon: svg('M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Zm0 0v18') },
  { id: 'light', name: 'Day Spark', icon: svg('M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4') },
  { id: 'dark', name: 'Night Fizz', icon: svg('M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z') },
]);
const LOOK_KEY = 'ziggle-look-v1';
const TABS = Object.freeze([['look', 'Look'], ['play', 'Play'], ['daily', 'Daily'], ['progress', 'Saving'], ['more', 'More']]);
// Older links and bookmarks: Home and You moved into More (2.53).
const MOVED = Object.freeze({ home: 'home-extras', you: 'more' });
export const HOME_SECTIONS = Object.freeze([
  ['notes', 'About Ziggle', 'The welcome line and notes about how Ziggle works.'],
  ['training', 'Ziggle Training', 'Typing, emoji and flags, memory palace and cube trainers.'],
  ['trophies', 'Trophy shelf and season', 'Trophies you’ve earned and this season’s goals.'],
  ['stickers', 'Surprises', 'Stickers for the surprises you’ve found, and one clue to the next. On unless you switch it off.', 'on'],
  ['boards', 'Leaderboards and leagues', 'Today’s best times and your friend leagues.'],
  ['blog', 'From the blog', 'The three newest posts.'],
  ['yours', 'Your Ziggle shortcuts', 'Quick links to backup, sync and Play your way.'],
]);
let tab = 'look';
const DAILY_GAMES = Object.freeze([['search', 'Word Search'], ['crossword', 'Crossword'], ['weaver', 'Word Cloud'], ['lock', 'Letter Lock'], ['arrows', 'Arrow Escape'], ['memory', 'Memory Mischief'], ['sudoku', 'Sudoku'], ['sums', 'Sum Spark']]);
const PLANS = Object.freeze([['easy', 'Start at Easy'], ['medium', 'Start at Medium'], ['hard', 'Start at Expert']]);
// Visit counts need somewhere to go: the Ziggle server, or on the public website a named counter (counter/worker.mjs). With neither, the switch is not shown.
const COUNTS_OFF = document.querySelector('meta[name="ziggle-server"]')?.content?.trim() === 'none' && !document.querySelector('meta[name="ziggle-counter"]');
let dialog = null, opener = null;

const changed = key => document.dispatchEvent(new CustomEvent('ziggle:settings', { detail: { key } }));
let statusTimer;
function say(message, error = false, pending = false) {
  clearTimeout(statusTimer);
  const status = dialog.querySelector('#settings-status');
  status.textContent = message;
  status.classList.toggle('error', error);
  if(message&&!error&&!pending)statusTimer=setTimeout(()=>{if(status.textContent===message)status.textContent='';},5000);
}
function currentLook() { return document.documentElement.dataset.look || 'paper'; }
const check = (id, title, detail, attrs = '') => `<label class="setting"${attrs}><input type="checkbox" id="${id}"> <span><strong>${title}</strong><small>${detail}</small></span></label>`;

function build() {
  dialog = document.createElement('dialog');
  dialog.id = 'site-settings';
  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-title');
  dialog.innerHTML = `<div class="settings-top"><div class="settings-head"><h2 id="settings-title">Settings</h2><button type="button" class="settings-close" aria-label="Close settings">×</button></div>
    <div class="settings-tabs" role="tablist" aria-label="Settings sections">${TABS.map(([id, label]) => `<button type="button" role="tab" id="settings-tab-${id}" data-settings-tab="${id}" aria-controls="settings-body" aria-selected="false">${label}</button>`).join('')}</div>
    </div><div id="settings-body" role="tabpanel">
    <fieldset class="settings-group" data-tab="look"><legend>Theme</legend><div class="mode-options">${MODES.map(mode => `<label class="mode-option"><input type="radio" name="appearance" value="${mode.id}">${mode.icon}<span>${mode.name}</span></label>`).join('')}</div></fieldset>
    <fieldset class="settings-group" data-tab="look"><legend>Colour</legend><div id="look-options" class="skin-options"></div></fieldset>
    <fieldset class="settings-group" data-tab="look" data-needs-hub><legend>Board style <small>Longer streaks unlock more.</small></legend><div id="skin-options" class="skin-options"></div></fieldset>
    <fieldset class="settings-group switches" data-tab="play" data-needs-hub id="sound-settings"><legend class="sr-only">Sound, motion and help</legend>
      ${check('sound-fx', 'Sound', 'Pops and dings as you play.')}
      ${check('haptics', 'Vibration', 'A small buzz for found words and blocked moves.', ' data-touch-only')}
      ${check('calm-mode', 'Calmer motion', 'No flips, shakes, confetti or sliding.')}
      ${check('quick-demos', 'Quick demos', 'A short example when a new rule appears.')}
      ${check('word-shares', 'Share in words', 'Results as sentences instead of emoji.')}
      ${check('key-shortcuts', 'Keyboard shortcuts', 'One key for common buttons, like ? for a hint, or G then a number to pick a game. Press Ctrl and / to see them all.', ' data-keyboard-only')}
      ${check('key-hints', 'Show the keys on buttons', 'A small label beside each button that has a key.', ' data-keyboard-only')}
    </fieldset>
    <fieldset class="settings-group switches" data-tab="play" id="app-reminder" hidden><legend>Daily reminder <small>One notification a day, skipped once you’ve played. It never leaves your phone.</small></legend>
      ${check('reminder-on', 'Remind me every day', 'Off unless you switch it on.')}
      <label class="setting reminder-time"><span><strong>Time</strong></span> <input type="time" id="reminder-time" value="19:00" step="900"></label>
    </fieldset>
    <fieldset class="settings-group" data-tab="play" id="play-your-way"><legend class="sr-only">Play your way</legend>
      <p class="settings-note">Keyboard, touch and screen readers work in every game.</p>
      <details class="settings-more"><summary>How Ziggle plays your way</summary>
      <ul class="a11y-list">
        <li><strong>Keyboard, mouse or touch</strong> for every game. Letter Lock and Word Cloud take typing; Arrow Escape lets you type an arrow’s ID; Sudoku uses arrow keys and 1–9.</li>
        <li><strong>Never colour alone.</strong> Letter Lock tiles carry ✓ and •, Word Cloud clues are labelled, and Sudoku conflicts are outlined.</li>
        <li><strong>Calmer motion</strong> above, and Ziggle follows your device’s reduced-motion setting too.</li>
        <li><strong>Share in words</strong> above writes results as sentences a screen reader can read.</li>
        <li><strong>Every colour look</strong>, light and dark, is checked so it stays easy to read, and text is never tiny.</li>
        <li><strong>No timers that pressure.</strong> Pause any game; the streak forgives a missed day with freezes.</li>
      </ul><p class="settings-note"><a href="/accessibility.html">Accessibility in full</a></p></details>
    </fieldset>
    <fieldset class="settings-group" data-tab="daily" data-needs-hub id="daily-games"><legend>Games in my daily set</legend>
      <div class="daily-game-choices">${DAILY_GAMES.map(([id, name]) => check(`daily-game-${id}`, `<img class="setting-art" src="/play/art/still/${id}.svg" width="26" height="26" alt="">${name}`, '')).join('')}</div>
      <p id="daily-selection-note" class="settings-note" role="status"></p>
    </fieldset>
    <fieldset class="settings-group" data-tab="daily" data-needs-hub id="daily-levels"><legend>Starting level <small>Each game climbs from here as you play. A new choice starts with your next ladder.</small></legend>
      <div class="level-all" role="group" aria-label="Starting level for all games">${PLANS.map(([plan, label]) => `<button type="button" class="secondary-button" data-plan-all="${plan}" aria-pressed="false" aria-label="${label} for all games">${label.replace('Start at ', '')}</button>`).join('')}</div>
      <details class="settings-more" id="level-each"><summary>Set a level for each game</summary>
      <p class="level-today" id="level-today"></p>
      <div class="level-rows">${DAILY_GAMES.map(([id, name]) => `<label class="level-row"><span>${name}</span><select id="plan-${id}" data-plan-game="${id}">${PLANS.map(([plan, label]) => `<option value="${plan}">${label}</option>`).join('')}</select><small class="level-now" id="plan-now-${id}"></small></label>`).join('')}</div></details>
      <details class="settings-more"><summary>How levels and points work</summary><p class="settings-note">Every day each game is a ladder of puzzles with no end. Start at Easy: 6 Easy, then 10 Medium, then Expert. Start at Medium: 20 Medium, then Expert. Start at Expert: Expert all the way. The first puzzle of each level is that level’s daily, the same for everyone, and counts for leaderboards and points (medium ×1.2, expert ×1.5); the rest are bonus levels that earn ✦ credits.</p></details>
    </fieldset>
    <div class="settings-group save-facts" data-tab="progress" data-needs-hub><span aria-hidden="true">✓</span><p><strong>Your progress is saved in this browser</strong>No sign-up, no cookies. Nothing leaves this device unless you choose it below.</p></div>
    <fieldset class="settings-group" data-tab="progress" data-needs-hub><legend class="sr-only">Backup and other devices</legend><div id="progress-slot"><p class="muted">Loading…</p></div></fieldset>
    <fieldset class="settings-group switches" data-tab="progress" data-needs-hub><legend>Privacy</legend>
      ${check('kids-mode', 'Kids mode', 'Hides leaderboards, leagues, names and email signup, and sends nothing to the server.', KIDS_MODE_AVAILABLE ? '' : ' hidden')}
      ${check('analytics-toggle', 'Share anonymous visit counts', 'We only count how many people visit each day and how many come back, never who. Off in kids mode, or if your browser asks sites not to track you.', COUNTS_OFF ? ' hidden' : '')}
      <p class="settings-note"><a href="/privacy.html">Privacy in full</a></p>
    </fieldset>
    <fieldset class="settings-group" data-tab="more" data-needs-hub data-grownups><legend>Leaderboard name <small>Shown publicly. Not your real name.</small></legend>
      <form class="settings-name" id="settings-nickname-form"><label class="sr-only" for="settings-nickname">Leaderboard name</label><input id="settings-nickname" maxlength="20" autocomplete="off" placeholder="Puzzle Pal"><button type="submit">Save</button></form>
    </fieldset>
    <fieldset class="settings-group" data-tab="more" data-needs-hub><legend class="sr-only">Home page</legend>
      <details class="settings-more" id="home-extras"><summary><span>Home page extras<small>Surprises, trophies, leaderboards, blog</small></span></summary>
      <p class="settings-note">Home keeps to the essentials: today’s Ziggle, your streak and last 12 weeks, the games and your Surprises. Switch on anything else you’d like to see there, or switch Surprises off.</p>
      ${HOME_SECTIONS.map(([id, title, detail]) => check(`home-${id}`, title, detail, id === 'boards' ? ' data-online' : '')).join('')}</details>
    </fieldset>
    <fieldset class="settings-group" data-tab="more" data-needs-hub data-grownups data-online><legend class="sr-only">Feedback</legend>
      <details class="settings-more" id="feedback-more"><summary><span>Send feedback<small>Ideas, bugs or a name to report</small></span></summary>
      <p class="settings-note">Only your words, the topic and this page are kept: no name, no address. Please don’t include personal details.</p>
      <form class="settings-feedback" id="feedback-form"><label class="sr-only" for="feedback-topic">Topic</label><select id="feedback-topic"><option value="idea">An idea</option><option value="game">A game or trainer</option><option value="bug">Something broke</option><option value="name">A public name</option><option value="other">Something else</option></select>
      <label class="sr-only" for="feedback-message">Your message</label><textarea id="feedback-message" rows="3" maxlength="1000" placeholder="What would make Ziggle better?"></textarea><button type="submit">Send</button></form></details>
    </fieldset>
    <fieldset class="settings-group" data-tab="more" id="errors-group" hidden><legend class="sr-only">Report a problem</legend>
      <details class="settings-more" id="errors-more"><summary><span>Report a problem<small>Ziggle noticed a hiccup on this device</small></span></summary>
      <p class="settings-note">Something didn’t go to plan earlier. Nothing is sent anywhere unless you send it. If you tell us about it, these notes help us find the cause.</p>
      <div class="settings-feedback settings-diagnostics"><button type="button" id="view-error-report">Show the notes</button>
      <label class="sr-only" for="local-error-report" hidden>Notes about the problem: select and copy</label>
      <textarea id="local-error-report" rows="6" readonly hidden></textarea></div></details>
    </fieldset>
    <div class="settings-group settings-about" data-tab="more"><p class="settings-note" id="offline-ready" hidden>Offline play is ready: the games open without a connection.</p><p class="settings-note" id="ios-install-hint" hidden>Install Ziggle on iPhone or iPad: tap Share, then “Add to Home Screen”.</p><p class="settings-note"><span id="settings-version">Ziggle</span> · <a href="/about.html">About</a> · <a href="/terms.html">Terms</a> · <a href="/accessibility.html">Accessibility</a></p></div>
    </div>
    <p class="settings-status" id="settings-status" role="status" aria-live="polite"></p>
    <div class="settings-foot"><small>Changes save as you go</small><button type="button" class="settings-done">Done</button></div>`;
  document.body.append(dialog);
  mountReminder(dialog);
  dialog.querySelector('#view-error-report').addEventListener('click', () => {
    const report = dialog.querySelector('#local-error-report');
    const errors = hub()?.errors?.() || [];
    report.value = errors.length ? errors.slice(-20).map(item =>
      `${item.at || ''} | ${item.version || ''} | ${item.page || ''}\n${item.message || ''}`
    ).join('\n\n') : 'Nothing has gone wrong on this device.';
    report.hidden = false;
    dialog.querySelector('label[for="local-error-report"]').hidden = false;
    report.focus({ preventScroll: true });
    report.select();
  });
  const close = () => dialog.close();
  // 2.66: once a backup has been downloaded here, the home page stops reminding the player to make one.
  dialog.addEventListener('click', event => { if (event.target.closest?.('#export-backup')) { try { localStorage.setItem('ziggle-backup-cue-v1', new Date().toISOString().slice(0, 10)); } catch { /* the reminder simply stays */ } } });
  dialog.querySelector('.settings-close').addEventListener('click', close);
  dialog.querySelector('.settings-done').addEventListener('click', close);
  dialog.addEventListener('click', event => { if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(); });
  dialog.addEventListener('close', () => {
    const target = opener?.isConnected && ![document.body, document.documentElement].includes(opener) && opener.getClientRects().length && !opener.closest('[inert]') ? opener : document.querySelector('[data-settings-open]');
    // Restore after leaving the top layer; a newly opened dialog keeps its focus.
    requestAnimationFrame(() => { if (!document.querySelector('dialog[open]')) target?.focus({ preventScroll: true }); });
  });
  dialog.querySelectorAll('[data-settings-tab]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.settingsTab)));
  dialog.querySelector('#quick-demos').addEventListener('change', event => { const saved=saveDemoPreferences({automatic:event.target.checked}); changed('quickDemos'); if(!saved)say('Kept for this visit. This browser could not remember the demo preference.',true); });
  dialog.querySelector('.settings-tabs').addEventListener('keydown', event => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(event.key in keys) && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const ids = TABS.map(([id]) => id).filter(id => !dialog.querySelector(`[data-settings-tab="${id}"]`).hidden);
    const current = event.target.closest('[data-settings-tab]')?.dataset.settingsTab || tab;
    const next = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids.at(-1) : ids[(ids.indexOf(current) + keys[event.key] + ids.length) % ids.length];
    showTab(next); dialog.querySelector(`[data-settings-tab="${next}"]`).focus();
  });
  for (const [id, title, , on] of HOME_SECTIONS) dialog.querySelector(`#home-${id}`).addEventListener('change', event => {
    const Z = hub(); if (!Z) return;
    const profile = Z.profile();
    // Most sections are extras (listed in homeShow when on); one that starts on is listed in homeHide when off.
    const list = on ? 'homeHide' : 'homeShow', add = on ? !event.target.checked : event.target.checked;
    profile[list] = add ? [...new Set([...(profile[list] || []), id])] : (profile[list] || []).filter(item => item !== id);
    Z.saveProfile(profile);
    say(`${title} ${event.target.checked ? 'now shows on' : 'is off'} your home page.`);
    changed('home');
  });
  for (const [id] of DAILY_GAMES) dialog.querySelector(`#daily-game-${id}`).addEventListener('change', () => {
    const Z = hub(), profile = Z.profile();
    profile.dailyGames = DAILY_GAMES.map(([game]) => game).filter(game => dialog.querySelector(`#daily-game-${game}`).checked);
    if (!Z.saveProfile(profile)) { render(); say('Could not save your daily choices. Please try again.'); return; }
    render(); changed('dailyGames');
  });
  dialog.querySelectorAll('[data-plan-game]').forEach(select => select.addEventListener('change', () => {
    const Z = hub(); if (!Z?.setPlan) return;
    Z.setPlan(select.dataset.planGame, select.value);
    renderLevels();
    say(`${DAILY_GAMES.find(([id]) => id === select.dataset.planGame)[1]}: ${ladderNote(Z, select.dataset.planGame)}.`);
  }));
  dialog.querySelectorAll('[data-plan-all]').forEach(button => button.addEventListener('click', () => {
    const Z = hub(); if (!Z?.setPlan) return;
    for (const [id] of DAILY_GAMES) Z.setPlan(id, button.dataset.planAll);
    renderLevels();
    say(`Every game now uses ${PLANS.find(([plan]) => plan === button.dataset.planAll)[1].replace(/ \(.*\)/, '')}.`);
  }));
  dialog.querySelector('#feedback-form').addEventListener('submit', async event => {
    event.preventDefault();
    const Z = hub(), box = dialog.querySelector('#feedback-message'), message = box.value.trim();
    if (!Z || Z.kids?.()) return;
    if (message.length < 5) { say('Write a few more words first.',true); box.focus(); return; }
    const page = location.pathname + (new URLSearchParams(location.search).get('game') ? `?game=${new URLSearchParams(location.search).get('game')}` : '');
    say('Sending…',false,true);
    const result = await Z.api('/api/feedback', { method: 'POST', body: { message, topic: dialog.querySelector('#feedback-topic').value, page } });
    if(result.ok)box.value='';if(tab==='more')say(result.ok?'Thank you! Your note was sent.':result.message||'That didn’t send. Please try again later.',!result.ok);
  });

  dialog.querySelectorAll('input[name="appearance"]').forEach(input => input.addEventListener('change', () => {
    globalThis.ZiggleAppearance?.set(input.value);
    say(input.value === 'auto' ? 'Ziggle now follows your device’s light or dark setting.' : `${MODES.find(mode => mode.id === input.value).name} it is, on every page.`);
    changed('appearance');
  }));
  const profileToggle = (id, field, on, off) => dialog.querySelector(`#${id}`).addEventListener('change', event => {
    const Z = hub(); if (!Z) return;
    const profile = Z.profile(); profile[field] = event.target.checked; Z.saveProfile(profile);
    say(event.target.checked ? on : off);
    render(); changed(field);
  });
  profileToggle('calm-mode', 'calm', 'Calmer motion is on across Ziggle.', 'Motion is back to your device’s setting.');
  profileToggle('word-shares', 'wordShares', 'Shares will be written in words.', 'Shares will use the emoji grid.');
  profileToggle('sound-fx', 'sound', 'Sounds are on.', 'Sounds are off.');
  profileToggle('haptics', 'haptics', 'Vibration is on.', 'Vibration is off.');
  dialog.querySelector('#sound-fx').addEventListener('change', event => { if (event.target.checked) play('ding'); });
  dialog.querySelector('#key-shortcuts').addEventListener('change', event => { saveKeys({ on: event.target.checked }); dialog.querySelector('#key-hints').disabled = !event.target.checked; say(event.target.checked ? 'Keyboard shortcuts are on.' : 'Keyboard shortcuts are off.'); });
  dialog.querySelector('#key-hints').addEventListener('change', event => { saveKeys({ hints: event.target.checked }); say(event.target.checked ? 'Keys now show on buttons.' : 'Keys are hidden on buttons.'); });
  dialog.querySelector('#haptics').addEventListener('change', event => { if (event.target.checked) haptic(20); });
  profileToggle('kids-mode', 'kidsMode', 'Kids mode is on. Nothing is sent to the server, and grown-up features are hidden.', 'Kids mode is off.');
  profileToggle('analytics-toggle', 'analytics', 'Thanks. Only anonymous day-level counts are shared.', 'Visit counts are off.');
  dialog.querySelector('#settings-nickname-form').addEventListener('submit', event => {
    event.preventDefault();
    const Z = hub(); if (!Z) return;
    const name = dialog.querySelector('#settings-nickname').value.trim();
    if (!Z.validNickname(name)) { say('Use 3–20 letters, numbers, spaces, dots or dashes, kept friendly.', true); return; }
    const profile = Z.profile(); profile.nickname = name; Z.saveProfile(profile);
    say('Saved. Your next leaderboard post uses this name.');
    changed('nickname');
  });
}

function render() {
  const mode = globalThis.ZiggleAppearance?.mode() ?? 'auto';
  dialog.querySelectorAll('input[name="appearance"]').forEach(input => { input.checked = input.value === mode; });
  const look = currentLook();
  dialog.querySelector('#look-options').replaceChildren(...LOOKS.map(item => {
    const label = document.createElement('label');
    label.className = `skin-option look-${item.id}`;
    label.innerHTML = '<input type="radio" name="look"><span class="swatch" aria-hidden="true"></span><span class="skin-name"></span><span class="option-tick" aria-hidden="true">✓</span>';
    const input = label.querySelector('input');
    input.value = item.id; input.checked = item.id === look;
    label.querySelector('.skin-name').textContent = item.name;
    input.addEventListener('change', () => {
      try { localStorage.setItem(LOOK_KEY, item.id); } catch { /* This visit only. */ }
      if (item.id === 'paper') delete document.documentElement.dataset.look; else document.documentElement.dataset.look = item.id;
      hub()?.mirrorNow?.();
      say(`${item.name} it is, on every Ziggle page.`);
      changed('look');
    });
    return label;
  }));
  const Z = hub();
  if (Z?.version) dialog.querySelector('#settings-version').textContent = `Ziggle ${Z.version}`;
  // iPhone and iPad have no install prompt: say where the system keeps it, unless Ziggle is already on the Home Screen.
  dialog.querySelector('#ios-install-hint').hidden = !('standalone' in navigator) || navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  // Shown once the installed copy is complete on this device (sw.js writes the marker last).
  try { globalThis.caches?.match('/offline-ready').then(mark => { dialog.querySelector('#offline-ready').hidden = !mark; }).catch(() => {}); } catch { /* cache storage blocked */ }
  dialog.querySelectorAll('[data-needs-hub]').forEach(group => { group.hidden = !Z; });
  if (!Z) return;
  const profile = Z.profile();
  const chosen = document.documentElement.dataset.skin || 'classic';
  dialog.querySelector('#skin-options').replaceChildren(...Z.skins().map(skin => {
    const label = document.createElement('label');
    label.className = `skin-option skin-${skin.id}${skin.unlocked ? '' : ' locked'}`;
    label.innerHTML = '<input type="radio" name="skin"><span class="swatch" aria-hidden="true"></span><span class="skin-name"></span><span class="option-tick" aria-hidden="true">✓</span>';
    const input = label.querySelector('input');
    input.value = skin.id; input.checked = skin.id === chosen; input.disabled = !skin.unlocked;
    label.querySelector('.skin-name').textContent = skin.unlocked ? skin.name : `${skin.name} · ${skin.need}-day streak`; if (!skin.unlocked) label.title = `Locked until a ${skin.need}-day streak`;
    input.addEventListener('change', () => { const value = Z.profile(); value.skin = skin.id; Z.saveProfile(value); say(`${skin.name} boards it is.`); changed('skin'); });
    return label;
  }));
  dialog.querySelector('#quick-demos').checked = demoPreferences().automatic;
  dialog.querySelector('#calm-mode').checked = profile.calm;
  dialog.querySelector('#word-shares').checked = profile.wordShares;
  dialog.querySelector('#sound-fx').checked = soundOn();
  dialog.querySelector('#haptics').checked = profile.haptics !== false;
  dialog.querySelector('[data-touch-only]').hidden = !isTouch();
  { const keys = readKeys(), phone = matchMedia('(hover: none) and (pointer: coarse)').matches && !keyboardHere();
    dialog.querySelector('#key-shortcuts').checked = keys.on; dialog.querySelector('#key-hints').checked = keys.hints; dialog.querySelector('#key-hints').disabled = !keys.on;
    dialog.querySelectorAll('[data-keyboard-only]').forEach(row => { row.hidden = phone; }); }
  dialog.querySelector('#kids-mode').checked = profile.kidsMode;
  dialog.querySelector('#analytics-toggle').checked = profile.analytics && !profile.kidsMode;
  dialog.querySelector('#analytics-toggle').disabled = profile.kidsMode;
  for (const [id, , , on] of HOME_SECTIONS) dialog.querySelector(`#home-${id}`).checked = on ? !(profile.homeHide || []).includes(id) : (profile.homeShow || []).includes(id);
  for (const [id] of DAILY_GAMES) dialog.querySelector(`#daily-game-${id}`).checked = (profile.dailyGames || DAILY_GAMES.map(([game]) => game)).includes(id);
  dialog.querySelector('#daily-selection-note').textContent = (profile.dailyGames || DAILY_GAMES).length ? `${(profile.dailyGames || DAILY_GAMES).length} of ${DAILY_GAMES.length} in your set. Every game stays in the Games menu.` : 'No daily games selected. Choose any when you are ready.';
  renderLevels();
  const name = dialog.querySelector('#settings-nickname');
  if (document.activeElement !== name) name.value = profile.nickname || '';
}

function ladderNote(Z, id) {
  const climb = Z.climb?.(id);
  if (!climb?.on) return `Today: ${Z.tierNames[Z.tier(id)]}`;
  return climb.step ? `Today: on ${climb.label}` : `Today starts at ${Z.tierNames[climb.start]}`;
}
function renderLevels() {
  const Z = hub(); if (!Z?.plan || !dialog) return;
  const today = Z.today();
  dialog.querySelector('#level-today').textContent = Z.climb?.('arrows', today)?.on === false
    ? 'The ladder starts on Sunday 8 November; until then every daily is medium.'
    : 'Today’s ladders, game by game: the level you’re on now is shown beside each one.';
  const plans = new Set(DAILY_GAMES.map(([id]) => Z.plan(id)));
  dialog.querySelectorAll('[data-plan-all]').forEach(button => button.setAttribute('aria-pressed', String(plans.size === 1 && plans.has(button.dataset.planAll))));
  for (const [id] of DAILY_GAMES) {
    dialog.querySelector(`#plan-${id}`).value = Z.plan(id);
    dialog.querySelector(`#plan-now-${id}`).textContent = ladderNote(Z, id);
  }
}
let progressAttempt=0;
async function loadProgressPanel(){
  const slot=dialog.querySelector('#progress-slot');if(slot.dataset.loading)return;
  slot.dataset.loading='1';slot.textContent='Loading progress tools…';
  let timer;
  try{const module=await Promise.race([import('./progress-panel.js'+(progressAttempt++?'?retry='+progressAttempt:'')),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),8000);})]);module.mountProgress(slot);slot.dataset.ready='1';}
  catch{delete slot.dataset.ready;slot.textContent='Progress tools could not load. Your saved games are unchanged. ';const retry=document.createElement('button');retry.type='button';retry.className='secondary-button';retry.textContent='Try again';retry.onclick=loadProgressPanel;slot.append(retry);}
  finally{
    clearTimeout(timer);delete slot.dataset.loading;
    // Newly inserted tools can move an already-focused footer in short, scrolling dialogs.
    const focused=document.activeElement;
    requestAnimationFrame(()=>{if(dialog.open&&document.activeElement===focused&&dialog.contains(focused)&&focused.getClientRects().length)focused.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});
  }
}
function showTab(id) {
  const Z = hub();
  for (const [key] of TABS) dialog.querySelector(`[data-settings-tab="${key}"]`).hidden = !Z && [...dialog.querySelectorAll(`[data-tab="${key}"]`)].every(group => group.hasAttribute('data-needs-hub'));
  if (dialog.querySelector(`[data-settings-tab="${id}"]`)?.hidden !== false) id = 'look';
  if(tab!==id){dialog.querySelector('#settings-body').scrollTop=0;say('');}
  tab = id;
  dialog.querySelectorAll('[data-settings-tab]').forEach(button => { const on = button.dataset.settingsTab === id; button.setAttribute('aria-selected', String(on)); button.tabIndex = on ? 0 : -1; });
  dialog.querySelector('#settings-body').setAttribute('aria-labelledby', `settings-tab-${id}`);
  dialog.querySelectorAll('[data-tab]').forEach(group => { group.classList.toggle('off-tab', group.dataset.tab !== id); });
  if (id === 'progress' && Z && !dialog.querySelector('#progress-slot').dataset.ready) {
    loadProgressPanel();
  }
}

/** Open Settings, optionally focusing one control (for example the leaderboard name). */
function open(focusId = '', trigger) {
  if (!dialog) build();
  focusId = MOVED[focusId] || focusId;
  const named = TABS.some(([id]) => id === focusId);
  if (!dialog.open) opener = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  document.querySelector('.collection-menu')?.removeAttribute('open');
  say('');
  render();
  const holder = !named && focusId && dialog.querySelector(`#${focusId}`)?.closest('[data-tab]');
  showTab(named ? focusId : holder ? holder.dataset.tab : tab);
  // The problem notes only appear once something has actually gone wrong on this device.
  dialog.querySelector('#errors-group').hidden = !(hub()?.errors?.() || []).length;
  if (!dialog.open) dialog.showModal();
  const target = !named && focusId ? dialog.querySelector(`#${focusId}`) : null;
  const fold = target?.closest('details'); if (fold) fold.open = true;
  ((target?.matches('fieldset,details') ? target.querySelector('input,select,button') : target) || (tab === 'look' && dialog.querySelector('input[name="appearance"]:checked')) || dialog.querySelector('[data-settings-tab][aria-selected="true"]') || dialog.querySelector('.settings-close')).focus({ preventScroll: true });
}
globalThis.ZiggleSettings = Object.freeze({ open });
document.addEventListener('click', event => {
  const link = event.target.closest?.('[data-settings-tab-open]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault(); open(link.dataset.settingsTabOpen, link.closest('.collection-menu')?.querySelector('summary') || link);
});

const bind = () => {
  document.querySelectorAll('[data-settings-open]').forEach(button => button.addEventListener('click', () => open('', button)));
  const asked = new URLSearchParams(location.search).get('settings');
  if (asked) open(asked === '1' ? '' : asked);
  if (location.hash === '#progress') open('progress');
  if (location.hash === '#play-your-way') open('play');
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
addEventListener('storage', () => { if (dialog?.open) render(); });
function mountReminder(root) {
  if (!globalThis.Capacitor?.Plugins?.LocalNotifications || !root) return;
  import('./app-reminder.js').then(({ readReminder, setReminder }) => {
    const box = root.querySelector('#app-reminder'); if (!box) return;
    box.hidden = false;
    const on = box.querySelector('#reminder-on'), time = box.querySelector('#reminder-time');
    const now = readReminder(); on.checked = now.on; time.value = now.time;
    const apply = async () => { const result = await setReminder(on.checked, time.value || '19:00'); if (!result.ok) on.checked = false; say(result.message, !result.ok); };
    on.addEventListener('change', apply);
    time.addEventListener('change', () => { if (on.checked) apply(); });
  }).catch(() => {});
}
