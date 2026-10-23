/* =========================================================================
   WINNER — переводы: RU (исходный), UZ латиница, ЎЗ кириллица.
   Ключ словаря — русская строка. Значение — узбекская латиница с обычным
   апострофом (o', g', ma'lumot); кириллица строится транслитерацией.
   Если транслитерация ошибается, значение пишется объектом { l: '…', c: '…' }.
   ========================================================================= */
(function () {
  const W = window.W = window.W || {};
  const LKEY = 'wn.lang';
  W.LANGS = [
    { id: 'ru', label: 'RU', name: 'Русский' },
    { id: 'uzc', label: 'ЎЗ', name: 'Ўзбекча' },
    { id: 'uz', label: 'UZ', name: 'Oʻzbekcha' },
  ];
  W.lang = (() => { try { const l = localStorage.getItem(LKEY); return W.LANGS.some(x => x.id === l) ? l : 'ru'; } catch (e) { return 'ru'; } })();
  document.documentElement.lang = W.lang === 'ru' ? 'ru' : 'uz';
  W.DICT = W.DICT || {};
  W.N = s => s; // метка «строка для перевода» — переводится позже через W.t

  /* o' g' → oʻ gʻ, остальные апострофы → ʼ (тутуқ белгиси) */
  const fixLat = s => s.replace(/([oOgG])['ʻ‘’]/g, '$1ʻ').replace(/(\w)['’]/g, '$1ʼ');

  /* латиница → кириллица */
  const M1 = { a: 'а', b: 'б', c: 'ц', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х', y: 'й', z: 'з' };
  const M2 = { sh: 'ш', ch: 'ч', "o'": 'ў', "g'": 'ғ', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е' };
  const APOS = /['ʻʼ‘’`]/;
  const KEEP = /(\{\w+\}|https?:\/\/\S+|\b(?:Excel|CSV|PDF|Didox|USD|UZS|JSON|XLSX|WINNER|SAVER PAINTS|MCHJ|Ctrl|Enter|Esc|RU|UZ|ЎЗ|e-mail|E-mail|ID|SMS)\b)/;
  const translitPart = str => {
    let out = '';
    for (let i = 0; i < str.length;) {
      const ch = str[i], lc = ch.toLowerCase(), up = ch !== lc;
      // заимствования: operatsiya → операция, kalkulyatsiya → калкуляция
      if (lc === 't' && (str[i + 1] || '').toLowerCase() === 's' && (str[i + 2] || '').toLowerCase() === 'i') { out += up ? 'Ц' : 'ц'; i += 2; continue; }
      const two = (lc + (str[i + 1] || '').toLowerCase()).replace(APOS, "'");
      if (M2[two] && !(two[0] === 'y' && APOS.test(str[i + 2] || ''))) {
        const r = M2[two]; out += up ? r.toUpperCase() : r; i += 2; continue;
      }
      if (lc === 'e') {
        const prev = str[i - 1] || '';
        const r = (!/[a-zA-Z]/.test(prev) || /[aeiouAEIOU]/.test(prev)) ? 'э' : 'е';
        out += up ? r.toUpperCase() : r; i++; continue;
      }
      if (APOS.test(ch) && /[a-zA-Z]/.test(str[i - 1] || '') && /[a-zA-Z]/.test(str[i + 1] || '')) { out += 'ъ'; i++; continue; }
      if (M1[lc]) { out += up ? M1[lc].toUpperCase() : M1[lc]; i++; continue; }
      out += ch; i++;
    }
    return out;
  };
  W.toCyr = s => String(s).split(KEEP).map((p, i) => (i % 2 ? p : translitPart(p))).join('');

  /* перевод */
  const cache = { uz: {}, uzc: {} };
  const tr = (s, lang) => {
    if (lang === 'ru' || s == null || s === '') return s;
    const c = cache[lang];
    if (s in c) return c[s];
    const e = W.DICT[s];
    let out = s;
    if (e != null) {
      if (typeof e === 'object') out = lang === 'uzc' ? (e.c || W.toCyr(e.l)) : fixLat(e.l);
      else out = lang === 'uzc' ? W.toCyr(e) : fixLat(e);
    } else if (W.i18nDebug) (W.i18nMissing = W.i18nMissing || new Set()).add(s);
    return (c[s] = out);
  };
  W.t = (s, vars, lang) => {
    let out = tr(s, lang || W.lang);
    if (vars) out = String(out).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return out;
  };

  /* перевод строк из данных: точное совпадение, шаблон «… №{n}» или «Категория: описание» */
  const TPL = ['Оплата по продаже №{n}', 'Оплата поставщику, приход №{n}', 'Возврат по продаже №{n}', 'Зарплата: {n}', 'Оклады и авансы за {n}'];
  const TPL_RE = TPL.map(s => [s, new RegExp('^' + s.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace('{n}', '(.+)') + '$')]);
  W.tx = (s) => {
    if (!s || W.lang === 'ru') return s;
    if (W.DICT[s] != null) return W.t(s);
    for (const [k, re] of TPL_RE) { const m = String(s).match(re); if (m) return W.t(k, { n: m[1] }); }
    const i = String(s).indexOf(': ');
    if (i > 0 && W.DICT[s.slice(0, i)] != null) return W.t(s.slice(0, i)) + s.slice(i);
    return s;
  };

  /* смена языка — с плавным перерисовыванием (View Transitions, если есть) */
  W.setLang = (l) => {
    if (l === W.lang) return;
    const apply = () => {
      W.lang = l;
      try { localStorage.setItem(LKEY, l); } catch (e) { /* приватный режим */ }
      document.documentElement.lang = l === 'ru' ? 'ru' : 'uz';
      W.emit && W.emit('lang', l);
    };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply);
    else { apply(); const v = document.querySelector('.main, .login'); if (v) { v.classList.remove('lang-swap'); void v.offsetWidth; v.classList.add('lang-swap'); } }
  };

  /* переключатель RU · ЎЗ · UZ с «бегунком» */
  W.langSwitch = (cls = '') => `<div class="lang-switch ${cls}" role="group" aria-label="Language">
    <span class="pill"></span>${W.LANGS.map(l => `<button type="button" data-lang="${l.id}" class="${l.id === W.lang ? 'on' : ''}" title="${l.name}">${l.label}</button>`).join('')}</div>`;
  const placePill = sw => {
    const on = sw.querySelector('button.on'), pill = sw.querySelector('.pill');
    if (!on || !pill || !on.offsetWidth) return;
    pill.style.width = on.offsetWidth + 'px';
    pill.style.transform = `translateX(${on.offsetLeft - 3}px)`;
  };
  // пересчёт при любом изменении размера (скрытая вкладка, поворот экрана, загрузка шрифта)
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(es => es.forEach(e => placePill(e.target))) : null;
  W.placeLangPill = (root = document) => root.querySelectorAll('.lang-switch').forEach(sw => {
    placePill(sw);
    if (ro && !sw._ro) { sw._ro = 1; ro.observe(sw); }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('.lang-switch [data-lang]');
    if (!b) return;
    const sw = b.closest('.lang-switch');
    sw.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    W.placeLangPill(sw.parentNode);
    setTimeout(() => W.setLang(b.dataset.lang), 140);
  });

  /* названия месяцев */
  W.MONTHS = [W.N('Январь'), W.N('Февраль'), W.N('Март'), W.N('Апрель'), W.N('Май'), W.N('Июнь'), W.N('Июль'), W.N('Август'), W.N('Сентябрь'), W.N('Октябрь'), W.N('Ноябрь'), W.N('Декабрь')];
  W.MON_SHORT = [W.N('янв'), W.N('фев'), W.N('мар'), W.N('апр'), W.N('мая'), W.N('июн'), W.N('июл'), W.N('авг'), W.N('сен'), W.N('окт'), W.N('ноя'), W.N('дек')];
  W.monthName = ym => { const [y, m] = ym.split('-'); return `${W.t(W.MONTHS[+m - 1])} ${y}`; };
  W.dayShort = day => { const [, m, d] = day.split('-'); return `${+d} ${W.t(W.MON_SHORT[+m - 1])}`; };
})();
