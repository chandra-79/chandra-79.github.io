import { attachArrowHelp, subscribeToDaily, withBackup } from './arrow-flow.js';
import { showLevelEnd } from './level-end.js';
import { contactFx, escapeDuration } from './arrow-fx.js';
import { levelSnapshot, isPractice, menuResume, practiceStart } from './arrow-resume.js';
import { LEVELS, WORLD_TOUR, generateLevel, generateDaily, inferDailyTier, generateTourBoard, canLeave, generateClimb, buildAhead } from './engine.js';
import { COLOUR_NAMES as colourNames, piecesHelp as helpFor, whyBlocked as whyFor, pieceWords as wordsFor, pieceBadges as badgesFor, piecesSvg, gatesOpenedBy as openedFor, refuse as refuseFor, boardFrame, helpBody, SHAPE_LABELS as shapeLabels } from './arrow-pieces.js';
import { letters as columnName, createIdentifiers, normalizeIdentifier, findDirectionalNeighbor } from './keyboard.js';
import { loadProgress, writeProgress, localDateKey, dailyStats, recordDailyResult, recordVisit, mergeStoredProgress, collectedTotal, collectedSince } from './progress.js';
import { play as playSound, haptic, burst, isTouch, soundOn, confetti as fxConfetti } from './fx.js';

const $ = (id) => document.getElementById(id);
const canShowArrowIds = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const icons = {
  flame:'<path d="M13 3c1 5-5 5-3 10 1-2 3-2 4-4 4 3 5 5 4 8a6 6 0 0 1-12-1c0-5 5-7 7-13Z"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h2m4 0h2"/>',
  trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>',
  settings:'<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 3h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-3Z"/><circle cx="11.5" cy="11.5" r="3"/>',
  chevron:'<path d="m8 10 4 4 4-4"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.1 2c-1.1.7-1.6 1-1.6 2m0 3h.01"/>',
  pause:'<path d="M8 5v14m8-14v14" stroke-width="3"/>',
  play:'<path d="m9 5 10 7-10 7V5Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  heart:'<path d="M20.7 4.6a5.3 5.3 0 0 0-7.5 0L12 5.8l-1.2-1.2a5.3 5.3 0 0 0-7.5 7.5L12 21l8.7-8.9a5.3 5.3 0 0 0 0-7.5Z"/>',
  cursor:'<path d="m5 3 14 10-7 1-3 6L5 3Z"/>',
  lanes:'<path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>',
  bulb:'<path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7m-8 1h8m-7 3h6m-5 2h4m-2-5v-6m-3-2 3 2 3-2"/>',
  restart:'<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-1-1 0-2 1-2h3a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z"/><circle cx="7" cy="10" r=".8"/><circle cx="10" cy="6.5" r=".8"/><circle cx="15" cy="7" r=".8"/><circle cx="18" cy="11" r=".8"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
const palette = [['#9861d4','#7542ba'],['#e59a43','#ca752f'],['#47ad8c','#27856b'],['#4aa5d1','#397eaf'],['#df739b','#bd5084'],['#b5a342','#95832b'],['#7770d3','#5d54b2']];
const calmNow=()=>globalThis.Ziggle?.calm?.() ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
const arrowW=()=>Math.max(2.4,Math.min(9,88/state.board.size)),boardWord=n=>n<35?'Gentle':n<65?'Steady':n<110?'Tricky':'Fiendish';
let learn=null;
const free=path=>canLeave(state.board,state.remaining,path);
const pc=()=>({board:state.board,remaining:state.remaining,identifiers:state.identifiers,palette});
const piecesHelp=()=>helpFor(state.board),whyBlocked=(path,check)=>whyFor(pc(),path,check),pieceWords=path=>wordsFor(pc(),path),pieceBadges=(path,points,step)=>badgesFor(pc(),path,points,step),gatesOpenedBy=leaving=>openedFor(pc(),leaving);
const partnerOf=path=>path.link!==undefined?state.remaining.find(p=>p.id===path.link):null;
function browserStorage(){try{return localStorage;}catch{return undefined;}}
let saved = loadProgress(browserStorage());
function save() {
  saved=mergeStoredProgress(saved,loadProgress(browserStorage()));
  const stored=writeProgress(saved,browserStorage());
  const status=$('save-status');
  status.textContent=stored?'Progress saves in this browser':'Browser saving unavailable · Download a backup';
  status.classList.toggle('save-warning',!stored);
  updateDailyStats();
  return stored;
}
const hintedIds=new Set();
const state = { level:saved.current, mode:'levels', tour:null, board:null, remaining:[], history:[], lives:3, hints:3, hintsUsed:0, elapsed:0, paused:false, ended:false, flying:0, flagged:new Set(), generation:0, modal:null, highlighted:null, selected:null, identifiers:new Map() };
const dateKey = localDateKey;
let activeDailyDate = dateKey();
let activeTier = 'medium';
const TIER_LABEL={easy:'Easy daily',medium:'Medium daily',hard:'Expert daily'};
const ladder=()=>{const c=ziggle()?.climb?.('arrows');return c?.on?c:null;};
const archiveDate=(()=>{if(typeof URLSearchParams!=='function'||!globalThis.location)return null;const date=new URLSearchParams(location.search).get('date');return date&&globalThis.Ziggle?.isArchiveDate?.(date)?date:null;})();
const seedFor = date => [...date].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),71);
const formatTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const ziggle = () => globalThis.Ziggle;
function tone(success=true) { playSound(success?'launch':'bump'); }
function setSound(on){ const hub=ziggle(); if(!hub)return; const profile=hub.profile(); profile.sound=on; hub.saveProfile(profile); }
function updateDailyStats(){
  const stats=dailyStats(saved);
  for(const [id,value] of [['days-played',stats.daysPlayed],['daily-streak',stats.currentStreak],['daily-points',stats.points],['daily-wins',stats.wins]]) $(id).textContent=value.toLocaleString();
  updateCollected();
}
function countArrows(n){const day=dateKey(),days={...saved.collected.days};days[day]=Math.max(0,(days[day]||0)+n);if(!days[day])delete days[day];saved.collected={...saved.collected,days};updateCollected();}
function updateCollected(){
  const week=new Date(`${dateKey()}T12:00:00`);week.setDate(week.getDate()-((week.getDay()+6)%7));
  const monday=`${week.getFullYear()}-${String(week.getMonth()+1).padStart(2,'0')}-${String(week.getDate()).padStart(2,'0')}`;
  $('arrows-collected').textContent=collectedTotal(saved.collected).toLocaleString();$('arrows-week').textContent=collectedSince(saved.collected,monday).toLocaleString();
}
function saveSession(){
  if(isPractice(state.mode)&&state.board){if(state.remaining.length&&!state.ended)saved.activeLevel={...levelSnapshot(state),hintsUsed:state.hintsUsed,attempt:state.attempt};else delete saved.activeLevel;}
  if(state.mode==='daily'&&state.board){
    saved.activeDaily={date:activeDailyDate,tier:activeTier,remaining:state.remaining.map(p=>p.id),history:state.history.map(p=>p.id),lives:state.lives,hints:state.hints,hintsUsed:state.hintsUsed,attempt:state.attempt,elapsed:state.elapsed,ended:state.ended,...(state.lifeUsed?{life:true}:{})};
  }
  save();
  const s=state.mode==='daily'?saved.activeDaily:saved.activeLevel;
  if(s&&s.attempt===state.attempt)state.hintsUsed=s.hintsUsed;
}
function restoreSession(session){
  if(!session||(state.mode==='daily'?session.date!==activeDailyDate:session.mode!==state.mode||session.level!==state.level))return false;
  const paths=new Map(state.board.paths.map(p=>[p.id,p]));
  const ids=[...session.remaining,...session.history];
  if(ids.length!==paths.size||new Set(ids).size!==paths.size||ids.some(id=>!paths.has(id)))return false;
  let remaining=[...state.board.paths];
  for(let i=0;i<session.history.length;i++){const path=paths.get(session.history[i]);if(!path||!canLeave(state.board,remaining,path).ok)return false;const gone=new Set([path.id]);if(path.link!==undefined){if(session.history[i+1]!==path.link)return false;gone.add(path.link);i++;}remaining=remaining.filter(p=>!gone.has(p.id));}
  state.remaining=session.remaining.map(id=>paths.get(id));state.history=session.history.map(id=>paths.get(id));
  state.lives=session.lives;state.hints=session.hints;state.hintsUsed=session.hintsUsed;state.attempt=session.attempt;state.elapsed=session.elapsed;state.lifeUsed=session.life===true;
  state.ended=!state.remaining.length||state.lives===0;
  return true;
}
function startLevel(level=state.level, mode=state.mode, resume=false, tour=state.tour) {
  $('arrow-completion').hidden=true;$('board').inert=false;
  if(state.board&&(state.mode==='daily'||isPractice(state.mode)))saveSession();
  $('board-fly').innerHTML='';state.flying=0;state.flagged.clear();state.generation++;state.level=level;state.mode=mode;state.tour=mode==='tour'?tour:null;
  if(mode==='daily'){activeDailyDate=dateKey();activeTier=resume&&saved.activeDaily?.date===activeDailyDate?inferDailyTier(saved.activeDaily,ziggle()?.tier?.('arrows',activeDailyDate)||'medium'):(ziggle()?.tier?.('arrows',activeDailyDate)||'medium');}
  else if(mode==='archive')activeTier=ziggle()?.tier?.('arrows',archiveDate)||'medium';
  else if(mode==='climb'){activeDailyDate=dateKey();state.climb=ladder()?.place||{tier:'medium',index:1,count:Infinity,daily:false};activeTier=state.climb.tier;}
  state.board=mode==='climb'?(state.climb.daily?generateDaily(activeDailyDate,activeTier):generateClimb(activeDailyDate,activeTier,state.climb.index,state.climb.count)):mode==='daily'?generateDaily(activeDailyDate,activeTier):mode==='archive'?generateDaily(archiveDate,activeTier):mode==='tour'?generateTourBoard(tour):mode==='learn'?learn.boards[level]:generateLevel(level);
  state.remaining=[...state.board.paths];state.history=[];state.lives=3;state.hints=3;state.hintsUsed=0;hintedIds.clear();state.attempt=`${Date.now()}-${Math.random()}`;state.elapsed=0;state.ended=false;state.highlighted=null;state.lifeUsed=false;
  state.selected=null;state.identifiers=createIdentifiers(state.board.paths,state.board.size,'numbers');
  const restored=resume&&(mode==='daily'?restoreSession(saved.activeDaily):isPractice(mode)&&restoreSession(saved.activeLevel));
  $('arrow-address').value='';setSelectionStatus('Type an ID to highlight its arrow. Enter fires it.');
  closeModal();
  if(mode==='levels')saved.current=level;
  else if(mode==='daily')recordVisit(saved,activeDailyDate);
  const stop=mode==='tour'?WORLD_TOUR.find(item=>item.id===tour):null;
  $('mode-label').textContent=mode==='daily'?`ZIGGLE #${ziggle()?.dailyNumber?.(activeDailyDate)??''} · ONE FRESH PUZZLE`.replace('# ·','·'):mode==='archive'?`ZIGGLE #${ziggle()?.dailyNumber?.(archiveDate)??''} · FROM THE ARCHIVE`:mode==='climb'?`TODAY’S LADDER${state.climb.daily?` · THE ${TIER_LABEL[activeTier].toUpperCase()}`:' · BONUS LEVEL'}`:mode==='endless'?'ENDLESS PRACTICE':mode==='tour'?'WORLD TOUR':mode==='learn'?'LEARN BY PLAYING':'YOUR NEXT LITTLE CHALLENGE';
  $('level-number').textContent=mode==='climb'?String(state.climb.index+1):mode==='daily'?'puzzle':mode==='archive'?new Date(`${archiveDate}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'}):mode==='tour'?stop.name:mode==='learn'?`${level+1} of ${learn.boards.length}`:String(level+1).padStart(2,'0');
  $('level-prefix').textContent=mode==='climb'?TIER_LABEL[activeTier].split(' ')[0]:mode==='daily'?'Today’s':mode==='archive'?'Archive ·':mode==='tour'?'Tour':mode==='endless'?'Endless':mode==='learn'?'Warm-up':'Level';
  $('difficulty-text').textContent=mode==='climb'?(ziggle()?.ladderLabel?.(state.climb)||'')+(state.climb.daily?' · daily':''):mode==='daily'?TIER_LABEL[activeTier]:mode==='archive'?`Just for fun · ${TIER_LABEL[activeTier].split(' ')[0]}`:mode==='tour'?stop.place:mode==='endless'?`Board ${level-11}`:mode==='learn'?'No hearts to lose':level<4?'Easy does it':level<8?'Find your flow':'Take your time';
  const word=boardWord(state.board.paths.length);$('board-word').textContent=mode==='learn'?'Warm-up':word;document.documentElement?.toggleAttribute?.('data-learn',mode==='learn');
  syncModeSwitch();
  $('shape-label').textContent=shapeLabels[state.board.shape]||'';
  $('timer').textContent=formatTime(state.elapsed);
  message(restored?'Welcome back. Your puzzle is right where you left it.':mode==='learn'?state.board.tip:`${word} board · ${state.board.paths.length} arrows. `+(isTouch()?'Tap an arrow with a clear path.':'Tap an arrow with a clear path, or select one by ID.'));
  const guide=[];
  if(state.board.gates?.length)guide.push('Shape gates open after all arrows with the matching shape leave. The number counts those still on the board.');
  if(state.board.paths.some(p=>p.lock!==undefined))guide.push('Dark numbered badges are locks. Clear the yellow key with the same number first.');
  if(state.board.paths.some(p=>p.link!==undefined))guide.push('Dotted rings link two arrows: both paths must be clear and they leave together.');
  $('piece-guide').open=false;$('piece-guide').hidden=!guide.length;$('piece-guide-text').textContent=guide.join(' ');
  renderBoard();updateHud();saveSession();updateDayNotice();
  if(!state.ended&&!restored)introBoard();
  {const kinds=[(state.board.gates||[]).length&&'gates',state.board.paths.some(p=>p.lock!==undefined)&&'locks',state.board.paths.some(p=>p.link!==undefined)&&'links'].filter(Boolean),fresh=kinds.filter(k=>!(saved.seenPieces||[]).includes(k));
   if(fresh.length&&!state.ended){saved.seenPieces=[...(saved.seenPieces||[]),...fresh];save();message(`New on this board: ${fresh.map(k=>({gates:'gates',locks:'locks and keys',links:'linked pairs'})[k]).join(', ')}. Open Help to see how they work.`);}}
  if(state.ended){
    if(!state.remaining.length&&restored&&mode==='daily'){if(ladder()){startLevel(0,'climb');message(`Today’s daily is done ✓. Keep climbing: ${ladder().label}.`);}else{startLevel(saved.current??0,'levels');message('Today’s daily is done ✓. Here’s your next level. A fresh daily arrives tomorrow.');}return;}
    if(!state.remaining.length)win();else showFailure();
  }
}
function introBoard(){
  const board=$('board');
  if(!board?.classList||calmNow())return;
  const furthest=Math.hypot(300,300);
  for(const path of state.remaining){
    const group=board.querySelector(`[data-id="${path.id}"]`);if(!group?.style?.setProperty)continue;
    const [hx,hy]=geometry(path).at(-1);
    group.style.setProperty('--i',String(Math.round(Math.hypot(hx-300,hy-300)/furthest*650)));
    group.querySelectorAll('.arrow-ink,.arrow-inner').forEach(el=>el.setAttribute('pathLength','100'));
  }
  board.classList.remove('board-enter');void board.getBoundingClientRect?.();board.classList.add('board-enter');
  setTimeout(()=>board.classList.remove('board-enter'),1500);
}
function geometry(path) {
  const step=460/state.board.size,offset=(600-step*(state.board.size-1))/2;
  let points=path.cells.map(([x,y])=>[offset+x*step,offset+y*step]);
  if(points.length===1){const h=points[0];points=[[h[0]-path.direction[0]*step*.45,h[1]-path.direction[1]*step*.45],h];}
  return points;
}
const lineD=points=>points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
const inkD=(points,[dx,dy])=>{const k=(saved.theme==='snakes'?1.25:1)*arrowW(),end=points.at(-1),before=points.at(-2)||end,room=Math.hypot(end[0]-before[0],end[1]-before[1]),cut=Math.min(k,room*.5);return lineD([...points.slice(0,-1),[end[0]-dx*cut,end[1]-dy*cut]]);};
function headD(point,direction) {
  const [x,y]=point,[dx,dy]=direction,w=Math.min(1.4*arrowW(),124/state.board.size),h=w*1.12;
  return `M${x-dx*h+dy*w},${y-dy*h-dx*w} L${x},${y} L${x-dx*h-dy*w},${y-dy*h+dx*w}`;
}
function setShape(group,path,points,hit){const d=lineD(points),ink=inkD(points,path.direction),head=headD(points.at(-1),path.direction);group.querySelectorAll(hit?'.arrow-selection,.arrow-hit':'.arrow-selection').forEach(el=>el.setAttribute('d',d));group.querySelectorAll('.arrow-ink,.arrow-inner').forEach(el=>el.setAttribute('d',ink));group.querySelector('.arrow-head').setAttribute('d',head);group.querySelector('.arrow-shade')?.setAttribute('d',`${ink} ${head}`);}
function renderBoard() {
  const board=$('board'),focusedId=board.contains(document.activeElement)?Number(document.activeElement.dataset.id):null;
  board.className.baseVal=`theme-${saved.theme}${saved.showLabels&&canShowArrowIds()?' show-labels':''}`;$('board-fly').className.baseVal=`theme-${saved.theme}`;
  const aw=arrowW(),lift=(aw*.26).toFixed(2);for(const el of [board,$('board-fly')])el.style.setProperty?.('--aw',`${aw.toFixed(2)}px`);
  for(const id of state.flagged){const p=state.remaining.find(p=>p.id===id);if(!p||free(p).ok)state.flagged.delete(id);}
  const defs=state.board.paths.map(path=>{const p=geometry(path),[a,b]=palette[path.color];return `<linearGradient id="color-${path.id}" gradientUnits="userSpaceOnUse" x1="${p[0][0]}" y1="${p[0][1]}" x2="${p.at(-1)[0]+.1}" y2="${p.at(-1)[1]+.1}"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;}).join('');
  const step=460/state.board.size,offset=(600-step*(state.board.size-1))/2;
  const dots=!saved.gridMarks?'':state.board.paths.flatMap(p=>p.cells).map(([x,y])=>`<circle class="board-dot" cx="${offset+x*step}" cy="${offset+y*step}" r="1.15"/>`).join('');
  const frame=boardFrame(state.board,{offset,step,coordinates:saved.gridMarks,labels:saved.showLabels&&canShowArrowIds(),columnName});
  board.setAttribute('viewBox',frame.viewBox);$('board-fly').setAttribute('viewBox',frame.viewBox);const axes=frame.axes;board.dataset.across=frame.across;document.querySelector('.play-layout')?.toggleAttribute?.('data-big',state.board.paths.length>=90);if(state.board.paths.length<90)document.documentElement?.removeAttribute?.('data-immersive');
  const tabId=state.selected??findDirectionalNeighbor(state.remaining,null,'ArrowRight');
  const paths=state.remaining.map(path=>{
    const points=geometry(path),d=lineD(points),head=points.at(-1),ink=inkD(points,path.direction),hd=headD(head,path.direction),stroke=`url(#color-${path.id})`,direction=path.direction[0]===1?'right':path.direction[0]===-1?'left':path.direction[1]===1?'down':'up';
    const label=state.identifiers.get(path.id),labelWidth=Math.min(step-1,label.length*7.1+7);
    return `<g class="arrow-group${state.highlighted===path.id?' hinted':''}${state.selected===path.id?' selected':''}${state.flagged.has(path.id)?' flagged':''}" data-id="${path.id}" data-label="${label}" role="button" tabindex="${path.id===tabId?0:-1}" aria-label="Arrow ${label}, pointing ${direction}${pieceWords(path)}${state.highlighted===path.id?', hint':''}" aria-describedby="keyboard-help" style="color:${palette[path.color][0]}"><path class="arrow-hit" d="${d}"/><path class="arrow-selection" d="${d}"/><path class="arrow-shade" d="${ink} ${hd}" transform="translate(0 ${lift})"/><path class="arrow-ink" stroke="${stroke}" d="${ink}"/>${saved.theme==='border'?`<path class="arrow-inner" d="${ink}"/>`:''}<path class="arrow-head" stroke="${stroke}" d="${hd}"/>${saved.theme==='snakes'?`<circle class="snake-eye" cx="${head[0]-path.direction[0]*3+path.direction[1]*1.5}" cy="${head[1]-path.direction[1]*3-path.direction[0]*1.5}" r="1.2"/>`:''}${pieceBadges(path,points,step)}<g class="arrow-label" aria-hidden="true" transform="translate(${head[0]},${head[1]-16})"><rect x="${-labelWidth/2}" y="-8" width="${labelWidth}" height="16" rx="4"/><text y="4" textLength="${labelWidth-5}" lengthAdjust="spacingAndGlyphs">${label}</text></g></g>`;
  }).join('');
  const edge=v=>v>0?575:25,laneD=path=>{const head=geometry(path).at(-1),[dx,dy]=path.direction;return `M${head[0].toFixed(1)},${head[1].toFixed(1)} L${(dx?edge(dx):head[0]).toFixed(1)},${(dy?edge(dy):head[1]).toFixed(1)}`;};
  const lanes=state.remaining.filter(path=>saved.lanes||state.highlighted===path.id).map(path=>`<path class="arrow-lane${state.highlighted===path.id?' hinted':''}" data-lane="${path.id}" d="${laneD(path)}"/>`).join('');
  const hinted=state.remaining.find(path=>path.id===state.highlighted),hintDefs=hinted?(()=>{const p=geometry(hinted);return `<linearGradient id="hint-glow" gradientUnits="userSpaceOnUse" x1="${p[0][0]}" y1="${p[0][1]}" x2="${p.at(-1)[0]+.1}" y2="${p.at(-1)[1]+.1}"><stop offset="0" stop-color="#ff4f8b"/><stop offset="1" stop-color="#ffb02e"/></linearGradient>`;})():'';
  const {gates,ties}=piecesSvg(pc(),{offset,step,geometry});
  board.innerHTML=`<defs>${defs}${hintDefs}</defs><g aria-hidden="true">${dots}${axes}</g><g class="lanes" aria-hidden="true">${lanes}</g><g class="ties" aria-hidden="true">${ties}</g>${paths}<g class="gates">${gates}</g>`;
  if(focusedId!==null)board.querySelector(`[data-id="${focusedId}"]`)?.focus({preventScroll:true});
}
function updateHud(){
  $('hearts').innerHTML=Array.from({length:3},(_,i)=>`<span class="heart${i<state.lives?'':' lost'}">${icon('heart')}</span>`).join('');
  $('hearts').setAttribute('aria-label',`${state.lives} lives remaining`);
  const cleared=state.board.paths.length-state.remaining.length,percent=Math.round(cleared/state.board.paths.length*100);
  $('cleared-count').textContent=cleared;$('total-count').textContent=state.board.paths.length;$('progress-fill').style.width=`${percent}%`;$('progress-percent').textContent=`${percent}%`;
  $('hint-count').textContent=state.hints;$('hint-button').disabled=state.hints===0||state.ended;
  $('hint-top-count').textContent=state.hints;$('hint-top').disabled=$('hint-button').disabled;$('lanes-button').setAttribute('aria-pressed',String(saved.lanes));$('grid-button').setAttribute('aria-pressed',String(saved.gridMarks));
  $('theme-button').hidden=state.history.length>0||state.ended;
  $('hearts').dataset.lives=state.lives;
  $('pause-button').disabled=state.ended;
  $('trophy-count').textContent=trophies().filter(t=>t.earned).length;
  updateKeyboardControls();
}
function message(text,kind=''){const el=$('game-message');el.className=`game-message ${kind}`;el.innerHTML=`<span>${icon(kind==='warning'?'help':kind==='success'?'check':'cursor')}</span><span>${text}</span>`;}

function setSelectionStatus(text,invalid=false){
  $('selection-status').textContent=text;
  $('selection-status').classList.toggle('invalid',invalid);
  $('arrow-address').setAttribute('aria-invalid',String(invalid));
}
function updateKeyboardControls(){
  const locked=state.paused||state.ended;
  $('arrow-address').readOnly=locked;
  $('fire-button').disabled=locked||state.selected===null;
  const button=$('board-labels-button');
  button.setAttribute('aria-pressed',String(saved.showLabels));
  button.textContent=saved.showLabels?'IDs on':'IDs off';
  button.setAttribute('aria-label',saved.showLabels?'IDs on: hide arrow IDs':'IDs off: show arrow IDs');
  button.disabled=locked;
  $('arrow-address').inputMode='numeric';
  const example=state.identifiers.values().next().value||'1';
  $('arrow-address').placeholder=`e.g. ${example}`;
  $('board').querySelectorAll('[data-id]').forEach(group=>group.setAttribute('aria-disabled',String(locked)));
}
function selectArrow(id,{focus=false,fill=false,announce=true}={}){
  const path=state.remaining.find(path=>path.id===id);
  state.selected=path?.id??null;
  const tabId=state.selected??findDirectionalNeighbor(state.remaining,null,'ArrowRight');
  $('board').querySelectorAll('[data-id]').forEach(group=>{
    const groupId=Number(group.dataset.id);
    group.classList.toggle('selected',groupId===state.selected);
    group.setAttribute('tabindex',groupId===tabId?'0':'-1');
  });
  if(path){
    const label=state.identifiers.get(path.id);
    if(fill)$('arrow-address').value=label;
    const direction=path.direction[0]===1?'right':path.direction[0]===-1?'left':path.direction[1]===1?'down':'up';
    if(announce)setSelectionStatus(`${label} selected · points ${direction}. Check its path, then press Enter.`);
    if(focus)$('board').querySelector(`[data-id="${path.id}"]`)?.focus({preventScroll:true});
  }
  updateKeyboardControls();
}
function previewAddress(){
  if(state.paused||state.ended)return;
  const value=normalizeIdentifier($('arrow-address').value);
  const entry=[...state.identifiers].find(([,label])=>label===value);
  if(entry&&state.remaining.some(path=>path.id===entry[0])){selectArrow(entry[0]);return;}
  selectArrow(null,{announce:false});
  if(!value){setSelectionStatus('Type an ID to highlight its arrow. Enter fires it.');return;}
  if(entry){setSelectionStatus(`${value} has already escaped. Choose another ID, or Undo.`,true);return;}
  const matches=state.remaining.filter(path=>state.identifiers.get(path.id).startsWith(value));
  setSelectionStatus(matches.length?`${matches.length} matching arrows. Keep typing the full ID.`:'No arrow has that ID. Check the labels and try again.',!matches.length);
}
function clearAddress(){
  $('arrow-address').value='';selectArrow(null,{announce:false});
  setSelectionStatus('Selection canceled. Type an ID or use the board’s arrow keys.');
}
$('arrow-address').addEventListener('input',previewAddress);
$('arrow-command').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&(event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey))event.preventDefault();
});
$('arrow-command').addEventListener('submit',event=>{
  event.preventDefault();
  if(state.paused||state.ended)return;
  previewAddress();
  if(state.selected!==null)tapArrow(state.selected);
});
$('arrow-address').addEventListener('keydown',event=>{
  if(event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return;
  if(event.key==='Enter'&&event.repeat){event.preventDefault();return;}
  if(state.paused||state.ended){if(event.key==='Enter')event.preventDefault();return;}
  if(event.key==='ArrowUp'||event.key==='ArrowDown'){
    event.preventDefault();event.stopPropagation();
    selectArrow(findDirectionalNeighbor(state.remaining,state.selected,event.key),{focus:true,fill:true});
  }else if(event.key==='Escape'){
    event.preventDefault();event.stopPropagation();clearAddress();
  }
});
$('board-labels-button').onclick=()=>{
  if(state.paused||state.ended)return;
  saved.showLabels=!saved.showLabels;save();
  $('board').classList.toggle('show-labels',saved.showLabels&&canShowArrowIds());updateKeyboardControls();
};

function escapeAnimation(path,group,done) {
  const points=geometry(path),last=points.at(-1),[dx,dy]=path.direction,step=460/state.board.size;
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const bodyLength=lengths.at(-1),room=Math.max(0,dx>0?565-last[0]:dx<0?last[0]-35:dy>0?565-last[1]:last[1]-35),travel=room+bodyLength+step*2;
  points.push([last[0]+dx*travel,last[1]+dy*travel]);lengths.push(bodyLength+travel);
  function at(distance){let i=1;while(i<lengths.length-1&&lengths[i]<distance)i++;const t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]);return [points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t];}
  const calm=calmNow(),duration=calm?0:escapeDuration(travel,step),start=performance.now(),generation=state.generation;
  group.classList.add('escaping');group.querySelector('.arrow-label')?.remove();group.querySelector('.snake-eye')?.remove();
  if(!calm)playSound('glide',{dur:duration/1000});
  let sparked=false;
  const trace=s=>{const m=[at(s)];for(let i=1;i<points.length;i++)if(lengths[i]>s&&lengths[i]<s+bodyLength)m.push(points[i]);m.push(at(s+bodyLength));return m;};
  function frame(now){
    if(generation!==state.generation)return;
    const t=duration?Math.min(1,(now-start)/duration):1,shift=travel*t;
    if(!sparked&&shift>=room-4){sparked=true;sparkAtEdge(path,points);}
    setShape(group,path,trace(shift));
    if(t<1)requestAnimationFrame(frame);else{group.remove();done();}
  }requestAnimationFrame(frame);
}
function sparkAtEdge(path,points){
  const board=$('board'),matrix=board.getScreenCTM?.();if(!matrix)return;
  const [dx,dy]=path.direction,head=points[points.length-2]||points.at(-1);
  const edge=[dx>0?565:dx<0?35:head[0],dy>0?565:dy<0?35:head[1]];
  const pt=board.createSVGPoint();pt.x=edge[0];pt.y=edge[1];const screen=pt.matrixTransform(matrix);
  const view=$('board-viewport').getBoundingClientRect();
  const x=Math.max(view.left+6,Math.min(view.right-6,screen.x)),y=Math.max(view.top+6,Math.min(view.bottom-6,screen.y));
  playSound('exit');burst(x,y,{colors:palette[path.color],count:12,spread:62,size:7});haptic(14);
}
function bumpAnimation(path,group){
  const [dx,dy]=path.direction,[hx,hy]=path.cells.at(-1);
  const occupied=new Map();for(const other of state.remaining)if(other.id!==path.id)for(const [x,y] of other.cells)occupied.set(`${x},${y}`,other.id);
  let gap=0,blocker=null;for(let x=hx+dx,y=hy+dy;x>=0&&y>=0&&x<state.board.size&&y<state.board.size;x+=dx,y+=dy){if(occupied.has(`${x},${y}`)){blocker=occupied.get(`${x},${y}`);break;}gap++;}
  const blockerGroup=blocker!==null?$('board').querySelector(`[data-id="${blocker}"]`):null;
  const step=460/state.board.size,reach=(gap+.38)*step;
  const points=geometry(path),last=points.at(-1);
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const bodyLength=lengths.at(-1);points.push([last[0]+dx*(reach+step),last[1]+dy*(reach+step)]);lengths.push(bodyLength+reach+step);
  const at=distance=>{let i=1;while(i<lengths.length-1&&lengths[i]<distance)i++;const t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]||1);return [points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t];};
  const draw=shift=>{const moving=[at(Math.max(0,shift))];for(let i=1;i<points.length;i++)if(lengths[i]>shift&&lengths[i]<shift+bodyLength)moving.push(points[i]);moving.push(at(shift+bodyLength));setShape(group,path,moving,true);};
  const restore=()=>setShape(group,path,geometry(path),true);
  const hit=()=>{tone(false);haptic([35,45,35]);group.classList.add('blocked');blockerGroup?.classList.remove('bumped');blockerGroup?.style?.setProperty?.('--nx',`${dx*3}px`);blockerGroup?.style?.setProperty?.('--ny',`${dy*3}px`);void blockerGroup?.getBoundingClientRect();blockerGroup?.classList.add('bumped');contactFx($('board'),last[0]+dx*reach,last[1]+dy*reach,$('board-viewport'));
    setTimeout(()=>{group.classList.remove('blocked');blockerGroup?.classList.remove('bumped');},520);};
  if(calmNow()){hit();return;}
  const out=Math.min(260,120+gap*28),back=360,start=performance.now(),generation=state.generation;
  group.classList.add('bumping');let struck=false;
  const frame=now=>{
    if(generation!==state.generation||!group.isConnected)return;
    const e=now-start;
    if(e<out){const t=e/out;draw(reach*t*t);}
    else{if(!struck){struck=true;hit();}const t=Math.min(1,(e-out)/back);const spring=Math.cos(t*Math.PI*2.5)*Math.pow(1-t,2);draw(reach*Math.max(-.12,spring));if(t>=1){restore();group.classList.remove('bumping');return;}}
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function missFx(){const v=$('board-viewport');v.classList.remove('miss');void v.offsetWidth;v.classList.add('miss');setTimeout(()=>v.classList.remove('miss'),460);}
function landed(){state.flying--;if(state.flying||state.remaining.length||state.ended)return;if(state.mode==='learn')learnNext();else win();}
function tapArrow(id){
  if(state.paused||state.ended)return;
  const path=state.remaining.find(p=>p.id===id);if(!path)return;
  const group=$('board').querySelector(`[data-id="${id}"]`);
  const returnToBoard=$('board').contains(document.activeElement);
  const returnToCommand=document.activeElement===$('fire-button');
  const byTouch=lastPointer==='touch';
  selectArrow(byTouch?null:id,{fill:!byTouch,announce:!byTouch});
  const check=free(path);
  if(!check.ok){
    const learning=state.mode==='learn';if(!learning)state.lives--;
    state.flagged.add(id);group.classList.add('flagged');missFx();$('arrow-address').value='';if(returnToCommand)$('arrow-address').focus();
    if(check.reason==='blocked')bumpAnimation(path,group);else{tone(false);haptic([35,45,35]);refuseFor(pc(),$('board'),path,group,check);}
    message(learning?'That one is blocked, so it bumps and turns red. Free the arrow in its way first.':state.lives?whyBlocked(path,check):'Out of hearts. A fresh start is one tap away.','warning');updateHud();
    if(!learning)$('hearts').children[state.lives]?.classList.add('going');
    if(!state.lives){state.ended=true;if(state.mode==='daily')recordDailyResult(saved,activeDailyDate,{won:false,lives:0,elapsed:state.elapsed});updateHud();showFailure();}saveSession();return;
  }
  const partner=partnerOf(path),partnerGroup=partner?$('board').querySelector(`[data-id="${partner.id}"]`):null;
  const opened=gatesOpenedBy([path,partner].filter(Boolean)),unlocked=state.remaining.filter(p=>p.lock===path.id||(partner&&p.lock===partner.id));
  state.remaining=state.remaining.filter(p=>p.id!==id&&p.id!==partner?.id);state.history.push(path);if(partner)state.history.push(partner);if(state.mode!=='learn')countArrows(partner?2:1);state.highlighted=null;tone();haptic(12);
  for(const [p,g] of [[path,group],[partner,partnerGroup]])if(p&&g){g.classList.remove('hinted','blocked','flagged','selected');g.remove();$('board-fly').append(g);state.flying++;escapeAnimation(p,g,landed);}
  $('arrow-address').value='';selectArrow(null,{announce:false});renderBoard();
  if(returnToBoard){$('board').setAttribute('tabindex','-1');$('board').focus({preventScroll:true});}
  setSelectionStatus(`${state.identifiers.get(path.id)} escaped. Type the next arrow’s ID.`);
  if(returnToCommand&&[document.body,$('fire-button')].includes(document.activeElement))$('arrow-address').focus();
  updateHud();saveSession();
  if(state.mode!=='learn'||!state.remaining.length)message(!state.remaining.length?'Every arrow found its way out.':partner?`${state.identifiers.get(path.id)} and ${state.identifiers.get(partner.id)} left together.`:unlocked.length?`Key used: ${unlocked.map(p=>state.identifiers.get(p.id)).join(', ')} unlocked.`:opened.length?`The ${opened.map(g=>colourNames[g.color]).join(' and ')} gate is open.`:'A little more room to breathe.','success');
}
function startLearn(boards,then){learn={boards,then};startLevel(0,'learn');}
function learnNext(){const next=state.level+1;if(next<learn.boards.length){startLevel(next,'learn');return;}const then=learn.then;learn=null;then();message('That is all there is to it. Here is a real puzzle.','success');}
let lastPointer='mouse';
$('board').addEventListener('pointerdown',event=>{lastPointer=event.pointerType||'mouse';});
$('board').addEventListener('keydown',()=>{lastPointer='keyboard';},true);
$('board').addEventListener('click',event=>{const group=event.target.closest('[data-id]');if(group)tapArrow(Number(group.dataset.id));});
$('board').addEventListener('focusin',event=>{const group=event.target.closest('[data-id]');if(group)selectArrow(Number(group.dataset.id),{fill:true});});
$('board').addEventListener('keydown',event=>{
  if(event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return;
  const group=event.target.closest('[data-id]');
  if(['Enter',' ','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)||/^[a-z0-9]$/i.test(event.key)){
    event.preventDefault();event.stopPropagation();
    if(state.paused||state.ended)return;
    if(event.key.startsWith('Arrow'))selectArrow(findDirectionalNeighbor(state.remaining,group?Number(group.dataset.id):null,event.key),{focus:true,fill:true});
    else if(event.key==='Escape'){clearAddress();$('arrow-address').focus();}
    else if(event.key==='Enter'||event.key===' '){if(group&&!event.repeat)tapArrow(Number(group.dataset.id));}
    else{$('arrow-address').focus();$('arrow-address').value=event.key;previewAddress();}
  }
});
$('hint-top').onclick=()=>$('hint-button').onclick();
{const fb=$('focus-button'),root=document.documentElement,set=on=>{root?.toggleAttribute?.('data-immersive',on);fb?.setAttribute?.('aria-pressed',String(on));fb?.setAttribute?.('aria-label',on?'Show the page header':'Full-screen board');globalThis.dispatchEvent?.(new Event('resize'));};if(fb)fb.onclick=()=>set(root?.getAttribute?.('data-immersive')===null);}
{const vm=$('view-more');if(vm)vm.onclick=()=>{const bar=document.querySelector('.board-view-controls'),on=bar?.toggleAttribute?.('data-view-open');vm.setAttribute?.('aria-expanded',String(Boolean(on)));};}
$('grid-button').onclick=()=>{saved.gridMarks=!saved.gridMarks;save();renderBoard();updateHud();message(saved.gridMarks?'Grid markers on.':'Grid markers off.');};
$('lanes-button').onclick=()=>{saved.lanes=!saved.lanes;save();renderBoard();updateHud();message(saved.lanes?'Exit lanes on: each arrow shows the way it would go.':'Exit lanes off.');};
$('hint-button').onclick=()=>{if(state.paused||state.ended||!state.hints)return;const available=state.remaining.filter(p=>free(p).ok);const fresh=available.find(p=>!hintedIds.has(p.id)),path=fresh||available.find(p=>p.id!==state.highlighted)||available[0];if(path){if(fresh){state.hints--;state.hintsUsed++;hintedIds.add(path.id);}state.highlighted=path.id;renderBoard();$('board').querySelector(`[data-id="${path.id}"]`)?.scrollIntoView?.({block:'nearest',inline:'nearest'});updateHud();message(`The glowing arrow (${state.identifiers.get(path.id)}) can leave: its way out is clear.`,'success');saveSession();}};
$('restart-button').onclick=()=>startLevel();
let modalReturnFocus, modalBackgroundStates=[];
function showModal(content,type,center=false){
  if(!state.modal){
    modalReturnFocus=document.activeElement;
    modalBackgroundStates=[...document.querySelectorAll('header, .collection-nav, .game-shell')]
      .map(element=>[element,Boolean(element.inert)]);
  }
  state.paused=true;state.modal=type;
  for(const [element] of modalBackgroundStates)element.inert=true;
  updateKeyboardControls();
  const root=$('modal-root');root.hidden=false;root.innerHTML=`<section class="modal${center?' center':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="icon-button modal-close" aria-label="Close dialog">${icon('close')}</button>${content}</section>`;
  root.querySelector('.modal-close')?.addEventListener('click',closeModal);
  (root.querySelector('.primary-button')||root.querySelector('button:not(.modal-close)')||root.querySelector('button'))?.focus();
}
function closeModal(){
  if(state.modal==='win'||state.modal==='failure'){endResult();return;}
  const wasOpen=!!state.modal,previousModal=state.modal;
  $('modal-root').hidden=true;$('modal-root').innerHTML='';state.paused=false;state.modal=null;
  for(const [element,inert] of modalBackgroundStates)element.inert=inert;
  modalBackgroundStates=[];
  updateKeyboardControls();
  if(wasOpen){if(state.ended&&!state.remaining.length)$('continue-arrow').focus();else if(modalReturnFocus?.isConnected)modalReturnFocus.focus();else $('arrow-address').focus();}
  modalReturnFocus=null;
  if(previousModal==='settings'&&state.ended&&state.mode==='daily'){if(!state.remaining.length)win();else showFailure();}
}
function showPause(){if(state.ended||state.flying)return;showModal(`<div class="modal-symbol">${icon('pause')}</div><span class="eyebrow">TAKE A BREATHER</span><h2 id="modal-title">Right where you left off.</h2><p>Your arrows can wait. Come back when you’re ready to find your flow.</p><button class="primary-button" id="resume">Keep playing</button><button class="secondary-button" id="pause-restart">Restart this puzzle</button>`,'pause',true);$('resume').onclick=closeModal;$('pause-restart').onclick=()=>startLevel();}
$('pause-button').onclick=showPause;
function showFailure(){
  state.paused=true;state.modal='failure';updateKeyboardControls();
  showLevelEnd({outcome:'loss',symbol:'♡',kicker:'A NEW PERSPECTIVE',title:'Let’s try that again.',praise:'Look for arrows pointing toward an open edge. Each one you clear makes room for the next.',
    stats:[['arrows cleared',state.board.paths.length-state.remaining.length],['time spent',formatTime(state.elapsed)]],
    life:{label:'Use a life: one more heart, same board',run:()=>{state.lives=1;state.ended=false;state.lifeUsed=true;updateHud();saveSession();message('One more heart. You’ve got this.');}},
    actions:[{id:'retry',label:'Try again',primary:true,run:()=>startLevel()}],onDismiss:()=>{}}).then(endResult);}
function endResult(){if(state.modal!=='win'&&state.modal!=='failure')return;state.modal=null;state.paused=false;updateKeyboardControls();if(state.ended&&!state.remaining.length)$('continue-arrow')?.focus();}
function win(){
  saveSession();state.ended=true;
  playSound('win');haptic([20,60,20,60,40]);
  const previousPoints=dailyStats(saved).points;
  const dailyResult={time:state.elapsed,hearts:state.lives,hints:Math.max(0,3-state.hintsUsed),tier:activeTier,...(state.lifeUsed?{life:true}:{})};
  if(state.mode==='daily'){if(!ziggle()?.helped?.('arrows',activeDailyDate))recordDailyResult(saved,activeDailyDate,{won:true,lives:state.lives,elapsed:state.elapsed});ziggle()?.recordDaily?.('arrows',dailyResult,activeDailyDate);}
  else if(state.mode==='climb'){if(state.climb.daily)ziggle()?.recordDaily?.('arrows',dailyResult,activeDailyDate);ziggle()?.climbDone?.('arrows',state.climb);}
  else if(state.mode==='endless'){saved.endless=Math.max(saved.endless||0,state.level-11);}
  else if(state.mode==='tour'){if(!(saved.tour||[]).includes(state.tour))saved.tour=[...(saved.tour||[]),state.tour];}
  else{
    if(!saved.completed.includes(state.level))saved.completed.push(state.level);
    if(state.lives===3&&!saved.perfect.includes(state.level))saved.perfect.push(state.level);
    saved.unlocked=Math.min(11,Math.max(saved.unlocked,state.level+1));
  }saveSession();updateHud();
  {const n=ladder()?.place;if((state.mode==='daily'||state.mode==='climb')&&n&&!n.daily)buildAhead('climb',dateKey(),n.tier,n.index,n.count);else if(state.mode==='levels'||state.mode==='endless')buildAhead('level',state.level+1);}
  const earnedPoints=dailyStats(saved).points-previousPoints;
  const credits=['levels','endless','tour'].includes(state.mode)||(state.mode==='climb'&&!state.climb.daily)?(ziggle()?.earnLevel?.()||0):0; // earned credits
  const final=state.mode==='levels'&&state.level===11;
  const bestKey=state.mode==='levels'?`l${state.level}`:state.mode==='endless'?`e${state.level-11}`:state.mode==='tour'?`t-${state.tour}`:null;
  const previousBest=bestKey?saved.best?.[bestKey]:undefined,newBest=bestKey&&state.elapsed>0&&(!previousBest||state.elapsed<previousBest);
  if(newBest){saved.best={...saved.best,[bestKey]:state.elapsed};save();}
  const posts=state.mode==='daily'||(state.mode==='climb'&&state.climb.daily);
  const nextLabel=state.mode==='climb'&&ladder()?`Next: ${ladder().label} →`:state.mode==='daily'?'Next puzzle →':final||state.mode==='tour'?'Explore your puzzles':state.mode==='endless'?'Next endless board →':'Next puzzle →';
  const nextRun=()=>{if(state.mode==='archive')location.href='/play/index.html';else if(state.mode==='climb'&&ladder())startLevel(0,'climb');else if(state.mode==='daily')startPractice();else if(final||state.mode==='tour')showLevels();else startLevel(state.level+1,state.mode);};
  const generation=state.generation,open=()=>{if(generation!==state.generation)return;fxConfetti();
  $('piece-guide').hidden=true;{const k=state.remaining;state.remaining=state.board.paths;renderBoard();state.remaining=k;$('board').inert=true;}$('arrow-result-detail').textContent=`${state.board.paths.length} arrows freed · ${formatTime(state.elapsed)} · ${state.lives} of 3 hearts kept`;$('repeat-arrow').onclick=()=>startLevel();
  $('arrow-completion').hidden=false;$('continue-arrow').textContent=nextLabel;$('continue-arrow').onclick=nextRun;
    state.paused=true;state.modal='win';updateKeyboardControls();
  showLevelEnd({outcome:'win',symbol:'✦',
    kicker:state.mode==='climb'?`LADDER · ${ziggle()?.ladderLabel?.(state.climb)?.toUpperCase()||''} DONE`:state.mode==='daily'?'DAILY CHALLENGE COMPLETE':state.mode==='archive'?'FROM THE ARCHIVE · JUST FOR FUN':final?'EVERY PATH, FOUND':'PUZZLE COMPLETE',
    title:'You found your flow.',
    praise:`${credits?`+${credits} ✦ · `:''}${final?'All 12 puzzles cleared. That’s a beautiful kind of focus.':state.mode==='daily'?`Daily complete. ${earnedPoints?`+${earnedPoints} points earned.`:'Your score for this day is already saved.'} A fresh escape awaits tomorrow.`:'A clear board. A clear mind. Ready for another little escape?'}`,
    stats:[['time',formatTime(state.elapsed)+(newBest&&previousBest?' · new best!':'')],...(bestKey&&previousBest&&!newBest?[['your best',formatTime(previousBest)]]:[]),['arrows freed',state.board.paths.length],['hearts kept',`${state.lives} / 3`]],
    note:posts&&state.lifeUsed?'Rescued with a life · not posted to the leaderboard.':undefined,
    actions:[{id:'next',label:nextLabel,primary:true,run:nextRun},...(state.mode==='daily'&&ladder()?[{id:'ladder',label:`More of today: ${ladder().label}`,run:()=>startLevel(0,'climb')}]:[]),{id:'again',label:'Play again',run:()=>startLevel()},
      ...(posts?[{id:'share',label:'Share result',keepOpen:true,run:async()=>(await ziggle()?.share?.('arrows',dailyResult,activeDailyDate))||''}]:[]),
      ...(posts&&!state.lifeUsed&&!ziggle()?.kids?.()?[{id:'post',label:'Post to leaderboard',keepOpen:true,run:()=>{postScore(dailyResult,document.querySelector('dialog.level-end .le-status'));}}]:[])],
    onDismiss:()=>{},focus:()=>$('continue-arrow')}).then(endResult);};
  // Ripple, then the popup.
  if(calmNow())open();else{import('./arrow-extras.js').then(m=>m.ripple($('board-fly'),state.board)).catch(()=>{});setTimeout(open,950);}
}
function showLevels(){
  showModal(`<span class="eyebrow">ONE PUZZLE AT A TIME</span><h2 id="modal-title">Your little escapes.</h2><p>Clear a board to open the next. There’s no rush.</p><div class="level-grid">${LEVELS.map((level,i)=>`<button class="level-cell${i===state.level&&state.mode==='levels'?' current':''}${saved.completed.includes(i)?' completed':''}" data-level="${i}" data-tip="${level.name}: a ${level.size} × ${level.size} ${level.shape} board. ${i<4?'Easy does it: the gentlest tangles.':i<8?'Find your flow: a bigger board, longer chains.':'Take your time: the biggest boards and the longest chains.'}" ${i>saved.unlocked?'disabled':''} aria-label="Level ${i+1}, ${level.name}${i>saved.unlocked?', locked':''}">${String(i+1).padStart(2,'0')}<small>${saved.completed.includes(i)?'Cleared ✓':i>saved.unlocked?'Locked':level.shape}</small></button>`).join('')}</div><p class="modal-note">${saved.completed.length} of 12 puzzles completed</p><h3 class="levels-subtitle">World Tour</h3><p class="modal-note">Boards shaped after famous city landmarks. Open from the start.</p><div class="level-grid tour-grid">${WORLD_TOUR.map(stop=>`<button class="level-cell${(saved.tour||[]).includes(stop.id)?' completed':''}" data-tour="${stop.id}" aria-label="World Tour, ${stop.place}${(saved.tour||[]).includes(stop.id)?', cleared':''}">${stop.name}<small>${(saved.tour||[]).includes(stop.id)?'Cleared ✓':stop.place.split(', ')[1]}</small></button>`).join('')}</div><h3 class="levels-subtitle">Endless practice</h3><p class="modal-note">${saved.completed.length===12?`Fresh boards forever. Best: board ${saved.endless||0}.`:'Clear all twelve puzzles to unlock fresh boards forever.'}</p><button class="secondary-button" id="start-endless" ${saved.completed.length===12?'':'disabled'}>${saved.endless?`Continue at board ${saved.endless+1}`:'Start endless practice'}</button>`,'levels');
  document.querySelectorAll('[data-level]').forEach(el=>el.onclick=()=>startLevel(Number(el.dataset.level),'levels'));
  document.querySelectorAll('[data-tour]').forEach(el=>el.onclick=()=>startLevel(0,'tour',false,el.dataset.tour));
  $('start-endless').onclick=()=>startLevel(12+(saved.endless||0),'endless');
}
$('levels-button').onclick=showLevels;
function showThemes(){
  saveSession();
  const choices=[['gradient','Gradient arrows','Soft colors. Clear directions.'],['border','Gradient borders','A lighter line through the maze.'],['snakes','Snakes','A playful twist on every turn.']];
  showModal(`<span class="eyebrow">MAKE IT YOUR KIND OF CALM</span><h2 id="modal-title">A change of scenery.</h2><p>Same puzzle. A fresh way to see it.</p><div class="theme-options">${choices.map(([id,title,description])=>`<button class="theme-option${saved.theme===id?' active':''}" data-theme="${id}" aria-pressed="${saved.theme===id}"><span class="theme-preview"><svg viewBox="0 0 40 40"><path d="M6 32V10h14v21h14V10m-5 5 5-5 5 5" style="stroke-width:${id==='snakes'?5:id==='border'?4:2.5}"/>${id==='border'?'<path d="M6 32V10h14v21h14V10" style="stroke:#ffffff;stroke-width:1.5"/>':''}</svg></span><span><strong>${title}</strong><small>${description}</small></span>${saved.theme===id?`<span class="theme-check">${icon('check')}</span>`:''}</button>`).join('')}</div><div class="setting-row"><span>Soft sound effects</span><button id="sound-toggle" class="toggle${soundOn()?' on':''}" role="switch" aria-checked="${soundOn()}" aria-label="Sound effects"></button></div><div id="backup-slot"></div><p class="modal-note">Ziggle · Your happy little brain break.<br>Made for small moments of play.</p>`,'settings');
  document.querySelectorAll('[data-theme]').forEach(el=>el.onclick=()=>{saved.theme=el.dataset.theme;save();renderBoard();showThemes();});
  withBackup(b=>{const slot=$('backup-slot');if(!slot)return;slot.innerHTML=b.backupMarkup();b.attachBackupControls({getSaved:()=>saved,setSaved:value=>{saved=value;},save,onRestore:()=>{if(state.mode==='daily')restoreSession(saved.activeDaily);state.selected=null;state.identifiers=createIdentifiers(state.board.paths,state.board.size,'numbers');$('arrow-address').value='';$('timer').textContent=formatTime(state.elapsed);renderBoard();updateHud();updateDailyStats();showThemes();}});});
  $('sound-toggle').onclick=()=>{const on=!soundOn();setSound(on);$('sound-toggle').classList.toggle('on',on);$('sound-toggle').setAttribute('aria-checked',on);if(on)playSound('pop');};
}
$('settings-button').onclick=showThemes;$('theme-button').onclick=showThemes;$('save-status').onclick=showThemes;
$('help-button').onclick=()=>{showModal(`<div class="modal-symbol">${icon('arrow')}</div>${helpBody(state.board)}<button class="primary-button" id="got-it">I’ve got this</button>`,'help',true);$('got-it').onclick=closeModal;};
function trophies(){return [
  {title:'The first escape',description:'Clear your first puzzle.',earned:saved.completed.length>0},
  {title:'A little perfection',description:'Finish a puzzle with all three hearts.',earned:saved.perfect.length>0},
  {title:'Finding your flow',description:'Clear six different puzzles.',earned:saved.completed.length>=6},
  {title:'A daily dose of calm',description:'Complete a daily challenge.',earned:saved.daily.length>0},
  {title:'Every way out',description:'Complete all twelve puzzles.',earned:saved.completed.length===12},
];}
$('trophies-button').onclick=()=>showModal(`<span class="eyebrow">LITTLE WINS, WELL EARNED</span><h2 id="modal-title">Your trophy shelf.</h2><p>${trophies().filter(t=>t.earned).length} of 5 milestones collected. Keep finding your way.</p>${trophies().map(t=>`<div class="trophy-item${t.earned?' earned':''}"><span>${icon('trophy')}</span><div><strong>${t.title}${t.earned?' ✓':''}</strong><small>${t.description}</small></div></div>`).join('')}`,'trophies');
const isToday=()=>state.mode==='daily'||(state.mode==='climb'&&Boolean(state.climb?.daily));
function startPractice(){const p=practiceStart(saved,LEVELS.length);startLevel(p.level,p.mode,p.resume);}
function syncModeSwitch(){$('mode-daily')?.setAttribute('aria-pressed',String(isToday()));$('mode-practice')?.setAttribute('aria-pressed',String(!isToday()));}
$('mode-daily')&&($('mode-daily').onclick=()=>{if(isToday())return;startLevel(8,'daily',!saved.daily.includes(dateKey()));});
$('mode-practice')&&($('mode-practice').onclick=()=>{if(!isToday())return;startPractice();});
function showDaily(){
  const complete=saved.daily.includes(dateKey()),stats=dailyStats(saved);
  showModal(`<div class="modal-symbol">${icon('calendar')}</div><span class="eyebrow">ONE DAY. ONE FRESH PUZZLE.</span><h2 id="modal-title">Your daily escape.</h2><div class="daily-date">${new Date().toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</div><p>${complete?'Today is complete. Play again for fun, or return tomorrow to grow your streak.':'The same puzzle for everyone today. A fresh challenge at your local midnight, no account needed.'}</p><div class="stats-row"><div><strong>${stats.currentStreak}</strong><small>current streak</small></div><div><strong>${stats.bestStreak}</strong><small>best streak</small></div><div><strong>${stats.points}</strong><small>total points</small></div></div><button class="primary-button" id="start-daily">${complete?'Replay today’s puzzle':'Continue daily challenge'}</button><p class="modal-note">Earn 100 points + 25 per remaining heart on your first daily win. Replays never add points.</p><button data-grownups class="secondary-button" id="daily-email">Email me the daily challenge · optional</button>`,'daily',true);
  $('start-daily').onclick=()=>{if(state.mode==='daily'&&activeDailyDate===dateKey()&&!state.ended)closeModal();else startLevel(8,'daily',!complete);};
  $('daily-email').onclick=showEmailSignup;
}
async function postScore(result,status=$('share-status')){
  const hub=ziggle();
  if(!hub||hub.kids()){status.textContent='Leaderboards are off in kids mode.';return;}
  if(!hub.profile().nickname){
    status.innerHTML='<form id="nickname-form" class="nickname-form"><label for="nickname-input">Leaderboard name (shown publicly, not your real name)</label><input id="nickname-input" maxlength="20" autocomplete="off" required><button class="primary-button" type="submit">Save and post</button></form>';
    $('nickname-input').focus();
    $('nickname-form').addEventListener('submit',event=>{
      event.preventDefault();const name=$('nickname-input').value.trim();
      if(!hub.validNickname(name)){$('nickname-input').setAttribute('aria-invalid','true');status.firstChild.querySelector('label').textContent='Use 3–20 letters, numbers, spaces, dots or dashes, kept friendly.';return;}
      const profile=hub.profile();profile.nickname=name;hub.saveProfile(profile);postScore(result,status);
    });
    return;
  }
  status.textContent='Checking your solution…';
  const profile=hub.profile();
  const response=await hub.api('/api/scores/arrows',{method:'POST',queue:true,body:{date:activeDailyDate,tier:activeTier,moves:state.history.map(p=>p.id),blocked:3-result.hearts,hints:result.hints,elapsed:result.time,playerId:hub.playerId(),nickname:profile.nickname,leagues:profile.leagues}});
  if(!status.isConnected)return;
  status.textContent=response.ok?`Verified! You’re #${response.rank} of ${response.total} today.`:response.message||'The leaderboard is unavailable right now.';
}
function showEmailSignup(){
  showModal(`<span class="eyebrow">A LITTLE REMINDER · COMPLETELY OPTIONAL</span><h2 id="modal-title">A daily escape, in your inbox.</h2><p>Get a link to the daily challenge by email. You can always play here without signing up.</p><form id="email-signup" class="email-signup"><label for="reminder-email">Email address</label><input type="email" id="reminder-email" name="email" placeholder="you@example.com" autocomplete="email" maxlength="254" required aria-describedby="email-consent email-status"><p id="email-consent" class="signup-note">By choosing “Email me the challenge”, you’re asking for one daily challenge email. Unsubscribe using the link in any email. Your email is not needed to save your game.</p><button type="submit" class="primary-button" id="subscribe-button">Email me the challenge</button><p id="email-status" class="form-status" role="status" aria-live="polite"></p></form><button class="secondary-button" id="skip-email">Keep playing without email</button>`,'email');
  $('skip-email').onclick=closeModal;
  const form=$('email-signup'),button=$('subscribe-button'),status=$('email-status'),input=$('reminder-email');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(button.disabled||!form.reportValidity())return;
    button.disabled=true;status.textContent='Requesting your daily reminder…';
    const result=await subscribeToDaily(input.value.trim());
    if(!form.isConnected)return;
    status.textContent=result.message;
    if(result.ok){input.value='';input.disabled=true;button.textContent='You’re signed up';}
    else button.disabled=false;
  });
}
$('daily-button').onclick=showDaily;
$('email-button').onclick=showEmailSignup;
function updateDayNotice(){
  $('new-day-button').hidden=!(state.mode==='daily'&&activeDailyDate!==dateKey());
  $('challenge-date').textContent=new Date(`${state.mode==='daily'?activeDailyDate:dateKey()}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
}
$('new-day-button').onclick=()=>startLevel(8,'daily');
$('modal-root').addEventListener('click',event=>{if(event.target===$('modal-root')&&!['win','failure'].includes(state.modal))closeModal();});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return;
  if(event.repeat&&['Enter',' ','Escape','p','P','/'].includes(event.key)){event.preventDefault();return;}
  const editing=event.target.closest('input,textarea,select,[contenteditable="true"]');
  if(event.key==='Escape'&&(state.modal||!editing)&&!['win','failure'].includes(state.modal)){event.preventDefault();if(state.modal)closeModal();else{clearAddress();selectArrow(null,{announce:false});}}
  if(event.key==='/'&&!editing&&!state.modal&&!state.ended){event.preventDefault();$('arrow-address').focus();$('arrow-address').select();}
  if(event.key.toLowerCase()==='p'&&!editing&&!state.modal&&!state.ended)showPause();
  if(event.key==='Tab'&&state.modal){const buttons=[...$('modal-root').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>!el.hidden),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
setInterval(()=>{updateDayNotice();if(!state.paused&&!state.ended&&!document.hidden){state.elapsed++;$('timer').textContent=formatTime(state.elapsed);if(state.elapsed%5===0)saveSession();}},1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!state.ended&&!state.modal)showPause();saveSession();updateDayNotice();});
window.addEventListener('pagehide',()=>{if(!state.ended&&!state.modal)showPause();saveSession();});
function boot(){ const menu=menuResume();
  if(menu&&!archiveDate)startPractice();
  else if(!archiveDate&&ladder()&&ziggle()?.profile?.().days?.[dateKey()]?.arrows&&saved.activeDaily?.date!==dateKey())startLevel(0,'climb');else startLevel(8,archiveDate?'archive':'daily',true);
}
boot();

attachArrowHelp({ state, $, updateHud, saveSession, date: () => activeDailyDate, isNew: () => !archiveDate && !saved.completed.length && !saved.daily.length && !state.history.length && !saved.activeLevel && !saved.collected?.before && !Object.keys(saved.collected?.days || {}).length, learn: boards => startLearn(boards, boot) });
