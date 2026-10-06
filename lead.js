// Ávrio — formulário de qualificação (modal), WhatsApp e rastreamento
(function () {
  'use strict';
  const CFG = window.AVRIO || {};
  const TOTAL = 6;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const overlay = $('#lfOverlay');
  const form = $('#lfForm');
  const bar = $('#lfBar');
  const count = $('#lfCount');
  const nav = $('#lfNav');
  const btnNext = $('#lfNext');
  const btnBack = $('#lfBack');
  const nome = $('#lfNome');
  const whats = $('#lfWhats');
  const insta = $('#lfInsta');
  const hp = $('#lfHp');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    step: 1,
    done: false,
    source: '',
    data: {}
  };
  let opener = null;

  // ---------- UTMs ----------
  const utm = {};
  try {
    const q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach((k) => {
      if (q.get(k)) utm[k] = q.get(k);
    });
  } catch (e) {}

  // ---------- Pixel da Meta (só carrega se houver ID) ----------
  if (CFG.PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CFG.PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function track(type, name, params) {
    try {
      if (!window.fbq) return;
      if (type === 'std') window.fbq('track', name, params || {});
      else window.fbq('trackCustom', name, params || {});
    } catch (e) {}
  }

  // ---------- Envio para o Google Sheets ----------
  function send(status) {
    if (!CFG.SHEETS_URL) return Promise.resolve();
    const d = state.data;
    const payload = Object.assign(
      {
        id: state.id,
        status: status,
        origem_botao: state.source,
        nome: d.nome || '',
        whatsapp: d.whatsapp || '',
        nicho: d.nicho || '',
        instagram: d.instagram || '',
        situacao: d.situacao || '',
        prazo: d.prazo || '',
        investimento: d.investimento || '',
        score: score(),
        consentimento: d.nome ? 'sim' : '',
        pagina: location.href.split('?')[0],
        enviado_em: new Date().toISOString()
      },
      utm
    );
    return fetch(CFG.SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  function score() {
    const d = state.data;
    if (!d.investimento) return '';
    if (d.investimento === 'Acima do orçamento' || d.prazo === 'Só estou pesquisando') return 'frio';
    if (d.investimento === 'Sim, cabe' && (d.prazo === 'O quanto antes' || d.prazo === 'Neste mês')) return 'quente';
    return 'morno';
  }

  // ---------- Etapas ----------
  function show(step, back) {
    state.step = step;
    $$('.lf-step').forEach((s) => {
      const on = s.dataset.step === String(step);
      s.hidden = !on;
      s.classList.toggle('back', on && !!back);
    });
    const num = typeof step === 'number' ? step : TOTAL;
    bar.style.width = (state.done ? 100 : Math.round(((num - 1) / TOTAL) * 100 + 100 / TOTAL / 2)) + '%';
    count.textContent = state.done ? 'Concluído' : 'Passo ' + num + ' de ' + TOTAL;
    const textStep = step === 1 || step === 3;
    nav.classList.toggle('off', state.done || !textStep);
    btnBack.hidden = step === 1;
    if (!textStep && !state.done) {
      // etapas de opção: só o botão voltar
      nav.classList.remove('off');
      btnNext.style.display = 'none';
    } else {
      btnNext.style.display = '';
    }
    if (state.done) nav.classList.add('off');
    clearErr();
    // restaurar seleção
    $$('.lf-step:not([hidden]) .lf-options').forEach((g) => {
      $$('button', g).forEach((b) => b.classList.toggle('sel', state.data[g.dataset.name] === b.dataset.v));
    });
    // foco
    setTimeout(() => {
      const target = $('.lf-step:not([hidden]) input, .lf-step:not([hidden]) .lf-options button, .lf-step:not([hidden]) .btn');
      if (target) target.focus({ preventScroll: true });
    }, reduce ? 0 : 60);
    if (typeof step === 'number') track('custom', 'FormStep' + step);
  }

  function err(msg, el) {
    const box = $('.lf-step:not([hidden]) .lf-err');
    if (box) box.textContent = msg;
    if (el) { el.classList.add('bad'); el.focus(); }
  }
  function clearErr() {
    $$('.lf-err').forEach((e) => (e.textContent = ''));
    $$('.lf-field input').forEach((i) => i.classList.remove('bad'));
  }

  function validate(step) {
    if (step === 1) {
      const n = nome.value.trim().replace(/\s+/g, ' ');
      const digits = whats.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
      if (n.length < 3) return err('Digite seu nome.', nome), false;
      if (digits.length < 10 || digits.length > 11) return err('Digite um WhatsApp válido com DDD.', whats), false;
      state.data.nome = n;
      state.data.whatsapp = whats.value.trim();
      return true;
    }
    if (step === 3) {
      let v = insta.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[\/?].*$/, '');
      if (!v) return err('Digite o seu @ ou toque na opção abaixo.', insta), false;
      v = v.replace(/^@/, '');
      if (!/^[A-Za-z0-9._]{1,30}$/.test(v)) return err('Use apenas letras, números, ponto e underline.', insta), false;
      state.data.instagram = '@' + v;
      return true;
    }
    return true;
  }

  function next() {
    const s = state.step;
    if (!validate(s)) return;
    if (s === 1) send('parcial');
    if (s < TOTAL) show(s + 1);
  }
  function back() {
    if (typeof state.step === 'number' && state.step > 1) show(state.step - 1, true);
  }

  // ---------- Finalização ----------
  function waMessage() {
    const d = state.data;
    const first = (d.nome || '').split(' ')[0];
    const lines = [
      'Olá! Sou ' + (d.nome || first) + '.',
      'Vim pelo site da Ávrio e quero saber mais sobre o plano de avatar + 15 reels.',
      d.nicho ? 'Área: ' + d.nicho + '.' : '',
      d.instagram && d.instagram !== 'Sem Instagram' ? 'Instagram: ' + d.instagram + '.' : '',
      d.prazo ? 'Quero começar: ' + d.prazo.toLowerCase() + '.' : ''
    ].filter(Boolean);
    return lines.join('\n');
  }

  function finish() {
    if (hp.value) return; // campo isca preenchido: provável robô
    state.done = true;
    const sc = score();
    const first = (state.data.nome || '').split(' ')[0];
    $('#lfDoneTitle').textContent = sc === 'frio' ? 'Obrigado, ' + first + '!' : 'Tudo certo, ' + first + '!';
    $('#lfDoneText').textContent =
      sc === 'frio'
        ? 'Guardamos o seu contato. Quando fizer sentido para você, é só nos chamar no WhatsApp.'
        : 'Recebemos as suas respostas. Agora é só continuar no WhatsApp para a gente conversar.';
    const url = 'https://wa.me/' + (CFG.WHATSAPP || '5563984600461') + '?text=' + encodeURIComponent(waMessage());
    $('#lfWa').href = url;
    try { localStorage.setItem('avrio_lead_done', '1'); } catch (e) {}
    show('done');
    track('std', 'Lead', { content_name: 'Formulario Avrio', value: sc === 'quente' ? 1500 : 0, currency: 'BRL' });
    send('completo');
  }

  // ---------- Abrir / fechar ----------
  function open(src) {
    opener = document.activeElement;
    state.source = src || '';
    overlay.hidden = false;
    document.body.classList.add('lf-lock');
    void overlay.offsetWidth; // força o estilo inicial antes da transição
    setTimeout(() => overlay.classList.add('open'), 20);
    show(state.done ? 'done' : state.step);
    track('custom', 'FormOpen', { source: state.source });
  }
  function close() {
    if (!state.done && state.step > 1 && state.data.nome) send('parcial');
    overlay.classList.remove('open');
    document.body.classList.remove('lf-lock');
    setTimeout(() => { overlay.hidden = true; }, reduce ? 0 : 280);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  // ---------- Eventos ----------
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open-form]');
    if (o) { e.preventDefault(); open(o.dataset.openForm); return; }
    const w = e.target.closest('[data-wa]');
    if (w) track('std', 'Contact', { source: w.dataset.wa });
  });
  $('#lfClose').addEventListener('click', close);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', back);

  $$('.lf-options').forEach((g) => {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      state.data[g.dataset.name] = b.dataset.v;
      $$('button', g).forEach((x) => x.classList.toggle('sel', x === b));
      const last = state.step === TOTAL;
      setTimeout(() => (last ? finish() : show(state.step + 1)), reduce ? 0 : 260);
    });
  });

  $('#lfNoInsta').addEventListener('click', () => {
    state.data.instagram = 'Sem Instagram';
    show(4);
  });

  // máscara de telefone
  whats.addEventListener('input', () => {
    let d = whats.value.replace(/\D/g, '');
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    d = d.slice(0, 11);
    let out = d;
    if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    else if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length) out = '(' + d;
    whats.value = out;
  });
  [nome, whats, insta].forEach((i) => i.addEventListener('input', () => i.classList.remove('bad')));

  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target.tagName === 'BUTTON') { e.target.click(); return; }
      if (state.step === 1 || state.step === 3) next();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const f = $$('input:not(.lf-hp), button, a[href]', overlay).filter((x) => !x.closest('[hidden]') && x.offsetParent !== null && getComputedStyle(x).display !== 'none');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  // ---------- Abertura automática ao carregar ----------
  // Abre uma vez por sessão, logo após a página aparecer. Se a pessoa fechar, não insiste.
  (function autoOpen() {
    const KEY = 'avrio_form_seen';
    // para testes: abra a página com ?reset para voltar a ver a abertura automática
    try {
      if (/[?&]reset\b/.test(location.search)) {
        sessionStorage.removeItem(KEY);
        localStorage.removeItem('avrio_lead_done');
      }
    } catch (e) {}
    try { if (sessionStorage.getItem(KEY) || localStorage.getItem('avrio_lead_done')) return; } catch (e) {}
    setTimeout(() => {
      if (!overlay.hidden) return;
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      open('auto');
    }, 1500);
  })();

  // ---------- Barra fixa mobile ----------
  const sticky = $('#stickyCta');
  if (sticky) {
    const onScroll = () => {
      const past = window.scrollY > Math.max(520, window.innerHeight * 0.7);
      const oferta = $('#oferta');
      const ro = oferta ? oferta.getBoundingClientRect() : null;
      const inOffer = ro && ro.top < window.innerHeight * 0.6 && ro.bottom > 0;
      sticky.classList.toggle('show', past && !inOffer && overlay.hidden);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
