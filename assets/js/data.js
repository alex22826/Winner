/* =========================================================================
   WINNER — демо-данные EAST COLOR. Генерируются один раз при первом входе
   (детерминированный ГПСЧ), даты отсчитываются от сегодняшнего дня.
   Сброс: Администрирование → «Сбросить демо-данные» или W.resetDemo().
   ========================================================================= */
(function () {
  const W = window.W;
  const N = W.N;

  W.seed = () => {
    let seed = 20261022;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = a => a[Math.floor(rnd() * a.length)];
    const chance = p => rnd() < p;
    const pad = n => String(n).padStart(2, '0');
    const today = W.today();
    const nowHM = W.now().slice(11, 16);
    const DAYS = 70;
    let idn = 0;
    const id = p => p + (++idn).toString(36);
    const at = (d, h1 = 9, h2 = 18) => {
      let hm = `${pad(ri(h1, h2))}:${pad(ri(0, 59))}`;
      if (d === 0 && hm > nowHM) { const [h, m] = nowHM.split(':').map(Number); const mins = Math.max(0, h * 60 + m - ri(5, 90)); hm = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }
      return `${W.addDays(today, d)}T${hm}`;
    };

    /* ---------- справочники ---------- */
    const settings = {
      company: { name: 'ООО «EAST COLOR»', inn: '307 456 812', director: 'Рахимов Азиз Бахтиярович', phone: '+998 71 200-45-45', email: 'info@eastcolor.uz',
        address: 'г. Ташкент, Сергелийский р-н, ул. Янги Сергели, 15', bank: 'АКБ «Kapitalbank»', account: '2020 8000 6051 1207 3001', mfo: '01088' },
      currency: 'UZS', usdRate: 12780,
      numbering: { sale: 1001, waybill: 1, invoice: 1, prod: 1, purchase: 1, ret: 1 },
      lowStock: 10,
      expenseCats: [N('Аренда'), N('Коммунальные услуги'), N('Транспорт и логистика'), N('Хозяйственные расходы'), N('Ремонт оборудования'), N('Налоги и сборы'), N('Реклама и маркетинг'), N('Связь и интернет'), N('Прочее')],
    };

    const U = (o) => Object.assign({ phone: '', active: true, protected: false, login: '', pass: '', roles: [], salary: 0, advance: 0, hired: W.addDays(today, -ri(200, 1400)) }, o);
    const users = [
      U({ id: 'u_dir', name: 'Рахимов Азиз Бахтиярович', position: N('Директор'), roles: ['director'], login: 'director', pass: '7b006700a466fe3255b9222066b244f5c0675faebc0f5c0bddc87e3c31bf1198', protected: true, salary: 15000000, advance: 5000000, phone: '+998 90 100-45-45' }),
      U({ id: 'u_buh', name: 'Юсупова Дилноза Рустамовна', position: N('Главный бухгалтер'), roles: ['accountant'], login: 'buh', pass: '5eb7b2dcee122e1abec54be450e4fae41aee66c59c905bede2af47cf55e97d89', salary: 8000000, advance: 3000000, phone: '+998 93 241-18-07' }),
      U({ id: 'u_men', name: 'Назарова Севара Алишеровна', position: N('Менеджер по продажам'), roles: ['manager'], login: 'menejer', pass: '081ec7893af89385662701fba2a00f61548625fd0ccaec6271ec5e94cef0c5bb', salary: 6000000, advance: 2000000, phone: '+998 97 715-30-62' }),
      U({ id: 'u_sel', name: 'Каримова Малика Шухратовна', position: N('Продавец-консультант'), roles: ['seller'], login: 'magazin', pass: 'b4aaa3ea571cfa7ec57e161451289fc534ec06c7e6ddf65086c3b89528f10f72', salary: 4500000, advance: 1500000, phone: '+998 99 402-77-15' }),
      U({ id: 'u_skl', name: 'Тошпулатов Жасур Тимурович', position: N('Кладовщик'), roles: ['storekeeper'], login: 'sklad', pass: 'e3bdc74acaf27ebb893d7cd17de6e2261f586f50be1be9da2b3360ca6c931f47', salary: 5000000, advance: 2000000, phone: '+998 90 318-64-29' }),
      U({ id: 'u_tex', name: 'Абдуллаев Шерзод Камолович', position: N('Технолог производства'), roles: ['technologist'], login: 'texnolog', pass: '85d5861ab9824dff9abb7d7e27b7d78b5f17916ad729882f79728e1463144c3d', salary: 7000000, advance: 2500000, phone: '+998 94 556-12-80' }),
      U({ id: 'u_w1', name: 'Холматов Улугбек Анварович', position: N('Оператор смесителя'), salary: 4200000, advance: 1500000, phone: '+998 91 120-33-47' }),
      U({ id: 'u_w2', name: 'Сафарова Нигора Бахтиёровна', position: N('Фасовщица'), salary: 3800000, advance: 1200000, phone: '+998 93 870-11-52' }),
      U({ id: 'u_w3', name: 'Исмоилов Бекзод Равшанович', position: N('Грузчик'), salary: 3500000, advance: 1000000, phone: '+998 97 333-90-14' }),
      U({ id: 'u_w4', name: 'Мирзаев Отабек Шавкатович', position: N('Водитель-экспедитор'), salary: 4000000, advance: 1500000, phone: '+998 90 777-25-63' }),
      U({ id: 'u_w5', name: 'Ахмедов Фаррух Илхомович', position: N('Стажёр'), salary: 0, advance: 0, phone: '+998 95 140-08-36', hired: W.addDays(today, -20) }),
      U({ id: 'u_w6', name: 'Сафаров Рустам Олимович', position: N('Оператор линии'), active: false, salary: 4000000, advance: 1500000, phone: '+998 90 909-41-18', fired: W.addDays(today, -45) }),
    ];

    const categories = [
      { id: 'c1', name: N('Эмали') }, { id: 'c2', name: N('Водоэмульсионные краски') }, { id: 'c3', name: N('Лаки') },
      { id: 'c4', name: N('Грунтовки') }, { id: 'c5', name: N('Типографские краски') }, { id: 'c6', name: N('Мастики') },
    ];
    const Pr = (id, name, cat, price, color, pack, minStock, noShip, sku) => ({ id, name, cat, price, color, pack, minStock, noShip: !!noShip, sku, photo: '' });
    const products = [
      Pr('p1', 'Эмаль ПФ-115 белая, 2,8 кг', 'c1', 92000, '#eef1f5', 'can', 40, 0, 'EM-115-W28'),
      Pr('p2', 'Эмаль ПФ-115 красная, 0,9 кг', 'c1', 32000, '#d7262e', 'can', 40, 0, 'EM-115-R09'),
      Pr('p3', 'Эмаль ПФ-115 синяя, 2,8 кг', 'c1', 94000, '#1f4fd1', 'can', 30, 0, 'EM-115-B28'),
      Pr('p4', 'Эмаль ПФ-115 жёлтая, 0,9 кг', 'c1', 33000, '#f5b800', 'can', 30, 0, 'EM-115-Y09'),
      Pr('p5', 'Эмаль НЦ-132 чёрная, 0,7 кг', 'c1', 36000, '#22252d', 'can', 25, 0, 'EM-132-K07'),
      Pr('p6', 'Краска ВД-АК фасадная белая, 25 кг', 'c2', 465000, '#d9e3ee', 'bucket', 20, 1, 'VD-FAS-25'),
      Pr('p7', 'Краска интерьерная моющаяся, 14 кг', 'c2', 298000, '#7ec8e3', 'bucket', 20, 0, 'VD-INT-14'),
      Pr('p8', 'Краска для потолков «Снежная», 7 кг', 'c2', 118000, '#cfe3f5', 'bucket', 25, 0, 'VD-POT-07'),
      Pr('p9', 'Лак ПФ-283 бесцветный, 0,8 л', 'c3', 41000, '#c98a2b', 'can', 30, 0, 'LK-283-08'),
      Pr('p10', 'Лак паркетный акриловый, 2,5 л', 'c3', 156000, '#b06a1f', 'can', 15, 0, 'LK-PAR-25'),
      Pr('p11', 'Грунтовка ГФ-021 серая, 2,7 кг', 'c4', 64000, '#8b929c', 'can', 30, 0, 'GR-021-27'),
      Pr('p12', 'Грунт глубокого проникновения, 10 кг', 'c4', 89000, '#9ad0c2', 'bucket', 20, 0, 'GR-GLB-10'),
      Pr('p13', 'Краска офсетная голубая (Cyan), 1 кг', 'c5', 145000, '#00a3e0', 'can', 20, 1, 'OF-C-01'),
      Pr('p14', 'Краска офсетная пурпурная (Magenta), 1 кг', 'c5', 152000, '#e4007c', 'can', 20, 1, 'OF-M-01'),
      Pr('p15', 'Краска офсетная жёлтая (Yellow), 1 кг', 'c5', 139000, '#ffd400', 'can', 20, 0, 'OF-Y-01'),
      Pr('p16', 'Краска офсетная чёрная (Black), 2,5 кг', 'c5', 268000, '#15171c', 'can', 15, 0, 'OF-K-25'),
      Pr('p17', 'Мастика битумная, 18 кг', 'c6', 210000, '#2f3136', 'bucket', 15, 0, 'MS-BIT-18'),
      Pr('p18', 'Мастика гидроизоляционная, 5 кг', 'c6', 98000, '#4a5560', 'bucket', 15, 0, 'MS-GID-05'),
      Pr('p19', 'Колер универсальный «Охра», 100 мл', null, 12000, '#c8862f', 'can', 30, 0, 'KL-OXR-01'),
      Pr('p20', 'Растворитель 646, 1 л', null, 28000, '#a8c3d8', 'can', 30, 0, 'RS-646-01'),
    ];
    const Mt = (id, name, unit, price, safety, sup) => ({ id, name, unit, price, safety, sup });
    const materials = [
      Mt('m1', 'Диоксид титана', N('кг'), 32000, 300, 's1'), Mt('m2', 'Мел молотый МТД-2', N('кг'), 1800, 800, 's3'),
      Mt('m3', 'Акриловая дисперсия', N('кг'), 21000, 400, 's2'), Mt('m4', 'Алкидная смола ПФ-060', N('кг'), 26000, 400, 's2'),
      Mt('m5', 'Уайт-спирит', N('л'), 11500, 300, 's4'), Mt('m6', 'Пигмент железоокисный красный', N('кг'), 38000, 40, 's1'),
      Mt('m7', 'Пигмент фталоцианиновый синий', N('кг'), 95000, 20, 's1'), Mt('m8', 'Пигмент жёлтый', N('кг'), 72000, 25, 's1'),
      Mt('m9', 'Сажа техническая', N('кг'), 24000, 30, 's1'), Mt('m10', 'Сиккатив', N('кг'), 45000, 20, 's1'),
      Mt('m11', 'Загуститель', N('кг'), 68000, 15, 's1'), Mt('m12', 'Биоцид', N('кг'), 54000, 10, 's1'),
      Mt('m13', 'Битум нефтяной', N('кг'), 7500, 500, 's4'), Mt('m14', 'Лаковая основа', N('кг'), 31000, 150, 's2'),
      Mt('m15', 'Ацетон технический', N('л'), 16000, 100, 's4'), Mt('m16', 'Ведро пластиковое 25 кг', N('шт'), 14000, 150, 's5'),
      Mt('m17', 'Ведро пластиковое 10–14 кг', N('шт'), 9500, 200, 's5'), Mt('m18', 'Банка металлическая 2,8 кг', N('шт'), 5200, 500, 's5'),
      Mt('m19', 'Банка металлическая 0,9 кг', N('шт'), 3100, 800, 's5'), Mt('m20', 'Этикетка самоклеящаяся', N('шт'), 350, 2000, 's6'),
    ];
    const R = (...rows) => rows.map(([m, qty, note = '']) => ({ m, qty, note }));
    const recipes = {
      p1: R(['m4', 1.25], ['m1', 0.62], ['m5', 0.78], ['m10', 0.04, 'вводить в конце'], ['m18', 1], ['m20', 1]),
      p2: R(['m4', 0.42], ['m6', 0.09], ['m2', 0.08], ['m5', 0.28], ['m10', 0.012], ['m19', 1], ['m20', 1]),
      p3: R(['m4', 1.3], ['m7', 0.05, 'перетир 40 мин'], ['m1', 0.3], ['m5', 0.8], ['m10', 0.04], ['m18', 1], ['m20', 1]),
      p4: R(['m4', 0.42], ['m8', 0.07], ['m2', 0.1], ['m5', 0.27], ['m10', 0.012], ['m19', 1], ['m20', 1]),
      p5: R(['m14', 0.35], ['m9', 0.05], ['m15', 0.3], ['m19', 1], ['m20', 1]),
      p6: R(['m3', 7.5], ['m1', 3.2], ['m2', 12.5], ['m11', 0.18], ['m12', 0.05], ['m16', 1], ['m20', 1]),
      p7: R(['m3', 4.6], ['m1', 1.9], ['m2', 6.8], ['m11', 0.1], ['m12', 0.03], ['m17', 1], ['m20', 1]),
      p8: R(['m3', 1.8], ['m1', 0.7], ['m2', 4.3], ['m11', 0.05], ['m12', 0.015], ['m17', 1], ['m20', 1]),
      p9: R(['m4', 0.52], ['m5', 0.25], ['m10', 0.015], ['m19', 1], ['m20', 1]),
      p10: R(['m3', 1.7], ['m14', 0.6], ['m11', 0.02], ['m18', 1], ['m20', 1]),
      p11: R(['m4', 1.0], ['m2', 0.95], ['m6', 0.12], ['m5', 0.6], ['m18', 1], ['m20', 1]),
      p12: R(['m3', 2.2], ['m12', 0.02, 'вода — до 10 кг'], ['m17', 1], ['m20', 1]),
      p13: R(['m14', 0.62], ['m7', 0.18], ['m4', 0.15], ['m19', 1], ['m20', 1]),
      p14: R(['m14', 0.62], ['m6', 0.2], ['m4', 0.15], ['m19', 1], ['m20', 1]),
      p15: R(['m14', 0.62], ['m8', 0.2], ['m4', 0.15], ['m19', 1], ['m20', 1]),
      p16: R(['m14', 1.55], ['m9', 0.45], ['m4', 0.4], ['m18', 1], ['m20', 1]),
      p17: R(['m13', 15.5], ['m5', 2.2], ['m16', 1], ['m20', 1]),
      p18: R(['m13', 3.6], ['m3', 0.9], ['m17', 1], ['m20', 1]),
    };

    const C = (id, name, type, inn, contact, phone, address, regular) => ({ id, name, type, inn, contact, phone, address, regular: !!regular, created: W.addDays(today, -ri(90, 700)) });
    const customers = [
      C('k1', 'ООО «Qurilish Invest Group»', 'legal', '305 482 917', 'Ахмедов Ботир (директор)', '+998 90 177-45-12', 'г. Ташкент, Яккасарайский р-н, ул. Шота Руставели, 41', 1),
      C('k2', 'ИП «Каримов Бахром»', 'ip', '412 118 506', 'Каримов Бахром', '+998 93 512-08-44', 'г. Ташкент, рынок «Джамбул», ряд 7', 1),
      C('k3', 'ООО «Toshkent Remont Servis»', 'legal', '306 774 231', 'Юсупов Нодир (прораб)', '+998 97 401-22-90', 'г. Ташкент, Мирзо-Улугбекский р-н, ул. Буюк Ипак Йули, 158', 1),
      C('k4', 'ООО «Print House Media»', 'legal', '307 115 842', 'Ли Виктор (директор)', '+998 71 233-55-10', 'г. Ташкент, Чиланзарский р-н, ул. Бунёдкор, 12', 1),
      C('k5', 'ЧП «Samarqand Bo‘yoq Savdo»', 'legal', '301 987 654', 'Рашидов Анвар', '+998 66 235-77-01', 'г. Самарканд, ул. Регистан, 9', 1),
      C('k6', 'ООО «Mega Stroy Market»', 'legal', '308 456 120', 'Тураев Шерзод', '+998 90 935-61-17', 'г. Ташкент, Сергелийский р-н, строительный рынок, павильон 22', 1),
      C('k7', 'ИП «Нуриддинов Ш.»', 'ip', '410 552 873', 'Нуриддинов Шухрат', '+998 94 610-33-25', 'Ташкентская обл., г. Чирчик, ул. Амира Темура, 3', 0),
      C('k8', 'ООО «Andijon Kraska Opt»', 'legal', '309 221 467', 'Холиков Дилшод', '+998 74 223-14-50', 'г. Андижан, ул. Навои, 77', 1),
      C('k9', 'ООО «Ofset Print Plus»', 'legal', '305 663 019', 'Ким Елена', '+998 71 256-40-88', 'г. Ташкент, ул. Фаробий, 25', 0),
      C('k10', 'Абдурахманов Тимур', 'person', '', 'Абдурахманов Тимур', '+998 99 812-45-67', 'г. Ташкент, Юнусабад-14, д. 22, кв. 9', 0),
      C('k11', 'Ибрагимова Лола', 'person', '', 'Ибрагимова Лола', '+998 90 344-19-02', 'г. Ташкент, Чиланзар-9, д. 5, кв. 41', 0),
      C('k12', 'ООО «Ferghana Build Systems»', 'legal', '310 778 245', 'Мамадалиев Улугбек', '+998 73 244-60-31', 'г. Фергана, ул. Ал-Фергани, 48', 1),
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
      v: W.DB_VERSION, created: W.now(), seq: { sale: null, waybill: null, invoice: null, prod: null, purchase: null, ret: null },
      settings, users, customers, suppliers, categories, products, materials, recipes,
      moves: [], sales: [], payments: [], returns: [], cash: [], bank: [], expenses: [], purchases: [], prodOrders: [],
      accruals: [], payouts: [], salaryLog: [],
    };
    const P = W.by(products), M = W.by(materials), SUP = W.by(suppliers), K = W.by(customers);

    /* ---------- помощники симуляции ---------- */
    const st = {};
    const key = (t, i, wh) => `${t}:${i}:${wh}`;
    const have = (t, i, wh) => st[key(t, i, wh)] || 0;
    const mv = (t, item, wh, qty, kind, ref, a, by, note = '') => {
      st[key(t, item, wh)] = W.round(have(t, item, wh) + qty, 3);
      db.moves.push({ id: id('mv'), at: a, t, item, wh, qty: W.round(qty, 3), kind, ref, note, by });
    };
    const confirmedBy = (a) => W.daysBetween(a, today) > 2;
    const bankOp = (dir, amount, a, desc, party, num, kind, ref, by, conf) => {
      const ok = conf != null ? conf : confirmedBy(a);
      const log = [{ at: a, by, act: 'create' }];
      const cAt = ok ? W.isoAt(new Date(W.parse(a).getTime() + ri(3, 40) * 3600e3)) : null;
      if (ok) log.push({ at: cAt > W.now() ? a : cAt, by: 'u_buh', act: 'confirm' });
      db.bank.push({ id: id('bk'), at: a, dir, desc, party, num, amount: W.round(amount), status: ok ? 'confirmed' : 'pending', kind, ref, by, log, confirmedBy: ok ? 'u_buh' : null, confirmedAt: ok ? log[1].at : null });
    };
    const cash = (acc, dir, amount, a, kind, ref, note, by) => db.cash.push({ id: id('c'), at: a, acc, dir, amount: W.round(amount), kind, ref, note, by });
    const money = (method, dir, amount, a, kind, ref, note, party, num, by) => {
      if (method === 'transfer') bankOp(dir, amount, a, note, party, num, kind, ref, by);
      else cash(method, dir, amount, a, kind, ref, note, by);
    };
    const seq = { sale: 1000, prod: 0, purchase: 0, ret: 0 };
    const plusH = (a, h) => { const d = W.parse(a); d.setMinutes(d.getMinutes() + Math.round(h * 60)); const r = W.isoAt(d); return r > W.now() ? W.now() : r; };

    /* ---------- начальные остатки ---------- */
    const start = -DAYS - 1;
    const a0 = `${W.addDays(today, start)}T08:00`;
    materials.forEach(m => mv('m', m.id, 'raw', Math.round(m.safety * (2.2 + rnd() * 1.5)), 'init', null, a0, 'u_skl', N('Остаток на начало')));
    products.forEach(p => {
      const big = p.pack === 'bucket';
      mv('p', p.id, 'prod', big ? ri(20, 45) : ri(60, 160), 'init', null, a0, 'u_skl', N('Остаток на начало'));
      mv('p', p.id, 'main', big ? ri(25, 60) : ri(80, 200), 'init', null, a0, 'u_skl', N('Остаток на начало'));
      mv('p', p.id, 'shop', big ? ri(4, 10) : ri(12, 30), 'init', null, a0, 'u_skl', N('Остаток на начало'));
    });
    cash('cash', 1, 24500000, a0, 'manual', null, N('Остаток на начало'), 'u_buh');
    cash('card', 1, 6200000, a0, 'manual', null, N('Остаток на начало'), 'u_buh');
    cash('corp', 1, 9000000, a0, 'manual', null, N('Остаток на начало'), 'u_buh');
    bankOp(1, 186400000, a0, 'Остаток на расчётном счёте на начало периода', settings.company.bank, '', 'manual', null, 'u_buh', true);

    /* ---------- закупка недостающего сырья ---------- */
    const buy = (d, needs, by = 'u_tex') => {
      const bySup = {};
      needs.forEach(([mid, qty]) => { const s = M[mid].sup; (bySup[s] = bySup[s] || []).push([mid, qty]); });
      Object.entries(bySup).forEach(([sid, rows]) => {
        const a = at(d, 8, 10);
        const items = rows.map(([m, qty]) => ({ m, qty, price: Math.round(M[m].price * (0.96 + rnd() * 0.08) / 100) * 100 }));
        const p = { id: id('pu'), no: ++seq.purchase, at: a, sup: sid, items, note: '', method: chance(0.93) ? 'transfer' : 'cash', by };
        p.total = W.round(W.sum(items, i => i.qty * i.price));
        db.purchases.push(p);
        items.forEach(i => mv('m', i.m, 'raw', i.qty, 'purchase', p.id, a, 'u_skl'));
        money(p.method, -1, p.total, plusH(a, 2), 'purchase', p.id, `Оплата поставщику, приход №${W.no(p.no)}`, SUP[sid].name, W.no(p.no), 'u_buh');
      });
    };
    const produce = (d, pid, qty, status = 'done') => {
      const a = at(d, 8, 11);
      const need = (recipes[pid] || []).map(r => [r.m, W.round(r.qty * qty, 3)]);
      const short = need.filter(([m, q]) => have('m', m, 'raw') < q + (status === 'done' ? 0 : 0));
      if (short.length) buy(d, short.map(([m, q]) => [m, Math.ceil(Math.max(q * 3, M[m].safety * 2.5) / 10) * 10]));
      const o = { id: id('po'), no: ++seq.prod, at: a, p: pid, qty, status, note: '', by: 'u_tex' };
      if (status !== 'plan') o.startedAt = plusH(a, 0.5);
      if (status === 'done') {
        o.doneAt = plusH(a, ri(4, 9));
        need.forEach(([m, q]) => mv('m', m, 'raw', -q, 'consume', o.id, o.doneAt, 'u_tex'));
        mv('p', pid, 'prod', qty, 'produce', o.id, o.doneAt, 'u_tex');
        o.cost = W.round(W.sum(recipes[pid] || [], r => r.qty * M[r.m].price) * qty);
      }
      db.prodOrders.push(o);
      return o;
    };

    /* ---------- продажи ---------- */
    const SHOP_ITEMS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p9', 'p11', 'p19', 'p20', 'p8', 'p2', 'p4', 'p19', 'p20', 'p10', 'p12', 'p7'];
    const B2B_ITEMS = ['p1', 'p3', 'p6', 'p7', 'p8', 'p11', 'p12', 'p17', 'p18', 'p10', 'p2', 'p4', 'p9'];
    const INK_ITEMS = ['p13', 'p14', 'p15', 'p16'];
    const makeSale = (d, channel, source, cust, lines, by, stage) => {
      const a = at(d, 9, 18);
      const items = [];
      lines.forEach(([p, qty, price]) => {
        if (items.some(i => i.p === p)) return;
        const q = Math.min(qty, Math.floor(have('p', p, channel)));
        if (q > 0 || !['shipping', 'done'].includes(stage)) items.push({ p, qty: q > 0 ? q : qty, price: price || P[p].price });
      });
      if (!items.length) return null;
      const s = { id: id('s'), no: ++seq.sale, at: a, channel, source, cust: cust || null, name: cust ? K[cust].name : '', phone: cust ? K[cust].phone : '', address: cust ? K[cust].address : '',
        items, discount: 0, stage: 'new', stageLog: [{ stage: 'new', at: a, by }], shipped: false, note: '', by };
      s.total = W.round(W.sum(items, i => i.qty * i.price));
      const order = W.STAGES.map(x => x.id);
      const upto = order.indexOf(stage);
      let t = a;
      for (let i = 1; i <= upto; i++) {
        t = source === 'walkin' ? a : plusH(t, ri(1, 20));
        s.stageLog.push({ stage: order[i], at: t, by: i >= 3 ? 'u_skl' : by });
        if (order[i] === 'shipping' || (order[i] === 'done' && !s.shipped)) {
          s.items.forEach(it => mv('p', it.p, channel, -it.qty, 'sale', s.id, t, 'u_skl'));
          s.shipped = true; s.shippedAt = t;
        }
      }
      if (source === 'walkin') s.stageLog = [{ stage: 'done', at: a, by }];
      s.stage = stage;
      db.sales.push(s);
      return s;
    };
    const pay = (s, method, amount, a, by) => {
      if (!(amount > 0)) return;
      db.payments.push({ id: id('pay'), at: a, sale: s.id, method, amount: W.round(amount), by });
      money(method, 1, amount, a, 'sale', s.id, `Оплата по продаже №${W.no(s.no)}`, s.cust ? K[s.cust].name : 'Розничный покупатель', W.no(s.no), by);
    };

    /* ---------- день за днём ---------- */
    for (let d = start + 1; d <= 0; d++) {
      const day = W.addDays(today, d);
      const wd = W.parse(day).getDay(); // 0 — воскресенье
      const work = wd !== 0;

      // утром кладовщик пополняет магазин с основного склада
      if (work) products.forEach(p => {
        const big = p.pack === 'bucket', min = big ? 3 : 8, fill = big ? 6 : ri(14, 22);
        if (have('p', p.id, 'shop') < min && have('p', p.id, 'main') > fill) {
          const a = at(d, 8, 9), ref = id('tr');
          mv('p', p.id, 'main', -fill, 'transfer', ref, a, 'u_skl'); mv('p', p.id, 'shop', fill, 'transfer', ref, a, 'u_skl');
        }
      });
      // пн и чт — вывоз с производства на основной склад
      if (wd === 1 || wd === 4) products.forEach(p => {
        const big = p.pack === 'bucket', target = big ? 45 : 140;
        const can = Math.floor(have('p', p.id, 'prod') * 0.7);
        const q = Math.min(can, target - have('p', p.id, 'main'));
        if (q > 0) { const a = at(d, 14, 16), ref = id('tr'); mv('p', p.id, 'prod', -q, 'transfer', ref, a, 'u_skl'); mv('p', p.id, 'main', q, 'transfer', ref, a, 'u_skl'); }
      });
      // понедельник — плановая закупка всего, что опустилось к страховому порогу
      if (wd === 1 && d < -1) {
        const need = materials.filter(m => have('m', m.id, 'raw') < m.safety * 1.4).map(m => [m.id, Math.ceil(m.safety * 2.5 / 10) * 10]);
        if (need.length) buy(d, need, 'u_skl');
      }
      // производство
      if (work && d < 0 && chance(0.72)) {
        const cand = products.filter(p => recipes[p.id]).sort((a, b) => (have('p', a.id, 'prod') + have('p', a.id, 'main')) / (a.pack === 'bucket' ? 1 : 3) - (have('p', b.id, 'prod') + have('p', b.id, 'main')) / (b.pack === 'bucket' ? 1 : 3));
        const p = pick(cand.slice(0, 4));
        const qty = p.pack === 'bucket' ? ri(4, 12) * 10 : p.cat === 'c5' ? ri(3, 8) * 10 : ri(12, 40) * 10;
        produce(d, p.id, qty);
      }
      // магазин: розница
      const nShop = work ? ri(2, 5) : ri(0, 2);
      for (let i = 0; i < nShop; i++) {
        const lines = Array.from({ length: ri(1, 3) }, () => [pick(SHOP_ITEMS), ri(1, 4)]);
        const cust = chance(0.15) ? pick(['k10', 'k11', 'k2']) : null;
        const s = makeSale(d, 'shop', 'walkin', cust, lines, 'u_sel', 'done');
        if (!s) continue;
        const r = rnd();
        if (r < 0.88) pay(s, r < 0.52 ? 'cash' : 'card', s.total, s.at, 'u_sel');
        else if (cust) pay(s, 'cash', Math.round(s.total * 0.5 / 1000) * 1000, s.at, 'u_sel');
        else pay(s, 'cash', s.total, s.at, 'u_sel');
      }
      // заказы по телефону — отгрузка с основного склада
      if (work && chance(0.78)) {
        const n = ri(1, 2);
        for (let i = 0; i < n; i++) {
          const ink = chance(0.22);
          const cust = ink ? pick(['k4', 'k9']) : pick(['k1', 'k2', 'k3', 'k6', 'k7', 'k1', 'k3', 'k6']);
          const lines = ink
            ? Array.from({ length: ri(2, 4) }, () => [pick(INK_ITEMS), ri(3, 12)])
            : Array.from({ length: ri(2, 4) }, () => { const p = pick(B2B_ITEMS); return [p, P[p].pack === 'bucket' ? ri(3, 15) : ri(10, 40), chance(0.3) ? Math.round(P[p].price * 0.95 / 100) * 100 : 0]; });
          const stage = d <= -4 ? 'done' : d === -3 ? pick(['done', 'shipping']) : d === -2 ? pick(['shipping', 'ready', 'done']) : d === -1 ? pick(['ready', 'picking', 'shipping']) : pick(['new', 'picking', 'new']);
          const s = makeSale(d, 'main', 'phone', cust, lines, 'u_men', stage);
          if (!s) continue;
          const r = rnd(), m = K[cust].type === 'person' ? 'cash' : (chance(0.78) ? 'transfer' : 'cash');
          const late = d > -6;
          if (r < (late ? 0.35 : 0.78)) pay(s, m, s.total, plusH(s.at, ri(2, 60)), 'u_men');
          else if (r < (late ? 0.65 : 0.94)) pay(s, m, Math.round(s.total * pick([0.3, 0.5, 0.7]) / 1000) * 1000, plusH(s.at, ri(2, 30)), 'u_men');
        }
      }
      // производство: фуры забирают товар (вт, пт)
      if ((wd === 2 || wd === 5) && chance(0.8) && d < 0) {
        const cust = pick(['k5', 'k8', 'k12', 'k6']);
        const lines = Array.from({ length: ri(2, 3) }, () => [pick(['p6', 'p7', 'p8', 'p12', 'p17', 'p18', 'p1', 'p11']), ri(2, 6) * 10]);
        const s = makeSale(d, 'prod', 'phone', cust, lines, 'u_men', 'done');
        if (s) pay(s, 'transfer', chance(0.7) ? s.total : Math.round(s.total * 0.6 / 1000) * 1000, plusH(s.at, ri(1, 48)), 'u_men');
      }
      // расходы
      const dom = +day.slice(8, 10);
      if (dom === 1) {
        db.expenses.push({ id: id('e'), at: at(d, 9, 11), cat: 'Аренда', desc: 'Аренда цеха и склада, Сергели', amount: 18000000, method: 'transfer', by: 'u_buh' });
        db.expenses.push({ id: id('e'), at: at(d, 9, 12), cat: 'Связь и интернет', desc: 'Интернет и мобильная связь', amount: 650000, method: 'corp', by: 'u_buh' });
        db.expenses.push({ id: id('e'), at: at(d, 10, 13), cat: 'Реклама и маркетинг', desc: 'Таргетированная реклама Instagram', amount: 2500000, method: 'corp', by: 'u_buh' });
      }
      if (dom === 5) db.expenses.push({ id: id('e'), at: at(d, 10, 15), cat: 'Коммунальные услуги', desc: 'Электроэнергия и газ, цех', amount: ri(42, 61) * 100000, method: 'transfer', by: 'u_buh' });
      if (dom === 15) db.expenses.push({ id: id('e'), at: at(d, 10, 15), cat: 'Налоги и сборы', desc: 'НДС и налог на прибыль, аванс', amount: ri(70, 92) * 100000, method: 'transfer', by: 'u_buh' });
      if (work && (wd === 1 || wd === 4)) db.expenses.push({ id: id('e'), at: at(d, 9, 17), cat: 'Транспорт и логистика', desc: pick(['Топливо, доставка по городу', 'Доставка в Чирчик', 'ГСМ для погрузчика', 'Грузоперевозка, наёмная Газель']), amount: ri(8, 25) * 100000, method: 'cash', by: 'u_buh' });
      if (work && chance(0.22)) db.expenses.push({ id: id('e'), at: at(d, 9, 17), cat: 'Хозяйственные расходы', desc: pick(['Перчатки, ветошь, скотч', 'Канцтовары', 'Моющие средства', 'Вода питьевая, 20 бутылей', 'Плёнка стрейч']), amount: ri(2, 9) * 100000, method: pick(['cash', 'corp']), by: 'u_buh' });
      if (work && chance(0.05)) db.expenses.push({ id: id('e'), at: at(d, 9, 17), cat: 'Ремонт оборудования', desc: pick(['Ремонт дисольвера', 'Замена подшипников мешалки', 'Обслуживание компрессора']), amount: ri(15, 42) * 100000, method: 'transfer', by: 'u_buh' });
    }
    // расходы по деньгам
    db.expenses.forEach(e => money(e.method, -1, e.amount, e.at, 'expense', e.id, `${e.cat}: ${e.desc}`, '', '', 'u_buh'));

    /* ---------- открытые задания производства ---------- */
    produce(0, 'p6', 80, 'work');
    produce(0, 'p13', 40, 'work');
    produce(0, 'p14', 50, 'plan');
    // крупный заказ на фасадную краску — для расчёта потребности сырья
    makeSale(0, 'main', 'phone', 'k1', [['p6', 120, 445000], ['p12', 40]], 'u_men', 'new');
    // заказы по телефону на разных стадиях — для доски отгрузок
    [['k3', 'picking', -1, 0.5], ['k6', 'picking', 0, 0], ['k2', 'ready', -1, 1], ['k12', 'ready', -1, 0.3], ['k7', 'shipping', -2, 1], ['k4', 'new', 0, 0], ['k9', 'shipping', -1, 0.5]].forEach(([k, stage, d, part]) => {
      const ink = k === 'k4' || k === 'k9';
      const lines = Array.from({ length: ri(2, 3) }, () => { const p = pick(ink ? INK_ITEMS : B2B_ITEMS); return [p, P[p].pack === 'bucket' ? ri(3, 10) : ri(8, 30)]; });
      const s = makeSale(d, 'main', 'phone', k, lines, 'u_men', stage);
      if (s && part) pay(s, K[k].type === 'legal' ? 'transfer' : 'cash', part === 1 ? s.total : Math.round(s.total * part / 1000) * 1000, plusH(s.at, 1), 'u_men');
    });

    /* ---------- возвраты ---------- */
    const old = db.sales.filter(s => s.shipped && W.daysBetween(s.at, today) > 6);
    const paidOf = s => W.sum(db.payments.filter(p => p.sale === s.id), p => p.amount);
    [[old.find(s => s.channel === 'shop' && paidOf(s) >= s.total), 'cash', 'Не подошёл оттенок'], [old.find(s => s.channel === 'main' && s.items.some(i => P[i.p].pack === 'bucket')), 'transfer', 'Повреждена тара при доставке']].forEach(([s, method, reason]) => {
      if (!s) return;
      const it = s.items.find(i => P[i.p].pack === 'bucket') || s.items[0];
      const q = Math.min(it.qty, s.channel === 'shop' ? 1 : 2);
      const a = plusH(s.at, ri(24, 96));
      const r = { id: id('r'), no: ++seq.ret, at: a, sale: s.id, items: [{ p: it.p, qty: q, price: it.price }], amount: W.round(q * it.price), method, reason, by: s.channel === 'shop' ? 'u_sel' : 'u_men' };
      db.returns.push(r);
      mv('p', it.p, s.channel, q, 'return', r.id, a, 'u_skl');
      const paid = W.sum(db.payments.filter(p => p.sale === s.id), p => p.amount);
      const refund = Math.min(r.amount, Math.max(0, paid - (s.total - r.amount)));
      r.refunded = refund;
      if (refund > 0) {
        db.payments.push({ id: id('pay'), at: a, sale: s.id, method, amount: -refund, by: r.by, refund: r.id });
        money(method, -1, refund, a, 'return', r.id, `Возврат по продаже №${W.no(s.no)}`, s.cust ? K[s.cust].name : 'Розничный покупатель', W.no(r.no), r.by);
      }
    });

    /* ---------- витринные остатки: что-то заканчивается ---------- */
    const setTotal = (t, item, wh, target) => { const q = W.round(target - have(t, item, wh), 3); if (q) mv(t, item, wh, q, 'adjust', null, at(-1, 17, 18), 'u_skl', N('Инвентаризация')); };
    setTotal('p', 'p19', 'shop', 0); setTotal('p', 'p19', 'main', 0); setTotal('p', 'p19', 'prod', 0);
    setTotal('p', 'p14', 'shop', 2); setTotal('p', 'p14', 'main', 4); setTotal('p', 'p14', 'prod', 0);
    setTotal('p', 'p13', 'main', 9); setTotal('p', 'p13', 'prod', 0);
    setTotal('p', 'p10', 'shop', 3); setTotal('p', 'p10', 'main', 6);
    setTotal('m', 'm7', 'raw', 12); setTotal('m', 'm16', 'raw', 64); setTotal('m', 'm11', 'raw', 22);

    /* ---------- зарплата ---------- */
    const cm = W.month(), months = [];
    { const d = new Date(); for (let i = 2; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`); } }
    const sal = users.filter(u => u.salary > 0);
    const office = ['u_dir', 'u_buh', 'u_men', 'u_sel', 'u_skl', 'u_tex'];
    months.forEach((ym, mi) => {
      const first = `${ym}-01T09:${pad(ri(0, 30))}`;
      const firstAt = first < `${W.addDays(today, start)}` ? `${W.addDays(today, start)}T09:00` : first;
      sal.forEach(u => {
        if (u.fired && `${ym}-01` > u.fired) return;
        const acc = (kind, amount, note = '', a = firstAt) => db.accruals.push({ id: id('ac'), at: a, emp: u.id, period: ym, kind, amount, note, by: 'u_buh' });
        acc('salary', u.salary); acc('advance', u.advance);
        if (['u_men', 'u_sel'].includes(u.id) && ym !== cm) acc('bonus', ri(5, 15) * 100000, 'Премия за план продаж', `${ym}-28T17:00`);
        if (['u_w1', 'u_w2'].includes(u.id) && mi === 1) acc('overtime', ri(4, 9) * 100000, 'Работа в выходные', `${ym}-25T17:00`);
        if (u.id === 'u_w3' && mi === 1) acc('deduction', 300000, 'Порча тары по вине сотрудника', `${ym}-27T12:00`);
        const method = office.includes(u.id) ? 'transfer' : 'cash';
        const advAt = `${ym}-15T12:${pad(ri(0, 59))}`;
        if (advAt.slice(0, 10) <= today && advAt.slice(0, 10) >= W.addDays(today, start)) {
          db.payouts.push({ id: id('pv'), at: advAt, emp: u.id, period: ym, amount: u.advance, method, note: 'Аванс', by: 'u_buh' });
        } else if (advAt.slice(0, 10) <= today) {
          db.payouts.push({ id: id('pv'), at: `${W.addDays(today, start)}T10:00`, emp: u.id, period: ym, amount: u.advance, method, note: 'Аванс', by: 'u_buh' });
        }
        if (ym === cm) return;
        const accrued = W.sum(db.accruals.filter(a => a.emp === u.id && a.period === ym && a.kind !== 'advance'), a => a.kind === 'deduction' ? -a.amount : a.amount);
        let rest = accrued - u.advance;
        const [y, m] = ym.split('-').map(Number);
        const nx = new Date(y, m, 5);
        const restAt = `${W.isoDay(nx)}T11:${pad(ri(0, 59))}`;
        if (restAt.slice(0, 10) > today) return;
        if (mi === 1 && ['u_w1', 'u_tex'].includes(u.id)) rest = Math.round(rest * 0.6 / 100000) * 100000;
        if (mi === 1 && u.id === 'u_w3') rest += 300000; // удержание провели позже — образовалась переплата
        db.payouts.push({ id: id('pv'), at: restAt, emp: u.id, period: ym, amount: rest, method, note: 'Зарплата за месяц', by: 'u_buh' });
      });
    });
    db.payouts.forEach(p => money(p.method, -1, p.amount, p.at, 'salary', p.id, `Зарплата: ${W.by(users)[p.emp].name}`, W.by(users)[p.emp].name, '', 'u_buh'));

    /* ---------- касса по дням: подкрепление с расчётного счёта и инкассация по субботам ---------- */
    {
      const bal = { cash: 0, corp: 0 };
      const sorted = db.cash.slice().sort((a, b) => a.at < b.at ? -1 : 1);
      let i = 0;
      for (let d = start; d <= 0; d++) {
        const day = W.addDays(today, d);
        while (i < sorted.length && sorted[i].at.slice(0, 10) <= day) { const c = sorted[i++]; if (bal[c.acc] != null) bal[c.acc] += c.dir * c.amount; }
        const ref = () => id('tr');
        if (bal.cash < 4000000) {
          const amt = Math.ceil((8000000 - bal.cash) / 1000000) * 1000000, a = `${day}T09:05`, r = ref();
          bankOp(-1, amt, a, 'Снятие наличных в кассу', settings.company.bank, '', 'transfer', r, 'u_buh');
          cash('cash', 1, amt, a, 'transfer', r, 'Получено с расчётного счёта', 'u_buh'); bal.cash += amt;
        }
        if (bal.corp < 1500000) {
          const amt = 6000000, a = `${day}T09:10`, r = ref();
          bankOp(-1, amt, a, 'Пополнение корпоративной карты', settings.company.bank, '', 'transfer', r, 'u_buh');
          cash('corp', 1, amt, a, 'transfer', r, 'Пополнение с расчётного счёта', 'u_buh'); bal.corp += amt;
        }
        if (W.parse(day).getDay() === 6 && bal.cash > 18000000 && d < 0) {
          const amt = Math.floor((bal.cash - 12000000) * 0.7 / 100000) * 100000, a = `${day}T16:30`, r = ref();
          cash('cash', -1, amt, a, 'transfer', r, 'Инкассация на расчётный счёт', 'u_buh');
          bankOp(1, amt, a, 'Инкассация наличных', 'Наличные', '', 'transfer', r, 'u_buh'); bal.cash -= amt;
        }
      }
    }
    db.salaryLog.push(
      { id: id('sl'), at: `${months[0]}-01T09:05`, action: 'create', doc: 'accrual', target: 'Все сотрудники', change: `Оклады и авансы за ${months[0]}`, by: 'u_buh' },
      { id: id('sl'), at: `${months[1]}-01T09:07`, action: 'create', doc: 'accrual', target: 'Все сотрудники', change: `Оклады и авансы за ${months[1]}`, by: 'u_buh' },
      { id: id('sl'), at: `${W.addDays(today, -38)}T15:20`, action: 'edit', doc: 'employee', target: 'Назарова Севара Алишеровна', change: 'Оклад: 5 500 000 → 6 000 000', by: 'u_dir' },
      { id: id('sl'), at: `${W.addDays(today, -45)}T17:40`, action: 'archive', doc: 'employee', target: 'Сафаров Рустам Олимович', change: 'Статус: активен → в архиве', by: 'u_dir' },
      { id: id('sl'), at: `${months[1]}-27T12:10`, action: 'create', doc: 'accrual', target: 'Исмоилов Бекзод Равшанович', change: 'Удержание: 300 000 сум', by: 'u_buh' },
      { id: id('sl'), at: `${W.addDays(today, -20)}T10:00`, action: 'create', doc: 'employee', target: 'Ахмедов Фаррух Илхомович', change: 'Новый сотрудник: Стажёр, без оклада', by: 'u_dir' },
      { id: id('sl'), at: `${cm}-01T09:04`, action: 'create', doc: 'accrual', target: 'Все сотрудники', change: `Оклады и авансы за ${cm}`, by: 'u_buh' },
    );

    /* ---------- порядок и нумерация ---------- */
    ['moves', 'sales', 'payments', 'cash', 'bank', 'expenses', 'purchases', 'prodOrders', 'accruals', 'payouts', 'salaryLog', 'returns'].forEach(k => db[k].sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
    db.sales.forEach((s, i) => { s.no = 1001 + i; });
    db.seq.sale = 1000 + db.sales.length;
    db.seq.prod = seq.prod; db.seq.purchase = seq.purchase; db.seq.ret = seq.ret;
    db.prodOrders.forEach((o, i) => { o.no = i + 1; });
    db.purchases.forEach((p, i) => { p.no = i + 1; });
    db.seq.prod = db.prodOrders.length; db.seq.purchase = db.purchases.length;
    // номера в описаниях банка/кассы должны совпасть с итоговой нумерацией продаж
    const sNo = Object.fromEntries(db.sales.map(s => [s.id, s.no]));
    db.bank.concat(db.cash).forEach(x => { if (x.kind === 'sale' && sNo[x.ref]) { x.num = W.no(sNo[x.ref]); x.desc = x.desc && `Оплата по продаже №${W.no(sNo[x.ref])}`; x.note = x.note && `Оплата по продаже №${W.no(sNo[x.ref])}`; } });
    const pNo = Object.fromEntries(db.purchases.map(p => [p.id, p.no]));
    db.bank.concat(db.cash).forEach(x => { if (x.kind === 'purchase' && pNo[x.ref]) { x.num = W.no(pNo[x.ref]); if (x.desc) x.desc = `Оплата поставщику, приход №${W.no(pNo[x.ref])}`; if (x.note) x.note = `Оплата поставщику, приход №${W.no(pNo[x.ref])}`; } });
    db.users.find(u => u.id === 'u_dir').lastLogin = `${W.addDays(today, -1)}T18:12`;
    return db;
  };
})();
