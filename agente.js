// Assistente de atendimento da Ávrio (IA via Cloudflare Worker). Sem IA disponível, continua por botões e WhatsApp.
(function () {
  'use strict';
  const CHAT_URL = 'https://avrio-chat.avrio-chat.workers.dev/chat';
  const WA = 'https://wa.me/5563984600461?text=' + encodeURIComponent('Olá! Vim pelo site da Ávrio e quero falar com o Gabriel.');
  const SK = 'avrio-agente';
  const $ = (s, r) => (r || document).querySelector(s);
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>';

  const root = document.createElement('div');
  root.innerHTML =
    '<button type="button" class="ag-fab" id="agFab" aria-label="Abrir o assistente da Ávrio" aria-expanded="false">' + ICON + '<span class="dot"></span><span>Assistente</span></button>' +
    '<div class="ag-tease" id="agTease" role="status">Posso tirar suas dúvidas sobre os planos. Sou o assistente da Ávrio.</div>' +
    '<section class="ag-win" id="agWin" role="dialog" aria-label="Assistente da Ávrio">' +
    '<div class="ag-h" id="agH"><span class="ag-av">' + ICON + '</span><div><b>Assistente Ávrio</b><small>Assistente virtual (IA) · responde na hora</small></div><button type="button" class="ag-x" id="agX" aria-label="Minimizar">&ndash;</button></div>' +
    '<div class="ag-body" id="agBody"></div><div class="ag-qr" id="agQr"></div>' +
    '<form class="ag-form" id="agForm"><input id="agIn" type="text" maxlength="300" placeholder="Digite sua dúvida..." autocomplete="off" aria-label="Digite sua dúvida"><button type="submit" aria-label="Enviar">&#10148;</button></form>' +
    '<div class="ag-foot">Assistente com IA. Não envie dados pessoais por aqui.</div></section>' +
    '<button type="button" data-open-form="assistente" id="agOpenForm" hidden></button>';
  document.body.appendChild(root);

  const fab = $('#agFab'), win = $('#agWin'), body = $('#agBody'), qr = $('#agQr'), form = $('#agForm'), inp = $('#agIn'), tease = $('#agTease');
  let log = [], hist = [], started = false, open = false, min = false, busy = false;
  const sync = () => document.body.classList.toggle('ag-on', win.classList.contains('open'));

  const save = () => { try { sessionStorage.setItem(SK, JSON.stringify({ log: log.slice(-30), open, min })); } catch (e) {} };
  const linkify = (t) => t.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  function say(text, who, noSave, html) {
    const m = document.createElement('div');
    m.className = 'ag-m ' + (who || 'bot');
    if (html) m.innerHTML = html; else m.textContent = text;
    body.appendChild(m); body.scrollTop = body.scrollHeight;
    if (!noSave) { log.push({ w: who || 'bot', t: text, h: html || '' }); save(); }
    return m;
  }
  function typing() { const t = document.createElement('div'); t.className = 'ag-m bot typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); body.scrollTop = body.scrollHeight; return t; }
  function botSay(text, then, html) { const t = typing(); setTimeout(() => { t.remove(); say(text, 'bot', false, html); then && then(); }, 600); }

  const MENU = [
    { l: 'Ver planos', a: 'plans' }, { l: 'Como funciona?', a: 'how' },
    { l: 'Proposta personalizada', a: 'custom' }, { l: 'Falar com o Gabriel', a: 'wa' },
  ];
  const ANS = {
    plans: 'Temos 3 planos, com implantação única + mensalidade:\n• Site + Assistente: R$ 597 (ou 3x de R$ 199 sem juros) + R$ 147/mês\n• Conteúdo + Site + Assistente (15 reels/mês): R$ 997 + R$ 997/mês\n• Site + Assistente + Tráfego: R$ 797 + R$ 897/mês (verba de anúncios à parte, mínimo R$ 500).\nQual deles faz mais sentido para você?',
    how: 'A Ávrio monta o sistema do conteúdo ao atendimento: uma página de vendas do seu nicho, um assistente com IA que atende 24h, e, se quiser, reels com avatar e anúncios. Em uma conversa de 10 minutos eu te mostro ao vivo. Quer ver?',
    custom: 'Claro! Se o seu projeto é diferente dos planos, mais simples ou mais completo, o Gabriel monta uma proposta personalizada. Vou abrir o formulário para ele entender o que você precisa.',
  };
  function renderQr(offerForm) {
    qr.innerHTML = '';
    if (offerForm) {
      const g = document.createElement('button'); g.type = 'button'; g.textContent = 'Quero conversar com o Gabriel';
      g.style.cssText = 'background:var(--grad);border-color:transparent;color:#fff';
      g.addEventListener('click', () => { say('Quero conversar com o Gabriel', 'me'); qr.innerHTML = ''; botSay('Perfeito! Vou abrir o formulário rápido para ele te chamar.', () => { openForm('assistente'); renderQr(); }); });
      qr.appendChild(g);
    }
    MENU.forEach((it) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = it.l;
      b.addEventListener('click', () => {
        say(it.l, 'me'); qr.innerHTML = '';
        if (it.a === 'wa') { botSay('Vou te levar ao WhatsApp do Gabriel.', () => { window.open(WA, '_blank', 'noopener'); renderQr(); }); return; }
        if (it.a === 'custom') { botSay(ANS.custom, () => { openForm('proposta-personalizada'); renderQr(); }); return; }
        if (it.a === 'plans') { const p = document.querySelector('.plans'); p && p.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        botSay(ANS[it.a], renderQr);
      });
      qr.appendChild(b);
    });
  }
  function openForm(src) { const b = $('#agOpenForm'); b.dataset.openForm = src || 'assistente'; b.click(); }

  function openChat() {
    win.classList.add('open'); win.classList.remove('min'); fab.setAttribute('aria-expanded', 'true'); open = true; min = false; tease.classList.remove('show'); sync(); save();
    if (!started) {
      started = true;
      botSay('Olá! Sou o assistente virtual da Ávrio, uma inteligência artificial. Posso explicar os planos, como funciona e te ajudar a marcar uma conversa de 10 minutos com o Gabriel.', renderQr);
    }
    body.scrollTop = body.scrollHeight;
  }
  function minimize() { if (!win.classList.contains('open')) return; win.classList.add('min'); fab.setAttribute('aria-expanded', 'false'); min = true; save(); }

  fab.addEventListener('click', () => (win.classList.contains('open') && !win.classList.contains('min') ? minimize() : openChat()));
  $('#agX').addEventListener('click', (e) => { e.stopPropagation(); minimize(); });
  $('#agH').addEventListener('click', () => { if (win.classList.contains('min')) openChat(); });
  tease.addEventListener('click', openChat);
  document.addEventListener('pointerdown', (e) => {
    if (!win.classList.contains('open') || win.classList.contains('min')) return;
    if (win.contains(e.target) || fab.contains(e.target) || e.target.closest('.lf-overlay,[class*="lf-"]')) return;
    minimize();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inp.value.trim(); if (!text || busy) return;
    inp.value = ''; qr.innerHTML = ''; say(text, 'me'); hist.push({ role: 'user', content: text });
    const t = typing(); busy = true; inp.disabled = true;
    try {
      const r = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ niche: 'avrio', messages: hist.slice(-10) }) });
      const j = await r.json();
      if (!r.ok || j.error || !j.reply) throw new Error('ia');
      t.remove(); say(j.reply); hist.push({ role: 'assistant', content: j.reply });
      renderQr(!!j.book);
    } catch (err) {
      t.remove();
      say('Estou com muita procura agora. Use as opções abaixo ou fale direto com o Gabriel no WhatsApp.', 'bot', false, 'Estou com muita procura agora. Use as opções abaixo ou fale direto com o Gabriel no <a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a>.');
      renderQr();
    } finally { busy = false; inp.disabled = false; inp.focus(); }
  });

  // restaura conversa guardada na aba
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || 'null'); } catch (e) {}
  if (saved && saved.log && saved.log.length) {
    started = true; log = saved.log;
    log.forEach((m) => {
      say(m.t, m.w, true, m.h);
      if (m.w === 'me') hist.push({ role: 'user', content: m.t });
      else if (hist.length) hist.push({ role: 'assistant', content: m.t });
    });
    renderQr();
    if (saved.open) { win.classList.add('open'); open = true; sync(); if (saved.min) { win.classList.add('min'); min = true; } else fab.setAttribute('aria-expanded', 'true'); }
  } else {
    // convite discreto, uma vez por sessão, depois que o formulário inicial já passou
    setTimeout(() => { if (!win.classList.contains('open') && !document.querySelector('.lf-overlay.open')) tease.classList.add('show'); }, 14000);
    setTimeout(() => tease.classList.remove('show'), 30000);
  }
})();
