// ===============================
// Football Event Tracker — index.js (organized)
// ===============================
// Sections
//   1) State & persistence
//   2) DataTable init
//   3) UI active-state helpers
//   4) Pitch interactions
//   5) Row / storage helpers
//   6) CSV export (server POST)
//   7) Keyboard shortcuts (events/details/surfaces/teams/player/undo/time)
//   8) Button labels (adds (Key) to buttons in the UI)

// -------------------------------
// 1) State & persistence
// -------------------------------
const state = {
  currentActionType: "",
  currentDetail: "",
  currentPassDetail: "",
  currentSurface: "",
  currentTeam: "",
  currentPlayer: "",
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

// -------------------------------
// 2) DataTable init
// -------------------------------
$(document).ready(function(){
  state.table = $('#event-table').DataTable({
    paging: false,
    info: false,
    responsive: true,
    language: { searchPlaceholder: 'Filter by Detail and Event' }
  });

  if (state.rawShots.length){
    for (const r of state.rawShots){
      addRowToTable(
        r.event, r.startX, r.startY, r.endX, r.endY,
        r.time, r.detail, r.passDetail || "", r.surface,
        r.half, r.min, r.sec, r.player || "", r.team || ""
      );
    }
  }
});

// -------------------------------
// 3) UI active-state helpers
// -------------------------------
function toggleActive(className, newValue, currentValue, clickedEl){
  const buttons = document.querySelectorAll('.' + className);
  if (newValue === currentValue){
    buttons.forEach(b => b.classList.remove('active'));
    return "";
  }
  buttons.forEach(b => b.classList.remove('active'));
  if (clickedEl) clickedEl.classList.add('active');
  return newValue;
}

function _setActionType(actionType, el){ state.currentActionType = toggleActive('event-button', actionType, state.currentActionType, el); }
function _setDetail(detail, el){        state.currentDetail     = toggleActive('detail-button', detail, state.currentDetail, el); }
function _setPassDetail(detail, el){    state.currentPassDetail = toggleActive('pass-detail-button', detail, state.currentPassDetail, el); }
function _setSurface(surface, el){      state.currentSurface    = toggleActive('surface-button', surface, state.currentSurface, el); }
function _setTeam(team, el){            state.currentTeam       = toggleActive('team-button', team, state.currentTeam, el); }
function _setPlayer(player, el){        state.currentPlayer     = toggleActive('player-button', player, state.currentPlayer, el); } // NEW

window.setActionType = function(action){ _setActionType(action, this); };
window.setDetail     = function(d){      _setDetail(d, this); };
window.setPassDetail = function(d){      _setPassDetail(d, this); };
window.setSurface    = function(s){      _setSurface(s, this); };
window.setTeam       = function(t){      _setTeam(t, this); };
window.setPlayer     = function(p){      _setPlayer(p, this); }; // NEW

function syncPassDetailBin(){
  const isPass = state.currentActionType === 'pass';
  const bin = document.getElementById('pass-detail-bin');
  const btns = document.querySelectorAll('.pass-detail-button');

  // Show/hide the bin
  if (bin) bin.classList.toggle('d-none', !isPass);

  // Enable/disable the buttons for visual feedback
  btns.forEach(b => {
    b.disabled = !isPass;
    b.classList.toggle('disabled', !isPass);
  });

  // If not pass, clear selection from UI + state
  if (!isPass){
    state.currentPassDetail = "";
    document.querySelectorAll('.pass-detail-button.active').forEach(b => b.classList.remove('active'));
  }
}

document.addEventListener('DOMContentLoaded', syncPassDetailBin);

function _setActionType(actionType, el){
  state.currentActionType = toggleActive('event-button', actionType, state.currentActionType, el);
  syncPassDetailBin(); // <- add this line
}

function _setPassDetail(detail, el){
  if (state.currentActionType !== 'pass') return; // ignore if not Pass
  state.currentPassDetail = toggleActive('pass-detail-button', detail, state.currentPassDetail, el);
}

// Clear selections that should reset after each tag
function clearAutoClearedBins(){
  // Surface
  state.currentSurface = "";
  document.querySelectorAll('.surface-button.active')
    .forEach(b => b.classList.remove('active'));

  // Pass Detail
  state.currentPassDetail = "";
  document.querySelectorAll('.pass-detail-button.active')
    .forEach(b => b.classList.remove('active'));

  // Player
  state.currentPlayer = "";
  document.querySelectorAll('.player-button.active')
    .forEach(b => b.classList.remove('active'));
}


// -------------------------------
// 4) Pitch interactions
// -------------------------------
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
    passDetail: state.currentPassDetail,
    surface: state.currentSurface,
    player: state.currentPlayer,         // NEW
    team: state.currentTeam,
    half: state.half, min: state.min, sec: state.sec
  };
  addRowToTable(
    rec.event, rec.startX, rec.startY, rec.endX, rec.endY,
    rec.time, rec.detail, rec.passDetail, rec.surface,
    rec.half, rec.min, rec.sec, rec.player, rec.team
  );
  state.rawShots.push(rec);
  sessionStorage.setItem('rawShots', JSON.stringify(state.rawShots));
  state.shotsData.push({
    time: rec.time,
    detail: rec.detail,
    pass_detail: rec.passDetail,
    action: rec.event,
    surface: rec.surface,
    x: rec.startX, y: rec.startY,
    x2: wasDragged ? rec.endX : 'N/A',
    y2: wasDragged ? rec.endY : 'N/A',
    half: rec.half, min: rec.min, sec: rec.sec,
    player: rec.player,                  // NEW
    team: rec.team
  });
  localStorage.setItem('shotsData', JSON.stringify(state.shotsData));
  // ✅ Auto-clear these bins after logging a tag
  clearAutoClearedBins();
  state.drag.x1 = state.drag.y1 = state.drag.x2 = state.drag.y2 = null;
}

// -------------------------------
// 5) Row / storage helpers
// -------------------------------
function getCurrentDateTime(){
  const now = new Date(); const pad = (n)=> String(n).padStart(2,'0');
  return `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function addRowToTable(eventName, startX, startY, endX, endY, time, detail, passDetail, surface, half, min, sec, player, team){
  const wasDragged = Number.isFinite(startX) && Number.isFinite(startY) && Number.isFinite(endX) && Number.isFinite(endY) && (startX!==endX || startY!==endY);

  // Header order (with new "player" before "team"):
  // time, detail, pass detail, event, surface, x1, y1, x2, y2, half, min, sec, player, team, X
  const rowData = [
    time,
    detail || '',
    passDetail || '',
    eventName || '',
    surface || '',
    startX ?? '',
    startY ?? '',
    wasDragged ? endX : 'N/A',
    wasDragged ? endY : 'N/A',
    half ?? '',
    min ?? '',
    sec ?? '',
    player || '',
    team || '',
    "<button class='btn btn-outline-danger remove-button'>X</button>"
  ];

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

// -------------------------------
// 6) CSV export (client-side from the DataTable)
// -------------------------------
function downloadCSV(){                  // keeps your navbar button working
  exportFromTable(true);                 // true = export FILTERED rows (what you see)
}
window.downloadCSV = downloadCSV;

// If you ever want an "Export All" button:
// window.downloadCSVAll = () => exportFromTable(false);

function exportFromTable(onlyFiltered = true){
  try {
    if (!state || !state.table) {
      console.error('DataTable not ready for export');
      return;
    }

    const api = state.table;

    // Build headers from THEAD and ignore the last "X" column if present
    const ths = Array.from(document.querySelectorAll('#event-table thead th'));
    let colCount = ths.length;
    if (colCount > 0 && (ths[colCount - 1].textContent || '').trim().toUpperCase() === 'X') {
      colCount -= 1;
    }
    const headers = ths.slice(0, colCount).map(th => (th.textContent || '').trim());

    // Pull rows from DataTables (filtered vs all)
    const dt = onlyFiltered ? api.rows({ search: 'applied' }) : api.rows();
    const rows = dt.data().toArray();

    // CSV escaping helper
    const escapeCSV = (v) => {
      let s = v == null ? '' : String(v);
      s = s.replace(/<[^>]*>/g, '');          // strip any HTML
      s = s.replace(/\r?\n/g, ' ').trim();     // flatten newlines/whitespace
      if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const lines = [];
    lines.push(headers.map(escapeCSV).join(','));
    for (const r of rows) {
      // r is the row array from DataTables; slice to drop the delete button column
      const cells = r.slice(0, colCount).map(escapeCSV);
      lines.push(cells.join(','));
    }

    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer revocation to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 0);

  } catch (err) {
    console.error('CSV export error:', err);
  }
}

// -------------------------------
// 7) Keyboard shortcuts (no team hotkeys; Player = 1/2/3/4)
// -------------------------------
(function(){
  // --- maps ---
  const EVENT_HOTKEYS = [
    ['A','pass'], ['S','shot'], ['D','dribble'], ['F','tackle'],
    ['G','interception'],
    ['J','clearance'], ['K','corner'], ['L','throw in'],
    [';','free kick'], ['.','free kick shot'], [',','goal kick'], ['/','goalie restart'],
    ['P','foul']
  ];

  // Detail layout you chose
  const DETAIL_HOTKEYS = [
    ['T','complete'], ['Y','incomplete'], ['R','blocked'],
    ['Q','goal'], ['W','on target'], ['E','off target'],
    ['I','won ball'], ['O','lost ball'],
    ['U','injury'],
    ['H','half']
  ];

  const SURFACE_HOTKEYS = [['Z','foot'], ['X','head'], ['C','volley'], ['V','punt'], ['B','pass']];
  const SURFACE_THROW_SHIFT_KEY = 'T'; // ⇧T for 'throw'

  // NEW: Player on number keys (no Shift)
  const PLAYER_HOTKEYS = [['1','GK'], ['2','def'], ['3','mid'], ['4','fwd']];

  // --- helpers ---
  const norm = s => (s||'').toLowerCase();
  function clickByText(selector, needle){
    const btn = Array.from(document.querySelectorAll(selector))
      .find(b => norm(b.textContent).includes(norm(needle)));
    if (btn) btn.click();
  }
  function undoLast(){
    const tbody = document.querySelector('#event-table tbody'); if (!tbody) return;
    const rows = tbody.querySelectorAll('tr'); const last = rows[rows.length-1]; if (!last) return;
    last.querySelector('.remove-button')?.click();
  }
  function setFieldValue(id, val){ const el = document.getElementById(id); if(!el) return; el.value = String(val); el.dispatchEvent(new Event('change')); }
  function adjustSeconds(delta){
    const sEl = document.getElementById('sec'); const mEl = document.getElementById('min'); if (!sEl || !mEl) return;
    let total = Number(mEl.value||0)*60 + Number(sEl.value||0) + delta; if (total < 0) total = 0;
    const newMin = Math.floor(total/60), newSec = total % 60; setFieldValue('min', newMin); setFieldValue('sec', newSec);
  }
  function adjustMinutes(delta){
    const mEl = document.getElementById('min'); if(!mEl) return;
    const next = Math.max(0, Number(mEl.value||0) + delta);
    setFieldValue('min', next);
  }

  document.addEventListener('keydown', function(e){
    if (e.repeat) return;

    const key = (e.key && e.key.length === 1) ? e.key.toUpperCase() : e.key;

    // Undo: Ctrl/Cmd+Z
    if ((e.ctrlKey || e.metaKey) && key === 'Z'){ e.preventDefault(); undoLast(); return; }

    // Time nudges: seconds [ ] (+Shift = ±5), minutes -/=
    if (key === '[' || key === ']'){ e.preventDefault(); adjustSeconds(e.shiftKey ? (key === ']' ? +5 : -5) : (key === ']' ? +1 : -1)); return; }
    if (key === '-' || key === '_' || key === '=' || key === '+'){ e.preventDefault(); adjustMinutes((key === '=' || key === '+') ? (e.shiftKey ? +5 : +1) : (e.shiftKey ? -5 : -1)); return; }

    // ✅ Player hotkeys on 1/2/3/4
    for (const [k,txt] of PLAYER_HOTKEYS){
      if (key === k){ e.preventDefault(); clickByText('.player-button', txt); return; }
    // Reset seconds to 0  →  Shift+0
    if (e.shiftKey && (key === '0' || key === ')')) { // browsers report ')' for Shift+0
      e.preventDefault();
      // If you have setFieldValue in this scope, use it:
      if (typeof setFieldValue === 'function') {
        setFieldValue('sec', 0);
      } else {
        const s = document.getElementById('sec');
      if (s) { s.value = '0'; s.dispatchEvent(new Event('change')); }
      }
      return;
    }
    
    }

    // Events
    for (const [k,txt] of EVENT_HOTKEYS){ if (key === k){ e.preventDefault(); clickByText('.event-button', txt); return; } }

    // Details
    for (const [k,txt] of DETAIL_HOTKEYS){ if (key === k){ e.preventDefault(); clickByText('.detail-button', txt); return; } }

    // Surfaces (+ Throw = Shift+T)
    for (const [k,txt] of SURFACE_HOTKEYS){ if (key === k){ e.preventDefault(); clickByText('.surface-button', txt); return; } }
    if (e.shiftKey && key === SURFACE_THROW_SHIFT_KEY){ e.preventDefault(); clickByText('.surface-button','throw'); return; }

    // ⛔️ No team hotkeys anymore (intentionally removed)
  }, true);

  // -------------------------------
  // 8) Button labels — keep in sync with hotkeys
  // -------------------------------
  function stripParen(s){ return (s||'').replace(/\s*\([^)]+\)\s*$/,''); }
  function labelButtons(){
    // Events
    for (const [k,txt] of [
      ['A','pass'], ['S','shot'], ['D','dribble'], ['F','tackle'], ['G','interception'],
      ['J','clearance'], ['K','corner'], ['L','throw in'], [';','free kick'], ['.','free kick shot'], [',','goal kick'], ['/','goalie restart'], ['P','foul']
    ]){
      const btn = Array.from(document.querySelectorAll('.event-button')).find(b => (b.textContent||'').toLowerCase().includes(txt));
      if (btn) btn.textContent = `${stripParen(btn.textContent)} (${k})`;
    }

    // Details
    for (const [k,txt] of [['T','complete'], ['Y','incomplete'], ['R','blocked'], ['Q','goal'], ['W','on target'], ['E','off target'], ['I','won ball'], ['O','lost ball'], ['U','injury'], ['H','half']]){
      const btn = Array.from(document.querySelectorAll('.detail-button')).find(b => (b.textContent||'').toLowerCase().includes(txt));
      if (btn) btn.textContent = `${stripParen(btn.textContent)} (${k})`;
    }

    // Player — label with (1)/(2)/(3)/(4)
    for (const [k,txt] of [['1','gk'], ['2','def'], ['3','mid'], ['4','fwd']]){
      const btn = Array.from(document.querySelectorAll('.player-button')).find(b => (b.textContent||'').toLowerCase().includes(txt));
      if (btn) btn.textContent = `${stripParen(btn.textContent)} (${k})`;
    }

    // Surfaces (Throw is ⇧T)
    for (const [k,txt] of [['Z','foot'], ['X','head'], ['C','volley'], ['V','punt'], ['B','pass']]){
      const btn = Array.from(document.querySelectorAll('.surface-button')).find(b => (b.textContent||'').toLowerCase().includes(txt));
      if (btn) btn.textContent = `${stripParen(btn.textContent)} (${k})`;
    }
    const throwBtn = Array.from(document.querySelectorAll('.surface-button')).find(b => (b.textContent||'').toLowerCase().includes('throw'));
    if (throwBtn){ throwBtn.textContent = `${stripParen(throwBtn.textContent)} (⇧T)`; }
  }
  document.addEventListener('DOMContentLoaded', labelButtons);
})();

// -------------------------------
// Hotkey Help overlay (toggle with '?')
// -------------------------------
(function(){
  function parseLabelAndKey(text){
    const m = (text||'').match(/\s*\(([^)]+)\)\s*$/);
    const key = m ? m[1] : '';
    const label = m ? (text||'').replace(/\s*\([^)]+\)\s*$/,'').trim() : (text||'').trim();
    return { label, key };
  }

  function buildSectionHTML(title, selector){
    const buttons = Array.from(document.querySelectorAll(selector));
    if (!buttons.length) return '';
    const rows = buttons.map(b=>{
      const {label, key} = parseLabelAndKey(b.textContent||'');
      if (!key) return ''; // skip items without a hotkey (e.g., Teams)
      return `<tr><td>${label}</td><td class="hk-key">${key}</td></tr>`;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `<h6>${title}</h6><table class="table table-sm"><tbody>${rows}</tbody></table>`;
  }

  function renderHotkeyHelp(){
    const root = document.getElementById('hotkey-help'); if (!root) return;
    const body = root.querySelector('.hotkey-help-body'); if (!body) return;

    const sections = [
      ['Events', '.event-button'],
      ['Detail', '.detail-button'],
      ['Pass Detail', '.pass-detail-button'],
      ['Surface', '.surface-button'],
      ['Player', '.player-button'],
    ];
    const html = sections.map(([t,sel])=> buildSectionHTML(t, sel)).join('') + `
      <h6>Global</h6>
      <table class="table table-sm"><tbody>
        <tr><td>Undo last</td><td class="hk-key">Ctrl/Cmd+Z</td></tr>
        <tr><td>Nudge seconds</td><td class="hk-key">[ / ] (Shift = ±5s)</td></tr>
        <tr><td>Nudge minutes</td><td class="hk-key">- / = (Shift = ±5m)</td></tr>
        <tr><td>Show/Hide this help</td><td class="hk-key">?</td></tr>
        <tr><td>Close</td><td class="hk-key">Esc</td></tr>
      </tbody></table>`;
    body.innerHTML = html;
  }

  function toggleHotkeyHelp(force){
    const root = document.getElementById('hotkey-help'); if (!root) return;
    const show = force != null ? !!force : root.classList.contains('d-none');
    if (show){ renderHotkeyHelp(); root.classList.remove('d-none'); }
    else { root.classList.add('d-none'); }
  }

  // Toggle with '?' (or Shift+'/') and close with Esc
  document.addEventListener('keydown', function(e){
    const key = e.key || '';
    if (key === '?' || (e.shiftKey && key === '/')) { e.preventDefault(); toggleHotkeyHelp(); }
    else if (key === 'Escape') { toggleHotkeyHelp(false); }
  });

  // Click backdrop or × to close
  document.addEventListener('click', function(e){
    const root = document.getElementById('hotkey-help');
    if (!root || root.classList.contains('d-none')) return;
    if (e.target === root || e.target.closest('.hotkey-help-close')) {
      toggleHotkeyHelp(false);
    }
  });

  // Optional: expose a function for a navbar button
  window.showHotkeys = ()=> toggleHotkeyHelp(true);
})();

