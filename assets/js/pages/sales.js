/* Продажи → Продажи (ТЗ 4.2, 4.3, 4.6, 4.12): оплаты, возвраты, долги, история,
   оформление продажи и заказа по телефону, накладная и счёт-фактура. */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);

  W.payBadge = s => {
    const st = W.payStatus(s);
    const m = { paid: ['ok', t('Оплачено')], partial: ['warn', t('Частично')], unpaid: ['bad', t('Не оплачено')], returned: ['', t('Возврат')], cancelled: ['', t('Отменён')] }[st];
    return W.badge(m[1], m[0]);
  };
  const STAGE_CLS = { new: '', picking: 'warn', ready: 'info', shipping: 'vio', done: 'ok', cancelled: 'bad' };
  W.stageBadge = s => s.source === 'walkin' && s.stage === 'done' ? W.badge(t('Выдан в магазине'), 'ok') : W.badge(W.stageName(s.stage), STAGE_CLS[s.stage]);
  const methodOpts = (only) => Object.entries(W.METHODS).filter(([k]) => !only || only.includes(k)).map(([k, v]) => [k, t(v)]);
  const chOpts = () => Object.entries(W.CHANNELS).map(([k, v]) => [k, t(v)]);

  /* ---------- оформление продажи / заказа по телефону ---------- */
  W.saleForm = (opt = {}) => {
    let source = opt.source || (W.isDirector() || W.me().roles.includes('seller') ? 'walkin' : 'phone');
    const prods = W.db.products.filter(p => !p.archived);
    const custs = W.db.customers.slice().sort((a, b) => (b.regular - a.regular) || a.name.localeCompare(b.name));
    const pOpts = (ch) => [['', t('Выберите товар')], ...prods.map(p => [p.id, p.name, `${t('ост.')} ${W.qty(W.stock('p', p.id, ch))}`])];
    const row = (ch, it = {}) => `<div class="sale-row" style="display:grid;grid-template-columns:minmax(0,1fr) 92px 130px 36px;gap:8px;align-items:start;margin-bottom:8px">
        <div style="min-width:0"><select class="inp" data-r="p">${W.opts(pOpts(ch), it.p || '')}</select><div class="hint r-hint" style="font-size:12px;margin-top:4px;min-height:0"></div></div>
        <input class="inp num" data-r="qty" inputmode="decimal" value="${it.qty || 1}" aria-label="${t('Кол-во')}">
        <input class="inp num" data-r="price" data-money inputmode="decimal" value="${it.price ? W.fmtNum(it.price) : ''}" aria-label="${t('Цена')}">
        <button type="button" class="btn icon ghost" data-m="delRow" title="${t('Удалить')}">${I('x')}</button></div>`;
    const body = () => `
      <div class="seg" style="margin-bottom:16px;width:100%">${[['walkin', t('Продажа на месте')], ['phone', t('Заказ по телефону')]].map(([k, v]) => `<button type="button" class="${k === source ? 'on' : ''}" data-m="src" data-v="${k}" style="flex:1">${I(k === 'walkin' ? 'cart' : 'phone', 'ic-sm')}${v}</button>`).join('')}</div>
      <div class="form-grid">
        ${W.fs({ name: 'channel', label: t('Канал продажи'), options: chOpts(), value: source === 'walkin' ? 'shop' : 'main' })}
        ${W.fs({ name: 'cust', label: t('Покупатель'), options: [['', t('Розничный покупатель')], ['__new', '＋ ' + t('Новый клиент')], ...custs.map(c => [c.id, c.name, c.phone])] })}
        <div class="full new-cust hidden"><div class="form-grid" style="padding:14px;border-radius:14px;background:var(--surface-2);border:1px dashed var(--line-2)">
          ${W.fi({ name: 'nc_name', label: t('Наименование / имя'), req: false })}
          ${W.fs({ name: 'nc_type', label: t('Тип контрагента'), options: Object.entries(W.CUST_TYPES).map(([k, v]) => [k, t(v)]), value: 'person' })}
          ${W.fi({ name: 'nc_inn', label: t('ИНН'), ph: '000 000 000' })}
          ${W.fi({ name: 'nc_contact', label: t('Директор или контактное лицо') })}
          <div class="full">${W.fsw({ name: 'nc_save', label: t('Сохранить в базу контрагентов'), checked: true })}</div>
        </div></div>
        <div class="phone-f ${source === 'phone' ? '' : 'hidden'} full"><div class="form-grid">
          ${W.fi({ name: 'name', label: t('Контактное лицо'), icon: 'user', req: true })}
          ${W.fi({ name: 'phone', label: t('Телефон'), icon: 'phone', type: 'tel', ph: '+998', req: true })}
          ${W.fi({ name: 'address', label: t('Адрес доставки'), icon: 'pin', cls: 'full', req: true })}
        </div></div>
      </div>
      <div class="form-sec mt-16">${t('Товары')}</div>
      <div class="hint mt-8 sale-head" style="display:grid;grid-template-columns:minmax(0,1fr) 92px 130px 36px;gap:8px;font-size:12px;color:var(--muted)"><span>${t('Наименование')}</span><span class="r">${t('Кол-во, шт')}</span><span class="r">${t('Цена за шт')}</span><span></span></div>
      <div class="rows mt-8">${row('shop', opt.item)}</div>
      <button type="button" class="btn sm" data-m="addRow">${I('plus')}${t('Добавить позицию')}</button>
      <div class="grid g-2 mt-16" style="align-items:end">
        <div class="form-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
          ${W.fs({ name: 'payMethod', label: t('Способ оплаты'), options: methodOpts() })}
          ${W.fi({ name: 'payAmount', label: t('Оплачено сейчас'), money: true })}
          ${W.fi({ name: 'discount', label: t('Скидка'), money: true, cls: 'full' })}
        </div>
        <div class="card" style="padding:14px 16px;box-shadow:none;background:var(--surface-2)">
          <div class="row" style="justify-content:space-between"><span class="muted">${t('Сумма товаров')}</span><b class="money s-sub">0</b></div>
          <div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Скидка')}</span><b class="money s-disc">0</b></div>
          <div class="row mt-8" style="justify-content:space-between;font-size:17px"><span>${t('Итого')}</span><b class="money s-total" style="font-family:var(--font-d)">0</b></div>
          <div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Останется долг')}</span><b class="money s-debt">0</b></div>
        </div>
      </div>
      ${W.fta({ name: 'note', label: t('Комментарий'), ph: t('Например: позвонить за час до доставки'), cls: 'mt-16' })}`;

    let payTouched = false;
    const m = W.modal({
      size: 'lg', title: t('Новая продажа'), sub: t('Продажа в магазине, со склада или с производства'), icon: 'cart', body: body(),
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Оформить')}</button>`,
      actions: {
        src: (b, mm) => {
          source = b.dataset.v;
          mm.el.querySelectorAll('[data-m="src"]').forEach(x => x.classList.toggle('on', x === b));
          mm.el.querySelector('.phone-f').classList.toggle('hidden', source !== 'phone');
          mm.el.querySelector('[name=channel]').value = source === 'walkin' ? 'shop' : 'main';
          if (!payTouched) mm.el.querySelector('[name=payAmount]').value = '';
          redrawRows(); recalc();
        },
        addRow: () => { m.el.querySelector('.rows').insertAdjacentHTML('beforeend', row(ch())); recalc(); const s = m.el.querySelectorAll('.rows select'); s[s.length - 1].focus(); },
        delRow: b => { const rows = m.el.querySelectorAll('.sale-row'); if (rows.length > 1) b.closest('.sale-row').remove(); recalc(); },
        save: () => save(),
        input: (el) => {
          if (el.name === 'payAmount') payTouched = true;
          recalc();
        },
        change: (el) => {
          if (el.dataset.r === 'p') { const p = W.product(el.value); const pr = el.closest('.sale-row').querySelector('[data-r=price]'); if (p) pr.value = W.fmtNum(p.price); }
          if (el.name === 'channel') redrawRows();
          if (el.name === 'cust') {
            const c = W.customer(el.value);
            m.el.querySelector('.new-cust').classList.toggle('hidden', el.value !== '__new');
            if (c) { m.el.querySelector('[name=name]').value = c.contact || c.name; m.el.querySelector('[name=phone]').value = c.phone; m.el.querySelector('[name=address]').value = c.address; }
          }
          recalc();
        },
      },
    });
    const ch = () => m.el.querySelector('[name=channel]').value;
    const redrawRows = () => {
      m.el.querySelectorAll('.sale-row select[data-r=p]').forEach(s => { const v = s.value; s.innerHTML = W.opts(pOpts(ch()), v); });
    };
    const rows = () => [...m.el.querySelectorAll('.sale-row')].map(r => ({ el: r, p: r.querySelector('[data-r=p]').value, qty: W.parseNum(r.querySelector('[data-r=qty]').value), price: W.parseNum(r.querySelector('[data-r=price]').value) }));
    const recalc = () => {
      const rs = rows(), c = ch();
      rs.forEach(r => {
        const h = r.el.querySelector('.r-hint'), p = W.product(r.p);
        if (!p) { h.innerHTML = ''; return; }
        const have = W.stock('p', p.id, c);
        h.innerHTML = r.qty > have
          ? `<span style="color:${p.noShip ? 'var(--bad)' : 'var(--warn)'}">${p.noShip ? t('Не отгружать без остатка — в наличии {n} шт', { n: W.qty(have) }) : t('В канале «{c}» есть только {n} шт', { c: t(W.CHANNELS[c]), n: W.qty(have) })}</span>`
          : `<span class="muted">${t('В наличии: {n} шт', { n: W.qty(have) })} · ${W.money(r.qty * r.price)}</span>`;
      });
      const sub = W.sum(rs, r => r.qty * r.price), disc = W.parseNum(m.el.querySelector('[name=discount]').value), total = Math.max(0, sub - disc);
      const payEl = m.el.querySelector('[name=payAmount]');
      if (!payTouched && source === 'walkin') payEl.value = W.fmtNum(total);
      let paid = W.parseNum(payEl.value);
      if (paid > total) { paid = total; payEl.value = W.fmtNum(total); }
      m.el.querySelector('.s-sub').textContent = W.money(sub);
      m.el.querySelector('.s-disc').textContent = disc ? '−' + W.money(disc) : W.money(0);
      m.el.querySelector('.s-total').textContent = W.money(total);
      const debt = Math.max(0, total - paid);
      const dEl = m.el.querySelector('.s-debt'); dEl.textContent = W.money(debt); dEl.style.color = debt > 0 ? 'var(--bad)' : '';
    };
    const save = async () => {
      const d = W.form(m.el), items = rows().filter(r => r.p && r.qty > 0);
      if (!items.length) return W.toast(t('Добавьте хотя бы один товар'), 'warn');
      let cust = d.cust && d.cust !== '__new' ? d.cust : null;
      if (d.cust === '__new' && !d.nc_name) { W.toast(t('Укажите имя нового клиента'), 'warn'); return m.el.querySelector('[name=nc_name]').focus(); }
      if (source === 'phone') {
        const box = m.el.querySelector('.phone-f');
        if (d.cust === '__new' && !d.name) box.querySelector('[name=name]').value = d.nc_name;
        if (!W.validate(box)) return;
      }
      const block = W.checkShip(d.channel, items).filter(x => x.block);
      if (source === 'walkin' && block.length) return W.toast(t('Нельзя продать без остатка: {n}', { n: block.map(x => x.p.name).join(', ') }), 'err');
      const short = W.checkShip(d.channel, items).filter(x => !x.block);
      if (source === 'walkin' && short.length && !await W.confirm({ title: t('Остатка не хватает'), text: t('По учёту в канале нет нужного количества: {n}. Всё равно продать?', { n: short.map(x => `${x.p.name} (${W.qty(x.have)})`).join(', ') }), ok: t('Продать'), danger: false })) return;
      if (d.cust === '__new') {
        const c = { id: W.uid('k'), name: d.nc_name, type: d.nc_type, inn: d.nc_inn, contact: d.nc_contact || d.name || d.nc_name, phone: d.phone, address: d.address, regular: false, created: W.today() };
        if (d.nc_save) { W.db.customers.push(c); cust = c.id; }
        else d.name = d.name || d.nc_name;
      }
      const c = W.customer(cust);
      const r = W.createSale({
        channel: d.channel, source, cust, name: d.name || (c ? c.contact || c.name : ''), phone: d.phone || (c ? c.phone : ''), address: d.address || (c ? c.address : ''),
        items: items.map(i => ({ p: i.p, qty: i.qty, price: i.price })), discount: d.discount, payMethod: d.payMethod, payAmount: d.payAmount, note: d.note,
      });
      if (r && r.block) return W.toast(t('Нельзя продать без остатка: {n}', { n: r.block.map(x => x.p.name).join(', ') }), 'err');
      W.save();
      m.close();
      W.toast(source === 'walkin' ? t('Продажа №{n} оформлена', { n: W.no(r.no) }) : t('Заказ №{n} принят — передан на склад', { n: W.no(r.no) }));
      if (opt.after) opt.after(r);
    };
    recalc();
    return m;
  };

  /* ---------- карточка продажи ---------- */
  W.openSale = (id) => {
    const s = W.db.sales.find(x => x.id === id);
    if (!s) return;
    const c = W.customer(s.cust);
    const pays = W.db.payments.filter(p => p.sale === s.id);
    const rets = W.db.returns.filter(r => r.sale === s.id);
    const paid = W.salePaid(s), debt = W.saleDebt(s), ret = W.saleReturned(s);
    const order = W.STAGES.map(x => x.id), cur = order.indexOf(s.stage);
    const next = s.stage !== 'cancelled' && cur < order.length - 1 ? W.STAGES[cur + 1] : null;
    const stepper = s.source === 'walkin' ? '' : `<div class="card card-pad" style="box-shadow:none;margin-bottom:14px"><div class="label" style="margin-bottom:10px">${t('Стадия заказа')}</div>
      ${s.stage === 'cancelled' ? W.badge(t('Заказ отменён'), 'bad') : `<div class="stepper">${W.STAGES.map((st, i) => `<div class="step ${i < cur ? 'done' : i === cur ? 'cur' : ''}"><div class="st-dot">${i < cur ? I('check') : i + 1}</div>${t(st.name)}</div>`).join('')}</div>`}</div>`;
    const html = `
      <div class="row" style="gap:8px;margin-bottom:14px">${W.payBadge(s)} ${W.stageBadge(s)} <span class="tag">${t(W.CHANNELS[s.channel])}</span> <span class="tag">${s.source === 'phone' ? t('Заказ по телефону') : t('Продажа на месте')}</span></div>
      ${stepper}
      <div class="grid g-2" style="margin-bottom:14px">
        <div class="card card-pad" style="box-shadow:none"><div class="label">${t('Покупатель')}</div>
          <div style="font-weight:650;margin-top:6px">${esc(W.custName(s))}</div>
          ${c && c.inn ? `<div class="muted" style="font-size:13px">${t('ИНН')}: ${esc(c.inn)}</div>` : ''}
          ${s.name && (!c || s.name !== c.name) ? `<div class="row mt-8" style="font-size:13.5px">${I('user', 'ic-sm')}${esc(s.name)}</div>` : ''}
          ${s.phone ? `<div class="row mt-8" style="font-size:13.5px">${I('phone', 'ic-sm')}<a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a></div>` : ''}
          ${s.address ? `<div class="row mt-8 nw" style="font-size:13.5px;align-items:flex-start">${I('pin', 'ic-sm')}<span>${esc(s.address)}</span></div>` : ''}
        </div>
        <div class="card card-pad" style="box-shadow:none">
          <div class="row" style="justify-content:space-between"><span class="muted">${t('Сумма')}</span><b class="money">${W.money(s.total + (s.discount || 0))}</b></div>
          ${s.discount ? `<div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Скидка')}</span><b class="money">−${W.money(s.discount)}</b></div>` : ''}
          ${ret ? `<div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Возвраты')}</span><b class="money out">−${W.money(ret)}</b></div>` : ''}
          <div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Оплачено')}</span><b class="money in">${W.money(paid)}</b></div>
          <div class="row mt-8" style="justify-content:space-between;font-size:16px"><span>${t('Долг')}</span><b class="money" style="color:${debt ? 'var(--bad)' : 'var(--ok)'}">${W.money(debt)}</b></div>
        </div>
      </div>
      <div class="card" style="box-shadow:none;margin-bottom:14px"><div class="card-head"><h3>${t('Товары')}</h3><div class="right"><span class="sub">${t('{n} позиций', { n: s.items.length })}</span></div></div><div class="card-body flush">
        ${W.table({ cols: [
          { label: t('Наименование'), title: true, render: i => { const p = W.product(i.p) || {}; const rq = W.returnedQty(s, i.p); return `<div class="cell-flex"><div class="thumb">${W.productArt(p)}</div><div style="min-width:0"><div class="cell-main">${esc(p.name)}</div>${rq ? `<div class="cell-sub" style="color:var(--bad)">${t('возвращено {n} шт', { n: W.qty(rq) })}</div>` : ''}</div></div>`; } },
          { label: t('Кол-во'), r: true, render: i => `${W.qty(i.qty)} ${t('шт')}` },
          { label: t('Цена'), r: true, render: i => `<span class="money">${W.money(i.price)}</span>` },
          { label: t('Сумма'), r: true, render: i => `<span class="money">${W.money(i.qty * i.price)}</span>` },
        ], rows: s.items })}</div></div>
      <div class="card" style="box-shadow:none;margin-bottom:14px"><div class="card-head"><h3>${t('Оплаты')}</h3></div><div class="card-body">
        ${pays.length ? pays.map(p => `<div class="list-row"><div class="pi-ic" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:${p.amount < 0 ? 'var(--bad-bg)' : 'var(--ok-bg)'};color:${p.amount < 0 ? 'var(--bad)' : 'var(--ok)'}">${I(p.amount < 0 ? 'undo' : 'check', 'ic-sm')}</div>
          <div class="lr-main"><b>${p.amount < 0 ? t('Возврат денег') : t(W.METHODS[p.method])}</b><span>${W.fmtDT(p.at)} · ${esc(W.shortName(W.userName(p.by)))}${p.method === 'transfer' ? ' · ' + (W.db.bank.some(b => b.ref === s.id && b.status === 'pending' && Math.abs(b.amount - Math.abs(p.amount)) < 1) ? t('ждёт подтверждения') : t('банк')) : ''}</span></div>
          <b class="money ${p.amount < 0 ? 'out' : 'in'}">${p.amount < 0 ? '−' : '+'}${W.money(Math.abs(p.amount))}</b></div>`).join('') : `<div class="muted">${t('Оплат пока не было')}</div>`}
      </div></div>
      ${rets.length ? `<div class="card" style="box-shadow:none;margin-bottom:14px"><div class="card-head"><h3>${t('Возвраты')}</h3></div><div class="card-body">${rets.map(r => `<div class="list-row"><div class="lr-main"><b>${t('Возврат №{n}', { n: W.no(r.no) })} · ${W.money(r.amount)}</b><span>${W.fmtDT(r.at)} · ${esc(r.reason || '')}</span></div></div>`).join('')}</div></div>` : ''}
      ${s.note ? `<div class="card card-pad" style="box-shadow:none;margin-bottom:14px"><div class="label">${t('Комментарий')}</div><div class="mt-8">${esc(s.note)}</div></div>` : ''}
      <div class="card card-pad" style="box-shadow:none"><div class="label" style="margin-bottom:8px">${t('История')}</div>
        ${(s.stageLog || []).map(l => `<div class="row nw" style="font-size:13px;padding:4px 0"><span class="muted nowrap">${W.fmtDT(l.at)}</span><span>${W.stageName(l.stage)}</span><span class="muted ellipsis">${esc(W.shortName(W.userName(l.by)))}</span></div>`).join('')}</div>`;
    const btns = [];
    btns.push(`<div class="left"><button class="btn" data-m="waybill">${I('file')}${t('Накладная')}</button><button class="btn" data-m="invoice">${I('receipt')}${t('Счёт-фактура')}</button></div>`);
    if (!s.shipped && s.stage !== 'cancelled' && !pays.length && (W.allow('sales.create') || W.isDirector())) btns.push(`<button class="btn danger" data-m="cancel">${t('Отменить')}</button>`);
    if (s.shipped && W.allow('sales.return')) btns.push(`<button class="btn" data-m="ret">${I('undo')}${t('Возврат')}</button>`);
    if (debt > 0 && W.allow('sales.pay')) btns.push(`<button class="btn ok" data-m="pay">${I('banknote')}${t('Принять оплату')}</button>`);
    if (next && W.allow('sales.stage')) btns.push(`<button class="btn primary" data-m="next">${I('chevR')}${t('Этап: {s}', { s: t(next.name) })}</button>`);
    const dm = W.drawer({
      title: t('Продажа №{n}', { n: W.no(s.no) }), sub: `${W.fmtDT(s.at)} · ${t('оформил')} ${esc(W.shortName(W.userName(s.by)))}`, icon: 'cart', body: html, foot: btns.join(''),
      actions: {
        waybill: () => W.printDoc(s, 'waybill'),
        invoice: () => W.printDoc(s, 'invoice'),
        pay: (b, mm) => { mm.close(); W.payForm(s); },
        ret: (b, mm) => { mm.close(); W.returnForm(s); },
        next: (b, mm) => {
          const r = W.setStage(s, next.id);
          if (r !== true) return W.toast(t('Нельзя отгрузить без остатка: {n}', { n: r.block.map(x => x.p.name).join(', ') }), 'err');
          W.save(); mm.close(); W.toast(t('Заказ №{n}: {s}', { n: W.no(s.no), s: t(next.name) }));
          setTimeout(() => W.openSale(s.id), 220);
        },
        cancel: async (b, mm) => {
          if (!await W.confirm({ title: t('Отменить заказ №{n}?', { n: W.no(s.no) }), text: t('Заказ останется в истории со статусом «Отменён».'), ok: t('Отменить заказ') })) return;
          W.cancelSale(s); W.save(); mm.close(); W.toast(t('Заказ отменён'), 'info');
        },
      },
    });
    return dm;
  };

  /* ---------- приём оплаты ---------- */
  W.payForm = (s) => {
    const debt = W.saleDebt(s);
    const c = W.customer(s.cust);
    W.modal({
      size: 'sm', title: t('Оплата по продаже №{n}', { n: W.no(s.no) }), sub: `${esc(W.custName(s))} · ${t('долг')} ${W.money(debt)}`, icon: 'banknote', iconCls: 'ok',
      body: `<div class="form-grid" style="grid-template-columns:1fr">
        ${W.fi({ name: 'amount', label: t('Сумма'), money: true, value: debt, req: true, hint: t('Не больше суммы долга') })}
        ${W.fs({ name: 'method', label: t('Способ оплаты'), options: methodOpts(), value: c && c.type === 'legal' ? 'transfer' : 'cash' })}
        <div class="hint">${t('Безналичные поступления попадают в «Банк» и ждут подтверждения бухгалтера.')}</div></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ok" data-m="save">${I('check')}${t('Принять')}</button>`,
      actions: {
        input: (el) => { if (el.name === 'amount' && W.parseNum(el.value) > debt) el.value = W.fmtNum(debt); },
        save: (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          W.addPayment(s, d.method, Math.min(d.amount, debt));
          W.save(); m.close(); W.toast(t('Оплата {a} принята', { a: W.money(Math.min(d.amount, debt)) }));
        },
      },
    });
  };

  /* ---------- возврат ---------- */
  W.returnForm = (s) => {
    const rows = s.items.map(i => ({ ...i, max: W.round(i.qty - W.returnedQty(s, i.p), 3) })).filter(i => i.max > 0);
    if (!rows.length) return W.toast(t('По этой продаже всё уже возвращено'), 'info');
    W.modal({
      size: 'lg', title: t('Возврат по продаже №{n}', { n: W.no(s.no) }), sub: esc(W.custName(s)), icon: 'undo', iconCls: 'bad',
      body: `${W.table({ cls: 'ret-tbl', cols: [
          { label: t('Товар'), title: true, render: i => `<div class="cell-main">${esc((W.product(i.p) || {}).name)}</div><div class="cell-sub">${t('Продано {a} шт по {b}', { a: W.qty(i.qty), b: W.money(i.price) })}</div>` },
          { label: t('Можно вернуть'), r: true, render: i => `${W.qty(i.max)} ${t('шт')}` },
          { label: t('Вернуть, шт'), r: true, render: i => `<input class="inp sm num" style="width:90px" data-ret="${i.p}" data-max="${i.max}" data-price="${i.price}" inputmode="decimal" value="0">` },
        ], rows })}
        <div class="form-grid mt-16">
          ${W.fs({ name: 'method', label: t('Как вернуть деньги'), options: methodOpts() })}
          ${W.fi({ name: 'reason', label: t('Причина возврата'), ph: t('Например: не подошёл оттенок') })}
        </div>
        <div class="row mt-16" style="justify-content:space-between;font-size:16px"><span>${t('Сумма возврата')}</span><b class="money r-sum">${W.money(0)}</b></div>
        <div class="hint mt-8">${t('Товар вернётся на склад канала продажи. Деньги возвращаются только если клиент уже оплатил больше новой суммы продажи — иначе уменьшится долг.')}</div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn danger solid" data-m="save">${I('undo')}${t('Оформить возврат')}</button>`,
      actions: {
        input: (el, m) => {
          if (el.dataset.ret) { const v = W.parseNum(el.value); if (v > +el.dataset.max) el.value = el.dataset.max; if (v < 0) el.value = 0; }
          m.el.querySelector('.r-sum').textContent = W.money(W.sum([...m.el.querySelectorAll('[data-ret]')], x => W.parseNum(x.value) * +x.dataset.price));
        },
        save: (b, m) => {
          const items = [...m.el.querySelectorAll('[data-ret]')].map(x => ({ p: x.dataset.ret, qty: Math.min(+x.dataset.max, W.parseNum(x.value)), price: +x.dataset.price })).filter(i => i.qty > 0);
          if (!items.length) return W.toast(t('Укажите количество к возврату'), 'warn');
          const d = W.form(m.el);
          const r = W.createReturn(s, items, d.method, d.reason);
          W.save(); m.close();
          W.toast(r.refunded > 0 ? t('Возврат №{n}: клиенту выдано {a}', { n: W.no(r.no), a: W.money(r.refunded) }) : t('Возврат №{n} оформлен, долг уменьшен', { n: W.no(r.no) }));
        },
      },
    });
  };

  /* ---------- документы: накладная и счёт-фактура ---------- */
  W.docHTML = (s, kind) => {
    const co = W.db.settings.company, c = W.customer(s.cust) || {};
    if (kind === 'waybill' && !s.waybillNo) { s.waybillNo = W.nextNo('waybill'); W.save(true); }
    if (kind === 'invoice' && !s.invoiceNo) { s.invoiceNo = W.nextNo('invoice'); W.save(true); }
    const no = kind === 'waybill' ? s.waybillNo : s.invoiceNo;
    const date = W.fmtDate(s.shippedAt || s.at);
    const rows = s.items.map((i, n) => ({ n: n + 1, p: W.product(i.p) || {}, qty: i.qty, price: i.price, sum: i.qty * i.price }));
    const total = W.sum(rows, r => r.sum) - (s.discount || 0);
    if (kind === 'waybill') return `<div class="doc">${W.docHead(t('Накладная №{n}', { n: W.no(no) }), t('от {d}', { d: date }))}
      <div class="parties"><div><b>${t('Поставщик')}</b>${esc(co.name)}<br>${esc(co.address)}<br>${t('Тел.')}: ${esc(co.phone)}</div>
        <div><b>${t('Покупатель')}</b>${esc(W.custName(s))}${s.name && s.name !== W.custName(s) ? `<br>${esc(s.name)}` : ''}<br>${t('Тел.')}: ${esc(s.phone || c.phone || '—')}${s.address ? `<br>${esc(s.address)}` : ''}</div></div>
      <table><thead><tr><th style="width:36px">№</th><th>${t('Наименование')}</th><th class="r">${t('Кол-во, шт')}</th><th class="r">${t('Цена за ед.')}</th><th class="r">${t('Сумма')}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r.n}</td><td>${esc(r.p.name)}</td><td class="r">${W.qty(r.qty)}</td><td class="r">${W.money(r.price)}</td><td class="r">${W.money(r.sum)}</td></tr>`).join('')}</tbody></table>
      ${s.discount ? `<div class="total" style="font-weight:500;font-size:13px">${t('Скидка')}: −${W.money(s.discount)}</div>` : ''}
      <div class="total">${t('Итого к оплате')}: ${W.money(total)}</div>
      <div class="signs"><div>${t('Отпустил')}: ____________</div><div>${t('Получил')}: ____________</div></div>
      <div style="margin-top:18px;font-size:11px;color:#777">${t('Продажа №{n}', { n: W.no(s.no) })} · ${t(W.CHANNELS[s.channel])}</div></div>`;
    const vat = 12;
    return `<div class="doc">${W.docHead(t('Счёт-фактура №{n}', { n: W.no(no) }), t('от {d} · к договору поставки', { d: date }))}
      <div class="parties"><div><b>${t('Поставщик')}</b>${esc(co.name)}<br>${t('ИНН')}: ${esc(co.inn)}<br>${esc(co.address)}<br>${t('р/с')} ${esc(co.account)}, ${esc(co.bank)}, ${t('МФО')} ${esc(co.mfo)}<br>${t('Директор')}: ${esc(co.director)}</div>
        <div><b>${t('Покупатель')}</b>${esc(W.custName(s))}<br>${t('ИНН')}: ${esc(c.inn || '—')}<br>${esc(c.address || s.address || '—')}<br>${t('Тел.')}: ${esc(c.phone || s.phone || '—')}</div></div>
      <table><thead><tr><th>№</th><th>${t('Наименование')}</th><th>${t('Ед.')}</th><th class="r">${t('Кол-во')}</th><th class="r">${t('Цена')}</th><th class="r">${t('Стоимость без НДС')}</th><th class="r">${t('НДС')} ${vat}%</th><th class="r">${t('Стоимость с НДС')}</th></tr></thead>
      <tbody>${rows.map(r => { const nds = r.sum * vat / (100 + vat); return `<tr><td>${r.n}</td><td>${esc(r.p.name)}</td><td>${t('шт')}</td><td class="r">${W.qty(r.qty)}</td><td class="r">${W.money(r.price)}</td><td class="r">${W.money(r.sum - nds)}</td><td class="r">${W.money(nds)}</td><td class="r">${W.money(r.sum)}</td></tr>`; }).join('')}</tbody></table>
      <div class="total">${t('Всего с НДС')}: ${W.money(total)}<br><span style="font-weight:500;font-size:13px">${t('в т.ч. НДС')}: ${W.money(total * vat / (100 + vat))}</span></div>
      <div class="signs"><div>${t('Руководитель')}: ____________ ${esc(W.shortName(co.director))}</div><div>${t('Главный бухгалтер')}: ____________</div></div></div>`;
  };
  W.printDoc = (s, kind) => {
    const html = W.docHTML(s, kind);
    W.modal({ size: 'lg', title: kind === 'waybill' ? t('Накладная') : t('Счёт-фактура'), sub: t('Предпросмотр перед печатью'), icon: kind === 'waybill' ? 'file' : 'receipt', body: `<div style="overflow-x:auto">${html}</div>`,
      foot: `<button class="btn" data-m="close">${t('Закрыть')}</button><button class="btn primary" data-m="print">${I('print')}${t('Печать')}</button>`,
      actions: { print: () => W.printHTML(html) } });
  };

  /* ---------- страница ---------- */
  const st = () => W.st('sales', { q: '', period: 'month', method: '', channel: '', stage: '', page: 1 });
  const match = (s, q) => !q || (W.no(s.no) + ' ' + W.custName(s) + ' ' + (s.phone || '') + ' ' + (s.name || '')).toLowerCase().includes(q);

  const listPayments = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const sales = W.by(W.db.sales);
    const rows = W.db.payments.filter(p => W.inRange(p.at, from, to) && (!S.method || p.method === S.method) && match(sales[p.sale] || {}, q)).slice().reverse();
    const pg = W.paged(rows, S.page);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Дата'), title: true, render: p => `<div class="cell-main">${W.fmtDate(p.at)}</div><div class="cell-sub">${W.fmtTime(p.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: p => `<span class="money ${p.amount < 0 ? 'out' : 'in'}">${p.amount < 0 ? '−' : '+'}${W.money(Math.abs(p.amount))}</span>` },
        { label: t('Продажа'), render: p => `<a data-a="openSale" data-id="${p.sale}" href="javascript:void 0">№${W.no((sales[p.sale] || {}).no)}</a>` },
        { label: t('Клиент'), render: p => esc(W.custName(sales[p.sale] || {})) },
        { label: t('Способ'), render: p => p.amount < 0 ? W.badge(t('Возврат денег'), 'bad') : `<span class="tag">${t(W.METHODS[p.method])}</span>` },
        { label: t('Принял'), render: p => esc(W.shortName(W.userName(p.by))) },
      ], rows: pg.rows, empty: W.empty(t('Оплат за период нет'), '', 'banknote'),
      foot: rows.length ? [t('Итого'), `<span class="money">${W.money(W.sum(rows, p => p.amount))}</span>`, '', '', '', ''] : null,
    })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };
  const listReturns = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const sales = W.by(W.db.sales);
    const rows = W.db.returns.filter(r => W.inRange(r.at, from, to) && match(sales[r.sale] || {}, q)).slice().reverse();
    return `<div class="card">${W.table({
      cols: [
        { label: t('Возврат'), title: true, render: r => `<div class="cell-main">№${W.no(r.no)}</div><div class="cell-sub">${W.fmtDT(r.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: r => `<span class="money out">−${W.money(r.amount)}</span>` },
        { label: t('Продажа'), render: r => `<a data-a="openSale" data-id="${r.sale}" href="javascript:void 0">№${W.no((sales[r.sale] || {}).no)}</a>` },
        { label: t('Клиент'), render: r => esc(W.custName(sales[r.sale] || {})) },
        { label: t('Товары'), render: r => r.items.map(i => `${esc((W.product(i.p) || {}).name)} × ${W.qty(i.qty)}`).join('<br>') },
        { label: t('Выдано денег'), r: true, render: r => r.refunded ? `<span class="money">${W.money(r.refunded)}</span>` : `<span class="muted">${t('в счёт долга')}</span>` },
        { label: t('Причина'), render: r => esc(r.reason || '—') },
      ], rows, empty: W.empty(t('Возвратов за период нет'), t('Оформить возврат можно из карточки продажи'), 'undo'),
    })}</div>`;
  };
  const listDebts = () => {
    const S = st(), q = S.q.trim().toLowerCase();
    const rows = W.activeSales().filter(s => W.saleDebt(s) > 0 && match(s, q)).sort((a, b) => a.at < b.at ? -1 : 1);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Продажа'), title: true, render: s => `<div class="cell-main">№${W.no(s.no)} · ${esc(W.custName(s))}</div><div class="cell-sub">${W.fmtDate(s.at)}${s.phone ? ' · ' + esc(s.phone) : ''}</div>` },
        { label: t('Долг'), r: true, aside: true, render: s => `<span class="money" style="color:var(--bad)">${W.money(W.saleDebt(s))}</span>` },
        { label: t('Сумма'), r: true, render: s => `<span class="money">${W.money(W.saleNet(s))}</span>` },
        { label: t('Оплачено'), r: true, render: s => `<span class="money">${W.money(W.salePaid(s))}</span>` },
        { label: t('Дней'), r: true, render: s => { const d = W.daysBetween(s.at, W.today()); return `<span class="badge ${d > 14 ? 'bad' : d > 5 ? 'warn' : ''} plain">${d}</span>`; } },
        { label: t('Стадия'), render: s => W.stageBadge(s) },
        { label: '', cls: 'w-act', render: s => `<div class="act">${W.allow('sales.pay') ? `<button class="go" data-a="pay" data-id="${s.id}" title="${t('Принять оплату')}">${I('banknote')}</button>` : ''}<button data-a="openSale" data-id="${s.id}" title="${t('Открыть')}">${I('eye')}</button></div>` },
      ], rows, rowAttr: s => `class="click" data-a="openSale" data-id="${s.id}"`, empty: W.empty(t('Долгов нет'), t('Все отгрузки оплачены'), 'checkCircle'),
      foot: rows.length ? [t('Итого долг'), `<span class="money" style="color:var(--bad)">${W.money(W.sum(rows, s => W.saleDebt(s)))}</span>`, '', '', '', '', ''] : null,
    })}</div>`;
  };
  const listHistory = () => {
    const S = st(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const rows = W.db.sales.filter(s => W.inRange(s.at, from, to) && (!S.channel || s.channel === S.channel) && (!S.stage || s.stage === S.stage) && match(s, q)).slice().reverse();
    const pg = W.paged(rows, S.page);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Продажа'), title: true, render: s => `<div class="cell-main">№${W.no(s.no)} · ${esc(W.custName(s))}</div><div class="cell-sub">${W.fmtDT(s.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: s => `<span class="money">${W.money(s.total)}</span>` },
        { label: t('Канал'), render: s => `<span class="tag">${t(W.CHANNELS[s.channel])}</span>` },
        { label: t('Позиций'), r: true, render: s => s.items.length },
        { label: t('Оплата'), render: s => W.payBadge(s) },
        { label: t('Стадия'), render: s => W.stageBadge(s) },
      ], rows: pg.rows, rowAttr: s => `class="click" data-a="openSale" data-id="${s.id}"`, empty: W.empty(t('Продаж за период нет'), '', 'cart'),
      foot: rows.length ? [t('Итого: {n} продаж', { n: rows.length }), `<span class="money">${W.money(W.sum(rows.filter(s => s.stage !== 'cancelled'), s => s.total))}</span>`, '', '', '', ''] : null,
    })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };
  const LISTS = { payments: listPayments, returns: listReturns, debts: listDebts, history: listHistory };

  W.page('sales', {
    render(params) {
      const S = st(), tab = LISTS[params.tab] ? params.tab : 'payments';
      const mon = W.month(), act = W.activeSales();
      const monSales = W.sum(act.filter(s => s.at.slice(0, 7) === mon), s => W.saleNet(s));
      const monPaid = W.sum(W.db.payments.filter(p => p.at.slice(0, 7) === mon && p.amount > 0), p => p.amount);
      const monRet = W.sum(W.db.returns.filter(r => r.at.slice(0, 7) === mon), r => r.amount);
      const ST = W.salesStats();
      const filters = [];
      if (tab !== 'debts') filters.push(`<select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select>`);
      if (tab === 'payments') filters.push(`<select class="inp" data-on="method">${W.opts([['', t('Все способы')], ...methodOpts()], S.method)}</select>`);
      if (tab === 'history') {
        filters.push(`<select class="inp" data-on="channel">${W.opts([['', t('Все каналы')], ...chOpts()], S.channel)}</select>`);
        filters.push(`<select class="inp" data-on="stage">${W.opts([['', t('Все стадии')], ...W.STAGES.map(x => [x.id, t(x.name)]), ['cancelled', t('Отменён')]], S.stage)}</select>`);
      }
      return `<div class="page-head"><div><h1>${t('Продажи')}</h1><div class="sub">${t('Оплаты, возвраты, долги по отгрузке и история продаж')}</div></div>
        <div class="actions">${W.allow('sales.create') ? `<button class="btn" data-a="phone">${I('phone')}${t('Заказ по телефону')}</button><button class="btn primary" data-a="new">${I('plus')}${t('Новая продажа')}</button>` : ''}</div></div>
        <div class="kpis">
          ${W.kpi({ label: t('Продажи за месяц'), value: W.moneyKpi(monSales), icon: 'trendUp', foot: t('{n} продаж', { n: ST.monthCount }) })}
          ${W.kpi({ label: t('Получено оплат'), value: W.moneyKpi(monPaid), icon: 'banknote', c: 'c-ok', foot: t('за месяц') })}
          ${W.kpi({ label: t('Долги по отгрузке'), value: W.moneyKpi(ST.debt), icon: 'alert', c: 'c-bad', foot: t('{n} заказов', { n: ST.debtCount }) })}
          ${W.kpi({ label: t('Возвраты'), value: W.moneyKpi(monRet), icon: 'undo', c: 'c-warn', foot: t('за месяц') })}
        </div>
        ${W.tabs([{ id: 'payments', label: t('Оплаты'), icon: 'banknote' }, { id: 'returns', label: t('Возвраты'), icon: 'undo', cnt: W.db.returns.length || null }, { id: 'debts', label: t('Долги по отгрузке'), icon: 'alert', cnt: ST.debtCount || null, hot: true }, { id: 'history', label: t('История'), icon: 'history' }], tab)}
        <div class="toolbar">${W.searchBox(S.q, 'q', t('Клиент, телефон или № продажи'))}<div class="filters">${filters.join('')}</div>
          ${tab === 'payments' && W.allow('sales.pay') ? `<span class="grow"></span><button class="btn" data-a="payPick">${I('banknote')}${t('Принять оплату')}</button>` : ''}
          ${tab === 'returns' && W.allow('sales.return') ? `<span class="grow"></span><button class="btn" data-a="retPick">${I('undo')}${t('Оформить возврат')}</button>` : ''}
          ${tab === 'debts' || tab === 'history' ? `<span class="grow"></span><button class="btn" data-a="csv">${I('download')}${t('Скачать')}</button>` : ''}</div>
        <div data-region="tab">${LISTS[tab]()}</div>`;
    },
    actions: {
      tab: el => { st().page = 1; W.setParams({ tab: el.dataset.v }); },
      q: el => { st().q = el.value; st().page = 1; W.region('tab', LISTS[W.cur.params.tab in LISTS ? W.cur.params.tab : 'payments']()); },
      period: el => { st().period = el.value; st().page = 1; W.refresh(); },
      method: el => { st().method = el.value; W.refresh(); },
      channel: el => { st().channel = el.value; W.refresh(); },
      stage: el => { st().stage = el.value; W.refresh(); },
      more: () => { st().page++; W.refresh(); },
      new: () => W.saleForm({ source: 'walkin' }),
      phone: () => W.saleForm({ source: 'phone' }),
      openSale: el => W.openSale(el.dataset.id),
      pay: el => W.payForm(W.db.sales.find(s => s.id === el.dataset.id)),
      payPick: () => pickSale(W.activeSales().filter(s => W.saleDebt(s) > 0), t('Принять оплату'), s => W.payForm(s), s => `${t('долг')} ${W.money(W.saleDebt(s))}`),
      retPick: () => pickSale(W.db.sales.filter(s => s.shipped && s.items.some(i => i.qty > W.returnedQty(s, i.p))).slice(-150), t('Оформить возврат'), s => W.returnForm(s), s => W.money(s.total)),
      csv: () => {
        const tab = W.cur.params.tab;
        const rows = tab === 'debts' ? W.activeSales().filter(s => W.saleDebt(s) > 0) : W.db.sales.filter(s => { const [f, to] = W.periodRange(st().period); return W.inRange(s.at, f, to); });
        W.downloadCSV(tab === 'debts' ? t('Долги по отгрузке') : t('История продаж'), [t('№'), t('Дата'), t('Канал'), t('Клиент'), t('Телефон'), t('Сумма'), t('Оплачено'), t('Долг'), t('Стадия')],
          rows.map(s => [W.no(s.no), W.fmtDT(s.at), t(W.CHANNELS[s.channel]), W.custName(s), s.phone, W.round(s.total), W.salePaid(s), W.saleDebt(s), W.stageName(s.stage)]));
      },
    },
  });
  // выбор продажи из списка (для оплаты/возврата)
  const pickSale = (list, title, then, sub) => {
    if (!list.length) return W.toast(t('Подходящих продаж нет'), 'info');
    W.modal({ size: 'sm', title, icon: 'cart', body: W.fs({ name: 'sale', label: t('Продажа'), options: list.slice().reverse().map(s => [s.id, `№${W.no(s.no)} · ${W.custName(s)}`, sub(s)]) }),
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="ok">${t('Далее')}${I('chevR')}</button>`,
      actions: { ok: (b, m) => { const s = W.db.sales.find(x => x.id === W.form(m.el).sale); m.close(); setTimeout(() => then(s), 200); } } });
  };
})();
