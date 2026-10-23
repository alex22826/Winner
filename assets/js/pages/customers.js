/* Продажи → Контрагенты (ТЗ 4.2) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('customers', { q: '', type: '', seg: 'all' });
  const typeOpts = () => Object.entries(W.CUST_TYPES).map(([k, v]) => [k, t(v)]);
  const stats = c => {
    const ss = W.activeSales().filter(s => s.cust === c.id);
    return { n: ss.length, sum: W.sum(ss, s => W.saleNet(s)), debt: W.sum(ss, s => W.saleDebt(s)), last: ss.length ? ss[ss.length - 1].at : null };
  };

  W.customerForm = (c, after) => {
    const isNew = !c;
    c = c || { type: 'legal', regular: false };
    W.modal({
      title: isNew ? t('Новый контрагент') : t('Редактировать контрагента'), sub: isNew ? t('Клиент появится в списке при оформлении продажи') : esc(c.name), icon: 'briefcase',
      body: `<div class="form-grid">
        ${W.fi({ name: 'name', label: t('Наименование'), value: c.name || '', req: true, cls: 'full', ph: t('ООО «…» или ФИО') })}
        ${W.fs({ name: 'type', label: t('Тип контрагента'), options: typeOpts(), value: c.type })}
        ${W.fi({ name: 'inn', label: t('ИНН'), value: c.inn || '', ph: '000 000 000' })}
        ${W.fi({ name: 'contact', label: t('Директор или контактное лицо'), value: c.contact || '', icon: 'user' })}
        ${W.fi({ name: 'phone', label: t('Телефон'), value: c.phone || '', type: 'tel', ph: '+998', icon: 'phone', req: true })}
        ${W.fi({ name: 'address', label: t('Адрес'), value: c.address || '', icon: 'pin', cls: 'full' })}
        ${W.fta({ name: 'note', label: t('Заметка'), value: c.note || '', cls: 'full' })}
        <div class="full">${W.fsw({ name: 'regular', label: t('Постоянный клиент'), checked: c.regular })}</div></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Сохранить')}</button>`,
      actions: {
        save: (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          const dup = W.db.customers.find(x => x.id !== c.id && d.inn && x.inn && x.inn.replace(/\D/g, '') === d.inn.replace(/\D/g, ''));
          if (dup) return W.toast(t('Контрагент с таким ИНН уже есть: {n}', { n: dup.name }), 'warn');
          if (isNew) { c = Object.assign({ id: W.uid('k'), created: W.today() }, d); W.db.customers.push(c); }
          else Object.assign(c, d);
          W.save(); m.close(); W.toast(isNew ? t('Контрагент добавлен') : t('Изменения сохранены'));
          after && after(c);
        },
      },
    });
  };

  W.openCustomer = (id) => {
    const c = W.customer(id); if (!c) return;
    const s = stats(c);
    const sales = W.db.sales.filter(x => x.cust === c.id).slice().reverse();
    W.drawer({
      title: esc(c.name), sub: `${t(W.CUST_TYPES[c.type])}${c.regular ? ' · ' + t('постоянный клиент') : ''}`, icon: 'briefcase',
      body: `<div class="kpis k3" style="margin-bottom:14px">
          ${W.kpi({ label: t('Заказов'), value: s.n, icon: 'cart' })}
          ${W.kpi({ label: t('Сумма покупок'), value: W.moneyKpi(s.sum), icon: 'trendUp', c: 'c-ok' })}
          ${W.kpi({ label: t('Долг'), value: W.moneyKpi(s.debt), icon: 'alert', c: s.debt ? 'c-bad' : '' })}</div>
        <div class="card card-pad" style="box-shadow:none;margin-bottom:14px"><dl class="p-meta" style="display:grid;grid-template-columns:auto 1fr;gap:10px 16px;margin:0;font-size:14px">
          <dt class="muted">${t('ИНН')}</dt><dd style="margin:0">${esc(c.inn || '—')}</dd>
          <dt class="muted">${t('Контакт')}</dt><dd style="margin:0">${esc(c.contact || '—')}</dd>
          <dt class="muted">${t('Телефон')}</dt><dd style="margin:0">${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>` : '—'}</dd>
          <dt class="muted">${t('Адрес')}</dt><dd style="margin:0">${esc(c.address || '—')}</dd>
          ${c.note ? `<dt class="muted">${t('Заметка')}</dt><dd style="margin:0">${esc(c.note)}</dd>` : ''}</dl></div>
        <div class="card" style="box-shadow:none"><div class="card-head"><h3>${t('Заказы клиента')}</h3></div><div class="card-body flush">
        ${W.table({ cols: [
          { label: t('Продажа'), title: true, render: x => `<div class="cell-main">№${W.no(x.no)}</div><div class="cell-sub">${W.fmtDate(x.at)}</div>` },
          { label: t('Сумма'), r: true, aside: true, render: x => `<span class="money">${W.money(x.total)}</span>` },
          { label: t('Оплата'), render: x => W.payBadge(x) },
          { label: t('Стадия'), render: x => W.stageBadge(x) },
        ], rows: sales.slice(0, 30), rowAttr: x => `class="click" data-m="sale" data-id="${x.id}"`, empty: W.empty(t('Заказов пока нет'), '', 'cart') })}</div></div>`,
      foot: `${W.allow('customers.edit') ? `<button class="btn" data-m="edit">${I('edit')}${t('Изменить')}</button>` : ''}${W.allow('sales.create') ? `<button class="btn primary" data-m="order">${I('phone')}${t('Новый заказ')}</button>` : ''}`,
      actions: {
        sale: (b, m) => { m.close(); setTimeout(() => W.openSale(b.dataset.id), 200); },
        edit: (b, m) => { m.close(); W.customerForm(c); },
        order: (b, m) => { m.close(); const f = W.saleForm({ source: 'phone' }); const sel = f.el.querySelector('[name=cust]'); sel.value = c.id; sel.dispatchEvent(new Event('change', { bubbles: true })); },
      },
    });
  };

  const list = () => {
    const S = st(), q = S.q.trim().toLowerCase();
    const rows = W.db.customers.filter(c => (!S.type || c.type === S.type) && (S.seg !== 'regular' || c.regular) && (S.seg !== 'debt' || stats(c).debt > 0)
      && (!q || [c.name, c.inn, c.phone, c.contact, c.address].join(' ').toLowerCase().includes(q)))
      .map(c => ({ c, s: stats(c) })).sort((a, b) => b.s.sum - a.s.sum);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Наименование'), title: true, render: r => `<div class="cell-flex"><div class="avatar sm" style="--av:${W.avatarBg(r.c.name)}">${W.initials(r.c.name.replace(/^(ООО|ИП|ЧП|АО|OOO)\s*/i, '').replace(/[«»"]/g, ''))}</div><div style="min-width:0"><div class="cell-main">${esc(r.c.name)} ${r.c.regular ? `<span title="${t('Постоянный клиент')}" style="color:var(--c-yellow)">★</span>` : ''}</div><div class="cell-sub">${t(W.CUST_TYPES[r.c.type])}${r.c.inn ? ' · ' + t('ИНН') + ' ' + esc(r.c.inn) : ''}</div></div></div>` },
        { label: t('Долг'), r: true, aside: true, render: r => r.s.debt ? `<span class="money" style="color:var(--bad)">${W.money(r.s.debt)}</span>` : `<span class="muted">—</span>` },
        { label: t('Контакт'), render: r => `<div>${esc(r.c.contact || '—')}</div><div class="cell-sub">${esc(r.c.phone || '')}</div>` },
        { label: t('Адрес'), render: r => `<span class="t2" style="font-size:13px">${esc(r.c.address || '—')}</span>` },
        { label: t('Заказов'), r: true, render: r => r.s.n },
        { label: t('Сумма покупок'), r: true, render: r => `<span class="money">${W.money(r.s.sum)}</span>` },
        { label: '', cls: 'w-act', render: r => W.allow('customers.edit') ? W.actBtns(r.c.id, { del: W.isDirector() }) : '' },
      ], rows, rowAttr: r => `class="click" data-a="open" data-id="${r.c.id}"`,
      empty: W.empty(t('Никого не нашли'), t('Измените условия поиска или добавьте нового контрагента'), 'briefcase'),
    })}</div>`;
  };

  W.page('customers', {
    render() {
      const S = st();
      return `<div class="page-head"><div><h1>${t('Контрагенты')}</h1><div class="sub">${t('База клиентов: постоянные покупатели, организации и частные лица')}</div></div>
        <div class="actions">${W.allow('customers.edit') ? `<button class="btn primary" data-a="add">${I('plus')}${t('Добавить контрагента')}</button>` : ''}</div></div>
        <div class="toolbar">${W.searchBox(S.q, 'q', t('Название, ИНН, телефон или контакт'))}
          <div class="filters">${W.seg([{ id: 'all', label: t('Все') }, { id: 'regular', label: t('Постоянные') }, { id: 'debt', label: t('С долгом') }], S.seg, 'seg')}
          <select class="inp" data-on="type">${W.opts([['', t('Все типы')], ...typeOpts()], S.type)}</select></div></div>
        <div data-region="list">${list()}</div>`;
    },
    actions: {
      q: el => { st().q = el.value; W.region('list', list()); },
      type: el => { st().type = el.value; W.region('list', list()); },
      seg: el => { st().seg = el.dataset.v; W.swap(); },
      add: () => W.customerForm(),
      open: (el, e) => { if (e.target.closest('.act')) return; W.openCustomer(el.dataset.id); },
      edit: el => W.customerForm(W.customer(el.dataset.id)),
      del: async el => {
        const c = W.customer(el.dataset.id);
        if (W.db.sales.some(s => s.cust === c.id)) return W.toast(t('Нельзя удалить: у контрагента есть продажи'), 'warn');
        if (!await W.confirm({ title: t('Удалить контрагента?'), text: esc(c.name) })) return;
        W.db.customers = W.db.customers.filter(x => x.id !== c.id); W.save(); W.toast(t('Контрагент удалён'));
      },
    },
  });
})();
