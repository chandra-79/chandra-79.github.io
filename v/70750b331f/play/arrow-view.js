const viewport = document.getElementById('board-viewport');
const canvas = document.getElementById('board-canvas');
const board = document.getElementById('board');
const layout = document.querySelector('.play-layout');
const maximize = document.getElementById('board-maximize');
const zoomIn = document.getElementById('board-zoom-in');
const zoomOut = document.getElementById('board-zoom-out');
const zoomFit = document.getElementById('board-zoom-fit');
const zoomLabel = document.getElementById('board-zoom-level');
let zoom = 1, boardSize = 0, viewWidth = 0, viewHeight = 0, maximized = false;
let backgroundStates = [];

function resizeBoard(center = true) {
  const previousLeft = Math.max(12, (viewWidth - boardSize) / 2);
  const x = boardSize ? (viewport.scrollLeft + viewWidth / 2 - previousLeft) / boardSize : .5;
  const y = boardSize ? (viewport.scrollTop + viewHeight / 2 - 12) / boardSize : .5;
  viewWidth = viewport.clientWidth;
  viewHeight = viewport.clientHeight;
  const available = Math.max(1, Math.min(viewWidth, viewHeight) - 24);
  boardSize = Math.round(available * zoom);
  canvas.style.width = `${boardSize}px`;
  canvas.style.height = `${boardSize}px`;
  const nextLeft = Math.max(12, (viewWidth - boardSize) / 2);
  viewport.scrollLeft = center ? Math.max(0, x * boardSize + nextLeft - viewWidth / 2) : 0;
  viewport.scrollTop = center ? Math.max(0, y * boardSize + 12 - viewHeight / 2) : 0;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  zoomIn.disabled = zoom >= MAX_ZOOM;
  zoomOut.disabled = zoom <= 1;
}

let MAX_ZOOM = 3;
function setZoom(value) {
  zoom = Math.min(MAX_ZOOM, Math.max(1, value));
  resizeBoard(zoom !== 1);
}

zoomIn.addEventListener('click', () => setZoom(zoom + .25));
zoomOut.addEventListener('click', () => setZoom(zoom - .25));
zoomFit.addEventListener('click', () => setZoom(1));

function setMaximized(value) {
  if (value === maximized || !document.getElementById('modal-root').hidden) return;
  maximized = value;
  if (value) {
    const shell = document.querySelector('.game-shell');
    const background = [...document.querySelectorAll('header, .collection-nav'),
      ...shell.children].filter(element => element !== layout);
    backgroundStates = background.map(element => [element, Boolean(element.inert)]);
    for (const [element] of backgroundStates) element.inert = true;
    const menu = document.querySelector('.collection-menu');
    if (menu) menu.open = false;
  } else {
    for (const [element, inert] of backgroundStates) element.inert = inert;
    backgroundStates = [];
  }
  document.body.classList.toggle('arrow-maximized', value);
  maximize.setAttribute('aria-pressed', String(value));
  maximize.innerHTML = value ? '<span aria-hidden="true">↙</span> Restore' : '<span aria-hidden="true">⛶</span> Maximize';
  maximize.setAttribute('aria-label', value ? 'Restore board size (Escape)' : 'Maximize arrow board');
  requestAnimationFrame(() => { resizeBoard(); maximize.focus({ preventScroll: true }); });
}
maximize.addEventListener('click', () => setMaximized(!maximized));

document.addEventListener('keydown', event => {
  if (!maximized || !document.getElementById('modal-root').hidden || event.isComposing) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopImmediatePropagation(); setMaximized(false);
  } else if (event.key === 'Tab') {
    const controls = [...layout.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')]
      .filter(control => control.getClientRects().length && !control.closest('[inert]'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !layout.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !layout.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
  }
}, true);

function revealArrow(arrow) {
  if (!arrow || zoom <= 1) return;
  const marker = arrow.querySelector('.arrow-head') || arrow;
  let bounds = marker.getBoundingClientRect();
  const label = arrow.querySelector('.arrow-label')?.getBoundingClientRect();
  if (label?.width && label.height) bounds = {
    left: Math.min(bounds.left, label.left), right: Math.max(bounds.right, label.right),
    top: Math.min(bounds.top, label.top), bottom: Math.max(bounds.bottom, label.bottom),
  };
  const frame = viewport.getBoundingClientRect();
  const left = frame.left + viewport.clientLeft + 12, top = frame.top + viewport.clientTop + 12;
  const right = left + viewport.clientWidth - 24, bottom = top + viewport.clientHeight - 24;
  if (bounds.left < left) viewport.scrollLeft += bounds.left - left;
  else if (bounds.right > right) viewport.scrollLeft += bounds.right - right;
  if (bounds.top < top) viewport.scrollTop += bounds.top - top;
  else if (bounds.bottom > bottom) viewport.scrollTop += bounds.bottom - bottom;
}

viewport.addEventListener('focusin', event => {
  revealArrow(event.target.closest('[data-id]'));
});

let previousSelection = null;
new MutationObserver(() => {
  fitNewBoard();
  const selected = board.querySelector('.arrow-group.selected');
  if (selected !== previousSelection) {
    previousSelection = selected;
    revealArrow(selected);
  }
}).observe(board, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-across'] });

let resizeQueued = false;
new ResizeObserver(() => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; resizeBoard(); });
}).observe(viewport);
let lastAcross = 0;
function fitNewBoard() {
  const across = Number(board.dataset?.across) || 0;
  if (!across || across === lastAcross) return;
  lastAcross = across;
  const available = Math.max(1, Math.min(viewport.clientWidth, viewport.clientHeight) - 24);
  MAX_ZOOM = Math.max(3, Math.min(8, (40 * across) / available));
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const start = Math.max(1, Math.min(MAX_ZOOM, ((coarse ? 14 : 18) * across) / available));
  if (start > 1) { setZoom(start); viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2; }
  else { zoom = 1; resizeBoard(false); }
}

resizeBoard(false);

const pinch = new Map();
let pinchStart = 0, pinchZoom = 1, pinchClick = false;
const spread = () => { const [a, b] = [...pinch.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
viewport.addEventListener('pointerdown', event => {
  if (!pinch.size) pinchClick = false;
  if (event.pointerType !== 'touch') return;
  pinch.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinch.size === 2) { pinchClick = true; pinchStart = spread(); pinchZoom = zoom; }
});
viewport.addEventListener('pointermove', event => {
  if (!pinch.has(event.pointerId)) return;
  pinch.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinch.size === 2 && pinchStart > 0) setZoom(Math.round((pinchZoom * spread() / pinchStart) * 20) / 20);
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) viewport.addEventListener(type, event => { pinch.delete(event.pointerId); if (pinch.size < 2) pinchStart = 0; });

viewport.addEventListener('click', event => { if (pinchClick && event.detail !== 0) { pinchClick = false; event.preventDefault(); event.stopImmediatePropagation(); } }, true);

let dragFrom = null, dragged = false;
viewport.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || zoom <= 1) return;
  dragFrom = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }; dragged = false;
});
document.addEventListener?.('pointermove', event => {
  if (!dragFrom || event.pointerType !== 'mouse') return;
  const dx = event.clientX - dragFrom.x, dy = event.clientY - dragFrom.y;
  if (!dragged && Math.hypot(dx, dy) < 6) return;
  dragged = true; viewport.classList.add('panning');
  viewport.scrollLeft = dragFrom.left - dx; viewport.scrollTop = dragFrom.top - dy;
});
document.addEventListener?.('pointerup', () => { dragFrom = null; viewport.classList.remove('panning'); });
viewport.addEventListener('click', event => { if (dragged) { event.stopPropagation(); event.preventDefault(); dragged = false; } }, true);
