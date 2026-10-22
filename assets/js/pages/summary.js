/* Обзор → Сводка (ТЗ 4.5) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);

  const greet = () => { const h = new Date().getHours(); return h < 5 ? t('Доброй ночи') : h < 12 ? t('Доброе утро') : h < 18 ? t('Добрый день') : t('Добрый вечер'); };
  const delta = (cur, prev) => {
    if (!prev) return '';
    const p = Math.round((cur - prev) / prev * 100);
    return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`;
  };

  W.page('summary', {
    render() {
      const me = W.me(), S = W.salesStats(), fin = W.allow('finance.view');
      const today = W.today(), act = W.activeSales();
      const yest = W.addDays(today, -1);
      const ySum = W.sum(act.filter(s => s.at.slice(0, 10) === yest), s => W.saleNet(s));
      // прошлый месяц за те же числа
      const d = new Date(), pm = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const pmKey = W.isoDay(pm).slice(0, 7), dom = today.slice(8, 10);
      const pmSum = W.sum(act.filter(s => s.at.slice(0, 7) === pmKey && s.at.slice(8, 10) <= dom), s => W.saleNet(s));
      const [d1, m1, y1] = [d.getDate(), d.getMonth(), d.getFullYear()];

      const kpis = [
        W.kpi({ label: t('Продажи за сегодня'), value: W.moneyKpi(S.today), icon: 'trendUp', hero: true, link: 'sales', foot: `${delta(S.today, ySum)} ${t('{n} чеков', { n: S.todayCount })}` }),
        W.kpi({ label: t('Продажи за месяц'), value: W.moneyKpi(S.month), icon: 'calendar', link: 'sales', foot: `${delta(S.month, pmSum)} ${t('к прошлому месяцу')}` }),
        W.kpi({ label: t('Количество продаж'), value: W.fmtNum(S.monthCount), small: t('шт'), icon: 'cart', c: 'c-vio', foot: t('за {m}', { m: W.t(W.MONTHS[m1]).toLowerCase() }) }),
        W.kpi({ label: t('Средний чек'), value: W.moneyKpi(S.avg), icon: 'receipt', c: 'c-ok', foot: t('по продажам месяца') }),
      ];
      if (fin) kpis.push(
        W.kpi({ label: t('Приход денег по карте'), value: W.moneyKpi(S.card), icon: 'card', link: 'cash', foot: t('за месяц, терминал и корп. карта') }),
        W.kpi({ label: t('Касса'), value: W.moneyKpi(W.cashBal('cash')), icon: 'wallet', c: 'c-ok', link: 'cash', foot: t('наличные на сегодня') }),
        W.kpi({ label: t('Расчётный счёт'), value: W.moneyKpi(W.bankBal()), icon: 'bank', link: 'bank', foot: (() => { const n = W.db.bank.filter(b => b.status === 'pending').length; return n ? `<span class="badge warn">${t('{n} ждут подтверждения', { n })}</span>` : t('все операции подтверждены'); })() }),
      );
      kpis.push(W.kpi({ label: t('Долги по отгрузке'), value: W.moneyKpi(S.debt), icon: 'alert', c: 'c-bad', link: 'sales?tab=debts', foot: t('{n} заказов не оплачено полностью', { n: S.debtCount }) }));

      // продажи по дням за 30 дней
      const pts = [];
      for (let i = 29; i >= 0; i--) {
        const day = W.addDays(today, -i);
        const v = W.sum(act.filter(s => s.at.slice(0, 10) === day), s => W.saleNet(s));
        pts.push({ x: W.dayShort(day), v, tip: `${W.dayShort(day)} · ${t('{n} продаж', { n: act.filter(s => s.at.slice(0, 10) === day).length })}` });
      }
      const mon = W.month();
      const monS = act.filter(s => s.at.slice(0, 7) === mon);
      const byCh = ['shop', 'main', 'prod'].map((c, i) => ({ label: t(W.CHANNELS[c]), v: W.sum(monS.filter(s => s.channel === c), s => W.saleNet(s)), color: `var(--s${i + 1})` }));

      // лидеры продаж месяца
      const top = {};
      monS.forEach(s => s.items.forEach(i => { top[i.p] = (top[i.p] || 0) + i.qty * i.price; }));
      const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, v]) => ({ label: (W.product(p) || {}).name || '—', v }));

      const low = W.lowProducts().slice(0, 6);
      const recent = W.db.sales.slice(-7).reverse();
      const stageCls = { new: '', picking: 'warn', ready: 'info', shipping: 'vio', done: 'ok', cancelled: 'bad' };

      return `
      <div class="page-head"><div>
        <div class="h-eyebrow"><i></i>${greet()}, ${esc(me.name.split(' ')[1] || me.name)}</div>
        <h1>${t('Сводка')}</h1>
        <div class="sub">${t('Сегодня')} — ${d1} ${t(W.MON_SHORT[m1])} ${y1} · ${esc(W.db.settings.company.name)}</div></div>
        <div class="actions">
          ${W.can('reports') ? `<button class="btn" data-go="reports">${I('report')}${t('Отчёты')}</button>` : ''}
          ${W.allow('sales.create') ? `<button class="btn primary" data-a="newSale">${I('plus')}${t('Новая продажа')}</button>` : ''}
        </div></div>
      <div class="kpis">${kpis.join('')}</div>
      <div class="grid g-main">
        <div class="card"><div class="card-head"><div><h3>${t('Продажи за 30 дней')}</h3><div class="sub">${t('Сумма продаж по дням, без отменённых и возвратов')}</div></div>
          <div class="right"><span class="badge info plain">${W.money(W.sum(pts, p => p.v))}</span></div></div>
          <div class="card-body">${W.areaChart(pts)}</div></div>
        <div class="card"><div class="card-head"><div><h3>${t('Каналы продаж')}</h3><div class="sub">${W.monthName(mon)}</div></div></div>
          <div class="card-body">${W.donut(byCh, { center: W.compact(W.sum(byCh, c => c.v)), sub: t('за месяц') })}</div></div>
      </div>
      <div class="grid g-3 mt-16">
        <div class="card"><div class="card-head"><h3>${t('Лидеры продаж')}</h3><div class="right"><span class="sub">${t('за месяц')}</span></div></div>
          <div class="card-body">${topList.length ? W.hbars(topList) : W.empty(t('Продаж пока нет'))}</div></div>
        <div class="card"><div class="card-head"><h3>${t('Заканчивается на складе')}</h3><div class="right">${low.length ? `<span class="badge bad">${W.lowProducts().length}</span>` : ''}</div></div>
          <div class="card-body">${low.length ? low.map(p => { const s = W.stock('p', p.id), mn = W.minStock(p); return `<div class="list-row"><div class="thumb">${W.productArt(p)}</div><div class="lr-main"><b>${esc(p.name)}</b><span>${t('Остаток {a} шт · порог {b}', { a: W.qty(s), b: mn })}</span><div class="bar ${s <= 0 ? 'bad' : 'warn'}" style="margin-top:6px"><i style="width:${W.clamp(s / Math.max(1, mn) * 100, 3, 100)}%"></i></div></div></div>`; }).join('') : W.empty(t('Всё в наличии'), t('Ни одна позиция не опустилась ниже порога'), 'checkCircle')}</div></div>
        <div class="card"><div class="card-head"><h3>${t('Последние продажи')}</h3>${W.can('sales') ? `<div class="right"><button class="btn sm ghost" data-go="sales" data-params='{"tab":"history"}'>${t('Все')}${I('chevR', 'ic-sm')}</button></div>` : ''}</div>
          <div class="card-body">${recent.map(s => `<div class="list-row click" data-a="openSale" data-id="${s.id}"><div class="avatar sm" style="--av:var(--s${s.channel === 'shop' ? 1 : s.channel === 'main' ? 2 : 3})">${I(s.channel === 'shop' ? 'cart' : s.channel === 'main' ? 'warehouse' : 'factory', 'ic-sm')}</div>
            <div class="lr-main"><b>№${W.no(s.no)} · ${esc(W.custName(s))}</b><span>${W.fmtDT(s.at)} · ${t(W.CHANNELS[s.channel])}</span></div>
            <div style="text-align:right"><div class="money">${W.money(s.total)}</div><span class="badge ${stageCls[s.stage]}" style="margin-top:3px">${W.stageName(s.stage)}</span></div></div>`).join('')}</div></div>
      </div>
      ${fin ? (() => {
        const pend = W.db.bank.filter(b => b.status === 'pending').slice(-5).reverse();
        return pend.length ? `<div class="card mt-16"><div class="card-head"><div><h3>${t('Ждут подтверждения бухгалтера')}</h3><div class="sub">${t('Проверьте поступления в Didox и Дибанк и подтвердите в разделе «Банк»')}</div></div><div class="right"><button class="btn sm" data-go="bank" data-params='{"tab":"pending"}'>${t('Открыть банк')}${I('chevR', 'ic-sm')}</button></div></div>
          <div class="card-body flush">${W.table({ cols: [
            { label: t('Дата и время'), render: b => W.fmtDT(b.at), title: true },
            { label: t('Тип'), render: b => b.dir > 0 ? `<span class="badge ok">${t('Поступление')}</span>` : `<span class="badge bad">${t('Списание')}</span>`, aside: true },
            { label: t('Описание'), render: b => esc(W.tx(b.desc)) },
            { label: t('Контрагент'), render: b => esc(W.tx(b.party) || '—') },
            { label: t('Сумма'), r: true, render: b => `<span class="money ${b.dir > 0 ? 'in' : 'out'}">${b.dir > 0 ? '+' : '−'}${W.money(b.amount)}</span>` },
          ], rows: pend })}</div></div>` : '';
      })() : ''}`;
    },
    mount(view) { view.querySelectorAll('.kpi[data-go*="?"]').forEach(k => { const [p, q] = k.dataset.go.split('?'); k.dataset.go = p; k.dataset.params = JSON.stringify(Object.fromEntries(new URLSearchParams(q))); }); },
    actions: {
      newSale: () => W.saleForm(),
      openSale: el => W.openSale(el.dataset.id),
    },
  });
})();
