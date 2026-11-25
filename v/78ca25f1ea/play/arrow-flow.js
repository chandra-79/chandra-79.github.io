import { registerAssistance } from './play-assist.js';
import { solvePieces } from './engine.js';

export function attachArrowHelp({state, $, updateHud, saveSession, date}) {
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
  howto: () => ({ key: String(state.generation), ready: Boolean(state.board), fresh: !state.ended && !state.history.length && state.mode !== 'tour', rules: ['arrows-zoom', state.board?.gates?.length && 'arrows-gates', state.board?.paths.some(p => p.lock !== undefined || p.key !== undefined) && 'arrows-locks', state.board?.paths.some(p => p.link !== undefined) && 'arrows-links'].filter(Boolean) }), date, isDaily: () => state.mode === 'daily' || (state.mode === 'climb' && state.climb?.daily), canFinish: () => Boolean(state.board), canHint: () => !state.ended && state.hints > 0 && !state.busy, hint: () => $('hint-button').click(),
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
