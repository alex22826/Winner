/* Управление → Сотрудники (ТЗ 4.7, 4.20): пользователи системы, роли, доступы */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('staff', { seg: 'active', q: '' });
  const genPass = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ', b = 'abcdefghijkmnpqrstuvwxyz'; const r = s => s[Math.floor(Math.random() * s.length)]; return `${r(a)}${r(b)}${r(b)}-${Math.floor(1000 + Math.random() * 9000)}`; };
  const translitLogin = s => String(s).toLowerCase().split(/\s+/)[0].replace(/[а-яёўқғҳ]/g, c => ({ а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h' }[c] || '')).replace(/[^a-z0-9]/g, '');

  const showPass = (u, pass) => W.modal({
    size: 'sm', title: t('Новый пароль выдан'), sub: esc(u.name), icon: 'key', iconCls: 'ok',
    body: `<p class="t2">${t('Передайте данные сотруднику. Пароль показывается один раз — после закрытия окна его не будет видно.')}</p>
      <div class="card card-pad mt-16" style="box-shadow:none;background:var(--surface-2);font-size:15px"><div class="row" style="justify-content:space-between"><span class="muted">${t('Логин')}</span><b class="tnum">${esc(u.login)}</b></div>
      <div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('Пароль')}</span><b class="tnum" style="font-family:var(--font-d);letter-spacing:.04em">${esc(pass)}</b></div></div>`,
    foot: `<button class="btn" data-m="copy">${I('file')}${t('Скопировать')}</button><button class="btn primary" data-m="close">${t('Готово')}</button>`,
    actions: { copy: () => { navigator.clipboard && navigator.clipboard.writeText(`${t('Логин')}: ${u.login}\n${t('Пароль')}: ${pass}`).then(() => W.toast(t('Скопировано'))); } },
  });

  // общая форма сотрудника: из «Сотрудники» (директор — всё) и из «Зарплата» (бухгалтер — без доступа)
  W.employeeForm = (u, opt = {}) => {
    const isNew = !u, salaryOnly = !!opt.salaryOnly;
    u = u || { roles: [], active: true, salary: 0, advance: 0, protected: false, hired: W.today() };
    if (!isNew && u.protected && !salaryOnly && u.id !== W.me().id) return W.toast(t('Учётная запись защищена от изменений'), 'warn');
    const access = !salaryOnly ? `<div class="form-sec full">${t('Доступ в программу')}</div>
      ${W.fi({ name: 'login', label: t('Логин'), value: u.login || '', icon: 'user', ph: t('латиницей, например') + ' sklad2', hint: t('Пусто — сотрудник без доступа в программу') })}
      ${isNew ? W.fi({ name: 'pass', label: t('Пароль'), value: genPass(), icon: 'key', hint: t('Сгенерирован автоматически, можно заменить') }) : `<div class="field"><label>${t('Пароль')}</label><div class="muted" style="padding-top:10px">${t('Выдаётся кнопкой «Новый пароль»')}</div></div>`}
      <div class="full field"><label>${t('Роли')}</label><div class="chips-pick">${Object.entries(W.ROLES).map(([k, r]) => `<label class="chip-pick"><input type="checkbox" name="roles" data-multi value="${k}" ${u.roles.includes(k) ? 'checked' : ''}><span>${t(r.name)}</span></label>`).join('')}</div>
        <div class="hint">${t('Каждый сотрудник видит только разделы своей роли. Бухгалтер подтверждает банковские операции.')}</div></div>
      <div class="full">${W.fsw({ name: 'protected', label: t('Защищено — запретить изменение учётной записи'), checked: u.protected })}</div>` : '';
    W.modal({
      size: 'lg', title: isNew ? t('Новый сотрудник') : t('Редактировать сотрудника'), sub: isNew ? '' : esc(u.name), icon: 'userPlus',
      body: `<div class="form-grid">
        ${W.fi({ name: 'name', label: t('ФИО'), value: u.name || '', req: true, cls: 'full' })}
        ${W.fi({ name: 'position', label: t('Должность'), value: t(u.position || ''), req: true })}
        ${W.fi({ name: 'phone', label: t('Телефон'), value: u.phone || '', type: 'tel', ph: '+998', icon: 'phone' })}
        ${access}
        <div class="form-sec full">${t('Оплата труда')}</div>
        ${W.fi({ name: 'salary', label: t('Оклад в месяц'), money: true, value: u.salary || '', suffix: W.curLabel() })}
        ${W.fi({ name: 'advance', label: t('Аванс'), money: true, value: u.advance || '', suffix: W.curLabel() })}
        ${W.fi({ name: 'hired', label: t('Дата приёма'), type: 'date', value: u.hired || '' })}</div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Сохранить')}</button>`,
      actions: {
        input: (el, m) => { if (isNew && el.name === 'name' && !salaryOnly) { const l = m.el.querySelector('[name=login]'); if (!l.dataset.touched) l.value = translitLogin(el.value); } if (el.name === 'login') el.dataset.touched = 1; },
        save: async (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          if (d.advance > d.salary && d.salary > 0) return W.toast(t('Аванс не может быть больше оклада'), 'warn');
          if (!salaryOnly) {
            d.login = (d.login || '').trim().toLowerCase();
            if (d.login && !/^[a-z0-9._-]{3,}$/.test(d.login)) return W.toast(t('Логин — минимум 3 латинские буквы или цифры'), 'warn');
            if (d.login && W.db.users.some(x => x.id !== u.id && x.login === d.login)) return W.toast(t('Логин «{l}» уже занят', { l: d.login }), 'warn');
            if (d.login && !d.roles.length) return W.toast(t('Выберите хотя бы одну роль'), 'warn');
            if (u.id === W.me().id && !d.roles.includes('director') && u.roles.includes('director')) return W.toast(t('Нельзя снять с себя роль директора'), 'warn');
          }
          const changes = [];
          if (!isNew) {
            if (+u.salary !== +d.salary) changes.push(`${t('Оклад')}: ${W.fmtNum(u.salary)} → ${W.fmtNum(d.salary)}`);
            if (+u.advance !== +d.advance) changes.push(`${t('Аванс')}: ${W.fmtNum(u.advance)} → ${W.fmtNum(d.advance)}`);
            if (t(u.position || '') !== d.position) changes.push(`${t('Должность')}: ${t(u.position || '')} → ${d.position}`);
          }
          const pass = d.pass;
          // должность показывалась в переводе — если не меняли, оставляем исходную строку
          Object.assign(u, { name: d.name, position: d.position === t(u.position || '') ? u.position : d.position, phone: d.phone, salary: d.salary, advance: d.advance, hired: d.hired });
          if (!salaryOnly) Object.assign(u, { login: d.login, roles: d.login ? d.roles : [], protected: d.protected });
          if (isNew) {
            u.id = W.uid('u');
            if (u.login) u.pass = await W.passHash(u.login, pass);
            W.db.users.push(u);
            W.slog('create', 'employee', u.name, `${t('Новый сотрудник')}: ${u.position}${u.salary ? ', ' + t('оклад') + ' ' + W.fmtNum(u.salary) : ''}`);
          } else if (changes.length) W.slog('edit', 'employee', u.name, changes.join('; '));
          W.save(); m.close();
          W.toast(isNew ? t('Сотрудник добавлен') : t('Изменения сохранены'));
          if (isNew && u.login) setTimeout(() => showPass(u, pass), 250);
        },
      },
    });
  };

  const resetPass = async (u) => {
    if (u.protected) return W.toast(t('Учётная запись защищена от изменений'), 'warn');
    if (!await W.confirm({ title: t('Выдать новый пароль?'), text: t('Старый пароль сотрудника «{n}» перестанет работать.', { n: u.name }), ok: t('Выдать пароль'), danger: false, icon: 'key' })) return;
    const pass = genPass();
    u.pass = await W.passHash(u.login, pass); u.passAt = W.now();
    W.save(); showPass(u, pass);
  };

  const cards = () => {
    const S = st(), q = S.q.trim().toLowerCase(), me = W.me();
    const rows = W.db.users.filter(u => (S.seg === 'active' ? u.active : !u.active) && (!q || [u.name, t(u.position || ''), u.login, u.roles.map(W.roleName).join(' ')].join(' ').toLowerCase().includes(q)));
    if (!rows.length) return W.empty(t('Никого не нашли'), '', 'users');
    return `<div class="people">${rows.map(u => `<div class="person ${u.active ? '' : 'off'}">
      <div class="p-top"><div class="avatar lg" style="--av:${W.avatarBg(u.name)};width:54px;height:54px;border-radius:16px;font-size:18px">${W.initials(u.name)}</div>
        <div style="min-width:0;flex:1"><b class="ellipsis">${esc(u.name)}</b><span>${esc(t(u.position || ''))}</span></div>
        ${u.protected ? `<span class="badge info" title="${t('Защищено')}">${I('shieldCheck', 'ic-sm')}${t('Защищено')}</span>` : ''}</div>
      <dl class="p-meta"><dt>${t('Логин')}</dt><dd>${u.login ? `<span class="tnum">${esc(u.login)}</span>` : `<span class="muted">${t('нет доступа')}</span>`}</dd>
        <dt>${t('Роли')}</dt><dd><div class="tags">${u.roles.length ? u.roles.map(r => `<span class="tag brand">${W.roleName(r)}</span>`).join('') : '—'}</div></dd>
        <dt>${t('Телефон')}</dt><dd>${esc(u.phone || '—')}</dd>
        <dt>${t('Последний вход')}</dt><dd>${u.lastLogin ? W.fmtDT(u.lastLogin) : '—'}</dd></dl>
      <div class="p-foot">${u.protected && u.id !== me.id ? `<span class="muted" style="font-size:12.5px">${I('lock', 'ic-sm')} ${t('Изменения запрещены')}</span>` : `
        <button class="btn sm" data-a="edit" data-id="${u.id}">${I('edit')}${t('Изменить')}</button>
        ${u.login && u.id !== me.id ? `<button class="btn sm" data-a="pass" data-id="${u.id}">${I('key')}${t('Новый пароль')}</button>` : ''}
        ${u.id !== me.id ? (u.active ? `<button class="btn sm danger" data-a="off" data-id="${u.id}">${I('archive')}${t('В архив')}</button>` : `<button class="btn sm" data-a="on" data-id="${u.id}">${I('refresh')}${t('Восстановить')}</button>`) : `<span class="tag">${t('Это вы')}</span>`}`}</div>
    </div>`).join('')}</div>`;
  };

  W.page('staff', {
    render() {
      const S = st(), U = W.db.users, act = U.filter(u => u.active), off = U.filter(u => !u.active);
      return `<div class="page-head"><div><h1>${t('Сотрудники')}</h1><div class="sub">${t('Пользователи системы и их роли. Количество пользователей определяет директор.')}</div></div>
        <div class="actions"><button class="btn primary" data-a="add">${I('userPlus')}${t('Добавить сотрудника')}</button></div></div>
        <div class="kpis k3">
          ${W.kpi({ label: t('Всего сотрудников'), value: U.length, icon: 'users' })}
          ${W.kpi({ label: t('Активных'), value: act.length, icon: 'checkCircle', c: 'c-ok', foot: t('с доступом в программу: {n}', { n: act.filter(u => u.login).length }) })}
          ${W.kpi({ label: t('Деактивированных'), value: off.length, icon: 'archive', c: 'c-warn' })}
        </div>
        <div class="toolbar">${W.seg([{ id: 'active', label: t('Активные'), cnt: act.length }, { id: 'archive', label: t('Архив'), cnt: off.length }], S.seg, 'seg')}${W.searchBox(S.q, 'q', t('ФИО, должность, логин или роль'))}</div>
        <div data-region="list">${cards()}</div>`;
    },
    actions: {
      seg: el => { st().seg = el.dataset.v; W.refresh(); },
      q: el => { st().q = el.value; W.region('list', cards()); },
      add: () => W.employeeForm(),
      edit: el => W.employeeForm(W.db.users.find(u => u.id === el.dataset.id)),
      pass: el => resetPass(W.db.users.find(u => u.id === el.dataset.id)),
      off: async el => {
        const u = W.db.users.find(x => x.id === el.dataset.id);
        if (!await W.confirm({ title: t('Перевести в архив?'), text: t('«{n}» больше не сможет войти в программу. История сохранится.', { n: u.name }), ok: t('В архив') })) return;
        u.active = false; u.fired = W.today(); W.slog('archive', 'employee', u.name, t('Статус: активен → в архиве')); W.save(); W.toast(t('Сотрудник в архиве'));
      },
      on: el => { const u = W.db.users.find(x => x.id === el.dataset.id); u.active = true; delete u.fired; W.slog('restore', 'employee', u.name, t('Статус: в архиве → активен')); W.save(); W.toast(t('Сотрудник восстановлен')); },
    },
  });
})();
