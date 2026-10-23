/* =========================================================================
   WINNER — тестовые данные "SAVER PAINTS" MCHJ для проверки программы:
   10 товаров в разных состояниях, 20 видов сырья с калькуляцией,
   3 продажи на разных стадиях, 4 расхода, зарплата 4 сотрудникам.
   Даты отсчитываются от сегодняшнего дня. Создаются один раз при первом входе.
   Сброс: Администрирование → «Сбросить демо-данные» или W.resetDemo().
   ========================================================================= */
(function () {
  const W = window.W;
  const N = W.N;

  W.seed = () => {
    const today = W.today();
    const now = W.now();
    let idn = 0;
    const id = p => p + (++idn).toString(36);
    // день d (0 — сегодня, −1 — вчера) и время; сегодняшнее время не позже текущего
    const at = (d, hm) => {
      let v = `${W.addDays(today, d)}T${hm}`;
      if (v > now) { const x = W.parse(now); x.setMinutes(x.getMinutes() - 20 - idn % 30); v = W.isoAt(x); }
      return v;
    };

    /* ---------- справочники ---------- */
    const settings = {
      company: { name: '"SAVER PAINTS" MCHJ', inn: '307 456 812', director: 'Рахимов Азиз Бахтиярович', phone: '+998 71 200-45-45', email: 'info@saverpaints.uz',
        address: 'г. Ташкент, Сергелийский р-н, ул. Янги Сергели, 15', bank: 'АКБ «Kapitalbank»', account: '2020 8000 6051 1207 3001', mfo: '01088' },
      currency: 'UZS', usdRate: 12780,
      numbering: { sale: 1001, waybill: 1, invoice: 1, prod: 1, purchase: 1, ret: 1 },
      lowStock: 10,
      expenseCats: [N('Аренда'), N('Коммунальные услуги'), N('Транспорт и логистика'), N('Хозяйственные расходы'), N('Ремонт оборудования'), N('Налоги и сборы'), N('Реклама и маркетинг'), N('Связь и интернет'), N('Прочее')],
    };

    const U = (o) => Object.assign({ phone: '', active: true, protected: false, login: '', pass: '', roles: [], salary: 0, advance: 0, hired: W.addDays(today, -400) }, o);
    const users = [
      U({ id: 'u_dir', name: 'Рахимов Азиз Бахтиярович', position: N('Директор'), roles: ['director'], login: 'director', pass: '7b006700a466fe3255b9222066b244f5c0675faebc0f5c0bddc87e3c31bf1198', protected: true, salary: 15000000, advance: 5000000, phone: '+998 90 100-45-45', hired: W.addDays(today, -1400) }),
      U({ id: 'u_buh', name: 'Юсупова Дилноза Рустамовна', position: N('Главный бухгалтер'), roles: ['accountant'], login: 'buh', pass: '5eb7b2dcee122e1abec54be450e4fae41aee66c59c905bede2af47cf55e97d89', salary: 8000000, advance: 3000000, phone: '+998 93 241-18-07' }),
      U({ id: 'u_men', name: 'Назарова Севара Алишеровна', position: N('Менеджер по продажам'), roles: ['manager'], login: 'menejer', pass: '081ec7893af89385662701fba2a00f61548625fd0ccaec6271ec5e94cef0c5bb', salary: 6000000, advance: 2000000, phone: '+998 97 715-30-62' }),
      U({ id: 'u_sel', name: 'Каримова Малика Шухратовна', position: N('Продавец-консультант'), roles: ['seller'], login: 'magazin', pass: 'b4aaa3ea571cfa7ec57e161451289fc534ec06c7e6ddf65086c3b89528f10f72', salary: 4500000, advance: 1500000, phone: '+998 99 402-77-15' }),
      U({ id: 'u_skl', name: 'Тошпулатов Жасур Тимурович', position: N('Кладовщик'), roles: ['storekeeper'], login: 'sklad', pass: 'e3bdc74acaf27ebb893d7cd17de6e2261f586f50be1be9da2b3360ca6c931f47', salary: 5000000, advance: 2000000, phone: '+998 90 318-64-29' }),
      U({ id: 'u_tex', name: 'Абдуллаев Шерзод Камолович', position: N('Технолог производства'), roles: ['technologist'], login: 'texnolog', pass: '85d5861ab9824dff9abb7d7e27b7d78b5f17916ad729882f79728e1463144c3d', salary: 7000000, advance: 2500000, phone: '+998 94 556-12-80' }),
      U({ id: 'u_w1', name: 'Холматов Улугбек Анварович', position: N('Оператор смесителя'), salary: 4200000, advance: 1500000, phone: '+998 91 120-33-47' }),
      U({ id: 'u_w2', name: 'Сафарова Нигора Бахтиёровна', position: N('Фасовщица'), salary: 3800000, advance: 1200000, phone: '+998 93 870-11-52' }),
      U({ id: 'u_w3', name: 'Исмоилов Бекзод Равшанович', position: N('Грузчик'), salary: 3500000, advance: 1000000, phone: '+998 97 333-90-14' }),
    ];

    const categories = [
      { id: 'c1', name: N('Эмали') }, { id: 'c2', name: N('Водоэмульсионные краски') }, { id: 'c3', name: N('Лаки') },
      { id: 'c4', name: N('Грунтовки') }, { id: 'c5', name: N('Типографские краски') }, { id: 'c6', name: N('Мастики') },
    ];
    // 10 товаров: в норме, мало, нет в наличии, «не отгружать без остатка», без категории
    const Pr = (id, name, cat, price, color, pack, minStock, noShip, sku) => ({ id, name, cat, price, color, pack, minStock, noShip: !!noShip, sku, photo: '' });
    const products = [
      Pr('p1', 'Эмаль ПФ-115 белая, 2,8 кг', 'c1', 92000, '#eef1f5', 'can', 30, 0, 'EM-115-W28'),
      Pr('p2', 'Эмаль ПФ-115 красная, 0,9 кг', 'c1', 32000, '#d7262e', 'can', 20, 0, 'EM-115-R09'),
      Pr('p3', 'Краска ВД-АК фасадная белая, 25 кг', 'c2', 465000, '#d9e3ee', 'bucket', 10, 1, 'VD-FAS-25'),
      Pr('p4', 'Краска интерьерная моющаяся, 14 кг', 'c2', 298000, '#7ec8e3', 'bucket', 10, 0, 'VD-INT-14'),
      Pr('p5', 'Лак ПФ-283 бесцветный, 0,8 л', 'c3', 41000, '#c98a2b', 'can', 20, 0, 'LK-283-08'),
      Pr('p6', 'Грунтовка ГФ-021 серая, 2,7 кг', 'c4', 64000, '#8b929c', 'can', 20, 0, 'GR-021-27'),
      Pr('p7', 'Краска офсетная голубая (Cyan), 1 кг', 'c5', 145000, '#00a3e0', 'can', 10, 1, 'OF-C-01'),
      Pr('p8', 'Краска офсетная чёрная (Black), 2,5 кг', 'c5', 268000, '#15171c', 'can', 10, 0, 'OF-K-25'),
      Pr('p9', 'Мастика битумная, 18 кг', 'c6', 210000, '#2f3136', 'bucket', 8, 0, 'MS-BIT-18'),
      Pr('p10', 'Колер универсальный «Охра», 100 мл', null, 12000, '#c8862f', 'can', 20, 0, 'KL-OXR-01'),
    ];
    // 20 видов сырья и тары; остаток — для проверки статусов «хватает / ниже порога / не хватает»
    const Mt = (id, name, unit, price, safety, sup, stock) => ({ id, name, unit, price, safety, sup, stock });
    const materials = [
      Mt('m1', 'Диоксид титана', N('кг'), 32000, 300, 's1', 950), Mt('m2', 'Мел молотый МТД-2', N('кг'), 1800, 800, 's3', 2400),
      Mt('m3', 'Акриловая дисперсия', N('кг'), 21000, 400, 's2', 1200), Mt('m4', 'Алкидная смола ПФ-060', N('кг'), 26000, 400, 's2', 380),
      Mt('m5', 'Уайт-спирит', N('л'), 11500, 300, 's4', 900), Mt('m6', 'Пигмент железоокисный красный', N('кг'), 38000, 40, 's1', 85),
      Mt('m7', 'Пигмент фталоцианиновый синий', N('кг'), 95000, 20, 's1', 12), Mt('m8', 'Пигмент жёлтый', N('кг'), 72000, 25, 's1', 60),
      Mt('m9', 'Сажа техническая', N('кг'), 24000, 30, 's1', 75), Mt('m10', 'Сиккатив', N('кг'), 45000, 20, 's1', 48),
      Mt('m11', 'Загуститель', N('кг'), 68000, 15, 's1', 30), Mt('m12', 'Биоцид', N('кг'), 54000, 10, 's1', 22),
      Mt('m13', 'Битум нефтяной', N('кг'), 7500, 500, 's4', 1800), Mt('m14', 'Лаковая основа', N('кг'), 31000, 150, 's2', 420),
      Mt('m15', 'Ацетон технический', N('л'), 16000, 100, 's4', 260), Mt('m16', 'Ведро пластиковое 25 кг', N('шт'), 14000, 150, 's5', 64),
      Mt('m17', 'Ведро пластиковое 10–14 кг', N('шт'), 9500, 200, 's5', 340), Mt('m18', 'Банка металлическая 2,8 кг', N('шт'), 5200, 500, 's5', 1200),
      Mt('m19', 'Банка металлическая 0,9 кг', N('шт'), 3100, 800, 's5', 1500), Mt('m20', 'Этикетка самоклеящаяся', N('шт'), 350, 2000, 's6', 6000),
    ];
    const R = (...rows) => rows.map(([m, qty, note = '']) => ({ m, qty, note }));
    const recipes = {
      p1: R(['m4', 1.25], ['m1', 0.62], ['m5', 0.78], ['m10', 0.04, 'вводить в конце'], ['m18', 1], ['m20', 1]),
      p2: R(['m4', 0.42], ['m6', 0.09], ['m2', 0.08], ['m5', 0.28], ['m10', 0.012], ['m19', 1], ['m20', 1]),
      p3: R(['m3', 7.5], ['m1', 3.2], ['m2', 12.5], ['m11', 0.18], ['m12', 0.05], ['m16', 1], ['m20', 1]),
      p4: R(['m3', 4.6], ['m1', 1.9], ['m2', 6.8], ['m11', 0.1], ['m12', 0.03], ['m17', 1], ['m20', 1]),
      p5: R(['m4', 0.52], ['m5', 0.25], ['m10', 0.015], ['m19', 1], ['m20', 1]),
      p6: R(['m4', 1.0], ['m2', 0.95], ['m6', 0.12], ['m5', 0.6], ['m18', 1], ['m20', 1]),
      p7: R(['m14', 0.62], ['m7', 0.18, 'перетир 40 мин'], ['m4', 0.15], ['m19', 1], ['m20', 1]),
      p8: R(['m14', 1.55], ['m9', 0.45], ['m4', 0.4], ['m15', 0.05], ['m18', 1], ['m20', 1]),
      p9: R(['m13', 15.5], ['m5', 2.2], ['m16', 1], ['m20', 1]),
    };

    const C = (id, name, type, inn, contact, phone, address, regular) => ({ id, name, type, inn, contact, phone, address, regular: !!regular, created: W.addDays(today, -200) });
    const customers = [
      C('k1', 'ООО «Qurilish Invest Group»', 'legal', '305 482 917', 'Ахмедов Ботир (директор)', '+998 90 177-45-12', 'г. Ташкент, Яккасарайский р-н, ул. Шота Руставели, 41', 1),
      C('k2', 'ИП «Каримов Бахром»', 'ip', '412 118 506', 'Каримов Бахром', '+998 93 512-08-44', 'г. Ташкент, рынок «Джамбул», ряд 7', 1),
      C('k3', 'ООО «Print House Media»', 'legal', '307 115 842', 'Ли Виктор (директор)', '+998 71 233-55-10', 'г. Ташкент, Чиланзарский р-н, ул. Бунёдкор, 12', 0),
      C('k4', 'Абдурахманов Тимур', 'person', '', 'Абдурахманов Тимур', '+998 99 812-45-67', 'г. Ташкент, Юнусабад-14, д. 22, кв. 9', 0),
    ];
    const S = (id, name, inn, phone, contact, bank, account, mfo) => ({ id, name, inn, phone, contact, bank, account, mfo });
    const suppliers = [
      S('s1', 'ООО «Kimyo Trade Invest»', '302 451 778', '+998 71 205-14-40', 'Зокиров Алишер', 'АКБ «Kapitalbank»', '2020 8000 4051 2384 1001', '01088'),
      S('s2', 'АО «Polimer Resurs»', '303 118 562', '+998 71 289-03-17', 'Ганиева Феруза', 'АКБ «Hamkorbank»', '2020 8000 9004 1123 7002', '00083'),
      S('s3', 'ООО «Angren Mineral»', '304 662 905', '+998 70 615-22-48', 'Турсунов Бахтиёр', 'АКБ «Ipoteka-bank»', '2020 8000 3002 8761 4003', '00423'),
      S('s4', 'ООО «Neft Kimyo Savdo»', '305 207 391', '+998 71 140-77-35', 'Расулов Фарход', 'АКБ «SQB»', '2020 8000 1005 6672 9004', '00440'),
      S('s5', 'ООО «Tara Pak Plast»', '306 890 123', '+998 95 177-08-60', 'Сайдалиев Жахонгир', 'АКБ «Asaka bank»', '2020 8000 7001 3349 5005', '00873'),
      S('s6', 'ИП «Label Print Service»', '411 305 674', '+998 93 388-21-09', 'Мухаммадиев Сардор', 'АКБ «Orient Finans»', '2020 8000 2003 9917 6006', '01071'),
    ];

    const db = {
      v: W.DB_VERSION, created: now, seq: { sale: null, waybill: null, invoice: null, prod: null, purchase: null, ret: null },
      settings, users, customers, suppliers, categories, products, materials: materials.map(({ stock, ...m }) => m), recipes,
      moves: [], sales: [], payments: [], returns: [], cash: [], bank: [], expenses: [], purchases: [], prodOrders: [],
      accruals: [], payouts: [], salaryLog: [],
    };

    /* ---------- помощники ---------- */
    const mv = (t, item, wh, qty, kind, ref, a, by, note = '') => db.moves.push({ id: id('mv'), at: a, t, item, wh, qty, kind, ref, note, by });
    const cash = (acc, dir, amount, a, kind, ref, note, by) => db.cash.push({ id: id('c'), at: a, acc, dir, amount, kind, ref, note, by });
    const bankOp = (dir, amount, a, desc, party, num, kind, ref, by, confirmed) => {
      const log = [{ at: a, by, act: 'create' }];
      if (confirmed) log.push({ at: a, by: 'u_buh', act: 'confirm' });
      db.bank.push({ id: id('bk'), at: a, dir, desc, party, num, amount, status: confirmed ? 'confirmed' : 'pending', kind, ref, by, log, confirmedBy: confirmed ? 'u_buh' : null, confirmedAt: confirmed ? a : null });
    };
    const money = (method, dir, amount, a, kind, ref, note, party, num, by, confirmed) => {
      if (method === 'transfer') bankOp(dir, amount, a, note, party, num, kind, ref, by, confirmed);
      else cash(method, dir, amount, a, kind, ref, note, by);
    };

    /* ---------- начальные остатки (10 дней назад) ---------- */
    const a0 = `${W.addDays(today, -10)}T08:00`;
    const start = N('Остаток на начало');
    materials.forEach(m => mv('m', m.id, 'raw', m.stock, 'init', null, a0, 'u_skl', start));
    const stock = { // склад производства, основной склад, магазин
      p1: [40, 120, 18], p2: [0, 6, 2], p3: [6, 12, 0], p4: [0, 0, 0], p5: [20, 64, 14],
      p6: [0, 45, 9], p7: [0, 5, 0], p8: [8, 22, 0], p9: [30, 10, 0], p10: [0, 60, 40],
    };
    Object.entries(stock).forEach(([p, q]) => ['prod', 'main', 'shop'].forEach((wh, i) => { if (q[i]) mv('p', p, wh, q[i], 'init', null, a0, 'u_skl', start); }));
    cash('cash', 1, 15000000, a0, 'manual', null, start, 'u_buh');
    cash('card', 1, 2000000, a0, 'manual', null, start, 'u_buh');
    cash('corp', 1, 5000000, a0, 'manual', null, start, 'u_buh');
    bankOp(1, 120000000, a0, 'Остаток на расчётном счёте на начало периода', settings.company.bank, '', 'manual', null, 'u_buh', true);

    /* ---------- 3 продажи на разных стадиях ---------- */
    const sale = (no, a, channel, source, cust, items, stage, by) => {
      const k = customers.find(c => c.id === cust);
      const s = { id: id('s'), no, at: a, channel, source, cust: cust || null, name: k ? k.contact : '', phone: k ? k.phone : '', address: k ? k.address : '',
        items: items.map(([p, qty, price]) => ({ p, qty, price: price || products.find(x => x.id === p).price })), discount: 0,
        stage, stageLog: [{ stage: 'new', at: a, by }], shipped: false, note: '', by };
      s.total = W.sum(s.items, i => i.qty * i.price);
      db.sales.push(s);
      return s;
    };
    const ship = (s, a) => { s.items.forEach(i => mv('p', i.p, s.channel, -i.qty, 'sale', s.id, a, 'u_skl')); s.shipped = true; s.shippedAt = a; };
    const pay = (s, method, amount, a, by, confirmed) => {
      db.payments.push({ id: id('pay'), at: a, sale: s.id, method, amount, by });
      money(method, 1, amount, a, 'sale', s.id, `Оплата по продаже №${W.no(s.no)}`, s.cust ? customers.find(c => c.id === s.cust).name : 'Розничный покупатель', W.no(s.no), by, confirmed);
    };
    // №1001 — магазин, выдан покупателю, оплачен полностью наличными
    const s1 = sale(1001, at(0, '10:15'), 'shop', 'walkin', null, [['p1', 2], ['p10', 3]], 'done', 'u_sel');
    s1.stageLog = [{ stage: 'done', at: s1.at, by: 'u_sel' }];
    ship(s1, s1.at); pay(s1, 'cash', s1.total, s1.at, 'u_sel');
    // №1002 — заказ по телефону со склада, на сборке, оплачен частично переводом (ждёт подтверждения бухгалтера)
    const s2 = sale(1002, at(0, '11:40'), 'main', 'phone', 'k1', [['p3', 4], ['p6', 10]], 'picking', 'u_men');
    s2.stageLog.push({ stage: 'picking', at: at(0, '12:10'), by: 'u_skl' });
    pay(s2, 'transfer', 1000000, at(0, '12:30'), 'u_men', false);
    // №1003 — заказ по телефону, уже в пути к клиенту, не оплачен (долг по отгрузке)
    const s3 = sale(1003, at(-1, '16:20'), 'main', 'phone', 'k3', [['p8', 5], ['p7', 3]], 'shipping', 'u_men');
    s3.stageLog.push({ stage: 'picking', at: at(-1, '16:45'), by: 'u_skl' }, { stage: 'ready', at: at(-1, '17:30'), by: 'u_skl' }, { stage: 'shipping', at: at(0, '09:10'), by: 'u_skl' });
    ship(s3, at(0, '09:10'));

    /* ---------- задание на выпуск в работе — чтобы считалась потребность в сырье ---------- */
    db.prodOrders.push({ id: id('po'), no: 1, at: at(0, '08:30'), p: 'p4', qty: 60, status: 'work', startedAt: at(0, '08:40'), note: 'Нет в наличии — срочный выпуск', by: 'u_tex' });

    /* ---------- 4 расхода компании ---------- */
    const exp = (d, hm, cat, desc, amount, method, confirmed) => {
      const e = { id: id('e'), at: at(d, hm), cat, desc, amount, method, by: 'u_buh' };
      db.expenses.push(e);
      money(method, -1, amount, e.at, 'expense', e.id, `${cat}: ${desc}`, method === 'transfer' ? 'ООО «Sergeli Invest»' : '', '', 'u_buh', confirmed);
    };
    exp(-3, '10:00', 'Аренда', 'Аренда цеха и склада за месяц', 18000000, 'transfer', true);
    exp(0, '09:30', 'Коммунальные услуги', 'Электроэнергия, цех', 4850000, 'transfer', false);
    exp(-1, '15:00', 'Транспорт и логистика', 'Доставка заказа в Чирчик', 650000, 'cash');
    exp(0, '11:00', 'Хозяйственные расходы', 'Перчатки, ветошь, скотч', 320000, 'corp');

    /* ---------- зарплата 4 сотрудникам: выплачено, частично, не выплачено, переплата ---------- */
    const ym = W.month(), first = `${ym}-01T09:00` > now ? now : `${ym}-01T09:00`;
    const advAt = today.slice(8) >= '15' ? `${ym}-15T12:00` : at(0, '12:00');
    const acc = (emp, kind, amount, note = '', a = first) => db.accruals.push({ id: id('ac'), at: a, emp, period: ym, kind, amount, note, by: 'u_buh' });
    const pv = (emp, amount, a, note) => db.payouts.push({ id: id('pv'), at: a, emp, period: ym, amount, method: 'cash', note, by: 'u_buh' });
    const name = uid => users.find(u => u.id === uid).name;
    // Холматов — выплачено полностью
    acc('u_w1', 'salary', 4200000); acc('u_w1', 'advance', 1500000);
    pv('u_w1', 1500000, advAt, 'Аванс'); pv('u_w1', 2700000, at(0, '13:00'), 'Зарплата за месяц');
    // Сафарова — выплачен только аванс
    acc('u_w2', 'salary', 3800000); acc('u_w2', 'advance', 1200000);
    pv('u_w2', 1200000, advAt, 'Аванс');
    // Тошпулатов — начислено с премией, ещё не выплачено
    acc('u_skl', 'salary', 5000000); acc('u_skl', 'advance', 2000000); acc('u_skl', 'bonus', 500000, 'Премия за инвентаризацию', at(0, '10:00'));
    // Исмоилов — удержание провели после выплаты, образовалась переплата
    acc('u_w3', 'salary', 3500000); acc('u_w3', 'advance', 1000000);
    pv('u_w3', 3500000, at(-1, '17:00'), 'Зарплата за месяц');
    acc('u_w3', 'deduction', 300000, 'Порча тары по вине сотрудника', at(0, '09:00'));
    db.payouts.forEach(p => money('cash', -1, p.amount, p.at, 'salary', p.id, `Зарплата: ${name(p.emp)}`, name(p.emp), '', 'u_buh'));
    db.salaryLog.push(
      { id: id('sl'), at: first, action: 'create', doc: 'accrual', target: 'Все сотрудники', change: `Оклады и авансы за ${ym}`, by: 'u_buh' },
      { id: id('sl'), at: at(0, '10:00'), action: 'create', doc: 'accrual', target: name('u_skl'), change: 'Премия: 500 000 сум', by: 'u_buh' },
      { id: id('sl'), at: at(0, '09:00'), action: 'create', doc: 'accrual', target: name('u_w3'), change: 'Удержание: 300 000 сум', by: 'u_buh' },
      ...db.payouts.map(p => ({ id: id('sl'), at: p.at, action: 'create', doc: 'payout', target: name(p.emp), change: `Выплачено: ${W.fmtNum(p.amount)} сум (${ym})`, by: 'u_buh' })),
    );

    /* ---------- порядок и нумерация ---------- */
    ['moves', 'sales', 'payments', 'cash', 'bank', 'expenses', 'accruals', 'payouts', 'salaryLog'].forEach(k => db[k].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)));
    db.sales.sort((a, b) => a.no - b.no);
    db.seq.sale = 1003; db.seq.prod = 1;
    db.users.find(u => u.id === 'u_dir').lastLogin = `${W.addDays(today, -1)}T18:12`;
    return db;
  };
})();
