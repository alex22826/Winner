/* Обзор → Сводка (ТЗ 4.5) — показатели за выбранный день или период */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('summary', { df: { p: 'today' } });

  const greet = () => { const h = new Date().getHours(); return h < 5 ? t('Доброй ночи') : h < 12 ? t('Доброе утро') : h < 18 ? t('Добрый день') : t('Добрый вечер'); };
  // спокойный вид (пилот, calm.css): заголовок — период, тренд — сухим текстом
  const calm = () => document.documentElement.classList.contains('ui-calm');
  const delta = (cur, prev) => {
    if (!prev) return '';
    const p = Math.round((cur - prev) / prev * 100);
    if (calm()) return `<span class="trend ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '+' : '−'}${Math.abs(p)}%</span> ${t('к прошлому периоду')}`;
    return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`;
  };
  // «29 окт 2026», «Октябрь 2026», «1 окт – 29 окт 2026»; год приглушён
  const periodTitle = (from, to) => {
    const yr = y => `<span class="yr">${y}</span>`, y1 = from.slice(0, 4), y2 = to.slice(0, 4);
    if (from === to) return `${W.dayShort(from)} ${yr(y1)}`;
    const lastDay = W.isoDay(new Date(+y2, +to.slice(5, 7), 0));
    if (from.slice(0, 7) === to.slice(0, 7) && from.slice(8) === '01' && (to === lastDay || to === W.today())) return `${t(W.MONTHS[+from.slice(5, 7) - 1])} ${yr(y1)}`;
    return y1 === y2 ? `${W.dayShort(from)} – ${W.dayShort(to)} ${yr(y2)}` : `${W.dayShort(from)} ${yr(y1)} – ${W.dayShort(to)} ${yr(y2)}`;
  };
  // подпись главной карточки под выбранный период
  const heroLabel = (df, from, to) => ({
    today: t('Продажи за сегодня'), yesterday: t('Продажи за вчера'), week: t('Продажи за неделю'), month: t('Продажи за месяц'),
    prev: t('Продажи за прошлый месяц'), quarter: t('Продажи за 3 месяца'), year: t('Продажи за год'), all: t('Продажи за всё время'),
  }[df.p] || (from === to ? t('Продажи за {d}', { d: W.dayShort(from) }) : t('Продажи за период')));

  W.page('summary', {
    render() {
      const me = W.me(), S = st(), fin = W.allow('finance.view'), act = W.activeSales();
      const today = W.today();
      let [from, to] = W.dfRange(S.df);
      if (!from) { from = act.reduce((m, s) => (s.at.slice(0, 10) < m ? s.at.slice(0, 10) : m), today); to = today; }
      const len = W.daysBetween(from, to) + 1;
      const inP = (at, a = from, b = to) => W.inRange(at, a, b);
      const sales = act.filter(s => inP(s.at));
      const sum = W.sum(sales, s => W.saleNet(s));
      const prevSum = S.df.p === 'all' ? 0 : W.sum(act.filter(s => inP(s.at, W.addDays(from, -len), W.addDays(from, -1))), s => W.saleNet(s));
      // «продажи за месяц» — месяц последнего дня периода; если период и есть этот месяц — показываем прошлый для сравнения
      let mon = to.slice(0, 7);
      if (S.df.p === 'month') { const d = W.parse(to); mon = W.isoDay(new Date(d.getFullYear(), d.getMonth() - 1, 1)).slice(0, 7); }
      const monSales = act.filter(s => s.at.slice(0, 7) === mon);
      const pays = W.db.payments.filter(p => inP(p.at));
      const upTo = x => x.at.slice(0, 10) <= to;
      // долги по отгрузке: оплачено клиентами, но ещё не отгружено (на конец периода)
      const debtSales = act.filter(s => upTo(s) && W.shipDebt(s) > 0);
      const pend = W.db.bank.filter(b => b.status === 'pending').length;
      const toLabel = to === today ? t('сегодня') : W.dayShort(to);

      const kpis = [
        W.kpi({ label: heroLabel(S.df, from, to), value: W.moneyKpi(sum), icon: 'trendUp', hero: true, link: 'sales?tab=history',
          foot: calm() ? [t('{n} чеков', { n: sales.length }), delta(sum, prevSum)].filter(Boolean).join(' · ') : `${delta(sum, prevSum)} ${t('{n} чеков', { n: sales.length })}` }),
        W.kpi({ label: t('Продажи за {m}', { m: W.t(W.MONTHS[+mon.slice(5) - 1]).toLowerCase() }), value: W.moneyKpi(W.sum(monSales, s => W.saleNet(s))), icon: 'calendar', link: 'sales?tab=history', foot: t('{n} продаж', { n: monSales.length }) }),
        W.kpi({ label: t('Количество продаж'), value: W.fmtNum(sales.length), small: t('шт'), icon: 'cart', c: 'c-vio', foot: W.dfLabel(S.df) }),
        W.kpi({ label: t('Средний чек'), value: W.moneyKpi(sales.length ? sum / sales.length : 0), icon: 'receipt', c: 'c-ok', foot: t('по продажам периода') }),
      ];
      if (fin) kpis.push(
        W.kpi({ label: t('Приход денег по карте'), value: W.moneyKpi(W.sum(pays.filter(p => p.method === 'card' || p.method === 'corp'), p => p.amount)), icon: 'card', link: 'cash', foot: t('за период, терминал и корп. карта') }),
        W.kpi({ label: t('Касса'), value: W.moneyKpi(W.sum(W.db.cash.filter(c => c.acc === 'cash' && upTo(c)), c => c.dir * c.amount)), icon: 'wallet', c: 'c-ok', link: 'cash', foot: t('наличные на {d}', { d: toLabel }) }),
        W.kpi({ label: t('Расчётный счёт'), value: W.moneyKpi(W.sum(W.db.bank.filter(b => b.status === 'confirmed' && upTo(b)), b => b.dir * b.amount)), icon: 'bank', link: 'bank', foot: pend ? `<span class="badge warn">${t('{n} ждут подтверждения', { n: pend })}</span>` : t('все операции подтверждены') }),
      );
      kpis.push(W.kpi({ label: t('Долги по отгрузке'), value: W.moneyKpi(W.sum(debtSales, s => W.shipDebt(s))), icon: 'truck', c: 'c-warn', link: 'sales?tab=debts', foot: t('{n} оплаченных заказов ждут отгрузки', { n: debtSales.length }) }));

      // график: один день — по часам, до двух месяцев — по дням, дольше — по месяцам
      const pts = [];
      let chartTitle;
      if (len === 1) {
        chartTitle = t('Продажи по часам');
        for (let h = 8; h <= 20; h++) {
          const hs = sales.filter(s => +s.at.slice(11, 13) === h || (h === 8 && +s.at.slice(11, 13) < 8) || (h === 20 && +s.at.slice(11, 13) > 20));
          pts.push({ x: `${h}:00`, v: W.sum(hs, s => W.saleNet(s)), tip: `${h}:00–${h + 1}:00 · ${t('{n} продаж', { n: hs.length })}` });
        }
      } else if (len <= 62) {
        chartTitle = t('Продажи по дням');
        for (let i = 0; i < len; i++) {
          const day = W.addDays(from, i), ds = sales.filter(s => s.at.slice(0, 10) === day);
          pts.push({ x: W.dayShort(day), v: W.sum(ds, s => W.saleNet(s)), tip: `${W.dayShort(day)} · ${t('{n} продаж', { n: ds.length })}` });
        }
      } else {
        chartTitle = t('Продажи по месяцам');
        const months = [...new Set(Array.from({ length: len }, (_, i) => W.addDays(from, i).slice(0, 7)))];
        months.forEach(m => { const ms = sales.filter(s => s.at.slice(0, 7) === m); pts.push({ x: t(W.MON_SHORT[+m.slice(5) - 1]), v: W.sum(ms, s => W.saleNet(s)), tip: `${W.monthName(m)} · ${t('{n} продаж', { n: ms.length })}` }); });
      }
      const byCh = ['shop', 'main', 'prod'].map((c, i) => ({ label: t(W.CHANNELS[c]), v: W.sum(sales.filter(s => s.channel === c), s => W.saleNet(s)), color: `var(--s${i + 1})` }));
      const top = {};
      sales.forEach(s => s.items.forEach(i => { top[i.p] = (top[i.p] || 0) + i.qty * i.price; }));
      const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => ({ label: (W.product(p) || {}).name || '—', v }));
      const low = W.lowProducts().slice(0, 6);
      const recent = sales.slice(-7).reverse();
      const stageCls = { new: '', picking: 'warn', ready: 'info', shipping: 'vio', done: 'ok', cancelled: 'bad' };
      const pLabel = W.dfLabel(S.df);

      return `
      <div class="page-head"><div>
        ${calm() ? `<div class="h-eyebrow">${t('Сводка')} · ${esc(W.db.settings.company.name)}</div><h1>${periodTitle(from, to)}</h1>`
          : `<div class="h-eyebrow"><i></i>${greet()}, ${esc(me.name.split(' ')[1] || me.name)}</div>
        <h1>${t('Сводка')}</h1>
        <div class="sub">${esc(W.db.settings.company.name)}</div>`}</div>
        <div class="actions">
          ${W.dateFilter(S.df, 'df')}
          ${W.can('reports') ? `<button class="btn" data-go="reports">${I('report')}${t('Отчёты')}</button>` : ''}
          ${W.allow('sales.create') ? `<button class="btn primary" data-a="newSale">${I('plus')}${t('Новая продажа')}</button>` : ''}
        </div></div>
      <div data-region="sum">
      <div class="kpis">${kpis.join('')}</div>
      <div class="grid g-main">
        <div class="card"><div class="card-head"><div><h3>${chartTitle}</h3><div class="sub">${esc(pLabel)} · ${t('без отменённых и возвратов')}</div></div>
          <div class="right"><span class="badge info plain">${W.money(sum)}</span></div></div>
          <div class="card-body">${sales.length ? W.areaChart(pts) : W.empty(t('За период продаж нет'), t('Выберите другой день или период'), 'calendar')}</div></div>
        <div class="card"><div class="card-head"><div><h3>${t('Каналы продаж')}</h3><div class="sub">${esc(pLabel)}</div></div></div>
          <div class="card-body">${W.donut(byCh, { center: W.compact(sum), sub: t('за период') })}</div></div>
      </div>
      <div class="grid g-3 mt-16">
        <div class="card"><div class="card-head"><h3>${t('Лидеры продаж')}</h3><div class="right"><span class="sub">${t('за период')}</span></div></div>
          <div class="card-body">${topList.length ? W.hbars(topList) : W.empty(t('Продаж пока нет'))}</div></div>
        <div class="card"><div class="card-head"><h3>${t('Заканчивается на складе')}</h3><div class="right">${low.length ? `<span class="badge bad">${W.lowProducts().length}</span>` : ''}</div></div>
          <div class="card-body">${low.length ? low.map(p => { const s = W.stock('p', p.id), mn = W.minStock(p); return `<div class="list-row"><div class="thumb">${W.productArt(p)}</div><div class="lr-main"><b>${esc(p.name)}</b><span>${t('Остаток {a} шт · порог {b}', { a: W.qty(s), b: mn })}</span><div class="bar ${s <= 0 ? 'bad' : 'warn'}" style="margin-top:6px"><i style="width:${W.clamp(s / Math.max(1, mn) * 100, 3, 100)}%"></i></div></div></div>`; }).join('') : W.empty(t('Всё в наличии'), t('Ни одна позиция не опустилась ниже порога'), 'checkCircle')}</div></div>
        <div class="card"><div class="card-head"><h3>${t('Продажи за период')}</h3>${W.can('sales') ? `<div class="right"><button class="btn sm ghost" data-go="sales" data-params='{"tab":"history"}'>${t('Все')}${I('chevR', 'ic-sm')}</button></div>` : ''}</div>
          <div class="card-body">${recent.length ? recent.map(s => `<div class="list-row click" data-a="openSale" data-id="${s.id}"><div class="avatar sm" style="--av:var(--s${s.channel === 'shop' ? 1 : s.channel === 'main' ? 2 : 3})">${I(s.channel === 'shop' ? 'cart' : s.channel === 'main' ? 'warehouse' : 'factory', 'ic-sm')}</div>
            <div class="lr-main"><b>№${W.no(s.no)} · ${esc(W.custName(s))}</b><span>${W.fmtDT(s.at)} · ${t(W.CHANNELS[s.channel])}</span></div>
            <div style="text-align:right"><div class="money">${W.money(s.total)}</div><span class="badge ${stageCls[s.stage]}" style="margin-top:3px">${W.stageName(s.stage)}</span></div></div>`).join('') : W.empty(t('За период продаж нет'), '', 'cart')}</div></div>
      </div>
      ${fin ? (() => {
        const pendList = W.db.bank.filter(b => b.status === 'pending').slice(-5).reverse();
        return pendList.length ? `<div class="card mt-16"><div class="card-head"><div><h3>${t('Ждут подтверждения бухгалтера')}</h3><div class="sub">${t('Проверьте поступления в Didox и Дибанк и подтвердите в разделе «Банк»')}</div></div><div class="right"><button class="btn sm" data-go="bank" data-params='{"tab":"pending"}'>${t('Открыть банк')}${I('chevR', 'ic-sm')}</button></div></div>
          <div class="card-body flush">${W.table({ cols: [
            { label: t('Дата и время'), render: b => W.fmtDT(b.at), title: true },
            { label: t('Тип'), render: b => b.dir > 0 ? `<span class="badge ok">${t('Поступление')}</span>` : `<span class="badge bad">${t('Списание')}</span>`, aside: true },
            { label: t('Описание'), render: b => esc(W.tx(b.desc)) },
            { label: t('Контрагент'), render: b => esc(W.tx(b.party) || '—') },
            { label: t('Сумма'), r: true, render: b => `<span class="money ${b.dir > 0 ? 'in' : 'out'}">${b.dir > 0 ? '+' : '−'}${W.money(b.amount)}</span>` },
          ], rows: pendList })}</div></div>` : '';
      })() : ''}
      </div>`;
    },
    actions: {
      df: el => W.openDateFilter(el, st().df, v => { st().df = v; W.swap(); }),
      newSale: () => W.saleForm(),
      openSale: el => W.openSale(el.dataset.id),
    },
  });
})();
