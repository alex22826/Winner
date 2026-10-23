/* Приход (ТЗ 4.17): закупка сырья и материалов, справочник поставщиков */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('income', { q: '', sq: '', period: 'all', sup: '' });

  /* ---------- новый приход ---------- */
  W.purchaseForm = (prefill) => {
    const mOpts = W.db.materials.map(m => [m.id, m.name, `${W.money(m.price)} / ${t(m.unit)}`]);
    const sups = W.db.suppliers.map(s => [s.id, s.name, s.inn]);
    const firstSup = prefill && prefill.length ? (W.material(prefill[0].m) || {}).sup : '';
    const row = (r = {}) => `<div class="line-row pu-row" style="grid-template-columns:minmax(0,1fr) 100px 130px 36px">
      <div style="min-width:0"><select class="inp" data-k="m">${W.opts(mOpts, r.m || '')}</select><div class="hint pu-hint" style="font-size:12px;margin-top:4px"></div></div>
      <input class="inp num" data-k="qty" inputmode="decimal" value="${r.qty || ''}" placeholder="0" aria-label="${t('Кол-во')}">
      <input class="inp num" data-k="price" data-money inputmode="decimal" value="${W.fmtNum(r.price || (W.material(r.m) || W.db.materials[0]).price)}" aria-label="${t('Цена')}">
      <button type="button" class="btn icon ghost" data-m="del" title="${t('Удалить')}">${I('x')}</button></div>`;
    const m = W.modal({
      size: 'lg', title: t('Новый приход'), sub: t('Поступление сырья, тары и материалов на склад сырья'), icon: 'box', iconCls: 'ok',
      body: `<div class="form-grid">
        ${W.fs({ name: 'sup', label: t('Поставщик'), options: [['', t('Выберите поставщика')], ...sups], value: firstSup, req: true })}
        ${W.fi({ name: 'date', label: t('Дата прихода'), type: 'date', value: W.today() })}</div>
        <div class="form-sec mt-16">${t('Позиции')}</div>
        <div class="line-head mt-8" style="display:grid;grid-template-columns:minmax(0,1fr) 100px 130px 36px;gap:8px;font-size:12px;color:var(--muted);margin-bottom:6px"><span>${t('Наименование')}</span><span class="r">${t('Кол-во')}</span><span class="r">${t('Цена за ед.')}</span><span></span></div>
        <div class="pu-rows">${(prefill && prefill.length ? prefill : [{}]).map(row).join('')}</div>
        <button type="button" class="btn sm" data-m="add">${I('plus')}${t('Добавить позицию')}</button>
        <div class="form-grid mt-16">
          ${W.fs({ name: 'method', label: t('Оплата поставщику'), options: [['', t('Без оплаты (в долг)')], ['transfer', t('Безналичный расчёт')], ['cash', t('Наличные')], ['corp', t('Корпоративная карта')]], value: 'transfer' })}
          ${W.fi({ name: 'paid', label: t('Сумма оплаты'), money: true })}
          ${W.fta({ name: 'note', label: t('Комментарий'), cls: 'full', ph: t('Номер накладной поставщика, условия') })}</div>
        <div class="row mt-16" style="justify-content:space-between;font-size:17px"><span>${t('Итого по приходу')}</span><b class="money pu-total" style="font-family:var(--font-d)">0</b></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ok" data-m="save">${I('check')}${t('Оприходовать')}</button>`,
      actions: {
        add: () => { m.el.querySelector('.pu-rows').insertAdjacentHTML('beforeend', row()); recalc(); },
        del: b => { if (m.el.querySelectorAll('.pu-row').length > 1) b.closest('.pu-row').remove(); recalc(); },
        input: el => { if (el.name === 'paid') paidTouched = true; recalc(); },
        change: el => { if (el.dataset.k === 'm') { const mm = W.material(el.value); el.closest('.pu-row').querySelector('[data-k=price]').value = W.fmtNum(mm.price); } recalc(); },
        save: () => {
          const d = W.form(m.el);
          if (!d.sup) { W.toast(t('Выберите поставщика'), 'warn'); return m.el.querySelector('[name=sup]').focus(); }
          const items = rows().filter(r => r.qty > 0);
          if (!items.length) return W.toast(t('Укажите количество хотя бы по одной позиции'), 'warn');
          const p = W.createPurchase({ sup: d.sup, at: `${d.date}T${W.now().slice(11)}`, items, method: d.method || null, paid: d.method ? d.paid : 0, note: d.note });
          W.save(); m.close(); W.toast(t('Приход №{n} оприходован на {a}', { n: W.no(p.no), a: W.money(p.total) }));
        },
      },
    });
    let paidTouched = false;
    const rows = () => [...m.el.querySelectorAll('.pu-row')].map(r => ({ el: r, m: r.querySelector('[data-k=m]').value, qty: W.parseNum(r.querySelector('[data-k=qty]').value), price: W.parseNum(r.querySelector('[data-k=price]').value) }));
    const recalc = () => {
      const rs = rows();
      rs.forEach(r => { const mm = W.material(r.m); r.el.querySelector('.pu-hint').textContent = mm ? `${t('на складе')} ${W.qty(W.stock('m', mm.id))} ${t(mm.unit)} · ${W.money(r.qty * r.price)}` : ''; });
      const total = W.sum(rs, r => r.qty * r.price);
      m.el.querySelector('.pu-total').textContent = W.money(total);
      if (!paidTouched) m.el.querySelector('[name=paid]').value = W.fmtNum(total);
    };
    recalc();
  };

  /* ---------- оплата поставщику: гасит сначала самые старые неоплаченные приходы ---------- */
  const canPay = () => W.allow('income.edit') || W.allow('finance.edit');
  const payForm = (supId, only) => {
    const list = (only ? [only] : W.db.purchases.filter(p => p.sup === supId)).filter(p => W.purchaseDebt(p) > 0).sort((a, b) => a.at < b.at ? -1 : 1);
    if (!list.length) return W.toast(t('Долга перед поставщиком нет'), 'ok');
    const debt = W.round(W.sum(list, W.purchaseDebt)), s = W.supplier(supId) || {};
    const m = W.modal({
      title: t('Оплата поставщику'), sub: esc(s.name), icon: 'wallet', iconCls: 'ok',
      body: `<div class="row" style="justify-content:space-between;font-size:17px"><span>${t('Долг')}</span><b class="money" style="font-family:var(--font-d);color:var(--bad)">${W.money(debt)}</b></div>
        <div class="muted mt-8" style="font-size:13px">${list.slice(0, 5).map(p => `${t('Приход')} №${W.no(p.no)} ${t('от {d}', { d: W.fmtDate(p.at) })} — ${W.money(W.purchaseDebt(p))}`).join('<br>')}${list.length > 5 ? `<br>${t('…и ещё {n}', { n: list.length - 5 })}` : ''}</div>
        <div class="form-grid mt-16">
          ${W.fs({ name: 'method', label: t('Способ оплаты'), options: [['transfer', t('Безналичный расчёт')], ['cash', t('Наличные')], ['corp', t('Корпоративная карта')]], value: 'transfer' })}
          ${W.fi({ name: 'amount', label: t('Сумма оплаты'), money: true, value: debt })}</div>
        <div class="hint mt-8">${t('Безналичный платёж попадёт в «Банк» на подтверждение. Если сумма меньше долга — гасятся сначала старые приходы.')}</div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ok" data-m="save">${I('check')}${t('Оплатить')}</button>`,
      actions: {
        save: async () => {
          const d = W.form(m.el);
          let left = W.round(Math.min(d.amount, debt));
          if (!(left > 0)) { W.toast(t('Укажите сумму оплаты'), 'warn'); return m.el.querySelector('[name=amount]').focus(); }
          if (d.method !== 'transfer' && left > W.cashBal(d.method)) return W.toast(t('Недостаточно средств: {a} — {b}', { a: t(W.METHODS[d.method]), b: W.money(W.cashBal(d.method)) }), 'warn');
          if (!await W.confirm({ title: t('Оплатить {a}?', { a: W.money(left) }), text: `${esc(s.name)} · ${t(W.METHODS[d.method])}`, ok: t('Оплатить'), danger: false, icon: 'wallet' })) return;
          const paid = left;
          for (const p of list) { if (left <= 0) break; const x = Math.min(left, W.purchaseDebt(p)); W.payPurchase(p, d.method, x); left = W.round(left - x); }
          W.save(); m.close(); W.toast(t('Оплачено поставщику: {a}', { a: W.money(paid) }));
        },
      },
    });
  };
  const payBadge = p => { const pd = W.purchasePaid(p); return pd >= p.total - 1 ? W.badge(t('Оплачено'), 'ok') : pd > 0 ? W.badge(t('Частично'), 'warn') : W.badge(t('Не оплачено'), 'bad'); };

  const openPurchase = (id) => {
    const p = W.db.purchases.find(x => x.id === id), s = W.supplier(p.sup) || {};
    const debt = W.purchaseDebt(p);
    const doc = `<div class="doc">${W.docHead(t('Приходная накладная №{n}', { n: W.no(p.no) }), t('от {d}', { d: W.fmtDate(p.at) }))}
      <div class="parties"><div><b>${t('Поставщик')}</b>${esc(s.name)}<br>${t('ИНН')}: ${esc(s.inn || '—')}<br>${t('Тел.')}: ${esc(s.phone || '—')}</div><div><b>${t('Получатель')}</b>${esc(W.db.settings.company.name)}<br>${t(W.WH.raw)}</div></div>
      <table><thead><tr><th>№</th><th>${t('Наименование')}</th><th>${t('Ед.')}</th><th class="r">${t('Кол-во')}</th><th class="r">${t('Цена')}</th><th class="r">${t('Сумма')}</th></tr></thead>
      <tbody>${p.items.map((i, n) => { const m = W.material(i.m) || {}; return `<tr><td>${n + 1}</td><td>${esc(m.name)}</td><td>${t(m.unit)}</td><td class="r">${W.qty(i.qty)}</td><td class="r">${W.money(i.price)}</td><td class="r">${W.money(i.qty * i.price)}</td></tr>`; }).join('')}</tbody></table>
      <div class="total">${t('Итого')}: ${W.money(p.total)}</div>${p.note ? `<div style="margin-top:8px;color:#555">${esc(p.note)}</div>` : ''}
      <div class="signs"><div>${t('Сдал')}: ____________</div><div>${t('Принял')}: ____________ ${esc(W.shortName(W.userName(p.by)))}</div></div></div>`;
    const paidLine = `<div class="row mb-16" style="justify-content:space-between;gap:10px;flex-wrap:wrap">${payBadge(p)}<span style="font-size:14px">${t('Оплачено')}: <b class="money">${W.money(W.purchasePaid(p))}</b>${debt ? ` · ${t('Долг')}: <b class="money" style="color:var(--bad)">${W.money(debt)}</b>` : ''}</span></div>`;
    W.modal({ size: 'lg', title: t('Приход №{n}', { n: W.no(p.no) }), sub: `${W.fmtDT(p.at)} · ${esc(s.name)}`, icon: 'box', body: `${paidLine}<div style="overflow-x:auto">${doc}</div>`,
      foot: `<button class="btn" data-m="close">${t('Закрыть')}</button>${debt && canPay() ? `<button class="btn ok" data-m="pay">${I('wallet')}${t('Оплатить')}</button>` : ''}<button class="btn primary" data-m="print">${I('print')}${t('Печать')}</button>`,
      actions: { print: () => W.printHTML(doc), pay: (b, mm) => { mm.close(); payForm(p.sup, p); } } });
  };

  /* ---------- поставщик ---------- */
  const supplierForm = (s) => {
    const isNew = !s; s = s || {};
    W.modal({
      title: isNew ? t('Новый поставщик') : t('Редактировать поставщика'), icon: 'building',
      body: `<div class="form-grid">
        ${W.fi({ name: 'name', label: t('Название'), value: s.name || '', req: true, cls: 'full' })}
        ${W.fi({ name: 'inn', label: t('ИНН'), value: s.inn || '', ph: '000 000 000' })}
        ${W.fi({ name: 'phone', label: t('Телефон'), value: s.phone || '', type: 'tel', ph: '+998', icon: 'phone' })}
        ${W.fi({ name: 'contact', label: t('Контактное лицо'), value: s.contact || '', icon: 'user', cls: 'full' })}
        <div class="form-sec full">${t('Банковские реквизиты')}</div>
        ${W.fi({ name: 'bank', label: t('Банк'), value: s.bank || '' })}
        ${W.fi({ name: 'mfo', label: t('МФО'), value: s.mfo || '' })}
        ${W.fi({ name: 'account', label: t('Расчётный счёт'), value: s.account || '', cls: 'full', ph: '2020 8000 …' })}</div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Сохранить')}</button>`,
      actions: {
        save: (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          if (isNew) W.db.suppliers.push(Object.assign({ id: W.uid('sp') }, d)); else Object.assign(s, d);
          W.save(); m.close(); W.toast(isNew ? t('Поставщик добавлен') : t('Изменения сохранены'));
        },
      },
    });
  };

  const buyList = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const rows = W.db.purchases.filter(p => W.inRange(p.at, from, to) && (!S.sup || p.sup === S.sup) && (!q || ((W.supplier(p.sup) || {}).name + ' ' + p.items.map(i => (W.material(i.m) || {}).name).join(' ') + ' ' + W.no(p.no)).toLowerCase().includes(q))).slice().reverse();
    return `<div class="card">${W.table({ cols: [
      { label: t('Приход'), title: true, render: p => `<div class="cell-main">№${W.no(p.no)} · ${esc((W.supplier(p.sup) || {}).name)}</div><div class="cell-sub">${W.fmtDT(p.at)}</div>` },
      { label: t('Сумма'), r: true, aside: true, render: p => `<span class="money">${W.money(p.total)}</span>` },
      { label: t('Позиции'), render: p => `<span style="font-size:13px">${p.items.map(i => `${esc((W.material(i.m) || {}).name)} — ${W.qty(i.qty)} ${t((W.material(i.m) || {}).unit)}`).join('<br>')}</span>` },
      { label: t('Оплата'), render: p => { const d = W.purchaseDebt(p); return payBadge(p) + (d ? `<div class="cell-sub">${t('долг')} ${W.money(d)}</div>` : ''); } },
      { label: t('Принял'), render: p => esc(W.shortName(W.userName(p.by))) },
    ], rows, rowAttr: p => `class="click" data-a="open" data-id="${p.id}"`, empty: W.empty(t('Приходов нет'), '', 'box'),
      foot: rows.length ? [t('Итого: {n}', { n: rows.length }), `<span class="money">${W.money(W.sum(rows, p => p.total))}</span>`, '', '', ''] : null })}</div>`;
  };
  const supList = () => {
    const q = st().sq.trim().toLowerCase();
    const rows = W.db.suppliers.filter(s => !q || [s.name, s.inn, s.contact, s.phone].join(' ').toLowerCase().includes(q));
    return `<div class="card">${W.table({ cols: [
      { label: t('Название'), title: true, render: s => `<div class="cell-flex"><div class="avatar sm" style="--av:${W.avatarBg(s.name)}">${W.initials(s.name.replace(/^(ООО|ИП|АО|ЧП)\s*/i, '').replace(/[«»"]/g, ''))}</div><div style="min-width:0"><div class="cell-main">${esc(s.name)}</div><div class="cell-sub">${t('ИНН')} ${esc(s.inn || '—')}</div></div></div>` },
      { label: t('Закуплено'), r: true, render: s => `<span class="money">${W.money(W.sum(W.db.purchases.filter(p => p.sup === s.id), p => p.total))}</span>` },
      { label: t('Долг'), r: true, aside: true, render: s => { const d = supDebt(s.id); return d ? `<span class="money" style="color:var(--bad);font-weight:700">${W.money(d)}</span>` : '<span class="muted">—</span>'; } },
      { label: t('Телефон'), render: s => s.phone ? `<a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a>` : '—' },
      { label: t('Контакт'), render: s => esc(s.contact || '—') },
      { label: t('Банк'), render: s => `${esc(s.bank || '—')}${s.mfo ? `<div class="cell-sub">${t('МФО')} ${esc(s.mfo)}</div>` : ''}` },
      { label: t('Расчётный счёт'), render: s => `<span class="tnum" style="font-size:13px">${esc(s.account || '—')}</span>` },
      { label: '', cls: 'w-act', render: s => {
        const pay = supDebt(s.id) && canPay() ? `<button class="btn sm ok" data-a="pay" data-id="${s.id}">${I('wallet', 'ic-sm')}${t('Оплатить')}</button>` : '';
        return W.allow('income.edit') ? W.actBtns(s.id, { del: W.isDirector(), extra: pay }) : pay;
      } },
    ], rows, empty: W.empty(t('Поставщики не найдены'), '', 'building') })}</div>`;
  };
  const supDebt = id => W.round(W.sum(W.db.purchases.filter(p => p.sup === id), W.purchaseDebt));

  W.page('income', {
    render(params) {
      const S = st(), tab = params.tab === 'sup' ? 'sup' : 'buy', Pu = W.db.purchases, mon = W.month();
      const last = Pu.slice(-1)[0], owed = Pu.filter(p => W.purchaseDebt(p) > 0);
      return `<div class="page-head"><div><h1>${t('Приход')}</h1><div class="sub">${t('Поступление товаров и материалов, поставщики')}</div></div>
        <div class="actions">${tab === 'sup' && W.allow('income.edit') ? `<button class="btn primary" data-a="addSup">${I('plus')}${t('Добавить поставщика')}</button>` : W.allow('income.edit') ? `<button class="btn primary" data-a="new">${I('plus')}${t('Новый приход')}</button>` : ''}</div></div>
        ${tab === 'buy' ? `<div class="kpis">
          ${W.kpi({ label: t('Оприходовано на сумму'), value: W.moneyKpi(W.sum(Pu, p => p.total)), icon: 'coins', c: 'c-ok', foot: t('{n} приходов', { n: Pu.length }) })}
          ${W.kpi({ label: t('Долг поставщикам'), value: W.moneyKpi(W.sum(owed, W.purchaseDebt)), icon: 'alert', c: 'c-bad', link: 'income?tab=sup', foot: owed.length ? t('не оплачено приходов: {n}', { n: owed.length }) : t('долгов нет') })}
          ${W.kpi({ label: t('За текущий месяц'), value: W.moneyKpi(W.sum(Pu.filter(p => p.at.slice(0, 7) === mon), p => p.total)), icon: 'calendar', c: 'c-vio', foot: t('{n} приходов', { n: Pu.filter(p => p.at.slice(0, 7) === mon).length }) })}
          ${W.kpi({ label: t('Последний приход'), value: last ? W.fmtDate(last.at) : '—', icon: 'clock', c: 'c-warn', foot: last ? esc((W.supplier(last.sup) || {}).name) : '' })}
        </div>` : ''}
        ${W.tabs([{ id: 'buy', label: t('Закупка'), icon: 'box' }, { id: 'sup', label: t('Поставщики'), icon: 'building', cnt: W.db.suppliers.length }], tab)}
        ${tab === 'buy' ? `<div class="toolbar">${W.searchBox(S.q, 'q', t('Поставщик, сырьё или №'))}<div class="filters"><select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select>
          <select class="inp" data-on="sup">${W.opts([['', t('Все поставщики')], ...W.db.suppliers.map(s => [s.id, s.name])], S.sup)}</select></div></div><div data-region="tab">${buyList()}</div>`
          : `<div class="toolbar">${W.searchBox(S.sq, 'sq', t('Название, ИНН или контакт'))}</div><div data-region="tab">${supList()}</div>`}`;
    },
    actions: {
      tab: el => W.setParams({ tab: el.dataset.v }),
      new: () => W.purchaseForm(),
      addSup: () => supplierForm(),
      open: el => openPurchase(el.dataset.id),
      q: el => { st().q = el.value; W.region('tab', buyList()); },
      sq: el => { st().sq = el.value; W.region('tab', supList()); },
      period: el => { st().period = el.value; W.region('tab', buyList()); },
      sup: el => { st().sup = el.value; W.region('tab', buyList()); },
      edit: el => supplierForm(W.supplier(el.dataset.id)),
      pay: el => payForm(el.dataset.id),
      del: async el => {
        const s = W.supplier(el.dataset.id);
        if (W.db.purchases.some(p => p.sup === s.id)) return W.toast(t('Нельзя удалить: по поставщику есть приходы'), 'warn');
        if (!await W.confirm({ title: t('Удалить поставщика?'), text: esc(s.name) })) return;
        W.db.suppliers = W.db.suppliers.filter(x => x.id !== s.id); W.save(); W.toast(t('Поставщик удалён'));
      },
    },
  });
})();
