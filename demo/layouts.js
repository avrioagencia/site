// Ávrio — widgets específicos de cada layout (abas, quiz, triagem, montador de treino, acordeão)
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const book = (v) => (window.AvrioBook ? window.AvrioBook(v || '') : null);

  // ---------- DENTISTA: abas de tratamentos + agendamento rápido ----------
  $$('[data-tabs]').forEach((root) => {
    const btns = $$('[data-tab]', root), panels = $$('[data-panel]', root);
    const sel = (i) => {
      btns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
      panels.forEach((p, k) => { p.hidden = k !== i; });
    };
    btns.forEach((b, i) => b.addEventListener('click', () => sel(i)));
    sel(0);
  });
  const quickGo = $('[data-quick-go]');
  if (quickGo) quickGo.addEventListener('click', () => book($('#dnSel').value));

  // ---------- NUTRIÇÃO: quiz em 2 passos ----------
  const quiz = $('[data-quiz]');
  if (quiz) {
    const st = { s: '', f: '' };
    const steps = $$('[data-qs]', quiz);
    const go = (n) => steps.forEach((e) => { e.hidden = e.dataset.qs !== String(n); });
    $$('[data-qs="1"] button', quiz).forEach((b) => b.addEventListener('click', () => { st.s = b.dataset.v; go(2); }));
    $$('[data-qs="2"] button', quiz).forEach((b) => b.addEventListener('click', () => {
      st.f = b.dataset.f;
      $('[data-qout]', quiz).textContent = st.s + ' · atendimento ' + st.f.toLowerCase();
      go(3);
    }));
    $('[data-quiz-go]', quiz).addEventListener('click', () => book(st.s));
    $('[data-quiz-reset]', quiz).addEventListener('click', () => go(1));
  }

  // ---------- ADVOCACIA: triagem + acordeão exclusivo ----------
  const tri = $('[data-triage-go]');
  if (tri) tri.addEventListener('click', () => book($('#adArea').value));
  const acc = $$('.ad-acc details');
  acc.forEach((d) => d.addEventListener('toggle', () => { if (d.open) acc.forEach((o) => { if (o !== d) o.open = false; }); }));

  // ---------- PERSONAL: montador de treino ----------
  const bld = $('[data-builder]');
  if (bld) {
    const st = { obj: '', days: 0 };
    const out = $('[data-bout]', bld);
    const render = () => {
      if (!st.obj && !st.days) { out.textContent = 'Escolha um objetivo e a frequência.'; return; }
      if (!st.obj) { out.textContent = st.days + 'x por semana. Agora escolha o objetivo.'; return; }
      if (!st.days) { out.textContent = st.obj + '. Agora escolha a frequência.'; return; }
      out.textContent = st.obj + ' · ' + st.days + 'x por semana';
    };
    $$('[data-obj]', bld).forEach((b) => b.addEventListener('click', () => {
      st.obj = b.dataset.obj; $$('[data-obj]', bld).forEach((x) => x.classList.toggle('on', x === b)); render();
    }));
    $$('[data-days]', bld).forEach((b) => b.addEventListener('click', () => {
      st.days = +b.dataset.days; $$('[data-days]', bld).forEach((x) => x.classList.toggle('on', x === b)); render();
    }));
    $('[data-build-go]', bld).addEventListener('click', () => book(st.obj));
  }
})();
