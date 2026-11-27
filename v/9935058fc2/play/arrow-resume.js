export const levelSnapshot = state => ({ mode: state.mode, level: state.level, remaining: state.remaining.map(p => p.id), history: state.history.map(p => p.id), lives: state.lives, hints: state.hints, elapsed: state.elapsed });
export const isPractice = mode => mode === 'levels' || mode === 'endless';
export function menuResume() {
  let menu = false;
  try { const url = new URL(location.href); menu = url.searchParams.get('resume') === '1'; if (menu) { url.searchParams.delete('resume'); window.history.replaceState(null, '', url); } } catch { /* Plain open. */ }
  return menu;
}
export function practiceStart(saved, levels = 12) {
  const half = saved.activeLevel;
  if (half?.remaining?.length) return { level: half.level, mode: half.mode, resume: true };
  const done = new Set(saved.completed || []);
  for (let level = 0; level < levels; level++) if (!done.has(level)) return { level, mode: 'levels', resume: false };
  return { level: levels + (saved.endless || 0), mode: 'endless', resume: false };
}
