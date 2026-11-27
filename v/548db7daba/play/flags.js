// Ziggle's own flag renderer. Each flag is a small list of drawing steps (bands, rectangles, polygons,
// discs, stars, crosses), drawn as SVG. No flag artwork is copied from anywhere; designs follow each
// flag's official geometry closely enough to learn. Since 2.3 a few flags with emblems are included too,
// their emblems drawn simply in Ziggle's own shapes and marked `simplified` so the trainer says so.

const HEX = /^#[0-9a-f]{6}$/i;
const fmt = n => Math.round(n * 100) / 100;

/** Points of a star: `points` tips, outer radius r, inner radius r × inner, first tip at `rotate` degrees (0 = up). */
export function starPoints(cx, cy, r, points = 5, rotate = 0, inner = 0.382) {
  const out = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 ? r * inner : r;
    const angle = (rotate - 90 + (i * 180) / points) * Math.PI / 180;
    out.push(`${fmt(cx + radius * Math.cos(angle))},${fmt(cy + radius * Math.sin(angle))}`);
  }
  return out.join(' ');
}

/** Render one flag spec to an SVG string. Unit coordinates: x and y run 0–1 across the flag; radii are in flag heights. */
export function flagSvg(flag, { title = '' } = {}) {
  const [rw, rh] = flag.ratio || [3, 2];
  const H = 60, W = Math.round((60 * rw) / rh);
  const X = x => fmt(x * W), Y = y => fmt(y * H), R = r => fmt(r * H);
  const parts = [];
  for (const step of flag.draw) {
    const [kind, ...a] = step;
    if (kind === 'h' || kind === 'v') {
      const [colors, weights = colors.map(() => 1)] = a;
      const total = weights.reduce((s, w) => s + w, 0);
      let at = 0;
      colors.forEach((color, i) => {
        const size = weights[i] / total;
        parts.push(kind === 'h' ? `<rect x="0" y="${Y(at)}" width="${W}" height="${Y(size) + 0.3}" fill="${color}"/>` : `<rect x="${X(at)}" y="0" width="${X(size) + 0.3}" height="${H}" fill="${color}"/>`);
        at += size;
      });
    } else if (kind === 'rect') {
      const [x, y, w, h, color] = a;
      parts.push(`<rect x="${X(x)}" y="${Y(y)}" width="${X(w)}" height="${Y(h)}" fill="${color}"/>`);
    } else if (kind === 'poly') {
      const [points, color] = a;
      parts.push(`<polygon points="${points.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="${color}"/>`);
    } else if (kind === 'disc') {
      const [cx, cy, r, color] = a;
      parts.push(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${R(r)}" fill="${color}"/>`);
    } else if (kind === 'ring') {
      const [cx, cy, r, width, color, spokes = 0] = a;
      parts.push(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${R(r)}" fill="none" stroke="${color}" stroke-width="${R(width)}"/>`);
      for (let i = 0; i < spokes; i++) {
        const angle = (i * 360 / spokes) * Math.PI / 180;
        parts.push(`<line x1="${X(cx)}" y1="${Y(cy)}" x2="${fmt(X(cx) + R(r) * Math.cos(angle))}" y2="${fmt(Y(cy) + R(r) * Math.sin(angle))}" stroke="${color}" stroke-width="${R(width / 2)}"/>`);
      }
      parts.push(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${R(width * 1.4)}" fill="${color}"/>`);
    } else if (kind === 'star') {
      const [cx, cy, r, color, points = 5, rotate = 0, inner] = a;
      parts.push(`<polygon points="${starPoints(X(cx), Y(cy), R(r), points, rotate, inner)}" fill="${color}"/>`);
    } else if (kind === 'crescent') {
      // A disc with a second, offset disc of the background colour over it.
      const [cx, cy, r, dx, r2, color, background] = a;
      parts.push(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${R(r)}" fill="${color}"/><circle cx="${fmt(X(cx) + R(dx))}" cy="${Y(cy)}" r="${R(r2)}" fill="${background}"/>`);
    } else if (kind === 'cross') {
      // A cross centred at x (fraction of width) and y (fraction of height), bars t flag-heights thick.
      const [x, y, t, color] = a;
      parts.push(`<rect x="${fmt(X(x) - R(t) / 2)}" y="0" width="${R(t)}" height="${H}" fill="${color}"/><rect x="0" y="${fmt(Y(y) - R(t) / 2)}" width="${W}" height="${R(t)}" fill="${color}"/>`);
    } else if (kind === 'saltire') {
      const [t, color] = a;
      parts.push(`<path d="M0,0L${W},${H}M${W},0L0,${H}" stroke="${color}" stroke-width="${R(t)}"/>`);
    } else if (kind === 'stars-grid') {
      // The 50 stars of the US canton: rows alternate six and five stars.
      const [x0, y0, w, h, rows, r, color] = a;
      for (let row = 0; row < rows; row++) {
        const even = row % 2 === 0, count = even ? 6 : 5;
        for (let i = 0; i < count; i++) {
          const cx = x0 + (w * (even ? 2 * i + 1 : 2 * i + 2)) / 12, cy = y0 + (h * (row + 1)) / (rows + 1);
          parts.push(`<polygon points="${starPoints(X(cx), Y(cy), R(r))}" fill="${color}"/>`);
        }
      }
    } else if (kind === 'shape') {
      // An emblem drawn by Ziggle in a 100×100 box placed at [x, y, w, h] (fractions of the flag), optionally
      // turned by `rotate` degrees about its centre, filled or (with `stroke`, in flag heights) outlined.
      const [[x, y, w, h], d, color, { rotate = 0, stroke = 0 } = {}] = a;
      const sx = fmt((w * W) / 100), sy = fmt((h * H) / 100), cx = fmt(X(x) + (w * W) / 2), cy = fmt(Y(y) + (h * H) / 2);
      const paint = stroke ? `fill="none" stroke="${color}" stroke-width="${R(stroke)}" stroke-linejoin="round" vector-effect="non-scaling-stroke"` : `fill="${color}"`;
      parts.push(`<path d="${d}" ${paint} transform="translate(${cx} ${cy}) rotate(${fmt(rotate)}) scale(${sx} ${sy}) translate(-50 -50)"/>`);
    } else throw new Error(`Unknown flag step ${kind}`);
  }
  const label = title ? `<title>${title.replace(/[<&>]/g, '')}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"${title ? '' : ' aria-hidden="true"'} class="flag-svg">${label}<rect width="${W}" height="${H}" fill="#ffffff"/>${parts.join('')}</svg>`;
}

/** A flag picture from flag-art/*.js ("viewBox|shapes") as SVG, the same size and class as a drawn flag. */
export function artSvg(art, { title = '' } = {}) {
  const at = art.indexOf('|');
  const label = title ? `<title>${title.replace(/[<&>]/g, '')}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${art.slice(0, at)}" width="90" height="60" role="img"${title ? '' : ' aria-hidden="true"'} class="flag-svg">${label}${art.slice(at + 1)}</svg>`;
}

/** Every colour a flag uses, for tests and the colour hint. */
export function flagColors(flag) {
  const colors = new Set();
  const visit = value => { if (typeof value === 'string' && HEX.test(value)) colors.add(value.toLowerCase()); else if (Array.isArray(value)) value.forEach(visit); };
  flag.draw.forEach(visit);
  return [...colors];
}
