// --- Drop-in replacement to fix buttons not staying selected ---
// Changes: toggleActive now uses the clicked element explicitly instead of document.activeElement.
// Applies to Event, Detail, Surface, and Team buttons.

// ===== State =====
const state = {
  currentActionType: "",
  currentDetail: "",
  currentSurface: "",
  currentTeam: "",
  half: 1,
  min: 0,
  sec: 0,
  shotsData: [],
  rawShots: [],
  table: null,
  drag: { active: false, x1: null, y1: null, x2: null, y2: null },
};

const pitchEl = document.getElementById("pitch");

function halfsave(){ state.half = Number(document.getElementById("half").value || 1); }
function minsave(){  state.min  = Number(document.getElementById("min").value  || 0); }
function secsave(){  state.sec  = Number(document.getElementById("sec").value  || 0); }
window.halfsave = halfsave; window.minsave = minsave; window.secsave = secsave;

(function restore(){
  try { const rs = sessionStorage.getItem("rawShots"); if (rs) state.rawShots = JSON.parse(rs) || []; } catch {}
  try { const sd = localStorage.getItem("shotsData"); if (sd) state.shotsData = JSON.parse(sd) || []; } catch {}
})();

$(document).ready(function(){
  state.table = $('#event-table').DataTable({
    paging: false,
    info: false,
    responsive: true,
    language: { searchPlaceholder: 'Filter by Detail and Event' }
  });
  if (state.rawShots.length){
    for (const r of state.rawShots){
      addRowToTable(r.event, r.startX, r.startY, r.endX, r.endY, r.time, r.detail, r.surface, r.team, r.half, r.min, r.sec);
    }
  }
});

// ===== Active-state helper (uses clicked element) =====
function toggleActive(className, newValue, currentValue, clickedEl){
  const buttons = document.querySelectorAll('.' + className);
  // Toggle off if clicking same value
  if (newValue === currentValue){
    buttons.forEach(b => b.classList.remove('active'));
    return "";
  }
  // Set new selection
  buttons.forEach(b => b.classList.remove('active'));
  if (clickedEl) clickedEl.classList.add('active');
  return newValue;
}

// Expose handlers that receive the element via inline `call(this, ...)`
function _setActionType(actionType, el){ state.currentActionType = toggleActive('event-button', actionType, state.currentActionType, el); }
function _setDetail(detail, el){        state.currentDetail     = toggleActive('detail-button', detail, state.currentDetail, el); }
function _setSurface(surface, el){      state.currentSurface    = toggleActive('surface-button', surface, state.currentSurface, el); }
function _setTeam(team, el){            state.currentTeam       = toggleActive('team-button', team, state.currentTeam, el); }

window.setActionType = function(action){ _setActionType(action, this); };
window.setDetail     = function(d){      _setDetail(d, this); };
window.setSurface    = function(s){      _setSurface(s, this); };
window.setTeam       = function(t){      _setTeam(t, this); };

// ===== Pitch interactions =====
function normToPitch(clientX, clientY){
  const rect = pitchEl.getBoundingClientRect();
  const nx = ((clientX - rect.left) / pitchEl.offsetWidth) * 120;
  const ny = ((clientY - rect.top)  / pitchEl.offsetHeight) * 80;
  return [Math.round(nx), Math.round(ny)];
}

pitchEl.addEventListener('mousedown', (e)=>{
  if (state.drag.x1 === null){
    state.drag.active = true;
    [state.drag.x1, state.drag.y1] = normToPitch(e.clientX, e.clientY);
  }
});

pitchEl.addEventListener('mousemove', (e)=>{
  if (!state.drag.active) return;
  [state.drag.x2, state.drag.y2] = normToPitch(e.clientX, e.clientY);
});

pitchEl.addEventListener('mouseup', ()=> finishDrag());

function firstTouch(ev){ return (ev.changedTouches?.[0]) || (ev.touches?.[0]); }

pitchEl.addEventListener('touchstart', (e)=>{
  const t = firstTouch(e); if(!t) return;
  if (state.drag.x1 === null){
    state.drag.active = true;
    [state.drag.x1, state.drag.y1] = normToPitch(t.clientX, t.clientY);
  }
},{passive:true});

pitchEl.addEventListener('touchmove', (e)=>{
  const t = firstTouch(e); if(!t || !state.drag.active) return;
  [state.drag.x2, state.drag.y2] = normToPitch(t.clientX, t.clientY);
},{passive:true});

pitchEl.addEventListener('touchend', ()=> finishDrag(), {passive:true});

function finishDrag(){
  if (!state.drag.active) return;
  state.drag.active = false;
  const now = getCurrentDateTime();
  const wasDragged = state.drag.x1!==null && state.drag.y1!==null && state.drag.x2!==null && state.drag.y2!==null && (state.drag.x1!==state.drag.x2 || state.drag.y1!==state.drag.y2);
  const rec = {
    event: state.currentActionType,
    startX: state.drag.x1, startY: state.drag.y1,
    endX: wasDragged ? state.drag.x2 : null,
    endY: wasDragged ? state.drag.y2 : null,
    time: now,
    detail: state.currentDetail,
    surface: state.currentSurface,
    team: state.currentTeam,
    half: state.half, min: state.min, sec: state.sec
  };
  addRowToTable(rec.event, rec.startX, rec.startY, rec.endX, rec.endY, rec.time, rec.detail, rec.surface, rec.team, rec.half, rec.min, rec.sec);
  state.rawShots.push(rec);
  sessionStorage.setItem('rawShots', JSON.stringify(state.rawShots));
  state.shotsData.push({ time: rec.time, detail: rec.detail, action: rec.event, surface: rec.surface, x: rec.startX, y: rec.startY, x2: rec.endX ?? 'N/A', y2: rec.endY ?? 'N/A', half: rec.half, min: rec.min, sec: rec.sec, team: rec.team });
  localStorage.setItem('shotsData', JSON.stringify(state.shotsData));
  state.drag.x1 = state.drag.y1 = state.drag.x2 = state.drag.y2 = null;
}

function getCurrentDateTime(){
  const now = new Date(); const pad = (n)=> String(n).padStart(2,'0');
  return `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function addRowToTable(eventName, startX, startY, endX, endY, time, detail, surface, team, half, min, sec){
  const wasDragged = Number.isFinite(startX) && Number.isFinite(startY) && Number.isFinite(endX) && Number.isFinite(endY) && (startX!==endX || startY!==endY);
  const rowData = [ time, detail||'', eventName||'', surface||'', startX??'', startY??'', wasDragged?endX:'N/A', wasDragged?endY:'N/A', half??'', min??'', sec??'', team||'', "<button class='btn btn-outline-danger remove-button'>X</button>" ];
  const rowIdx = state.table.row.add(rowData).draw().index();
  const rowNode = state.table.row(rowIdx).node();
  rowNode.dataset.dotx = (startX*1.0)/120; rowNode.dataset.doty = (startY*1.0)/80;
  if (wasDragged){ rowNode.dataset.dotx2 = (endX*1.0)/120; rowNode.dataset.doty2 = (endY*1.0)/80; } else { delete rowNode.dataset.dotx2; delete rowNode.dataset.doty2; }
  $(rowNode).on('mouseenter', function(){ showDot(this); }).on('mouseleave', function(){ removeDot(); });
  $(rowNode).find('.remove-button').on('click', function(){ removeShot(this); });
  $(rowNode).trigger('mouseenter');
}

function removeShot(button){
  const row = $(button).closest('tr');
  const idx = state.table.row(row).index();
  if (idx !== undefined && idx >= 0){
    state.shotsData.splice(idx,1); localStorage.setItem('shotsData', JSON.stringify(state.shotsData));
    state.rawShots.splice(idx,1);  sessionStorage.setItem('rawShots', JSON.stringify(state.rawShots));
  }
  removeDot(); state.table.row(row).remove().draw();
}

function showDot(rowNode){
  removeDot();
  const dx = parseFloat(rowNode.dataset.dotx), dy = parseFloat(rowNode.dataset.doty);
  if (Number.isFinite(dx) && Number.isFinite(dy)){
    const x1 = dx * pitchEl.offsetWidth, y1 = dy * pitchEl.offsetHeight; createDot(x1, y1, 'hover-dot-1');
    const dx2 = parseFloat(rowNode.dataset.dotx2), dy2 = parseFloat(rowNode.dataset.doty2);
    if (Number.isFinite(dx2) && Number.isFinite(dy2)){
      const x2 = dx2 * pitchEl.offsetWidth, y2 = dy2 * pitchEl.offsetHeight; createDot(x2, y2, 'hover-dot-2'); createArrow(x1, y1, x2, y2, 'hover-arrow');
    }
  }
}

function createDot(x,y,id){ const dot = document.createElement('div'); dot.id=id; dot.className='dot'; dot.style.left=`${x}px`; dot.style.top=`${y}px`; pitchEl.appendChild(dot); }
function removeDot(){ ['hover-dot-1','hover-dot-2','hover-arrow'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); }); }

function createArrow(x1,y1,x2,y2,id){
  const minX=Math.min(x1,x2), minY=Math.min(y1,y2); const width=Math.abs(x2-x1), height=Math.abs(y2-y1);
  const svgns='http://www.w3.org/2000/svg'; const svg=document.createElementNS(svgns,'svg');
  svg.setAttribute('height', height+20); svg.setAttribute('width', width+20); svg.style.position='absolute'; svg.style.left=`${minX-10}px`; svg.style.top=`${minY-10}px`; svg.id=id; svg.classList.add('arrow');
  const defs=document.createElementNS(svgns,'defs'); const marker=document.createElementNS(svgns,'marker'); marker.setAttribute('id','markerArrow'); marker.setAttribute('markerWidth','13'); marker.setAttribute('markerHeight','13'); marker.setAttribute('refX','2'); marker.setAttribute('refY','6'); marker.setAttribute('orient','auto'); const path=document.createElementNS(svgns,'path'); path.setAttribute('d','M2,2 L2,11 L10,6 L2,2'); path.style.fill='black'; marker.appendChild(path); defs.appendChild(marker); svg.appendChild(defs);
  const angle=Math.atan2(y2-y1, x2-x1); const arrowheadLength=22; const adjustX=arrowheadLength*Math.cos(angle); const adjustY=arrowheadLength*Math.sin(angle); const ax2=x2-adjustX, ay2=y2-adjustY;
  const line=document.createElementNS(svgns,'line'); line.setAttribute('x1', x1-minX+10); line.setAttribute('y1', y1-minY+10); line.setAttribute('x2', ax2-minX+10); line.setAttribute('y2', ay2-minY+10); line.setAttribute('stroke','black'); line.setAttribute('stroke-width','2'); line.setAttribute('marker-end','url(#markerArrow)'); svg.appendChild(line);
  pitchEl.appendChild(svg);
}

function downloadCSV(){
  fetch('/download_csv', { method:'POST', body: JSON.stringify(state.shotsData), headers:{ 'Content-Type':'application/json' } })
  .then(r=> r.blob())
  .then(blob=>{ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='shots_data.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); })
  .catch(err=> console.error('CSV error:', err));
}
window.downloadCSV = downloadCSV;

// Keyboard shortcuts retained

document.addEventListener('keydown', function(event){
  const eventButtons = document.querySelectorAll('.event-button');
  const teamButtons  = document.querySelectorAll('.team-button');
  const ek = { 'A':0,'S':1,'D':2,'F':3,'G':4,'H':5,'J':6,'K':7,'L':8,';':9,'.':10,',':11,'/':12 };
  const tk = { 'N':0,'M':1 };
  const k = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (ek.hasOwnProperty(k)){ const idx = ek[k]; if (idx < eventButtons.length) eventButtons[idx].click(); }
  if (tk.hasOwnProperty(k)){ const idx = tk[k]; if (idx < teamButtons.length)  teamButtons[idx].click(); }
});

// === Power-tagging shortcuts ===
// Detail & Surface hotkeys, Undo last tag, and Time nudges (sec & min)
(function(){
  // --- helpers ---
  function byId(id){ return document.getElementById(id); }
  function setFieldValue(id, val){ const el = byId(id); if(!el) return; el.value = String(val); el.dispatchEvent(new Event('change')); }
  function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

  function adjustSeconds(delta){
    const secEl = byId('sec'); const minEl = byId('min');
    if (!secEl || !minEl) return;
    let sec = Number(secEl.value || 0);
    let min = Number(minEl.value || 0);
    let total = min * 60 + sec + delta;
    if (total < 0) total = 0;
    const newMin = Math.floor(total / 60);
    const newSec = total % 60;
    setFieldValue('min', newMin);
    setFieldValue('sec', newSec);
  }

  function adjustMinutes(delta){
    const minEl = byId('min'); if (!minEl) return;
    const cur = Number(minEl.value || 0);
    const next = Math.max(0, cur + delta);
    setFieldValue('min', next);
  }

  function undoLast(){
    const tbody = document.querySelector('#event-table tbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    const last = rows[rows.length - 1];
    if (!last) return;
    last.querySelector('.remove-button')?.click();
  }

  function clickButtonByText(classSel, text){
    const target = text.toLowerCase();
    const btn = Array.from(document.querySelectorAll(classSel))
      .find(b => (b.textContent || '').toLowerCase().includes(target));
    if (btn) btn.click();
  }

  // --- Hotkey maps ---
  const detailKeyMap = {
    'Q':'goal', 'W':'on target', 'E':'off target', 'R':'blocked',
    'T':'complete', 'Y':'incomplete', 'U':'offside', 'I':'won ball', 'O':'lost ball'
  };
  const surfaceKeyMap = {
    'Z':'foot', 'X':'head', 'C':'volley', 'V':'punt', 'B':'pass', 'N':'throw'
  };

  // --- Keyboard handler ---
  document.addEventListener('keydown', function(e){
    // Avoid repeated firing when key is held
    if (e.repeat) return;
    const k = (e.key && e.key.length === 1) ? e.key.toUpperCase() : e.key;

    // Detail hotkeys
    if (detailKeyMap[k]) { clickButtonByText('.detail-button', detailKeyMap[k]); return; }
    // Surface hotkeys
    if (surfaceKeyMap[k]) { clickButtonByText('.surface-button', surfaceKeyMap[k]); return; }

    // Undo last tag: Ctrl/Cmd + Z
    if ((e.ctrlKey || e.metaKey) && (k === 'Z')) { e.preventDefault(); undoLast(); return; }

    // Seconds nudge: '[' / ']' (±1 sec), Shift for ±5 sec
    if (k === '[' || k === ']') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      adjustSeconds(k === ']' ? +step : -step);
      return;
    }

    // Minutes nudge: '-' / '=' (±1 min), Shift for ±5 min
    if (k === '-' || k === '_' || k === '=' || k === '+') {
      e.preventDefault();
      const base = (k === '=' || k === '+') ? +1 : -1;
      const step = e.shiftKey ? 5 : 1;
      adjustMinutes(base * step);
      return;
    }
  });
})();

