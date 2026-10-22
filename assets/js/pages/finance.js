/* Финансы: Расход (ТЗ 4.13), Касса (4.14), Банк (4.15) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const methodOpts = () => Object.entries(W.METHODS).map(([k, v]) => [k, t(v)]);
  const KIND = { sale: W.N('Оплата продажи'), expense: W.N('Расход'), return: W.N('Возврат клиенту'), purchase: W.N('Оплата поставщику'), salary: W.N('Зарплата'), manual: W.N('Ручная операция'), transfer: W.N('Перевод между счетами') };

  /* ============================== РАСХОД ============================== */
  const est = () => W.st('expense', { q: '', period: 'month', cat: '', method: '', page: 1 });
  W.expenseForm = () => {
    const cats = W.db.settings.expenseCats;
    W.modal({
      title: t('Новый расход'), sub: t('Списание из кассы или с расчётного счёта'), icon: 'receipt', iconCls: 'bad',
      body: `<div class="form-grid">
        ${W.fs({ name: 'cat', label: t('Категория'), options: [...cats.map(c => [c, t(c)]), ['__new', '＋ ' + t('Новая категория')]] })}
        ${W.fi({ name: 'newCat', label: t('Название категории'), cls: 'hidden nc' })}
        ${W.fi({ name: 'date', label: t('Дата'), type: 'date', value: W.today() })}
        ${W.fi({ name: 'desc', label: t('Описание'), cls: 'full', ph: t('На что потрачено'), req: true })}
        ${W.fi({ name: 'amount', label: t('Сумма'), money: true, req: true, suffix: W.curLabel() })}
        ${W.fs({ name: 'method', label: t('Откуда списать'), options: methodOpts(), value: 'cash' })}
        <div class="full hint">${t('Безналичный расход попадёт в «Банк» и будет ждать подтверждения бухгалтера.')}</div></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Записать расход')}</button>`,
      actions: {
        change: (el, m) => { if (el.name === 'cat') m.el.querySelector('.nc').classList.toggle('hidden', el.value !== '__new'); },
        save: (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          let cat = d.cat;
          if (cat === '__new') { if (!d.newCat) return W.toast(t('Введите название категории'), 'warn'); cat = d.newCat; if (!cats.includes(cat)) cats.push(cat); }
          const time = d.date === W.today() ? W.now().slice(11) : '12:00';
          W.addExpense({ at: `${d.date}T${time}`, cat, desc: d.desc, amount: d.amount, method: d.method });
          W.save(); m.close(); W.toast(t('Расход {a} записан', { a: W.money(d.amount) }));
        },
      },
    });
  };
  const expList = () => {
    const S = est(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const rows = W.db.expenses.filter(e => W.inRange(e.at, from, to) && (!S.cat || e.cat === S.cat) && (!S.method || e.method === S.method) && (!q || (e.desc + ' ' + t(e.cat)).toLowerCase().includes(q))).slice().reverse();
    const pg = W.paged(rows, S.page);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Описание'), title: true, render: e => `<div class="cell-main">${esc(W.tx(e.desc) || t(e.cat))}</div><div class="cell-sub">${W.fmtDT(e.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: e => `<span class="money out">−${W.money(e.amount)}</span>` },
        { label: t('Категория'), render: e => `<span class="tag">${esc(t(e.cat))}</span>` },
        { label: t('Способ'), render: e => t(W.METHODS[e.method]) },
        { label: t('Кто внёс'), render: e => esc(W.shortName(W.userName(e.by))) },
        { label: '', cls: 'w-act', render: e => W.isDirector() ? W.actBtns(e.id, { edit: false }) : '' },
      ], rows: pg.rows, empty: W.empty(t('Расходов за период нет'), '', 'receipt'),
      foot: rows.length ? [t('Итого'), `<span class="money out">−${W.money(W.sum(rows, e => e.amount))}</span>`, '', '', '', ''] : null,
    })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };
  W.page('expense', {
    render() {
      const S = est(), E = W.db.expenses, td = W.today(), mon = W.month(), wk = W.weekStart();
      const monE = E.filter(e => e.at.slice(0, 7) === mon);
      const byCat = {};
      monE.forEach(e => { byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
      const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: t(c), v }));
      return `<div class="page-head"><div><h1>${t('Расход')}</h1><div class="sub">${t('Все расходы компании по категориям')}</div></div>
        <div class="actions">${W.allow('finance.edit') ? `<button class="btn primary" data-a="add">${I('plus')}${t('Добавить расход')}</button>` : ''}</div></div>
        <div class="kpis">
          ${W.kpi({ label: t('Всего расхода'), value: W.moneyKpi(W.sum(E, e => e.amount)), icon: 'receipt', c: 'c-bad', hero: true, foot: t('{n} записей', { n: E.length }) })}
          ${W.kpi({ label: t('Расход за месяц'), value: W.moneyKpi(W.sum(monE, e => e.amount)), icon: 'calendar', c: 'c-warn', foot: W.monthName(mon) })}
          ${W.kpi({ label: t('Расход за неделю'), value: W.moneyKpi(W.sum(E.filter(e => e.at.slice(0, 10) >= wk), e => e.amount)), icon: 'clock', c: 'c-vio' })}
          ${W.kpi({ label: t('Расход за сегодня'), value: W.moneyKpi(W.sum(E.filter(e => e.at.slice(0, 10) === td), e => e.amount)), icon: 'trendDown' })}
        </div>
        <div class="grid g-main" style="align-items:start">
          <div>
            <div class="toolbar">${W.searchBox(S.q, 'q', t('Поиск по описанию'))}<div class="filters">
              <select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select>
              <select class="inp" data-on="cat">${W.opts([['', t('Все категории')], ...W.db.settings.expenseCats.map(c => [c, t(c)])], S.cat)}</select></div></div>
            <div data-region="list">${expList()}</div>
          </div>
          <div class="card"><div class="card-head"><div><h3>${t('Структура расходов')}</h3><div class="sub">${W.monthName(mon)}</div></div></div>
            <div class="card-body">${cats.length ? W.hbars(cats, { color: 'var(--s2)' }) : W.empty(t('В этом месяце расходов нет'))}</div></div>
        </div>`;
    },
    actions: {
      add: () => W.expenseForm(),
      q: el => { est().q = el.value; W.region('list', expList()); },
      period: el => { est().period = el.value; est().page = 1; W.region('list', expList()); },
      cat: el => { est().cat = el.value; W.region('list', expList()); },
      more: () => { est().page++; W.region('list', expList()); },
      del: async el => {
        const e = W.db.expenses.find(x => x.id === el.dataset.id);
        if (!await W.confirm({ title: t('Удалить расход?'), text: `${esc(e.desc)} · ${W.money(e.amount)}. ${t('Связанная операция в кассе тоже удалится.')}` })) return;
        W.removeExpense(e); W.save(); W.toast(t('Расход удалён'));
      },
    },
  });

  /* ============================== КАССА ============================== */
  const cst = () => W.st('cash', { acc: '', period: 'month', q: '', page: 1 });
  const cashForm = (dir) => W.modal({
    size: 'sm', title: dir > 0 ? t('Приход в кассу') : t('Расход из кассы'), icon: dir > 0 ? 'arrIn' : 'arrOut', iconCls: dir > 0 ? 'ok' : 'bad',
    body: `<div class="form-grid" style="grid-template-columns:1fr">
      ${W.fs({ name: 'acc', label: t('Счёт'), options: [...Object.entries(W.ACCOUNTS).map(([k, v]) => [k, t(v)]), ['transfer', t('Безналичный расчёт')]] })}
      ${W.fi({ name: 'amount', label: t('Сумма'), money: true, req: true, suffix: W.curLabel() })}
      ${W.fi({ name: 'note', label: t('Основание'), req: true, ph: dir > 0 ? t('Например: взнос учредителя') : t('Например: выдано под отчёт') })}</div>`,
    foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ${dir > 0 ? 'ok' : 'danger solid'}" data-m="save">${I('check')}${t('Провести')}</button>`,
    actions: { save: (b, m) => { if (!W.validate(m.el)) return; const d = W.form(m.el); W.cashOp({ acc: d.acc, dir, amount: d.amount, note: d.note }); W.save(); m.close(); W.toast(t('Операция проведена')); } },
  });
  const transferForm = () => W.modal({
    size: 'sm', title: t('Перевод между счетами'), sub: t('Например, инкассация наличных на расчётный счёт'), icon: 'swap',
    body: `<div class="form-grid" style="grid-template-columns:1fr">
      ${W.fs({ name: 'from', label: t('Откуда'), options: methodOpts(), value: 'cash' })}
      ${W.fs({ name: 'to', label: t('Куда'), options: methodOpts(), value: 'transfer' })}
      ${W.fi({ name: 'amount', label: t('Сумма'), money: true, req: true, suffix: W.curLabel() })}
      ${W.fi({ name: 'note', label: t('Комментарий') })}</div>`,
    foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('swap')}${t('Перевести')}</button>`,
    actions: {
      save: (b, m) => {
        if (!W.validate(m.el)) return;
        const d = W.form(m.el);
        if (d.from === d.to) return W.toast(t('Выберите разные счета'), 'warn');
        const bal = d.from === 'transfer' ? W.bankBal() : W.cashBal(d.from);
        if (d.amount > bal) return W.toast(t('На счёте «{a}» только {b}', { a: t(W.METHODS[d.from]), b: W.money(bal) }), 'warn');
        W.cashTransfer(d); W.save(); m.close(); W.toast(t('Перевод выполнен'));
      },
    },
  });
  const cashList = () => {
    const S = cst(), [from, to] = W.periodRange(S.period), q = S.q.trim().toLowerCase();
    const rows = W.db.cash.filter(c => (!S.acc || c.acc === S.acc) && W.inRange(c.at, from, to) && (!q || (c.note || '').toLowerCase().includes(q))).slice().reverse();
    const pg = W.paged(rows, S.page);
    return `<div class="card">${W.table({
      cols: [
        { label: t('Операция'), title: true, render: c => `<div class="cell-main">${esc(W.tx(c.note) || t(KIND[c.kind]))}</div><div class="cell-sub">${W.fmtDT(c.at)} · ${t(KIND[c.kind] || c.kind)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: c => `<span class="money ${c.dir > 0 ? 'in' : 'out'}">${c.dir > 0 ? '+' : '−'}${W.money(c.amount)}</span>` },
        { label: t('Счёт'), render: c => `<span class="tag">${t(W.ACCOUNTS[c.acc])}</span>` },
        { label: t('Кто провёл'), render: c => esc(W.shortName(W.userName(c.by))) },
      ], rows: pg.rows, empty: W.empty(t('Операций за период нет'), '', 'wallet'),
      foot: rows.length ? [t('Оборот за период'), `<span class="money">${W.money(W.sum(rows, c => c.dir * c.amount), { sign: true })}</span>`, '', ''] : null,
    })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };
  W.page('cash', {
    render() {
      const S = cst();
      const cash = W.cashBal('cash'), card = W.cashBal('card'), corp = W.cashBal('corp'), bank = W.bankBal();
      const ed = W.allow('finance.edit');
      return `<div class="page-head"><div><h1>${t('Касса')}</h1><div class="sub">${t('Остатки денег по всем счетам компании')}</div></div>
        <div class="actions">${ed ? `<button class="btn" data-a="in">${I('arrIn')}${t('Приход')}</button><button class="btn" data-a="out">${I('arrOut')}${t('Расход')}</button><button class="btn primary" data-a="tr">${I('swap')}${t('Перевод')}</button>` : ''}</div></div>
        <div class="kpis k5">
          ${W.kpi({ label: t('Общий остаток'), value: W.moneyKpi(cash + card + corp + bank), icon: 'coins', hero: true, foot: t('все счета вместе') })}
          ${W.kpi({ label: t('Наличные'), value: W.moneyKpi(cash), icon: 'banknote', c: 'c-ok', link: 'cash', foot: t('в кассе') })}
          ${W.kpi({ label: t('Карта'), value: W.moneyKpi(card), icon: 'card', foot: t('терминал магазина') })}
          ${W.kpi({ label: t('Корпоративная карта'), value: W.moneyKpi(corp), icon: 'card', c: 'c-vio' })}
          ${W.kpi({ label: t('Безналичный расчёт'), value: W.moneyKpi(bank), icon: 'bank', c: 'c-warn', link: 'bank', foot: t('подтверждённый остаток в банке') })}
        </div>
        <div class="toolbar">${W.seg([{ id: '', label: t('Все счета') }, ...Object.entries(W.ACCOUNTS).map(([k, v]) => ({ id: k, label: t(v) }))], S.acc, 'acc')}
          <div class="filters"><select class="inp" data-on="period">${W.opts(W.periodOpts(), S.period)}</select></div>${W.searchBox(S.q, 'q', t('Поиск по основанию'))}</div>
        <div data-region="list">${cashList()}</div>`;
    },
    actions: {
      in: () => cashForm(1), out: () => cashForm(-1), tr: () => transferForm(),
      acc: el => { cst().acc = el.dataset.v; cst().page = 1; W.refresh(); },
      period: el => { cst().period = el.value; cst().page = 1; W.region('list', cashList()); },
      q: el => { cst().q = el.value; W.region('list', cashList()); },
      more: () => { cst().page++; W.region('list', cashList()); },
    },
  });

  /* ============================== БАНК ============================== */
  const bst = () => W.st('bank', { q: '', from: '', to: '', status: '', party: '', editing: null, sel: [], page: 1 });
  const FIELD = { at: W.N('Дата'), dir: W.N('Тип'), desc: W.N('Описание'), party: W.N('Контрагент'), num: W.N('Номер'), amount: W.N('Сумма') };
  const fmtField = (k, v) => k === 'amount' ? W.money(+v) : k === 'dir' ? (+v > 0 ? t('Поступление') : t('Списание')) : k === 'at' ? W.fmtDT(v) : (v || '—');
  const statusBadge = b => b.status === 'confirmed' ? W.badge(t('Подтверждено'), 'ok') : W.badge(t('Ожидает подтверждения'), 'warn');
  const bankForm = () => W.modal({
    title: t('Новая банковская операция'), sub: t('Операция появится со статусом «Ожидает подтверждения»'), icon: 'bank',
    body: `<div class="form-grid">
      ${W.fs({ name: 'dir', label: t('Тип операции'), options: [['1', t('Поступление')], ['-1', t('Списание')]] })}
      ${W.fi({ name: 'date', label: t('Дата'), type: 'date', value: W.today() })}
      ${W.fi({ name: 'desc', label: t('Описание'), req: true, cls: 'full', ph: t('Назначение платежа') })}
      ${W.fi({ name: 'party', label: t('Контрагент'), attrs: 'list="bank-parties"' })}
      ${W.fi({ name: 'num', label: t('Номер документа') })}
      ${W.fi({ name: 'amount', label: t('Сумма'), money: true, req: true, suffix: W.curLabel(), cls: 'full' })}</div>
      <datalist id="bank-parties">${[...new Set(W.db.bank.map(b => b.party).filter(Boolean))].map(p => `<option value="${esc(p)}">`).join('')}</datalist>`,
    foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Добавить')}</button>`,
    actions: { save: (b, m) => { if (!W.validate(m.el)) return; const d = W.form(m.el); W.addBankOp({ dir: +d.dir, at: `${d.date}T${W.now().slice(11)}`, desc: d.desc, party: d.party, num: d.num, amount: d.amount }); W.save(); m.close(); W.toast(t('Операция добавлена')); } },
  });
  const bankRows = (tab) => {
    const S = bst(), q = S.q.trim().toLowerCase();
    return W.db.bank.filter(b => (tab !== 'in' || b.dir > 0) && (tab !== 'out' || b.dir < 0) && (tab !== 'pending' || b.status === 'pending')
      && W.inRange(b.at, S.from || null, S.to || null) && (!S.status || b.status === S.status) && (!S.party || b.party === S.party)
      && (!q || [b.desc, b.party, b.num].join(' ').toLowerCase().includes(q))).slice().reverse();
  };
  const bankList = (tab) => {
    const S = bst(), canC = W.allow('bank.confirm'), canE = W.allow('finance.edit');
    if (tab === 'history') {
      const ev = [];
      W.db.bank.forEach(b => (b.log || []).forEach(l => ev.push({ b, l })));
      ev.sort((a, b) => a.l.at < b.l.at ? 1 : -1);
      const q = S.q.trim().toLowerCase();
      const rows = ev.filter(e => !q || [e.b.desc, e.b.party, e.b.num].join(' ').toLowerCase().includes(q));
      const pg = W.paged(rows, S.page);
      const act = { create: [t('Создана'), ''], edit: [t('Изменена'), 'warn'], confirm: [t('Подтверждена'), 'ok'] };
      return `<div class="card">${W.table({ cols: [
        { label: t('Когда'), title: true, render: e => `<div class="cell-main">${W.fmtDT(e.l.at)}</div><div class="cell-sub">${esc(W.shortName(W.userName(e.l.by)))}</div>` },
        { label: t('Действие'), aside: true, render: e => W.badge(act[e.l.act][0], act[e.l.act][1]) },
        { label: t('Операция'), render: e => `${esc(W.tx(e.b.desc))}<div class="cell-sub">${esc(W.tx(e.b.party) || '')} ${e.b.num ? '· №' + esc(e.b.num) : ''}</div>` },
        { label: t('Что изменилось'), render: e => e.l.act === 'edit' ? `${t(FIELD[e.l.field])}: <s class="muted">${esc(fmtField(e.l.field, e.l.from))}</s> → <b>${esc(fmtField(e.l.field, e.l.to))}</b>` : e.l.act === 'confirm' ? t('Статус: ожидает → подтверждено') : `<span class="money">${e.b.dir > 0 ? '+' : '−'}${W.money(e.b.amount)}</span>` },
      ], rows: pg.rows, empty: W.empty(t('История пуста'), '', 'history') })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
    }
    const rows = bankRows(tab), pg = W.paged(rows, S.page);
    const selectable = canC && rows.some(b => b.status === 'pending');
    return `${selectable && S.sel.length ? `<div class="savebar" style="position:static;margin:0 0 12px">${I('checkCircle')}<span>${t('Выбрано операций: {n}', { n: S.sel.length })} · ${W.money(W.sum(W.db.bank.filter(b => S.sel.includes(b.id)), b => b.dir * b.amount), { sign: true })}</span><span class="spacer"></span><button class="btn sm ghost" style="color:#fff" data-a="selNone">${t('Снять выбор')}</button><button class="btn sm ok" data-a="confirmSel">${I('check')}${t('Подтвердить выбранные')}</button></div>` : ''}
    <div class="card">${W.table({
      cols: [
        ...(selectable ? [{ label: `<input type="checkbox" data-a="selAll" ${S.sel.length && S.sel.length === rows.filter(b => b.status === 'pending').length ? 'checked' : ''} aria-label="${t('Выбрать все')}">`, cls: 'no-label', w: '36px', render: b => b.status === 'pending' ? `<input type="checkbox" data-a="sel" data-id="${b.id}" ${S.sel.includes(b.id) ? 'checked' : ''} aria-label="${t('Выбрать')}">` : '' }] : []),
        { label: t('Дата и время'), title: true, render: b => S.editing === b.id ? `<input class="inp sm" type="datetime-local" name="at" value="${b.at}">` : `<div class="cell-main">${W.fmtDate(b.at)}</div><div class="cell-sub">${W.fmtTime(b.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: b => S.editing === b.id ? `<input class="inp sm num" name="amount" data-money inputmode="decimal" value="${W.fmtNum(b.amount, 2)}" style="width:140px">` : `<span class="money ${b.dir > 0 ? 'in' : 'out'}">${b.dir > 0 ? '+' : '−'}${W.money(b.amount)}</span>` },
        { label: t('Тип'), render: b => S.editing === b.id ? `<select class="inp sm" name="dir">${W.opts([['1', t('Поступление')], ['-1', t('Списание')]], String(b.dir))}</select>` : (b.dir > 0 ? `<span class="row nw" style="gap:6px;color:var(--ok)">${I('arrIn', 'ic-sm')}${t('Поступление')}</span>` : `<span class="row nw" style="gap:6px;color:var(--bad)">${I('arrOut', 'ic-sm')}${t('Списание')}</span>`) },
        { label: t('Описание'), render: b => S.editing === b.id ? `<input class="inp sm" name="desc" value="${esc(b.desc)}">` : `<span style="font-size:13.5px">${esc(W.tx(b.desc))}</span>${b.log && b.log.some(l => l.act === 'edit') ? ` <span class="tag" title="${t('Есть изменения в истории')}">${I('history', 'ic-sm')}</span>` : ''}` },
        { label: t('Контрагент'), render: b => S.editing === b.id ? `<input class="inp sm" name="party" value="${esc(b.party)}">` : esc(W.tx(b.party) || '—') },
        { label: t('Номер'), render: b => S.editing === b.id ? `<input class="inp sm" name="num" value="${esc(b.num)}" style="width:90px">` : (b.num ? '№' + esc(b.num) : '—') },
        { label: t('Статус'), render: b => statusBadge(b) },
        { label: '', cls: 'w-act', render: b => S.editing === b.id
          ? `<div class="act"><button class="go" data-a="saveEdit" data-id="${b.id}" title="${t('Сохранить')}">${I('check')}</button><button data-a="cancelEdit" title="${t('Отмена')}">${I('x')}</button></div>`
          : `<div class="act">${canE ? `<button data-a="edit" data-id="${b.id}" title="${t('Изменить')}">${I('edit')}</button>` : ''}${canC && b.status === 'pending' ? `<button class="go" data-a="confirm" data-id="${b.id}" title="${t('Подтвердить')}">${I('checkCircle')}</button>` : ''}</div>` },
      ], rows: pg.rows, rowAttr: b => S.editing === b.id ? 'class="editing"' : '',
      empty: W.empty(tab === 'pending' ? t('Все операции подтверждены') : t('Операций не найдено'), '', tab === 'pending' ? 'checkCircle' : 'bank'),
    })}${W.moreBtn(pg.more, pg.total, pg.rows.length)}</div>`;
  };
  W.page('bank', {
    render(params) {
      const S = bst(), tab = ['all', 'in', 'out', 'pending', 'history'].includes(params.tab) ? params.tab : 'all';
      const B = W.db.bank, pend = B.filter(b => b.status === 'pending');
      const parties = [...new Set(B.map(b => b.party).filter(Boolean))].sort();
      return `<div class="page-head"><div><h1>${t('Банк')}</h1><div class="sub">${t('Расчётный счёт: {a}', { a: esc(W.db.settings.company.account) })} · ${esc(W.db.settings.company.bank)}</div></div>
        <div class="actions">${W.allow('finance.edit') ? `<button class="btn primary" data-a="add">${I('plus')}${t('Новая операция')}</button>` : ''}</div></div>
        <div class="kpis">
          ${W.kpi({ label: t('Текущий остаток'), value: W.moneyKpi(W.bankBal()), icon: 'bank', hero: true, foot: t('по подтверждённым операциям') })}
          ${W.kpi({ label: t('Всего поступлений'), value: W.moneyKpi(W.sum(B.filter(b => b.dir > 0 && b.status === 'confirmed'), b => b.amount)), icon: 'arrIn', c: 'c-ok' })}
          ${W.kpi({ label: t('Всего списаний'), value: W.moneyKpi(W.sum(B.filter(b => b.dir < 0 && b.status === 'confirmed'), b => b.amount)), icon: 'arrOut', c: 'c-bad' })}
          ${W.kpi({ label: t('Ожидает подтверждения'), value: pend.length, small: t('операций'), icon: 'clock', c: 'c-warn', foot: W.money(W.sum(pend, b => b.dir * b.amount), { sign: true }) })}
        </div>
        ${W.allow('bank.confirm') && pend.length ? `<div class="card card-pad mb-16" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:var(--warn-bg);border-color:transparent;box-shadow:none">
          <div class="kpi-ic c-warn" style="background:rgba(255,255,255,.6)">${I('shieldCheck')}</div><div style="flex:1;min-width:220px"><b>${t('Проверьте операции в Didox и Дибанк')}</b><div class="t2" style="font-size:13.5px">${t('Интеграции нет — данные вносятся вручную. После проверки подтвердите операцию кнопкой ✓, статус сменится на «Подтверждено».')}</div></div>
          ${tab !== 'pending' ? `<button class="btn" data-a="tab" data-v="pending">${t('Показать ожидающие')}</button>` : ''}</div>` : ''}
        ${W.tabs([{ id: 'all', label: t('Все операции') }, { id: 'in', label: t('Поступления') }, { id: 'out', label: t('Списания') }, { id: 'pending', label: t('Ожидают подтверждения'), cnt: pend.length || null, hot: true }, { id: 'history', label: t('История') }], tab)}
        <div class="toolbar">${W.searchBox(S.q, 'q', t('Описание, контрагент или номер'))}
          ${tab !== 'history' ? `<div class="filters">
            <input class="inp" type="date" data-change="from" value="${S.from}" title="${t('С даты')}" aria-label="${t('С даты')}">
            <input class="inp" type="date" data-change="to" value="${S.to}" title="${t('По дату')}" aria-label="${t('По дату')}">
            ${tab !== 'pending' ? `<select class="inp" data-on="status">${W.opts([['', t('Все статусы')], ['confirmed', t('Подтверждено')], ['pending', t('Ожидает подтверждения')]], S.status)}</select>` : ''}
            <select class="inp" data-on="party">${W.opts([['', t('Все контрагенты')], ...parties.map(p => [p, W.tx(p)])], S.party)}</select>
            ${S.from || S.to || S.status || S.party ? `<button class="btn ghost" data-a="reset">${I('x', 'ic-sm')}${t('Сбросить')}</button>` : ''}</div>` : ''}</div>
        <div data-region="tab">${bankList(tab)}</div>`;
    },
    actions: {
      tab: el => { Object.assign(bst(), { page: 1, sel: [], editing: null }); W.setParams({ tab: el.dataset.v }); },
      q: el => { bst().q = el.value; bst().page = 1; W.region('tab', bankList(W.cur.params.tab || 'all')); },
      from: el => { bst().from = el.value; W.refresh(); },
      to: el => { bst().to = el.value; W.refresh(); },
      status: el => { bst().status = el.value; W.refresh(); },
      party: el => { bst().party = el.value; W.refresh(); },
      reset: () => { Object.assign(bst(), { from: '', to: '', status: '', party: '' }); W.refresh(); },
      more: () => { bst().page++; W.refresh(); },
      add: () => bankForm(),
      edit: el => { bst().editing = el.dataset.id; W.refresh(); },
      cancelEdit: () => { bst().editing = null; W.refresh(); },
      saveEdit: el => {
        const b = W.db.bank.find(x => x.id === el.dataset.id), tr = el.closest('tr');
        const v = n => tr.querySelector(`[name=${n}]`).value;
        const amount = W.parseNum(v('amount'));
        if (!(amount > 0)) return W.toast(t('Сумма должна быть больше нуля'), 'warn');
        W.editBankOp(b, { at: v('at') || b.at, dir: +v('dir'), desc: v('desc').trim(), party: v('party').trim(), num: v('num').trim(), amount });
        bst().editing = null; W.save(); W.toast(t('Изменения записаны в историю'));
      },
      confirm: el => { const b = W.db.bank.find(x => x.id === el.dataset.id); W.confirmBank(b); bst().sel = bst().sel.filter(i => i !== b.id); W.save(); W.toast(t('Операция подтверждена')); },
      sel: el => { const S = bst(); S.sel = el.checked ? [...S.sel, el.dataset.id] : S.sel.filter(i => i !== el.dataset.id); W.refresh(); },
      selAll: el => { bst().sel = el.checked ? bankRows(W.cur.params.tab || 'all').filter(b => b.status === 'pending').map(b => b.id) : []; W.refresh(); },
      selNone: () => { bst().sel = []; W.refresh(); },
      confirmSel: async () => {
        const S = bst(), ops = W.db.bank.filter(b => S.sel.includes(b.id) && b.status === 'pending');
        if (!await W.confirm({ title: t('Подтвердить {n} операций?', { n: ops.length }), text: t('Убедитесь, что они отражены в Didox и Дибанк.'), ok: t('Подтвердить'), danger: false, icon: 'shieldCheck' })) return;
        ops.forEach(W.confirmBank); S.sel = []; W.save(); W.toast(t('Подтверждено операций: {n}', { n: ops.length }));
      },
    },
  });
})();
