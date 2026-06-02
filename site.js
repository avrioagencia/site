// Agência Ávrio — interações do site
(function () {
  // header background on scroll
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => nav.classList.toggle('open'));
  nav?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => nav.classList.remove('open'))
  );

  // scroll reveal
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = Array.from(document.querySelectorAll('.reveal:not(.in)'));
  if (reduce) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    items.forEach((el) => obs.observe(el));
  }
  // smooth parallax on hero background (follows mouse)
  const hero = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg');
  if (hero && heroBg && !reduce) {
    const maxShift = 24;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      heroBg.style.transform =
        `scale(1.09) translate(${(-dx * maxShift).toFixed(1)}px, ${(-dy * maxShift).toFixed(1)}px)`;
    });
    hero.addEventListener('mouseleave', () => {
      heroBg.style.transform = 'scale(1.06) translate(0,0)';
    });
  }
})();
