import { showLevelEnd } from './level-end.js';
import { journeyActive, continueAction, journeyGame } from './daily-journey.js';
import { registerHowTo } from './howto-boot.js';
const Z = () => globalThis.Ziggle;
let dialog, config, opener, resume, resultCard, coach;
let milestoneResume;
const pauseMilestone=()=>{if(!milestoneResume&&config?.suspend)milestoneResume=config.suspend();};
document.addEventListener('ziggle:milestone',event=>{if(event.detail?.open)pauseMilestone();else{const restore=milestoneResume;milestoneResume=null;restore?.();}});
const gameId = () => typeof config.id === 'function' ? config.id() : config.id;
const date = () => config.date?.() || Z()?.today();
const name = () => Z()?.games.find(game => game.id === gameId())?.name || config.title || 'Puzzle';
function close() { dialog.close(); resume?.(); resume = null; opener?.focus({ preventScroll: true }); }
function result() {
  if (!resultCard) {
    resultCard = document.createElement('section'); resultCard.className = 'guided-completion';
    resultCard.innerHTML = '<h2>Finished with help</h2><p>You saw the answer. Your own moves are still here. This does not count as a win, so there are no points and no leaderboard place.</p><div></div>';
    document.querySelector('.game-bar').after(resultCard);
  }
  for (const el of document.querySelector('main').children) if (el !== resultCard && !el.matches('.game-bar,.daily-route,#game-drawer,.drawer-backdrop')) el.setAttribute('data-guided-hidden', '');
  const actions = resultCard.querySelector('div'); actions.replaceChildren();
  const next = journeyActive() ? continueAction() : { label: 'Choose another puzzle →', run: () => { location.href = '/#today'; } };
  for (const [label, run] of [[next.label, next.run], ['Review my puzzle', review], ['Read the answer again', () => open(true)]]) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button'; button.textContent = label; button.onclick = run; actions.append(button);
  }
}
function review() { resultCard?.remove(); resultCard = null; document.querySelectorAll('[data-guided-hidden]').forEach(el => el.removeAttribute('data-guided-hidden')); }
async function open(worked = false, lead = '') {
  opener = document.activeElement;
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.className = 'assist-dialog'; dialog.setAttribute('aria-labelledby', 'assist-title');
    dialog.innerHTML = '<button class="dialog-close circle-button" type="button" aria-label="Close help">×</button><h2 id="assist-title"></h2><p class="assist-note"></p><div class="assist-actions"></div><ol class="assist-steps" hidden></ol><p class="assist-status" role="status"></p>';
    dialog.querySelector('.dialog-close').onclick = close;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('keydown', event => event.stopPropagation());
    document.body.append(dialog);
  }
  dialog.querySelector('h2').textContent = `${name()} · Help`;
  dialog.querySelector('.assist-note').textContent = 'Stuck? Try a hint, or see the answer. Seeing the answer is free and keeps your streak, but gives no points and no leaderboard place. A hint bought with a life counts as help too.';
  const list = dialog.querySelector('ol'); list.hidden = true; list.replaceChildren();
  const status = dialog.querySelector('.assist-status'); status.textContent = '';
  const actions = dialog.querySelector('.assist-actions'); actions.replaceChildren();
  const button = (label, run) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'secondary-button'; el.textContent = label; el.onclick = run; actions.append(el); return el; };
  const rules = { search: 'bar-help', crossword: 'bar-help', weaver: 'weaver-help', lock: 'lock-help', sudoku: 'sudoku-help', memory: 'mm-help', sums: 'sum-help', arrows: 'help-button', twists: 'twist-help' };
  if (document.getElementById(rules[gameId()])) button('How to play', () => { close(); document.getElementById(rules[gameId()]).click(); });
  if (coach) button('Watch a demo', () => coach.replay(close));
  let hintButton; if (config.hint) { const hint = hintButton = button(config.hintLabel?.() || 'Try a hint', () => { close(); config.hint(); }); hint.disabled = Boolean(config.canHint && !config.canHint()); if (hint.disabled) hint.textContent = 'No hint to give right now'; else if (lead === 'hint') { hint.className = 'primary-button'; actions.prepend(hint); } }
  if (config.refill) {
    const wallet = Z()?.wallet?.(), affordable = wallet?.canUse;
    const refill = button(wallet?.freeLeft ? `Use a free life: refill hints (${wallet.freeLeft} left)` : `Refill hints for ${wallet?.cost || 50} earned credits`, () => {
      if (config.refillAvailable && !config.refillAvailable()) { status.textContent = 'Use your existing hints first.'; return; }
      const spent = Z()?.useLife?.(); if (!spent?.ok) { status.textContent = spent?.message || 'No life left. Seeing the answer is always free.'; return; }
      if (config.isDaily?.()) Z()?.markGuided?.(gameId(), false, date());
      close(); config.refill();
    });
    refill.disabled = !affordable || Boolean(config.refillAvailable && !config.refillAvailable());
  }
  const reveal = button('Show me the answer', async () => {
    try {
    // Mark before revealing; later direct score posts and offline queuing are blocked for this daily.
    if (config.isDaily?.()) Z()?.markGuided?.(gameId(), false, date());
    const steps = await config.steps();
    list.replaceChildren(...steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    list.hidden = false;
    if (!actions.querySelector('[data-finish-guided]')) {
      const finish = button('Finish with help', () => {
        if (config.isDaily?.()) Z()?.markGuided?.(gameId(), true, date());
        close(); result();
        showLevelEnd({ outcome: 'win', title: 'Finished with help', symbol: '✦', praise: 'Here it is. Good luck with the next one: it is a fresh start.', note: 'Answer shown · your streak is safe · no points or leaderboard entry.', focus: () => resultCard?.querySelector('button'), actions: [journeyActive() ? continueAction() : { id: 'home', label: 'Choose another puzzle →', primary: true, run: () => { location.href = '/#today'; } }, { id: 'review', label: 'Review my puzzle', run: review }] });
      }); finish.dataset.finishGuided = ''; finish.className = 'primary-button'; finish.focus();
    }
  } catch { status.textContent = 'Could not show the answer. Your moves are safe. Try again, or go back to the games.'; }
  });
  if (config.canFinish && !config.canFinish()) { reveal.disabled = true; reveal.textContent = 'Make a move first to see the answer'; }
  button('Back to today’s games (progress saved)', () => { location.href = '/#today'; });
  if (!dialog.open) { resume = config.suspend?.(); dialog.showModal(); }
  if (worked) actions.querySelectorAll('button')[actions.querySelectorAll('button').length - 2].click();
  else if (lead === 'hint' && hintButton && !hintButton.disabled) hintButton.focus(); else dialog.querySelector('button').focus();
}
export function registerAssistance(options) {
  config = options;
  if(document.querySelector('.milestone-dialog[open]'))pauseMilestone();
  if (options.howto) coach = registerHowTo({ id: options.id, snapshot: options.howto, suspend: options.suspend, defer: options.deferDemo, help: options.demoHelp });
  const bar = document.querySelector('.game-bar'); if (!bar) return;
  if (!document.querySelector('[data-assist-open]')) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button assist-open'; button.dataset.assistOpen = ''; button.textContent = 'Help'; button.setAttribute('aria-label', 'Help: rules, demo, hints and the answer');
    button.onclick = () => open(); const drawerButton = bar.querySelector('[data-drawer-open]'); if (drawerButton) drawerButton.before(button); else bar.append(button);
  }
  if (config.isDaily?.() && (Z()?.profile().guidedDays[date()] || []).includes(gameId())) result();
  document.addEventListener('click', event => { if (event.target.closest('#mode-practice,#mode-daily,[data-difficulty],.theme-button,#play-next,#lock-next,#sum-next,#next-level,#mm-start')) review(); }, true);
  return { open: lead => open(false, typeof lead === 'string' ? lead : ''), beforeStart: () => coach?.beforeStart() };
}
