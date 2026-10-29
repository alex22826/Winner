/* WINNER — вход в кабинет: форма и живой фон «мраморная краска» (WebGL) */
(function () {
  const W = window.W, I = W.icon;
  const t = (s, v) => W.t(s, v);
  W.initDB();
  if (W.me()) { location.replace('app.html'); return; }

  const root = document.getElementById('root');
  const dark = () => document.documentElement.dataset.theme === 'dark';
  const tools = () => `${W.langSwitch()}<button class="icon-btn" data-theme-btn title="${dark() ? t('Светлая тема') : t('Тёмная тема')}">${I(dark() ? 'sun' : 'moon')}</button>`;
  // тексты левой части и форма рисуются отдельно от фона: при смене языка фон (WebGL) не пересоздаётся
  const artIn = () => `
      <div class="art-brand"><div class="logo-mark">${W.LOGO_W}</div><div><b>WINNER</b><span>SAVER PAINTS · ${t('учёт производства')}</span></div><div class="art-tools">${tools()}</div></div>
      <div class="art-copy"><span class="kicker"><i></i>${t('Краски · лаки · типографская краска · мастики')}</span>
        <h1>${t('Учёт сырья и')} <em>${t('готовой продукции')}</em></h1>
        <p>${t('Склад, производство, продажи, касса, банк и зарплата — в одном кабинете с телефона, планшета и ноутбука.')}</p>
        <div class="art-feats">
          <div class="art-feat">${I('factory')}<b>${t('Производство')}</b><span>${t('калькуляция и выпуск')}</span></div>
          <div class="art-feat">${I('truck')}<b>${t('Отгрузки')}</b><span>${t('стадии каждого заказа')}</span></div>
          <div class="art-feat">${I('shieldCheck')}<b>${t('Банк')}</b><span>${t('подтверждение бухгалтером')}</span></div>
        </div></div>
      <div class="art-foot"><span>© ${new Date().getFullYear()} WINNER</span><span>${t('Ташкент, Узбекистан')}</span></div>`;
  const auth = () => `<div class="auth-top">${tools()}</div>
      <div class="auth-box">
        <form class="auth-form" novalidate>
          <div class="h-eyebrow"><i></i>${t('Личный кабинет')}</div>
          <h2>${t('Вход в кабинет')}</h2>
          <p class="lead">${t('Введите логин и пароль, которые выдал директор')}</p>
          <div class="field"><label for="lg">${t('Логин')}</label><div class="inp-wrap">${I('user')}<input class="inp" id="lg" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${t('например')}, director" value="${W.esc(state.login)}"></div></div>
          <div class="field"><label for="pw">${t('Пароль')}</label><div class="inp-wrap">${I('lock')}<input class="inp" id="pw" name="pass" type="password" autocomplete="current-password" placeholder="••••••••" value="${W.esc(state.pass)}" style="padding-right:50px"><button type="button" class="eye" data-eye aria-label="${t('Показать пароль')}">${I('eye')}</button></div></div>
          <div class="auth-err" role="alert">${I('alert', 'ic-sm')}<span></span></div>
          <button class="btn paint lg block" type="submit">${t('Войти')}${I('chevR')}</button>
          <div class="auth-help">${I('key', 'ic-sm')}<span>${t('Забыли пароль? Обратитесь к директору — он выдаст новый в разделе «Сотрудники».')}</span></div>
        </form>
        <div class="auth-ok"><div class="ring">${I('check')}</div><h2 style="font-size:24px">${t('Добро пожаловать')}</h2><p class="muted mt-8 ok-name"></p></div>
      </div>
      <div class="auth-foot">${t('Данные защищены паролем · версия {v}', { v: W.APP_VERSION })}</div>`;
  const state = { login: '', pass: '' };

  const draw = () => {
    const f = root.querySelector('.auth-form');
    if (f) { state.login = f.login.value; state.pass = f.pass.value; }
    if (!root.querySelector('.login')) {
      root.innerHTML = `<div class="login"><section class="art"><canvas></canvas><div class="art-in">${artIn()}</div></section><section class="auth">${auth()}</section></div>`;
      startGL(root.querySelector('.art canvas'));
    } else {
      root.querySelector('.art-in').innerHTML = artIn();
      root.querySelector('.auth').innerHTML = auth();
    }
    W.placeLangPill(root);
    bind();
  };
  const showErr = (msg) => { const e = root.querySelector('.auth-err'); e.querySelector('span').textContent = msg; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); };
  const bind = () => {
    const f = root.querySelector('.auth-form');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const login = f.login.value.trim(), pass = f.pass.value;
      if (!login) { f.login.focus(); return showErr(t('Введите логин')); }
      if (!pass) { f.pass.focus(); return showErr(t('Введите пароль')); }
      const b = f.querySelector('[type=submit]');
      b.disabled = true; b.innerHTML = `<span class="spin"></span>${t('Проверяем…')}`;
      let r;
      try { r = await W.login(login, pass); } catch (er) { r = { err: 'crypto' }; }
      if (r.err) {
        b.disabled = false; b.innerHTML = `${t('Войти')}${I('chevR')}`;
        const msg = { nouser: t('Такого логина нет'), inactive: t('Учётная запись в архиве — обратитесь к директору'), badpass: t('Неверный пароль'), crypto: t('Браузер не поддерживает защищённый вход — откройте сайт по https') }[r.err];
        if (r.err === 'badpass') { f.pass.select(); }
        return showErr(msg);
      }
      f.style.display = 'none';
      const ok = root.querySelector('.auth-ok'); ok.style.display = 'block'; ok.querySelector('.ok-name').textContent = r.user.name;
      setTimeout(() => location.replace('app.html'), 650);
    });
    root.querySelector('[data-eye]').addEventListener('click', e => {
      const i = f.pass, show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = I(show ? 'eyeOff' : 'eye');
      i.focus();
    });
    root.querySelectorAll('[data-theme-btn]').forEach(b => b.addEventListener('click', () => {
      const d = !dark();
      document.documentElement.dataset.theme = d ? 'dark' : 'light';
      try { localStorage.setItem('wn.theme', d ? 'dark' : 'light'); } catch (er) { /* ignore */ }
      root.querySelectorAll('[data-theme-btn]').forEach(x => { x.innerHTML = I(d ? 'sun' : 'moon'); });
    }));
    if (matchMedia('(pointer:fine)').matches) setTimeout(() => (state.login ? f.pass : f.login).focus(), 50);
  };

  /* ---------- живой фон: доменно-искажённый шум в фирменных цветах ---------- */
  const FRAG = `precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n(p);p=R*p*2.03;a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
  float T=t*.045;
  vec2 q=vec2(fbm(uv*1.3+T),fbm(uv*1.3+vec2(5.2,1.3)-T));
  vec2 w=vec2(fbm(uv*1.5+3.2*q+vec2(1.7,9.2)+T*1.2+m*.15),fbm(uv*1.5+3.2*q+vec2(8.3,2.8)-T));
  float f=fbm(uv*1.1+3.6*w);
  vec3 ink=vec3(.04,.05,.13), vio=vec3(.27,.24,.98), cy=vec3(0.,.70,.96), mg=vec3(1.,.18,.53), ye=vec3(1.,.76,.10);
  vec3 c=mix(ink,vio,smoothstep(.18,.62,f));
  c=mix(c,cy,smoothstep(.42,.78,w.x)*.9);
  c=mix(c,mg,smoothstep(.5,.86,w.y)*.92);
  c=mix(c,ye,smoothstep(.7,.96,f)*.85);
  float line=1.-smoothstep(0.,.035,abs(fract(f*7.)-.5)-.44);
  c+=.07*line;
  c*=.72+.42*f;
  c*=1.-.28*dot(uv,uv);
  gl_FragColor=vec4(c,1.);
}`;
  let gl = null, raf = 0, prog = null, cv = null, mouse = [0, 0], t0 = performance.now();
  const stopGL = () => { cancelAnimationFrame(raf); raf = 0; };
  const startGL = (canvas) => {
    cv = canvas;
    // спокойный вид: живого фона нет — панель нейтральная, видеокарта не нагружается
    if (document.documentElement.classList.contains('ui-calm')) { cv.remove(); gl = null; return; }
    gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) { cv.parentNode.classList.add('no-gl'); cv.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.parentNode.classList.add('no-gl'); cv.remove(); gl = null; return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (now) => {
      // рендер в пониженном разрешении — фон мягкий, а батарея целее
      const k = Math.min(devicePixelRatio || 1, 1.5) * 0.55;
      const w = Math.max(2, Math.round(cv.clientWidth * k)), hh = Math.max(2, Math.round(cv.clientHeight * k));
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; gl.viewport(0, 0, w, hh); }
      gl.uniform2f(uR, w, hh); gl.uniform1f(uT, still ? 40 : (now - t0) / 1000 + 40); gl.uniform2f(uM, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still && !document.hidden) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    startGL.frame = frame;
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && gl && !raf && startGL.frame) raf = requestAnimationFrame(startGL.frame); if (document.hidden) stopGL(); });
  addEventListener('pointermove', e => { mouse = [e.clientX / innerWidth - .5, e.clientY / innerHeight - .5]; }, { passive: true });
  W.on('lang', draw);
  draw();
})();
