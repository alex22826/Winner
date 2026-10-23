/* Склад (ТЗ 4.1, 4.11): приход/расход/остаток, отгрузки по стадиям, движение, перемещения */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('warehouse', { kind: 'p', wh: '', period: 'month', q: '', mkind: '', page: 1 });
  const MK = { init: W.N('Остаток на начало'), purchase: W.N('Приход от поставщика'), produce: W.N('Выпуск продукции'), consume: W.N('Списание в производство'), sale: W.N('Отгрузка клиенту'), return: W.N('Возврат от клиента'), writeoff: W.N('Списание брака'), adjust: W.N('Инвентаризация') };
  const REASONS = [W.N('Брак производства'), W.N('Повреждение при хранении'), W.N('Повреждение при перевозке'), W.N('Истёк срок годности'), W.N('Другое')];
  const itemName = m => ((m.t === 'p' ? W.product(m.item) : W.material(m.item)) || {}).name || '—';
  const unit = m => m.t === 'p' ? t('шт') : t((W.material(m.item) || {}).unit || '');

  /* ---------- списание брака ---------- */
  const writeoffForm = () => {
    let kind = st().kind;
    const list = k => (k === 'p' ? W.db.products.filter(p => !p.archived) : W.db.materials).filter(x => W.stock(k, x.id, k === 'p' ? W.FG : 'raw') > 0);
    const opts = k => list(k).map(x => [x.id, x.name, `${W.qty(W.stock(k, x.id, k === 'p' ? W.FG : 'raw'))} ${k === 'p' ? t('шт') : t(x.unit)}`]);
    const seg = () => `<div class="seg">${[['p', t('Готовая продукция')], ['m', t('Сырьё')]].map(([k, l]) => `<button type="button" class="${k === kind ? 'on' : ''}" data-m="kind" data-v="${k}">${l}</button>`).join('')}</div>`;
    const m = W.modal({
      title: t('Списание брака'), sub: t('Товар или сырьё уходит с остатка, сумма попадает в отчёт'), icon: 'trash', iconCls: 'bad',
      body: `<div class="form-grid"><div class="field full"><label>${t('Что списываем')}</label><div class="wo-seg">${seg()}</div></div>
        <div class="field full wo-item"></div>
        ${W.fi({ name: 'qty', label: t('Количество'), ph: '0', attrs: 'inputmode="decimal"', suffix: '<span class="wo-unit"></span>' })}
        ${W.fs({ name: 'reason', label: t('Причина'), options: REASONS.map(r => [r, t(r)]) })}
        ${W.fta({ name: 'note', label: t('Комментарий'), cls: 'full', ph: t('Партия, что случилось') })}
        <div class="full hint wo-cost"></div></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn danger" data-m="save">${I('trash')}${t('Списать')}</button>`,
      actions: {
        kind: b => { kind = b.dataset.v; m.el.querySelector('.wo-seg').innerHTML = seg(); drawItem(); },
        change: () => recalc(),
        input: () => recalc(),
        save: async () => {
          const d = W.form(m.el), qty = W.round(W.parseNum(d.qty), 3), have = d.item ? W.stock(kind, d.item, kind === 'p' ? W.FG : 'raw') : 0;
          if (!d.item) return W.toast(t('Нечего списывать: остатка нет'), 'warn');
          if (!(qty > 0)) { W.toast(t('Укажите количество'), 'warn'); return m.el.querySelector('[name=qty]').focus(); }
          if (qty > have) return W.toast(t('На остатке только {n}', { n: W.qty(have) }), 'warn');
          if (d.reason === 'Другое' && !d.note.trim()) { W.toast(t('Опишите причину в комментарии'), 'warn'); return m.el.querySelector('[name=note]').focus(); }
          const x = kind === 'p' ? W.product(d.item) : W.material(d.item);
          if (!await W.confirm({ title: t('Списать {q} {u}?', { q: W.qty(qty), u: kind === 'p' ? t('шт') : t(x.unit) }), text: esc(x.name), ok: t('Списать'), danger: true })) return;
          const w = W.writeOff({ t: kind, item: d.item, qty, reason: d.reason, note: d.note.trim() });
          st().kind = kind; // показываем списанное: продукцию или сырьё
          W.save(); m.close(); W.toast(t('Списано на {a}', { a: W.money(w.cost) }));
        },
      },
    });
    const drawItem = () => {
      const o = opts(kind);
      m.el.querySelector('.wo-item').innerHTML = `<label>${kind === 'p' ? t('Продукция') : t('Сырьё')}</label>` + (o.length ? `<select class="inp" name="item">${W.opts(o, '')}</select>` : `<div class="muted">${t('Нет позиций с остатком')}</div>`);
      recalc();
    };
    const recalc = () => {
      const sel = m.el.querySelector('[name=item]'), id = sel && sel.value, x = id && (kind === 'p' ? W.product(id) : W.material(id));
      m.el.querySelector('.wo-unit').textContent = x ? (kind === 'p' ? t('шт') : t(x.unit)) : '';
      const qty = W.parseNum(m.el.querySelector('[name=qty]').value) || 0;
      const price = !x ? 0 : kind === 'm' ? (x.price || 0) : (W.unitCost(id) || x.price || 0);
      m.el.querySelector('.wo-cost').innerHTML = x ? `${t('Остаток')}: <b>${W.qty(W.stock(kind, id, kind === 'p' ? W.FG : 'raw'))}</b> · ${t('Сумма списания')}: <b class="money">${W.money(qty * price)}</b> <span class="muted">(${kind === 'p' ? t('по себестоимости') : t('по цене закупки')})</span>` : '';
    };
    drawItem();
  };

  const tabWriteoffs = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const name = w => ((w.t === 'p' ? W.product(w.item) : W.material(w.item)) || {}).name || '—';
    const rows = W.db.writeoffs.filter(w => w.t === S.kind && W.inRange(w.at, from, to) && (!q || name(w).toLowerCase().includes(q))).slice().reverse();
    return `<div class="card">${W.table({ cols: [
      { label: t('Наименование'), title: true, render: w => `<div class="cell-main">${esc(name(w))}</div><div class="cell-sub">№${w.no} · ${W.fmtDT(w.at)}</div>` },
      { label: t('Сумма'), r: true, aside: true, render: w => `<span class="money" style="color:var(--bad)">−${W.money(w.cost)}</span>` },
      { label: t('Кол-во'), r: true, render: w => `<b>${W.qty(w.qty)}</b> <span class="muted">${unit(w)}</span>` },
      { label: t('Причина'), render: w => `${esc(t(w.reason))}${w.note ? `<div class="cell-sub">${esc(W.tx(w.note))}</div>` : ''}` },
      { label: t('Кто'), render: w => esc(W.shortName(W.userName(w.by))) },
    ], rows, empty: W.empty(t('Списаний за период нет'), t('Брак и порча списываются кнопкой «Списание брака»'), 'trash'),
      foot: rows.length ? [t('Итого: {n}', { n: rows.length }), `<span class="money">${W.money(W.sum(rows, w => w.cost))}</span>`, '', '', ''] : null })}</div>`;
  };

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


  const TABS = { stock: tabStock, ship: tabShip, moves: tabMoves, writeoffs: tabWriteoffs };
  W.page('warehouse', {
    render(params) {
      const S = st(), tab = TABS[params.tab] ? params.tab : 'stock';
      const prods = W.db.products.filter(p => !p.archived);
      const value = W.sum(prods, p => Math.max(0, W.stock('p', p.id)) * p.price);
      const toShip = W.db.sales.filter(s => s.source === 'phone' && W.OPEN_STAGES.includes(s.stage)).length;
      const inWay = W.db.sales.filter(s => s.stage === 'shipping').length;
      const tb = tab !== 'ship';
      return `<div class="page-head"><div><h1>${t('Склад')}</h1><div class="sub">${t('Готовая продукция на складе: приход, расход, остатки и отгрузки заказов')}</div></div>
        <div class="actions">${W.allow('stock.move') ? `<button class="btn" data-a="writeoff">${I('trash')}${t('Списание брака')}</button>` : ''}${W.can('income') ? `<button class="btn primary" data-go="income">${I('box')}${t('Приход')}</button>` : ''}</div></div>
        <div class="kpis">
          ${W.kpi({ label: t('Позиций в наличии'), value: prods.filter(p => W.stock('p', p.id) > 0).length, small: '/ ' + prods.length, icon: 'grid' })}
          ${W.kpi({ label: t('Стоимость остатков'), value: W.moneyKpi(value), icon: 'coins', c: 'c-ok', foot: t('готовая продукция по ценам продажи') })}
          ${W.kpi({ label: t('Заказов к отгрузке'), value: toShip, icon: 'truck', c: 'c-vio', link: 'warehouse?tab=ship', foot: t('в пути: {n}', { n: inWay }) })}
          ${W.kpi({ label: t('Мало на складе'), value: W.lowProducts().length, icon: 'alert', c: 'c-bad', foot: t('позиций ниже порога') })}
        </div>
        ${W.tabs([{ id: 'stock', label: t('Остатки'), icon: 'layers' }, { id: 'ship', label: t('Отгрузки'), icon: 'truck', cnt: toShip || null }, { id: 'moves', label: t('Движение'), icon: 'swap' }, { id: 'writeoffs', label: t('Списания'), icon: 'trash' }], tab)}
        ${tb ? `<div class="toolbar">${W.seg([{ id: 'p', label: t('Готовая продукция · склад') }, { id: 'm', label: t('Сырьё · производство') }], S.kind, 'kind')}${W.searchBox(S.q, 'q', t('Наименование'))}
          <div class="filters"><select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select>
          ${tab === 'moves' ? `<select class="inp" data-on="mkind">${W.opts([['', t('Все операции')], ...Object.entries(MK).map(([k, v]) => [k, t(v)])], S.mkind)}</select>` : ''}</div>
          <button class="btn" data-a="csv">${I('download')}${t('Скачать')}</button></div>` : ''}
        ${tab === 'ship' ? `<div class="hint mb-16">${t('Заказы по телефону проходят стадии: новый → сборка → готов к отгрузке → в пути → доставлен. Остаток списывается, когда заказ уходит в путь.')}</div>` : ''}
        <div data-region="tab">${TABS[tab]()}</div>`;
    },
    actions: {
      tab: el => { st().page = 1; W.setParams({ tab: el.dataset.v }); },
      kind: el => { const S = st(); S.kind = el.dataset.v; S.wh = ''; S.page = 1; W.swap(); },
      period: el => { st().period = el.value; W.region('tab', TABS[W.cur.params.tab || 'stock']()); },
      mkind: el => { st().mkind = el.value; W.region('tab', tabMoves()); },
      q: el => { st().q = el.value; W.region('tab', TABS[W.cur.params.tab || 'stock']()); },
      more: () => { st().page++; W.region('tab', tabMoves()); },
      writeoff: () => writeoffForm(),
      open: (el, e) => { if (e.target.closest('[data-a="next"]')) return; W.openSale(el.dataset.id); },
      next: (el, e) => {
        e.stopPropagation();
        const s = W.db.sales.find(x => x.id === el.dataset.id);
        const i = W.STAGES.findIndex(x => x.id === s.stage), nx = W.STAGES[i + 1];
        const r = W.setStage(s, nx.id);
        if (r !== true) return W.toast(t('Нельзя отгрузить без остатка: {n}', { n: r.block.map(x => x.p.name).join(', ') }), 'err');
        W.save(); W.toast(t('Заказ №{n}: {s}', { n: W.no(s.no), s: t(nx.name) }));
      },
      csv: () => {
        const S = st(), [from, to] = W.periodRange(S.period);
        if (W.cur.params.tab === 'writeoffs') {
          const ws = W.db.writeoffs.filter(w => w.t === S.kind && W.inRange(w.at, from, to));
          return W.downloadXLSX(t('Списания'), ['№', t('Дата'), t('Наименование'), t('Кол-во'), t('Ед.'), t('Причина'), t('Комментарий'), t('Сумма'), t('Кто')],
            ws.map(w => [w.no, W.fmtDT(w.at), itemName(w), w.qty, unit(w), t(w.reason), W.tx(w.note || ''), w.cost, W.userName(w.by)]),
            { foot: ws.length ? [t('Итого'), '', '', '', '', '', '', W.sum(ws, w => w.cost), ''] : null });
        }
        const rows = W.db.moves.filter(m => m.t === S.kind && (!S.wh || m.wh === S.wh) && W.inRange(m.at, from, to));
        W.downloadXLSX(t('Движение по складу'), [t('Дата'), t('Наименование'), t('Склад'), t('Операция'), t('Кол-во'), t('Ед.')], rows.map(m => [W.fmtDT(m.at), itemName(m), t(W.WH[m.wh]), t(MK[m.kind] || m.kind), m.qty, unit(m)]));
      },
    },
  });
})();
