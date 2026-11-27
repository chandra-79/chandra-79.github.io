import { registerAssistance } from './play-assist.js';
import { solvePieces } from './engine.js';
import { demoPreferences, saveDemoPreferences } from './howto-store.js';
// The reminder sign-up is only needed when someone opens it, so it loads then.
// So are the backup controls, which only the Style window shows.
export const withBackup = run => import('./backup.js').then(run).catch(() => {});
export const subscribeToDaily = (...args) => import('./reminders.js').then(m => m.subscribeToDaily(...args));

export function attachArrowHelp({state, $, updateHud, saveSession, date, isNew, learn}) {
// 2.77: a first-time player learns on three tiny boards instead of reading the step-by-step window (Help still has it).
try { const prefs = demoPreferences(); if (isNew?.() && prefs.automatic && !prefs.seen.includes('arrows')) import('./arrow-extras.js').then(m => { if (!isNew()) return; saveDemoPreferences({ seen: ['arrows', 'arrows-zoom'] }); learn(m.LEARN); }).catch(() => {}); } catch {}
const guide = $('piece-guide');
// Keep the first explanation readable, then give the controls back as soon as play resumes.
const leaveGuide = event => { if (guide.open && !guide.contains(event.target)) guide.open = false; };
document.addEventListener('focusin', leaveGuide);
document.addEventListener('pointerdown', leaveGuide, true);
guide.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !guide.open) return;
  event.preventDefault(); event.stopPropagation(); guide.open = false;
  guide.querySelector('summary')?.focus({preventScroll: true});
});
return registerAssistance({ id: 'arrows', demoHelp: 'help-dialog',
  howto: () => ({ key: String(state.generation), ready: Boolean(state.board), fresh: !state.ended && !state.history.length && state.mode !== 'tour' && state.mode !== 'learn', rules: ['arrows-zoom', state.board?.gates?.length && 'arrows-gates', state.board?.paths.some(p => p.lock !== undefined || p.key !== undefined) && 'arrows-locks', state.board?.paths.some(p => p.link !== undefined) && 'arrows-links'].filter(Boolean) }), date, isDaily: () => state.mode === 'daily' || (state.mode === 'climb' && state.climb?.daily), canFinish: () => Boolean(state.board), canHint: () => !state.ended && state.hints > 0, hint: () => $('hint-button').click(),
  refillAvailable: () => !state.ended && state.hints === 0,
  refill: () => { state.hints = 3; updateHud(); saveSession(); },
  suspend: () => { const was = state.paused; state.paused = true; return () => { state.paused = was; }; },
  steps: () => {
    const order = solvePieces(state.board); if (!order) throw Error('This board needs a fresh attempt. Your moves are saved.');
    const remaining = new Set(state.remaining.map(path => path.id));
    return order.filter(id => remaining.has(id)).map(id => {
      const path = state.board.paths.find(path => path.id === id), cell = path.cells[0];
      return `Clear arrow ${state.identifiers.get(id) || id}: its tail starts at row ${cell[1]+1}, column ${cell[0]+1}. Follow its arrowhead out; linked partners leave together.`;
    });
  } });
}
