// Ávrio — comportamento das páginas-demonstração por nicho
(function () {
  'use strict';
  const N = window.NICHE || {};
  const AVRIO_WA = '5563984600461';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search);
  const clean = (v, max) => (v || '').replace(/[<>]/g, '').trim().slice(0, max || 80);

  // ---------- Personalização por link ----------
  // ?n=Nome da clínica &p=Dra. Fulana &cid=Cidade &tel=5563999999999 &g=4,9 &r=210 &demo=0
  const biz = clean(q.get('n')) || N.biz;
  const pro = clean(q.get('p')) || N.pro;
  const city = clean(q.get('cid')) || N.city;
  const tel = (q.get('tel') || window.AVRIO_TEL || '').replace(/\D/g, '');
  const gnum = clean(q.get('g'), 5);
  const grev = clean(q.get('r'), 6);
  const DEMO = q.get('demo') !== '0';

  $$('[data-bind="biz"]').forEach((e) => (e.textContent = biz));
  $$('[data-bind="pro"]').forEach((e) => (e.textContent = pro));
  $$('[data-bind="city"]').forEach((e) => (e.textContent = city));
  $$('[data-bind="initial"]').forEach((e) => (e.textContent = (pro.replace(/^(Dra?\.|Dr\.|Dr)\s*/i, '').trim()[0] || biz[0] || 'A').toUpperCase()));
  document.title = biz + ' — ' + N.titleTail;

  if (gnum) {
    const gn = $('#gNum'); if (gn) gn.textContent = gnum;
    const gt = $('#gTxt'); if (gt && grev) gt.textContent = 'Baseado em ' + grev + ' avaliações no Google';
    const gs = $('#gSec'); if (gs) gs.hidden = false;
  }

  // ---------- Ribbon ----------
  const ribbon = $('#ribbon');
  if (!DEMO && ribbon) ribbon.remove();
  else if (ribbon) {
    const msg = 'Olá! Vi a demonstração do site para ' + biz + ' (' + N.label + ') e quero saber mais.';
    $('#ribbonCta').href = 'https://wa.me/' + AVRIO_WA + '?text=' + encodeURIComponent(msg);
    $('#ribbonX').addEventListener('click', () => ribbon.classList.add('hide'));
  }

  // ---------- Menu ----------
  const burger = $('#burger'), nav = $('#nav');
  burger && burger.addEventListener('click', () => nav.classList.toggle('open'));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

  // ---------- Reveal ----------
  const items = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) items.forEach((e) => e.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    items.forEach((e) => io.observe(e));
  }

  // ---------- Barra fixa (mobile) ----------
  const sticky = $('#sticky');
  if (sticky) {
    const on = () => sticky.classList.toggle('show', window.scrollY > 520 && $('#ov').hidden);
    window.addEventListener('scroll', on, { passive: true }); on();
  }

  // ---------- WhatsApp do cliente (produção) ou do prospect (demo) ----------
  function targetWa(text) {
    const to = tel || AVRIO_WA;
    return 'https://wa.me/' + to + '?text=' + encodeURIComponent(text);
  }

  // ---------- Modal de agendamento ----------
  const ov = $('#ov');
  const panes = $$('.pane', ov);
  const bar = $('#mbar'), stp = $('#mstp'), back = $('#mback'), next = $('#mnext');
  const S = { step: 0, service: '', name: '', phone: '', turn: '' };
  const TOTAL = 3;
  let opener = null;

  function show(i, isBack) {
    S.step = i;
    panes.forEach((p, k) => { p.hidden = k !== i; });
    const done = i >= TOTAL;
    bar.style.width = (done ? 100 : Math.round(((i + 0.5) / TOTAL) * 100)) + '%';
    stp.textContent = done ? 'Pronto' : 'Passo ' + (i + 1) + ' de ' + TOTAL;
    $('#mnav').hidden = i === 0 || done; // sem barra de navegação na 1ª etapa e no final
    next.hidden = i !== 1;               // "Continuar" só no passo dos dados
    err('');
  }
  function err(t, el) {
    $$('.err', ov).forEach((e) => (e.textContent = ''));
    const box = $('.pane:not([hidden]) .err', ov);
    if (box && t) box.textContent = t;
    $$('.fld input', ov).forEach((i) => i.classList.remove('bad'));
    if (el) { el.classList.add('bad'); el.focus(); }
  }
  function openModal(service) {
    opener = document.activeElement;
    if (service) { S.service = service; show(1); } else show(S.step >= TOTAL ? 0 : S.step);
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ov.classList.add('open'), 20);
    setTimeout(() => { const t = $('.pane:not([hidden]) input, .pane:not([hidden]) .opts button', ov); t && t.focus({ preventScroll: true }); }, 120);
  }
  function closeModal() {
    ov.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { ov.hidden = true; }, reduce ? 0 : 260);
    opener && opener.focus && opener.focus({ preventScroll: true });
  }
  $$('[data-book]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openModal(b.dataset.book || ''); }));
  window.AvrioBook = openModal; // usado pelos widgets de cada layout (layouts.js)
  $('#mx').addEventListener('click', closeModal);
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!ov.hidden) closeModal(); else closeChat(); } });

  $('#svcOpts').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.service = b.dataset.v; $$('#svcOpts button').forEach((x) => x.classList.toggle('sel', x === b));
    setTimeout(() => show(1), reduce ? 0 : 200);
  });
  const nm = $('#fName'), ph = $('#fPhone');
  ph.addEventListener('input', () => {
    let d = ph.value.replace(/\D/g, '').slice(0, 11), o = d;
    if (d.length > 6) o = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    else if (d.length > 2) o = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length) o = '(' + d;
    ph.value = o;
  });
  next.addEventListener('click', () => {
    const n = nm.value.trim().replace(/\s+/g, ' '), d = ph.value.replace(/\D/g, '');
    if (n.length < 3) return err('Digite seu nome.', nm);
    if (d.length < 10) return err('Digite um WhatsApp válido com DDD.', ph);
    S.name = n; S.phone = ph.value; show(2);
  });
  back.addEventListener('click', () => show(Math.max(0, S.step - 1), true));
  $('#turnOpts').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.turn = b.dataset.v; $$('#turnOpts button').forEach((x) => x.classList.toggle('sel', x === b));
    setTimeout(finish, reduce ? 0 : 220);
  });
  function finish() {
    const text = 'Olá! Meu nome é ' + S.name + '.\nGostaria de agendar: ' + (S.service || 'uma avaliação') + '.\nPrefiro o período da ' + S.turn.toLowerCase() + '.';
    $('#prev').firstChild.textContent = text;
    $('#doneBiz').textContent = biz;
    const go = $('#doneGo');
    if (DEMO && !tel) {
      go.textContent = 'Quero este site para mim';
      go.href = 'https://wa.me/' + AVRIO_WA + '?text=' + encodeURIComponent('Olá! Testei a demonstração do site para ' + biz + ' e quero um site assim para o meu consultório.');
      $('#doneNote').textContent = 'Esta é uma demonstração: nenhum dado foi enviado.';
    } else {
      go.textContent = 'Continuar no WhatsApp';
      go.href = targetWa(text);
      $('#doneNote').textContent = 'Você será levado ao WhatsApp para confirmar o horário.';
    }
    show(3);
  }

  // ---------- Chat assistente (demonstração, sem IA real) ----------
  const chat = $('#chat'), body = $('#chBody'), qr = $('#chQr'), fab = $('#fab');
  let chatStarted = false;
  // guarda a conversa e se o chat estava aberto, para não perder ao recarregar ou trocar de página
  const SK = 'avrio-chat:' + location.pathname + ':' + biz;
  let log = [], chatOpen = false, chatMin = false;
  const ss = { get() { try { return JSON.parse(sessionStorage.getItem(SK) || 'null'); } catch (e) { return null; } },
               set() { try { sessionStorage.setItem(SK, JSON.stringify({ log: log.slice(-30), open: chatOpen, min: chatMin })); } catch (e) {} } };
  function say(text, who, noSave) {
    const m = document.createElement('div');
    m.className = 'msg ' + (who || 'bot'); m.textContent = text;
    body.appendChild(m); body.scrollTop = body.scrollHeight;
    if (!noSave) { log.push({ w: who || 'bot', t: text }); ss.set(); }
    return m;
  }
  function botSay(text, then) {
    const t = document.createElement('div'); t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(t); body.scrollTop = body.scrollHeight;
    setTimeout(() => { t.remove(); say(text); then && then(); }, reduce ? 0 : 700);
  }
  function renderQr(list) {
    qr.innerHTML = '';
    list.forEach((it) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = it.label;
      b.addEventListener('click', () => {
        say(it.label, 'me'); qr.innerHTML = '';
        if (it.action === 'book') { botSay('Perfeito! Vou abrir o agendamento para você.', () => { closeChat(); openModal(''); }); return; }
        if (it.action === 'human' && tel) {
          botSay('Claro! Vou te levar ao WhatsApp para falar direto com ' + pro + '.', () => { window.open(targetWa('Olá! Vim pelo site e gostaria de falar com ' + pro + '.'), '_blank', 'noopener'); renderQr(N.chat.menu); });
          return;
        }
        if (it.action === 'human') {
          botSay('Claro! Vou chamar um atendente. Na versão real, a conversa continua no WhatsApp com o histórico já registrado.', () => renderQr(N.chat.menu));
          return;
        }
        botSay(it.answer, () => renderQr(N.chat.menu));
      });
      qr.appendChild(b);
    });
  }
  function openChat() {
    chat.classList.add('open'); chat.classList.remove('min'); fab.setAttribute('aria-expanded', 'true'); chatOpen = true; chatMin = false; ss.set();
    if (!chatStarted) {
      chatStarted = true;
      botSay(N.chat.hello.replace('{biz}', biz), () => botSay(N.chat.disclaimer, () => renderQr(N.chat.menu)));
    }
    body.scrollTop = body.scrollHeight;
  }
  // sair da conversa = minimizar (fica só a barra do assistente; clicar nela reabre)
  function minimizeChat() {
    if (!chat.classList.contains('open')) return;
    chat.classList.add('min'); fab.setAttribute('aria-expanded', 'false'); chatMin = true; ss.set();
  }
  function closeChat() { chatStarted ? minimizeChat() : (chat.classList.remove('open'), fab.setAttribute('aria-expanded', 'false'), chatOpen = false, ss.set()); }
  // ---- agente de IA (Cloudflare Worker). Sem URL configurada, fica só o atendimento por botões.
  const CHAT_URL = (q.get('chat') || window.AVRIO_CHAT_URL || '').trim().replace(/\/$/, '');
  const chForm = $('#chForm'), chInput = $('#chInput'), hist = [];
  if (CHAT_URL && chForm) chForm.hidden = false;
  function typingEl() {
    const t = document.createElement('div'); t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(t); body.scrollTop = body.scrollHeight; return t;
  }
  chForm && chForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chInput.value.trim(); if (!text) return;
    chInput.value = ''; qr.innerHTML = ''; say(text, 'me'); hist.push({ role: 'user', content: text });
    const t = typingEl(); chInput.disabled = true;
    try {
      const r = await fetch(CHAT_URL + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: N.slug, biz, pro, city, messages: hist.slice(-10) }) });
      const j = await r.json();
      if (!r.ok || j.error || !j.reply) throw new Error('ia');
      t.remove(); say(j.reply); hist.push({ role: 'assistant', content: j.reply });
      if (j.book) setTimeout(() => { closeChat(); openModal(''); }, 1100); else renderQr(N.chat.menu);
    } catch (err) {
      t.remove(); chForm.hidden = true;   // IA indisponível ou no limite: volta ao atendimento por botões
      say('Estou com muita procura agora. Use as opções abaixo ou agende direto.'); renderQr(N.chat.menu);
    } finally { chInput.disabled = false; chInput.focus(); }
  });
  fab.addEventListener('click', () => (chat.classList.contains('open') && !chat.classList.contains('min') ? minimizeChat() : openChat()));
  $('#chX').addEventListener('click', (e) => { e.stopPropagation(); minimizeChat(); });
  $('#chat .ch-h').addEventListener('click', () => { if (chat.classList.contains('min')) openChat(); });
  // clicou fora do chat: minimiza
  document.addEventListener('pointerdown', (e) => {
    if (!chat.classList.contains('open') || chat.classList.contains('min')) return;
    if (chat.contains(e.target) || fab.contains(e.target) || e.target.closest('#ov')) return;
    minimizeChat();
  });
  // restaura a conversa guardada (recarregou a página ou voltou a ela)
  const saved = ss.get();
  if (saved && saved.log && saved.log.length) {
    chatStarted = true; log = saved.log;
    log.forEach((m) => {
      say(m.t, m.w, true);
      if (m.w === 'me') hist.push({ role: 'user', content: m.t });
      else if (hist.length) hist.push({ role: 'assistant', content: m.t });
    });
    renderQr(N.chat.menu);
    if (saved.open) { chat.classList.add('open'); chatOpen = true; if (saved.min) { chat.classList.add('min'); chatMin = true; } else fab.setAttribute('aria-expanded', 'true'); }
  }
  // abre o assistente sozinho depois de um tempo, uma vez, só no desktop
  if (window.innerWidth > 980) setTimeout(() => { if (!chatStarted && ov.hidden) openChat(); }, 9000);

  show(0);
})();
