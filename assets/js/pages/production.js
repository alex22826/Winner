/* Производство (ТЗ 4.16): документы выпуска и прихода, остатки сырья и ГП,
   калькуляция (состав на 1 шт), номенклатура с минимальным порогом. */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('production', { docs: 'all', part: 'raw', calc: null, cq: '', edit: false, q: '' });
  const PST = { plan: ['', W.N('Запланирован')], work: ['warn', W.N('В работе')], done: ['ok', W.N('Завершён')] };
  const RST = { ok: ['ok', W.N('Хватает')], low: ['warn', W.N('Ниже порога')], short: ['bad', W.N('Не хватает')] };

  /* новый выпуск продукции */
  W.prodForm = (pid) => {
    const prods = W.db.products.filter(p => W.db.recipes[p.id] && W.db.recipes[p.id].length);
    const need = (p, qty) => (W.db.recipes[p] || []).map(r => { const m = W.material(r.m); return { m, need: W.round(r.qty * qty, 3), have: W.stock('m', r.m) }; });
    const preview = (p, qty) => {
      const rows = need(p, qty);
      if (!rows.length) return `<div class="muted">${t('Для этого товара не задана калькуляция')}</div>`;
      return `${W.table({ cols: [
        { label: t('Сырьё'), title: true, render: r => `<div class="cell-main">${esc(r.m.name)}</div>` },
        { label: t('Нужно'), r: true, render: r => `${W.qty(r.need)} ${t(r.m.unit)}` },
        { label: t('На складе'), r: true, render: r => `<span style="color:${r.have < r.need ? 'var(--bad)' : 'var(--ok)'};font-weight:600">${W.qty(r.have)} ${t(r.m.unit)}</span>` },
      ], rows })}<div class="row mt-12" style="justify-content:space-between"><span class="muted">${t('Себестоимость выпуска')}</span><b class="money">${W.money(W.unitCost(p) * qty)}</b></div>`;
    };
    const first = pid || (prods[0] || {}).id;
    W.modal({
      size: 'lg', title: t('Новый выпуск продукции'), sub: t('Сырьё спишется по калькуляции, когда выпуск будет завершён'), icon: 'factory',
      body: `<div class="form-grid">${W.fs({ name: 'p', label: t('Продукция'), options: prods.map(p => [p.id, p.name, `${t('ост.')} ${W.qty(W.stock('p', p.id))}`]), value: first })}
        ${W.fi({ name: 'qty', label: t('Количество, шт'), value: 100, type: 'number', attrs: 'min="1" step="1"', req: true })}
        ${W.fta({ name: 'note', label: t('Комментарий'), cls: 'full', ph: t('Смена, партия, особые условия') })}</div>
        <div class="form-sec mt-16">${t('Потребность в сырье')}</div><div class="need mt-12">${preview(first, 100)}</div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn" data-m="plan">${t('Запланировать')}</button><button class="btn primary" data-m="start">${I('play')}${t('Запустить в работу')}</button>`,
      actions: {
        input: (el, m) => { const d = W.form(m.el); m.el.querySelector('.need').innerHTML = preview(d.p, Math.max(0, d.qty)); },
        change: (el, m) => { const d = W.form(m.el); m.el.querySelector('.need').innerHTML = preview(d.p, Math.max(0, d.qty)); },
        plan: (b, m) => save(m, false), start: (b, m) => save(m, true),
      },
    });
    function save(m, start) {
      const d = W.form(m.el);
      if (!(d.qty > 0)) return W.toast(t('Укажите количество'), 'warn');
      const o = W.createProdOrder({ p: d.p, qty: Math.round(d.qty), note: d.note });
      if (start) W.startProd(o);
      W.save(); m.close();
      W.toast(t('Выпуск №{n}: {s}', { n: W.no(o.no), s: start ? t('в работе') : t('запланирован') }));
    }
  };
  const finish = (o) => {
    const r = W.finishProd(o);
    if (r !== true) {
      W.modal({ size: 'sm', title: t('Не хватает сырья'), sub: t('Выпуск №{n} нельзя завершить', { n: W.no(o.no) }), icon: 'alert', iconCls: 'bad',
        body: r.short.map(x => `<div class="list-row"><div class="lr-main"><b>${esc(x.m.name)}</b><span>${t('Нужно {a}, на складе {b}', { a: `${W.qty(x.need)} ${t(x.m.unit)}`, b: `${W.qty(x.have)} ${t(x.m.unit)}` })}</span></div></div>`).join(''),
        foot: `<button class="btn" data-m="close">${t('Закрыть')}</button>${W.can('income') ? `<button class="btn primary" data-m="buy">${I('box')}${t('Оформить приход')}</button>` : ''}`,
        actions: { buy: (b, m) => { m.close(); W.purchaseForm && W.purchaseForm(r.short.map(x => ({ m: x.m.id, qty: Math.ceil(x.need - x.have) }))); } } });
      return;
    }
    W.save();
    W.toast(t('Выпуск №{n} завершён: +{q} шт на склад производства', { n: W.no(o.no), q: W.qty(o.qty) }));
  };

  /* ---------- вкладка «Производство» ---------- */
  const tabProd = () => {
    const S = st(), mon = W.month(), O = W.db.prodOrders, Pu = W.db.purchases;
    const doneM = O.filter(o => o.status === 'done' && (o.doneAt || o.at).slice(0, 7) === mon);
    const lastOut = O.filter(o => o.status === 'done').slice(-1)[0];
    const lastIn = Pu.slice(-1)[0];
    const lastInName = lastIn ? (W.supplier(lastIn.sup) || {}).name : '';
    const docs = [
      ...(S.docs !== 'in' ? O.map(o => ({ kind: 'out', at: o.at, o })) : []),
      ...(S.docs !== 'out' ? Pu.map(p => ({ kind: 'in', at: p.at, p })) : []),
    ].sort((a, b) => a.at < b.at ? 1 : -1);
    const q = S.q.trim().toLowerCase();
    const rows = docs.filter(d => !q || (d.o ? (W.product(d.o.p) || {}).name : (W.supplier(d.p.sup) || {}).name || '').toLowerCase().includes(q)).slice(0, 80);
    const canE = W.allow('prod.edit');
    return `<div class="kpis">
        ${W.kpi({ label: t('Всего документов'), value: O.length + Pu.length, icon: 'file', foot: t('выпуск {a} · приход {b}', { a: O.length, b: Pu.length }) })}
        ${W.kpi({ label: t('В работе'), value: O.filter(o => o.status === 'work').length, icon: 'factory', c: 'c-warn', foot: t('запланировано: {n}', { n: O.filter(o => o.status === 'plan').length }) })}
        ${W.kpi({ label: t('Завершено за месяц'), value: doneM.length, icon: 'checkCircle', c: 'c-ok', foot: t('документов выпуска') })}
        ${W.kpi({ label: t('Выпуск за месяц'), value: W.fmtNum(W.sum(doneM, o => o.qty)), small: t('шт'), icon: 'layers', c: 'c-vio', foot: lastOut ? t('последний: {d} · {n}', { d: W.fmtDate(lastOut.doneAt || lastOut.at), n: esc((W.product(lastOut.p) || {}).name) }) : '—' })}
        ${W.kpi({ label: t('Оприходовано на сумму'), value: W.moneyKpi(W.sum(Pu, p => p.total)), icon: 'box', foot: t('сырьё и тара за всё время') })}
        ${W.kpi({ label: t('Приход за текущий месяц'), value: W.moneyKpi(W.sum(Pu.filter(p => p.at.slice(0, 7) === mon), p => p.total)), icon: 'calendar', c: 'c-ok' })}
        ${W.kpi({ label: t('Всего приходов'), value: Pu.length, icon: 'download', c: 'c-vio' })}
        ${W.kpi({ label: t('Последний приход'), value: lastIn ? W.fmtDate(lastIn.at) : '—', icon: 'clock', c: 'c-warn', foot: esc(lastInName) })}
      </div>
      <div class="toolbar">${W.seg([{ id: 'all', label: t('Все документы') }, { id: 'out', label: t('Выпуск'), cnt: O.length }, { id: 'in', label: t('Приход'), cnt: Pu.length }], S.docs, 'docs')}${W.searchBox(S.q, 'q', t('Продукция или поставщик'))}</div>
      <div class="card">${W.table({
        cols: [
          { label: t('Документ'), title: true, render: d => `<div class="cell-flex"><div class="kpi-ic ${d.kind === 'out' ? 'c-vio' : 'c-ok'}" style="width:34px;height:34px">${I(d.kind === 'out' ? 'factory' : 'box', 'ic-sm')}</div><div style="min-width:0"><div class="cell-main">${d.kind === 'out' ? t('Выпуск №{n}', { n: W.no(d.o.no) }) : t('Приход №{n}', { n: W.no(d.p.no) })}</div><div class="cell-sub">${W.fmtDT(d.at)}</div></div></div>` },
          { label: t('Статус'), aside: true, render: d => d.kind === 'out' ? W.badge(t(PST[d.o.status][1]), PST[d.o.status][0]) : W.badge(t('Оприходован'), 'ok') },
          { label: t('Наименование'), render: d => d.kind === 'out' ? esc((W.product(d.o.p) || {}).name) : `${esc((W.supplier(d.p.sup) || {}).name)}<div class="cell-sub">${d.p.items.map(i => esc((W.material(i.m) || {}).name)).slice(0, 3).join(', ')}${d.p.items.length > 3 ? '…' : ''}</div>` },
          { label: t('Количество'), r: true, render: d => d.kind === 'out' ? `${W.qty(d.o.qty)} ${t('шт')}` : t('{n} поз.', { n: d.p.items.length }) },
          { label: t('Сумма'), r: true, render: d => `<span class="money">${W.money(d.kind === 'out' ? (d.o.cost || W.unitCost(d.o.p) * d.o.qty) : d.p.total)}</span>` },
          { label: '', cls: 'w-act', render: d => d.kind === 'out' && canE && d.o.status !== 'done' ? `<div class="act">${d.o.status === 'plan' ? `<button data-a="start" data-id="${d.o.id}" title="${t('Запустить')}">${I('play')}</button>` : ''}<button class="go" data-a="finish" data-id="${d.o.id}" title="${t('Завершить выпуск')}">${I('check')}</button></div>` : '' },
        ], rows, empty: W.empty(t('Документов нет'), '', 'file'),
      })}</div>`;
  };

  /* ---------- вкладка «Остатки» ---------- */
  const tabStock = () => {
    const S = st();
    let body = '';
    if (S.part === 'raw') {
      const rows = W.rawNeeds();
      body = `<div class="card card-pad mb-16" style="box-shadow:none;background:var(--info-bg);border-color:transparent;display:flex;gap:12px;align-items:center">${I('flask')}<div style="font-size:13.5px"><b>${t('Потребность = под заказы + страховой порог − остаток')}</b><div class="t2">${t('Под заказы считается сырьё для незавершённых выпусков и для заказов клиентов, которые не покрыты остатком готовой продукции.')}</div></div></div>
      <div class="card">${W.table({ cols: [
        { label: t('Сырьё'), title: true, render: r => `<div class="cell-main">${esc(r.m.name)}</div><div class="cell-sub">${esc((W.supplier(r.m.sup) || {}).name || '')}</div>` },
        { label: t('Статус'), aside: true, render: r => W.badge(t(RST[r.status][1]), RST[r.status][0]) },
        { label: t('Под заказы'), r: true, render: r => `${W.qty(r.forOrders)} ${t(r.m.unit)}` },
        { label: t('Страховой порог'), r: true, render: r => `${W.qty(r.safety)} ${t(r.m.unit)}` },
        { label: t('Остаток'), r: true, render: r => `<b>${W.qty(r.stock)}</b> ${t(r.m.unit)}` },
        { label: t('Потребность'), r: true, render: r => r.toBuy > 0 ? `<b style="color:var(--bad)">${W.qty(r.toBuy)} ${t(r.m.unit)}</b>` : `<span class="muted">0</span>` },
      ], rows: rows.sort((a, b) => ({ short: 0, low: 1, ok: 2 }[a.status] - { short: 0, low: 1, ok: 2 }[b.status])), rowAttr: r => r.status === 'short' ? 'class="row-bad"' : r.status === 'low' ? 'class="row-warn"' : '' })}</div>
      ${W.can('income') && rows.some(r => r.toBuy > 0) ? `<div class="row mt-16" style="justify-content:flex-end"><button class="btn primary" data-a="buyNeed">${I('box')}${t('Оформить приход по потребности')}</button></div>` : ''}`;
    } else if (S.part === 'fg') {
      const rows = W.db.products.filter(p => !p.archived);
      body = `<div class="card">${W.table({ cols: [
        { label: t('Продукция'), title: true, render: p => `<div class="cell-flex"><div class="thumb">${W.productArt(p)}</div><div style="min-width:0"><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(W.catName(p.cat))}</div></div></div>` },
        { label: t('Всего'), r: true, aside: true, render: p => { const s = W.stock('p', p.id); return `<b style="color:${s <= W.minStock(p) ? 'var(--bad)' : 'inherit'}">${W.qty(s)}</b> ${t('шт')}`; } },
        ...['prod', 'main', 'shop'].map(wh => ({ label: t(W.WH[wh]), r: true, render: p => W.qty(W.stock('p', p.id, wh)) })),
        { label: t('В резерве'), r: true, render: p => { const r = W.reserved(p.id); return r ? `<span class="badge info plain">${W.qty(r)}</span>` : '<span class="muted">—</span>'; } },
        { label: t('Мин. порог'), r: true, render: p => W.minStock(p) },
      ], rows, rowAttr: p => W.stock('p', p.id) <= W.minStock(p) ? 'class="row-warn"' : '' })}</div>`;
    } else {
      const whs = ['raw', 'prod', 'main', 'shop'];
      body = `<div class="grid g-4">${whs.map(wh => {
        const isRaw = wh === 'raw';
        const items = (isRaw ? W.db.materials : W.db.products).map(x => ({ x, q: W.stock(isRaw ? 'm' : 'p', x.id, wh) })).filter(r => r.q > 0);
        const value = W.sum(items, r => r.q * (r.x.price || 0));
        return `<div class="card card-pad"><div class="row nw"><div class="kpi-ic ${isRaw ? 'c-warn' : wh === 'shop' ? 'c-ok' : wh === 'prod' ? 'c-vio' : ''}">${I(isRaw ? 'flask' : wh === 'shop' ? 'cart' : wh === 'prod' ? 'factory' : 'warehouse')}</div><div style="min-width:0"><b style="font-family:var(--font-d)">${t(W.WH[wh])}</b><div class="muted" style="font-size:12.5px">${t('{n} позиций', { n: items.length })}</div></div></div>
          <div class="kpi-val" style="font-size:21px">${W.moneyKpi(value)}</div><div class="muted" style="font-size:12.5px;margin-bottom:10px">${isRaw ? t('по закупочным ценам') : t('по ценам продажи')}</div>
          ${items.sort((a, b) => b.q * (b.x.price || 0) - a.q * (a.x.price || 0)).slice(0, 5).map(r => `<div class="list-row" style="padding:7px 0"><div class="lr-main"><b style="font-size:13px;font-weight:500">${esc(r.x.name)}</b></div><span class="nowrap" style="font-size:13px;font-weight:600">${W.qty(r.q)} ${isRaw ? t(r.x.unit) : t('шт')}</span></div>`).join('')}</div>`;
      }).join('')}</div>`;
    }
    return `<div class="toolbar">${W.seg([{ id: 'raw', label: t('Сырьё') }, { id: 'fg', label: t('Готовая продукция') }, { id: 'wh', label: t('Склады') }], S.part, 'part')}</div>${body}`;
  };

  /* ---------- вкладка «Калькуляция» ---------- */
  const tabCalc = () => {
    const S = st(), q = S.cq.trim().toLowerCase();
    const prods = W.db.products.filter(p => !q || p.name.toLowerCase().includes(q));
    if (!S.calc || !W.product(S.calc)) S.calc = (W.db.products[0] || {}).id;
    const p = W.product(S.calc), rec = W.db.recipes[p.id] || [];
    const cost = W.unitCost(p.id), margin = p.price ? (p.price - cost) / p.price * 100 : 0;
    const canE = W.allow('recipe.edit');
    const mOpts = W.db.materials.map(m => [m.id, `${m.name}, ${t(m.unit)}`]);
    const right = S.edit ? `
      <div class="line-head" style="display:grid;grid-template-columns:minmax(0,1fr) 110px minmax(0,.8fr) 40px;gap:8px;font-size:12px;color:var(--muted);margin-bottom:6px"><span>${t('Компонент')}</span><span class="r">${t('Расход на 1 шт')}</span><span>${t('Примечание')}</span><span></span></div>
      <div class="rec-rows">${(rec.length ? rec : [{ m: W.db.materials[0].id, qty: 1, note: '' }]).map(r => recRow(r, mOpts)).join('')}</div>
      <div class="row mt-8"><button class="btn sm" data-a="recAdd">${I('plus')}${t('Добавить компонент')}</button><span class="spacer"></span><button class="btn" data-a="recCancel">${t('Отмена')}</button><button class="btn primary" data-a="recSave">${I('check')}${t('Сохранить состав')}</button></div>`
      : (rec.length ? W.table({ cols: [
        { label: t('Компонент'), title: true, render: r => `<div class="cell-main">${esc((W.material(r.m) || {}).name)}</div>` },
        { label: t('Расход на 1 шт'), r: true, aside: true, render: r => `<b>${W.qty(r.qty)}</b> ${t((W.material(r.m) || {}).unit)}` },
        { label: t('Примечание'), render: r => `<span class="t2">${esc(r.note || '—')}</span>` },
        { label: t('Стоимость'), r: true, render: r => `<span class="money">${W.money(r.qty * ((W.material(r.m) || {}).price || 0))}</span>` },
      ], rows: rec, foot: [t('Себестоимость 1 шт'), '', '', `<span class="money">${W.money(cost)}</span>`] }) : W.empty(t('Состав не задан'), t('Это покупной товар или калькуляция ещё не внесена'), 'flask', canE ? `<button class="btn primary" data-a="recEdit">${I('plus')}${t('Задать состав')}</button>` : ''));
    return `<div class="split">
      <div class="card"><div class="card-body" style="padding-bottom:8px"><div class="inp-wrap">${I('search')}<input class="inp" type="search" data-on="cq" value="${esc(S.cq)}" placeholder="${t('Поиск по названию')}"></div></div>
        <div class="pick-list" data-region="picks">${picks(prods)}</div></div>
      <div class="card"><div class="card-head"><div class="cell-flex"><div class="thumb" style="width:48px;height:48px">${W.productArt(p)}</div><div style="min-width:0"><h3>${esc(p.name)}</h3><div class="sub">${t('Состав комплекта на 1 штуку')}</div></div></div>
        <div class="right">${canE && !S.edit && rec.length ? `<button class="btn sm" data-a="recEdit">${I('edit')}${t('Изменить')}</button>` : ''}</div></div>
        ${rec.length && !S.edit ? `<div class="grid g-3" style="padding:14px 20px 0">
          <div class="kpi" style="box-shadow:none;padding:12px 14px"><div class="kpi-label">${t('Себестоимость')}</div><div class="kpi-val" style="font-size:19px;margin-top:6px">${W.money(cost)}</div></div>
          <div class="kpi" style="box-shadow:none;padding:12px 14px"><div class="kpi-label">${t('Цена продажи')}</div><div class="kpi-val" style="font-size:19px;margin-top:6px">${W.money(p.price)}</div></div>
          <div class="kpi" style="box-shadow:none;padding:12px 14px"><div class="kpi-label">${t('Наценка')}</div><div class="kpi-val" style="font-size:19px;margin-top:6px;color:${margin < 15 ? 'var(--bad)' : 'var(--ok)'}">${W.fmtNum(margin, 1)}%</div></div></div>` : ''}
        <div class="card-body ${S.edit ? '' : 'flush'}">${right}</div></div></div>`;
  };
  const picks = prods => prods.map(p => `<button class="pick ${p.id === st().calc ? 'on' : ''}" data-a="pick" data-id="${p.id}"><div class="thumb" style="width:36px;height:36px">${W.productArt(p)}</div><div style="min-width:0"><b class="ellipsis">${esc(p.name)}</b><span>${(W.db.recipes[p.id] || []).length ? t('{n} компонентов', { n: W.db.recipes[p.id].length }) : t('состав не задан')}</span></div></button>`).join('') || `<div class="muted" style="padding:12px">${t('Ничего не найдено')}</div>`;
  const recRow = (r, mOpts) => `<div class="line-row rec-row" style="grid-template-columns:minmax(0,1fr) 110px minmax(0,.8fr) 40px">
    <div style="min-width:0"><select class="inp" data-k="m">${W.opts(mOpts, r.m)}</select></div>
    <input class="inp num" data-k="qty" inputmode="decimal" value="${String(r.qty).replace('.', ',')}" aria-label="${t('Расход на 1 шт')}">
    <input class="inp" data-k="note" value="${esc(r.note || '')}" placeholder="${t('Примечание')}">
    <button class="btn icon ghost" data-a="recDel" title="${t('Удалить')}">${I('x')}</button></div>`;

  /* ---------- вкладка «Номенклатура» ---------- */
  const tabNomen = () => {
    const canE = W.allow('catalog.edit') || W.allow('prod.edit');
    const produced = {};
    W.db.moves.filter(m => m.t === 'p' && m.kind === 'produce').forEach(m => { produced[m.item] = (produced[m.item] || 0) + m.qty; });
    const rows = W.db.products.filter(p => !p.archived);
    return `<div class="card card-pad mb-16" style="box-shadow:none;background:var(--warn-bg);border-color:transparent;display:flex;gap:12px;align-items:center">${I('bell')}<div style="font-size:13.5px"><b>${t('Минимальный порог')}</b><div class="t2">${t('Когда остаток опускается до порога, программа показывает уведомление о малом запасе. Пустое поле — общий порог из настроек ({n} шт).', { n: W.db.settings.lowStock })}</div></div></div>
      <div class="card">${W.table({ cols: [
        { label: t('Название продукта'), title: true, render: p => `<div class="cell-flex"><div class="thumb">${W.productArt(p)}</div><div style="min-width:0"><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.sku || '')}</div></div></div>` },
        { label: t('Статус'), aside: true, render: p => { const s = W.stock('p', p.id); return s <= 0 ? W.badge(t('Нет в наличии'), 'bad') : s <= W.minStock(p) ? W.badge(t('Мало'), 'warn') : W.badge(t('В норме'), 'ok'); } },
        { label: t('Выпущено, шт'), r: true, render: p => W.qty(produced[p.id] || 0) },
        { label: t('Остаток, шт'), r: true, render: p => `<b>${W.qty(W.stock('p', p.id))}</b>` },
        { label: t('Мин. порог, шт'), r: true, render: p => canE ? `<input class="inp sm num" style="width:90px;margin-left:auto" data-change="minStock" data-id="${p.id}" inputmode="numeric" value="${p.minStock ?? ''}" placeholder="${W.db.settings.lowStock}">` : W.minStock(p) },
      ], rows, rowAttr: p => W.stock('p', p.id) <= W.minStock(p) ? 'class="row-warn"' : '' })}</div>`;
  };

  const TABS = { prod: tabProd, stock: tabStock, calc: tabCalc, nomen: tabNomen };
  W.page('production', {
    render(params) {
      const tab = TABS[params.tab] ? params.tab : 'prod';
      const low = W.lowProducts().length, raw = W.lowMaterials().length;
      return `<div class="page-head"><div><h1>${t('Производство')}</h1><div class="sub">${t('Выпуск продукции, сырьё, калькуляция и номенклатура')}</div></div>
        <div class="actions">${W.can('income') ? `<button class="btn" data-go="income">${I('box')}${t('Приход сырья')}</button>` : ''}${W.allow('prod.edit') ? `<button class="btn primary" data-a="new">${I('plus')}${t('Новый выпуск')}</button>` : ''}</div></div>
        ${W.tabs([{ id: 'prod', label: t('Производство'), icon: 'factory' }, { id: 'stock', label: t('Остатки'), icon: 'layers', cnt: raw || null, hot: true }, { id: 'calc', label: t('Калькуляция'), icon: 'flask' }, { id: 'nomen', label: t('Номенклатура'), icon: 'list', cnt: low || null, hot: true }], tab)}
        <div data-region="tab">${TABS[tab]()}</div>`;
    },
    actions: {
      tab: el => { st().edit = false; W.setParams({ tab: el.dataset.v }); },
      new: () => W.prodForm(),
      docs: el => { st().docs = el.dataset.v; W.swap(); },
      q: el => { st().q = el.value; W.region('tab', tabProd()); },
      part: el => { st().part = el.dataset.v; W.swap(); },
      start: el => { const o = W.db.prodOrders.find(x => x.id === el.dataset.id); W.startProd(o); W.save(); W.toast(t('Выпуск №{n} запущен', { n: W.no(o.no) })); },
      finish: el => finish(W.db.prodOrders.find(x => x.id === el.dataset.id)),
      buyNeed: () => W.purchaseForm && W.purchaseForm(W.rawNeeds().filter(r => r.toBuy > 0).map(r => ({ m: r.m.id, qty: Math.ceil(r.toBuy) }))),
      cq: el => { st().cq = el.value; const q = el.value.trim().toLowerCase(); W.region('picks', picks(W.db.products.filter(p => !q || p.name.toLowerCase().includes(q)))); },
      pick: el => { st().calc = el.dataset.id; st().edit = false; W.swap(); },
      recEdit: () => { st().edit = true; W.refresh(); },
      recCancel: () => { st().edit = false; W.refresh(); },
      recAdd: () => { document.querySelector('.rec-rows').insertAdjacentHTML('beforeend', recRow({ m: W.db.materials[0].id, qty: 1, note: '' }, W.db.materials.map(m => [m.id, `${m.name}, ${t(m.unit)}`]))); },
      recDel: el => el.closest('.rec-row').remove(),
      recSave: () => {
        const rows = [...document.querySelectorAll('.rec-row')].map(r => ({ m: r.querySelector('[data-k=m]').value, qty: W.parseNum(r.querySelector('[data-k=qty]').value), note: r.querySelector('[data-k=note]').value.trim() })).filter(r => r.qty > 0);
        const ids = rows.map(r => r.m);
        if (new Set(ids).size !== ids.length) return W.toast(t('Компонент указан дважды — объедините строки'), 'warn');
        W.db.recipes[st().calc] = rows; st().edit = false; W.save(); W.toast(t('Состав сохранён'));
      },
      minStock: el => {
        const p = W.product(el.dataset.id), v = el.value.trim();
        p.minStock = v === '' ? null : Math.max(0, Math.round(W.parseNum(v)));
        W.save(); W.toast(t('Порог для «{n}»: {v}', { n: p.name, v: W.minStock(p) }));
      },
    },
  });
})();
