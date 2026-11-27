// Ziggle's cards for the ad spaces. Loaded on demand; nothing here loads anything from another site.

export const PROMOS = [
  { href: '/play/words.html?game=search', title: 'Word Search', line: 'Sixteen themes and a fresh grid every day.', art: '🔎', go: 'Play' },
  { href: '/play/words.html?game=crossword', title: 'Crossword', line: 'Friendly clues, a small grid, one coffee long.', art: '✏️', go: 'Play' },
  { href: '/play/weaver.html', title: 'Word Cloud', line: 'Flip the clue clouds and type the hidden word.', art: '☁️', go: 'Play' },
  { href: '/play/lock.html', title: 'Letter Lock', line: 'Crack today’s five-letter lock in six tries.', art: '🔐', go: 'Play' },
  { href: '/play/index.html', title: 'Arrow escape', line: 'Send every arrow out the way it points.', art: '➡️', go: 'Play' },
  { href: '/play/twists.html', title: 'Arrow Escape: Twist boards', line: 'Two-headed arrows, one-way tiles and colour gates.', art: '🔀', go: 'Play' },
  { href: '/play/memory.html', title: 'Memory Mischief', line: 'Six friends, a sneaky shuffle. Who went where?', art: '✨', go: 'Play' },
  { href: '/play/sudoku.html', title: 'Sudoku', line: 'Classic, Addoku, diagonal, mini and even-or-odd.', art: '🔢', go: 'Play' },
  { href: '/play/sums.html', title: 'Sum Spark', line: 'Chain number tiles to hit today’s three targets.', art: '➕', go: 'Play' },
  { href: '/play/typing.html', title: 'Typing trainer', line: 'Home row to 70 words a minute, one key at a time.', art: '⌨️', go: 'Train' },
  { href: '/play/emoji.html', title: 'Emoji & flags', line: 'Name it, find the flag, guess which came first.', art: '🏳️', go: 'Train' },
  { href: '/play/palace.html', title: 'Memory palace', line: 'Build a palace and walk it to remember lists.', art: '🏛️', go: 'Train' },
  { href: '/play/vocab.html', title: 'Word Builder', line: 'A new word every day, and quick quizzes that make it stick.', art: '📖', go: 'Train' },
  { href: '/play/cube.html', title: 'Cube trainer', line: 'From your first solve to full CFOP, 2×2 to 7×7.', art: '🧊', go: 'Train' },
  { href: '/play/blog.html', title: 'The Ziggle blog', line: 'What research says about practice, minus the miracle claims.', art: '📖', go: 'Read' },
];

// Blog posts that go with each game (2.6.1): under a game, the banner can show the posts about that game.
const POSTS = {
  'what-word-games-train': ['What word games are really training', '🔤'], 'tip-of-the-tongue': ['It’s on the tip of my tongue', '👅'],
  'the-unfinished-crossword': ['Why the unfinished crossword nags you', '✏️'], 'the-maths-of-a-good-guess': ['Letter Lock and the maths of a good guess', '🔐'],
  'the-next-obvious-move': ['Sudoku, arrows and the joy of the next obvious move', '🔢'], 'what-chess-masters-see': ['What chess masters see that you don’t (yet)', '♟️'],
  'the-forgetting-curve': ['The forgetting curve is real, and it’s beatable', '📉'], 'the-memory-palace': ['The 2,500-year-old memory trick that still works', '🏛️'],
  'the-85-percent-sweet-spot': ['The sweet spot: getting it right about 85% of the time', '🎯'], 'the-hard-way-works': ['Why the hard way feels worse and works better', '🧗'],
  'type-faster-by-slowing-down': ['Type faster by slowing down', '⌨️'], 'qwerty-nobody-chose': ['QWERTY: the keyboard layout nobody chose on purpose', '⌨️'],
  'from-176-pictures-to-3953-emoji': ['From 176 tiny pictures to 3,953 emoji', '😀'], 'flags-for-beginners': ['Square, double-pennant and everything in between: a flag primer', '🏁'],
  'the-cube-by-numbers': ['43 quintillion ways to be wrong: the Rubik’s Cube by numbers', '🧊'], 'quiz-yourself': ['Quiz yourself: the study method that beat the fancy diagram', '❓'],
  'mix-it-up': ['Mix it up: why eight different puzzles beat eighty of one', '🔀'], 'five-minutes-a-day': ['Five minutes a day: how small habits actually stick', '🔥'],
  'will-puzzles-make-you-smarter': ['Will puzzles make you smarter?', '🧠'], 'the-ikea-effect': ['Why the answer you found tastes better than the one you’re given', '🔧'],
  'the-first-crossword': ['The first crossword was a diamond', '✏️'], 'who-invented-the-word-search': ['Who invented the word search?', '🔎'],
  'sudoku-was-born-in-indiana': ['Sudoku was born in Indiana', '🔢'], 'bulls-cows-and-the-five-letter-lock': ['Bulls, cows and the five-letter lock', '🔐'],
  'six-numbers-and-a-target': ['Six numbers and a target', '➕'], 'pelmanism-and-the-shuffle': ['Pelmanism, shell games and the sneaky shuffle', '✨'],
  'the-fifteen-puzzle-craze': ['The 1880 puzzle craze, and the arrows that followed', '➡️'], 'the-teacher-who-never-was': ['The typing teacher who never existed', '⌨️'],
  'one-key-at-a-time': ['The 1888 contest that made touch typing famous', '⌨️'], 'the-leitner-box': ['A shoebox of flashcards that changed studying', '🗂️'],
  'scaffolding': ['Scaffolding: why the cube trainer teaches seven steps first', '🧱'], 'show-me-first': ['Show me first: the case for worked examples', '👀'],
  'stars-not-scores': ['Stars, not scores: why trainers have a pass mark', '⭐'],
};
const POSTS_FOR = {
  '/play/words.html?game=search': ['who-invented-the-word-search', 'what-word-games-train', 'tip-of-the-tongue'],
  '/play/words.html?game=crossword': ['the-first-crossword', 'the-unfinished-crossword', 'what-word-games-train'],
  '/play/weaver.html': ['tip-of-the-tongue', 'what-word-games-train', 'the-ikea-effect'],
  '/play/lock.html': ['bulls-cows-and-the-five-letter-lock', 'the-maths-of-a-good-guess', 'what-word-games-train'],
  '/play/index.html': ['the-fifteen-puzzle-craze', 'the-next-obvious-move', 'what-chess-masters-see'],
  '/play/twists.html': ['the-fifteen-puzzle-craze', 'the-next-obvious-move', 'the-hard-way-works'],
  '/play/memory.html': ['pelmanism-and-the-shuffle', 'the-forgetting-curve', 'the-memory-palace'],
  '/play/sudoku.html': ['sudoku-was-born-in-indiana', 'the-next-obvious-move', 'the-85-percent-sweet-spot'],
  '/play/sums.html': ['six-numbers-and-a-target', 'the-85-percent-sweet-spot', 'show-me-first'],
  '/play/typing.html': ['type-faster-by-slowing-down', 'one-key-at-a-time', 'the-teacher-who-never-was'],
  '/play/emoji.html': ['from-176-pictures-to-3953-emoji', 'flags-for-beginners', 'the-leitner-box'],
  '/play/palace.html': ['the-memory-palace', 'the-leitner-box', 'the-forgetting-curve'],
  '/play/vocab.html': ['the-leitner-box', 'the-forgetting-curve', 'quiz-yourself'],
  '/play/cube.html': ['the-cube-by-numbers', 'scaffolding', 'show-me-first'],
};
/** Blog posts for the page you are on, as promo cards (most relevant first). */
export function postsFor(path) {
  const slugs = POSTS_FOR[path] || ['will-puzzles-make-you-smarter', 'mix-it-up', 'five-minutes-a-day'];
  return slugs.filter(slug => POSTS[slug]).map(slug => ({ href: `/play/blog/${slug}.html`, title: POSTS[slug][0], line: 'From the Ziggle blog', art: POSTS[slug][1], go: 'Read' }));
}

/** Which house cards a slot shows: today's turn of the list, never the page you are on. */
export function pickPromos(path, day, slotIndex, count) {
  const list = PROMOS.filter(promo => promo.href !== path && !(path === '/play/' && promo.href === '/play/index.html'));
  const start = ((day + slotIndex * 5) % list.length + list.length) % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]);
}


/** Cards that link to other sites we run; each can be limited to dates and places. */
export const SPONSORS = [
  { id: 'techknowen', href: 'https://techknowen.com/', title: 'Tech Knowen', line: 'Empowering innovation, simplifying technology.', art: '💡', go: 'Read', who: 'Tech Knowen' },
  { id: 'ajnacs', href: 'https://ajnacs.com/', title: 'Ajna CS', line: 'Architecture that survives contact with production.', art: '🏗️', go: 'Visit', who: 'Ajna CS' },
];
const slug = path => path.replace(/^\/(play\/)?/, '').replace(/\.html/, '').replace(/[?&=]+/g, '-') || 'home';
const isoOf = day => new Date(day * 86_400_000).toISOString().slice(0, 10);
/** Cards running on a day. */
export const activeSponsors = (day, placement = 'banner', list = SPONSORS) =>
  list.filter(s => (!s.from || s.from <= isoOf(day)) && (!s.to || isoOf(day) <= s.to) && (!s.placements || s.placements.includes(placement)));
/** The card for a slot today, or null: chosen by date only, never by player. */
export function pickSponsor(path, day, slotIndex, placement = 'banner', list = SPONSORS) {
  if ((day + slotIndex) % 2) return null;
  const active = activeSponsors(day, placement, list);
  if (!active.length) return null;
  const sponsor = active[Math.floor((day + slotIndex) / 2) % active.length];
  const url = new URL(sponsor.href);
  url.search = new URLSearchParams({ utm_source: 'ziggle', utm_medium: 'house-ad', utm_campaign: sponsor.id, utm_content: slug(path) }).toString();
  return { ...sponsor, href: url.href, external: true };
}

export const here = () => { const url = new URL(location.href); return url.pathname + (url.searchParams.get('game') ? `?game=${url.searchParams.get('game')}` : ''); };
export const dayIndex = () => { const now = new Date(); return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000); };

export function card(promo, compact) {
  const link = document.createElement('a');
  link.className = 'promo';
  link.href = promo.href;
  if (promo.external) { link.target = '_blank'; link.rel = 'noopener'; link.dataset.sponsor = promo.id; link.setAttribute('aria-label', `Ad: ${promo.title}. ${promo.line}`); }
  const art = document.createElement('span'); art.className = 'promo-art'; art.setAttribute('aria-hidden', 'true'); art.textContent = promo.art;
  const text = document.createElement('span'); text.className = 'promo-text';
  const title = document.createElement('strong'); title.textContent = promo.title;
  text.append(title);
  if (!compact) { const line = document.createElement('span'); line.textContent = promo.line; text.append(line); }
  const go = document.createElement('span'); go.className = 'promo-go'; go.setAttribute('aria-hidden', 'true'); go.textContent = `${promo.external ? 'Ad · ' : ''}${promo.go} →`;
  link.append(art, text, go);
  return link;
}


// ---- The card in the finished-level popup ----
let wins = 0;
/** One card in the popup after a win: none on the first win of a visit, then one win in three. Never in kids mode. */
export function levelEndAd(slot) {
  wins++;
  if (document.documentElement.dataset.kids === 'true' || wins < 2 || (wins - 2) % 3) return false;
  const day = dayIndex(), path = here();
  const promo = pickSponsor(path, day, 0, 'levelend') || pickSponsor(path, day, 1, 'levelend') || pickPromos(path, day, wins, 1)[0];
  if (!promo) return false;
  const label = document.createElement('span'); label.className = 'ad-label'; label.textContent = promo.external ? 'Ad' : 'From Ziggle';
  slot.replaceChildren(label, card(promo, false));
  slot.hidden = false;
  return true;
}
