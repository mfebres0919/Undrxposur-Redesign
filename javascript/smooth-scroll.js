/* ==========================================================================
   UNDRXPOSUR — SMOOTH SCROLLING
   Lenis eases mouse-wheel / trackpad scrolling (touch stays native).
   In-page links glide too, stopping below the fixed header.
   Off for reduced motion. Shared as window.lenis.
   ========================================================================== */
(function () {
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  window.lenis = lenis;
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  const header = document.getElementById('header');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    lenis.scrollTo(target || 0, { offset: -((header ? header.offsetHeight : 72) - 1) });
  });
})();

/* Freeze smooth scrolling while the phone menu or the photo viewer is open */
(function () {
  if (!window.lenis) return;
  new MutationObserver(() => {
    const locked = document.body.classList.contains('menu-open') || document.body.classList.contains('lightbox-open');
    locked ? window.lenis.stop() : window.lenis.start();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
