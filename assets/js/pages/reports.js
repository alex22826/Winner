/* Обзор → Отчёты (ТЗ 4.8): просмотр, печать и выгрузка в Excel (CSV) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('reports', { rep: 'sales', period: 'month', from: '', to: '' });
  const M = n => ({ v: n, money: true });
  const Q = n => ({ v: n, qty: true });

  const REPORTS = [
    { id: 'sales', icon: 'cart', page: 'sales', title: W.N('Продажи за период'), desc: W.N('Все продажи с оплатами и долгами'), build: (f, to) => {
      const rows = W.db.sales.filter(s => s.stage !== 'cancelled' && W.inRange(s.at, f, to));
      return { head: [t('№'), t('Дата'), t('Канал'), t('Клиент'), t('Сумма'), t('Оплачено'), t('Долг')],
        rows: rows.map(s => [W.no(s.no), W.fmtDT(s.at), t(W.CHANNELS[s.channel]), W.custName(s), M(W.saleNet(s)), M(W.salePaid(s)), M(W.saleDebt(s))]),
        foot: [t('Итого'), '', '', t('{n} продаж', { n: rows.length }), M(W.sum(rows, s => W.saleNet(s))), M(W.sum(rows, s => W.salePaid(s))), M(W.sum(rows, s => W.saleDebt(s)))] };
    } },
    { id: 'products', icon: 'grid', page: 'sales', title: W.N('Продажи по товарам'), desc: W.N('Сколько продано каждой позиции'), build: (f, to) => {
      const agg = {};
      W.db.sales.filter(s => s.stage !== 'cancelled' && W.inRange(s.at, f, to)).forEach(s => s.items.forEach(i => { const a = agg[i.p] || (agg[i.p] = { q: 0, s: 0 }); a.q += i.qty; a.s += i.qty * i.price; }));
      const total = W.sum(Object.values(agg), a => a.s) || 1;
      const rows = Object.entries(agg).sort((a, b) => b[1].s - a[1].s);
      return { head: [t('Товар'), t('Категория'), t('Продано, шт'), t('Сумма'), t('Доля')],
        rows: rows.map(([p, a]) => [(W.product(p) || {}).name, W.catName((W.product(p) || {}).cat), Q(a.q), M(a.s), W.fmtNum(a.s / total * 100, 1) + '%']),
        foot: [t('Итого'), '', Q(W.sum(rows, r => r[1].q)), M(W.sum(rows, r => r[1].s)), '100%'] };
    } },
    { id: 'channels', icon: 'layers', page: 'sales', title: W.N('Каналы продаж'), desc: W.N('Магазин, склад и производство'), build: (f, to) => {
      const ss = W.db.sales.filter(s => s.stage !== 'cancelled' && W.inRange(s.at, f, to));
      const rows = Object.keys(W.CHANNELS).map(c => { const x = ss.filter(s => s.channel === c), sum = W.sum(x, s => W.saleNet(s)); return [t(W.CHANNELS[c]), x.length, M(sum), M(x.length ? sum / x.length : 0), M(W.sum(x, s => W.saleDebt(s)))]; });
      return { head: [t('Канал'), t('Продаж'), t('Сумма'), t('Средний чек'), t('Долг')], rows, foot: [t('Итого'), ss.length, M(W.sum(ss, s => W.saleNet(s))), M(ss.length ? W.sum(ss, s => W.saleNet(s)) / ss.length : 0), M(W.sum(ss, s => W.saleDebt(s)))] };
    } },
    { id: 'debts', icon: 'alert', page: 'sales', noPeriod: true, title: W.N('Долги клиентов'), desc: W.N('Кто и сколько должен по отгрузкам'), build: () => {
      const by = {};
      W.activeSales().filter(s => W.saleDebt(s) > 0).forEach(s => { const k = W.custName(s); const a = by[k] || (by[k] = { n: 0, d: 0, old: s.at, phone: s.phone }); a.n++; a.d += W.saleDebt(s); if (s.at < a.old) a.old = s.at; });
      const rows = Object.entries(by).sort((a, b) => b[1].d - a[1].d);
      return { head: [t('Клиент'), t('Телефон'), t('Заказов с долгом'), t('Самый старый, дней'), t('Сумма долга')],
        rows: rows.map(([k, a]) => [k, a.phone || '', a.n, W.daysBetween(a.old, W.today()), M(a.d)]), foot: [t('Итого'), '', W.sum(rows, r => r[1].n), '', M(W.sum(rows, r => r[1].d))] };
    } },
    { id: 'stock', icon: 'warehouse', page: 'warehouse', noPeriod: true, title: W.N('Остатки на складах'), desc: W.N('Готовая продукция по складам'), build: () => {
      const ps = W.db.products.filter(p => !p.archived);
      return { head: [t('Товар'), t(W.WH.prod), t(W.WH.main), t(W.WH.shop), t('Всего'), t('Стоимость')],
        rows: ps.map(p => [p.name, Q(W.stock('p', p.id, 'prod')), Q(W.stock('p', p.id, 'main')), Q(W.stock('p', p.id, 'shop')), Q(W.stock('p', p.id)), M(Math.max(0, W.stock('p', p.id)) * p.price)]),
        foot: [t('Итого'), '', '', '', Q(W.sum(ps, p => W.stock('p', p.id))), M(W.sum(ps, p => Math.max(0, W.stock('p', p.id)) * p.price))] };
    } },
    { id: 'raw', icon: 'flask', page: 'production', noPeriod: true, title: W.N('Сырьё и потребность'), desc: W.N('Остаток, страховой порог и что закупить'), build: () => {
      const rows = W.rawNeeds();
      const S = { ok: t('Хватает'), low: t('Ниже порога'), short: t('Не хватает') };
      return { head: [t('Сырьё'), t('Ед.'), t('Под заказы'), t('Страховой порог'), t('Остаток'), t('Потребность'), t('Статус'), t('Сумма закупки')],
        rows: rows.map(r => [r.m.name, t(r.m.unit), Q(r.forOrders), Q(r.safety), Q(r.stock), Q(r.toBuy), S[r.status], M(r.toBuy * r.m.price)]), foot: [t('Итого'), '', '', '', '', '', '', M(W.sum(rows, r => r.toBuy * r.m.price))] };
    } },
    { id: 'production', icon: 'factory', page: 'production', title: W.N('Выпуск продукции'), desc: W.N('Сколько и чего выпущено, себестоимость'), build: (f, to) => {
      const agg = {};
      W.db.prodOrders.filter(o => o.status === 'done' && W.inRange(o.doneAt || o.at, f, to)).forEach(o => { const a = agg[o.p] || (agg[o.p] = { n: 0, q: 0, c: 0 }); a.n++; a.q += o.qty; a.c += o.cost || 0; });
      const rows = Object.entries(agg).sort((a, b) => b[1].q - a[1].q);
      return { head: [t('Продукция'), t('Документов'), t('Выпущено, шт'), t('Себестоимость')], rows: rows.map(([p, a]) => [(W.product(p) || {}).name, a.n, Q(a.q), M(a.c)]),
        foot: [t('Итого'), W.sum(rows, r => r[1].n), Q(W.sum(rows, r => r[1].q)), M(W.sum(rows, r => r[1].c))] };
    } },
    { id: 'expenses', icon: 'receipt', page: 'expense', title: W.N('Расходы по категориям'), desc: W.N('Структура расходов за период'), build: (f, to) => {
      const agg = {};
      W.db.expenses.filter(e => W.inRange(e.at, f, to)).forEach(e => { const a = agg[e.cat] || (agg[e.cat] = { n: 0, s: 0 }); a.n++; a.s += e.amount; });
      const rows = Object.entries(agg).sort((a, b) => b[1].s - a[1].s), total = W.sum(rows, r => r[1].s) || 1;
      return { head: [t('Категория'), t('Записей'), t('Сумма'), t('Доля')], rows: rows.map(([c, a]) => [t(c), a.n, M(a.s), W.fmtNum(a.s / total * 100, 1) + '%']), foot: [t('Итого'), W.sum(rows, r => r[1].n), M(W.sum(rows, r => r[1].s)), '100%'] };
    } },
    { id: 'money', icon: 'wallet', page: 'cash', title: W.N('Движение денег'), desc: W.N('Касса, карты и расчётный счёт'), build: (f, to) => {
      const acc = [['cash', W.METHODS.cash], ['card', W.METHODS.card], ['corp', W.METHODS.corp]];
      const line = (name, list) => { const before = W.sum(list.filter(x => f && x.at.slice(0, 10) < f), x => x.dir * x.amount); const inR = list.filter(x => W.inRange(x.at, f, to)); const i = W.sum(inR.filter(x => x.dir > 0), x => x.amount), o = W.sum(inR.filter(x => x.dir < 0), x => x.amount); return [t(name), M(before), M(i), M(o), M(before + i - o)]; };
      const rows = [...acc.map(([k, n]) => line(n, W.db.cash.filter(c => c.acc === k))), line(W.METHODS.transfer, W.db.bank.filter(b => b.status === 'confirmed'))];
      return { head: [t('Счёт'), t('На начало'), t('Приход'), t('Расход'), t('На конец')], rows, foot: [t('Итого'), M(W.sum(rows, r => r[1].v)), M(W.sum(rows, r => r[2].v)), M(W.sum(rows, r => r[3].v)), M(W.sum(rows, r => r[4].v))] };
    } },
    { id: 'salary', icon: 'banknote', page: 'salary', title: W.N('Зарплатная ведомость'), desc: W.N('Начислено, выплачено и остаток'), build: (f, to) => {
      const ms = []; const s = (f || W.db.accruals.reduce((m, a) => a.period < m ? a.period : m, W.month()) + '-01').slice(0, 7), e = (to || W.today()).slice(0, 7);
      for (let d = new Date(+s.slice(0, 4), +s.slice(5) - 1, 1); W.isoDay(d).slice(0, 7) <= e; d.setMonth(d.getMonth() + 1)) ms.push(W.isoDay(d).slice(0, 7));
      const rows = W.salaryRows(ms).filter(r => r.status !== 'none');
      return { head: [t('Сотрудник'), t('Должность'), t('Начислено'), t('Выплачено'), t('Остаток'), t('Переплата')], rows: rows.map(r => [r.u.name, t(r.u.position || ''), M(r.accrued), M(r.paid), M(r.rest), M(r.over)]),
        foot: [t('Итого'), '', M(W.sum(rows, r => r.accrued)), M(W.sum(rows, r => r.paid)), M(W.sum(rows, r => r.rest)), M(W.sum(rows, r => r.over))] };
    } },
  ];
  const avail = () => REPORTS.filter(r => W.can(r.page));
  const range = () => { const S = st(); return S.period === 'custom' ? [S.from || null, S.to || null] : W.periodRange(S.period); };
  const cell = v => v && typeof v === 'object' ? (v.money ? W.money(v.v) : W.qty(v.v)) : esc(v ?? '');
  const raw = v => v && typeof v === 'object' ? W.round(v.v, 2) : v;
  const periodLabel = (rep) => { if (rep.noPeriod) return t('на {d}', { d: W.fmtDate(W.today()) }); const [f, to] = range(); return f ? `${W.fmtDate(f)} — ${W.fmtDate(to || W.today())}` : t('за всё время'); };

  W.page('reports', {
    render() {
      const S = st(), list = avail();
      const rep = list.find(r => r.id === S.rep) || list[0];
      if (!rep) return W.empty(t('Отчётов нет'), '', 'report');
      const [f, to] = range(), data = rep.build(f, to);
      const isNum = i => data.rows.some(r => r[i] && typeof r[i] === 'object') || data.rows.every(r => typeof r[i] === 'number');
      return `<div class="page-head"><div><h1>${t('Отчёты')}</h1><div class="sub">${t('Смотрите на экране, печатайте или скачивайте в Excel')}</div></div></div>
        <div class="split">
          <div class="card"><div class="pick-list" style="max-height:none">${list.map(r => `<button class="pick ${r.id === rep.id ? 'on' : ''}" data-a="rep" data-v="${r.id}"><div class="kpi-ic" style="width:36px;height:36px">${I(r.icon, 'ic-sm')}</div><div style="min-width:0"><b>${t(r.title)}</b><span>${t(r.desc)}</span></div></button>`).join('')}</div></div>
          <div class="card" data-region="rep"><div class="card-head"><div><h3>${t(rep.title)}</h3><div class="sub">${periodLabel(rep)}</div></div>
            <div class="right">${rep.noPeriod ? '' : `<select class="inp sm" data-on="period" style="width:auto">${W.opts([...W.periodOpts(), ['custom', t('Свои даты')]], S.period)}</select>`}
              <button class="btn sm" data-a="print">${I('print')}${t('Печать')}</button><button class="btn sm primary" data-a="csv">${I('download')}${t('Excel')}</button></div></div>
            ${!rep.noPeriod && S.period === 'custom' ? `<div class="row" style="padding:12px 20px 0"><input class="inp sm" type="date" data-change="from" value="${S.from}" style="width:auto" aria-label="${t('С даты')}"><span class="muted">—</span><input class="inp sm" type="date" data-change="to" value="${S.to}" style="width:auto" aria-label="${t('По дату')}"></div>` : ''}
            <div class="card-body flush">${W.table({ cols: data.head.map((h, i) => ({ label: h, r: isNum(i), title: i === 0, render: r => cell(r[i]) })), rows: data.rows, foot: data.rows.length ? data.foot.map(cell) : null, empty: W.empty(t('Нет данных за период'), '', 'report') })}</div></div>
        </div>`;
    },
    actions: {
      rep: el => { st().rep = el.dataset.v; W.swap(); },
      period: el => { st().period = el.value; W.refresh(); },
      from: el => { st().from = el.value; W.refresh(); },
      to: el => { st().to = el.value; W.refresh(); },
      print: () => {
        const rep = avail().find(r => r.id === st().rep) || avail()[0], [f, to] = range(), d = rep.build(f, to);
        const num = v => v && typeof v === 'object';
        W.printHTML(`<div class="doc">${W.docHead(t(rep.title), periodLabel(rep))}<table style="font-size:11.5px"><thead><tr>${d.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${d.rows.map(r => `<tr>${r.map(v => `<td class="${num(v) || typeof v === 'number' ? 'r' : ''}">${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
          <tfoot><tr>${d.foot.map(v => `<td class="${num(v) || typeof v === 'number' ? 'r' : ''}"><b>${cell(v)}</b></td>`).join('')}</tr></tfoot></table>
          <div style="margin-top:14px;font-size:11px;color:#777">${t('Сформировано')}: ${W.fmtDT(W.now())} · ${esc(W.me().name)}</div></div>`);
      },
      csv: () => {
        const rep = avail().find(r => r.id === st().rep) || avail()[0], [f, to] = range(), d = rep.build(f, to);
        W.downloadCSV(`${t(rep.title)} ${periodLabel(rep)}`, d.head, [...d.rows.map(r => r.map(raw)), d.foot.map(raw)]);
      },
    },
  });
})();
