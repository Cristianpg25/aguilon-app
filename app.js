/* Aguilón 22K · lógica de la app.
   Datos: localStorage del propio iPhone (clave KEY). Sin servidor. */
(() => {
'use strict';

const P = window.PLAN;
const KEY = 'aguilon22k:v1';
const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- DOM helpers (texto siempre con textContent) ---------- */
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v; // solo para SVG fijos escritos aquí
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
function s(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
const ICON = {
  ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ok" d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  part: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="part" d="M6 12h12"/></svg>',
  no: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="no" d="M7 7l10 10M17 7 7 17"/></svg>',
  todo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="todo" cx="12" cy="12" r="8"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  share: '<svg class="share" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>'
};

/* ---------- fechas ---------- */
const pad = n => String(n).padStart(2, '0');
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const D = str => { const [y, m, d] = str.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const iso = dt => dt.toISOString().slice(0, 10);
const addDays = (str, n) => { const d = D(str); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dow = str => D(str).getUTCDay();
const diffDays = (a, b) => Math.round((D(b) - D(a)) / 864e5);
const qHoy = new URLSearchParams(location.search).get('hoy');
const TODAY = /^\d{4}-\d{2}-\d{2}$/.test(qHoy || '') ? qHoy : isoLocal(new Date());
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIA_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const dayNum = str => Number(str.slice(8));
const monIdx = str => Number(str.slice(5, 7)) - 1;
const longDate = str => `${DIA[dow(str)]} ${dayNum(str)} de ${MES[monIdx(str)]}`;
const rangeLbl = (a, b) => monIdx(a) === monIdx(b) ? `${dayNum(a)}–${dayNum(b)} ${MES_C[monIdx(b)]}` : `${dayNum(a)} ${MES_C[monIdx(a)]} – ${dayNum(b)} ${MES_C[monIdx(b)]}`;

/* ---------- plan ---------- */
const WEEKS = P.WEEKS.map((wk, i) => {
  const n = i + 1, mon = addDays(P.START, 7 * i), swap = n >= P.LEG_SWAP_FROM;
  return Object.assign({}, wk, {n, mon, sat: addDays(mon, 5), sun: addDays(mon, 6),
    legMon: swap ? wk.B : wk.A, legWed: swap ? wk.A : wk.B,
    planMin: wk.run.reduce((a, r) => a + r.min, 0)});
});
const SESS = {};
WEEKS.forEach(w => [1, 3, 5].forEach((off, k) => {
  const date = addDays(w.mon, off);
  SESS[date] = Object.assign({}, w.run[k], {date, w: w.n, k});
}));
const weekOf = date => {
  const i = Math.floor(diffDays(P.START, date) / 7);
  return i >= 0 && i < WEEKS.length ? WEEKS[i] : null;
};
const TAG = {
  suave: 'Rodaje suave', cuestas: 'Cuestas', larga: 'Tirada larga', test: 'Test', cc: 'Correr/andar',
  consulta: 'Médico', clave: 'Salida clave', race: 'Carrera', extra: 'Extra'
};
function dayInfo(date) {
  const w = weekOf(date);
  if (SESS[date]) return {kind: 'run', s: SESS[date], w};
  const d = dow(date);
  if (w && d === 1) return {kind: 'leg', label: P.LEGN[w.legMon], w};
  if (w && d === 3) return {kind: 'leg', label: P.LEGN[w.legWed], w};
  if (w && d === 5) return {kind: 'free', label: w.n === 23 ? 'Descanso · prepara mochila y dorsal' : 'Sin carrera · tren superior', w};
  return {kind: 'rest', label: 'Descanso y recuperación', w};
}

/* ---------- formato ---------- */
const nf1 = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 1});
const nf2 = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2});
const nf0 = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 0});
const fmtKm = km => nf2.format(Math.round(km * 100) / 100);
function fmtTime(sec) {
  if (sec == null) return '';
  const hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = Math.round(sec % 60);
  return hh ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}
function fmtDur(sec) {
  const m = Math.round(sec / 60);
  const hh = Math.floor(m / 60), mm = m % 60;
  return hh ? (mm ? `${hh} h ${pad(mm)} min` : `${hh} h`) : `${mm} min`;
}
const fmtPace = sk => { if (!sk || !isFinite(sk)) return '–'; const t = Math.round(sk); return `${Math.floor(t / 60)}:${pad(t % 60)}`; };
const paceOf = e => e && e.km > 0 && e.seg > 0 ? e.seg / e.km : null;
const parseNum = v => { const t = String(v || '').trim().replace(',', '.'); if (!t) return null; const n = Number(t); return isFinite(n) && n >= 0 ? n : NaN; };

/* ---------- almacenamiento ---------- */
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (o && typeof o === 'object' && o.logs) { o.prefs = o.prefs || {}; return o; }
  } catch (e) { /* vacío */ }
  return {v: 1, logs: {}, prefs: {}};
}
let S = load();
let persistAsked = false;
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    if (!persistAsked && navigator.storage && navigator.storage.persist) { persistAsked = true; navigator.storage.persist().catch(() => {}); }
    return true;
  } catch (e) {
    toast('No se ha podido guardar en el teléfono.');
    return false;
  }
}
const entries = () => Object.values(S.logs).filter(e => e && e.date).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.updated || 0) - (b.updated || 0));
const counted = e => e.estado !== 'no';
const logFor = date => S.logs[date] || null;

function totals(from, to) {
  const t = {km: 0, seg: 0, desn: 0, n: 0};
  for (const e of entries()) {
    if (e.date < from || e.date > to || !counted(e)) continue;
    t.km += e.km || 0; t.seg += e.seg || 0; t.desn += e.desn || 0; t.n++;
  }
  return t;
}

/* ---------- toast ---------- */
let toastTimer = 0;
function toast(msg, action) {
  const t = $('#toast');
  t.textContent = '';
  t.append(h('span', {text: msg}));
  if (action) t.append(h('button', {type: 'button', text: action.label, onclick: () => { t.hidden = true; action.run(); }}));
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 9000 : 3200);
}

/* ---------- cabecera ---------- */
function renderTop() {
  const days = diffDays(TODAY, P.RACE);
  const w = weekOf(TODAY);
  $('#count-num').textContent = days > 0 ? days : days === 0 ? '¡Hoy!' : '✓';
  $('#count-lbl').textContent = days > 1 ? 'días para la carrera' : days === 1 ? 'día para la carrera' : days === 0 ? '' : 'carrera hecha';
  $('#top-week').textContent = w ? `Semana ${w.n} de ${WEEKS.length} · ${P.PH[w.ph].name}` : (TODAY < P.START ? 'Empieza el 9 de noviembre' : 'Plan terminado');
}

/* ---------- HOY ---------- */
function statusIcon(e) {
  if (!e) return ICON.todo;
  return e.estado === 'no' ? ICON.no : e.estado === 'parcial' ? ICON.part : ICON.ok;
}
function resultBlock(e) {
  const pace = paceOf(e);
  const box = h('div', {class: 'result'},
    h('div', null, h('span', {class: 'k', text: 'Distancia'}), h('span', {class: 'v', text: e.km ? `${fmtKm(e.km)}\u00a0km` : '–'})),
    h('div', null, h('span', {class: 'k', text: 'Tiempo'}), h('span', {class: 'v', text: e.seg ? fmtTime(e.seg) : '–'})),
    h('div', null, h('span', {class: 'k', text: 'Ritmo'}), h('span', {class: 'v', text: pace ? `${fmtPace(pace)}/km` : '–'}))
  );
  const extra = [];
  if (e.desn) extra.push(`${nf0.format(e.desn)}\u00a0m+`);
  if (e.rpe) extra.push(`RPE ${e.rpe}`);
  if (e.reps != null) extra.push(`${e.reps} subidas`);
  if (e.testKm) extra.push(`test ${fmtKm(e.testKm)}\u00a0km`);
  const full = h('div', {class: 'full'}, h('span', {class: `estado ${e.estado || 'hecha'}`, text: ESTADO[e.estado || 'hecha']}), extra.length ? ' · ' + extra.join(' · ') : '');
  box.append(full);
  return box;
}
const ESTADO = {hecha: 'Hecha', parcial: 'Parcial', no: 'No hecha'};

function renderHoy() {
  const root = $('#c-hoy');
  root.textContent = '';
  const info = dayInfo(TODAY);

  // Instalar (solo Safari iOS sin instalar)
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS && !standalone && !S.prefs.hideInstall) {
    root.append(h('div', {class: 'banner'},
      h('p', {html: 'Instálala: pulsa <b>Compartir</b> ' + ICON.share + ' en Safari y luego <b>Añadir a pantalla de inicio</b>. Se abrirá a pantalla completa y sin conexión.'}),
      h('button', {class: 'icon-btn', type: 'button', 'aria-label': 'Ocultar aviso', html: ICON.x, onclick: () => { S.prefs.hideInstall = 1; save(); renderHoy(); }})));
  }

  // Tarjeta principal
  if (TODAY > P.RACE) {
    root.append(h('div', {class: 'bib rest'}, h('div', {class: 'bib-kicker'}, h('span', {class: 'k', text: 'Plan terminado'})),
      h('h2', {text: 'Media 22K hecha'}), h('p', {class: 'desc', text: 'Revisa en Progreso todo el camino recorrido.'})));
  } else if (info.kind === 'run') {
    const se = info.s, e = logFor(TODAY);
    const card = h('div', {class: 'bib'},
      h('div', {class: 'bib-kicker'}, h('span', {class: 'chip', text: TAG[se.tag] || 'Carrera'}), h('span', {class: 'k', text: `Hoy · ${longDate(TODAY)}`})));
    if (se.tag === 'race') card.append(h('span', {class: 'plate', style: 'margin:0 auto 12px;display:flex;width:max-content'}, h('img', {class: 'race-logo', src: 'img/logo.webp', alt: 'El Aguilón Trail', style: 'margin:0'})));
    card.append(h('h2', {text: se.s}));
    if (e) card.append(resultBlock(e));
    else card.append(h('p', {class: 'desc', text: se.d}));
    card.append(h('div', {class: 'actions'},
      h('button', {class: e ? 'btn' : 'btn accent', type: 'button', text: e ? 'Editar registro' : 'Apuntar sesión', onclick: () => openSession(TODAY)}),
      e ? h('button', {class: 'btn', type: 'button', text: 'Ver la sesión', onclick: () => openSession(TODAY)}) : null));
    root.append(card);
  } else {
    const cls = info.kind === 'leg' ? 'bib leg' : 'bib rest';
    const chip = info.kind === 'leg' ? h('span', {class: 'chip leg', text: 'Pierna'}) : h('span', {class: 'chip neutral', text: 'Sin carrera'});
    root.append(h('div', {class: cls},
      h('div', {class: 'bib-kicker'}, chip, h('span', {class: 'k', text: `Hoy · ${longDate(TODAY)}`})),
      h('h2', {text: info.kind === 'leg' ? info.label.split(' · ')[0] : 'Hoy no toca correr'}),
      h('p', {class: 'desc', text: info.kind === 'leg' ? `${info.label.split(' · ')[1] || ''}. Los ejercicios están en tu calendario. ${info.w && info.w.n >= P.LEG_SWAP_FROM ? (dow(TODAY) === 3 ? 'Ligera: mañana tocan cuestas.' : '') : ''}`.trim() : info.label + '.'})));
  }

  // Próxima sesión
  const nextDate = Object.keys(SESS).sort().find(d => d > TODAY);
  if (nextDate) {
    const se = SESS[nextDate];
    root.append(h('button', {class: 'next', type: 'button', onclick: () => openSession(nextDate)},
      h('span', {class: 'when'}, h('b', {text: dayNum(nextDate)}), h('small', {text: DIA_C[dow(nextDate)]})),
      h('span', {class: 'what'}, h('small', {text: `Próxima · ${diffDays(TODAY, nextDate) === 1 ? 'mañana' : longDate(nextDate)}`}), h('b', {text: se.s})),
      h('span', {html: ICON.chev})));
  }

  // Sin apuntar (últimos 14 días)
  const pend = Object.keys(SESS).sort().filter(d => d < TODAY && diffDays(d, TODAY) <= 14 && d >= '2026-11-19' && !logFor(d));
  if (pend.length) {
    root.append(h('div', {class: 'card'}, h('h2', {text: 'Sin apuntar'}),
      h('div', {class: 'pending'}, pend.map(d => h('button', {type: 'button', text: `${cap(DIA_C[dow(d)])} ${dayNum(d)} · ${TAG[SESS[d].tag] || 'Sesión'}`, onclick: () => openSession(d)})))));
  }

  // Semana
  const w = info.w || weekOf(TODAY);
  if (w) {
    const strip = h('div', {class: 'week-strip'});
    for (let i = 0; i < 6; i++) {
      const d = addDays(w.mon, i), di = dayInfo(d), e = logFor(d);
      const isRun = di.kind === 'run';
      const mk = h('span', {class: 'mk'});
      if (isRun && e) mk.innerHTML = e.estado === 'no' ? ICON.no.replace('<path class="no"', '<path') .replace('<svg', '<svg class="no"') : e.estado === 'parcial' ? ICON.part.replace('<svg', '<svg class="part"') : ICON.ok.replace('<svg', '<svg class="ok"');
      else mk.append(h('i', {class: isRun ? '' : di.kind === 'leg' ? 'leg' : 'none'}));
      const cls = ['ws', d === TODAY ? 'today' : '', d < TODAY ? 'past' : ''].join(' ');
      const label = `${cap(DIA[dow(d)])} ${dayNum(d)}: ${isRun ? di.s.s + (e ? ` · ${ESTADO[e.estado || 'hecha']}` : '') : di.label}`;
      const cell = isRun
        ? h('button', {class: cls, type: 'button', 'aria-label': label, onclick: () => openSession(d)})
        : h('div', {class: cls, 'aria-label': label, role: 'img'});
      cell.append(h('span', {class: 'dl', text: DIA_C[dow(d)]}), h('span', {class: 'dn', text: dayNum(d)}), mk);
      strip.append(cell);
    }
    const t = totals(w.mon, w.sun);
    const plan = w.planMin * 60;
    root.append(h('div', {class: 'card'},
      h('h2', {text: `Semana ${w.n} · ${rangeLbl(w.mon, w.sat)}${w.desc ? ' · descarga' : ''}`}),
      strip,
      h('div', {class: 'ws-legend'}, h('span', null, h('i'), 'Carrera'), h('span', null, h('i', {class: 'leg'}), 'Pierna')),
      h('div', {class: 'totals'},
        h('div', null, h('span', {class: 'k', text: 'Km'}), h('span', {class: 'v', text: fmtKm(t.km)}), h('span', {class: 's', text: `${t.n} sesiones`})),
        h('div', null, h('span', {class: 'k', text: 'Tiempo'}), h('span', {class: 'v', text: t.seg ? fmtDur(t.seg) : '0 min'}), h('span', {class: 's', text: plan ? `de ${fmtDur(plan)} en plan` : ''})),
        h('div', null, h('span', {class: 'k', text: 'Desnivel'}), h('span', {class: 'v', text: `${nf0.format(t.desn)}\u00a0m+`})))));
  }

  // Copia de seguridad
  const n = entries().length;
  const last = S.prefs.lastBackup ? diffDays(S.prefs.lastBackup.slice(0, 10), TODAY) : null;
  if (n >= 3 && (last == null || last >= 14)) {
    root.append(h('div', {class: 'banner'},
      h('p', null, h('b', {text: 'Haz una copia de tus datos. '}), last == null ? 'Aún no has guardado ninguna.' : `La última fue hace ${last} días.`, ' ',
        h('button', {class: 'btn small', type: 'button', style: 'margin-top:8px', text: 'Guardar copia', onclick: exportJSON}))));
  }

  // Pautas
  root.append(h('div', {class: 'card'}, h('h2', {text: 'Las pautas de la semana'}),
    h('ul', {class: 'rules'},
      h('li', null, h('b', {text: 'Mar'}), h('span', {text: 'Rodaje suave, sobre todo por llano. Ritmo en el que puedas hablar.'})),
      h('li', null, h('b', {text: 'Jue'}), h('span', {text: '2 km suaves y subidas fuertes de 500 m, bajando la misma distancia para recuperar.'})),
      h('li', null, h('b', {text: 'Sáb'}), h('span', {text: 'Tirada larga alternando correr y andar. Alarga los tramos corriendo poco a poco.'})),
      h('li', {class: 'stop'}, h('b', {text: 'Para'}), h('span', {text: 'si notas molestias en la zona operada o un dolor que te cambia la pisada.'})))));
}

/* ---------- PLAN ---------- */
function sessRow(d) {
  const se = SESS[d], e = logFor(d);
  let met = TAG[se.tag] || '';
  if (e) {
    const parts = [];
    if (e.km) parts.push(`${fmtKm(e.km)}\u00a0km`);
    if (e.seg) parts.push(fmtTime(e.seg));
    const p = paceOf(e); if (p) parts.push(`${fmtPace(p)}/km`);
    if (e.estado === 'no') parts.unshift('No hecha');
    met = parts.join(' · ') || ESTADO[e.estado || 'hecha'];
  }
  return h('button', {class: 'sess' + (d === TODAY ? ' today' : ''), type: 'button', onclick: () => openSession(d)},
    h('span', {class: 'day'}, DIA_C[dow(d)], h('b', {text: dayNum(d)})),
    h('span', null, h('span', {class: 'ttl', text: se.s}), h('span', {class: 'met', text: met})),
    h('span', {class: 'st', html: statusIcon(e)}));
}
function renderPlan() {
  const root = $('#c-plan');
  root.textContent = '';
  let ph = -1;
  for (const w of WEEKS) {
    if (w.ph !== ph) {
      ph = w.ph;
      root.append(h('div', {class: 'phase'}, h('h2', {text: `Fase ${ph} · ${P.PH[ph].name}`}), h('p', {text: P.PH[ph].note})));
    }
    const cur = TODAY >= w.mon && TODAY <= w.sun;
    const head = h('div', {class: 'wk-h'}, h('span', {class: 'n', text: `S${w.n}`}), h('span', {class: 'd', text: rangeLbl(w.mon, w.sat)}));
    if (w.desc) head.append(h('span', {class: 'chip neutral', text: 'Descarga'}));
    if (w.test) head.append(h('span', {class: 'chip line', text: 'Test'}));
    if (w.n === WEEKS.length) head.append(h('span', {class: 'chip', text: 'Carrera'}));
    if (cur) head.append(h('span', {class: 'chip', text: 'Ahora'}));
    head.append(h('span', {class: 't', text: w.planMin ? P.dur(w.planMin) : ''}));
    const card = h('article', {class: 'wk' + (cur ? ' cur' : '') + (w.sun < TODAY ? ' past' : ''), id: `w${w.n}`}, head);
    [1, 3, 5].forEach(off => card.append(sessRow(addDays(w.mon, off))));
    card.append(h('div', {class: 'wk-legs'}, h('i'), `Lun: ${P.LEGN[w.legMon]} · Mié: ${P.LEGN[w.legWed]}`));
    root.append(card);
  }
}
function scrollToWeek(smooth) {
  const w = weekOf(TODAY) || (TODAY < P.START ? WEEKS[0] : WEEKS[WEEKS.length - 1]);
  const el = $(`#w${w.n}`);
  if (el) el.scrollIntoView({block: 'start', behavior: smooth ? 'smooth' : 'auto'});
}

/* ---------- HISTORIAL ---------- */
function renderHist() {
  const root = $('#c-hist');
  root.textContent = '';
  const list = entries().reverse();
  if (!list.length) {
    root.append(h('div', {class: 'empty'}, h('b', {text: 'Aún no hay registros'}),
      'Cuando acabes una sesión, ábrela desde Hoy o desde Plan y apunta distancia, tiempo y sensaciones. Si corres fuera del plan, usa «+ Salida extra».'));
    return;
  }
  const done = list.filter(counted);
  const km = done.reduce((a, e) => a + (e.km || 0), 0);
  root.append(h('p', {class: 'h-sum', text: `${done.length} sesiones hechas · ${fmtKm(km)}\u00a0km`}));
  let curMonth = '', box = null;
  for (const e of list) {
    const m = e.date.slice(0, 7);
    if (m !== curMonth) {
      curMonth = m;
      root.append(h('h2', {class: 'h-month', text: `${cap(MES[monIdx(e.date)])} ${e.date.slice(0, 4)}`}));
      box = h('div', {class: 'h-list'});
      root.append(box);
    }
    const title = e.planned ? (SESS[e.date] ? SESS[e.date].s : 'Sesión') : (e.title || 'Salida extra');
    const parts = [];
    if (e.estado === 'no') parts.push('No hecha');
    else if (e.estado === 'parcial') parts.push('Parcial');
    if (e.km) parts.push(`${fmtKm(e.km)}\u00a0km`);
    if (e.seg) parts.push(fmtTime(e.seg));
    const p = paceOf(e); if (p) parts.push(`${fmtPace(p)}/km`);
    if (e.desn) parts.push(`${nf0.format(e.desn)}\u00a0m+`);
    const row = h('button', {class: 'h-row', type: 'button', onclick: () => openEntry(e.id)},
      h('span', {class: 'day'}, DIA_C[dow(e.date)], h('b', {text: dayNum(e.date)})),
      h('span', {style: 'min-width:0'}, h('span', {class: 'ttl', text: title}), h('span', {class: 'met', text: parts.join(' · ') || '—'}),
        e.notas ? h('span', {class: 'note', text: e.notas}) : null),
      e.rpe ? h('span', {class: 'rpe'}, String(e.rpe), h('small', {text: 'RPE'})) : h('span'));
    box.append(row);
  }
}

/* ---------- PROGRESO ---------- */
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}
function attachTip(host) {
  let tip = host.querySelector('.tip');
  if (!tip) { tip = h('div', {class: 'tip', hidden: true}); host.append(tip); }
  return {
    show(x, y, value, label) {
      tip.textContent = '';
      tip.append(h('b', {text: value}), h('span', {text: label}));
      tip.hidden = false;
      const w = host.clientWidth;
      const tw = tip.offsetWidth;
      const left = Math.min(Math.max(x, tw / 2 + 2), w - tw / 2 - 2);
      tip.style.left = left + 'px';
      tip.style.top = Math.max(y, 44) + 'px';
    },
    hide() { tip.hidden = true; }
  };
}
function barPath(x, y, w, hgt, r) {
  r = Math.min(r, w / 2, hgt);
  return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
}
/* Columnas: una serie (hecho) + marca de plan opcional */
function drawBars(host, cfg) {
  host.textContent = '';
  const W = Math.max(280, host.clientWidth), H = 196, m = {l: 40, r: 6, t: 14, b: 26};
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const maxV = Math.max(1, ...cfg.data.map(d => Math.max(d.v || 0, d.plan || 0)));
  const step = cfg.steps ? (cfg.steps.find(st => maxV / st <= 4) || cfg.steps[cfg.steps.length - 1]) : niceStep(maxV / 4);
  const top = Math.ceil(maxV / step) * step;
  const y = v => m.t + ih - (v / top) * ih;
  const curIdx = cfg.data.findIndex(d => d.cur);
  const band = iw / cfg.data.length, bw = Math.max(4, Math.min(24, band - 3));
  const svg = s('svg', {width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.label});
  for (let t = 0; t <= top + 1e-9; t += step) {
    svg.append(s('line', {class: 'grid', x1: m.l, x2: W - m.r, y1: y(t), y2: y(t)}));
    const tx = s('text', {class: 'tick', x: m.l - 6, y: y(t) + 4, 'text-anchor': 'end'}); tx.textContent = cfg.yFmt(t); svg.append(tx);
  }
  const tip = attachTip(host);
  const every = Math.ceil(cfg.data.length / Math.max(4, Math.floor(iw / 34)));
  cfg.data.forEach((d, i) => {
    const cx = m.l + band * i + band / 2;
    let bar = null;
    if (d.v > 0) { bar = s('path', {class: 'bar', d: barPath(cx - bw / 2, y(d.v), bw, y(0) - y(d.v), 4)}); svg.append(bar); }
    if (d.plan > 0) svg.append(s('line', {class: 'plan', x1: cx - bw / 2 - 2, x2: cx + bw / 2 + 2, y1: y(d.plan), y2: y(d.plan)}));
    if (d.cur || (i % every === 0 && (curIdx < 0 || Math.abs(i - curIdx) * band >= 30))) {
      const tx = s('text', {class: 'xl' + (d.cur ? ' cur' : ''), x: cx, y: H - 8, 'text-anchor': 'middle'}); tx.textContent = d.x; svg.append(tx);
    }
    const hit = s('rect', {class: 'hit', x: m.l + band * i, y: m.t, width: band, height: ih + 4, tabindex: 0, 'aria-label': `${d.x}: ${d.tipV}. ${d.tipL}`});
    const on = () => { $$('.bar.on', svg).forEach(b => b.classList.remove('on')); if (bar) bar.classList.add('on'); tip.show(cx, y(Math.max(d.v || 0, d.plan || 0)), d.tipV, d.tipL); };
    hit.addEventListener('pointerdown', on); hit.addEventListener('focus', on);
    hit.addEventListener('blur', () => { tip.hide(); if (bar) bar.classList.remove('on'); });
    svg.append(hit);
  });
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') tip.hide(); });
  host.append(svg);
  attachTip(host);
}
/* Línea: valores con fecha; invert = valores bajos arriba (ritmo) */
function drawLine(host, cfg) {
  host.textContent = '';
  const pts = cfg.points;
  const W = Math.max(280, host.clientWidth), H = 196, m = {l: 44, r: 54, t: 16, b: 26};
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  const span = Math.max(hi - lo, cfg.minSpan);
  const step = cfg.steps.find(st => span / st <= 4) || cfg.steps[cfg.steps.length - 1];
  lo = Math.floor((lo - span * 0.1) / step) * step; hi = Math.ceil((hi + span * 0.1) / step) * step;
  if (hi === lo) hi = lo + step;
  lo = Math.max(0, lo);
  const d0 = pts[0].date, dn = Math.max(1, diffDays(d0, pts[pts.length - 1].date));
  const x = p => m.l + (diffDays(d0, p.date) / dn) * iw;
  const y = v => cfg.invert ? m.t + ((v - lo) / (hi - lo)) * ih : m.t + ih - ((v - lo) / (hi - lo)) * ih;
  const svg = s('svg', {width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.label});
  for (let t = lo; t <= hi + 1e-9; t += step) {
    svg.append(s('line', {class: 'grid', x1: m.l, x2: W - m.r, y1: y(t), y2: y(t)}));
    const tx = s('text', {class: 'tick', x: m.l - 6, y: y(t) + 4, 'text-anchor': 'end'}); tx.textContent = cfg.yFmt(t); svg.append(tx);
  }
  const lbls = pts.length > 2 ? [pts[0], pts[Math.floor((pts.length - 1) / 2)], pts[pts.length - 1]] : pts;
  lbls.forEach((p, i) => {
    const tx = s('text', {class: 'xl', x: x(p), y: H - 8, 'text-anchor': i === 0 ? 'start' : i === lbls.length - 1 ? 'end' : 'middle'});
    tx.textContent = `${dayNum(p.date)} ${MES_C[monIdx(p.date)]}`; svg.append(tx);
  });
  const dLine = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  svg.append(s('path', {class: 'ln', d: dLine}));
  const dots = pts.map(p => { const c = s('circle', {class: 'pt', cx: x(p), cy: y(p.v), r: 4.5}); svg.append(c); return c; });
  const last = pts[pts.length - 1];
  const el = s('text', {class: 'endl', x: x(last) + 9, y: y(last.v) + 4}); el.textContent = cfg.yFmt(last.v) + (cfg.unit || ''); svg.append(el);
  const cross = s('line', {class: 'cross', y1: m.t, y2: m.t + ih, x1: 0, x2: 0, visibility: 'hidden'}); svg.append(cross);
  const tip = attachTip(host);
  const overlay = s('rect', {class: 'hit', x: m.l - 8, y: 0, width: iw + 16, height: H, tabindex: 0, 'aria-label': cfg.label});
  let idx = pts.length - 1;
  const pick = i => {
    idx = i; const p = pts[i];
    cross.setAttribute('x1', x(p)); cross.setAttribute('x2', x(p)); cross.setAttribute('visibility', 'visible');
    dots.forEach((c, j) => c.setAttribute('r', j === i ? 6 : 4.5));
    tip.show(x(p), y(p.v), cfg.yFmt(p.v) + (cfg.unit || ''), p.tip);
  };
  const near = ev => {
    const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width);
    let best = 0, bd = Infinity; pts.forEach((p, i) => { const dd = Math.abs(x(p) - px); if (dd < bd) { bd = dd; best = i; } });
    pick(best);
  };
  overlay.addEventListener('pointerdown', near);
  overlay.addEventListener('pointermove', near);
  overlay.addEventListener('focus', () => pick(idx));
  overlay.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowLeft') { pick(Math.max(0, idx - 1)); ev.preventDefault(); }
    if (ev.key === 'ArrowRight') { pick(Math.min(pts.length - 1, idx + 1)); ev.preventDefault(); }
  });
  const off = () => { tip.hide(); cross.setAttribute('visibility', 'hidden'); dots.forEach(c => c.setAttribute('r', 4.5)); };
  overlay.addEventListener('blur', off);
  svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') off(); });
  svg.append(overlay);
  host.append(svg);
  attachTip(host);
}
function dataTable(cols, rows) {
  return h('details', {class: 'table'}, h('summary', {text: 'Ver datos'}),
    h('table', null,
      h('thead', null, h('tr', null, cols.map((c, i) => h('th', {class: i ? 'r' : '', text: c})))),
      h('tbody', null, rows.map(r => h('tr', null, r.map((c, i) => h('td', {class: i ? 'r' : '', text: c})))))));
}

const charts = [];
function renderProg() {
  const root = $('#c-prog');
  root.textContent = '';
  charts.length = 0;
  const all = entries().filter(counted);
  const tot = all.reduce((a, e) => ({km: a.km + (e.km || 0), seg: a.seg + (e.seg || 0), desn: a.desn + (e.desn || 0)}), {km: 0, seg: 0, desn: 0});
  const dueDates = Object.keys(SESS).filter(d => d >= '2026-11-19' && (d < TODAY || (d === TODAY && logFor(d))));
  const doneDue = dueDates.filter(d => logFor(d) && logFor(d).estado !== 'no').length;
  root.append(h('div', {class: 'tiles'},
    h('div', {class: 'tile'}, h('span', {class: 'k', text: 'Km totales'}), h('span', {class: 'v', text: fmtKm(tot.km)}), h('span', {class: 's', text: `${all.length} sesiones`})),
    h('div', {class: 'tile'}, h('span', {class: 'k', text: 'Tiempo total'}), h('span', {class: 'v', text: tot.seg ? fmtDur(tot.seg) : '0 min'}), h('span', {class: 's', text: 'corriendo y andando'})),
    h('div', {class: 'tile'}, h('span', {class: 'k', text: 'Desnivel'}), h('span', {class: 'v', text: `${nf0.format(tot.desn)}\u00a0m+`}), h('span', {class: 's', text: 'acumulado'})),
    h('div', {class: 'tile'}, h('span', {class: 'k', text: 'Cumplimiento'}), h('span', {class: 'v', text: dueDates.length ? `${Math.round(doneDue / dueDates.length * 100)} %` : '–'}), h('span', {class: 's', text: `${doneDue} de ${dueDates.length} sesiones desde el 19 nov`}))));

  const curW = weekOf(TODAY);
  const lastW = curW ? curW.n : (TODAY > P.RACE ? WEEKS.length : 1);

  // Tiempo por semana: hecho vs plan (todas las semanas)
  const timeData = WEEKS.map(w => {
    const t = totals(w.mon, w.sun);
    const v = w.n <= lastW ? t.seg / 60 : 0;
    return {x: `S${w.n}`, v, plan: w.planMin, cur: curW && w.n === curW.n,
      tipV: w.n <= lastW ? fmtDur(t.seg) : '—', tipL: `S${w.n} · plan ${w.planMin ? P.dur(w.planMin) : '—'}`};
  });
  const c1 = h('div', {class: 'chart'});
  root.append(h('section', {class: 'card chart-card'}, h('h2', {text: 'Tiempo por semana'}),
    h('p', {class: 'sub', text: 'Lo que has hecho frente a lo que marca el plan, de noviembre a la carrera.'}),
    h('div', {class: 'legend'}, h('span', null, h('i', {class: 'sw-bar'}), 'Hecho'), h('span', null, h('i', {class: 'sw-plan'}), 'Plan')),
    c1, dataTable(['Semana', 'Hecho', 'Plan'], WEEKS.map((w, i) => [`S${w.n} · ${rangeLbl(w.mon, w.sat)}`, w.n <= lastW ? fmtDur(totals(w.mon, w.sun).seg) : '—', w.planMin ? P.dur(w.planMin) : '—']))));
  charts.push(() => drawBars(c1, {data: timeData, label: 'Minutos por semana, hecho y plan', steps: [15, 30, 60, 120], yFmt: v => v === 0 ? '0' : v % 60 === 0 ? `${v / 60} h` : v > 60 ? `${nf1.format(v / 60)} h` : `${v} min`}));

  // Km por semana
  const kmW = WEEKS.filter(w => w.n <= lastW).map(w => {
    const t = totals(w.mon, w.sun);
    return {x: `S${w.n}`, v: t.km, cur: curW && w.n === curW.n, tipV: `${fmtKm(t.km)}\u00a0km`, tipL: `S${w.n} · ${rangeLbl(w.mon, w.sat)}`};
  });
  const c2 = h('div', {class: 'chart'});
  root.append(h('section', {class: 'card chart-card'}, h('h2', {text: 'Kilómetros por semana'}),
    all.length ? c2 : h('div', {class: 'chart-empty', text: 'Aparecerá en cuanto apuntes tu primera sesión.'}),
    all.length ? dataTable(['Semana', 'Km'], kmW.map(d => [d.tipL, d.tipV])) : null));
  if (all.length) charts.push(() => drawBars(c2, {data: kmW, label: 'Kilómetros por semana', yFmt: v => nf0.format(v)}));

  // Ritmo de rodajes suaves
  const easy = all.filter(e => e.planned && SESS[e.date] && SESS[e.date].tag === 'suave' && paceOf(e))
    .map(e => ({date: e.date, v: paceOf(e), tip: `${cap(DIA_C[dow(e.date)])} ${dayNum(e.date)} ${MES_C[monIdx(e.date)]} · ${fmtKm(e.km)}\u00a0km`}));
  const c3 = h('div', {class: 'chart'});
  root.append(h('section', {class: 'card chart-card'}, h('h2', {text: 'Ritmo en los rodajes suaves'}),
    h('p', {class: 'sub', text: 'Minutos por km de los martes. Más arriba es más rápido: si sube con el mismo esfuerzo, estás mejorando.'}),
    easy.length >= 2 ? c3 : h('div', {class: 'chart-empty', text: `Necesita al menos 2 rodajes suaves con distancia y tiempo${easy.length ? ' (llevas 1)' : ''}.`}),
    easy.length ? dataTable(['Fecha', 'Ritmo'], easy.map(p => [p.tip, `${fmtPace(p.v)}/km`])) : null));
  if (easy.length >= 2) charts.push(() => drawLine(c3, {points: easy, invert: true, label: 'Ritmo de los rodajes suaves en min/km', yFmt: fmtPace, unit: '/km', minSpan: 30, steps: [5, 10, 15, 20, 30, 60, 120]}));

  // Test de referencia
  const tests = all.filter(e => e.testKm > 0).map(e => ({date: e.date, v: e.testKm, tip: `Test del ${dayNum(e.date)} ${MES_C[monIdx(e.date)]}`}));
  const c4 = h('div', {class: 'chart'});
  root.append(h('section', {class: 'card chart-card'}, h('h2', {text: 'Test de referencia'}),
    h('p', {class: 'sub', text: `Km en 30 min a RPE 4 por el mismo circuito. Toca los martes ${testDates()}.`}),
    tests.length >= 2 ? c4 : h('div', {class: 'chart-empty', text: tests.length ? `Primer test: ${fmtKm(tests[0].v)} km. La línea aparece con el segundo.` : 'Aparecerá cuando apuntes los km de dos tests.'}),
    tests.length ? dataTable(['Fecha', 'Km en 30 min'], tests.map(p => [p.tip, fmtKm(p.v)])) : null));
  if (tests.length >= 2) charts.push(() => drawLine(c4, {points: tests, label: 'Km en 30 minutos en cada test', yFmt: v => nf2.format(v), unit: ' km', minSpan: 0.4, steps: [0.1, 0.2, 0.25, 0.5, 1]}));

  const lb = S.prefs.lastBackup;
  $('#last-backup').textContent = lb ? `Última copia guardada: ${longDate(lb.slice(0, 10))}.` : 'Todavía no has guardado ninguna copia.';
  drawCharts();
}
function testDates() {
  const ds = WEEKS.filter(w => w.test).map(w => addDays(w.mon, 1)).map(d => `${dayNum(d)} ${MES_C[monIdx(d)]}`);
  return ds.slice(0, -1).join(', ') + ' y ' + ds[ds.length - 1];
}
function drawCharts() {
  if (location.hash.slice(1) !== 'progreso') return;
  requestAnimationFrame(() => charts.forEach(fn => fn()));
}

/* ---------- HOJA DE SESIÓN ---------- */
const RPE_CAP = {1: 'Muy suave, casi paseando', 2: 'Muy suave', 3: 'Suave: hablas en frases completas', 4: 'Cómodo: aún puedes charlar', 5: 'Moderado: frases cortas', 6: 'Algo duro: pocas frases', 7: 'Fuerte: solo palabras sueltas', 8: 'Muy fuerte', 9: 'Casi al máximo', 10: 'Máximo'};
const MOL = ['Ninguna', 'Leves', 'Moderadas', 'Fuertes'];
let sheetCtx = null;

function openSession(date) {
  const e = logFor(date);
  openForm({date, planned: true, se: SESS[date], e});
}
function openEntry(id) {
  const e = S.logs[id];
  if (!e) return;
  openForm({date: e.date, planned: !!e.planned, se: e.planned ? SESS[e.date] : null, e});
}
function openExtra() {
  openForm({date: TODAY, planned: false, se: null, e: null});
}

function openForm(ctx) {
  sheetCtx = ctx;
  const {date, se, e, planned} = ctx;
  const w = weekOf(date);
  $('#sheet-kicker').textContent = planned
    ? `${cap(longDate(date))}${w ? ` · Semana ${w.n}` : ''}`
    : (e ? `Salida extra · ${longDate(date)}` : 'Salida fuera del plan');
  $('#sheet-title').textContent = planned ? se.s : (e && e.title) || 'Salida extra';
  const body = $('#sheet-body');
  body.textContent = '';

  if (planned) {
    const box = h('div', {class: 'plan-box'}, h('span', {class: 'chip', text: TAG[se.tag] || 'Sesión'}), h('p', {text: se.d}));
    if (se.tag === 'race') box.prepend(h('span', {class: 'plate', style: 'display:flex;width:max-content;margin:0 auto 10px'}, h('img', {src: 'img/logo.webp', alt: 'El Aguilón Trail', style: 'width:110px'})));
    if (se.tag === 'test') box.append(h('p', {class: 'pt-note', text: 'Usa siempre el mismo circuito para que los tests se puedan comparar.'}));
    body.append(box);
  }

  const f = h('form', {class: 'log', novalidate: true});
  const v = e || {};
  const uid = Math.random().toString(36).slice(2, 7);

  if (!planned) {
    f.append(h('div', {class: 'f-row'},
      h('div', {class: 'f'}, h('label', {for: `dt-${uid}`, text: 'Fecha'}), h('input', {class: 'inp', type: 'date', id: `dt-${uid}`, name: 'date', value: date, required: true})),
      h('div', {class: 'f'}, h('label', {for: `ti-${uid}`, text: 'Nombre'}), h('input', {class: 'inp', type: 'text', id: `ti-${uid}`, name: 'title', value: v.title || '', placeholder: 'Salida extra', maxlength: 60, autocomplete: 'off'}))));
  }

  // Estado
  const est = v.estado || 'hecha';
  f.append(h('fieldset', null, h('legend', {text: 'Estado'}),
    h('div', {class: 'seg'}, ['hecha', 'parcial', 'no'].flatMap(k => [
      h('input', {type: 'radio', name: 'estado', id: `es-${k}-${uid}`, value: k, checked: est === k}),
      h('label', {for: `es-${k}-${uid}`, text: ESTADO[k]})]))));

  // Distancia + desnivel
  f.append(h('div', {class: 'f-row'},
    h('div', {class: 'f'}, h('label', {for: `km-${uid}`, text: 'Distancia'}),
      h('div', {class: 'unit'}, h('input', {class: 'inp', id: `km-${uid}`, name: 'km', inputmode: 'decimal', autocomplete: 'off', placeholder: '0,0', value: v.km != null ? String(v.km).replace('.', ',') : ''}), h('span', {text: 'km'}))),
    h('div', {class: 'f'}, h('label', {for: `de-${uid}`, text: 'Desnivel'}),
      h('div', {class: 'unit'}, h('input', {class: 'inp', id: `de-${uid}`, name: 'desn', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', placeholder: '0', value: v.desn != null ? v.desn : ''}), h('span', {text: 'm+'})))));

  // Tiempo
  const hh = v.seg ? Math.floor(v.seg / 3600) : '', mm = v.seg ? Math.floor(v.seg % 3600 / 60) : '', ss = v.seg ? v.seg % 60 : '';
  const tIn = (name, val, ph, lbl) => h('input', {class: 'inp', name, inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', placeholder: ph, value: val === '' ? '' : String(val), 'aria-label': lbl, maxlength: 2});
  f.append(h('div', {class: 'f'}, h('span', {class: 'lbl', text: 'Tiempo total'}),
    h('div', {class: 'time'}, tIn('th', hh, '0', 'Horas'), h('i', {text: ':'}), tIn('tm', mm === '' ? '' : pad(mm), '00', 'Minutos'), h('i', {text: ':'}), tIn('ts', ss === '' ? '' : pad(ss), '00', 'Segundos')),
    h('div', {class: 'time-lbls', 'aria-hidden': 'true'}, h('span', {text: 'horas'}), h('i', {text: ':'}), h('span', {text: 'min'}), h('i', {text: ':'}), h('span', {text: 's'}))));

  const paceOut = h('b', {text: '–'});
  f.append(h('div', {class: 'pace', 'aria-live': 'polite'}, h('span', {text: 'Ritmo medio'}), paceOut));

  // Específicos
  if (planned && se.tag === 'cuestas' && se.reps) {
    let reps = v.reps != null ? v.reps : se.reps;
    const out = h('output', {text: reps});
    const set = n => { reps = Math.max(0, Math.min(20, n)); out.textContent = reps; f.dataset.reps = reps; };
    f.dataset.reps = reps;
    f.append(h('div', {class: 'f'}, h('span', {class: 'lbl', text: 'Subidas hechas'}),
      h('div', {class: 'stepper'},
        h('button', {type: 'button', 'aria-label': 'Una subida menos', text: '−', onclick: () => set(reps - 1)}), out,
        h('button', {type: 'button', 'aria-label': 'Una subida más', text: '+', onclick: () => set(reps + 1)}),
        h('small', {text: `de ${se.reps} previstas`}))));
  }
  if (planned && se.tag === 'test') {
    f.append(h('div', {class: 'f'}, h('label', {for: `tk-${uid}`, text: 'Km en los 30 min del test'}),
      h('div', {class: 'unit'}, h('input', {class: 'inp', id: `tk-${uid}`, name: 'testKm', inputmode: 'decimal', autocomplete: 'off', placeholder: '0,0', value: v.testKm != null ? String(v.testKm).replace('.', ',') : ''}), h('span', {text: 'km'}))));
  }

  // RPE
  const rpeCap = h('p', {class: 'rpe-cap', text: v.rpe ? `${v.rpe} · ${RPE_CAP[v.rpe]}` : 'Del 1 (paseo) al 10 (a tope).'});
  f.append(h('fieldset', null, h('legend', {text: 'Esfuerzo (RPE)'}),
    h('div', {class: 'seg rpe'}, Array.from({length: 10}, (_, i) => i + 1).flatMap(n => [
      h('input', {type: 'radio', name: 'rpe', id: `rpe-${n}-${uid}`, value: n, checked: v.rpe === n, onchange: () => { rpeCap.textContent = `${n} · ${RPE_CAP[n]}`; }}),
      h('label', {for: `rpe-${n}-${uid}`, text: n})])), rpeCap));

  // Molestias
  f.append(h('fieldset', null, h('legend', {text: 'Molestias (zona operada u otras)'}),
    h('div', {class: 'seg'}, MOL.flatMap((m, i) => [
      h('input', {type: 'radio', name: 'mol', id: `mol-${i}-${uid}`, value: i, checked: (v.mol != null ? v.mol : -1) === i}),
      h('label', {for: `mol-${i}-${uid}`, text: m})]))));

  // Sensaciones
  f.append(h('div', {class: 'f'}, h('label', {for: `no-${uid}`, text: 'Sensaciones'}),
    h('textarea', {class: 'inp', id: `no-${uid}`, name: 'notas', rows: 3, placeholder: 'Cómo te has notado, piernas, respiración, terreno, qué comiste…', maxlength: 1000}, v.notas || '')));

  const msg = h('p', {class: 'f-msg', role: 'alert'});
  f.append(msg);
  f.append(h('div', {class: 'f-actions'},
    h('button', {class: 'btn accent block', type: 'submit', text: e ? 'Guardar cambios' : 'Guardar'}),
    e ? h('button', {class: 'btn danger block', type: 'button', text: 'Borrar registro', onclick: () => {
      if (!confirm('¿Borrar este registro?')) return;
      delete S.logs[e.id]; save(); closeSheet(); renderAll(); toast('Registro borrado.');
    }}) : null));

  const updPace = () => {
    const km = parseNum(fe(f, 'km').value);
    const sec = readTime(f);
    paceOut.textContent = km > 0 && sec > 0 ? `${fmtPace(sec / km)} /km` : '–';
  };
  f.addEventListener('input', updPace);
  // Pasar al siguiente campo de tiempo al escribir 2 cifras
  fe(f, 'tm').addEventListener('input', () => { if (fe(f, 'tm').value.length >= 2) fe(f, 'ts').focus(); });
  fe(f, 'th').addEventListener('input', () => { if (fe(f, 'th').value.length >= 1) fe(f, 'tm').focus(); });
  updPace();

  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const km = parseNum(fe(f, 'km').value), desn = parseNum(fe(f, 'desn').value);
    const tk = fe(f, 'testKm') ? parseNum(fe(f, 'testKm').value) : null;
    const th = parseNum(fe(f, 'th').value), tm = parseNum(fe(f, 'tm').value), ts = parseNum(fe(f, 'ts').value);
    if ([km, desn, tk, th, tm, ts].some(Number.isNaN)) { msg.textContent = 'Revisa los números: solo cifras, con coma para los decimales.'; return; }
    if ((tm || 0) > 59 || (ts || 0) > 59) { msg.textContent = 'Los minutos y los segundos van de 0 a 59.'; return; }
    if (km > 100) { msg.textContent = 'Esa distancia parece demasiado alta. ¿Está bien escrita?'; return; }
    const seg = readTime(f);
    let d = date;
    if (!planned) {
      d = fe(f, 'date').value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { msg.textContent = 'Elige la fecha de la salida.'; return; }
    }
    const rpe = f.querySelector('input[name="rpe"]:checked');
    const mol = f.querySelector('input[name="mol"]:checked');
    const id = planned ? date : (e ? e.id : `x${Date.now().toString(36)}`);
    const rec = {
      id, date: d, planned,
      title: planned ? undefined : (fe(f, 'title').value.trim() || 'Salida extra'),
      estado: f.querySelector('input[name="estado"]:checked').value,
      km: km || null, seg: seg || null, desn: desn != null ? Math.round(desn) : null,
      rpe: rpe ? Number(rpe.value) : null, mol: mol ? Number(mol.value) : null,
      notas: fe(f, 'notas').value.trim() || '',
      reps: f.dataset.reps != null ? Number(f.dataset.reps) : null,
      testKm: tk || null,
      created: e && e.created ? e.created : Date.now(), updated: Date.now()
    };
    Object.keys(rec).forEach(k => rec[k] === undefined && delete rec[k]);
    S.logs[id] = rec;
    if (!save()) return;
    closeSheet();
    renderAll();
    const p = paceOf(rec);
    toast(rec.estado === 'no' ? 'Apuntada como no hecha.' : `Guardado${rec.km ? ` · ${fmtKm(rec.km)}\u00a0km` : ''}${p ? ` a ${fmtPace(p)}/km` : ''}.`);
  });

  body.append(f);
  const dlg = $('#sheet');
  document.documentElement.classList.add('lock');
  if (!dlg.open) dlg.showModal();
  $('.sheet-in').scrollTop = 0;
  $('#sheet-close').focus();
}
function fe(f, name) { return f.elements.namedItem(name); }
function readTime(f) {
  const th = parseNum(fe(f, 'th').value) || 0, tm = parseNum(fe(f, 'tm').value) || 0, ts = parseNum(fe(f, 'ts').value) || 0;
  if ([th, tm, ts].some(Number.isNaN)) return 0;
  return Math.round(th * 3600 + tm * 60 + ts);
}
function closeSheet() {
  const dlg = $('#sheet');
  if (dlg.open) dlg.close();
}

/* ---------- copias ---------- */
function stamp() { const d = new Date(); return `${isoLocal(d)}_${pad(d.getHours())}${pad(d.getMinutes())}`; }
async function shareOrDownload(blob, name) {
  const file = new File([blob], name, {type: blob.type});
  if (navigator.canShare && navigator.canShare({files: [file]})) {
    try { await navigator.share({files: [file], title: name}); return true; }
    catch (err) { if (err && err.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', {href: url, download: name});
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
async function exportJSON() {
  const data = JSON.stringify({app: 'aguilon22k', v: 1, exported: new Date().toISOString(), logs: S.logs}, null, 1);
  const ok = await shareOrDownload(new Blob([data], {type: 'application/json'}), `aguilon22k-copia-${stamp()}.json`);
  if (ok) { S.prefs.lastBackup = isoLocal(new Date()); save(); renderAll(); toast('Copia creada. Guárdala en Archivos o iCloud.'); }
}
async function exportCSV() {
  const q = v => { const t = v == null ? '' : String(v); return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const head = ['fecha', 'semana', 'sesion', 'tipo', 'estado', 'km', 'tiempo', 'ritmo_min_km', 'desnivel_m', 'rpe', 'molestias', 'subidas', 'test_km', 'sensaciones'];
  const rows = entries().map(e => {
    const se = e.planned ? SESS[e.date] : null, w = weekOf(e.date), p = paceOf(e);
    return [e.date, w ? w.n : '', se ? se.s : (e.title || 'Salida extra'), se ? (TAG[se.tag] || '') : 'Extra', ESTADO[e.estado || 'hecha'],
      e.km != null ? String(e.km).replace('.', ',') : '', e.seg ? fmtTime(e.seg) : '', p ? fmtPace(p) : '', e.desn != null ? e.desn : '',
      e.rpe || '', e.mol != null ? MOL[e.mol] : '', e.reps != null ? e.reps : '', e.testKm ? String(e.testKm).replace('.', ',') : '', e.notas || ''].map(q).join(';');
  });
  const csv = '﻿' + [head.join(';')].concat(rows).join('\r\n');
  await shareOrDownload(new Blob([csv], {type: 'text/csv'}), `aguilon22k-registros-${stamp()}.csv`);
}
function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || o.app !== 'aguilon22k' || typeof o.logs !== 'object') throw new Error('formato');
      let n = 0;
      for (const [id, e] of Object.entries(o.logs)) {
        if (!e || typeof e !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || ''))) continue;
        const cur = S.logs[id];
        if (!cur || (e.updated || 0) >= (cur.updated || 0)) {
          S.logs[id] = {
            id, date: e.date, planned: !!e.planned, title: typeof e.title === 'string' ? e.title.slice(0, 60) : undefined,
            estado: ['hecha', 'parcial', 'no'].includes(e.estado) ? e.estado : 'hecha',
            km: Number(e.km) || null, seg: Number(e.seg) || null, desn: e.desn != null ? Number(e.desn) || 0 : null,
            rpe: Number(e.rpe) || null, mol: e.mol != null && MOL[e.mol] ? Number(e.mol) : null,
            notas: typeof e.notas === 'string' ? e.notas.slice(0, 1000) : '', reps: e.reps != null ? Number(e.reps) || 0 : null,
            testKm: Number(e.testKm) || null, created: Number(e.created) || Date.now(), updated: Number(e.updated) || Date.now()
          };
          if (S.logs[id].title === undefined) delete S.logs[id].title;
          n++;
        }
      }
      save(); renderAll();
      toast(n ? `Restauradas ${n} sesiones.` : 'La copia no tenía nada nuevo.');
    } catch (err) {
      toast('Ese archivo no es una copia de esta app.');
    }
  };
  r.readAsText(file);
}

/* ---------- navegación ---------- */
const VIEWS = ['hoy', 'plan', 'historial', 'progreso'];
let firstPlanShow = true;
function route() {
  let v = location.hash.slice(1);
  if (!VIEWS.includes(v)) v = 'hoy';
  VIEWS.forEach(k => { $(`#v-${k}`).hidden = k !== v; });
  $$('.tabbar a').forEach(a => { if (a.dataset.tab === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (v === 'plan' && firstPlanShow) { firstPlanShow = false; requestAnimationFrame(() => scrollToWeek(false)); }
  else window.scrollTo(0, 0);
  if (v === 'progreso') drawCharts();
}
function renderAll() {
  renderTop(); renderHoy(); renderPlan(); renderHist(); renderProg();
}

/* ---------- arranque ---------- */
$('#sheet-close').addEventListener('click', closeSheet);
$('#sheet').addEventListener('close', () => { document.documentElement.classList.remove('lock'); sheetCtx = null; });
$('#sheet').addEventListener('click', ev => { if (ev.target === ev.currentTarget) closeSheet(); });
$('#btn-go-week').addEventListener('click', () => scrollToWeek(true));
$('#btn-extra').addEventListener('click', openExtra);
$('#btn-export').addEventListener('click', exportJSON);
$('#btn-csv').addEventListener('click', exportCSV);
$('#btn-import').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', ev => { const fl = ev.target.files && ev.target.files[0]; if (fl) importJSON(fl); ev.target.value = ''; });
$('#btn-wipe').addEventListener('click', () => {
  if (!confirm('¿Borrar todos los registros de este iPhone? No se puede deshacer si no tienes copia.')) return;
  S.logs = {}; save(); renderAll(); toast('Registros borrados.');
});
window.addEventListener('hashchange', route);
let rz = 0;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCharts, 150); });
window.addEventListener('scroll', () => { $('.top').classList.toggle('scrolled', window.scrollY > 4); }, {passive: true});
document.addEventListener('pointerdown', ev => {
  if (!ev.target.closest('.chart')) $$('.tip').forEach(t => { t.hidden = true; });
});
// Si la app vuelve a primer plano otro día, recarga para que «hoy» sea hoy
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !qHoy && isoLocal(new Date()) !== TODAY && !$('#sheet').open) location.reload();
});

renderAll();
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Hay una versión nueva de la app.', {label: 'Actualizar', run: () => location.reload()});
  });
}
})();
