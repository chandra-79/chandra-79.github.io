// The virtual cube on screen: CSS 3D stickers, turned by drag, keys or buttons; or a flat net.
import { clone, turn, parseMove, tokens, dragTurn, moveName, faceGrid } from './cube-engine.js';
import { COLORS, COLOR_NAMES, netDiagram } from './cube-cases.js';
import { play as playSound, haptic } from './fx.js';

const ORIENT = n => (n[0] === 1 ? 'rotateY(90deg)' : n[0] === -1 ? 'rotateY(-90deg)' : n[1] === 1 ? 'rotateX(90deg)' : n[1] === -1 ? 'rotateX(-90deg)' : n[2] === -1 ? 'rotateY(180deg)' : '');
const FACE_KEYS = { u: 'U', d: 'D', r: 'R', l: 'L', f: 'F', b: 'B', m: 'M', e: 'E', s: 'S', x: 'x', y: 'y', z: 'z' };

/**
 * mount(el, {size, onMove, label}) → view. view.set(cube), view.cube, view.play(token) (animated), view.setView('3d'|'net'),
 * view.setLetters(bool), view.reset camera.
 */
export function mountCube(host, { onMove = () => {}, label = 'Virtual cube' } = {}) {
  let cube = null, mode = '3d', letters = false, busy = Promise.resolve(), rx = -28, ry = -36;
  const wrap = document.createElement('div');
  wrap.className = 'cube-wrap';
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'application');
  wrap.setAttribute('aria-roledescription', 'virtual cube');
  const scene = document.createElement('div'); scene.className = 'cube-scene';
  const body = document.createElement('div'); body.className = 'cube-body';
  scene.append(body);
  const net = document.createElement('div'); net.className = 'cube-net'; net.hidden = true;
  const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  const said = document.createElement('p'); said.className = 'sr-only'; said.id = `cube-desc-${Math.random().toString(36).slice(2, 8)}`;
  wrap.setAttribute('aria-describedby', said.id);
  wrap.append(scene, net, live, said);
  host.replaceChildren(wrap);
  // 2.59: the cube is a fixed size, so a short stage (phones, landscape) cut its top and bottom off. Shrink it to fit.
  const fitScene = () => { const h = wrap.clientHeight; if (h) scene.style.scale = String(Math.min(1, Math.round(h / 2.8) / 100)); };
  if (globalThis.ResizeObserver) new ResizeObserver(fitScene).observe(wrap); fitScene();
  let els = [];
  const calm = () => globalThis.Ziggle?.calm?.() ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const camera = () => { body.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };

  function describe() {
    const faces = ['U', 'F', 'R', 'B', 'L', 'D'].map(f => `${{ U: 'Top', F: 'Front', R: 'Right', B: 'Back', L: 'Left', D: 'Bottom' }[f]}: ${faceGrid(cube, f).map(r => r.map(c => COLOR_NAMES[c]).join(' ')).join(', ')}`);
    wrap.setAttribute('aria-label', `${label}, ${cube.n} by ${cube.n}. Type U D L R F B to turn a face (Shift for anticlockwise), M E S for slices, X Y Z to turn the whole cube.`);
    said.textContent = faces.join('. ');
  }
  function build() {
    const n = cube.n, unit = Math.round(84 / n), gap = unit * 0.06;
    wrap.style.setProperty('--cube-size', `${unit * n * 2}px`);
    body.replaceChildren();
    els = cube.stickers.map((s, index) => {
      const el = document.createElement('div');
      el.className = 'sticker';
      el.dataset.index = String(index);
      el.style.width = el.style.height = `${unit * 2 - gap * 2}px`;
      el.style.margin = `${-(unit - gap)}px`;
      body.append(el);
      return el;
    });
    paint();
  }
  function placement(s, n, unit) {
    const c = s.pos.map((v, i) => (v + s.normal[i]) * unit);
    return `translate3d(${c[0]}px, ${-c[1]}px, ${c[2]}px) ${ORIENT(s.normal)}`;
  }
  function paint(extra = null) {
    const n = cube.n, unit = Math.round(84 / n);
    cube.stickers.forEach((s, i) => {
      const el = els[i];
      el.style.background = COLORS[s.color];
      el.textContent = letters ? s.color : '';
      el.style.transition = 'none';
      el.style.transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg) ${placement(s, n, unit)}`;
    });
    net.innerHTML = netDiagram(cube, { letters });
    describe();
  }
  /** Turn with a short animation (instant with Calmer motion). */
  function animateTurn(move) {
    return new Promise(resolve => {
      if (mode !== '3d' || calm()) { turn(cube, move.axis, move.layers, move.quarter); paint(); resolve(); return; }
      const k = 'xyz'.indexOf(move.axis), set = new Set(move.layers), n = cube.n, unit = Math.round(84 / n);
      const moving = cube.stickers.map((s, i) => (set.has(s.pos[k]) ? i : -1)).filter(i => i >= 0);
      const angle = { x: -move.quarter * 90, y: move.quarter * 90, z: -move.quarter * 90 }[move.axis];
      const duration = Math.abs(move.quarter) === 2 ? 200 : 140;
      requestAnimationFrame(() => {
        for (const i of moving) {
          const el = els[i], s = cube.stickers[i];
          el.style.transition = `transform ${duration}ms ease-out`;
          const r = { x: `rotateX(${angle}deg) rotateY(0deg) rotateZ(0deg)`, y: `rotateX(0deg) rotateY(${angle}deg) rotateZ(0deg)`, z: `rotateX(0deg) rotateY(0deg) rotateZ(${angle}deg)` }[move.axis];
          el.style.transform = `${r} ${placement(s, n, unit)}`;
        }
        setTimeout(() => { turn(cube, move.axis, move.layers, move.quarter); paint(); resolve(); }, duration + 10);
      });
    });
  }
  /** Do one move (token or move object) and tell the page. */
  function play(move, { silent = false } = {}) {
    const m = typeof move === 'string' ? parseMove(move, cube.n) : move;
    if (!m) return busy;
    busy = busy.then(() => { if (!silent) { playSound('turn'); haptic(5); } return animateTurn(m); }).then(() => { const name = typeof move === 'string' ? move : moveName(cube.n, m) || 'turn'; if (!silent) { live.textContent = name; onMove(name, m); } });
    return busy;
  }
  function playAll(text, options) { for (const token of tokens(text)) play(token, options); return busy; }

  // ---- Drag: on a sticker it turns a layer; anywhere else it spins the view -------------------------
  let drag = null;
  const project = v => {
    // Apply the camera (rotateY then rotateX, CSS order) to a direction in cube coordinates; return screen x, y.
    const toRad = d => (d * Math.PI) / 180;
    let [x, y, z] = [v[0], -v[1], v[2]];
    const a = toRad(ry); [x, z] = [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
    const b = toRad(rx); [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
    return [x, y];
  };
  wrap.addEventListener('pointerdown', event => {
    if (mode !== '3d') return;
    const el = event.target.closest('.sticker');
    drag = { x: event.clientX, y: event.clientY, sticker: el ? cube.stickers[Number(el.dataset.index)] : null, done: false, rx, ry };
    wrap.setPointerCapture?.(event.pointerId);
  });
  wrap.addEventListener('pointermove', event => {
    if (!drag || drag.done) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.sticker) { ry = drag.ry + dx * 0.5; rx = Math.max(-80, Math.min(80, drag.rx - dy * 0.5)); camera(); return; }
    if (Math.hypot(dx, dy) < 14) return;
    drag.done = true;
    const s = drag.sticker, k = s.normal.findIndex(v => v !== 0);
    const options = [0, 1, 2].filter(i => i !== k).flatMap(i => [1, -1].map(sign => { const v = [0, 0, 0]; v[i] = sign; return v; }));
    let bestAxis = null, bestScore = -Infinity;
    for (const v of options) { const [sx, sy] = project(v); const len = Math.hypot(sx, sy) || 1; const score = (sx * dx + sy * dy) / len; if (score > bestScore) { bestScore = score; bestAxis = v; } }
    const move = dragTurn(cube.n, s, bestAxis);
    if (move) play(move);
  });
  const end = () => { drag = null; };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const face = FACE_KEYS[event.key.toLowerCase()];
    if (face) { event.preventDefault(); play(face + (event.shiftKey ? "'" : '')); return; }
    if (event.key === 'ArrowLeft') { ry -= 15; camera(); event.preventDefault(); }
    if (event.key === 'ArrowRight') { ry += 15; camera(); event.preventDefault(); }
    if (event.key === 'ArrowUp') { rx = Math.max(-80, rx - 15); camera(); event.preventDefault(); }
    if (event.key === 'ArrowDown') { rx = Math.min(80, rx + 15); camera(); event.preventDefault(); }
  });

  /** Swing the camera (whole-cube spin): used for the welcome spin and to celebrate a solve. */
  function swing({ turns = 1, tilt = 0, duration = 1100, bounce = false } = {}) {
    if (calm() || mode !== '3d') return Promise.resolve();
    const fromY = ry, fromX = rx, start = performance.now();
    return new Promise(resolve => {
      const frame = now => {
        const t = Math.min(1, (now - start) / duration), e = 1 - Math.pow(1 - t, 3);
        ry = fromY + 360 * turns * e; rx = fromX + tilt * Math.sin(t * Math.PI);
        body.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)${bounce ? ` scale(${1 + 0.12 * Math.sin(t * Math.PI)})` : ''}`;
        if (t < 1) requestAnimationFrame(frame); else { ry = fromY + 360 * turns; ry %= 360; camera(); resolve(); }
      };
      requestAnimationFrame(frame);
    });
  }
  camera();
  return {
    swing,
    intro() { if (calm()) return; ry -= 200; rx = -60; camera(); const target = { y: ry + 200 }; const start = performance.now(), fromX = rx, fromY = ry;
      const frame = now => { const t = Math.min(1, (now - start) / 1300), e = 1 - Math.pow(1 - t, 4); ry = fromY + 200 * e; rx = fromX + (-28 - fromX) * e; camera(); if (t < 1) requestAnimationFrame(frame); else { ry = target.y; camera(); } };
      requestAnimationFrame(frame); },
    celebrate() { return swing({ turns: 1, tilt: 25, duration: 1400, bounce: true }); },
    get cube() { return cube; },
    get busy() { return busy; },
    set(next) { const rebuild = !cube || cube.n !== next.n; cube = clone(next); if (rebuild) build(); else paint(); },
    play, playAll,
    setView(next) { mode = next; scene.hidden = mode !== '3d'; net.hidden = mode === '3d'; },
    setLetters(value) { letters = value; paint(); },
    resetCamera() { rx = -28; ry = -36; camera(); },
    focus() { wrap.focus({ preventScroll: true }); },
  };
}
