/* =========================================================================
   WINNER — каркас кабинета: сайдбар, верхняя панель, роутер, уведомления,
   быстрый поиск (Ctrl+K), тема, нижняя навигация на телефоне.
   ========================================================================= */
(function () {
  const W = window.W, N = W.N, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const $ = s => document.querySelector(s);

  W.pages = {};
  W.page = (id, def) => { W.pages[id] = def; };
  W.state = {};
  // состояние страницы (вкладки, фильтры); недостающие ключи всегда добираются из значений по умолчанию
  W.st = (id, init) => {
    const s = W.state[id] || (W.state[id] = {});
    if (init) for (const k in init) if (!(k in s)) s[k] = init[k];
    return s;
  };

  W.NAV = [
    { g: N('Обзор'), items: [['summary', N('Сводка'), 'dashboard'], ['reports', N('Отчёты'), 'report']] },
    { g: N('Продажи'), items: [['sales', N('Продажи'), 'cart'], ['customers', N('Контрагенты'), 'briefcase']] },
    { g: N('Финансы'), items: [['expense', N('Расход'), 'receipt'], ['cash', N('Касса'), 'wallet'], ['bank', N('Банк'), 'bank']] },
    { g: N('Производство'), items: [['production', N('Производство'), 'factory'], ['warehouse', N('Склад'), 'warehouse'], ['income', N('Приход'), 'box'], ['catalog', N('Каталог'), 'grid']] },
    { g: N('Сотрудники'), items: [['salary', N('Зарплата'), 'banknote']] },
    { g: N('Управление'), items: [['staff', N('Сотрудники'), 'shieldUser'], ['admin', N('Администрирование'), 'settings']] },
  ];
  const navInfo = id => { for (const g of W.NAV) for (const it of g.items) if (it[0] === id) return { group: g.g, label: it[1], icon: it[2] }; return id === 'profile' ? { group: null, label: N('Личный кабинет'), icon: 'user' } : null; };
  const BNAV = {
    director: ['summary', 'sales', 'warehouse', 'bank'], accountant: ['summary', 'bank', 'cash', 'salary'],
    manager: ['summary', 'sales', 'customers', 'catalog'], seller: ['sales', 'catalog', 'customers', 'summary'],
    storekeeper: ['warehouse', 'catalog', 'income'], technologist: ['production', 'warehouse', 'catalog', 'income'],
  };
  const firstPage = () => { const me = W.me(); const pr = BNAV[me.roles[0]] || []; return pr.find(p => W.can(p)) || W.NAV.flatMap(g => g.items.map(i => i[0])).find(p => W.can(p)) || 'profile'; };

  /* ---------- бейджи пунктов меню ---------- */
  const badge = id => {
    if (id === 'bank' && W.allow('bank.confirm')) { const n = W.db.bank.filter(b => b.status === 'pending').length; return n ? { n } : null; }
    if (id === 'warehouse') { const n = W.db.sales.filter(s => ['new', 'picking', 'ready', 'shipping'].includes(s.stage) && s.source === 'phone').length; return n ? { n, soft: true } : null; }
    if (id === 'catalog' || id === 'production') { const n = W.lowProducts().length; return n ? { n } : null; }
    if (id === 'sales') { const n = W.salesStats().debtCount; return n ? { n, soft: true } : null; }
    return null;
  };

  /* ---------- уведомления ---------- */
  W.notifs = () => {
    const out = [];
    if (W.allow('bank.confirm')) { const p = W.db.bank.filter(b => b.status === 'pending'); if (p.length) out.push({ ic: 'bank', cls: 'info', title: t('{n} операций ждут подтверждения', { n: p.length }), sub: W.money(W.sum(p, b => b.amount)), go: ['bank', { tab: 'pending' }] }); }
    if (W.can('catalog') || W.can('production')) W.lowProducts().slice(0, 8).forEach(p => {
      const s = W.stock('p', p.id);
      out.push({ ic: 'alert', cls: s <= 0 ? 'bad' : 'warn', title: s <= 0 ? t('Нет в наличии: {n}', { n: p.name }) : t('Мало на складе: {n}', { n: p.name }), sub: t('Остаток {a} шт · порог {b}', { a: W.qty(s), b: W.minStock(p) }), go: [W.can('production') ? 'production' : 'catalog', W.can('production') ? { tab: 'nomen' } : {}] });
    });
    if (W.can('production') || W.can('income')) W.lowMaterials().slice(0, 5).forEach(r => out.push({ ic: 'flask', cls: r.status === 'short' ? 'bad' : 'warn', title: t('Сырьё: {n}', { n: r.m.name }), sub: t('Остаток {a} {u} · к закупке {b} {u}', { a: W.qty(r.stock), b: W.qty(r.toBuy), u: t(r.m.unit) }), go: [W.can('production') ? 'production' : 'income', W.can('production') ? { tab: 'stock' } : {}] }));
    if (W.can('warehouse')) { const n = W.db.sales.filter(s => ['new', 'picking', 'ready'].includes(s.stage) && s.source === 'phone').length; if (n) out.push({ ic: 'truck', cls: 'info', title: t('Заказы к отгрузке: {n}', { n }), sub: t('Склад → Отгрузки'), go: ['warehouse', { tab: 'ship' }] }); }
    return out;
  };

  /* ---------- разметка каркаса ---------- */
  const sideHTML = () => {
    const me = W.me(), cur = W.cur && W.cur.id;
    const groups = W.NAV.map(g => {
      const items = g.items.filter(i => W.can(i[0]));
      if (!items.length) return '';
      return `<div class="nav-group"><div class="nav-label">${t(g.g)}</div>${items.map(([id, label, ic]) => {
        const b = badge(id);
        return `<button class="nav-item ${id === cur ? 'active' : ''} ${b ? 'has-dot' : ''}" data-nav="${id}" data-tip="${esc(t(label))}">${I(ic)}<span class="nav-txt">${t(label)}</span>${b ? `<span class="nav-badge ${b.soft ? 'soft' : ''}">${b.n > 99 ? '99+' : b.n}</span>` : ''}</button>`;
      }).join('')}</div>`;
    }).join('');
    return `<div class="side-head"><div class="logo-mark">${W.LOGO_W}</div><div class="logo-text"><b>WINNER</b><span>EAST COLOR · ${t('учёт производства')}</span></div>
        <button class="side-collapse" data-sh="rail" title="${t('Свернуть меню')}">${I('chevL', 'ic-sm')}</button></div>
      <nav class="side-nav">${groups}</nav>
      <div class="side-foot"><button class="me-card" data-nav="profile" data-tip="${esc(me.name)}"><div class="avatar" style="--av:${W.avatarBg(me.name)}">${W.initials(me.name)}</div>
        <div class="who"><b>${esc(W.shortName(me.name))}</b><span>${esc(me.roles.map(W.roleName).join(', '))}</span></div>${I('chevR', 'ic-sm')}</button></div>`;
  };
  const topHTML = () => {
    const me = W.me(), info = navInfo(W.cur ? W.cur.id : '') || {}, n = W.notifs().length;
    const dark = document.documentElement.dataset.theme === 'dark';
    return `<button class="icon-btn burger" data-sh="menu" aria-label="${t('Меню')}">${I('menu')}</button>
      <div class="crumbs">${info.group ? `<span class="crumb-g">${t(info.group)}</span><span class="crumb-sep">${I('chevR')}</span>` : ''}<b>${t(info.label || '')}</b></div>
      <button class="top-search" data-sh="cmdk">${I('search', 'ic-sm')}<span>${t('Поиск по товарам, клиентам, заказам…')}</span><span class="kbd">Ctrl K</span></button>
      <div class="top-actions">
        ${W.langSwitch()}
        <button class="icon-btn theme-btn" data-sh="theme" title="${dark ? t('Светлая тема') : t('Тёмная тема')}">${I(dark ? 'sun' : 'moon')}</button>
        <button class="icon-btn" data-sh="bell" aria-label="${t('Уведомления')}">${I('bell')}${n ? `<span class="dot">${n > 9 ? '9+' : n}</span>` : ''}</button>
        <button class="top-user" data-sh="user"><div class="avatar" style="--av:${W.avatarBg(me.name)}">${W.initials(me.name)}</div><b>${esc(W.shortName(me.name))}</b></button>
      </div>`;
  };
  const bnavHTML = () => {
    const me = W.me(), cur = W.cur && W.cur.id;
    const list = (BNAV[me.roles[0]] || []).filter(p => W.can(p)).slice(0, 4);
    W.NAV.forEach(g => g.items.forEach(i => { if (list.length < 4 && W.can(i[0]) && !list.includes(i[0])) list.push(i[0]); }));
    const inMenu = !list.includes(cur);
    return list.map(id => { const inf = navInfo(id), b = badge(id); return `<button class="${id === cur ? 'on' : ''}" data-nav="${id}">${I(inf.icon)}<span>${t(inf.label)}</span>${b && !b.soft ? '<i class="b-dot"></i>' : ''}</button>`; }).join('')
      + `<button class="${inMenu ? 'on' : ''}" data-sh="menu">${I('menu')}<span>${t('Меню')}</span></button>`;
  };

  W.renderShell = () => {
    $('.side').innerHTML = sideHTML();
    $('.top').innerHTML = topHTML();
    const bn = $('.bnav');
    bn.innerHTML = bnavHTML();
    bn.style.gridTemplateColumns = `repeat(${bn.children.length}, minmax(0, 1fr))`;
    W.placeLangPill($('.top'));
  };

  /* ---------- роутер ---------- */
  const parseHash = () => { const h = location.hash.replace(/^#\/?/, ''); const [p, q = ''] = h.split('?'); return { page: p || null, params: Object.fromEntries(new URLSearchParams(q)) }; };
  W.go = (page, params) => {
    const q = params && Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
    const h = `#/${page}${q}`;
    $('#shell').classList.remove('menu-open');
    if (location.hash === h) W.render(); else location.hash = h;
  };
  // сменить параметры текущей страницы (вкладка, режим) без прокрутки наверх
  W.setParams = (patch) => {
    const p = Object.assign({}, W.cur.params, patch);
    Object.keys(p).forEach(k => (p[k] == null || p[k] === '') && delete p[k]);
    const q = Object.keys(p).length ? '?' + new URLSearchParams(p) : '';
    history.replaceState(null, '', `#/${W.cur.id}${q}`);
    W.render({ keep: true, soft: true });
  };
  W.render = (o = {}) => {
    let { page, params } = parseHash();
    if (!page || !W.pages[page] || !W.can(page)) { page = firstPage(); params = {}; history.replaceState(null, '', `#/${page}`); }
    const pg = W.pages[page];
    const changed = !W.cur || W.cur.id !== page;
    W.cur = { id: page, params };
    const view = $('#view'), y = scrollY;
    // если пользователь печатал в поле поиска — вернём фокус и курсор после перерисовки
    const ae = document.activeElement, focusOn = ae && view.contains(ae) && ae.dataset.on ? { on: ae.dataset.on, s: ae.selectionStart } : null;
    try { view.innerHTML = pg.render(params); }
    catch (e) { console.error(e); view.innerHTML = W.empty(t('Не удалось открыть раздел'), esc(e.message), 'alert'); }
    if (!o.keep || changed) { view.classList.remove('page-in'); void view.offsetWidth; view.classList.add('page-in'); scrollTo(0, 0); }
    else scrollTo(0, y);
    if (o.soft) { const tb = view.querySelector('[data-region="tab"]'); if (tb) { tb.classList.remove('page-in'); void tb.offsetWidth; tb.classList.add('page-in'); } }
    W.enhance(view);
    pg.mount && pg.mount(view, params);
    if (focusOn && !changed) { const i = view.querySelector(`[data-on="${focusOn.on}"]`); if (i && i.tagName === 'INPUT') { i.focus({ preventScroll: true }); try { i.setSelectionRange(focusOn.s, focusOn.s); } catch (e) { /* date */ } } }
    W.renderShell();
    document.title = `${t((navInfo(page) || {}).label || '')} · WINNER`;
  };
  W.refresh = () => W.render({ keep: true });
  W.region = (name, html) => { const el = document.querySelector(`[data-region="${name}"]`); if (el) { el.innerHTML = html; W.enhance(el); } };

  /* ---------- тема ---------- */
  W.setTheme = (dark, ev) => {
    const apply = () => {
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      try { localStorage.setItem('wn.theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
      W.renderShell();
    };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
    const x = ev ? ev.clientX : innerWidth - 80, y = ev ? ev.clientY : 30;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('vt-theme');
    const tr = document.startViewTransition(apply);
    tr.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }));
    tr.finished.finally(() => document.documentElement.classList.remove('vt-theme'));
  };

  /* ---------- быстрый поиск ---------- */
  W.openCmdk = () => {
    const pages = W.NAV.flatMap(g => g.items.filter(i => W.can(i[0])).map(([id, label, ic]) => ({ kind: 'page', id, label: t(label), sub: t(g.g), ic })));
    const draw = (q) => {
      const s = q.trim().toLowerCase();
      const res = [];
      const pg = pages.filter(p => !s || p.label.toLowerCase().includes(s));
      if (pg.length) res.push([t('Разделы'), pg.slice(0, s ? 6 : 14)]);
      if (s) {
        if (W.can('catalog')) { const r = W.db.products.filter(p => (p.name + ' ' + (p.sku || '')).toLowerCase().includes(s)).slice(0, 6).map(p => ({ kind: 'product', id: p.id, label: p.name, sub: `${W.money(p.price)} · ${t('остаток')} ${W.qty(W.stock('p', p.id))}`, ic: 'grid' })); if (r.length) res.push([t('Товары'), r]); }
        if (W.can('customers')) { const r = W.db.customers.filter(c => (c.name + ' ' + c.phone + ' ' + c.inn).toLowerCase().includes(s)).slice(0, 5).map(c => ({ kind: 'customer', id: c.id, label: c.name, sub: c.phone, ic: 'briefcase' })); if (r.length) res.push([t('Контрагенты'), r]); }
        if (W.can('sales')) { const r = W.db.sales.filter(x => W.no(x.no).includes(s) || String(x.no).includes(s) || W.custName(x).toLowerCase().includes(s)).slice(-6).reverse().map(x => ({ kind: 'sale', id: x.id, label: `${t('Продажа')} №${W.no(x.no)} · ${W.custName(x)}`, sub: `${W.fmtDT(x.at)} · ${W.money(x.total)}`, ic: 'cart' })); if (r.length) res.push([t('Продажи'), r]); }
      }
      return res.length ? res.map(([g, items]) => `<div class="grp">${g}</div>${items.map(i => `<button class="pop-item" data-m="pick" data-k="${i.kind}" data-id="${i.id}"><span class="pi-ic">${I(i.ic, 'ic-sm')}</span><span style="min-width:0"><span class="ellipsis" style="display:block">${esc(i.label)}</span><small>${esc(i.sub || '')}</small></span></button>`).join('')}`).join('')
        : W.empty(t('Ничего не найдено'), t('Попробуйте другое слово'), 'search');
    };
    const m = W.modal({
      size: 'cmdk', cls: 'cmdk', body: `<div class="cmdk-in">${I('search')}<input placeholder="${t('Раздел, товар, клиент или № продажи')}" autocomplete="off"><span class="kbd">Esc</span></div><div class="cmdk-list">${draw('')}</div>`,
      actions: {
        pick: (b, mm) => {
          mm.close();
          const k = b.dataset.k, idv = b.dataset.id;
          if (k === 'page') W.go(idv);
          if (k === 'product') { W.st('catalog').q = W.product(idv).name; W.go('catalog'); }
          if (k === 'customer') { W.go('customers'); setTimeout(() => W.openCustomer && W.openCustomer(idv), 80); }
          if (k === 'sale') { W.go('sales', { tab: 'history' }); setTimeout(() => W.openSale && W.openSale(idv), 80); }
        },
      },
    });
    m.el.querySelector('.modal-body').style.padding = '0';
    const inp = m.el.querySelector('.cmdk-in input'), list = m.el.querySelector('.cmdk-list');
    setTimeout(() => inp.focus(), 50);
    let hl = 0;
    const mark = () => { const items = [...list.querySelectorAll('.pop-item')]; items.forEach((x, i) => x.classList.toggle('dd-opt', false) || x.style.setProperty('background', i === hl ? 'var(--surface-3)' : '')); };
    inp.addEventListener('input', () => { list.innerHTML = draw(inp.value); hl = 0; mark(); });
    inp.addEventListener('keydown', e => {
      const items = [...list.querySelectorAll('.pop-item')];
      if (e.key === 'ArrowDown') { hl = Math.min(items.length - 1, hl + 1); mark(); items[hl] && items[hl].scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
      if (e.key === 'ArrowUp') { hl = Math.max(0, hl - 1); mark(); items[hl] && items[hl].scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
      if (e.key === 'Enter' && items[hl]) items[hl].click();
    });
    mark();
  };

  /* ---------- обработчики каркаса ---------- */
  const tablet = () => innerWidth > 720 && innerWidth <= 1100;
  const shellClick = e => {
    const shell = $('#shell');
    // планшет: меню, раскрытое кнопкой, закрывается кликом мимо него
    if (shell.classList.contains('rail-open') && !e.target.closest('.side') && !e.target.closest('[data-sh="menu"]')) shell.classList.remove('rail-open');
    const nav = e.target.closest('[data-nav]');
    if (nav) { shell.classList.remove('rail-open'); W.go(nav.dataset.nav); return; }
    const sh = e.target.closest('[data-sh]');
    if (!sh) return;
    const a = sh.dataset.sh;
    if (a === 'menu') { if (tablet() && !sh.closest('.bnav')) shell.classList.toggle('rail-open'); else shell.classList.toggle('menu-open'); }
    if (a === 'rail') { shell.classList.toggle('rail'); try { localStorage.setItem('wn.rail', shell.classList.contains('rail') ? '1' : ''); } catch (er) { /* ignore */ } }
    if (a === 'theme') W.setTheme(document.documentElement.dataset.theme !== 'dark', e);
    if (a === 'cmdk') W.openCmdk();
    if (a === 'bell') {
      const list = W.notifs();
      W.pop(sh, `<div class="pop-title">${I('bell', 'ic-sm')} ${t('Уведомления')}</div><div class="pop-list">${list.length ? list.map((n, i) => `<button class="pop-item" data-p="${i}"><span class="pi-ic ${n.cls}">${I(n.ic, 'ic-sm')}</span><span style="min-width:0">${esc(n.title)}<small>${esc(n.sub)}</small></span></button>`).join('') : `<div class="empty" style="padding:24px 12px">${t('Всё спокойно — новых уведомлений нет')}</div>`}</div>`,
        (i) => { const n = list[+i]; W.go(n.go[0], n.go[1]); });
    }
    if (a === 'user') {
      const me = W.me();
      W.pop(sh, `<div class="pop-title" style="flex-direction:column;align-items:flex-start;gap:2px">${esc(me.name)}<small class="muted" style="font-family:var(--font);font-weight:500">${esc(me.roles.map(W.roleName).join(', '))}</small></div><div class="pop-sep"></div>
        <button class="pop-item" data-p="profile"><span class="pi-ic">${I('user', 'ic-sm')}</span>${t('Личный кабинет')}</button>
        <button class="pop-item" data-p="pass"><span class="pi-ic">${I('key', 'ic-sm')}</span>${t('Сменить пароль')}</button>
        <div class="pop-sep"></div><button class="pop-item" data-p="logout"><span class="pi-ic bad">${I('logout', 'ic-sm')}</span>${t('Выйти')}</button>`,
        (k) => { if (k === 'profile') W.go('profile'); if (k === 'pass') W.go('profile', { tab: 'security' }); if (k === 'logout') W.askLogout(); });
    }
  };
  W.askLogout = async () => { if (await W.confirm({ title: t('Выйти из кабинета?'), text: t('Чтобы вернуться, понадобятся логин и пароль.'), ok: t('Выйти'), icon: 'logout' })) W.logout(); };

  // подсказки у иконок свёрнутого меню
  let tipEl = null;
  const showTip = e => {
    const it = e.target.closest('.nav-item, .me-card');
    const shell = $('#shell');
    const railMode = shell.classList.contains('rail') || (innerWidth > 720 && innerWidth <= 1100 && !shell.classList.contains('rail-open'));
    if (tipEl) { tipEl.remove(); tipEl = null; }
    if (!it || !railMode) return;
    const r = it.getBoundingClientRect();
    tipEl = document.createElement('div'); tipEl.className = 'rail-tip'; tipEl.textContent = it.dataset.tip;
    tipEl.style.left = r.right + 12 + 'px'; tipEl.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(tipEl);
  };

  /* ---------- проверка новой версии сайта ---------- */
  const checkVersion = () => fetch('version.json?_=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(v => {
    if (v && v.v && v.v !== W.APP_VERSION && !$('.update-bar')) {
      const b = document.createElement('div'); b.className = 'update-bar';
      b.innerHTML = `${I('refresh', 'ic-sm')}<span>${t('Вышло обновление программы')}</span><button class="btn sm primary">${t('Обновить')}</button>`;
      b.querySelector('button').onclick = () => location.reload();
      document.body.appendChild(b);
    }
  }).catch(() => { /* офлайн или локальный файл */ });

  /* ---------- запуск ---------- */
  W.boot = () => {
    W.initDB();
    if (!W.me()) { location.replace('index.html'); return; }
    document.body.innerHTML = `<div class="shell" id="shell"><aside class="side"></aside><div class="scrim" data-sh="menu"></div>
      <div class="main"><header class="top"></header><main class="content" id="view"></main></div><nav class="bnav"></nav></div><div class="toasts"></div><div id="print-root"></div>`;
    const shell = $('#shell');
    try { if (localStorage.getItem('wn.rail')) shell.classList.add('rail'); } catch (e) { /* ignore */ }
    shell.addEventListener('click', shellClick);
    const side = $('.side');
    side.addEventListener('mouseover', showTip);
    side.addEventListener('mouseleave', () => { if (tipEl) { tipEl.remove(); tipEl = null; } });
    // планшет: меню раскрывается поверх контента при наведении
    side.addEventListener('mouseenter', () => { if (innerWidth > 720 && innerWidth <= 1100) shell.classList.add('rail-open'); });
    side.addEventListener('mouseleave', () => shell.classList.remove('rail-open'));

    const view = $('#view');
    const pageAct = (name) => { const pg = W.pages[W.cur.id]; return pg && pg.actions && pg.actions[name]; };
    view.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go && view.contains(go)) {
        const [pg, qs] = go.dataset.go.split('?');
        W.go(pg, go.dataset.params ? JSON.parse(go.dataset.params) : qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined);
        return;
      }
      const a = e.target.closest('[data-a]');
      if (a && view.contains(a)) { const fn = pageAct(a.dataset.a); if (fn) { e.preventDefault(); fn(a, e); } }
    });
    let deb = null;
    view.addEventListener('input', e => {
      const el = e.target.closest('[data-on]'); if (!el) return;
      const fn = pageAct(el.dataset.on); if (!fn) return;
      clearTimeout(deb);
      if (el.type === 'search' || el.type === 'text') deb = setTimeout(() => fn(el, e), 140); else fn(el, e);
    });
    view.addEventListener('change', e => {
      const el = e.target.closest('[data-change]'); if (!el) return;
      const fn = pageAct(el.dataset.change); if (fn) fn(el, e);
    });

    addEventListener('hashchange', () => W.render());
    addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
    addEventListener('resize', () => { W.placeInk(document); W.placeLangPill(document); });
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); W.openCmdk(); } });
    W.on('change', () => W.refresh());
    W.on('lang', () => W.render({ keep: true }));
    // вход в другой вкладке / выход — подхватываем
    addEventListener('storage', e => { if (e.key === 'wn.session' && !W.me()) location.replace('index.html'); if (e.key === 'wn.db.v1') { W.initDB(); W.refresh(); } });

    W.render();
    // уведомление о малом запасе — один раз за сеанс
    try {
      if (!sessionStorage.getItem('wn.lowShown') && (W.can('catalog') || W.can('production'))) {
        const n = W.lowProducts().length;
        if (n) setTimeout(() => W.toast(t('Заканчивается на складе: {n} позиций — см. уведомления', { n }), 'warn'), 700);
        sessionStorage.setItem('wn.lowShown', '1');
      }
    } catch (e) { /* ignore */ }
    checkVersion(); setInterval(checkVersion, 180000);
  };
})();
