(() => {
  const doc = document.documentElement;
  const rtl = doc.dir === 'rtl';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header: solid after scroll, hide on scroll down
  const header = document.querySelector('.site-header');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !doc.classList.contains('menu-open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = doc.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.mobile-menu a').forEach(a =>
      a.addEventListener('click', () => doc.classList.remove('menu-open')));
    addEventListener('keydown', e => { if (e.key === 'Escape') doc.classList.remove('menu-open'); });
  }

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Count-up numbers
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = end + suffix; return; }
      const from = end > 1000 ? end - 40 : 0, t0 = performance.now(), dur = 1600;
      const tick = t => {
        const p = Math.min(1, (t - t0) / dur), v = Math.round(from + (end - from) * (1 - Math.pow(1 - p, 4)));
        el.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

  // Disciplines hover preview
  const preview = document.querySelector('.disc-preview');
  if (preview) {
    const imgs = preview.querySelectorAll('img');
    const cap = preview.querySelector('.disc-caption');
    const items = document.querySelectorAll('.disc-item');
    const activate = i => {
      items.forEach((it, k) => it.classList.toggle('active', k === i));
      imgs.forEach((im, k) => im.classList.toggle('on', k === i));
      if (cap) cap.textContent = items[i].dataset.caption || '';
    };
    items.forEach((it, i) => {
      it.addEventListener('mouseenter', () => activate(i));
      it.addEventListener('focusin', () => activate(i));
    });
    activate(0);
  }

  // Project rail: drag + buttons
  const rail = document.querySelector('.rail');
  if (rail) {
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add('dragging'); }
      rail.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('dragging'); });
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    rail.querySelectorAll('img').forEach(i => i.draggable = false);
    const step = () => rail.querySelector('.card').getBoundingClientRect().width + 24;
    document.querySelectorAll('[data-rail]').forEach(b => b.addEventListener('click', () => {
      const dir = b.dataset.rail === 'next' ? 1 : -1;
      rail.scrollBy({ left: dir * step() * (rtl ? -1 : 1), behavior: 'smooth' });
    }));
  }

  // Project filters
  const filters = document.querySelectorAll('.filters button');
  if (filters.length) {
    const cards = document.querySelectorAll('.grid-projects .card');
    filters.forEach(btn => btn.addEventListener('click', () => {
      filters.forEach(b => b.setAttribute('aria-pressed', b === btn));
      const f = btn.dataset.filter;
      cards.forEach(c => c.classList.toggle('hide', f !== 'all' && !c.dataset.cats.split(' ').includes(f)));
      document.querySelectorAll('.ledger tbody tr').forEach(r =>
        r.hidden = f !== 'all' && !r.dataset.cats.split(' ').includes(f));
    }));
  }

  // Parallax backgrounds
  const para = document.querySelectorAll('[data-parallax]');
  if (para.length && !reduce) {
    const run = () => {
      para.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0, ${p * -60}px, 0)`;
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(run), { passive: true });
    run();
  }

  // Contact form (FormSubmit AJAX, mailto fallback)
  const form = document.querySelector('form[data-endpoint]');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.querySelector('.hp').value) return;
      const btn = form.querySelector('button[type=submit]');
      const data = Object.fromEntries(new FormData(form));
      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = form.dataset.sending;
      try {
        const res = await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === 'false' || json.success === false) throw new Error();
        status.classList.add('ok');
        status.textContent = form.dataset.ok;
        form.reset();
      } catch {
        status.classList.add('err');
        status.textContent = form.dataset.err;
        const body = encodeURIComponent(`${data.name}\n${data.company || ''}\n${data.phone || ''}\n${data.email}\n\n${data.service || ''}\n\n${data.message}`);
        location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(data._subject)}&body=${body}`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  const yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
