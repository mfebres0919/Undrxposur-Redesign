/* ==========================================================================
   UNDRXPOSUR — PAGE SCRIPTS (redesign concept)
   Booking, payment and forms are visual demos only: nothing is sent.
   ========================================================================== */

/* ---------- Hero 3D photo ring ----------
   Auto-spins slowly; pauses on hover/focus and via the Pause button (WCAG 2.2.2).
   Pointer tilts the scene; drag or swipe to spin (with a little momentum).
   The card facing the viewer is highlighted and shows its category. */
(function () {
  const stage = document.getElementById('ring-stage');
  const ring = document.getElementById('ring');
  if (!stage || !ring) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = [...ring.querySelectorAll('.ring__card')];
  const step = 360 / cards.length;
  const btn = document.getElementById('ring-pause');
  const label = btn.querySelector('.ring-pause__label');
  let angle = 0, velocity = 0, paused = false, hovering = false, dragging = false, lastX = 0, lastT = 0;
  const AUTO = 0.06;                                   // degrees per frame (~1 turn / 100s)

  function render() {
    ring.style.setProperty('--spin', `${angle}deg`);
    let best = null, bestFace = -2;
    cards.forEach((card, i) => {
      // how directly this card faces the viewer: 1 = straight on, -1 = behind
      const face = Math.cos(((i * step + angle) * Math.PI) / 180);
      card.style.setProperty('--face', Math.max(face, 0).toFixed(2));
      if (face > bestFace) { bestFace = face; best = card; }
    });
    cards.forEach((c) => c.classList.toggle('is-front', c === best));
  }

  function tick() {
    if (!dragging) {
      velocity *= 0.95;                                // momentum after a drag
      const auto = paused || hovering || document.hidden ? 0 : AUTO;
      angle -= auto + velocity;
    }
    render();
    requestAnimationFrame(tick);
  }

  // Tilt toward the pointer
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    stage.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    stage.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    if (dragging) {
      const now = performance.now(), dx = e.clientX - lastX;
      angle += dx * 0.35;
      velocity = (-dx * 0.35) / Math.max(1, (now - lastT) / 16);
      lastX = e.clientX; lastT = now;
    }
  });
  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  stage.addEventListener('pointerleave', () => { hovering = false; stage.style.setProperty('--tx', 0); stage.style.setProperty('--ty', 0); });

  // Drag / swipe to spin
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ring-pause')) return;
    dragging = true; lastX = e.clientX; lastT = performance.now(); velocity = 0;
    stage.classList.add('is-dragging'); stage.setPointerCapture(e.pointerId);
  });
  const end = () => { dragging = false; stage.classList.remove('is-dragging'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  // Pause / play
  btn.addEventListener('click', () => {
    paused = !paused;
    btn.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Play' : 'Pause';
  });

  // Review ticker: swaps every 6s while the ring is running (same pause rules)
  const reviews = [
    ['She made me feel like the main character the entire shoot.', 'Devon R. · The Signature'],
    ['Our City Hall photos look straight out of a magazine.', 'Jasmine & Marco · Wedding'],
    ['She took my wild idea and made it look even better.', 'Kiara T. · Creative Experience']
  ];
  const box = document.getElementById('ring-review');
  if (box) {
    const text = document.getElementById('ring-review-text'), by = document.getElementById('ring-review-by');
    const dots = [...box.querySelectorAll('.ring-review__dots li')];
    let r = 0;
    setInterval(() => {
      if (paused || hovering || document.hidden) return;
      box.classList.add('is-swapping');
      setTimeout(() => {
        r = (r + 1) % reviews.length;
        text.textContent = `\u201C${reviews[r][0]}\u201D`;
        by.textContent = reviews[r][1];
        dots.forEach((d, i) => d.classList.toggle('is-on', i === r));
        box.classList.remove('is-swapping');
      }, 400);
    }, 6000);
  }

  render();
  requestAnimationFrame(tick);
})();

/* ---------- Testimonial reel: concave 3D arc, auto-rotates, drag/arrows, centre card drives the quote ---------- */
(function () {
  const reel = document.getElementById('reel');
  if (!reel) return;
  const cards = [...reel.querySelectorAll('.reel__card')];
  const N = cards.length;
  let STEP = 13, CYCLE = N * STEP;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quote = document.getElementById('reel-quote'), qText = document.getElementById('reel-text'),
    qName = document.getElementById('reel-name'), qSes = document.getElementById('reel-session'), qFace = document.getElementById('reel-face');
  const pauseBtn = document.getElementById('reel-pause');
  let offset = 0, target = null, paused = reduce, hovering = false, dragging = false, center = 0, R = 900, range = 60;
  let last = performance.now(), lastMove = 0;

  function size() {
    const w = reel.clientWidth, cw = cards[0].offsetWidth;
    R = Math.max(cw * 3.6, Math.min(w * 0.52, cw * 4.6));
    reel.style.perspective = `${Math.round(R * 1.05)}px`;
    STEP = 2 * Math.asin(Math.min(1, (cw * 1.1) / 2 / R)) * 180 / Math.PI;
    CYCLE = N * STEP;
    range = Math.min(74, CYCLE / 2 - STEP / 2);
  }
  function wrap(u) { u = ((u % CYCLE) + CYCLE) % CYCLE; return u > CYCLE / 2 ? u - CYCLE : u; }
  function layout() {
    const d = R * 0.74;
    let best = 0, bestA = 999;
    cards.forEach((c, i) => {
      const u = wrap(i * STEP + offset), a = Math.abs(u);
      if (a < bestA) { bestA = a; best = i; }
      if (a > range) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      c.style.opacity = Math.min(1, (range - a) / 10).toFixed(2);
      c.style.transform = `translateZ(${d.toFixed(1)}px) rotateY(${(-u).toFixed(2)}deg) translateZ(${(-R).toFixed(1)}px)`;
    });
    if (best !== center || !quote.dataset.ready) setCenter(best);
  }
  function setCenter(i) {
    cards[center].classList.remove('is-center');
    center = i; cards[i].classList.add('is-center');
    const c = cards[i];
    if (!quote.dataset.ready) { quote.dataset.ready = '1'; return; }
    quote.classList.add('is-swapping');
    clearTimeout(setCenter.t);
    setCenter.t = setTimeout(() => {
      qText.innerHTML = `“${c.dataset.quote}”`;
      qName.innerHTML = c.dataset.name; qSes.textContent = c.dataset.session;
      qFace.src = `images/gallery/${c.dataset.img}-480.jpg`;
      quote.classList.remove('is-swapping');
    }, 300);
  }
  function snapTo(dir) {               // move to the next/previous card, snapping to the step grid
    const base = Math.round(offset / STEP) * STEP;
    target = base - dir * STEP;
    if (reduce) { offset = target; target = null; layout(); }
  }
  function tick(now) {
    const dt = Math.min(64, now - last); last = now;
    if (target !== null) {
      offset += (target - offset) * Math.min(1, dt / 120);
      if (Math.abs(target - offset) < 0.05) { offset = target; target = null; }
      layout();
    } else if (!paused && !hovering && !dragging && !document.hidden && now - lastMove > 1500) {
      offset -= dt * 0.0025;           // ~2.5°/s
      layout();
    }
    requestAnimationFrame(tick);
  }

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('.ring-pause__label').textContent = paused ? 'Play' : 'Pause';
  });
  if (reduce) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.querySelector('.ring-pause__label').textContent = 'Play'; }
  document.getElementById('reel-next').addEventListener('click', () => { lastMove = performance.now(); snapTo(1); });
  document.getElementById('reel-prev').addEventListener('click', () => { lastMove = performance.now(); snapTo(-1); });
  reel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  reel.addEventListener('pointerleave', () => { hovering = false; });

  let sx = 0, so = 0;
  reel.addEventListener('pointerdown', (e) => { dragging = true; target = null; sx = e.clientX; so = offset; reel.classList.add('is-dragging'); reel.setPointerCapture(e.pointerId); });
  reel.addEventListener('pointermove', (e) => { if (!dragging) return; offset = so + (e.clientX - sx) * (STEP / cards[0].offsetWidth) * 0.9; layout(); });
  const end = () => { if (!dragging) return; dragging = false; reel.classList.remove('is-dragging'); lastMove = performance.now(); target = Math.round(offset / STEP) * STEP; };
  reel.addEventListener('pointerup', end); reel.addEventListener('pointercancel', end);

  window.addEventListener('resize', () => { size(); layout(); });
  size(); layout();
  requestAnimationFrame(tick);
})();

/* ---------- Portfolio filters ---------- */
(function () {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const works = [...document.querySelectorAll('.work')];
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    buttons.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    works.forEach((w) => {
      const hide = cat !== 'all' && w.dataset.cat !== cat;
      w.classList.toggle('is-hidden', hide);
      if (!hide) { w.style.animation = 'none'; void w.offsetWidth; w.style.animation = ''; }   // replay the fade-in
    });
  }));
})();

/* ---------- Lightbox: click a portfolio photo to view it large ----------
   Arrows / swipe move through the photos currently shown by the filter.
   Escape closes; focus returns to the photo that opened it. */
(function () {
  const box = document.getElementById('lightbox');
  if (!box) return;
  const img = box.querySelector('.lightbox__img');
  const title = box.querySelector('.lightbox__title');
  const place = box.querySelector('.lightbox__place');
  const count = box.querySelector('.lightbox__count');
  const closeBtn = box.querySelector('.lightbox__close');
  let list = [], index = 0, opener = null, startX = 0;

  function visible() { return [...document.querySelectorAll('.work:not(.is-hidden)')]; }

  function show(i) {
    index = (i + list.length) % list.length;
    const work = list[index];
    const pic = work.querySelector('img');
    const webp = work.querySelector('source');
    // largest WebP from the srcset, else the JPG
    const big = webp ? webp.srcset.split(',').pop().trim().split(' ')[0] : pic.src;
    img.src = big;
    img.alt = pic.alt;
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    title.textContent = work.querySelector('.work__title').textContent;
    place.textContent = work.querySelector('.work__place').textContent;
    count.textContent = `${index + 1} / ${list.length}`;
  }

  function open(work) {
    list = visible();
    opener = work.querySelector('.work__open');
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    show(list.indexOf(work));
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove('lightbox-open');
    if (opener) opener.focus();
  }

  document.querySelectorAll('.work__open').forEach((btn) => btn.addEventListener('click', () => open(btn.closest('.work'))));
  closeBtn.addEventListener('click', close);
  box.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lightbox__nav--next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'Tab') {                       // keep focus inside the viewer
      const f = [...box.querySelectorAll('button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---------- Services intro: scroll drives the word-by-word reveal ----------
   p = 0 when the intro's top reaches the top of the screen (heading pins),
   1 when its bottom does (heading releases). */
(function () {
  const intro = document.getElementById('svc-intro');
  if (!intro || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const pin = intro.querySelector('.svc-intro__pin');
  let ticking = false;
  function update() {
    ticking = false;
    const r = intro.getBoundingClientRect();
    const travel = intro.offsetHeight - window.innerHeight;
    // small lead-in so the first word starts as the heading arrives
    const p = Math.min(Math.max((-r.top + window.innerHeight * 0.35) / (travel + window.innerHeight * 0.35), 0), 1);
    pin.style.setProperty('--p', p.toFixed(3));
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------- About: viewfinder "shot" on reveal + polaroid parallax (--sp 0→1) ---------- */
(function () {
  const art = document.getElementById('about-art');
  if (!art) return;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { art.classList.add('is-shot'); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(art);
  } else art.classList.add('is-shot');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update() {
    ticking = false;
    const r = art.getBoundingClientRect(), vh = window.innerHeight;
    art.style.setProperty('--sp', Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1).toFixed(3));
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Background cameras: scroll drives each one (--ap 0→1 across its section) ---------- */
(function () {
  const cams = [...document.querySelectorAll('.bg-cam:not(.bg-cam--right)')];   // services camera follows the intro's --p
  if (!cams.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;
    cams.forEach((cam) => {
      const r = cam.parentElement.getBoundingClientRect();
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      cam.style.setProperty('--ap', p.toFixed(3));
    });
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Booking demo: calendar + live summary ---------- */
(function () {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const booked = [3, 7, 8, 14, 15, 21, 22, 26, 27];       // sample "booked" dates
  const first = new Date(2026, 10, 1).getDay();             // Nov 2026 starts on Sunday
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => {
    const el = document.createElement('span'); el.className = 'cal__dow'; el.textContent = d; el.setAttribute('aria-hidden', 'true'); grid.appendChild(el);
  });
  for (let i = 0; i < first; i++) grid.appendChild(Object.assign(document.createElement('span'), { className: 'cal__day' }));
  for (let day = 1; day <= 30; day++) {
    const date = new Date(2026, 10, day);
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (booked.includes(day) || day < 2) {
      const el = document.createElement('span');
      el.className = 'cal__day cal__day--full'; el.textContent = day; el.setAttribute('aria-label', `${label}, unavailable`);
      grid.appendChild(el);
    } else {
      const el = document.createElement('label');
      el.className = 'cal__day';
      el.innerHTML = `<input type="radio" name="date" value="${label}"${day === 12 ? ' checked' : ''}><span aria-hidden="true">${day}</span><span class="visually-hidden">${label}</span>`;
      grid.appendChild(el);
    }
  }
  const out = { session: 'sum-session', date: 'sum-date', time: 'sum-time' };
  const sumImg = document.getElementById('sum-img'), sumSrc = document.getElementById('sum-src');
  function swapImg(slug) {
    if (!sumImg || !slug || sumImg.dataset.slug === slug) return;
    const first = !sumImg.dataset.slug;
    sumImg.dataset.slug = slug;
    const set = () => { sumSrc.srcset = `images/gallery/${slug}-480.webp`; sumImg.src = `images/gallery/${slug}-480.jpg`; sumImg.classList.remove('is-swapping'); };
    if (first) { set(); return; }
    sumImg.classList.add('is-swapping');
    setTimeout(set, 300);
  }
  function update() {
    const s = document.querySelector('input[name="session"]:checked');
    const d = document.querySelector('input[name="date"]:checked');
    const t = document.querySelector('input[name="time"]:checked');
    if (s) {
      const price = +s.dataset.price, plus = s.dataset.plus ? '+' : '', dep = fmt.format(Math.round(price / 2));
      document.getElementById(out.session).textContent = s.value;
      document.getElementById('sum-total').textContent = fmt.format(price) + plus;
      document.getElementById('sum-deposit').textContent = dep;
      document.getElementById('reserve').textContent = `Pay ${dep} & Reserve`;
      swapImg(s.dataset.img);
    }
    if (d) document.getElementById(out.date).textContent = d.value;
    if (t) document.getElementById(out.time).textContent = t.value;
  }
  document.addEventListener('change', (e) => { if (e.target.matches('input[name="session"], input[name="date"], input[name="time"]')) update(); });

  // "Book this session" buttons preselect the session
  document.querySelectorAll('[data-session]').forEach((a) => a.addEventListener('click', () => {
    const r = [...document.querySelectorAll('input[name="session"]')].find((x) => x.value === a.dataset.session);
    if (r) { r.checked = true; update(); }
  }));

  const btn = document.getElementById('reserve'), status = document.getElementById('reserve-status');
  btn.addEventListener('click', () => {
    status.textContent = `Demo: your ${document.getElementById(out.session).textContent} session on ${document.getElementById(out.date).textContent} at ${document.getElementById(out.time).textContent} would be reserved.`;
  });
  update();
})();

/* ---------- Contact demo ---------- */
(function () {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.querySelector('.form__status').textContent = 'Thanks! This is a demo, so nothing was sent, but on the live site I would reply within a day.';
  });
})();

/* ---------- Scroll fade-ins: every block fades up slowly (2s) the first time it scrolls into view ---------- */
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sel = [
    '.ribbon', '.section-head > *', '.filters', '.work', '.svc',
    '.step', '.summary', '.about__copy > *', '.about__art-col',
    '.reel', '.reel-quote', '.reel-controls', '.reviews__note',
    '.contact__copy > *', '.form', '.footer__inner > *'
  ].join(',');
  const els = [...document.querySelectorAll(sel)].filter((el) => !el.closest('.svc-intro'));
  document.documentElement.classList.add('fx');
  // Siblings that arrive together cascade slightly (0.15s apart)
  const groups = new Map();
  els.forEach((el) => {
    el.setAttribute('data-fade', '');
    const n = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, n + 1);
    el.dataset.fadeIndex = n;
  });
  const io = new IntersectionObserver((entries) => {
    let batch = 0;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.style.setProperty('--fd', `${Math.min(batch, 5) * 0.15}s`);
      en.target.classList.add('is-in');
      io.unobserve(en.target);
      batch++;
    });
  }, { threshold: 0.1 });
  els.forEach((el) => io.observe(el));
})();

/* ---------- Back to top: appears after the hero, ring fills with scroll progress ---------- */
(function () {
  const btn = document.getElementById('to-top');
  if (!btn) return;
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    btn.style.setProperty('--prog', max > 0 ? (window.scrollY / max).toFixed(3) : 0);
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
