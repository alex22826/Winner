/* Сотрудники → Зарплата (ТЗ 4.19): начисления, сотрудники, выплаты и отчёты, история изменений */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('salary', { month: W.month(), emp: '', kind: '', seg: 'active', q: '', mode: 'plan', ptype: 'month', year: W.today().slice(0, 4), pmonth: W.month(), quarter: String(Math.floor(new Date().getMonth() / 3) + 1), rlang: 'ru', from: W.today().slice(0, 8) + '01', to: W.today(), lq: '' });
  const KCLS = { salary: 'info', advance: 'vio', bonus: 'ok', overtime: 'warn', deduction: 'bad' };
  const months = () => {
    const set = new Set(W.db.accruals.map(a => a.period).concat(W.db.payouts.map(p => p.period)));
    const d = new Date();
    for (let i = -1; i < 12; i++) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); set.add(W.isoDay(x).slice(0, 7)); }
    return [...set].sort().reverse();
  };
  const emps = (all) => W.db.users.filter(u => all || u.active);
  const roleOf = u => u.roles.length ? u.roles.map(W.roleName).join(', ') : t(u.position || '');

  /* ---------- формы ---------- */
  const accrualForm = (emp) => W.modal({
    title: t('Новое начисление'), sub: t('Зарплата, аванс, премия, сверхурочные или удержание'), icon: 'banknote',
    body: `<div class="form-grid">
      ${W.fs({ name: 'emp', label: t('Сотрудник'), options: emps().map(u => [u.id, u.name, t(u.position || '')]), value: emp || st().emp || '' })}
      ${W.fs({ name: 'kind', label: t('Вид начисления'), options: Object.entries(W.SAL_KINDS).map(([k, v]) => [k, t(v)]), value: 'bonus' })}
      ${W.fs({ name: 'period', label: t('За период'), options: months().map(m => [m, W.monthName(m)]), value: st().month })}
      ${W.fi({ name: 'amount', label: t('Сумма'), money: true, req: true, suffix: W.curLabel() })}
      ${W.fi({ name: 'note', label: t('Комментарий'), cls: 'full', ph: t('Например: премия за план продаж') })}</div>`,
    foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Начислить')}</button>`,
    actions: {
      change: (el, m) => { if (el.name === 'kind' || el.name === 'emp') { const d = W.form(m.el), u = W.db.users.find(x => x.id === d.emp); const a = m.el.querySelector('[name=amount]'); if (u && d.kind === 'salary') a.value = W.fmtNum(u.salary); if (u && d.kind === 'advance') a.value = W.fmtNum(u.advance); } },
      save: (b, m) => { if (!W.validate(m.el)) return; const d = W.form(m.el); W.addAccrual(d); W.save(); m.close(); W.toast(t('Начисление добавлено')); },
    },
  });
  const payForm = (row, period) => W.modal({
    size: 'sm', title: t('Выплата зарплаты'), sub: `${esc(row.u.name)} · ${esc(period.label)}`, icon: 'banknote', iconCls: 'ok',
    body: `<div class="form-grid" style="grid-template-columns:1fr">
      ${W.fs({ name: 'period', label: t('В счёт периода'), options: period.months.slice().reverse().map(m => [m, W.monthName(m)]) })}
      ${W.fi({ name: 'amount', label: t('Сумма'), money: true, value: row.rest, req: true, hint: t('Остаток к выплате: {a}', { a: W.money(row.rest) }) })}
      ${W.fs({ name: 'method', label: t('Способ выплаты'), options: [['cash', t('Наличные')], ['transfer', t('Безналичный расчёт')], ['corp', t('Корпоративная карта')]] })}
      ${W.fi({ name: 'note', label: t('Комментарий'), ph: t('Аванс, зарплата за месяц…') })}</div>`,
    foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn ok" data-m="save">${I('check')}${t('Выплатить')}</button>`,
    actions: { save: (b, m) => { if (!W.validate(m.el)) return; const d = W.form(m.el); W.addPayout({ emp: row.u.id, period: d.period, amount: d.amount, method: d.method, note: d.note }); W.save(); m.close(); W.toast(t('Выплачено {a}', { a: W.money(d.amount) })); } },
  });
  const empHistory = (u) => {
    const ms = months().filter(m => W.db.accruals.some(a => a.emp === u.id && a.period === m) || W.db.payouts.some(p => p.emp === u.id && p.period === m));
    const rows = ms.map(m => Object.assign({ m }, W.salaryRows([m]).find(r => r.u.id === u.id) || {}));
    const ops = [...W.db.accruals.filter(a => a.emp === u.id).map(a => ({ at: a.at, txt: `${t(W.SAL_KINDS[a.kind])} · ${W.monthName(a.period)}`, v: (a.kind === 'deduction' ? -1 : 1) * a.amount, note: a.note, kind: a.kind })),
      ...W.db.payouts.filter(p => p.emp === u.id).map(p => ({ at: p.at, txt: `${t('Выплата')} · ${W.monthName(p.period)}`, v: -p.amount, note: p.note || t(W.METHODS[p.method]), pay: true }))].sort((a, b) => a.at < b.at ? 1 : -1);
    W.drawer({
      title: esc(u.name), sub: `${esc(t(u.position || ''))} · ${t('оклад')} ${W.money(u.salary)}`, icon: 'history',
      body: `<div class="card" style="box-shadow:none;margin-bottom:14px"><div class="card-head"><h3>${t('По месяцам')}</h3></div><div class="card-body flush">${W.table({ cols: [
          { label: t('Период'), title: true, render: r => `<div class="cell-main">${W.monthName(r.m)}</div>` },
          { label: t('Статус'), aside: true, render: r => statusBadge(r.status) },
          { label: t('Начислено'), r: true, render: r => `<span class="money">${W.money(r.accrued || 0)}</span>` },
          { label: t('Выплачено'), r: true, render: r => `<span class="money">${W.money(r.paid || 0)}</span>` },
          { label: t('Остаток'), r: true, render: r => r.over ? `<span class="money" style="color:var(--vio)">−${W.money(r.over)}</span>` : `<span class="money" style="color:${r.rest ? 'var(--bad)' : 'inherit'}">${W.money(r.rest || 0)}</span>` },
        ], rows })}</div></div>
        <div class="card" style="box-shadow:none"><div class="card-head"><h3>${t('Все операции')}</h3></div><div class="card-body">${ops.map(o => `<div class="list-row"><div class="lr-main"><b>${esc(o.txt)}</b><span>${W.fmtDT(o.at)}${o.note ? ' · ' + esc(o.note) : ''}</span></div><b class="money ${o.pay ? 'out' : o.v < 0 ? 'out' : 'in'}">${o.v > 0 ? '+' : '−'}${W.money(Math.abs(o.v))}</b></div>`).join('') || `<div class="muted">${t('Операций нет')}</div>`}</div></div>`,
    });
  };
  const statusBadge = s => ({ paid: W.badge(t('Выплачено'), 'ok'), partial: W.badge(t('Выплачено частично'), 'warn'), unpaid: W.badge(t('Не выплачено'), 'bad'), over: W.badge(t('Переплата'), 'vio'), none: W.badge(t('Нет начислений'), '') }[s] || '');

  /* ---------- период отчёта ---------- */
  const period = () => {
    const S = st();
    if (S.ptype === 'month') return { months: [S.pmonth], label: W.monthName(S.pmonth) };
    if (S.ptype === 'quarter') { const q = +S.quarter; const ms = [1, 2, 3].map(i => `${S.year}-${String((q - 1) * 3 + i).padStart(2, '0')}`); return { months: ms, label: t('{q} квартал {y}', { q, y: S.year }) }; }
    return { months: Array.from({ length: 12 }, (_, i) => `${S.year}-${String(i + 1).padStart(2, '0')}`), label: t('{y} год', { y: S.year }) };
  };
  const planRows = () => {
    const S = st(), q = S.q.trim().toLowerCase();
    return W.salaryRows(period().months).filter(r => r.status !== 'none' && (!q || (r.u.name + ' ' + t(r.u.position || '') + ' ' + roleOf(r.u)).toLowerCase().includes(q)))
      .sort((a, b) => b.rest - a.rest || a.u.name.localeCompare(b.u.name));
  };
  const histRows = () => {
    const S = st(), q = S.q.trim().toLowerCase(), U = W.by(W.db.users);
    return W.db.payouts.filter(p => W.inRange(p.at, S.from, S.to) && (!q || (U[p.emp].name + ' ' + t(U[p.emp].position || '')).toLowerCase().includes(q))).slice().reverse();
  };
  // отчёт на выбранном языке (RU / UZ) — для печати и скачивания
  const report = (kind) => {
    const S = st(), L = S.rlang === 'uz' ? 'uz' : 'ru', T = (s, v) => W.t(s, v, L);
    const P = period();
    if (kind === 'plan') {
      const rows = planRows();
      const head = [T('Период'), T('Сотрудник'), T('Роль'), T('Оклад'), T('Аванс'), T('Премия'), T('Сверхурочные'), T('Удержание'), T('Выплачено'), T('Остаток'), T('Переплата'), T('Статус')];
      const st2 = { paid: T('Выплачено'), partial: T('Выплачено частично'), unpaid: T('Не выплачено'), over: T('Переплата') };
      const body = rows.map(r => [P.label, r.u.name, r.u.roles.length ? r.u.roles.map(x => T((W.ROLES[x] || {}).name)).join(', ') : T(r.u.position || ''), r.salary, r.advance, r.bonus, r.overtime, r.deduction, r.paid, r.rest, r.over, st2[r.status] || '']);
      return { title: T('Ведомость: кому выплатить'), sub: P.label, head, body, totals: ['', T('Итого'), '', W.sum(rows, r => r.salary), W.sum(rows, r => r.advance), W.sum(rows, r => r.bonus), W.sum(rows, r => r.overtime), W.sum(rows, r => r.deduction), W.sum(rows, r => r.paid), W.sum(rows, r => r.rest), W.sum(rows, r => r.over), ''], L };
    }
    const rows = histRows(), U = W.by(W.db.users);
    return { title: T('История выплат'), sub: `${W.fmtDate(S.from)} — ${W.fmtDate(S.to)}`, head: [T('Дата'), T('Сотрудник'), T('Роль'), T('Период'), T('Сумма'), T('Способ'), T('Комментарий')],
      body: rows.map(p => [W.fmtDT(p.at), U[p.emp].name, T(U[p.emp].position || ''), p.period, p.amount, T(W.METHODS[p.method]), p.note || '']), totals: ['', T('Итого'), '', '', W.sum(rows, p => p.amount), '', ''], L };
  };
  const printReport = (kind) => {
    const r = report(kind), num = v => typeof v === 'number' ? W.fmtNum(v) : esc(v);
    W.printHTML(`<div class="doc">${W.docHead(r.title, r.sub, r.L)}<table style="font-size:11px"><thead><tr>${r.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${r.body.map(row => `<tr>${row.map(v => `<td class="${typeof v === 'number' ? 'r' : ''}">${num(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      <tfoot><tr>${r.totals.map(v => `<td class="${typeof v === 'number' ? 'r' : ''}"><b>${num(v)}</b></td>`).join('')}</tr></tfoot></table>
      <div class="signs"><div>${W.t('Директор', null, r.L)}: ____________</div><div>${W.t('Главный бухгалтер', null, r.L)}: ____________</div></div></div>`);
  };

  /* ---------- вкладки ---------- */
  const tabAccruals = () => {
    const S = st(), canE = W.allow('salary.edit');
    const rows = W.db.accruals.filter(a => a.period === S.month && (!S.emp || a.emp === S.emp) && (!S.kind || a.kind === S.kind)).slice().reverse();
    const sumK = k => W.sum(W.db.accruals.filter(a => a.period === S.month && a.kind === k), a => a.amount);
    const U = W.by(W.db.users);
    return `<div class="kpis k5">${Object.entries(W.SAL_KINDS).map(([k, v], i) => W.kpi({ label: t(v), value: W.moneyKpi(sumK(k)), icon: ['banknote', 'clock', 'trendUp', 'calendar', 'minus'][i], c: ['', 'c-vio', 'c-ok', 'c-warn', 'c-bad'][i], foot: W.monthName(S.month) })).join('')}</div>
      <div class="toolbar"><div class="filters">
        <select class="inp" data-on="month">${W.opts(months().map(m => [m, W.monthName(m)]), S.month)}</select>
        <select class="inp" data-on="emp">${W.opts([['', t('Все сотрудники')], ...emps(true).map(u => [u.id, u.name])], S.emp)}</select>
        <select class="inp" data-on="kind">${W.opts([['', t('Все виды')], ...Object.entries(W.SAL_KINDS).map(([k, v]) => [k, t(v)])], S.kind)}</select></div>
        <span class="grow"></span>${canE ? `<button class="btn" data-a="bulk">${I('layers')}${t('Начислить оклады и авансы')}</button>` : ''}</div>
      <div class="card">${W.table({ cols: [
        { label: t('Сотрудник'), title: true, render: a => `<div class="cell-flex"><div class="avatar sm" style="--av:${W.avatarBg(U[a.emp].name)}">${W.initials(U[a.emp].name)}</div><div style="min-width:0"><div class="cell-main">${esc(U[a.emp].name)}</div><div class="cell-sub">${esc(t(U[a.emp].position || ''))}</div></div></div>` },
        { label: t('Сумма'), r: true, aside: true, render: a => `<span class="money ${a.kind === 'deduction' ? 'out' : ''}">${a.kind === 'deduction' ? '−' : ''}${W.money(a.amount)}</span>` },
        { label: t('Вид'), render: a => W.badge(t(W.SAL_KINDS[a.kind]), KCLS[a.kind]) },
        { label: t('Дата'), render: a => W.fmtDate(a.at) },
        { label: t('Комментарий'), render: a => esc(a.note || '—') },
        { label: t('Кто внёс'), render: a => esc(W.shortName(W.userName(a.by))) },
        { label: '', cls: 'w-act', render: a => canE ? W.actBtns(a.id, { edit: false }) : '' },
      ], rows, empty: W.empty(t('Начислений за месяц нет'), canE ? t('Нажмите «Начислить оклады и авансы»') : '', 'banknote') })}</div>`;
  };
  const tabStaff = () => {
    const S = st(), q = S.q.trim().toLowerCase(), canE = W.allow('salary.edit');
    const act = W.db.users.filter(u => u.active), arc = W.db.users.filter(u => !u.active);
    const rows = (S.seg === 'active' ? act : arc).filter(u => !q || (u.name + ' ' + t(u.position || '')).toLowerCase().includes(q));
    return `<div class="kpis k3">
        ${W.kpi({ label: t('Сотрудников'), value: act.length, icon: 'users' })}
        ${W.kpi({ label: t('Фонд окладов (в месяц)'), value: W.moneyKpi(W.sum(act, u => u.salary)), icon: 'coins', c: 'c-ok' })}
        ${W.kpi({ label: t('Без оклада'), value: act.filter(u => !u.salary).length, icon: 'alert', c: 'c-warn' })}</div>
      <div class="toolbar">${W.seg([{ id: 'active', label: t('Активные'), cnt: act.length }, { id: 'archive', label: t('Архив'), cnt: arc.length }], S.seg, 'seg')}${W.searchBox(S.q, 'q', t('Имя или должность'))}
        <span class="grow"></span>${canE ? `<button class="btn" data-a="accrue">${I('banknote')}${t('Создать начисление')}</button><button class="btn primary" data-a="addEmp">${I('userPlus')}${t('Добавить сотрудника')}</button>` : ''}</div>
      <div class="card" data-region="list">${staffTable(rows, canE)}</div>`;
  };
  const staffTable = (rows, canE) => W.table({ cols: [
    { label: t('Сотрудник'), title: true, render: u => `<div class="cell-flex"><div class="avatar sm" style="--av:${W.avatarBg(u.name)}">${W.initials(u.name)}</div><div style="min-width:0"><div class="cell-main">${esc(u.name)}</div><div class="cell-sub">${esc(u.phone || '')}</div></div></div>` },
    { label: t('Оклад'), r: true, aside: true, render: u => u.salary ? `<span class="money">${W.money(u.salary)}</span>` : W.badge(t('Без оклада'), 'warn') },
    { label: t('Должность'), render: u => esc(t(u.position || '—')) },
    { label: t('Роли'), render: u => u.roles.length ? `<div class="tags">${u.roles.map(r => `<span class="tag brand">${W.roleName(r)}</span>`).join('')}</div>` : `<span class="muted">${t('нет доступа в программу')}</span>` },
    { label: t('Аванс'), r: true, render: u => `<span class="money">${W.money(u.advance)}</span>` },
    { label: '', cls: 'w-act', render: u => `<div class="act"><button data-a="hist" data-id="${u.id}" title="${t('История зарплаты')}">${I('history')}</button>${canE ? `<button data-a="editEmp" data-id="${u.id}" title="${t('Изменить')}">${I('edit')}</button>` : ''}</div>` },
  ], rows, empty: W.empty(t('Сотрудники не найдены'), '', 'users') });
  const tabPayouts = () => {
    const S = st(), P = period(), canE = W.allow('salary.edit');
    const years = [...new Set(W.db.accruals.map(a => a.period.slice(0, 4)).concat([W.today().slice(0, 4)]))].sort().reverse();
    let kp = '', body = '';
    if (S.mode === 'plan') {
      const rows = planRows();
      kp = `<div class="kpis k5">
        ${W.kpi({ label: t('Сотрудников в отчёте'), value: rows.length, icon: 'users' })}
        ${W.kpi({ label: t('Зарплата'), value: W.moneyKpi(W.sum(rows, r => r.accrued)), icon: 'banknote', foot: t('начислено за {p}', { p: P.label }) })}
        ${W.kpi({ label: t('Выплачено всего'), value: W.moneyKpi(W.sum(rows, r => r.paid)), icon: 'checkCircle', c: 'c-ok' })}
        ${W.kpi({ label: t('Остаток к выплате'), value: W.moneyKpi(W.sum(rows, r => r.rest)), icon: 'clock', c: 'c-bad', hero: true })}
        ${W.kpi({ label: t('Переплата'), value: W.moneyKpi(W.sum(rows, r => r.over)), icon: 'alert', c: 'c-vio' })}</div>`;
      body = W.table({ cols: [
        { label: t('Сотрудник'), title: true, render: r => `<div class="cell-main">${esc(r.u.name)}</div><div class="cell-sub">${esc(roleOf(r.u))} · ${esc(P.label)}</div>` },
        { label: t('Статус'), aside: true, render: r => statusBadge(r.status) },
        { label: t('Оклад'), r: true, render: r => W.money(r.salary) },
        { label: t('Аванс'), r: true, render: r => W.money(r.advance) },
        { label: t('Премия'), r: true, render: r => r.bonus ? W.money(r.bonus) : '—' },
        { label: t('Сверхурочные'), r: true, render: r => r.overtime ? W.money(r.overtime) : '—' },
        { label: t('Удержание'), r: true, render: r => r.deduction ? `<span style="color:var(--bad)">−${W.money(r.deduction)}</span>` : '—' },
        { label: t('Выплачено'), r: true, render: r => `<span class="money in">${W.money(r.paid)}</span>` },
        { label: t('Остаток'), r: true, render: r => `<span class="money" style="color:${r.rest ? 'var(--bad)' : 'inherit'}">${W.money(r.rest)}</span>` },
        { label: t('Переплата'), r: true, render: r => r.over ? `<span class="money" style="color:var(--vio)">${W.money(r.over)}</span>` : '—' },
        { label: '', cls: 'w-act', render: r => `<div class="act">${canE && r.rest > 0 ? `<button class="go" data-a="pay" data-id="${r.u.id}" title="${t('Выплатить')}">${I('banknote')}</button>` : ''}<button data-a="hist" data-id="${r.u.id}" title="${t('История зарплаты')}">${I('history')}</button></div>` },
      ], rows, empty: W.empty(t('За период начислений нет'), '', 'banknote') });
    } else {
      const rows = histRows(), U = W.by(W.db.users);
      kp = `<div class="kpis k3">${W.kpi({ label: t('Выплат'), value: rows.length, icon: 'list' })}${W.kpi({ label: t('Выплачено всего'), value: W.moneyKpi(W.sum(rows, p => p.amount)), icon: 'checkCircle', c: 'c-ok' })}${W.kpi({ label: t('Сотрудников'), value: new Set(rows.map(p => p.emp)).size, icon: 'users', c: 'c-vio' })}</div>`;
      body = W.table({ cols: [
        { label: t('Сотрудник'), title: true, render: p => `<div class="cell-main">${esc(U[p.emp].name)}</div><div class="cell-sub">${W.fmtDT(p.at)}</div>` },
        { label: t('Сумма'), r: true, aside: true, render: p => `<span class="money">${W.money(p.amount)}</span>` },
        { label: t('Роль'), render: p => esc(roleOf(U[p.emp])) },
        { label: t('Период'), render: p => W.monthName(p.period) },
        { label: t('Способ'), render: p => `<span class="tag">${t(W.METHODS[p.method])}</span>` },
        { label: t('Комментарий'), render: p => esc(p.note || '—') },
      ], rows, empty: W.empty(t('Выплат за даты нет'), '', 'banknote'), foot: rows.length ? [t('Итого'), `<span class="money">${W.money(W.sum(rows, p => p.amount))}</span>`, '', '', '', ''] : null });
    }
    return `<div class="toolbar">${W.seg([{ id: 'plan', label: t('Кому выплатить') }, { id: 'hist', label: t('История выплат') }], S.mode, 'mode')}
        <div class="filters">${S.mode === 'plan' ? `
          <select class="inp" data-on="ptype">${W.opts([['month', t('За месяц')], ['quarter', t('За квартал')], ['year', t('За год')]], S.ptype)}</select>
          ${S.ptype === 'month' ? `<select class="inp" data-on="pmonth">${W.opts(months().map(m => [m, W.monthName(m)]), S.pmonth)}</select>` : `<select class="inp" data-on="year">${W.opts(years.map(y => [y, y]), S.year)}</select>`}
          ${S.ptype === 'quarter' ? `<select class="inp" data-on="quarter">${W.opts([1, 2, 3, 4].map(q => [String(q), t('{q} квартал', { q })]), S.quarter)}</select>` : ''}`
          : `<input class="inp" type="date" data-change="from" value="${S.from}" aria-label="${t('С даты')}"><input class="inp" type="date" data-change="to" value="${S.to}" aria-label="${t('По дату')}">`}</div>
        ${W.searchBox(S.q, 'q', t('Имя или должность'))}</div>
      <div class="toolbar"><span class="muted" style="font-size:13px">${t('Язык отчёта')}:</span>${W.seg([{ id: 'ru', label: 'RU' }, { id: 'uz', label: 'UZ' }], S.rlang, 'rlang')}<span class="grow"></span>
        <button class="btn" data-a="print">${I('print')}${t('Печать')}</button><button class="btn primary" data-a="csv">${I('download')}${t('Скачать отчёт')}</button></div>
      ${kp}<div class="card">${body}</div>`;
  };
  const tabLog = () => {
    const S = st(), q = S.lq.trim().toLowerCase();
    const rows = W.db.salaryLog.filter(l => !q || [l.target, l.change, W.userName(l.by)].join(' ').toLowerCase().includes(q)).slice().reverse();
    const ACT = { create: [t('Создано'), 'ok'], edit: [t('Изменено'), 'warn'], delete: [t('Удалено'), 'bad'], archive: [t('В архив'), ''], restore: [t('Восстановлено'), 'info'] };
    const DOC = { accrual: t('Начисление'), payout: t('Выплата'), employee: t('Сотрудник') };
    return `<div class="toolbar"><div class="inp-wrap search">${I('search')}<input class="inp" type="search" data-on="lq" value="${esc(S.lq)}" placeholder="${t('Сотрудник, изменение или автор')}"></div><span class="grow"></span><span class="badge plain">${I('lock', 'ic-sm')} ${t('Только для чтения')}</span></div>
      <div class="card" data-region="log">${W.table({ cols: [
        { label: t('Когда'), title: true, render: l => `<div class="cell-main">${W.fmtDT(l.at)}</div>` },
        { label: t('Действие'), aside: true, render: l => W.badge((ACT[l.action] || [l.action])[0], (ACT[l.action] || [])[1]) },
        { label: t('Документ'), render: l => DOC[l.doc] || l.doc },
        { label: t('Сотрудник / подразделение'), render: l => esc(t(l.target)) },
        { label: t('Что изменилось'), render: l => esc(W.tx(l.change)) },
        { label: t('Кто внёс'), render: l => esc(W.shortName(W.userName(l.by))) },
      ], rows: rows.slice(0, 200), empty: W.empty(t('Журнал пуст'), '', 'history') })}</div>`;
  };

  const TABS = { accruals: tabAccruals, staff: tabStaff, payouts: tabPayouts, log: tabLog };
  W.page('salary', {
    render(params) {
      const tab = TABS[params.tab] ? params.tab : 'accruals';
      const rest = W.sum(W.salaryRows([W.month()]), r => r.rest);
      return `<div class="page-head"><div><h1>${t('Зарплата')}</h1><div class="sub">${t('Начисления, выплаты и ведомости. К выплате за {m}: {a}', { m: W.monthName(W.month()).toLowerCase(), a: W.money(rest) })}</div></div>
        <div class="actions">${W.allow('salary.edit') ? `<button class="btn primary" data-a="accrue">${I('plus')}${t('Новое начисление')}</button>` : ''}</div></div>
        ${W.tabs([{ id: 'accruals', label: t('Начисления'), icon: 'banknote' }, { id: 'staff', label: t('Сотрудники'), icon: 'users' }, { id: 'payouts', label: t('Выплаты и отчёты'), icon: 'report' }, { id: 'log', label: t('История изменений'), icon: 'history' }], tab)}
        <div data-region="tab">${TABS[tab]()}</div>`;
    },
    actions: {
      tab: el => W.setParams({ tab: el.dataset.v }),
      accrue: () => accrualForm(),
      month: el => { st().month = el.value; W.refresh(); },
      emp: el => { st().emp = el.value; W.refresh(); },
      kind: el => { st().kind = el.value; W.refresh(); },
      seg: el => { st().seg = el.dataset.v; W.swap(); },
      q: el => {
        st().q = el.value;
        if ((W.cur.params.tab || '') === 'staff') { const S = st(), q = S.q.trim().toLowerCase(); W.region('list', staffTable((S.seg === 'active' ? W.db.users.filter(u => u.active) : W.db.users.filter(u => !u.active)).filter(u => !q || (u.name + ' ' + t(u.position || '')).toLowerCase().includes(q)), W.allow('salary.edit'))); }
        else W.refresh();
      },
      lq: el => { st().lq = el.value; W.refresh(); },
      mode: el => { st().mode = el.dataset.v; W.swap(); },
      ptype: el => { st().ptype = el.value; W.refresh(); },
      pmonth: el => { st().pmonth = el.value; W.refresh(); },
      year: el => { st().year = el.value; W.refresh(); },
      quarter: el => { st().quarter = el.value; W.refresh(); },
      from: el => { st().from = el.value; W.refresh(); },
      to: el => { st().to = el.value; W.refresh(); },
      rlang: el => { st().rlang = el.dataset.v; W.refresh(); W.toast(el.dataset.v === 'uz' ? 'Hisobot tili: oʻzbekcha' : 'Язык отчёта: русский', 'info'); },
      print: () => printReport(st().mode),
      csv: () => { const r = report(st().mode); W.downloadCSV(`${r.title} — ${r.sub}`, r.head, [...r.body, r.totals]); },
      pay: el => { const r = W.salaryRows(period().months).find(x => x.u.id === el.dataset.id); payForm(r, period()); },
      hist: el => empHistory(W.db.users.find(u => u.id === el.dataset.id)),
      addEmp: () => W.employeeForm(null, { salaryOnly: !W.isDirector() }),
      editEmp: el => W.employeeForm(W.db.users.find(u => u.id === el.dataset.id), { salaryOnly: !W.isDirector() }),
      del: async el => {
        const a = W.db.accruals.find(x => x.id === el.dataset.id);
        if (!await W.confirm({ title: t('Удалить начисление?'), text: `${esc(W.userName(a.emp))} · ${t(W.SAL_KINDS[a.kind])} · ${W.money(a.amount)}` })) return;
        W.db.accruals = W.db.accruals.filter(x => x.id !== a.id);
        W.slog('delete', 'accrual', W.userName(a.emp), `${t(W.SAL_KINDS[a.kind])}: ${W.money(a.amount)} (${a.period})`);
        W.save(); W.toast(t('Начисление удалено'));
      },
      bulk: async () => {
        const m = st().month;
        const list = emps().filter(u => u.salary > 0 && !W.db.accruals.some(a => a.emp === u.id && a.period === m && a.kind === 'salary'));
        if (!list.length) return W.toast(t('Оклады за {m} уже начислены всем', { m: W.monthName(m) }), 'info');
        if (!await W.confirm({ title: t('Начислить оклады за {m}?', { m: W.monthName(m) }), text: t('Оклад и аванс будут начислены {n} сотрудникам на сумму {a}.', { n: list.length, a: W.money(W.sum(list, u => u.salary)) }), ok: t('Начислить'), danger: false, icon: 'banknote' })) return;
        list.forEach(u => {
          W.db.accruals.push({ id: W.uid('ac'), at: W.now(), emp: u.id, period: m, kind: 'salary', amount: u.salary, note: '', by: W.me().id });
          if (u.advance) W.db.accruals.push({ id: W.uid('ac'), at: W.now(), emp: u.id, period: m, kind: 'advance', amount: u.advance, note: '', by: W.me().id });
        });
        W.slog('create', 'accrual', 'Все сотрудники', `${t('Оклады и авансы за')} ${W.monthName(m)}: ${list.length}`);
        W.save(); W.toast(t('Начислено сотрудникам: {n}', { n: list.length }));
      },
    },
  });
})();
