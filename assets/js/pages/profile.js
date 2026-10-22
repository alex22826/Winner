/* Личный кабинет: данные пользователя, язык и тема, смена своего пароля (ТЗ 4.20) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const strength = p => { let s = 0; if (p.length >= 8) s++; if (/[A-ZА-Я]/.test(p) && /[a-zа-я]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w\s]/.test(p) || p.length >= 12) s++; return s; };
  const SCOL = ['var(--line)', '#ef4444', '#f59e0b', '#00b8f5', '#12b981'];

  W.page('profile', {
    render(params) {
      const me = W.me(), mon = W.month();
      const mySales = W.activeSales().filter(s => s.by === me.id && s.at.slice(0, 7) === mon);
      const days = me.hired ? W.daysBetween(me.hired, W.today()) : 0;
      const pages = W.NAV.flatMap(g => g.items.filter(i => W.can(i[0])).map(i => ({ id: i[0], label: i[1], ic: i[2], g: g.g })));
      const acts = [
        ...W.db.sales.filter(s => s.by === me.id).slice(-4).map(s => ({ at: s.at, ic: 'cart', txt: t('Продажа №{n} · {c}', { n: W.no(s.no), c: W.custName(s) }), v: W.money(s.total) })),
        ...W.db.bank.filter(b => b.confirmedBy === me.id).slice(-4).map(b => ({ at: b.confirmedAt, ic: 'shieldCheck', txt: t('Подтверждена операция: {d}', { d: W.tx(b.desc) }), v: W.money(b.amount) })),
        ...W.db.moves.filter(m => m.by === me.id && m.kind !== 'sale').slice(-4).map(m => ({ at: m.at, ic: 'swap', txt: `${((m.t === 'p' ? W.product(m.item) : W.material(m.item)) || {}).name}`, v: `${m.qty > 0 ? '+' : '−'}${W.qty(Math.abs(m.qty))}` })),
        ...W.db.salaryLog.filter(l => l.by === me.id).slice(-3).map(l => ({ at: l.at, ic: 'banknote', txt: `${l.target}: ${l.change}`, v: '' })),
      ].sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 7);
      const dark = document.documentElement.dataset.theme === 'dark';
      const stats = me.roles.some(r => ['seller', 'manager'].includes(r))
        ? [[mySales.length, t('моих продаж за месяц')], [W.compact(W.sum(mySales, s => W.saleNet(s))), t('на сумму, {c}', { c: W.curLabel() })]]
        : [[me.lastLogin ? W.fmtDate(me.lastLogin) : '—', t('последний вход')], [days ? t('{n} дн.', { n: W.fmtNum(days) }) : '—', t('в компании')]];
      setTimeout(() => { if (params.tab === 'security') { const el = document.querySelector('#pw-card'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = el.querySelector('input'); i && i.focus({ preventScroll: true }); } } }, 120);
      return `<div class="profile-hero"><div class="avatar xl">${W.initials(me.name)}</div>
          <div style="min-width:0"><div class="h-eyebrow" style="color:rgba(255,255,255,.8)"><i></i>${t('Личный кабинет')}</div><h2>${esc(me.name)}</h2><div class="ph-sub">${esc(t(me.position || ''))} · ${esc(W.db.settings.company.name)}</div>
            <div class="tags mt-12">${me.roles.map(r => `<span class="tag">${W.roleName(r)}</span>`).join('')}<span class="tag">${I('user', 'ic-sm')} ${esc(me.login)}</span></div></div>
          <div class="ph-stats">${stats.map(([a, b]) => `<div class="ph-stat"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div>
        <div class="grid g-main mt-16" style="align-items:start">
          <div class="vstack">
            <div class="card"><div class="card-head"><h3>${t('Язык и оформление')}</h3></div><div class="card-body">
              <div class="label">${t('Язык интерфейса')}</div>
              <div class="grid g-3 mt-8">${W.LANGS.map(l => `<button class="kpi link" data-a="lang" data-v="${l.id}" style="text-align:left;cursor:pointer;${l.id === W.lang ? 'border-color:var(--brand);box-shadow:var(--ring)' : ''}"><div class="kpi-top"><div class="kpi-ic ${l.id === W.lang ? '' : 'c-vio'}">${l.label}</div><div class="kpi-label"><b style="color:var(--text)">${l.name}</b><div class="muted" style="font-size:12px">${{ ru: 'Привет, мир', uzc: 'Салом, дунё', uz: 'Salom, dunyo' }[l.id]}</div></div></div></button>`).join('')}</div>
              <div class="label mt-16">${t('Тема')}</div>
              <div class="grid g-2 mt-8">${[['light', 'sun', t('Светлая')], ['dark', 'moon', t('Тёмная')]].map(([k, ic, n]) => `<button class="kpi link" data-a="theme" data-v="${k}" style="text-align:left;cursor:pointer;${(k === 'dark') === dark ? 'border-color:var(--brand);box-shadow:var(--ring)' : ''}"><div class="kpi-top"><div class="kpi-ic">${I(ic)}</div><div class="kpi-label"><b style="color:var(--text)">${n}</b></div></div></button>`).join('')}</div>
            </div></div>
            <div class="card"><div class="card-head"><h3>${t('Моя активность')}</h3></div><div class="card-body">${acts.length ? acts.map(a => `<div class="list-row"><div class="kpi-ic" style="width:32px;height:32px">${I(a.ic, 'ic-sm')}</div><div class="lr-main"><b>${esc(a.txt)}</b><span>${W.fmtDT(a.at)}</span></div>${a.v ? `<b class="nowrap" style="font-size:13px">${a.v}</b>` : ''}</div>`).join('') : `<div class="muted">${t('Пока нет действий')}</div>`}</div></div>
          </div>
          <div class="vstack">
            <div class="card" id="pw-card"><div class="card-head"><div><h3>${t('Смена пароля')}</h3><div class="sub">${t('Свой пароль вы меняете сами. Новый пароль сотруднику выдаёт директор.')}</div></div></div>
              <div class="card-body"><form class="form-grid" style="grid-template-columns:1fr" data-pw autocomplete="off" onsubmit="return false">
                ${W.fi({ name: 'old', label: t('Текущий пароль'), type: 'password', icon: 'lock', req: true, attrs: 'autocomplete="current-password"' })}
                <div class="field"><label>${t('Новый пароль')} <span style="color:var(--bad)">*</span></label><div class="inp-wrap">${I('key')}<input class="inp" name="new" type="password" data-req autocomplete="new-password" data-on="pw"></div>
                  <div class="pw-meter">${'<i></i>'.repeat(4)}</div><div class="hint pw-hint">${t('Минимум 8 символов, буквы и цифры')}</div></div>
                ${W.fi({ name: 'new2', label: t('Повторите новый пароль'), type: 'password', icon: 'key', req: true, attrs: 'autocomplete="new-password"' })}
                <button class="btn primary" data-a="pass">${I('check')}${t('Сменить пароль')}</button></form></div></div>
            <div class="card"><div class="card-head"><h3>${t('Мои разделы')}</h3><div class="right"><span class="sub">${t('по роли')}</span></div></div>
              <div class="card-body"><div class="tags">${pages.map(p => `<button class="tag brand" data-go="${p.id}" style="border:0;cursor:pointer;height:30px;gap:6px">${I(p.ic, 'ic-sm')}${t(p.label)}</button>`).join('')}</div></div></div>
            <button class="btn danger block" data-a="logout">${I('logout')}${t('Выйти из кабинета')}</button>
          </div></div>`;
    },
    actions: {
      lang: el => W.setLang(el.dataset.v),
      theme: (el, e) => W.setTheme(el.dataset.v === 'dark', e),
      pw: el => {
        const s = strength(el.value), card = el.closest('.field');
        card.querySelectorAll('.pw-meter i').forEach((x, i) => { x.style.background = i < s ? SCOL[s] : ''; });
        card.querySelector('.pw-hint').textContent = !el.value ? t('Минимум 8 символов, буквы и цифры') : [t('Слишком простой'), t('Слабый'), t('Средний'), t('Хороший'), t('Надёжный')][s];
      },
      pass: async el => {
        const f = el.closest('form');
        if (!W.validate(f)) return;
        const d = W.form(f), me = W.me();
        if (await W.passHash(me.login, d.old) !== me.pass) { f.querySelector('[name=old]').closest('.field').classList.add('err'); return W.toast(t('Текущий пароль указан неверно'), 'err'); }
        if (d.new.length < 6) return W.toast(t('Новый пароль слишком короткий — минимум 6 символов'), 'warn');
        if (d.new !== d.new2) { f.querySelector('[name=new2]').closest('.field').classList.add('err'); return W.toast(t('Пароли не совпадают'), 'warn'); }
        me.pass = await W.passHash(me.login, d.new); me.passAt = W.now();
        W.save(); W.toast(t('Пароль изменён'));
      },
      logout: () => W.askLogout(),
    },
  });
})();
