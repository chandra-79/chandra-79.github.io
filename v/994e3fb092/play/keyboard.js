/** Stable keyboard names and spatial navigation for an arrow board. */
const head = path => path.cells.at(-1);
const spatialOrder = (a, b) => head(a)[1] - head(b)[1] || head(a)[0] - head(b)[0] || a.id - b.id;

/** Column names: A–Z, then AA, AB… (also used for the board's axis letters). */
export function letters(index) {
  let label = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    label = String.fromCharCode(65 + (n - 1) % 26) + label;
  }
  return label;
}

/** Pass the full initial board, not only remaining arrows, to preserve names. */
export function createIdentifiers(paths, size, mode = 'coordinates') {
  return new Map([...paths].sort(spatialOrder).map((path, index) => {
    const [x, y] = head(path);
    const label = mode === 'numbers' ? String(index + 1)
      : mode === 'letters' ? letters(index)
      : `${letters(x)}${size - y}`;
    return [path.id, label];
  }));
}

export function normalizeIdentifier(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

const directions = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  ArrowUp: [0, -1], ArrowDown: [0, 1],
};

/**
 * Move to the nearest head in the requested half-plane. At equal distance,
 * prefer the smallest perpendicular offset (the closest directional angle),
 * then reading order, so sparse boards stay predictable as arrows disappear.
 */
export function findDirectionalNeighbor(paths, currentId, key) {
  const ordered = [...paths].sort(spatialOrder);
  if (!ordered.length) return null;
  const current = paths.find(path => path.id === currentId);
  if (!current) return ordered[0].id;
  const direction = directions[key];
  if (!direction) return currentId;
  const [x, y] = head(current);
  const [dx, dy] = direction;
  const candidates = ordered.filter(path => path.id !== currentId).map(path => {
    const [px, py] = head(path);
    const along = (px - x) * dx + (py - y) * dy;
    const perpendicular = Math.abs((px - x) * dy - (py - y) * dx);
    return { path, along, perpendicular, distance: (px - x) ** 2 + (py - y) ** 2 };
  }).filter(candidate => candidate.along > 0);
  candidates.sort((a, b) => a.distance - b.distance || a.perpendicular - b.perpendicular || spatialOrder(a.path, b.path));
  return candidates[0]?.path.id ?? currentId;
}

/** Select a nearby remaining arrow after a removal, with stable spatial ties. */
export function findNearestPath(paths, fromPath) {
  if (!paths.length) return null;
  if (!fromPath?.cells?.length) return [...paths].sort(spatialOrder)[0].id;
  const [x, y] = head(fromPath);
  const distance = path => (head(path)[0] - x) ** 2 + (head(path)[1] - y) ** 2;
  return [...paths].sort((a, b) => distance(a) - distance(b) || spatialOrder(a, b))[0].id;
}
