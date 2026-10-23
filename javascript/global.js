/* ==========================================================================
   UNDRXPOSUR — GLOBAL SCRIPTS
   Header: shadow once you scroll; phone menu open/close.
   ========================================================================== */

(function () {
  const header = document.getElementById('header');
  if (!header) return;
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  const desktop = window.matchMedia('(min-width: 1100px)');

  function updateScrolled() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', updateScrolled, { passive: true });
  updateScrolled();

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  desktop.addEventListener('change', () => setMenu(false));
})();

/* Nav highlights the section you're in (aria-current="location") */
(function () {
  const links = [...document.querySelectorAll('.nav__link[href^="#"]')];
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;
  let ticking = false;
  function update() {
    ticking = false;
    const line = window.innerHeight * 0.4;          // the section crossing 40% down the screen is "current"
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s.id; });
    const last = sections[sections.length - 1];
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = last.id;
    links.forEach((a) => {
      if (a.getAttribute('href').slice(1) === current) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
