/* Каталог (ТЗ 4.4, 4.18): карточки продукции для продавца — остатки, цена за штуку */
(function () {
  const W = window.W, I = W.icon, esc = W.esc;
  const t = (s, v) => W.t(s, v);
  const st = () => W.st('catalog', { q: '', cat: 'all', avail: 'all' });
  const PAL = ['#eef1f5', '#d7262e', '#1f4fd1', '#f5b800', '#22252d', '#7ec8e3', '#12b981', '#c98a2b', '#8b929c', '#e4007c', '#00a3e0', '#6a5cff'];

  const productForm = (p) => {
    const isNew = !p;
    p = p || { cat: st().cat !== 'all' && st().cat !== 'none' ? st().cat : null, price: 0, noShip: false, pack: 'can', color: PAL[Math.floor(Math.random() * PAL.length)], photo: '' };
    let photo = p.photo, color = p.color, pack = p.pack || 'can';
    const prev = () => W.productArt({ photo, color, pack, name: p.name });
    W.modal({
      size: 'lg', title: isNew ? t('Новый товар') : t('Карточка товара'), sub: isNew ? t('Товар появится в каталоге, номенклатуре и при продаже') : esc(p.name), icon: 'grid',
      body: `<div class="grid g-side" style="gap:20px">
        <div><div class="pcard" style="box-shadow:none"><div class="ph p-prev">${prev()}</div></div>
          <div class="row mt-12"><label class="btn sm" style="flex:1">${I('upload')}${t('Загрузить фото')}<input type="file" accept="image/*" class="hidden" data-photo></label>
          <button class="btn sm ${photo ? '' : 'hidden'} rm-photo" data-m="rmPhoto" title="${t('Убрать фото')}">${I('trash')}</button></div>
          <div class="label mt-16">${t('Цвет изображения')}</div>
          <div class="row mt-8" style="gap:6px">${PAL.map(c => `<button type="button" data-m="color" data-v="${c}" style="width:26px;height:26px;border-radius:8px;border:2px solid ${c === color ? 'var(--brand)' : 'var(--line)'};background:${c}" aria-label="${c}"></button>`).join('')}</div>
          <div class="label mt-16">${t('Упаковка')}</div>
          <div class="seg mt-8">${[['can', t('Банка')], ['bucket', t('Ведро')]].map(([k, v]) => `<button type="button" class="${k === pack ? 'on' : ''}" data-m="pack" data-v="${k}">${v}</button>`).join('')}</div></div>
        <div class="form-grid" style="align-content:start">
          ${W.fi({ name: 'name', label: t('Название'), value: p.name || '', req: true, cls: 'full' })}
          ${W.fs({ name: 'cat', label: t('Категория'), options: [['', t('Без категории')], ...W.db.categories.map(c => [c.id, t(c.name)])], value: p.cat || '' })}
          ${W.fi({ name: 'sku', label: t('Артикул'), value: p.sku || '' })}
          ${W.fi({ name: 'price', label: t('Цена за штуку'), money: true, value: p.price || '', req: true, suffix: W.curLabel() })}
          ${W.fi({ name: 'minStock', label: t('Мин. порог, шт'), type: 'number', value: p.minStock ?? '', ph: String(W.db.settings.lowStock), hint: t('Уведомить, когда остаток дойдёт до порога') })}
          <div class="full card card-pad" style="box-shadow:none;background:var(--surface-2)">${W.fsw({ name: 'noShip', label: t('Не отгружать без остатка'), checked: p.noShip })}
            <div class="hint mt-8">${t('Программа не даст продать или отгрузить товар, если его нет на складе канала продажи.')}</div></div>
          ${!isNew ? `<div class="full"><div class="label">${t('Остаток')}</div><div class="row mt-8"><span class="tag">${t('На складе')}: ${W.qty(W.stock('p', p.id))} ${t('шт')}</span>${W.reserved(p.id) ? `<span class="tag">${t('в резерве {n}', { n: W.qty(W.reserved(p.id)) })}</span>` : ''}</div></div>` : ''}
        </div></div>`,
      foot: `${!isNew && W.isDirector() ? `<div class="left"><button class="btn danger" data-m="del">${I('trash')}${t('Удалить')}</button></div>` : ''}<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Сохранить')}</button>`,
      onMount: (el) => {
        el.querySelector('[data-photo]').addEventListener('change', async e => {
          const f = e.target.files[0]; if (!f) return;
          try { photo = await W.readImage(f); el.querySelector('.p-prev').innerHTML = prev(); el.querySelector('.rm-photo').classList.remove('hidden'); }
          catch (er) { W.toast(t('Не удалось прочитать изображение'), 'err'); }
        });
      },
      actions: {
        rmPhoto: (b, m) => { photo = ''; m.el.querySelector('.p-prev').innerHTML = prev(); b.classList.add('hidden'); },
        color: (b, m) => { color = b.dataset.v; m.el.querySelectorAll('[data-m=color]').forEach(x => { x.style.borderColor = x === b ? 'var(--brand)' : 'var(--line)'; }); m.el.querySelector('.p-prev').innerHTML = prev(); },
        pack: (b, m) => { pack = b.dataset.v; m.el.querySelectorAll('[data-m=pack]').forEach(x => x.classList.toggle('on', x === b)); m.el.querySelector('.p-prev').innerHTML = prev(); },
        save: (b, m) => {
          if (!W.validate(m.el)) return;
          const d = W.form(m.el);
          const data = { name: d.name, cat: d.cat || null, sku: d.sku, price: d.price, minStock: m.el.querySelector('[name=minStock]').value === '' ? null : Math.max(0, Math.round(d.minStock)), noShip: d.noShip, photo, color, pack };
          if (isNew) { p = Object.assign({ id: W.uid('p') }, data); W.db.products.push(p); } else Object.assign(p, data);
          W.save(); m.close(); W.toast(isNew ? t('Товар добавлен в каталог') : t('Карточка сохранена'));
        },
        del: async (b, m) => {
          if (W.db.moves.some(x => x.t === 'p' && x.item === p.id) || W.db.sales.some(s => s.items.some(i => i.p === p.id))) {
            if (!await W.confirm({ title: t('Убрать товар из каталога?'), text: t('По товару есть движения, поэтому он уйдёт в архив, а история сохранится.'), ok: t('В архив') })) return;
            p.archived = true;
          } else {
            if (!await W.confirm({ title: t('Удалить товар?'), text: esc(p.name) })) return;
            W.db.products = W.db.products.filter(x => x.id !== p.id); delete W.db.recipes[p.id];
          }
          W.save(); m.close(); W.toast(t('Товар убран из каталога'));
        },
      },
    });
  };

  const catsForm = () => {
    const draw = () => W.db.categories.map(c => `<div class="row nw mb-16" style="margin-bottom:8px"><input class="inp" data-cat="${c.id}" value="${esc(c.name)}"><span class="tag nowrap">${W.db.products.filter(p => p.cat === c.id && !p.archived).length}</span><button class="btn icon ghost" data-m="delCat" data-id="${c.id}" title="${t('Удалить')}">${I('trash')}</button></div>`).join('');
    W.modal({
      size: 'sm', title: t('Разделы каталога'), sub: t('Категории товаров'), icon: 'layers',
      body: `<div class="cat-list">${draw()}</div><div class="row nw mt-12"><input class="inp" name="newCat" placeholder="${t('Новый раздел')}"><button class="btn" data-m="addCat">${I('plus')}${t('Добавить')}</button></div>`,
      foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Сохранить')}</button>`,
      actions: {
        addCat: (b, m) => { const i = m.el.querySelector('[name=newCat]'); const v = i.value.trim(); if (!v) return i.focus(); W.db.categories.push({ id: W.uid('c'), name: v }); i.value = ''; m.el.querySelector('.cat-list').innerHTML = draw(); },
        delCat: async (b, m) => {
          const c = W.db.categories.find(x => x.id === b.dataset.id), n = W.db.products.filter(p => p.cat === c.id).length;
          if (n && !await W.confirm({ title: t('Удалить раздел «{n}»?', { n: c.name }), text: t('{n} товаров перейдут в «Без категории».', { n }) })) return;
          W.db.products.forEach(p => { if (p.cat === c.id) p.cat = null; });
          W.db.categories = W.db.categories.filter(x => x.id !== c.id); m.el.querySelector('.cat-list').innerHTML = draw();
        },
        save: (b, m) => { m.el.querySelectorAll('[data-cat]').forEach(i => { const c = W.db.categories.find(x => x.id === i.dataset.cat); if (c && i.value.trim()) c.name = i.value.trim(); }); W.save(); m.close(); W.toast(t('Разделы сохранены')); },
      },
    });
  };

  const viewProduct = (p) => {
    const canSell = W.allow('sales.create');
    W.modal({
      size: 'sm', title: esc(p.name), sub: esc(W.catName(p.cat)), icon: 'grid',
      body: `<div class="pcard" style="box-shadow:none"><div class="ph">${W.productArt(p)}</div></div>
        <div class="row mt-16" style="justify-content:space-between"><span class="muted">${t('Цена за штуку')}</span><b class="money" style="font-size:18px;font-family:var(--font-d)">${W.money(p.price)}</b></div>
        <div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('На складе')}</span><b>${W.qty(W.stock('p', p.id))} ${t('шт')}</b></div>
        ${W.reserved(p.id) ? `<div class="row mt-8" style="justify-content:space-between"><span class="muted">${t('В резерве')}</span><b>${W.qty(W.reserved(p.id))} ${t('шт')}</b></div>` : ''}
        ${p.noShip ? `<div class="mt-12">${W.badge(t('Не отгружать без остатка'), 'warn')}</div>` : ''}`,
      foot: `<button class="btn" data-m="close">${t('Закрыть')}</button>${canSell ? `<button class="btn primary" data-m="sell">${I('cart')}${t('Продать')}</button>` : ''}`,
      actions: { sell: (b, m) => { m.close(); W.saleForm({ source: 'walkin', item: { p: p.id, qty: 1, price: p.price } }); } },
    });
  };

  const grid = () => {
    const S = st(), q = S.q.trim().toLowerCase(), canE = W.allow('catalog.edit');
    const list = W.db.products.filter(p => !p.archived && (S.cat === 'all' || (S.cat === 'none' ? !p.cat : p.cat === S.cat))
      && (S.avail === 'all' || (S.avail === 'in' ? W.stock('p', p.id) > 0 : W.stock('p', p.id) <= 0))
      && (!q || (p.name + ' ' + (p.sku || '')).toLowerCase().includes(q)));
    return `<div class="row mb-16" style="justify-content:space-between"><span class="muted">${t('Найдено позиций: {n}', { n: `<b style="color:var(--text)">${list.length}</b>` })}</span></div>
      ${list.length ? `<div class="prod-grid">${list.map(p => {
        const total = W.stock('p', p.id), res = W.reserved(p.id), low = total > 0 && total <= W.minStock(p);
        return `<div class="pcard" data-a="open" data-id="${p.id}" style="cursor:pointer"><div class="ph">${W.productArt(p)}
          <div class="p-flags">${total <= 0 ? `<span class="flag nostock">${t('Нет в наличии')}</span>` : low ? `<span class="flag low">${t('Мало')}</span>` : ''}${p.noShip ? `<span class="flag noship">${t('Не отгружать без остатка')}</span>` : ''}</div>
          ${canE ? `<button class="btn sm edit" data-a="edit" data-id="${p.id}">${I('edit')}${t('Изменить')}</button>` : ''}</div>
          <div class="pb"><div class="pcat">${esc(W.catName(p.cat))}</div><div class="pname">${esc(p.name)}</div>
            <div class="pprice">${W.money(p.price)} <small>/ ${t('шт')}</small></div>
            <div class="pstock">${total > 0 ? `<span><span class="muted">${t('На складе')}:</span> <b>${W.qty(total)} ${t('шт')}</b></span>${res ? `<span class="muted" style="font-size:12px">${t('в резерве {n}', { n: W.qty(res) })}</span>` : ''}` : `<span style="color:var(--bad);font-weight:600">${t('Нет в наличии')}</span>`}</div></div></div>`;
      }).join('')}</div>` : W.empty(t('Ничего не найдено'), t('Измените поиск или выберите другой раздел'), 'grid')}`;
  };

  W.page('catalog', {
    render() {
      const S = st(), canE = W.allow('catalog.edit');
      const act = W.db.products.filter(p => !p.archived);
      const cnt = id => act.filter(p => id === 'all' ? true : id === 'none' ? !p.cat : p.cat === id).length;
      return `<div class="page-head"><div><h1>${t('Каталог')}</h1><div class="sub">${t('Продукция, цены за штуку и остатки на складе')}</div></div>
        <div class="actions">${canE ? `<button class="btn" data-a="cats">${I('layers')}${t('Разделы')}</button><button class="btn primary" data-a="add">${I('plus')}${t('Новый товар')}</button>` : ''}</div></div>
        <div class="toolbar">${W.searchBox(S.q, 'q', t('Поиск по названию'))}${W.seg([{ id: 'all', label: t('Все') }, { id: 'in', label: t('В наличии') }, { id: 'out', label: t('Нет в наличии') }], S.avail, 'avail')}</div>
        <div class="cats">${[{ id: 'all', name: t('Все') }, ...W.db.categories.map(c => ({ id: c.id, name: t(c.name) })), { id: 'none', name: t('Без категории') }].map(c => `<button class="cat-chip ${S.cat === c.id ? 'on' : ''}" data-a="cat" data-v="${c.id}">${esc(c.name)}<span>${cnt(c.id)}</span></button>`).join('')}
          ${canE ? `<button class="cat-chip add" data-a="newCat">${I('plus', 'ic-sm')}${t('Раздел')}</button>` : ''}</div>
        <div data-region="grid">${grid()}</div>`;
    },
    actions: {
      q: el => { st().q = el.value; W.region('grid', grid()); },
      cat: el => { st().cat = el.dataset.v; W.swap(); },
      avail: el => { st().avail = el.dataset.v; W.swap(); },
      add: () => productForm(),
      edit: (el, e) => { e.stopPropagation(); productForm(W.product(el.dataset.id)); },
      open: (el, e) => { if (e.target.closest('[data-a=edit]')) return; const p = W.product(el.dataset.id); W.allow('catalog.edit') ? productForm(p) : viewProduct(p); },
      cats: () => catsForm(),
      newCat: () => W.modal({ size: 'sm', title: t('Новый раздел'), icon: 'layers', body: W.fi({ name: 'name', label: t('Название раздела'), req: true, ph: t('Например: Колеры') }),
        foot: `<button class="btn" data-m="close">${t('Отмена')}</button><button class="btn primary" data-m="save">${I('check')}${t('Создать')}</button>`,
        actions: { save: (b, m) => { if (!W.validate(m.el)) return; const c = { id: W.uid('c'), name: W.form(m.el).name }; W.db.categories.push(c); st().cat = c.id; W.save(); m.close(); W.toast(t('Раздел создан')); } } }),
    },
  });
})();
