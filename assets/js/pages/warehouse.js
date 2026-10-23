/* Склад (ТЗ 4.1, 4.11): приход/расход/остаток, отгрузки по стадиям, движение, перемещения */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('warehouse', { kind: 'p', wh: '', period: 'month', q: '', mkind: '', page: 1 });
  const MK = { init: W.N('Остаток на начало'), purchase: W.N('Приход от поставщика'), produce: W.N('Выпуск продукции'), consume: W.N('Списание в производство'), sale: W.N('Отгрузка клиенту'), return: W.N('Возврат от клиента'), transfer: W.N('Перемещение'), adjust: W.N('Инвентаризация') };
  const itemName = m => ((m.t === 'p' ? W.product(m.item) : W.material(m.item)) || {}).name || '—';
  const unit = m => m.t === 'p' ? t('шт') : t((W.material(m.item) || {}).unit || '');

  /* ---------- приход / расход / остаток ---------- */
  const tabStock = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const items = (S.kind === 'p' ? W.db.products : W.db.materials).filter(x => !q || x.name.toLowerCase().includes(q));
    const agg = {};
    W.db.moves.forEach(m => {
      if (m.t !== S.kind || (S.wh && m.wh !== S.wh)) return;
      // перемещения между складами не считаем приходом/расходом, если смотрим все склады сразу
      if (!S.wh && m.kind === 'transfer') return;
      const a = agg[m.item] || (agg[m.item] = { open: 0, in: 0, out: 0 });
      const d = m.at.slice(0, 10);
      if (from && d < from) a.open += m.qty;
      else if (!to || d <= to) { if (m.qty > 0) a.in += m.qty; else a.out -= m.qty; }
    });
    const rows = items.map(x => { const a = agg[x.id] || { open: 0, in: 0, out: 0 }; return { x, ...a, close: W.round(a.open + a.in - a.out, 3) }; });
    const u = r => S.kind === 'p' ? t('шт') : t(r.x.unit);
    return `<div class="card">${W.table({ cols: [
      { label: S.kind === 'p' ? t('Продукция') : t('Сырьё'), title: true, render: r => S.kind === 'p' ? `<div class="cell-flex"><div class="thumb">${W.productArt(r.x)}</div><div style="min-width:0"><div class="cell-main">${esc(r.x.name)}</div><div class="cell-sub">${esc(W.catName(r.x.cat))}</div></div></div>` : `<div class="cell-main">${esc(r.x.name)}</div>` },
      { label: t('Остаток'), r: true, aside: true, render: r => `<b style="font-size:15px;color:${S.kind === 'p' && r.close <= W.minStock(r.x) ? 'var(--bad)' : 'inherit'}">${W.qty(r.close)}</b> <span class="muted">${u(r)}</span>` },
      { label: t('На начало'), r: true, render: r => W.qty(r.open) },
      { label: t('Приход'), r: true, render: r => r.in ? `<span style="color:var(--ok);font-weight:600">+${W.qty(r.in)}</span>` : '<span class="muted">0</span>' },
      { label: t('Расход'), r: true, render: r => r.out ? `<span style="color:var(--bad);font-weight:600">−${W.qty(r.out)}</span>` : '<span class="muted">0</span>' },
      ...(S.kind === 'p' ? [{ label: t('В резерве'), r: true, render: r => { const v = W.reserved(r.x.id, S.wh || null); return v ? `<span class="badge info plain">${W.qty(v)}</span>` : '<span class="muted">—</span>'; } }] : []),
    ], rows, empty: W.empty(t('Ничего не найдено'), '', 'warehouse') })}</div>`;
  };

  /* ---------- отгрузки: доска стадий ---------- */
  const tabShip = () => {
    const can = W.allow('sales.stage');
    const weekAgo = W.addDays(W.today(), -7);
    const orders = W.db.sales.filter(s => s.source === 'phone' && s.stage !== 'cancelled' && (s.stage !== 'done' || (s.shippedAt || s.at).slice(0, 10) >= weekAgo));
    return `<div class="kanban">${W.STAGES.map((stg, i) => {
      const list = orders.filter(s => s.stage === stg.id).sort((a, b) => a.at < b.at ? -1 : 1);
      const next = W.STAGES[i + 1];
      return `<div class="kcol"><div class="kcol-head"><i style="background:${stg.color}"></i>${t(stg.name)}<span class="cnt">${list.length}</span></div>
        ${list.length ? list.map(s => `<div class="kcard" data-a="open" data-id="${s.id}">
          <div class="kc-top"><span>№${W.no(s.no)} · ${W.fmtDate(s.at)}</span><span>${t(W.CHANNELS[s.channel])}</span></div>
          <b>${esc(W.custName(s))}</b>
          <div class="kc-meta">${s.address ? `<span class="ellipsis">${I('pin', 'ic-sm')} ${esc(s.address)}</span>` : ''}<span>${t('{n} позиций', { n: s.items.length })} · ${W.qty(W.sum(s.items, x => x.qty))} ${t('шт')}</span></div>
          <div class="kc-foot"><span class="money">${W.money(s.total)}</span>${W.payBadge(s)}</div>
          ${can && next ? `<button class="btn sm block mt-8" data-a="next" data-id="${s.id}">${t('Дальше: {s}', { s: t(next.name) })}${I('chevR', 'ic-sm')}</button>` : ''}
        </div>`).join('') : `<div class="muted" style="font-size:13px;padding:8px 4px">${stg.id === 'done' ? t('За неделю ничего не доставлено') : t('Пусто')}</div>`}</div>`;
    }).join('')}</div>`;
  };

  /* ---------- журнал движений ---------- */
  const tabMoves = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const rows = W.db.moves.filter(m => m.t === S.kind && (!S.wh || m.wh === S.wh) && (!S.mkind || m.kind === S.mkind) && W.inRange(m.at, from, to) && (!q || itemName(m).toLowerCase().includes(q))).slice().reverse();
    const pg = W.paged(rows, S.page, 60);
    return `<div class="card">${W.table({ cols: [
      { label: t('Наименование'), title: true, render: m => `<div class="cell-main">${esc(itemName(m))}</div><div class="cell-sub">${W.fmtDT(m.at)} · ${t(MK[m.kind] || m.kind)}</div>` },
      { label: t('Кол-во'), r: true, aside: true, render: m => `<b style="color:${m.qty > 0 ? 'var(--ok)' : 'var(--bad)'}">${m.qty > 0 ? '+' : '−'}${W.qty(Math.abs(m.qty))}</b> <span class="muted">${unit(m)}</span>` },
      { label: t('Склад'), render: m => `<span class="tag">${t(W.WH[m.wh])}</span>` },
      { label: t('Основание'), render: m => { const s = m.kind === 'sale' || m.kind === 'return' ? W.db.sales.find(x => x.id === m.ref) || W.db.sales.find(x => x.id === (W.db.returns.find(r => r.id === m.ref) || {}).sale) : null; return s ? `<a href="javascript:void 0" data-a="open" data-id="${s.id}">${t('Продажа')} №${W.no(s.no)}</a>` : esc(W.tx(m.note) || '—'); } },
      { label: t('Кто'), render: m => esc(W.shortName(W.userName(m.by))) },
    ], rows: pg.rows, empty: W.empty(t('Движений за период нет'), '', 'swap') })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };

  /* ---------- перемещения ---------- */
  const tabTransfer = () => {
    const can = W.allow('stock.move');
    const sugg = W.db.products.filter(p => !p.archived).map(p => ({ p, shop: W.stock('p', p.id, 'shop'), main: W.stock('p', p.id, 'main'), need: p.pack === 'bucket' ? 4 : 10 })).filter(r => r.shop < r.need && r.main > 0).sort((a, b) => a.shop - b.shop);
    const hist = []; const seen = new Set();
    W.db.moves.slice().reverse().forEach(m => { if (m.kind !== 'transfer' || seen.has(m.ref) || m.qty > 0) return; seen.add(m.ref); const to = W.db.moves.find(x => x.ref === m.ref && x.qty > 0); hist.push({ m, to }); });
    return `<div class="grid g-main" style="align-items:start">
      <div class="card"><div class="card-head"><div><h3>${t('Загрузить магазин')}</h3><div class="sub">${t('Товары, которых в магазине меньше нормы, а на основном складе есть')}</div></div>
        ${can && sugg.length ? `<div class="right"><button class="btn sm primary" data-a="fillAll">${I('truck')}${t('Пополнить всё')}</button></div>` : ''}</div>
        <div class="card-body flush">${W.table({ cols: [
          { label: t('Товар'), title: true, render: r => `<div class="cell-flex"><div class="thumb">${W.productArt(r.p)}</div><div class="cell-main" style="min-width:0">${esc(r.p.name)}</div></div>` },
          { label: t('В магазине'), r: true, aside: true, render: r => `<b style="color:${r.shop <= 0 ? 'var(--bad)' : 'var(--warn)'}">${W.qty(r.shop)}</b>` },
          { label: t('На основном складе'), r: true, render: r => W.qty(r.main) },
          { label: t('Предлагаем'), r: true, render: r => `${W.qty(Math.min(r.main, r.need * 2 - r.shop))} ${t('шт')}` },
          { label: '', cls: 'w-act', render: r => can ? `<div class="act"><button class="go" data-a="fill" data-id="${r.p.id}" data-q="${Math.min(r.main, r.need * 2 - r.shop)}" title="${t('Переместить')}">${I('truck')}</button></div>` : '' },
        ], rows: sugg, empty: W.empty(t('Магазин укомплектован'), t('Все позиции в норме'), 'checkCircle') })}</div></div>
      <div class="card"><div class="card-head"><h3>${t('Последние перемещения')}</h3>${can ? `<div class="right"><button class="btn sm" data-a="move">${I('swap')}${t('Переместить')}</button></div>` : ''}</div>
        <div class="card-body">${hist.slice(0, 12).map(h => `<div class="list-row"><div class="lr-main"><b>${esc(itemName(h.m))}</b><span>${W.fmtDT(h.m.at)} · ${t(W.WH[h.m.wh])} → ${h.to ? t(W.WH[h.to.wh]) : '—'}</span></div><b class="nowrap">${W.qty(-h.m.qty)} ${t('шт')}</b></div>`).join('') || `<div class="muted">${t('Перемещений пока не было')}</div>`}</div></div></div>`;
  };

  const moveForm = (pid, qty, from = 'main', to = 'shop') => {
    const whOpts = ['prod', 'main', 'shop'].map(w => [w, t(W.WH[w])]);
    W.modal({
      size: 'sm', title: t('Перемещение товара'), sub: t('Между складом производства, основным складом и магазином'), icon: 'swap',
      body: `<div class="form-grid" style="grid-template-columns:1fr">
        ${W.fs({ name: 'p', label: t('Товар'), options: W.db.products.filter(p => !p.archived).map(p => [p.id, p.name]), value: pid || '' })}
        <div class="form-grid">${W.fs({ name: 'from', label: t('Откуда'), options: whOpts, value: from })}${W.fs({ name: 'to', label: t('Куда'), options: whOpts, value: to })}</div>
        ${W.fi({ name: 'qty', label: t('Количество, шт'), type: 'number', value: qty || 1, attrs: 'min="1"', req: true })}
        <div class="hint av"></div></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('swap')}${t('Переместить')}</button>`,
      onMount: el => upd(el),
      actions: {
        change: (e, m) => upd(m.el),
        save: (b, m) => {
          const d = W.form(m.el);
          if (d.from === d.to) return W.toast(t('Выберите разные склады'), 'warn');
          const have = W.stock('p', d.p, d.from);
          if (!(d.qty > 0)) return W.toast(t('Укажите количество'), 'warn');
          if (d.qty > have) return W.toast(t('На складе «{w}» только {n} шт', { w: t(W.WH[d.from]), n: W.qty(have) }), 'warn');
          W.transfer({ p: d.p, from: d.from, to: d.to, qty: d.qty }); W.save(); m.close(); W.toast(t('Перемещено {n} шт', { n: W.qty(d.qty) }));
        },
      },
    });
    function upd(el) { const d = W.form(el); el.querySelector('.av').textContent = t('Доступно на складе «{w}»: {n} шт', { w: t(W.WH[d.from]), n: W.qty(W.stock('p', d.p, d.from)) }); }
  };

  const TABS = { stock: tabStock, ship: tabShip, moves: tabMoves, transfer: tabTransfer };
  W.page('warehouse', {
    render(params) {
      const S = st(), tab = TABS[params.tab] ? params.tab : 'stock';
      const prods = W.db.products.filter(p => !p.archived);
      const value = W.sum(prods, p => Math.max(0, W.stock('p', p.id)) * p.price);
      const toShip = W.db.sales.filter(s => s.source === 'phone' && W.OPEN_STAGES.includes(s.stage)).length;
      const inWay = W.db.sales.filter(s => s.stage === 'shipping').length;
      const whOpts = [['', t('Все склады')], ...Object.entries(W.WH).filter(([k]) => S.kind === 'm' ? k === 'raw' : k !== 'raw').map(([k, v]) => [k, t(v)])];
      const tb = tab === 'stock' || tab === 'moves';
      return `<div class="page-head"><div><h1>${t('Склад')}</h1><div class="sub">${t('Приход, расход и остатки, отгрузки заказов и перемещения')}</div></div>
        <div class="actions">${W.allow('stock.move') ? `<button class="btn" data-a="move">${I('swap')}${t('Перемещение')}</button>` : ''}${W.can('income') ? `<button class="btn primary" data-go="income">${I('box')}${t('Приход')}</button>` : ''}</div></div>
        <div class="kpis">
          ${W.kpi({ label: t('Позиций в наличии'), value: prods.filter(p => W.stock('p', p.id) > 0).length, small: '/ ' + prods.length, icon: 'grid' })}
          ${W.kpi({ label: t('Стоимость остатков'), value: W.moneyKpi(value), icon: 'coins', c: 'c-ok', foot: t('готовая продукция по ценам продажи') })}
          ${W.kpi({ label: t('Заказов к отгрузке'), value: toShip, icon: 'truck', c: 'c-vio', link: 'warehouse?tab=ship', foot: t('в пути: {n}', { n: inWay }) })}
          ${W.kpi({ label: t('Мало на складе'), value: W.lowProducts().length, icon: 'alert', c: 'c-bad', foot: t('позиций ниже порога') })}
        </div>
        ${W.tabs([{ id: 'stock', label: t('Остатки'), icon: 'layers' }, { id: 'ship', label: t('Отгрузки'), icon: 'truck', cnt: toShip || null }, { id: 'moves', label: t('Движение'), icon: 'swap' }, { id: 'transfer', label: t('Перемещения'), icon: 'warehouse' }], tab)}
        ${tb ? `<div class="toolbar">${W.seg([{ id: 'p', label: t('Готовая продукция') }, { id: 'm', label: t('Сырьё') }], S.kind, 'kind')}${W.searchBox(S.q, 'q', t('Наименование'))}
          <div class="filters"><select class="inp" data-on="wh">${W.opts(whOpts, S.wh)}</select><select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select>
          ${tab === 'moves' ? `<select class="inp" data-on="mkind">${W.opts([['', t('Все операции')], ...Object.entries(MK).map(([k, v]) => [k, t(v)])], S.mkind)}</select>` : ''}</div>
          <button class="btn" data-a="csv">${I('download')}${t('Скачать')}</button></div>` : ''}
        ${tab === 'ship' ? `<div class="hint mb-16">${t('Заказы по телефону проходят стадии: новый → сборка → готов к отгрузке → в пути → доставлен. Остаток списывается, когда заказ уходит в путь.')}</div>` : ''}
        <div data-region="tab">${TABS[tab]()}</div>`;
    },
    actions: {
      tab: el => { st().page = 1; W.setParams({ tab: el.dataset.v }); },
      kind: el => { const S = st(); S.kind = el.dataset.v; S.wh = ''; S.page = 1; W.swap(); },
      wh: el => { st().wh = el.value; W.region('tab', TABS[W.cur.params.tab || 'stock']()); },
      period: el => { st().period = el.value; W.region('tab', TABS[W.cur.params.tab || 'stock']()); },
      mkind: el => { st().mkind = el.value; W.region('tab', tabMoves()); },
      q: el => { st().q = el.value; W.region('tab', TABS[W.cur.params.tab || 'stock']()); },
      more: () => { st().page++; W.region('tab', tabMoves()); },
      open: (el, e) => { if (e.target.closest('[data-a="next"]')) return; W.openSale(el.dataset.id); },
      next: (el, e) => {
        e.stopPropagation();
        const s = W.db.sales.find(x => x.id === el.dataset.id);
        const i = W.STAGES.findIndex(x => x.id === s.stage), nx = W.STAGES[i + 1];
        const r = W.setStage(s, nx.id);
        if (r !== true) return W.toast(t('Нельзя отгрузить без остатка: {n}', { n: r.block.map(x => x.p.name).join(', ') }), 'err');
        W.save(); W.toast(t('Заказ №{n}: {s}', { n: W.no(s.no), s: t(nx.name) }));
      },
      move: () => moveForm(),
      fill: el => moveForm(el.dataset.id, +el.dataset.q),
      fillAll: async () => {
        const list = W.db.products.filter(p => !p.archived).map(p => ({ p, shop: W.stock('p', p.id, 'shop'), main: W.stock('p', p.id, 'main'), need: p.pack === 'bucket' ? 4 : 10 })).filter(r => r.shop < r.need && r.main > 0);
        if (!await W.confirm({ title: t('Пополнить магазин?'), text: t('Будет перемещено {n} позиций с основного склада в магазин.', { n: list.length }), ok: t('Переместить'), danger: false, icon: 'truck' })) return;
        list.forEach(r => W.transfer({ p: r.p.id, from: 'main', to: 'shop', qty: Math.min(r.main, r.need * 2 - r.shop), note: t('Загрузка магазина') }));
        W.save(); W.toast(t('Магазин пополнен: {n} позиций', { n: list.length }));
      },
      csv: () => {
        const S = st(), [from, to] = W.periodRange(S.period);
        const rows = W.db.moves.filter(m => m.t === S.kind && (!S.wh || m.wh === S.wh) && W.inRange(m.at, from, to));
        W.downloadCSV(t('Движение по складу'), [t('Дата'), t('Наименование'), t('Склад'), t('Операция'), t('Кол-во'), t('Ед.')], rows.map(m => [W.fmtDT(m.at), itemName(m), t(W.WH[m.wh]), t(MK[m.kind] || m.kind), String(m.qty).replace('.', ','), unit(m)]));
      },
    },
  });
})();
