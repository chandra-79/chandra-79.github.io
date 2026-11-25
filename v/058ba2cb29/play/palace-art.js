// Ziggle's own drawings for the memory palace trainer: illustrated faces and abstract shapes, as SVG strings.
// Nothing here is traced from anywhere; every face is built from a few simple parts.

const SKIN = ['#f6d7c0', '#eec19d', '#d9a47a', '#b97a52', '#8d5a3b', '#5e3a26'];
const HAIR = ['#2b2118', '#5a3a22', '#a0662f', '#e2b25b', '#b8b2ad', '#c2413b'];
const SHIRT = ['#6842d6', '#0b6f76', '#a83a0c', '#2f6b22', '#a3215f', '#3a5ba8'];
const SHAPE = ['#6842d6', '#0b6f76', '#c2413b', '#2f6b22', '#d18b00', '#a3215f', '#3a5ba8', '#28223d'];

function hairShape(style, color) {
  switch (style) {
    case 0: return `<path d="M22 44c0-20 12-30 28-30s28 10 28 30c-6-8-14-12-28-12s-22 4-28 12Z" fill="${color}"/>`; // short crop
    case 1: return `<path d="M18 52c-2-26 12-40 32-40s34 14 32 40c-4-14-10-22-14-24-6 6-24 8-36 4-6 4-11 12-14 20Z" fill="${color}"/><path d="M18 52c0 16 2 30 8 40h-8c-6-10-6-26 0-40ZM82 52c0 16-2 30-8 40h8c6-10 6-26 0-40Z" fill="${color}"/>`; // long
    case 2: return `<circle cx="50" cy="30" r="26" fill="${color}"/><circle cx="30" cy="40" r="14" fill="${color}"/><circle cx="70" cy="40" r="14" fill="${color}"/>`; // curls
    case 3: return `<path d="M24 40c2-16 12-26 26-26 16 0 26 10 26 26-10-4-16-12-18-16-6 10-20 14-34 16Z" fill="${color}"/>`; // side parting
    case 4: return `<path d="M26 34c4-12 14-18 24-18s20 6 24 18c-8-4-16-6-24-6s-16 2-24 6Z" fill="${color}"/>`; // very short
    case 5: return `<path d="M22 46c0-22 12-32 28-32s28 10 28 32c-6-6-10-8-14-8l-14-8-14 8c-4 0-8 2-14 8Z" fill="${color}"/><circle cx="50" cy="10" r="10" fill="${color}"/>`; // bun
    default: return `<path d="M20 48c0-24 12-34 30-34s30 10 30 34l-6-10-6 8-6-10-6 8-6-10-6 8-6-10-6 8-6-10Z" fill="${color}"/>`; // spiky
  }
}

/** One illustrated face from its parameters (see faceParams in palace-engine.js). */
export function faceSvg(face, { label = '' } = {}) {
  const skin = SKIN[face.skin % SKIN.length], hair = HAIR[face.hairColor % HAIR.length], shirt = SHIRT[face.shirt % SHIRT.length];
  const eyes = [
    '<circle cx="40" cy="52" r="3.2" fill="#1f1a24"/><circle cx="60" cy="52" r="3.2" fill="#1f1a24"/>',
    '<path d="M36 53q4-4 8 0M56 53q4-4 8 0" stroke="#1f1a24" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    '<ellipse cx="40" cy="52" rx="4" ry="2.6" fill="#1f1a24"/><ellipse cx="60" cy="52" rx="4" ry="2.6" fill="#1f1a24"/>',
  ][face.eyes % 3];
  const brows = [
    '<path d="M34 45h11M55 45h11" stroke="#2b2118" stroke-width="2.4" stroke-linecap="round"/>',
    '<path d="M34 46q5-4 11-1M55 45q6-3 11 1" stroke="#2b2118" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    '<path d="M34 44l11 2M55 46l11-2" stroke="#2b2118" stroke-width="3" stroke-linecap="round"/>',
  ][face.brows % 3];
  const mouth = [
    '<path d="M41 68q9 8 18 0" stroke="#7a2e2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    '<path d="M42 69h16" stroke="#7a2e2e" stroke-width="2.6" stroke-linecap="round"/>',
    '<path d="M40 66q10 12 20 0Z" fill="#7a2e2e"/>',
    '<ellipse cx="50" cy="69" rx="4" ry="3" fill="#7a2e2e"/>',
  ][face.mouth % 4];
  const glasses = face.glasses === 1 ? '<g fill="none" stroke="#1f1a24" stroke-width="2"><circle cx="40" cy="52" r="8"/><circle cx="60" cy="52" r="8"/><path d="M48 52h4"/></g>'
    : face.glasses === 2 ? '<g fill="none" stroke="#1f1a24" stroke-width="2"><rect x="30" y="46" width="17" height="12" rx="3"/><rect x="53" y="46" width="17" height="12" rx="3"/><path d="M47 51h6"/></g>' : '';
  const beard = face.beard === 1 ? `<path d="M28 60c2 18 12 26 22 26s20-8 22-26c-4 6-10 8-12 8-4-4-16-4-20 0-2 0-8-2-12-8Z" fill="${hair}"/>`
    : face.beard === 2 ? `<path d="M40 64q10-6 20 0q-10 4-20 0Z" fill="${hair}"/>` : '';
  const earrings = face.earrings ? '<circle cx="24" cy="64" r="2.6" fill="#e2b25b"/><circle cx="76" cy="64" r="2.6" fill="#e2b25b"/>' : '';
  const back = face.hair === 1 ? hairShape(1, hair) : '';
  const title = label ? `<title>${label.replace(/[<&>]/g, '')}</title>` : '';
  return `<svg class="face-svg" viewBox="0 0 100 110" width="100" height="110" role="img"${label ? '' : ' aria-hidden="true"'}>${title}<rect width="100" height="110" rx="14" fill="${shirt}" opacity=".16"/>${back}<path d="M18 110c2-16 14-24 32-24s30 8 32 24Z" fill="${shirt}"/><rect x="43" y="74" width="14" height="14" fill="${skin}"/><ellipse cx="24" cy="58" rx="5" ry="7" fill="${skin}"/><ellipse cx="76" cy="58" rx="5" ry="7" fill="${skin}"/><ellipse cx="50" cy="54" rx="26" ry="30" fill="${skin}"/>${face.hair === 1 ? '' : hairShape(face.hair, hair)}${brows}${eyes}${glasses}<path d="M50 56v7h-3" stroke="#00000040" stroke-width="2" fill="none" stroke-linecap="round"/>${mouth}${beard}${earrings}</svg>`;
}

/** One abstract shape: a wobbly polygon with a fill pattern. */
export function shapeSvg(shape, id = 's') {
  const color = SHAPE[shape.color % SHAPE.length];
  const n = shape.radii.length;
  const points = shape.radii.map((r, i) => { const a = ((shape.rotate + (i * 360) / n) * Math.PI) / 180; return `${(50 + 40 * r * Math.cos(a)).toFixed(1)},${(50 + 40 * r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const pid = `pat-${id}`;
  const pattern = [
    '',
    `<pattern id="${pid}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${color}"/><rect width="4" height="8" fill="#ffffff" opacity=".55"/></pattern>`,
    `<pattern id="${pid}" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${color}"/><circle cx="4.5" cy="4.5" r="2" fill="#ffffff" opacity=".7"/></pattern>`,
    `<pattern id="${pid}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${color}"/><path d="M0 5h10M5 0v10" stroke="#ffffff" stroke-width="1.6" opacity=".6"/></pattern>`,
  ][shape.pattern % 4];
  const fill = shape.pattern % 4 ? `url(#${pid})` : color;
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="100" height="100" aria-hidden="true">${pattern ? `<defs>${pattern}</defs>` : ''}<polygon points="${points}" fill="${fill}" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
