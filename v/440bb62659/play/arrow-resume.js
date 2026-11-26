// Arrow Escape: a half-played practice board survives leaving the page (2.31.1). The board is rebuilt from its level, so only the moves are saved.
// The Games menu opens ?resume=1: carry on with that board unless today's daily is already under way.
export const levelSnapshot = state => ({ mode: state.mode, level: state.level, remaining: state.remaining.map(p => p.id), history: state.history.map(p => p.id), lives: state.lives, hints: state.hints, elapsed: state.elapsed });
export const isPractice = mode => mode === 'levels' || mode === 'endless';
export function menuResume(saved, today, archive) {
  let menu = false;
  try { const url = new URL(location.href); menu = url.searchParams.get('resume') === '1'; if (menu) { url.searchParams.delete('resume'); window.history.replaceState(null, '', url); } } catch { /* Plain open. */ }
  const half = saved.activeLevel, daily = saved.activeDaily;
  const dailyUnderway = daily?.date === today && daily.history.length > 0 && !daily.ended && daily.remaining.length > 0;
  return menu && !archive && half?.remaining?.length && !dailyUnderway ? half : null;
}
