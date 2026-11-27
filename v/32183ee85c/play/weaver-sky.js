// Word Cloud sky: every clue is its own cloud. Shapes are drawn from a seed, so a weave's clouds look the
// same every time it is opened, and differ from cloud to cloud and day to day. No images, just SVG paths.

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6d2b79f5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const round = n => Math.round(n * 100) / 100;

/**
 * A puffy cloud outline: points around an ellipse joined by outward arcs; round puffs on top, a flatter base.
 * Returns the path and a viewBox that fits it (draw with preserveAspectRatio="none" to fill any box).
 */
export function cloudShape(seed, aspect = 1.9) {
  const random = seeded(seed);
  const count = Math.max(7, Math.min(13, Math.round(4 + aspect * 2.4 + random() * 2)));
  const start = Math.PI * (0.92 + random() * 0.16);
  const points = Array.from({ length: count }, (_, i) => {
    const angle = start + (i * 2 * Math.PI) / count + (random() - 0.5) * (Math.PI / count) * 0.7;
    const squash = Math.sin(angle) > 0 ? 0.82 : 1; // the base sits a little flatter
    return [aspect * Math.cos(angle), Math.sin(angle) * squash];
  });
  let d = `M${round(points[0][0])},${round(points[0][1])}`;
  const extent = [...points];
  for (let i = 0; i < count; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % count];
    const chord = Math.hypot(x2 - x1, y2 - y1);
    const base = (y1 + y2) / 2 > 0.35;
    const k = base ? 2.4 + random() * 0.8 : 1.0 + random() * 0.22;
    const r = (chord / 2) * k, sag = r - Math.sqrt(Math.max(0, r * r - (chord / 2) ** 2));
    // Outward is to the left of travel (clockwise on screen); remember the bulge for the viewBox.
    extent.push([(x1 + x2) / 2 + ((y2 - y1) / chord) * sag, (y1 + y2) / 2 - ((x2 - x1) / chord) * sag]);
    d += ` A${round(r)},${round(r)} 0 0 1 ${round(x2)},${round(y2)}`;
  }
  const xs = extent.map(p => p[0]), ys = extent.map(p => p[1]);
  const pad = 0.04, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
  const width = Math.max(...xs) - minX + pad, height = Math.max(...ys) - minY + pad;
  return { d: `${d} Z`, viewBox: `${round(minX)} ${round(minY)} ${round(width)} ${round(height)}` };
}

/** How one clue cloud looks and floats: size, offset in its spot, drift and timing. Same every time for a clue. */
export function cloudLook(weaveId, index) {
  const random = seeded((weaveId + 1) * 7919 + index * 104729);
  const size = ['s', 'm', 'l'][Math.floor(random() * 3)];
  return {
    size,
    shape: cloudShape(Math.floor(random() * 2 ** 31), size === 'l' ? 2.3 : size === 'm' ? 2 : 1.7),
    offsetX: Math.round((random() - 0.5) * 36), offsetY: Math.round((random() - 0.5) * 26),
    driftX: Math.round((random() - 0.5) * 12), driftY: -Math.round(3 + random() * 6),
    duration: Math.round((5.5 + random() * 4) * 10) / 10, delay: -Math.round(random() * 80) / 10,
  };
}
/** The big cloud that holds the hidden word. */
export const wordCloudShape = weaveId => cloudShape((weaveId + 3) * 31337, 2.7);
