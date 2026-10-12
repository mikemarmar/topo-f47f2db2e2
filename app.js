(() => {
  const T = window.TOPO;
  const app = document.getElementById('app');
  const titleEl = document.getElementById('title');
  const back = document.getElementById('back');

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const img = (page, side) => `img/${page}${side}.webp`;
  const sectorById = (id) => T.sectors.find((s) => String(s.id) === String(id));
  const allRoutes = T.sectors.flatMap((s) => s.routes.map((r) => ({ s, n: r[0], name: r[1], gloss: r[2], grade: r[3], h: r[4], desc: r[5], page: r[6] })));

  function gradeClass(g) {
    const m = String(g).match(/[3-9]/);
    return m ? 'g' + m[0] : '';
  }
  // Numeric value for filtering/sorting: 6a = 6.0, 6a+ = 6.15, 6b = 6.33 ...
  function gradeValue(g) {
    const m = String(g).match(/([3-9])\s*([abc])?\s*(\+)?/);
    if (!m) return null;
    return +m[1] + ({ a: 0, b: 0.33, c: 0.66 }[m[2] || 'a']) + (m[3] ? 0.15 : 0);
  }

  function routeLi(r, withSector) {
    const link = withSector ? ` data-href="#/s/${r.s.id}/${encodeURIComponent(r.n)}" role="link" tabindex="0"` : '';
    return `<li class="route" id="${withSector ? '' : `r-${r.s.id}-${esc(r.n)}`}"${link}>
      <div class="n">${esc(r.n)}</div>
      <div class="nm">${esc(r.name)}${r.gloss ? ` <span class="gloss">— ${esc(r.gloss)}</span>` : ''}</div>
      <div class="gr"><span class="grade ${gradeClass(r.grade)}">${esc(r.grade)}</span><span class="ht">${esc(r.h)}</span></div>
      <div class="desc">${esc(r.desc)}${withSector ? `<div class="sec">Sector ${r.s.id} · ${esc(r.s.name)}</div>` : ''}</div>
    </li>`;
  }

  function figure(page, side, cap) {
    return `<div class="topo-img" data-zoom="${img(page, side)}"><img loading="lazy" src="${img(page, side)}" alt="${esc(cap || '')}"><span class="zoom">Tap to zoom</span></div>`;
  }

  // ---------- pages ----------
  function home() {
    titleEl.textContent = 'Saffres';
    back.style.visibility = 'hidden';
    const infoLinks = T.info.sections.map((s) => `<a href="#/info/${s.id}">${esc(s.title)}</a>`).join('');
    app.innerHTML = `
      <div class="hero">
        <h2>Climbing in Saffres</h2>
        <div class="muted">Terres d'Auxois, Burgundy · ~400 bolted routes · 16 sectors</div>
        <div class="muted small">Unofficial English adaptation of the 6th-edition topo by Yannick Dupin.</div>
      </div>
      ${offlineCard()}
      <h2>Sectors</h2>
      <div class="sectors">${T.sectors.map((s) => `
        <a class="sector-link" href="#/s/${s.id}" style="--c:${s.color}">
          <span class="num">${s.id}</span>
          <span><div class="nm">${esc(s.name)}</div>
          <div class="meta">${s.gloss ? esc(s.gloss) + ' · ' : ''}${s.stats.routes} routes · ${esc(s.stats.grades)}</div></span>
          <span class="go">›</span>
        </a>`).join('')}
      </div>
      <h2>Info</h2>
      <div class="links">${infoLinks}</div>
      <footer class="credits">${T.info.credits}</footer>`;
    initOffline();
  }

  function sector(id, routeN) {
    const s = sectorById(id);
    if (!s) return home();
    titleEl.textContent = `${s.id}. ${s.name}`;
    back.style.visibility = 'visible';
    const routes = allRoutes.filter((r) => r.s === s);
    const idx = T.sectors.indexOf(s);
    const prev = T.sectors[idx - 1], next = T.sectors[idx + 1];
    const topoBlocks = s.topos.map((t) => {
      const rs = routes.filter((r) => r.page === t.page);
      return `<section class="topo">
        ${figure(t.page, 'L', `Topo, routes ${t.routes}`)}
        <div class="topo-cap">${t.label ? esc(t.label) + ' · ' : ''}Routes ${esc(t.routes)}</div>
        <ul class="routes">${rs.map((r) => routeLi(r)).join('')}</ul>
      </section>`;
    }).join('');
    app.innerHTML = `
      <div class="sec-head" style="--c:${s.color}">
        <div class="muted small">Sector ${s.id}</div>
        <h2>${esc(s.name)}</h2>
        ${s.gloss ? `<div class="muted">${esc(s.gloss)}</div>` : ''}
      </div>
      <div class="chips">
        <span class="chip">${s.stats.routes} routes</span>
        <span class="chip">${esc(s.stats.grades)}</span>
        <span class="chip">${esc(s.stats.aspect)}</span>
        <span class="chip">${esc(s.stats.height)}</span>
      </div>
      ${s.warning ? `<div class="warn">${esc(s.warning)}</div>` : ''}
      <ul class="notes">${s.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      ${figure(s.intro, 'R', 'Where the sector is on the cliff')}
      <div class="topo-cap">Location on the cliff (red box)</div>
      ${topoBlocks}
      <details class="orig"><summary>Original book pages (French)</summary>
        <div class="orig-grid">${[s.intro, ...s.topos.map((t) => t.page)].flatMap((p) => [figure(p, 'L'), figure(p, 'R')]).join('')}</div>
      </details>
      <nav class="secnav">
        ${prev ? `<a href="#/s/${prev.id}">‹ ${prev.id}. ${esc(prev.name)}</a>` : '<span></span>'}
        ${next ? `<a class="next" href="#/s/${next.id}">${next.id}. ${esc(next.name)} ›</a>` : '<span></span>'}
      </nav>`;
    if (routeN) {
      const el = document.getElementById(`r-${s.id}-${routeN}`);
      if (el) { el.classList.add('flash'); requestAnimationFrame(() => el.scrollIntoView({ block: 'center' })); }
    } else window.scrollTo(0, 0);
  }

  const searchState = { q: '', band: '' };
  function search() {
    titleEl.textContent = 'Find a route';
    back.style.visibility = 'visible';
    const bands = ['3', '4', '5', '6', '7', '8'];
    app.innerHTML = `
      <div class="search">
        <input id="q" type="search" placeholder="Route name, number or description…" autocomplete="off" value="${esc(searchState.q)}">
        <div class="filters">${bands.map((b) => `<button data-band="${b}" aria-pressed="${searchState.band === b}">${b}</button>`).join('')}</div>
      </div>
      <div id="count" class="muted small"></div>
      <ul class="routes" id="results"></ul>`;
    const q = document.getElementById('q');
    const norm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const run = () => {
      const term = norm(searchState.q.trim());
      const res = allRoutes.filter((r) => {
        if (searchState.band && String(Math.floor(gradeValue(r.grade) || 0)) !== searchState.band) return false;
        if (!term) return true;
        return r.n === term || norm(`${r.name} ${r.gloss} ${r.desc} ${r.s.name}`).includes(term);
      });
      document.getElementById('count').textContent = `${res.length} route${res.length === 1 ? '' : 's'}`;
      document.getElementById('results').innerHTML = res.slice(0, 300).map((r) => routeLi(r, true)).join('');
    };
    q.addEventListener('input', () => { searchState.q = q.value; run(); });
    app.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
      searchState.band = searchState.band === b.dataset.band ? '' : b.dataset.band;
      app.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.band === searchState.band));
      run();
    }));
    run();
  }

  function renderBlock(b) {
    if (b.h) return `<h3>${esc(b.h)}</h3>`;
    if (b.p) return `<p>${b.p}</p>`;
    if (b.ul) return `<ul>${b.ul.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    if (b.dl) return `<dl>${b.dl.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${d}</dd>`).join('')}</dl>`;
    if (b.table) return `<table>${b.table.map((row, i) => `<tr>${row.map((c) => i === 0 && b.head ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
    if (b.img) return `<div class="figure">${figure(b.img.slice(0, -1), b.img.slice(-1), b.cap)}</div>${b.cap ? `<div class="topo-cap">${esc(b.cap)}</div>` : ''}`;
    return '';
  }

  function info(id) {
    const sec = T.info.sections.find((s) => s.id === id);
    if (!sec) return home();
    titleEl.textContent = sec.title;
    back.style.visibility = 'visible';
    app.innerHTML = `<div class="prose"><h2>${esc(sec.title)}</h2>${sec.blocks.map(renderBlock).join('')}
      ${sec.pages && sec.pages.length ? `<details class="orig"><summary>Original book pages (French)</summary><div class="orig-grid">${sec.pages.flatMap((p) => [figure(p, 'L'), figure(p, 'R')]).join('')}</div></details>` : ''}
    </div>`;
    window.scrollTo(0, 0);
  }

  // ---------- offline ----------
  function offlineCard() {
    return `<div class="card offline" id="offline">
      <strong>Offline use</strong>
      <div id="ostatus" class="small muted">Checking…</div>
      <div class="bar-outer"><div class="bar-inner" id="obar"></div></div>
      <div class="row">
        <button class="btn" id="odl">Download everything</button>
        <span id="osize" class="small muted"></span>
      </div>
      <div id="oios" class="ios-hint muted" hidden>On iPhone: tap <b>Share → Add to Home Screen</b> and open it from there. Safari may clear offline data for websites you haven't opened in a week; the home-screen app keeps it.</div>
    </div>`;
  }

  async function cachedCount() {
    if (!('caches' in window)) return 0;
    const c = await caches.open(T.imgCache);
    const keys = new Set((await c.keys()).map((r) => new URL(r.url).pathname.split('/img/')[1]));
    return T.images.filter((i) => keys.has(i.slice(4))).length;
  }

  async function initOffline() {
    const st = document.getElementById('ostatus'), bar = document.getElementById('obar'), btn = document.getElementById('odl');
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
    if (ios) document.getElementById('oios').hidden = false;
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      st.textContent = 'This browser does not support offline mode.'; btn.disabled = true; return;
    }
    const total = T.images.length;
    const show = (n) => {
      bar.style.width = (100 * n / total) + '%';
      st.innerHTML = n === total ? '<span class="ok">✓ Everything is saved on this device — works with no signal.</span>' : `${n} of ${total} images saved on this device.`;
      btn.textContent = n === total ? 'Re-check download' : (n ? 'Finish download' : 'Download everything');
    };
    show(await cachedCount());
    btn.onclick = async () => {
      btn.disabled = true;
      try { await navigator.storage?.persist?.(); } catch (e) { /* not supported */ }
      const c = await caches.open(T.imgCache);
      let done = 0, failed = 0;
      const queue = [...T.images];
      const worker = async () => {
        while (queue.length) {
          const u = queue.shift();
          if (!(await c.match(u))) {
            let ok = false;
            for (let attempt = 0; attempt < 3 && !ok; attempt++) {
              try { const res = await fetch(u, { cache: 'reload' }); if (res.ok) { await c.put(u, res); ok = true; } } catch (e) { /* retry */ }
            }
            if (!ok) failed++;
          }
          done++; bar.style.width = (100 * done / total) + '%';
          st.textContent = `Downloading… ${done} / ${total}`;
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      const n = await cachedCount();
      show(n);
      if (failed) st.innerHTML += ` <b>${failed} failed — check your connection and tap again.</b>`;
      btn.disabled = false;
    };
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      document.getElementById('osize').textContent = `Using ${(e.usage / 1e6).toFixed(0)} MB`;
    }
  }

  // ---------- image viewer (pinch / pan / double-tap) ----------
  const viewer = document.getElementById('viewer'), vimg = document.getElementById('vimg'), stage = document.getElementById('vstage');
  let z = { s: 1, x: 0, y: 0, fit: 1 }, pts = new Map(), last = null, lastTap = 0;
  const apply = () => { vimg.style.transform = `translate(${z.x}px,${z.y}px) scale(${z.s})`; };
  function fit() {
    const W = stage.clientWidth, H = stage.clientHeight, iw = vimg.naturalWidth, ih = vimg.naturalHeight;
    z.fit = Math.min(W / iw, H / ih); z.s = z.fit; z.x = (W - iw * z.s) / 2; z.y = (H - ih * z.s) / 2; apply();
  }
  function zoomAt(cx, cy, ns) {
    ns = Math.max(z.fit, Math.min(z.fit * 8, ns));
    z.x = cx - (cx - z.x) * (ns / z.s); z.y = cy - (cy - z.y) * (ns / z.s); z.s = ns; apply();
  }
  function openViewer(src) {
    viewer.hidden = false; document.body.style.overflow = 'hidden';
    vimg.onload = fit; vimg.src = src; if (vimg.complete && vimg.naturalWidth) fit();
    history.pushState({ viewer: true }, '');
  }
  function closeViewer() { viewer.hidden = true; document.body.style.overflow = ''; pts.clear(); }
  document.getElementById('vclose').onclick = () => history.back();
  window.addEventListener('popstate', () => { if (!viewer.hidden) closeViewer(); });
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = null;
    if (pts.size === 1) {
      const now = Date.now();
      if (now - lastTap < 300) zoomAt(e.clientX, e.clientY, z.s > z.fit * 1.2 ? z.fit : z.fit * 3);
      lastTap = now;
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.values()];
    if (p.length === 1) {
      if (last) { z.x += p[0].x - last.x; z.y += p[0].y - last.y; apply(); }
      last = { x: p[0].x, y: p[0].y, d: 0 };
    } else if (p.length >= 2) {
      const cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2, d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (last && last.d) { z.x += cx - last.x; z.y += cy - last.y; zoomAt(cx, cy, z.s * d / last.d); }
      last = { x: cx, y: cy, d };
    }
  });
  const up = (e) => { pts.delete(e.pointerId); last = null; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, z.s * (e.deltaY < 0 ? 1.15 : 0.87)); }, { passive: false });
  window.addEventListener('resize', () => { if (!viewer.hidden) fit(); });
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-zoom]');
    if (t) { e.preventDefault(); openViewer(t.dataset.zoom); return; }
    const l = e.target.closest('[data-href]');
    if (l) location.hash = l.dataset.href;
  });

  // ---------- router ----------
  function route() {
    if (!viewer.hidden) closeViewer();
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (parts[0] === 's') return sector(parts[1], parts[2]);
    if (parts[0] === 'routes') return search();
    if (parts[0] === 'info') return info(parts[1]);
    home(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
