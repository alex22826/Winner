/* =========================================================================
   WINNER — ядро: база в localStorage, сессия, роли, расчёты и операции.
   Все суммы хранятся в базовой валюте, даты — локальные строки 'YYYY-MM-DDTHH:mm'.
   ========================================================================= */
(function () {
  const W = window.W = window.W || {};
  W.APP_VERSION = '2026-10-29.2';
  const DB_KEY = 'wn.db.v1';
  W.DB_VERSION = 3;

  /* ---------- утилиты ---------- */
  W.uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  W.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  W.sum = (arr, f) => arr.reduce((s, x) => s + (f ? (+f(x) || 0) : (+x || 0)), 0);
  W.round = (n, d = 2) => Math.round((+n || 0) * 10 ** d) / 10 ** d;
  W.by = (arr, key) => Object.fromEntries(arr.map(x => [x[key || 'id'], x]));
  W.clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------- даты ---------- */
  const pad = n => String(n).padStart(2, '0');
  W.isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  W.isoAt = d => `${W.isoDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  W.now = () => W.isoAt(new Date());
  W.today = () => W.isoDay(new Date());
  W.month = (at) => (at || W.today()).slice(0, 7);
  W.parse = at => { const [d, t = '00:00'] = String(at).split('T'); const [y, m, dd] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number); return new Date(y, m - 1, dd, h || 0, mi || 0); };
  W.addDays = (day, n) => { const d = W.parse(day); d.setDate(d.getDate() + n); return W.isoDay(d); };
  W.weekStart = () => { const d = new Date(); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return W.isoDay(d); };
  W.fmtDate = at => { if (!at) return '—'; const [y, m, d] = at.slice(0, 10).split('-'); return `${d}.${m}.${y}`; };
  W.fmtDT = at => at ? `${W.fmtDate(at)} ${at.slice(11, 16) || ''}`.trim() : '—';
  W.fmtTime = at => at ? at.slice(11, 16) : '';
  W.daysBetween = (a, b) => Math.round((W.parse(b.slice(0, 10)) - W.parse(a.slice(0, 10))) / 864e5);
  W.inRange = (at, from, to) => { const d = at.slice(0, 10); return (!from || d >= from) && (!to || d <= to); };

  /* ---------- числа и деньги ---------- */
  W.fmtNum = (n, dec = 0) => {
    const v = W.round(n, dec);
    const [i, f] = Math.abs(v).toFixed(dec).split('.');
    const s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (v < 0 ? '−' : '') + s + (f && +f ? ',' + f.replace(/0+$/, '') : '');
  };
  W.qty = n => W.fmtNum(n, 3);
  W.curLabel = () => (W.db && W.db.settings.currency === 'USD') ? '$' : W.t('сум');
  W.money = (n, opt = {}) => {
    const usd = W.db && W.db.settings.currency === 'USD';
    const s = W.fmtNum(n, usd ? 2 : 0);
    const sign = opt.sign && n > 0 ? '+' : '';
    return usd ? `${sign}$${s.replace('−', '−')}` : `${sign}${s} ${W.curLabel()}`;
  };
  W.compact = n => {
    const a = Math.abs(n);
    if (a >= 1e9) return W.fmtNum(n / 1e9, 2) + ' ' + W.t('млрд');
    if (a >= 1e6) return W.fmtNum(n / 1e6, 1) + ' ' + W.t('млн');
    if (a >= 1e4) return W.fmtNum(n / 1e3, 0) + ' ' + W.t('тыс.');
    return W.fmtNum(n);
  };
  W.parseNum = s => { const v = parseFloat(String(s ?? '').replace(/\s| /g, '').replace(',', '.').replace('−', '-')); return isNaN(v) ? 0 : v; };

  /* ---------- база ---------- */
  // v3 (ответ заказчика): склад готовой продукции один — бывшие «склад производства» и «магазин»
  // сливаются в него, перемещения между ними больше не нужны; появилась ставка НДС в настройках
  const migrate2to3 = d => {
    d.moves = d.moves.filter(m => !(m.t === 'p' && m.kind === 'transfer'));
    d.moves.forEach(m => { if (m.t === 'p') m.wh = 'main'; });
    if (d.settings.vat == null) d.settings.vat = 12;
    d.v = 3;
    localStorage.setItem(DB_KEY, JSON.stringify(d));
  };
  W.initDB = () => {
    let d = null;
    try { const raw = localStorage.getItem(DB_KEY); if (raw) d = JSON.parse(raw); } catch (e) { d = null; }
    if (d && d.v === 2) migrate2to3(d); // данные пользователя переносим, а не сбрасываем
    if (!d || d.v !== W.DB_VERSION) { d = W.seed(); W.db = d; W.save(true); }
    W.db = d;
    if (!d.writeoffs) { d.writeoffs = []; W.save(true); } // списания брака появились позже
    // 2026-10-23: компания переименована, сохранённые данные обновляем без сброса
    const co = d.settings.company;
    if (co.name === 'ООО «EAST COLOR»') { co.name = '"SAVER PAINTS" MCHJ'; if (co.email === 'info@eastcolor.uz') co.email = 'info@saverpaints.uz'; W.save(true); }
    return d;
  };
  W.save = (silent) => {
    W.invalidate();
    try { localStorage.setItem(DB_KEY, JSON.stringify(W.db)); }
    catch (e) { W.toast && W.toast(W.t('Не хватает места в браузере — уменьшите фото товаров'), 'err'); }
    if (!silent) W.emit('change');
  };
  W.resetDemo = () => { localStorage.removeItem(DB_KEY); W.db = W.seed(); W.save(true); };

  /* простая шина событий */
  const handlers = {};
  W.on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
  W.emit = (ev, data) => (handlers[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

  /* ---------- сессия и вход ---------- */
  const SKEY = 'wn.session';
  W.session = () => { try { return JSON.parse(localStorage.getItem(SKEY)); } catch (e) { return null; } };
  W.me = () => { const s = W.session(); if (!s || !W.db) return null; return W.db.users.find(u => u.id === s.uid && u.active) || null; };
  W.sha256 = async str => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  W.passHash = (login, pass) => W.sha256(`${String(login).trim().toLowerCase()}:${pass}:winner`);
  W.login = async (login, pass) => {
    const l = String(login).trim().toLowerCase();
    const u = W.db.users.find(x => x.login && x.login.toLowerCase() === l);
    if (!u) return { err: 'nouser' };
    if (!u.active) return { err: 'inactive' };
    if (await W.passHash(l, pass) !== u.pass) return { err: 'badpass' };
    u.lastLogin = W.now();
    localStorage.setItem(SKEY, JSON.stringify({ uid: u.id, at: Date.now() }));
    W.save(true);
    return { user: u };
  };
  W.logout = () => { localStorage.removeItem(SKEY); location.href = 'index.html'; };
  W.userName = id => { const u = W.db.users.find(x => x.id === id); return u ? u.name : '—'; };
  W.shortName = name => { const p = String(name || '').trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[1][0]}.` : (p[0] || '—'); };
  W.initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  W.avatarBg = name => {
    const pal = [['#3346ff', '#ff2d87'], ['#00b8f5', '#3346ff'], ['#ff6a2b', '#ff2d87'], ['#12b981', '#00b8f5'], ['#6a5cff', '#00b8f5'], ['#ffb020', '#ff6a2b']];
    let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const [a, b] = pal[h % pal.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  };

  /* ---------- роли и права ---------- */
  const N = W.N;
  W.ROLES = {
    director:     { name: N('Директор'), pages: '*', acts: '*' },
    accountant:   { name: N('Бухгалтер'), pages: ['summary', 'reports', 'sales', 'customers', 'expense', 'cash', 'bank', 'income', 'catalog', 'salary'],
                    acts: ['finance.view', 'finance.edit', 'bank.confirm', 'sales.pay', 'salary.edit', 'income.edit'] },
    manager:      { name: N('Менеджер по продажам'), pages: ['summary', 'sales', 'customers', 'catalog', 'warehouse'],
                    acts: ['sales.create', 'sales.pay', 'sales.stage', 'sales.return', 'customers.edit'] },
    seller:       { name: N('Продавец магазина'), pages: ['summary', 'sales', 'customers', 'catalog'],
                    acts: ['sales.create', 'sales.pay', 'sales.return', 'customers.edit'] },
    storekeeper:  { name: N('Кладовщик'), pages: ['warehouse', 'income', 'catalog'],
                    acts: ['sales.stage', 'stock.move', 'income.edit'] },
    technologist: { name: N('Технолог производства'), pages: ['production', 'warehouse', 'income', 'catalog'],
                    acts: ['prod.edit', 'recipe.edit', 'catalog.edit', 'stock.move', 'income.edit'] },
  };
  W.roleName = r => W.t((W.ROLES[r] || {}).name || r);
  const roles = u => (u && u.roles) || [];
  // разделы роли: директор может переопределить их в Администрировании (settings.rolePages); директору — всё
  W.rolePages = r => {
    if (r === 'director') return '*';
    const o = W.db && W.db.settings.rolePages && W.db.settings.rolePages[r];
    return o || (W.ROLES[r] || {}).pages || [];
  };
  W.can = (page, u = W.me()) => page === 'profile' || roles(u).some(r => { const p = W.rolePages(r); return p === '*' || p.includes(page); });
  W.allow = (act, u = W.me()) => roles(u).some(r => { const a = (W.ROLES[r] || {}).acts; return a === '*' || (a || []).includes(act); });
  W.isDirector = (u = W.me()) => roles(u).includes('director');

  /* ---------- нумерация документов ---------- */
  // Стартовый номер задаётся в Администрировании; первый новый документ получает его, дальше — по возрастанию.
  W.nextNo = kind => {
    const start = Math.max(1, +W.db.settings.numbering[kind] || 1);
    const last = W.db.seq[kind];
    const n = (last == null || start > last) ? start : last + 1;
    W.db.seq[kind] = n;
    return n;
  };
  W.no = n => String(n).padStart(4, '0');

  /* ---------- справочники ---------- */
  // два места хранения: сырьё — на производстве, готовая продукция — на складе (откуда идут все продажи)
  W.WH = {
    raw:  N('Производство'),
    main: N('Склад'),
  };
  W.FG = 'main'; // склад готовой продукции — для всех каналов продаж
  W.CHANNELS = { shop: N('Магазин'), main: N('Склад'), prod: N('Производство') };
  W.METHODS = { cash: N('Наличные'), card: N('Карта'), corp: N('Корпоративная карта'), transfer: N('Безналичный расчёт') };
  W.STAGES = [
    { id: 'new', name: N('Новый'), color: '#8a92b0' },
    { id: 'picking', name: N('Сборка'), color: '#f59e0b' },
    { id: 'ready', name: N('Готов к отгрузке'), color: '#00b8f5' },
    { id: 'shipping', name: N('В пути'), color: '#6a5cff' },
    { id: 'done', name: N('Доставлен'), color: '#12b981' },
  ];
  W.stageName = id => id === 'cancelled' ? W.t('Отменён') : W.t((W.STAGES.find(s => s.id === id) || {}).name || id);
  W.CUST_TYPES = { legal: N('Юридическое лицо'), ip: N('ИП'), person: N('Физическое лицо') };
  W.SAL_KINDS = { salary: N('Оклад'), advance: N('Аванс'), bonus: N('Премия'), overtime: N('Сверхурочные'), deduction: N('Удержание') };
  W.product = id => W.db.products.find(p => p.id === id);
  W.material = id => W.db.materials.find(m => m.id === id);
  W.customer = id => W.db.customers.find(c => c.id === id);
  W.supplier = id => W.db.suppliers.find(s => s.id === id);
  W.catName = id => { const c = W.db.categories.find(x => x.id === id); return c ? W.t(c.name) : W.t('Без категории'); };
  W.minStock = p => (p.minStock != null && p.minStock !== '') ? +p.minStock : +W.db.settings.lowStock || 0;

  /* ---------- кэш расчётов (сбрасывается при сохранении) ---------- */
  let C = {};
  W.invalidate = () => { C = {}; };
  const memo = (k, fn) => (k in C ? C[k] : (C[k] = fn()));

  /* остатки из журнала движений */
  W.stockMap = () => memo('stock', () => {
    const m = {};
    for (const mv of W.db.moves) {
      const k = mv.t + ':' + mv.item;
      const r = m[k] || (m[k] = { total: 0 });
      r[mv.wh] = (r[mv.wh] || 0) + mv.qty;
      r.total += mv.qty;
    }
    return m;
  });
  W.stock = (t, id, wh) => { const r = W.stockMap()[t + ':' + id]; if (!r) return 0; return W.round(wh ? (r[wh] || 0) : r.total, 3); };
  W.move = (t, item, wh, qty, kind, ref, note, at) => {
    W.db.moves.push({ id: W.uid('mv'), at: at || W.now(), t, item, wh, qty: W.round(qty, 3), kind, ref: ref || null, note: note || '', by: (W.me() || {}).id || null });
    W.invalidate();
  };
  W.OPEN_STAGES = ['new', 'picking', 'ready'];
  W.reserved = (pid, wh) => memo('res:' + pid + ':' + (wh || ''), () => W.sum(
    W.db.sales.filter(s => !s.shipped && W.OPEN_STAGES.includes(s.stage)),
    s => W.sum(s.items.filter(i => i.p === pid), i => i.qty)));

  /* продажи: оплаты, возвраты, долги */
  W.paidMap = () => memo('paid', () => { const m = {}; W.db.payments.forEach(p => { m[p.sale] = (m[p.sale] || 0) + p.amount; }); return m; });
  W.retMap = () => memo('ret', () => { const m = {}; W.db.returns.forEach(r => { m[r.sale] = (m[r.sale] || 0) + r.amount; }); return m; });
  W.salePaid = s => W.round(W.paidMap()[s.id] || 0);
  W.saleReturned = s => W.round(W.retMap()[s.id] || 0);
  W.saleNet = s => Math.max(0, W.round(s.total - W.saleReturned(s)));
  W.saleDebt = s => s.stage === 'cancelled' ? 0 : Math.max(0, W.round(W.saleNet(s) - W.salePaid(s)));
  // «Долги по отгрузке» (ТЗ, уточнено заказчиком): клиент уже оплатил, а товар ещё не отгружен —
  // на эту сумму мы должны отгрузить товар
  W.shipDebt = s => (s.shipped || s.stage === 'cancelled') ? 0 : Math.min(W.salePaid(s), W.saleNet(s));
  W.payStatus = s => {
    if (s.stage === 'cancelled') return 'cancelled';
    const paid = W.salePaid(s), net = W.saleNet(s);
    if (net === 0 && paid === 0) return 'returned';
    if (paid >= net) return 'paid';
    return paid > 0 ? 'partial' : 'unpaid';
  };
  W.activeSales = () => memo('activeSales', () => W.db.sales.filter(s => s.stage !== 'cancelled'));
  W.custName = s => s.cust ? ((W.customer(s.cust) || {}).name || s.name) : (s.name || W.t('Розничный покупатель'));

  /* касса и банк */
  W.ACCOUNTS = { cash: N('Наличные'), card: N('Карта'), corp: N('Корпоративная карта') };
  W.cashBal = acc => memo('cash:' + acc, () => W.round(W.sum(W.db.cash.filter(c => !acc || c.acc === acc), c => c.dir * c.amount)));
  W.bankBal = (status = 'confirmed') => memo('bank:' + status, () => W.round(W.sum(W.db.bank.filter(b => !status || b.status === status), b => b.dir * b.amount)));

  /* сводные показатели */
  W.salesStats = () => memo('salesStats', () => {
    const today = W.today(), mon = W.month();
    const act = W.activeSales();
    const dayS = act.filter(s => s.at.slice(0, 10) === today);
    const monS = act.filter(s => s.at.slice(0, 7) === mon);
    const monSum = W.sum(monS, s => W.saleNet(s));
    const pays = W.db.payments.filter(p => p.at.slice(0, 7) === mon);
    return {
      today: W.sum(dayS, s => W.saleNet(s)), todayCount: dayS.length,
      month: monSum, monthCount: monS.length, avg: monS.length ? monSum / monS.length : 0,
      card: W.sum(pays.filter(p => p.method === 'card' || p.method === 'corp'), p => p.amount),
      debt: W.sum(act, s => W.saleDebt(s)), debtCount: act.filter(s => W.saleDebt(s) > 0).length,
      shipDebt: W.sum(act, s => W.shipDebt(s)), shipDebtCount: act.filter(s => W.shipDebt(s) > 0).length,
    };
  });

  /* товары на исходе */
  W.lowProducts = () => memo('lowP', () => W.db.products.filter(p => !p.archived && W.stock('p', p.id) <= W.minStock(p)));

  /* сырьё: потребность = под заказы + страховой порог − остаток */
  W.rawNeeds = () => memo('rawNeeds', () => {
    const need = {}, planned = {};
    const add = (pid, qty) => (W.db.recipes[pid] || []).forEach(r => { need[r.m] = (need[r.m] || 0) + r.qty * qty; });
    // 1) незавершённые производственные задания
    W.db.prodOrders.filter(o => o.status !== 'done').forEach(o => { add(o.p, o.qty); planned[o.p] = (planned[o.p] || 0) + o.qty; });
    // 2) нехватка готовой продукции под открытые заказы клиентов
    W.db.products.forEach(p => {
      const short = W.reserved(p.id) - W.stock('p', p.id) - (planned[p.id] || 0);
      if (short > 0) add(p.id, short);
    });
    return W.db.materials.map(m => {
      const forOrders = W.round(need[m.id] || 0, 3), safety = +m.safety || 0, stock = W.stock('m', m.id);
      const toBuy = Math.max(0, W.round(forOrders + safety - stock, 3));
      return { m, forOrders, safety, stock, toBuy, status: W.rawStatus({ forOrders, safety, stock }) };
    });
  });

  // Статус позиции сырья для вкладки «Остатки»:
  //  'short' — не хватает даже под текущие заказы,
  //  'low'   — под заказы хватает, но страховой запас уже «проеден»,
  //  'ok'    — хватает с запасом.
  W.rawStatus = ({ forOrders, safety, stock }) => {
    if (stock < forOrders) return 'short';
    if (stock < forOrders + safety) return 'low';
    return 'ok';
  };
  W.lowMaterials = () => W.rawNeeds().filter(r => r.status !== 'ok');

  /* себестоимость 1 шт по калькуляции */
  W.unitCost = pid => W.round(W.sum(W.db.recipes[pid] || [], r => r.qty * ((W.material(r.m) || {}).price || 0)));

  /* ---------- операции ---------- */
  const meId = () => (W.me() || {}).id || null;

  // движение денег по способу оплаты: касса или банк (банк — ждёт подтверждения бухгалтера)
  W.moneyMove = ({ method, dir, amount, at, kind, ref, note, party, num }) => {
    if (!(amount > 0)) return;
    if (method === 'transfer') {
      W.db.bank.push({
        id: W.uid('bk'), at: at || W.now(), dir, desc: note || '', party: party || '', num: num || '', amount: W.round(amount),
        status: 'pending', kind, ref: ref || null, by: meId(), log: [{ at: W.now(), by: meId(), act: 'create' }],
      });
    } else {
      W.db.cash.push({ id: W.uid('c'), at: at || W.now(), acc: method, dir, amount: W.round(amount), kind, ref: ref || null, note: note || '', by: meId() });
    }
  };

  W.addPayment = (sale, method, amount, at) => {
    const p = { id: W.uid('pay'), at: at || W.now(), sale: sale.id, method, amount: W.round(amount), by: meId() };
    W.db.payments.push(p);
    W.invalidate();
    W.moneyMove({ method, dir: 1, amount, at: p.at, kind: 'sale', ref: sale.id, note: W.t('Оплата по продаже №{n}', { n: W.no(sale.no) }), party: W.custName(sale), num: W.no(sale.no) });
    return p;
  };

  // проверка остатков перед отгрузкой; «Не отгружать без остатка» — жёсткий запрет
  W.checkShip = (channel, items) => {
    const issues = [];
    items.forEach(i => {
      const p = W.product(i.p); if (!p) return;
      const have = W.stock('p', p.id, W.FG);
      if (have < i.qty) issues.push({ p, have, need: i.qty, block: !!p.noShip });
    });
    return issues;
  };
  W.shipSale = (sale) => {
    if (sale.shipped) return true;
    const issues = W.checkShip(sale.channel, sale.items);
    const block = issues.filter(x => x.block);
    if (block.length) return { block };
    sale.items.forEach(i => W.move('p', i.p, W.FG, -i.qty, 'sale', sale.id));
    sale.shipped = true; sale.shippedAt = W.now();
    return true;
  };
  // отгрузка в долг (решение заказчика): постоянным клиентам можно, остальным — после полной оплаты
  // или если директор разрешил по этому заказу (sale.credit). Продажи в магазине не касается.
  W.creditOk = s => s.source !== 'phone' || W.saleDebt(s) <= 0 || !!s.credit || !!(W.customer(s.cust) || {}).regular;
  W.allowCredit = s => { s.credit = { by: meId(), at: W.now() }; };
  W.stageError = r => r.credit ? W.t('Заказ не оплачен: в долг отгружаем только постоянным клиентам. Разрешить может директор.')
    : W.t('Нельзя отгрузить без остатка: {n}', { n: r.block.map(x => x.p.name).join(', ') });
  W.setStage = (sale, stage) => {
    if (['shipping', 'done'].includes(stage) && !sale.shipped) {
      if (!W.creditOk(sale)) return { credit: true };
      const r = W.shipSale(sale);
      if (r !== true) return r;
    }
    sale.stage = stage;
    (sale.stageLog = sale.stageLog || []).push({ stage, at: W.now(), by: meId() });
    return true;
  };

  W.createSale = (d) => {
    const sale = {
      id: W.uid('s'), no: W.nextNo('sale'), at: d.at || W.now(), channel: d.channel, source: d.source,
      cust: d.cust || null, name: d.name || '', phone: d.phone || '', address: d.address || '',
      items: d.items.map(i => ({ p: i.p, qty: +i.qty, price: +i.price })), discount: +d.discount || 0,
      stage: 'new', stageLog: [{ stage: 'new', at: W.now(), by: meId() }], shipped: false, note: d.note || '', by: meId(),
    };
    sale.total = W.round(W.sum(sale.items, i => i.qty * i.price) - sale.discount);
    W.db.sales.push(sale);
    W.invalidate();
    if (d.source === 'walkin') { const r = W.setStage(sale, 'done'); if (r !== true) { W.db.sales.pop(); W.db.seq.sale--; return r; } }
    if (d.payAmount > 0) W.addPayment(sale, d.payMethod, Math.min(d.payAmount, sale.total));
    return sale;
  };

  W.cancelSale = sale => {
    if (sale.shipped) return false;
    sale.stage = 'cancelled';
    sale.stageLog.push({ stage: 'cancelled', at: W.now(), by: meId() });
    return true;
  };

  W.returnedQty = (sale, pid) => W.sum(W.db.returns.filter(r => r.sale === sale.id), r => W.sum(r.items.filter(i => i.p === pid), i => i.qty));
  W.createReturn = (sale, items, method, reason) => {
    const amount = W.round(W.sum(items, i => i.qty * i.price));
    const r = { id: W.uid('r'), no: W.nextNo('ret'), at: W.now(), sale: sale.id, items, amount, method, reason: reason || '', by: meId() };
    W.db.returns.push(r);
    W.invalidate();
    if (sale.shipped) items.forEach(i => W.move('p', i.p, W.FG, i.qty, 'return', r.id));
    // деньги отдаём только если после возврата клиент переплатил
    const money = Math.min(amount, Math.max(0, W.round(W.salePaid(sale) - W.saleNet(sale))));
    if (money > 0) {
      W.db.payments.push({ id: W.uid('pay'), at: r.at, sale: sale.id, method, amount: -money, by: meId(), refund: r.id });
      W.invalidate();
      W.moneyMove({ method, dir: -1, amount: money, at: r.at, kind: 'return', ref: r.id, note: W.t('Возврат по продаже №{n}', { n: W.no(sale.no) }), party: W.custName(sale), num: W.no(r.no) });
    }
    r.refunded = money;
    return r;
  };

  W.addExpense = e => {
    const x = { id: W.uid('e'), at: e.at || W.now(), cat: e.cat, desc: e.desc || '', amount: W.round(e.amount), method: e.method, by: meId() };
    W.db.expenses.push(x);
    W.moneyMove({ method: x.method, dir: -1, amount: x.amount, at: x.at, kind: 'expense', ref: x.id, note: `${W.t(x.cat)}: ${x.desc}`.trim(), party: e.party || '' });
    return x;
  };
  W.removeExpense = x => {
    W.db.expenses = W.db.expenses.filter(e => e.id !== x.id);
    W.db.cash = W.db.cash.filter(c => c.ref !== x.id);
    W.db.bank = W.db.bank.filter(b => b.ref !== x.id || b.status === 'confirmed');
  };

  W.cashOp = ({ acc, dir, amount, note, at }) => {
    if (acc === 'transfer') W.moneyMove({ method: 'transfer', dir, amount, at, kind: 'manual', note });
    else W.db.cash.push({ id: W.uid('c'), at: at || W.now(), acc, dir, amount: W.round(amount), kind: 'manual', note: note || '', by: meId() });
  };
  W.cashTransfer = ({ from, to, amount, note }) => {
    const ref = W.uid('tr');
    const desc = note || W.t('Перевод: {a} → {b}', { a: W.t(W.METHODS[from]), b: W.t(W.METHODS[to]) });
    [[from, -1], [to, 1]].forEach(([acc, dir]) => {
      if (acc === 'transfer') W.moneyMove({ method: 'transfer', dir, amount, kind: 'transfer', ref, note: desc });
      else W.db.cash.push({ id: W.uid('c'), at: W.now(), acc, dir, amount: W.round(amount), kind: 'transfer', ref, note: desc, by: meId() });
    });
  };

  W.addBankOp = d => {
    const op = { id: W.uid('bk'), at: d.at || W.now(), dir: d.dir, desc: d.desc || '', party: d.party || '', num: d.num || '', amount: W.round(d.amount),
      status: 'pending', kind: 'manual', by: meId(), log: [{ at: W.now(), by: meId(), act: 'create' }] };
    W.db.bank.push(op);
    return op;
  };
  W.editBankOp = (op, ch) => {
    Object.keys(ch).forEach(k => {
      if (String(op[k]) !== String(ch[k])) { op.log.push({ at: W.now(), by: meId(), act: 'edit', field: k, from: op[k], to: ch[k] }); op[k] = ch[k]; }
    });
  };
  W.confirmBank = op => {
    if (op.status === 'confirmed') return;
    op.status = 'confirmed'; op.confirmedBy = meId(); op.confirmedAt = W.now();
    op.log.push({ at: W.now(), by: meId(), act: 'confirm' });
  };

  W.createPurchase = d => {
    const p = { id: W.uid('pu'), no: W.nextNo('purchase'), at: d.at || W.now(), sup: d.sup, items: d.items.map(i => ({ m: i.m, qty: +i.qty, price: +i.price })), note: d.note || '', method: d.method || null, by: meId() };
    p.total = W.round(W.sum(p.items, i => i.qty * i.price));
    W.db.purchases.push(p);
    p.items.forEach(i => { W.move('m', i.m, 'raw', i.qty, 'purchase', p.id, '', p.at); const m = W.material(i.m); if (m && i.price) m.price = i.price; });
    if (d.method && d.paid > 0) W.moneyMove({ method: d.method, dir: -1, amount: Math.min(d.paid, p.total), at: p.at, kind: 'purchase', ref: p.id, note: W.t('Оплата поставщику, приход №{n}', { n: W.no(p.no) }), party: (W.supplier(d.sup) || {}).name, num: W.no(p.no) });
    return p;
  };

  W.createProdOrder = d => {
    const o = { id: W.uid('po'), no: W.nextNo('prod'), at: d.at || W.now(), p: d.p, qty: +d.qty, status: 'plan', note: d.note || '', by: meId() };
    W.db.prodOrders.push(o);
    return o;
  };
  W.prodShortage = o => (W.db.recipes[o.p] || []).map(r => ({ m: W.material(r.m), need: W.round(r.qty * o.qty, 3), have: W.stock('m', r.m) })).filter(x => x.m && x.have < x.need);
  W.startProd = o => { o.status = 'work'; o.startedAt = W.now(); };
  W.finishProd = o => {
    const short = W.prodShortage(o);
    if (short.length) return { short };
    (W.db.recipes[o.p] || []).forEach(r => W.move('m', r.m, 'raw', -r.qty * o.qty, 'consume', o.id));
    W.move('p', o.p, W.FG, o.qty, 'produce', o.id);
    o.status = 'done'; o.doneAt = W.now(); o.cost = W.round(W.unitCost(o.p) * o.qty);
    return true;
  };

  /* долги поставщикам: сумма прихода минус оплаты по нему (касса и банк) */
  W.purchasePaid = p => W.round(W.sum(W.db.bank.filter(b => b.ref === p.id && b.dir < 0), b => b.amount) + W.sum(W.db.cash.filter(c => c.ref === p.id && c.dir < 0), c => c.amount));
  W.purchaseDebt = p => Math.max(0, W.round(p.total - W.purchasePaid(p)));
  W.payPurchase = (p, method, amount) => W.moneyMove({ method, dir: -1, amount: Math.min(amount, W.purchaseDebt(p)), kind: 'purchase', ref: p.id,
    note: W.t('Оплата поставщику, приход №{n}', { n: W.no(p.no) }), party: (W.supplier(p.sup) || {}).name, num: W.no(p.no) });

  /* списание брака: готовая продукция — со склада, сырьё — с производства */
  // стоимость брака: сырьё — по цене закупки, продукция — по себестоимости рецептуры (если её нет — по цене продажи)
  W.writeOff = ({ t, item, qty, reason, note = '' }) => {
    const x = t === 'm' ? W.material(item) : W.product(item);
    const unit = t === 'm' ? (x.price || 0) : (W.unitCost(item) || x.price || 0);
    const w = { id: W.uid('wo'), no: (W.db.writeoffs.length ? W.db.writeoffs[W.db.writeoffs.length - 1].no : 0) + 1, at: W.now(), t, item, qty: W.round(qty, 3), reason, note, cost: W.round(unit * qty), by: meId() };
    W.db.writeoffs.push(w);
    W.move(t, item, t === 'm' ? 'raw' : W.FG, -qty, 'writeoff', w.id, note ? `${reason}: ${note}` : reason);
    return w;
  };

  W.transfer = ({ p, from, to, qty, note }) => {
    const ref = W.uid('tr');
    W.move('p', p, from, -qty, 'transfer', ref, note);
    W.move('p', p, to, qty, 'transfer', ref, note);
  };

  /* зарплата */
  W.slog = (action, doc, target, change) => W.db.salaryLog.push({ id: W.uid('sl'), at: W.now(), action, doc, target, change: change || '', by: meId() });
  W.addAccrual = d => {
    const a = { id: W.uid('ac'), at: W.now(), emp: d.emp, period: d.period, kind: d.kind, amount: W.round(d.amount), note: d.note || '', by: meId() };
    W.db.accruals.push(a);
    W.slog('create', 'accrual', W.userName(d.emp), `${W.t(W.SAL_KINDS[d.kind])}: ${W.money(a.amount)} (${d.period})`);
    return a;
  };
  W.addPayout = d => {
    const p = { id: W.uid('pv'), at: d.at || W.now(), emp: d.emp, period: d.period, amount: W.round(d.amount), method: d.method, note: d.note || '', by: meId() };
    W.db.payouts.push(p);
    W.moneyMove({ method: d.method, dir: -1, amount: p.amount, at: p.at, kind: 'salary', ref: p.id, note: W.t('Зарплата: {n}', { n: W.userName(d.emp) }), party: W.userName(d.emp) });
    W.slog('create', 'payout', W.userName(d.emp), `${W.t('Выплачено')}: ${W.money(p.amount)} (${d.period})`);
    return p;
  };
  // строки ведомости по сотрудникам за набор месяцев
  W.salaryRows = (months) => {
    const ms = new Set(months);
    return W.db.users.filter(u => u.salary > 0 || W.db.accruals.some(a => a.emp === u.id && ms.has(a.period)) || W.db.payouts.some(p => p.emp === u.id && ms.has(p.period)))
      .map(u => {
        const acc = W.db.accruals.filter(a => a.emp === u.id && ms.has(a.period));
        const k = kind => W.sum(acc.filter(a => a.kind === kind), a => a.amount);
        const r = { u, salary: k('salary'), advance: k('advance'), bonus: k('bonus'), overtime: k('overtime'), deduction: k('deduction') };
        r.accrued = W.round(r.salary + r.bonus + r.overtime - r.deduction);
        r.paid = W.round(W.sum(W.db.payouts.filter(p => p.emp === u.id && ms.has(p.period)), p => p.amount));
        r.rest = Math.max(0, W.round(r.accrued - r.paid));
        r.over = Math.max(0, W.round(r.paid - r.accrued));
        r.status = r.accrued === 0 && r.paid === 0 ? 'none' : r.over > 0 ? 'over' : r.rest === 0 ? 'paid' : r.paid > 0 ? 'partial' : 'unpaid';
        return r;
      });
  };
})();
