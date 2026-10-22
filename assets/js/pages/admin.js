/* Управление → Администрирование (ТЗ 4.21) + перенос данных из Excel (ТЗ 4.9) */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const NUMS = [['sale', W.N('Продажа')], ['waybill', W.N('Накладная')], ['invoice', W.N('Счёт-фактура')], ['prod', W.N('Выпуск продукции')], ['purchase', W.N('Приход')], ['ret', W.N('Возврат')]];
  const nextOf = (k, start) => { const last = W.db.seq[k]; return (last == null || start > last) ? start : last + 1; };

  /* ---------- импорт из Excel / CSV ---------- */
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  let xlsxP = null;
  const loadXLSX = () => window.XLSX ? Promise.resolve(window.XLSX) : (xlsxP = xlsxP || new Promise((res, rej) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => res(window.XLSX); s.onerror = () => { xlsxP = null; rej(new Error('xlsx')); }; document.head.appendChild(s); }));
  const parseCSV = (text) => {
    const first = text.split(/\r?\n/)[0] || '';
    const d = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
      if (c === '"') q = true; else if (c === d) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(x => String(x).trim()));
  };
  const readTable = async (file) => {
    if (/\.(xlsx|xlsm|xls|ods)$/i.test(file.name)) {
      const X = await loadXLSX();
      const wb = X.read(await file.arrayBuffer(), { type: 'array' });
      return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' }).filter(r => r.some(x => String(x).trim()));
    }
    let txt = await file.text();
    return parseCSV(txt.replace(/^﻿/, ''));
  };
  // описание колонок: ключ → варианты заголовков (рус/узб)
  const SPEC = {
    products: { name: W.N('Товары (готовая продукция)'), cols: { name: ['наименование', 'название', 'товар', 'nomi', 'mahsulot'], cat: ['категория', 'раздел', 'kategoriya'], sku: ['артикул', 'код', 'sku', 'artikul'], price: ['цена', 'цена за шт', 'narx', 'narxi'], stock: ['остаток', 'количество', 'кол-во', 'qoldiq', 'soni'], min: ['мин. порог', 'минимальный порог', 'порог', 'min'] } },
    materials: { name: W.N('Сырьё и материалы'), cols: { name: ['наименование', 'название', 'сырьё', 'nomi'], unit: ['ед.', 'ед', 'единица', 'birlik'], price: ['цена', 'narx'], stock: ['остаток', 'количество', 'qoldiq'], safety: ['страховой порог', 'порог', 'страховой запас'] } },
    customers: { name: W.N('Контрагенты'), cols: { name: ['наименование', 'название', 'клиент', 'nomi'], type: ['тип', 'тип контрагента', 'turi'], inn: ['инн', 'stir', 'inn'], contact: ['директор', 'контакт', 'контактное лицо', 'директор или контактное лицо'], phone: ['телефон', 'tel', 'telefon'], address: ['адрес', 'manzil'] } },
    suppliers: { name: W.N('Поставщики'), cols: { name: ['наименование', 'название', 'поставщик', 'nomi'], inn: ['инн', 'stir', 'inn'], phone: ['телефон', 'telefon'], contact: ['контакт', 'контактное лицо'], bank: ['банк', 'bank'], account: ['р/с', 'расчётный счёт', 'расчетный счет', 'счёт', 'hisob raqam'], mfo: ['мфо', 'mfo'] } },
  };
  const mapHeader = (head, spec) => {
    const m = {};
    head.forEach((h, i) => { const n = String(h).trim().toLowerCase().replace(/\s+/g, ' '); Object.entries(spec.cols).forEach(([k, al]) => { if (m[k] == null && al.includes(n)) m[k] = i; }); });
    return m;
  };
  const templateCSV = kind => {
    const H = { products: ['Наименование', 'Категория', 'Артикул', 'Цена', 'Остаток', 'Мин. порог'], materials: ['Наименование', 'Ед.', 'Цена', 'Остаток', 'Страховой порог'], customers: ['Наименование', 'Тип', 'ИНН', 'Контакт', 'Телефон', 'Адрес'], suppliers: ['Наименование', 'ИНН', 'Телефон', 'Контакт', 'Банк', 'Р/с', 'МФО'] }[kind];
    const ex = { products: [['Эмаль ПФ-115 зелёная, 2,8 кг', 'Эмали', 'EM-115-G28', 94000, 120, 30]], materials: [['Пигмент зелёный', 'кг', 81000, 40, 20]], customers: [['ООО «Пример»', 'Юридическое лицо', '300 000 000', 'Иванов И.', '+998 90 000-00-00', 'г. Ташкент']], suppliers: [['ООО «Поставщик»', '300 000 001', '+998 71 000-00-00', 'Петров П.', 'АКБ «Банк»', '2020 8000 0000 0000 0001', '00000']] }[kind];
    W.downloadCSV(t('Шаблон') + ' — ' + t(SPEC[kind].name), H, ex);
  };
  const doImport = (kind, rows, map) => {
    const g = (r, k) => map[k] != null ? String(r[map[k]] ?? '').trim() : '';
    const num = (r, k) => W.parseNum(g(r, k));
    let added = 0, updated = 0;
    const at = W.now();
    rows.forEach(r => {
      const name = g(r, 'name'); if (!name) return;
      if (kind === 'products') {
        let cat = null; const cn = g(r, 'cat');
        if (cn) { let c = W.db.categories.find(x => x.name.toLowerCase() === cn.toLowerCase()); if (!c) { c = { id: W.uid('c'), name: cn }; W.db.categories.push(c); } cat = c.id; }
        let p = W.db.products.find(x => x.name.toLowerCase() === name.toLowerCase() || (g(r, 'sku') && x.sku === g(r, 'sku')));
        if (p) { updated++; Object.assign(p, { price: num(r, 'price') || p.price, cat: cat || p.cat, sku: g(r, 'sku') || p.sku }); }
        else { added++; p = { id: W.uid('p'), name, cat, sku: g(r, 'sku'), price: num(r, 'price'), color: '#6a5cff', pack: /\b(1[0-9]|2[0-9])\s*кг/i.test(name) ? 'bucket' : 'can', minStock: g(r, 'min') ? num(r, 'min') : null, noShip: false, photo: '' }; W.db.products.push(p); }
        if (map.stock != null && g(r, 'stock') !== '') { const diff = W.round(num(r, 'stock') - W.stock('p', p.id, 'main'), 3); if (diff) W.move('p', p.id, 'main', diff, 'adjust', null, t('Перенос из Excel'), at); }
      } else if (kind === 'materials') {
        let m = W.db.materials.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (m) { updated++; Object.assign(m, { price: num(r, 'price') || m.price, unit: g(r, 'unit') || m.unit, safety: g(r, 'safety') ? num(r, 'safety') : m.safety }); }
        else { added++; m = { id: W.uid('m'), name, unit: g(r, 'unit') || 'кг', price: num(r, 'price'), safety: num(r, 'safety'), sup: null }; W.db.materials.push(m); }
        if (map.stock != null && g(r, 'stock') !== '') { const diff = W.round(num(r, 'stock') - W.stock('m', m.id, 'raw'), 3); if (diff) W.move('m', m.id, 'raw', diff, 'adjust', null, t('Перенос из Excel'), at); }
      } else if (kind === 'customers') {
        const inn = g(r, 'inn'), tp = g(r, 'type').toLowerCase();
        const type = /ип|yatt/.test(tp) ? 'ip' : /физ|jismoniy/.test(tp) ? 'person' : 'legal';
        const c = W.db.customers.find(x => (inn && x.inn && x.inn.replace(/\D/g, '') === inn.replace(/\D/g, '')) || x.name.toLowerCase() === name.toLowerCase());
        const d = { name, type, inn, contact: g(r, 'contact'), phone: g(r, 'phone'), address: g(r, 'address') };
        if (c) { updated++; Object.keys(d).forEach(k => { if (d[k]) c[k] = d[k]; }); } else { added++; W.db.customers.push(Object.assign({ id: W.uid('k'), regular: false, created: W.today() }, d)); }
      } else {
        const inn = g(r, 'inn');
        const s = W.db.suppliers.find(x => (inn && x.inn && x.inn.replace(/\D/g, '') === inn.replace(/\D/g, '')) || x.name.toLowerCase() === name.toLowerCase());
        const d = { name, inn, phone: g(r, 'phone'), contact: g(r, 'contact'), bank: g(r, 'bank'), account: g(r, 'account'), mfo: g(r, 'mfo') };
        if (s) { updated++; Object.keys(d).forEach(k => { if (d[k]) s[k] = d[k]; }); } else { added++; W.db.suppliers.push(Object.assign({ id: W.uid('sp') }, d)); }
      }
    });
    return { added, updated };
  };
  const importDialog = () => {
    let table = null;
    const m = W.modal({
      size: 'lg', title: t('Перенос данных из Excel'), sub: t('Файлы .xlsx, .xls или .csv — первая строка с заголовками'), icon: 'upload',
      body: `<div class="form-grid">
        ${W.fs({ name: 'kind', label: t('Что загружаем'), options: Object.entries(SPEC).map(([k, v]) => [k, t(v.name)]) })}
        <div class="field"><label>${t('Файл')}</label><label class="btn" style="justify-content:flex-start">${I('upload')}<span class="fname">${t('Выбрать файл…')}</span><input type="file" class="hidden" accept=".xlsx,.xls,.xlsm,.ods,.csv,.txt" data-file></label></div>
        <div class="full hint">${t('Колонки распознаются по заголовкам. Совпадения по названию или ИНН обновляются, новые позиции добавляются. Остатки выставляются инвентаризацией.')} <a href="javascript:void 0" data-m="tpl">${t('Скачать шаблон')}</a></div></div>
        <div class="preview mt-16"></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="go" disabled>${I('check')}${t('Загрузить данные')}</button>`,
      onMount: el => el.querySelector('[data-file]').addEventListener('change', async e => {
        const f = e.target.files[0]; if (!f) return;
        el.querySelector('.fname').textContent = f.name;
        el.querySelector('.preview').innerHTML = `<div class="muted">${t('Читаю файл…')}</div>`;
        try { table = await readTable(f); draw(); }
        catch (er) { table = null; el.querySelector('.preview').innerHTML = W.empty(t('Не удалось прочитать файл'), er.message === 'xlsx' ? t('Нет связи для чтения Excel — сохраните файл как CSV') : '', 'alert'); }
      }),
      actions: {
        tpl: () => templateCSV(W.form(m.el).kind),
        change: el => { if (el.name === 'kind' && table) draw(); },
        go: (b, mm) => {
          const kind = W.form(mm.el).kind, map = mapHeader(table[0], SPEC[kind]);
          const r = doImport(kind, table.slice(1), map);
          W.save(); mm.close(); W.toast(t('Загружено: добавлено {a}, обновлено {b}', { a: r.added, b: r.updated }));
        },
      },
    });
    const draw = () => {
      const kind = W.form(m.el).kind, spec = SPEC[kind], map = mapHeader(table[0] || [], spec);
      const ok = map.name != null, rows = table.slice(1);
      m.el.querySelector('[data-m=go]').disabled = !ok || !rows.length;
      const keys = Object.keys(spec.cols).filter(k => map[k] != null);
      m.el.querySelector('.preview').innerHTML = !ok ? W.empty(t('Не найдена колонка «Наименование»'), t('Проверьте первую строку файла или скачайте шаблон'), 'alert')
        : `<div class="row mb-16" style="margin-bottom:10px"><span class="badge ok">${t('Строк: {n}', { n: rows.length })}</span>${Object.keys(spec.cols).map(k => `<span class="tag ${map[k] != null ? 'brand' : ''}">${map[k] != null ? '✓' : '—'} ${esc(spec.cols[k][0])}</span>`).join('')}</div>
          <div class="card" style="box-shadow:none;max-height:300px;overflow:auto">${W.table({ cols: keys.map((k, i) => ({ label: spec.cols[k][0], title: i === 0, render: r => esc(String(r[map[k]] ?? '')) })), rows: rows.slice(0, 12) })}</div>
          ${rows.length > 12 ? `<div class="hint mt-8">${t('…и ещё {n} строк', { n: rows.length - 12 })}</div>` : ''}`;
    };
  };

  /* ---------- страница ---------- */
  let draft = null;
  const dirty = () => draft && JSON.stringify(draft) !== JSON.stringify(pickSettings());
  const pickSettings = () => { const s = W.db.settings; return { company: Object.assign({}, s.company), currency: s.currency, usdRate: s.usdRate, numbering: Object.assign({}, s.numbering), lowStock: s.lowStock }; };
  const savebar = () => dirty() ? `<div class="savebar">${I('alert')}<span style="flex:1">${t('Есть несохранённые изменения')}</span><button class="btn sm ghost" style="color:#fff" data-a="undo">${t('Отменить')}</button><button class="btn sm primary" data-a="save">${I('check')}${t('Сохранить')}</button></div>` : '';

  W.page('admin', {
    render() {
      if (!draft) draft = pickSettings();
      const c = draft.company, f = (k, label, o = {}) => `<div class="field ${o.cls || ''}"><label>${label}</label><input class="inp" data-on="co" data-k="${k}" value="${esc(c[k] || '')}" ${o.type ? `type="${o.type}"` : ''} placeholder="${esc(o.ph || '')}"></div>`;
      return `<div class="page-head"><div><h1>${t('Администрирование')}</h1><div class="sub">${t('Базовые настройки программы. Реквизиты подставляются в документы и отчёты.')}</div></div>
        <div class="actions"><button class="btn primary" data-a="save">${I('check')}${t('Сохранить настройки')}</button></div></div>
        <div class="card card-pad">
          <div class="set-row"><div><h4>${t('Реквизиты компании')}</h4><p>${t('Отображаются в накладных, счетах-фактурах и отчётах')}</p></div>
            <div class="form-grid">${f('name', t('Название организации'), { cls: 'full' })}${f('inn', t('ИНН'))}${f('director', t('Директор'))}${f('phone', t('Телефон'), { type: 'tel' })}${f('email', 'E-mail', { type: 'email' })}${f('address', t('Адрес'), { cls: 'full' })}
              ${f('bank', t('Банк'))}${f('mfo', t('МФО'))}${f('account', t('Расчётный счёт'), { cls: 'full' })}</div></div>
          <div class="set-row"><div><h4>${t('Параметры учёта')}</h4><p>${t('Валюта, курс и порог «заканчивается на складе»')}</p></div>
            <div class="form-grid">
              <div class="field"><label>${t('Базовая валюта')}</label><select class="inp" data-on="cur">${W.opts([['UZS', t('Узбекский сум (UZS)')], ['USD', t('Доллар США (USD)')]], draft.currency)}</select></div>
              <div class="field"><label>${t('Курс доллара (по умолчанию)')}</label><div class="inp-wrap has-suffix"><input class="inp num" data-on="rate" data-money inputmode="decimal" value="${W.fmtNum(draft.usdRate, 2)}"><span class="suffix">${t('сум')}</span></div></div>
              <div class="field"><label>${t('Порог «заканчивается на складе»')}</label><div class="inp-wrap has-suffix"><input class="inp num" data-on="low" inputmode="numeric" value="${draft.lowStock}"><span class="suffix">${t('шт')}</span></div><div class="hint">${t('Для товаров без своего минимального порога')}</div></div></div></div>
          <div class="set-row"><div><h4>${t('Нумерация документов')}</h4><p>${t('Первый новый документ получит стартовый номер, дальше номера идут по возрастанию')}</p></div>
            <div class="form-grid g3">${NUMS.map(([k, n]) => `<div class="field"><label>${t(n)}</label><input class="inp num" data-on="num" data-k="${k}" inputmode="numeric" value="${draft.numbering[k]}"><div class="hint">${t('следующий: №{n}', { n: W.no(nextOf(k, +draft.numbering[k] || 1)) })}</div></div>`).join('')}</div></div>
        </div>
        <div class="grid g-2 mt-16">
          <div class="card card-pad"><div class="row nw"><div class="kpi-ic c-ok">${I('upload')}</div><div><h3 style="font-size:16px">${t('Перенос данных из Excel')}</h3><div class="muted" style="font-size:13px">${t('Товары, сырьё, контрагенты и поставщики из ваших таблиц')}</div></div></div>
            <div class="row mt-16"><button class="btn primary" data-a="import">${I('upload')}${t('Загрузить файл')}</button><button class="btn" data-a="tpl">${I('download')}${t('Шаблоны')}</button></div></div>
          <div class="card card-pad"><div class="row nw"><div class="kpi-ic">${I('database')}</div><div><h3 style="font-size:16px">${t('Данные программы')}</h3><div class="muted" style="font-size:13px">${t('Резервная копия хранится у вас в файле JSON')}</div></div></div>
            <div class="row mt-16"><button class="btn" data-a="backup">${I('download')}${t('Резервная копия')}</button><label class="btn">${I('upload')}${t('Восстановить')}<input type="file" accept=".json" class="hidden" data-change="restore"></label><button class="btn danger" data-a="reset">${I('refresh')}${t('Сбросить демо-данные')}</button></div></div>
        </div>
        <div data-region="savebar">${savebar()}</div>`;
    },
    actions: {
      co: el => { draft.company[el.dataset.k] = el.value; W.region('savebar', savebar()); },
      cur: el => { draft.currency = el.value; W.region('savebar', savebar()); },
      rate: el => { draft.usdRate = W.parseNum(el.value); W.region('savebar', savebar()); },
      low: el => { draft.lowStock = Math.max(0, Math.round(W.parseNum(el.value))); W.region('savebar', savebar()); },
      num: el => { draft.numbering[el.dataset.k] = Math.max(1, Math.round(W.parseNum(el.value)) || 1); el.closest('.field').querySelector('.hint').textContent = t('следующий: №{n}', { n: W.no(nextOf(el.dataset.k, draft.numbering[el.dataset.k])) }); W.region('savebar', savebar()); },
      undo: () => { draft = null; W.refresh(); },
      save: () => {
        if (!draft.company.name) return W.toast(t('Укажите название организации'), 'warn');
        Object.assign(W.db.settings, { company: draft.company, currency: draft.currency, usdRate: draft.usdRate, numbering: draft.numbering, lowStock: draft.lowStock });
        draft = null; W.save(); W.toast(t('Настройки сохранены'));
      },
      import: () => importDialog(),
      tpl: () => W.modal({ size: 'sm', title: t('Шаблоны для загрузки'), icon: 'download', body: Object.entries(SPEC).map(([k, v]) => `<button class="pop-item" data-m="dl" data-k="${k}"><span class="pi-ic">${I('file', 'ic-sm')}</span>${t(v.name)}</button>`).join(''), actions: { dl: b => templateCSV(b.dataset.k) } }),
      backup: () => { W.downloadFile(`winner-backup-${W.today()}.json`, JSON.stringify(W.db)); W.toast(t('Резервная копия скачана')); },
      restore: async el => {
        const f = el.files[0]; if (!f) return;
        try {
          const d = JSON.parse(await f.text());
          if (!d || !d.settings || !Array.isArray(d.sales)) throw new Error('bad');
          if (!await W.confirm({ title: t('Восстановить из копии?'), text: t('Текущие данные будут заменены данными из файла {n}.', { n: esc(f.name) }), ok: t('Восстановить') })) return;
          d.v = W.DB_VERSION; W.db = d; W.save(); W.toast(t('Данные восстановлены'));
        } catch (e) { W.toast(t('Файл не похож на резервную копию WINNER'), 'err'); }
      },
      reset: async () => {
        if (!await W.confirm({ title: t('Сбросить демо-данные?'), text: t('Все изменения будут удалены, программа вернётся к демонстрационным данным.'), ok: t('Сбросить') })) return;
        const me = W.me(); W.resetDemo(); if (!W.db.users.some(u => u.id === me.id)) return W.logout(); W.toast(t('Демо-данные восстановлены')); W.refresh();
      },
    },
  });
  // уходя со страницы с несохранёнными правками — черновик сбрасываем
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/admin')) draft = null; });
})();
