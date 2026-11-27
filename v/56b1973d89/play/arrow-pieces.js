// Arrow escape pieces (2.9): gates, locks and keys, linked pairs. How they are drawn on the board, named for
// screen readers and explained in words. The rules themselves live in engine.js (canLeave, addPieces).
// ctx = { board, remaining, identifiers, palette }.
export const COLOUR_NAMES = Object.freeze(['purple', 'orange', 'green', 'blue', 'pink', 'gold', 'indigo']);
// Gates are named and marked with a shape as well as a colour, so colour is never the only clue.
export const COLOUR_MARKS = Object.freeze(['●', '▲', '■', '◆', '★', '✚', '⬟']);

const here = (ctx, id) => ctx.remaining.some(path => path.id === id);
const gatesOf = ctx => ctx.board.gates || [];

/** The pieces on a board, explained. Shown in How to play. Empty for a plain board. */
export function piecesHelp(board) {
  const has = { gates: (board.gates || []).length > 0, locks: board.paths.some(p => p.lock !== undefined), links: board.paths.some(p => p.link !== undefined) };
  if (!has.gates && !has.locks && !has.links) return '';
  return `<div class="pieces-help"><h3>On this board</h3><ul>${has.gates ? '<li><span class="piece-icon gate-icon" aria-hidden="true">◆</span><p><strong>Gates</strong> sit beyond the picture, in one colour with a shape. An arrow can’t pass a gate until every other arrow of that colour has left. The number shows how many are still to go; matching arrows carry the same shape on their tail.</p></li>' : ''}${has.locks ? '<li><span class="piece-icon lock-icon" aria-hidden="true">1</span><p><strong>Locks and keys.</strong> A dark numbered badge is a lock: that arrow can’t move until the key arrow with the same number (yellow badge) has left.</p></li>' : ''}${has.links ? '<li><span class="piece-icon link-icon" aria-hidden="true">◌</span><p><strong>Linked pairs</strong> wear dotted rings joined by a dashed line. They leave together, so both paths must be clear at once. Tap either one.</p></li>' : ''}</ul><p class="muted">A tap that a gate, lock or link refuses costs a heart, like any blocked arrow, and the message says what is in the way.</p></div>`;
}

/** Plain words for why an arrow can't leave. */
export function whyBlocked(ctx, path, check) {
  const name = id => ctx.identifiers.get(id);
  if (check.reason === 'locked') return `Locked. Free its key arrow ${name(check.by)} first (both marked ${path.lockNumber}).`;
  if (check.reason === 'gate') {
    const gate = gatesOf(ctx)[check.by], left = ctx.remaining.filter(p => p.color === gate.color && p.id !== path.id).length, colour = COLOUR_NAMES[gate.color];
    return `The ${colour} ${COLOUR_MARKS[gate.color]} gate is shut: ${left} ${colour} ${left === 1 ? 'arrow' : 'arrows'} still to go.`;
  }
  if (check.reason === 'partner') return `${name(path.id)} is linked to ${name(check.by)}, and ${name(check.by)} can’t leave yet. Linked arrows go together.`;
  return 'That path is blocked. Free the arrow in front first.';
}

/** Extra words for an arrow's accessible name. */
export function pieceWords(ctx, path) {
  const bits = [];
  if (path.lock !== undefined && here(ctx, path.lock)) bits.push(`locked, key ${ctx.identifiers.get(path.lock)}`);
  if (path.key !== undefined && here(ctx, path.key)) bits.push(`key for ${ctx.identifiers.get(path.key)}`);
  if (path.link !== undefined && here(ctx, path.link)) bits.push(`linked with ${ctx.identifiers.get(path.link)}`);
  if (gatesOf(ctx).some(g => g.color === path.color)) bits.push(COLOUR_NAMES[path.color]);
  return bits.length ? `, ${bits.join(', ')}` : '';
}

/** Marks on an arrow's tail: its gate colour's shape, a lock or a key with its number, a link ring. */
export function pieceBadges(ctx, path, points, step) {
  const [tx, ty] = points[0], r = Math.max(6.5, step * 0.42), out = [];
  const locked = path.lock !== undefined && here(ctx, path.lock);
  const marked = gatesOf(ctx).some(g => g.color === path.color);
  const disc = (x, cls, number) => `<g class="badge ${cls}"><circle cx="${x}" cy="${ty}" r="${r}"/><text x="${x}" y="${ty + r * 0.38}" font-size="${r * 1.05}">${number}</text></g>`;
  if (marked) out.push(`<text class="colour-mark" x="${tx}" y="${ty + r * 0.38}" font-size="${r * 1.1}">${COLOUR_MARKS[path.color]}</text>`);
  if (locked) out.push(disc(marked ? tx + r * 1.6 : tx, 'lock-badge', path.lockNumber));
  if (path.key !== undefined && here(ctx, path.key)) out.push(`<g class="badge key-badge"><rect x="${tx - r}" y="${ty - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.45}"/><text x="${tx}" y="${ty + r * 0.38}" font-size="${r * 1.05}">${path.lockNumber}</text></g>`);
  if (path.link !== undefined && here(ctx, path.link)) out.push(`<circle class="link-ring" cx="${tx}" cy="${ty}" r="${r * 1.25}"/>`);
  return out.join('');
}

/** Gates (beyond the picture) and the dashed ties between linked arrows, as SVG. */
export function piecesSvg(ctx, { offset, step, geometry }) {
  const at = ([x, y]) => [offset + x * step, offset + y * step];
  const gates = (ctx.remaining.length ? gatesOf(ctx) : []).map((g, i) => {
    const [cx, cy] = at(g.cell), left = ctx.remaining.filter(p => p.color === g.color).length, r = Math.max(8, step * 0.58), name = COLOUR_NAMES[g.color];
    return `<g class="gate${left ? '' : ' open'}" data-gate="${i}" style="color:${ctx.palette[g.color][0]}" role="img" aria-label="${name} gate, ${left ? `shut until ${left} ${name} ${left === 1 ? 'arrow leaves' : 'arrows leave'}` : 'open'}"><title>${name} gate: ${left ? `shut until the ${name} ${COLOUR_MARKS[g.color]} arrows have left (${left} to go)` : 'open'}</title><rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(2 * r).toFixed(1)}" height="${(2 * r).toFixed(1)}" rx="${(r * 0.35).toFixed(1)}"/><text x="${cx.toFixed(1)}" y="${(cy + r * 0.36).toFixed(1)}" font-size="${(r * 1.05).toFixed(1)}">${left ? COLOUR_MARKS[g.color] : '✓'}</text>${left ? `<text class="gate-count" x="${(cx + r).toFixed(1)}" y="${(cy - r + 2).toFixed(1)}" font-size="${(r * 0.8).toFixed(1)}">${left}</text>` : ''}</g>`;
  }).join('');
  const ties = ctx.remaining.filter(p => p.link !== undefined && p.id < p.link && here(ctx, p.link)).map(p => {
    const a = geometry(p)[0], b = geometry(ctx.remaining.find(x => x.id === p.link))[0];
    return `<path class="link-tie" d="M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}"/>`;
  }).join('');
  return { gates, ties };
}

/** Gates that open once these arrows are gone (no other arrows of their colour left). */
export function gatesOpenedBy(ctx, leaving) {
  const ids = new Set(leaving.map(p => p.id));
  return gatesOf(ctx).filter(g => ctx.remaining.some(p => ids.has(p.id) && p.color === g.color) && !ctx.remaining.some(p => !ids.has(p.id) && p.color === g.color));
}

/** A refused move that isn't an arrow in the way: the arrow shakes and what stopped it lights up. */
export function refuse(ctx, board, path, group, check) {
  group.classList.add('blocked'); setTimeout(() => group.classList.remove('blocked'), 520);
  const flash = el => { if (!el) return; el.classList.remove('flash'); void el.getBoundingClientRect(); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); };
  if (check.reason === 'gate') {
    flash(board.querySelector(`[data-gate="${check.by}"]`));
    const gate = gatesOf(ctx)[check.by];
    for (const other of ctx.remaining) if (other.color === gate.color && other.id !== path.id) flash(board.querySelector(`[data-id="${other.id}"]`));
  } else flash(board.querySelector(`[data-id="${check.by}"]`));
}

/**
 * The board's frame (2.9–2.10): the view is cropped to the picture (arrows and gates) so arrows fill the board,
 * and the axis letters follow the crop. Big boards label every 2nd or 5th row and column (A–Z, then AA…).
 * Returns { viewBox, axes (SVG), across (cells across the view) }.
 */
export function boardFrame(board, { offset, step, coordinates, labels, columnName }) {
  const cells = [...board.paths.flatMap(p => p.cells), ...(board.gates || []).map(g => g.cell)];
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), pad = step * 1.2 + (coordinates ? 18 : 6);
  const box = { x0: offset + Math.min(...xs) * step - pad, y0: offset + Math.min(...ys) * step - pad - (labels ? 10 : 0), x1: offset + Math.max(...xs) * step + pad, y1: offset + Math.max(...ys) * step + pad };
  const side = Math.max(box.x1 - box.x0, box.y1 - box.y0), cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
  const across = side / step, every = across > 44 ? 5 : across > 26 ? 2 : 1, size = Math.max(5, Math.min(11, step * 0.8)).toFixed(1);
  const axes = coordinates ? [
    ...[...new Set(xs)].filter(i => i % every === 0).map(i => `<text class="board-axis" x="${offset + i * step}" y="${(box.y1 - 6).toFixed(1)}" font-size="${size}">${columnName(i)}</text>`),
    ...[...new Set(ys)].filter(i => (board.size - i) % every === 0).map(i => `<text class="board-axis" x="${(box.x0 + 8).toFixed(1)}" y="${offset + i * step + 4}" font-size="${size}">${board.size - i}</text>`),
  ].join('') : '';
  return { viewBox: `${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`, axes, across: Math.round(across) };
}

/** The words in Arrow escape's How to play popup (moved here in 2.11 to keep main.js under budget). */
export const helpBody = board => `<span class="eyebrow">FOLLOW THE ARROWS</span><h2 id="modal-title">Find the way out.</h2><div class="instructions"><div class="instruction"><span>1</span><p><strong>Look ahead.</strong> An arrow can escape when nothing is in front of its pointed end.</p></div><div class="instruction"><span>2</span><p><strong>Choose your controls.</strong> Click or tap an arrow, or type its number in Select arrow. Typing highlights the whole path; Enter fires it.</p></div><div class="instruction"><span>3</span><p><strong>Keep your hearts.</strong> A blocked arrow costs one life. Selecting or typing alone never costs a heart.</p></div></div>${piecesHelp(board)}<p class="keyboard-instructions"><strong>Play entirely by keyboard</strong><br>Press <kbd>/</kbd> to enter a number. Or Tab onto the board, move between arrows with <kbd>↑ ↓ ← →</kbd>, and fire with <kbd>Enter</kbd> or <kbd>Space</kbd>. <kbd>Esc</kbd> cancels a selection and <kbd>P</kbd> pauses. Tab also reaches Hint, Undo, and every other control.</p><p>Each arrow has a number that stays fixed when arrows leave or return with Undo. Numbers don’t reveal which arrow is clear.</p><p>Need a nudge? A hint lights up a clear arrow. You have three hints in each puzzle.</p>`;

/** The line under each board, by its picture (moved here from main.js in 2.11.1 for size). */
export const SHAPE_LABELS = Object.freeze({heart:'A LITTLE HEART, A CLEAR MIND',diamond:'A NEW ANGLE ON A LITTLE ESCAPE',crown:'ONE CLEAR PATH TO YOUR CROWN',cat:'LET CURIOSITY LEAD THE WAY',tower:'WORLD TOUR · INSPIRED BY PARIS',pagoda:'WORLD TOUR · INSPIRED BY KYOTO',pyramid:'WORLD TOUR · INSPIRED BY CAIRO',skyline:'WORLD TOUR · INSPIRED BY NEW YORK',sails:'WORLD TOUR · INSPIRED BY SYDNEY',clocktower:'WORLD TOUR · INSPIRED BY LONDON'});
