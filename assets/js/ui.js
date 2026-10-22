/* =========================================================================
   WINNER — компоненты интерфейса: иконки, модалки, шторки, тосты, таблицы,
   поля форм, свой выпадающий список, графики, печать, выгрузка CSV.
   ========================================================================= */
(function () {
  const W = window.W;
  const t = (s, v) => W.t(s, v);
  const esc = W.esc;

  /* ---------- иконки (24×24, обводка) ---------- */
  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    report: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 17v-3M12 17v-6M16 17v-2"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3h2.6l2.2 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 7H6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    wallet: '<path d="M20 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-1"/><path d="M21 10h-5a2 2 0 0 0 0 4h5z"/>',
    bank: '<path d="M3 21h18M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9M2.5 9.5 12 3.5l9.5 6z"/>',
    factory: '<path d="M3 21V10l5 3v-3l5 3v-3l5 3V4h3v17z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
    warehouse: '<path d="M3 21V8.5L12 3l9 5.5V21"/><path d="M7 21v-8h10v8M7 17h10"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    shieldUser: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><circle cx="12" cy="10" r="2.5"/><path d="M8 16.5a4.5 4.5 0 0 1 8 0"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.85.57 2.8.7A2 2 0 0 1 22 16.9z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.24A9 9 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    arrIn: '<path d="M17 7 7 17M17 17H7V7"/>',
    arrOut: '<path d="M7 17 17 7M7 7h10v10"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
    users: '<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    shieldCheck: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 10l-2 2 2 2"/>',
    trendUp: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    trendDown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/>',
    drop: '<path d="M12 2.7s7 7.3 7 12.3a7 7 0 0 1-14 0c0-5 7-12.3 7-12.3z"/>',
    play: '<path d="m7 4 13 8-13 8z"/>',
    flag: '<path d="M4 22V4M4 15s1.5-2 6-2 6 2 10 0V4c-4 2-5.5 0-10 0S4 6 4 6"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18"/><path d="M7 6h1v4M16.7 13.9l.7.7-2.8 2.8"/>',
  };
  W.icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
  const I = W.icon;
  W.LOGO_W = '<svg viewBox="0 0 24 24"><path d="M3.5 6.5l3.6 11 4.9-9.3 4.9 9.3 3.6-11"/></svg>';

  /* ---------- тосты ---------- */
  W.toast = (msg, type = 'ok') => {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const ic = { ok: 'check', err: 'x', warn: 'alert', info: 'bell' }[type] || 'check';
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<span class="t-ic">${I(ic, 'ic-sm')}</span><span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, type === 'err' ? 5200 : 3400);
  };

  /* ---------- модалки и шторки ---------- */
  const stack = [];
  W.modal = (o) => {
    const ov = document.createElement('div');
    ov.className = 'overlay' + (o.drawer ? ' drawer-wrap' : '');
    const box = o.drawer ? 'drawer' : `modal ${o.size || ''}`;
    ov.innerHTML = `<div class="${box} ${o.cls || ''}" role="dialog" aria-modal="true">
      <div class="grab"></div>
      ${o.title != null ? `<div class="modal-head">
        ${o.icon ? `<div class="m-ic ${o.iconCls || ''}">${I(o.icon)}</div>` : ''}
        <div style="min-width:0;flex:1"><h3>${o.title}</h3>${o.sub ? `<div class="sub">${o.sub}</div>` : ''}</div>
        <button class="icon-btn ghost x" data-m="close" aria-label="${t('Закрыть')}">${I('x')}</button>
      </div>` : ''}
      <div class="modal-body">${o.body || ''}</div>
      ${o.foot ? `<div class="modal-foot">${o.foot}</div>` : ''}
    </div>`;
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const el = ov.firstElementChild;
    let closed = false;
    const close = (val) => {
      if (closed) return; closed = true;
      ov.classList.add('closing');
      setTimeout(() => { ov.remove(); if (!document.querySelector('.overlay')) document.body.style.overflow = ''; }, 190);
      stack.splice(stack.indexOf(api), 1);
      o.onClose && o.onClose(val);
    };
    const api = { el, close, ov };
    stack.push(api);
    ov.addEventListener('mousedown', e => { if (e.target === ov && !o.sticky) ov._down = true; });
    ov.addEventListener('click', e => { if (e.target === ov && ov._down && !o.sticky) close(); ov._down = false; });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-m]');
      if (!b || !el.contains(b)) return;
      const act = b.dataset.m;
      if (act === 'close') return close();
      if (o.actions && o.actions[act]) o.actions[act](b, api, e);
    });
    if (o.actions && o.actions.input) el.addEventListener('input', e => o.actions.input(e.target, api, e));
    if (o.actions && o.actions.change) el.addEventListener('change', e => o.actions.change(e.target, api, e));
    W.enhance(el);
    o.onMount && o.onMount(el, api);
    if (!o.noFocus && matchMedia('(pointer:fine)').matches) { const f = el.querySelector('.modal-body input:not([type=hidden]):not([readonly]), .modal-body textarea'); if (f) setTimeout(() => f.focus(), 60); }
    return api;
  };
  W.drawer = o => W.modal(Object.assign({ drawer: true }, o));
  W.closeTop = () => { const m = stack[stack.length - 1]; if (m) { m.close(); return true; } return false; };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.dd-menu')) W.closeTop(); });

  W.confirm = ({ title, text, ok, danger = true, icon }) => new Promise(res => {
    W.modal({
      size: 'sm', title: title || t('Подтвердите действие'), icon: icon || (danger ? 'trash' : 'alert'), iconCls: danger ? 'bad' : '',
      body: text ? `<p class="t2">${text}</p>` : '',
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ${danger ? 'danger solid' : 'primary'}" data-m="ok">${ok || (danger ? t('Удалить') : t('Подтвердить'))}</button>`,
      actions: { ok: (b, m) => { m.close(true); } },
      onClose: v => res(!!v), noFocus: true,
    });
  });

  /* ---------- поповер ---------- */
  let popEl = null;
  W.closePop = () => { if (popEl) { popEl.remove(); popEl = null; } };
  W.pop = (anchor, html, onClick, opt = {}) => {
    W.closePop();
    const el = document.createElement('div');
    el.className = 'pop';
    el.innerHTML = html;
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    let left = opt.alignLeft ? r.left : r.right - w;
    left = W.clamp(left, 12, innerWidth - w - 12);
    let top = r.bottom + 8;
    if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
    el.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { onClick && onClick(b.dataset.p, b); W.closePop(); } });
    popEl = el;
    setTimeout(() => document.addEventListener('click', function h(e) { if (popEl && !popEl.contains(e.target)) { W.closePop(); } document.removeEventListener('click', h); }), 0);
    return el;
  };

  /* ---------- свой выпадающий список поверх <select> (только мышь; на телефоне — системный) ---------- */
  let ddEl = null;
  const closeDD = () => { if (ddEl) { ddEl.remove(); ddEl = null; } };
  const openDD = (sel) => {
    closeDD();
    const opts = [...sel.options].filter(o => !o.hidden);
    const menu = document.createElement('div');
    menu.className = 'dd-menu';
    const searchable = opts.length > 8;
    menu.innerHTML = `${searchable ? `<div class="inp-wrap dd-search">${I('search')}<input class="inp sm" placeholder="${t('Поиск')}"></div>` : ''}<div class="dd-list"></div>`;
    const list = menu.querySelector('.dd-list');
    const draw = (q = '') => {
      const qq = q.trim().toLowerCase();
      const f = opts.filter(o => !qq || o.text.toLowerCase().includes(qq));
      list.innerHTML = f.length ? f.map(o => `<button type="button" class="dd-opt ${o.value === sel.value ? 'sel' : ''}" data-v="${esc(o.value)}" ${o.disabled ? 'disabled' : ''}>${esc(o.text)}${o.dataset.sub ? `<small>${esc(o.dataset.sub)}</small>` : ''}</button>`).join('')
        : `<div class="muted" style="padding:10px 12px">${t('Ничего не найдено')}</div>`;
    };
    draw();
    document.body.appendChild(menu);
    const r = sel.getBoundingClientRect();
    menu.style.minWidth = r.width + 'px';
    menu.style.maxWidth = Math.max(r.width, 320) + 'px';
    const h = Math.min(menu.offsetHeight, 300);
    let top = r.bottom + 6;
    if (top + h > innerHeight - 10) top = Math.max(10, r.top - h - 6);
    menu.style.top = top + 'px';
    menu.style.left = W.clamp(r.left, 10, innerWidth - menu.offsetWidth - 10) + 'px';
    const s = menu.querySelector('.dd-search input');
    menu._t = Date.now();
    if (s) { s.focus({ preventScroll: true }); s.addEventListener('input', () => draw(s.value)); s.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = list.querySelector('.dd-opt'); if (b) b.click(); } if (e.key === 'Escape') closeDD(); }); }
    const cur = list.querySelector('.sel'); if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 2);
    menu.addEventListener('click', e => {
      const b = e.target.closest('.dd-opt'); if (!b) return;
      if (sel.value !== b.dataset.v) { sel.value = b.dataset.v; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
      closeDD(); sel.focus();
    });
    ddEl = menu;
  };
  let ddSel = null;
  document.addEventListener('mousedown', e => {
    const sel = e.target.closest('select.inp');
    if (ddEl && !ddEl.contains(e.target)) {
      const same = sel && sel === ddSel;
      closeDD(); ddSel = null;
      if (same) { e.preventDefault(); return; } // повторный клик по тому же списку — просто закрыть
    }
    if (!sel || sel.disabled || sel.dataset.native != null || !matchMedia('(pointer:fine)').matches) return;
    e.preventDefault();
    sel.focus();
    openDD(sel);
    ddSel = sel;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ddEl) { closeDD(); e.stopPropagation(); } }, true);
  addEventListener('scroll', e => { if (ddEl && !ddEl.contains(e.target) && Date.now() - ddEl._t > 250) closeDD(); }, true);
  addEventListener('resize', closeDD);

  /* ---------- поля форм ---------- */
  W.fi = ({ name, label, value = '', type = 'text', ph = '', money, req, hint, cls = '', attrs = '', icon, suffix }) => {
    const v = money ? (value === '' || value == null ? '' : W.fmtNum(value, 2)) : value;
    const input = `<input class="inp${money ? ' num' : ''}" name="${name}" type="${money ? 'text' : type}" ${money ? 'inputmode="decimal" data-money autocomplete="off"' : ''} value="${esc(v)}" placeholder="${esc(ph)}" ${req ? 'data-req' : ''} ${attrs}>`;
    return `<div class="field ${cls}">${label ? `<label>${label}${req ? ' <span style="color:var(--bad)">*</span>' : ''}</label>` : ''}
      ${icon || suffix ? `<div class="inp-wrap ${suffix ? 'has-suffix' : ''}">${icon ? I(icon) : ''}${input}${suffix ? `<span class="suffix">${suffix}</span>` : ''}</div>` : input}
      ${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
  };
  W.fs = ({ name, label, options, value = '', cls = '', attrs = '', req }) => `<div class="field ${cls}">${label ? `<label>${label}${req ? ' <span style="color:var(--bad)">*</span>' : ''}</label>` : ''}
    <select class="inp" name="${name}" ${req ? 'data-req' : ''} ${attrs}>${W.opts(options, value)}</select></div>`;
  W.opts = (options, value) => options.map(o => { const [v, txt, sub] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''} ${sub ? `data-sub="${esc(sub)}"` : ''}>${esc(txt)}</option>`; }).join('');
  W.fta = ({ name, label, value = '', ph = '', cls = '' }) => `<div class="field ${cls}">${label ? `<label>${label}</label>` : ''}<textarea class="inp" name="${name}" placeholder="${esc(ph)}">${esc(value)}</textarea></div>`;
  W.fsw = ({ name, label, checked }) => `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="tr"></span><span>${label}</span></label>`;
  W.form = (el) => {
    const d = {};
    el.querySelectorAll('[name]').forEach(i => {
      if (i.type === 'checkbox') { if (i.dataset.multi != null) { (d[i.name] = d[i.name] || []); if (i.checked) d[i.name].push(i.value); } else d[i.name] = i.checked; }
      else if (i.type === 'radio') { if (i.checked) d[i.name] = i.value; }
      else d[i.name] = i.dataset.money != null || i.type === 'number' ? W.parseNum(i.value) : i.value.trim();
    });
    return d;
  };
  // проверка обязательных полей; подсвечивает и возвращает false
  W.validate = (el) => {
    let ok = true;
    el.querySelectorAll('[data-req]').forEach(i => {
      const f = i.closest('.field');
      const bad = i.dataset.money != null ? !(W.parseNum(i.value) > 0) : !String(i.value).trim();
      if (f) f.classList.toggle('err', bad);
      if (bad && ok) { ok = false; i.focus(); }
    });
    if (!ok) W.toast(t('Заполните обязательные поля'), 'warn');
    return ok;
  };
  // разряды в денежных полях прямо при вводе
  document.addEventListener('input', e => {
    const i = e.target;
    if (!i.matches || !i.matches('input[data-money]')) return;
    const f = i.closest('.field'); if (f) f.classList.remove('err');
    const raw = i.value.replace(/[^\d.,]/g, '').replace('.', ',');
    const [a, b] = raw.split(',');
    const fromEnd = i.value.length - i.selectionEnd;
    const v = (a || '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (b != null ? ',' + b.slice(0, 2) : '');
    i.value = v;
    const pos = Math.max(0, v.length - fromEnd);
    try { i.setSelectionRange(pos, pos); } catch (er) { /* number */ }
  });
  document.addEventListener('input', e => { const f = e.target.closest && e.target.closest('.field.err'); if (f && String(e.target.value).trim()) f.classList.remove('err'); });

  /* ---------- общие кусочки разметки ---------- */
  W.badge = (txt, cls = '') => `<span class="badge ${cls}">${txt}</span>`;
  W.empty = (title, text = '', icon = 'box', btn = '') => `<div class="empty"><div class="em-ic">${I(icon)}</div><b>${title}</b>${text ? `<div>${text}</div>` : ''}${btn ? `<div class="mt-16">${btn}</div>` : ''}</div>`;
  W.kpi = ({ label, value, foot = '', icon = 'dashboard', c = '', hero, link, small }) => `<div class="kpi ${hero ? 'hero' : ''} ${link ? 'link' : ''}" ${link ? `data-go="${link}"` : ''}>
    <div class="kpi-top"><div class="kpi-ic ${c}">${I(icon)}</div><div class="kpi-label">${label}</div></div>
    <div class="kpi-val">${value}${small ? `<small>${small}</small>` : ''}</div><div class="kpi-foot">${foot}</div></div>`;
  W.moneyKpi = n => {
    const usd = W.db.settings.currency === 'USD';
    return usd ? '$' + W.fmtNum(n, 2) : `${W.fmtNum(n)}<small>${W.curLabel()}</small>`;
  };
  W.tabs = (items, cur, act = 'tab') => `<div class="tabs">${items.map(i => `<button class="tab ${i.id === cur ? 'on' : ''}" data-a="${act}" data-v="${i.id}">${i.icon ? I(i.icon, 'ic-sm') : ''}${i.label}${i.cnt != null ? `<span class="cnt ${i.hot ? 'hot' : ''}">${i.cnt}</span>` : ''}</button>`).join('')}<span class="ink"></span></div>`;
  W.seg = (items, cur, act) => `<div class="seg">${items.map(i => `<button class="${i.id === cur ? 'on' : ''}" data-a="${act}" data-v="${i.id}">${i.label}${i.cnt != null ? `<span class="cnt">${i.cnt}</span>` : ''}</button>`).join('')}</div>`;
  W.searchBox = (value, act = 'q', ph) => `<div class="inp-wrap search">${I('search')}<input class="inp" type="search" data-on="${act}" value="${esc(value || '')}" placeholder="${ph || t('Поиск')}"></div>`;
  W.actBtns = (id, { edit = true, del = true, extra = '' } = {}) => `<div class="act">${extra}${edit ? `<button data-a="edit" data-id="${id}" title="${t('Изменить')}">${I('edit')}</button>` : ''}${del ? `<button class="del" data-a="del" data-id="${id}" title="${t('Удалить')}">${I('trash')}</button>` : ''}</div>`;
  W.periodOpts = () => [['today', t('Сегодня')], ['week', t('Эта неделя')], ['month', t('Этот месяц')], ['prev', t('Прошлый месяц')], ['quarter', t('3 месяца')], ['year', t('Этот год')], ['all', t('Всё время')]];
  W.periodRange = p => {
    const td = W.today(), d = new Date();
    if (p === 'today') return [td, td];
    if (p === 'week') return [W.weekStart(), td];
    if (p === 'month') return [td.slice(0, 8) + '01', td];
    if (p === 'prev') { const s = new Date(d.getFullYear(), d.getMonth() - 1, 1), e = new Date(d.getFullYear(), d.getMonth(), 0); return [W.isoDay(s), W.isoDay(e)]; }
    if (p === 'quarter') return [W.addDays(td, -90), td];
    if (p === 'year') return [td.slice(0, 4) + '-01-01', td];
    return [null, null];
  };

  /* ---------- таблица (на телефоне — карточки) ---------- */
  // cols: { label, cls, r, title, aside, w, render(row) }
  W.table = ({ cols, rows, empty, rowAttr, foot, cls = '' }) => {
    if (!rows.length) return empty || W.empty(t('Пока пусто'), '', 'list');
    const th = cols.map(c => `<th class="${c.r ? 'r' : ''} ${c.cls || ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.label || ''}</th>`).join('');
    const tr = rows.map(r => `<tr ${rowAttr ? rowAttr(r) : ''}>${cols.map(c => {
      const v = c.render ? c.render(r) : esc(r[c.key]);
      const k = [c.r ? 'r' : '', c.cls || '', c.title ? 'cell-title' : '', c.aside ? 'cell-aside' : ''].join(' ');
      return `<td class="${k}" data-label="${esc(String(c.label || '').replace(/<[^>]+>/g, ''))}">${v ?? ''}</td>`;
    }).join('')}</tr>`).join('');
    const tf = foot ? `<tfoot><tr>${foot.map((f, i) => `<td class="${cols[i] && cols[i].r ? 'r' : ''}" data-label="${esc(String((cols[i] || {}).label || '').replace(/<[^>]+>/g, ''))}">${f ?? ''}</td>`).join('')}</tr></tfoot>` : '';
    return `<div class="tbl-wrap"><table class="tbl stack ${cls}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody>${tf}</table></div>`;
  };
  // постраничный вывод длинных списков
  W.paged = (rows, page, size = 40) => ({ rows: rows.slice(0, page * size), more: rows.length > page * size, total: rows.length });
  W.moreBtn = (more, total, shown) => more ? `<div class="tbl-foot"><span>${t('Показано {a} из {b}', { a: shown, b: total })}</span><button class="btn sm" data-a="more">${t('Показать ещё')}</button></div>` : '';

  /* ---------- графики ---------- */
  let gid = 0;
  // площадь по дням: pts = [{ x: 'метка', v: число, tip: 'подпись' }]
  W.areaChart = (pts, { h = 230, fmt = W.money } = {}) => {
    const id = 'ch' + (++gid), w = 640, padL = 8, padR = 8, padT = 16, padB = 26;
    const max = Math.max(1, ...pts.map(p => p.v)) * 1.12;
    const X = i => padL + (pts.length < 2 ? 0 : i * (w - padL - padR) / (pts.length - 1));
    const Y = v => padT + (h - padT - padB) * (1 - v / max);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
    const area = `${line}L${X(pts.length - 1)},${h - padB}L${X(0)},${h - padB}Z`;
    const grid = [0.25, 0.5, 0.75, 1].map(f => `<line class="grid-l" x1="0" x2="${w}" y1="${Y(max / 1.12 * f).toFixed(1)}" y2="${Y(max / 1.12 * f).toFixed(1)}"/><text class="axis-t" x="${w}" y="${(Y(max / 1.12 * f) - 5).toFixed(1)}" text-anchor="end">${W.compact(max / 1.12 * f)}</text>`).join('');
    const step = Math.ceil(pts.length / 7);
    const labels = pts.map((p, i) => (i % step === 0 || i === pts.length - 1) && !(i !== pts.length - 1 && pts.length - 1 - i < step / 2) ? `<text class="axis-t" x="${X(i).toFixed(1)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}">${esc(p.x)}</text>` : '').join('');
    const data = esc(JSON.stringify(pts.map((p, i) => [X(i) / w, Y(p.v) / h, p.tip || p.x, fmt(p.v)])));
    return `<div class="chart" data-chart="area" data-pts="${data}" style="aspect-ratio:${w}/${h}">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${t('График продаж')}">
        <defs><linearGradient id="gA${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--brand)" stop-opacity=".28"/><stop offset="1" stop-color="var(--brand)" stop-opacity="0"/></linearGradient></defs>
        ${grid}<path d="${area}" fill="url(#gA${id})"/><path class="ln" d="${line}" vector-effect="non-scaling-stroke"/>${labels}
        <line class="hover-l" x1="0" x2="0" y1="${padT}" y2="${h - padB}" style="display:none" vector-effect="non-scaling-stroke"/>
      </svg><span class="chart-dot" style="display:none;position:absolute;width:12px;height:12px;border-radius:50%;background:var(--brand);border:2px solid var(--surface);transform:translate(-50%,-50%);pointer-events:none"></span><div class="chart-tip" style="display:none"></div></div>`;
  };
  // кольцо: segs = [{ label, v, color }]
  W.donut = (segs, { center = '', sub = '', fmt = W.money } = {}) => {
    const total = W.sum(segs, s => s.v) || 1, r = 70, c = 2 * Math.PI * r, gap = 2.5;
    let off = 0;
    const arcs = segs.filter(s => s.v > 0).map(s => {
      const len = Math.max(0, s.v / total * c - (segs.length > 1 ? gap : 0));
      const a = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${s.color}" stroke-width="20" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" data-tip="${esc(s.label)}|${esc(fmt(s.v))}|${Math.round(s.v / total * 100)}%" style="cursor:pointer"/>`;
      off += s.v / total * c;
      return a;
    }).join('');
    return `<div class="donut-wrap"><div class="chart" data-chart="donut" style="aspect-ratio:1">
      <svg viewBox="0 0 180 180" role="img" aria-label="${esc(sub)}"><g transform="rotate(-90 90 90)"><circle cx="90" cy="90" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="20"/>${arcs}</g></svg>
      <div class="donut-center"><div><b>${center}</b><span>${sub}</span></div></div><div class="chart-tip" style="display:none"></div></div>
      <div class="legend" style="flex-direction:column;gap:10px;flex:1;min-width:150px">${segs.map(s => `<span style="justify-content:space-between;width:100%"><span style="display:inline-flex;align-items:center;gap:8px"><i style="background:${s.color}"></i>${esc(s.label)}</span><b class="money" style="color:var(--text)">${fmt(s.v)}</b></span>`).join('')}</div></div>`;
  };
  // горизонтальные полосы
  W.hbars = (items, { color = 'var(--brand)', fmt = W.money } = {}) => {
    const max = Math.max(1, ...items.map(i => i.v));
    return `<div class="hbar">${items.map(i => `<div class="hb-name" title="${esc(i.label)}">${esc(i.label)}</div><div class="hb-val">${fmt(i.v)}</div><div class="bar"><i style="width:${(i.v / max * 100).toFixed(1)}%;background:${i.color || color}"></i></div>`).join('')}</div>`;
  };
  W.bindCharts = root => {
    root.querySelectorAll('[data-chart="area"]').forEach(ch => {
      const pts = JSON.parse(ch.dataset.pts || '[]'), tip = ch.querySelector('.chart-tip'), ln = ch.querySelector('.hover-l'), dot = ch.querySelector('.chart-dot');
      const show = (cx) => {
        const r = ch.getBoundingClientRect(); const fx = (cx - r.left) / r.width;
        let best = 0, bd = 9; pts.forEach((p, i) => { const d = Math.abs(p[0] - fx); if (d < bd) { bd = d; best = i; } });
        const p = pts[best]; if (!p) return;
        const vx = p[0] * 640;
        ln.setAttribute('x1', vx); ln.setAttribute('x2', vx); ln.style.display = '';
        dot.style.display = ''; dot.style.left = p[0] * 100 + '%'; dot.style.top = p[1] * 100 + '%';
        tip.style.display = ''; tip.innerHTML = `<span class="muted">${esc(p[2])}</span><b>${esc(p[3])}</b>`;
        tip.style.left = W.clamp(p[0] * r.width, 70, r.width - 70) + 'px'; tip.style.top = p[1] * r.height + 'px';
      };
      const hide = () => { tip.style.display = 'none'; ln.style.display = 'none'; dot.style.display = 'none'; };
      ch.addEventListener('pointermove', e => show(e.clientX));
      ch.addEventListener('pointerdown', e => show(e.clientX));
      ch.addEventListener('pointerleave', hide);
    });
    root.querySelectorAll('[data-chart="donut"]').forEach(ch => {
      const tip = ch.querySelector('.chart-tip');
      ch.addEventListener('pointermove', e => {
        const s = e.target.closest('circle[data-tip]');
        if (!s) { tip.style.display = 'none'; return; }
        const [a, b, c] = s.dataset.tip.split('|'); const r = ch.getBoundingClientRect();
        tip.style.display = ''; tip.innerHTML = `<span class="muted">${a} · ${c}</span><b>${b}</b>`;
        tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px';
      });
      ch.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
    });
  };

  /* бегунок под активной вкладкой */
  // вкладки перерисовываются целиком, поэтому полоска стартует с прошлого места этой же страницы
  let lastInk = null;
  const inkOne = tb => {
    const on = tb.querySelector('.tab.on'), ink = tb.querySelector('.ink');
    if (!on || !ink || !on.offsetWidth) return;
    const page = W.cur ? W.cur.id : '', w = on.offsetWidth - 16, x = on.offsetLeft + 8;
    if (!tb._placed) {
      tb._placed = true;
      ink.style.transition = 'none';
      if (lastInk && lastInk.page === page) { ink.style.width = lastInk.w + 'px'; ink.style.transform = `translateX(${lastInk.x}px)`; }
      else { ink.style.width = w + 'px'; ink.style.transform = `translateX(${x}px)`; }
      void ink.offsetWidth;
      ink.style.transition = '';
    }
    ink.style.width = w + 'px';
    ink.style.transform = `translateX(${x}px)`;
    lastInk = { page, w, x };
    if (tb.scrollWidth > tb.clientWidth) { const target = on.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2; tb.scrollLeft = Math.max(0, target); }
  };
  const inkRO = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(es => es.forEach(e => inkOne(e.target))) : null;
  W.placeInk = root => root.querySelectorAll('.tabs').forEach(tb => { inkOne(tb); if (inkRO && !tb._ro) { tb._ro = 1; inkRO.observe(tb); } });
  W.enhance = root => { W.bindCharts(root); requestAnimationFrame(() => { W.placeInk(root); W.placeLangPill(root); }); };
  // подмножество шрифта с Қ Ғ Ў Ҳ грузится по требованию — после загрузки ширины вкладок меняются
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { W.placeInk(document); W.placeLangPill(document); });

  /* ---------- изображение товара: фото или фирменная «банка/ведро» ---------- */
  const shade = (hex, k) => {
    const n = parseInt(String(hex || '#888').replace('#', ''), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return '#' + [f(r), f(g), f(b)].map(v => W.clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
  };
  W.productArt = (p) => {
    if (p.photo) return `<img src="${p.photo}" alt="${esc(p.name)}" loading="lazy">`;
    const c = p.color || '#3346ff', id = 'pa' + (++gid);
    const light = shade(c, .35), dark = shade(c, -.35);
    if (p.pack === 'bucket') return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <defs><linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#dfe3ec"/><stop offset=".35" stop-color="#ffffff"/><stop offset=".75" stop-color="#eef1f6"/><stop offset="1" stop-color="#c9cfdb"/></linearGradient>
      <linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset=".4" stop-color="${c}"/><stop offset=".7" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
      <ellipse cx="100" cy="178" rx="64" ry="9" fill="#0b1020" opacity=".14"/>
      <path d="M38 62 C40 30 160 30 162 62" fill="none" stroke="#8d95a8" stroke-width="5" stroke-linecap="round"/>
      <path d="M36 64 L49 168 Q100 182 151 168 L164 64 Z" fill="url(#${id}b)"/>
      <path d="M40 92 L46 142 Q100 154 154 142 L160 92 Q100 104 40 92 Z" fill="url(#${id}c)"/>
      <path d="M68 104c8-6 20-4 26 2 7-5 18-4 22 3 6 9-4 20-16 17-6 6-18 6-23-1-12 1-17-13-9-21z" fill="#fff" opacity=".92"/>
      <text x="100" y="124" text-anchor="middle" font-family="Geologica, sans-serif" font-weight="800" font-size="15" letter-spacing="1.5" fill="${dark}">WINNER</text>
      <ellipse cx="100" cy="64" rx="64" ry="13" fill="${c}"/><ellipse cx="100" cy="62" rx="56" ry="9" fill="${light}" opacity=".55"/>
      <path d="M58 72c0 10 3 16 6 16s5-6 5-14" fill="${c}"/><circle cx="64" cy="92" r="3.6" fill="${c}"/>
      <path d="M130 74c0 7 2 11 4 11s4-4 4-10" fill="${c}"/></svg>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <defs><linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#aeb5c3"/><stop offset=".3" stop-color="#f4f6fa"/><stop offset=".7" stop-color="#c3c9d5"/><stop offset="1" stop-color="#9aa2b2"/></linearGradient>
      <linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="${dark}"/><stop offset=".38" stop-color="${c}"/><stop offset=".68" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
      <ellipse cx="100" cy="176" rx="60" ry="9" fill="#0b1020" opacity=".14"/>
      <path d="M46 58 V160 A54 12 0 0 0 154 160 V58 Z" fill="url(#${id}m)"/>
      <path d="M46 76 V146 A54 12 0 0 0 154 146 V76 A54 12 0 0 1 46 76 Z" fill="url(#${id}c)"/>
      <path d="M46 104 A54 12 0 0 0 154 104 V122 A54 12 0 0 1 46 122 Z" fill="#fff" opacity=".93"/>
      <text x="100" y="121" text-anchor="middle" font-family="Geologica, sans-serif" font-weight="800" font-size="15" letter-spacing="1.5" fill="${dark}">WINNER</text>
      <ellipse cx="100" cy="58" rx="54" ry="12" fill="#d9dde6"/><ellipse cx="100" cy="58" rx="45" ry="8.5" fill="#b7bdca"/>
      <path d="M62 66c0 12 3 19 6 19s5-8 5-17" fill="${c}"/><circle cx="68" cy="90" r="3.4" fill="${c}"/></svg>`;
  };
  W.readImage = (file, max = 560) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/jpeg', .84));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });

  /* ---------- печать и выгрузка ---------- */
  W.printHTML = (html) => {
    let root = document.getElementById('print-root');
    if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = html;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); root.innerHTML = ''; removeEventListener('afterprint', done); };
    addEventListener('afterprint', done);
    setTimeout(() => { window.print(); setTimeout(done, 1500); }, 60);
  };
  W.downloadCSV = (name, head, rows) => {
    const q = v => { const s = String(v ?? '').replace(/ /g, ' '); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = '﻿' + [head, ...rows].map(r => r.map(q).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name.replace(/[\\/:*?"<>|]+/g, '_') + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  W.downloadFile = (name, text, type = 'application/json') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  // шапка документа/отчёта с реквизитами компании
  W.docHead = (title, sub = '', lang) => {
    const c = W.db.settings.company, tt = s => W.t(s, null, lang);
    return `<div class="doc-head"><div><div class="brand">WINNER</div><div style="color:#555">${esc(c.name)}</div></div>
      <div style="text-align:right;font-size:12px;color:#444">${tt('ИНН')}: ${esc(c.inn)}<br>${esc(c.address)}<br>${esc(c.phone)} · ${esc(c.email)}</div></div>
      <div class="doc-stripe"></div><h2>${title}</h2>${sub ? `<div class="doc-no">${sub}</div>` : ''}`;
  };
})();
