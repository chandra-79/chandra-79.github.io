// Focused play (2.21, always on from 2.31): on phones every game starts full screen: the site header, footer and welcome tip are hidden so
// the board has the whole screen, and the Ziggle logo sits at the left of the title bar (it leads home). The corner button in the title bar
// brings the header back (and puts it away again). Loaded on demand (game-frame.js), so
// it costs pages nothing up front. Arrow Escape also has its own full-screen button for big boards; the title-bar button hides itself then.
// Phones held sideways (short and wide) get the same full-screen play: this is the query fit.js uses for data-play-focus (2.41.2).
const compact = matchMedia('(max-width:650px), (max-height:520px) and (orientation:landscape)');
const sideways = matchMedia('(max-height:520px) and (orientation:landscape) and (min-width:651px)');
const bar = document.querySelector('.game-bar');
if (bar) {
  const root = document.documentElement;
  const hidden = () => [...document.querySelectorAll('body>footer,.collection-welcome')];
  const icon = on => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'}"/></svg>`;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'drawer-button focus-toggle'; button.style.minWidth = '44px'; button.style.padding = '0 10px';
  // The Ziggle logo stays on screen while the header is away: a small link at the start of the title bar.
  const mark = document.createElement('a'), logo = document.createElement('img');
  mark.href = '/'; mark.className = 'bar-brand'; mark.setAttribute('aria-label', 'Ziggle home'); logo.src = '/play/logo.svg'; logo.alt = ''; logo.width = logo.height = 30; mark.append(logo);
  Object.assign(mark.style, { display: 'none', flex: 'none', alignItems: 'center', marginRight: '8px' }); bar.prepend(mark);
  let leftFullScreen = false;
  const set = on => {
    on = on && compact.matches; mark.style.display = on ? 'flex' : 'none';
    // One standard bar on every game: logo, then the title (or the Today / Practice switch), then the corner button, Help and More, on a single row.
    const put = (el, rules) => { for (const [key, value] of Object.entries(rules)) { if (on && value) el.style.setProperty(key, value, 'important'); else el.style.removeProperty(key); } };
    put(bar, { display: 'flex', 'flex-wrap': 'nowrap', 'align-items': 'center', gap: '6px', padding: sideways.matches ? '0 8px' : '5px 8px', 'min-height': sideways.matches ? '44px' : '56px', height: sideways.matches ? 'auto' : '', 'margin-bottom': sideways.matches ? '4px' : '', 'max-width': '100%', 'box-sizing': 'border-box', overflow: 'hidden' });
    for (const el of bar.children) {
      if (el === mark) put(el, { flex: 'none', margin: '0 2px 0 0' });
      else if (el.matches('.focus-toggle,.assist-open,.drawer-button')) put(el, { flex: 'none', margin: '0', width: 'auto', height: '44px', 'min-height': '44px', 'min-width': 'max-content', padding: '0 12px', 'font-size': '14px', 'box-sizing': 'border-box' });
      else if (el.matches('.mode-switch,h1')) put(el, { flex: '1 1 0', 'min-width': '0', margin: '0' });
    }
    // With the logo in the bar the title gives way: it shortens with … , and it is left to screen readers when the bar also holds the Today / Practice
    // switch (the row would be too crowded on a phone). The game's name is still the page's h1.
    const title = bar.querySelector('h1'), crowded = Boolean(bar.querySelector('.mode-switch,[data-url-switch]'));
    if (title) { const look = !on ? {} : crowded ? { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', 'white-space': 'nowrap' } : { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'min-width': '0', flex: '1 1 0' };
      for (const key of ['position', 'width', 'height', 'overflow', 'clip', 'white-space', 'text-overflow', 'min-width', 'flex']) { if (key in look) title.style.setProperty(key, look[key], 'important'); else title.style.removeProperty(key); } } // "important": the compact title-bar rules are
    for (const el of hidden()) el.style.setProperty('display', on ? 'none' : '', on ? 'important' : '');
    root.style.setProperty('--header-h', on ? '0px' : '');
    root.toggleAttribute('data-focused', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Show the page header' : 'Focus: hide the page header while you play');
    button.title = button.getAttribute('aria-label'); button.innerHTML = icon(on);
    dispatchEvent(new Event('resize'));
  };
  const sync = () => { button.hidden = !compact.matches; set(compact.matches && !leftFullScreen); };
  button.addEventListener('click', () => { leftFullScreen = root.hasAttribute('data-focused'); set(!leftFullScreen); });
  addEventListener('keydown', event => { if (event.key === 'Escape' && root.hasAttribute('data-focused') && !document.querySelector('dialog[open]') && !document.getElementById('game-drawer')?.classList.contains('open')) { leftFullScreen = true; set(false); } });
  compact.addEventListener('change', sync); sideways.addEventListener('change', sync);
  bar.insertBefore(button, bar.querySelector('.drawer-button'));
  sync();
}

// Help in the title bar (2.23): the trainers keep their "?" inside the card; give them the same Help button the games have.
if (bar && document.querySelector('main.type-shell,main.uni-shell,main.pal-shell,main.cube-shell') && !bar.querySelector('.assist-open,[data-help-bar]')) {
  const target = document.querySelector('.circle-button[id$="-help"]');
  if (target) {
    const help = document.createElement('button');
    help.type = 'button'; help.className = 'secondary-button assist-open'; help.dataset.helpBar = ''; help.textContent = 'Help'; help.setAttribute('aria-label', 'Help: how this works');
    help.addEventListener('click', () => target.click());
    bar.insertBefore(help, [...bar.querySelectorAll('.drawer-button')].find(button => !button.classList.contains('focus-toggle')) || null);
  }
}
