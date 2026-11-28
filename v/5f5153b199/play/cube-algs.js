// Algorithms for the Ziggle cube trainer, held yellow on top. Every one is checked in cube.test.js:
// it must parse, keep the layers it promises to keep, and make a case different from the others.

/** The beginner (layer-by-layer) method, white cross underneath. */
export const BEGINNER = Object.freeze([
  { id: 'cross', name: 'The white cross', goal: 'cross', tip: 'Find a white edge, turn it above the centre of its other colour, then turn that face twice (F2) to drop it in. Work one edge at a time.', alg: '' },
  { id: 'corners', name: 'White corners', goal: 'layer1', tip: 'Turn the top until a white corner sits above its slot at the front right. Repeat R U R’ U’ until it drops in, white side down.', alg: "R U R' U'" },
  { id: 'edges', name: 'Middle edges', goal: 'layer2', tip: 'Find a top edge with no yellow. Match its front colour to a centre. If it goes right: U R U’ R’ U’ F’ U F. If left: U’ L’ U L U F U’ F’.', alg: "U R U' R' U' F' U F", alt: "U' L' U L U F U' F'" },
  { id: 'top-cross', name: 'Yellow cross', goal: 'top-cross', tip: 'Hold a yellow line sideways, or the L shape at back left, then F R U R’ U’ F’. A dot takes it three times at most.', alg: "F R U R' U' F'" },
  { id: 'top-face', name: 'Yellow face', goal: 'top-face', tip: 'With one yellow corner on top, hold it at the front left and do R U R’ U R U2 R’ (the Sune). Repeat until the top is all yellow.', alg: "R U R' U R U2 R'" },
  { id: 'top-corners', name: 'Yellow corners in place', goal: 'top-corners', tip: 'Find two corners on one side that match each other (headlights), hold them at the back, then R’ F R’ B2 R F’ R’ B2 R2.', alg: "R' F R' B2 R F' R' B2 R2" },
  { id: 'top-edges', name: 'Yellow edges in place', goal: 'solved', tip: 'Hold a solved side at the back and do R U’ R U R U R U’ R’ U’ R2. Do it again if the edges went the wrong way round.', alg: "R U' R U R U R U' R' U' R2" },
]);

/** Two-look OLL (10) and two-look PLL (6): the four-look last layer. */
export const TWO_LOOK = Object.freeze([
  { id: 'eo-line', set: 'oll1', name: 'Line', alg: "F R U R' U' F'" },
  { id: 'eo-l', set: 'oll1', name: 'L shape', alg: "f R U R' U' f'" },
  { id: 'eo-dot', set: 'oll1', name: 'Dot', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 'co-sune', set: 'oll2', name: 'Sune', alg: "R U R' U R U2 R'" },
  { id: 'co-antisune', set: 'oll2', name: 'Antisune', alg: "R U2 R' U' R U' R'" },
  { id: 'co-h', set: 'oll2', name: 'H', alg: "R U2 R' U' R U R' U' R U' R'" },
  { id: 'co-pi', set: 'oll2', name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'co-headlights', set: 'oll2', name: 'Headlights', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'co-t', set: 'oll2', name: 'T (chameleon)', alg: "r U R' U' r' F R F'" },
  { id: 'co-bowtie', set: 'oll2', name: 'Bowtie', alg: "F' r U R' U' r' F R" },
  { id: 'cp-adjacent', set: 'pll1', name: 'Adjacent corner swap', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'cp-diagonal', set: 'pll1', name: 'Diagonal corner swap', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'ep-ua', set: 'pll2', name: 'Ua', alg: "M2 U M U2 M' U M2" },
  { id: 'ep-ub', set: 'pll2', name: 'Ub', alg: "M2 U' M U2 M' U' M2" },
  { id: 'ep-h', set: 'pll2', name: 'H', alg: 'M2 U M2 U2 M2 U M2' },
  { id: 'ep-z', set: 'pll2', name: 'Z', alg: "M' U M2 U M2 U M' U2 M2" },
]);

/** All 21 PLLs. */
export const PLL = Object.freeze([
  ['Aa', "x R' U R' D2 R U' R' D2 R2 x'"], ['Ab', "x R2 D2 R U R' D2 R U' R x'"], ['E', "x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
  ['F', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"], ['Ga', "R2 U R' U R' U' R U' R2 U' D R' U R D'"], ['Gb', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ['Gc', "R2 U' R U' R U R' U R2 U D' R U' R' D"], ['Gd', "R U R' U' D R2 U' R U' R' U R' U R2 D'"], ['H', 'M2 U M2 U2 M2 U M2'],
  ['Ja', "x R2 F R F' R U2 r' U r U2 x'"], ['Jb', "R U R' F' R U R' U' R' F R2 U' R'"], ['Na', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ['Nb', "R' U R U' R' F' U' F R U R' F R' F' R U' R"], ['Ra', "R U' R' U' R U R D R' U' R D' R' U2 R'"], ['Rb', "R2 F R U R U' R' F' R U2 R' U2 R"],
  ['T', "R U R' U' R' F R2 U' R' U' R U R' F'"], ['Ua', "M2 U M U2 M' U M2"], ['Ub', "M2 U' M U2 M' U' M2"],
  ['V', "R' U R' U' y R' F' R2 U' R' U R' F R F"], ['Y', "F R U' R' U' R U R' F' R U R' U' R' F R F'"], ['Z', "M' U M2 U M2 U M' U2 M2"],
].map(([name, alg]) => Object.freeze({ id: `pll-${name}`, name: `${name} perm`, short: name, alg })));

/** All 57 OLLs, by their usual numbers. */
export const OLL = Object.freeze([
  "R U2 R2 F R F' U2 R' F R F'", "F R U R' U' F' f R U R' U' f'", "f R U R' U' f' U' F R U R' U' F'", "f R U R' U' f' U F R U R' U' F'",
  "r' U2 R U R' U r", "r U2 R' U' R U' r'", "r U R' U R U2 r'", "r' U' R U' R' U2 r", "R U R' U' R' F R2 U R' U' F'", "R U R' U R' F R F' R U2 R'",
  "r U R' U R' F R F' R U2 r'", "M' R' U' R U' R' U2 R U' R r'", "F U R U' R2 F' R U R U' R'", "R' F R U R' F' R F U' F'", "r' U' r R' U' R U r' U r",
  "r U r' R U R' U' r U' r'", "R U R' U R' F R F' U2 R' F R F'", "r U R' U R U2 r2 U' R U' R' U2 r", "r' R U R U R' U' M' R' F R F'", "r U R' U' M2 U R U' R' U' M'",
  "R U2 R' U' R U R' U' R U' R'", "R U2 R2 U' R2 U' R2 U2 R", "R2 D' R U2 R' D R U2 R", "r U R' U' r' F R F'", "F' r U R' U' r' F R",
  "R U2 R' U' R U' R'", "R U R' U R U2 R'", "r U R' U' M U R U' R'", "R U R' U' R U' R' F' U' F R U R'", "F R' F R2 U' R' U' R U R' F2",
  "R' U' F U R U' R' F' R", "L U F' U' L' U L F L'", "R U R' U' R' F R F'", "R U R2 U' R' F R U R U' F'", "R U2 R2 F R F' R U2 R'",
  "L' U' L U' L' U L U L F' L' F", "F R' F' R U R U' R'", "R U R' U R U' R' U' R' F R F'", "L F' L' U' L U F U' L'", "R' F R U R' U' F' U R",
  "R U R' U R U2 R' F R U R' U' F'", "R' U' R U' R' U2 R F R U R' U' F'", "F' U' L' U L F", "F U R U' R' F'", "F R U R' U' F'",
  "R' U' R' F R F' U R", "R' U' R' F R F' R' F R F' U R", "F R U R' U' R U R' U' F'", "r U' r2 U r2 U r2 U' r", "r' U r2 U' r2 U' r2 U r'",
  "F U R U' R' U R U' R' F'", "R U R' U R U' B U' B' R'", "r' U' R U' R' U R U' R' U2 r", "r U R' U R U' R' U R U2 r'", "R' F R U R U' R2 F' R2 U' R' U R U R'",
  "r U r' U R U' R' U R U' R' r U' r'", "R U R' U' M' U R U' r'",
].map((alg, i) => Object.freeze({ id: `oll-${i + 1}`, name: `OLL ${i + 1}`, short: String(i + 1), alg })));

/** 2×2 Ortega: the 7 corner orientations are the same as the 3×3's; then permute both layers (PBL). */
export const ORTEGA_PBL = Object.freeze([
  { id: 'pbl-top-adj', name: 'Top: adjacent swap', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'pbl-top-diag', name: 'Top: diagonal swap', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'pbl-both-adj', name: 'Both layers: adjacent', alg: "R2 U' B2 U2 R2 U' R2" },
  { id: 'pbl-both-diag', name: 'Both layers: diagonal', alg: 'R2 F2 R2' },
  { id: 'pbl-adj-diag', name: 'Top adjacent, bottom diagonal', alg: "R U' R F2 R' U R'" },
  { id: 'pbl-diag-adj', name: 'Top diagonal, bottom adjacent', alg: "x2 R U' R F2 R' U R' x2" },
]);

/** 4×4 parity, after reducing to a 3×3. */
export const PARITY = Object.freeze([
  { id: 'parity-oll', name: 'OLL parity (one flipped edge pair)', alg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw' x'" },
  { id: 'parity-pll', name: 'PLL parity (two edge pairs swapped)', alg: '2R2 U2 2R2 Uw2 2R2 Uw2' },
]);

/**
 * The F2L moves used to build and solve every pair case: each leaves the cross and the other slots alone.
 * The basic inserts, the sledgehammer both ways, and one longer move that flips the edge in its slot.
 */
export const F2L_TRIGGERS = Object.freeze(["R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F", "R' F R F'", "F R' F' R", "R U' R' U F' U2 F U2 F' U F", 'U', "U'", 'U2']);
