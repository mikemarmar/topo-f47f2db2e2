(() => {
  const T = window.TOPO;
  const app = document.getElementById('app');
  const titleEl = document.getElementById('title');
  const back = document.getElementById('back');

  // ---------- language ----------
  const STR = {
    fr: {
      heroTitle: 'Escalade à Saffres',
      heroSub: "Terres d'Auxois, Bourgogne · ~400 voies équipées · 16 secteurs",
      heroNote: "D'après la 6e édition du topo de Yannick Dupin.",
      sectors: 'Secteurs', info: 'Infos', sector: 'Secteur', routes: 'voies', route: 'voie',
      topoRoutes: 'Voies', locCap: 'Position sur la falaise (cadre rouge)', locAlt: 'Position du secteur sur la falaise',
      orig: 'Pages originales du topo', zoom: 'Toucher pour zoomer', find: 'Chercher une voie',
      searchPh: 'Nom, numéro ou description…',
      offTitle: 'Hors connexion', checking: 'Vérification…', dlAll: 'Tout télécharger', dlFinish: 'Terminer le téléchargement', dlCheck: 'Revérifier',
      saved: (n, t) => `${n} images sur ${t} enregistrées sur cet appareil.`,
      allSaved: '✓ Tout est enregistré sur cet appareil — fonctionne sans réseau.',
      downloading: (d, t) => `Téléchargement… ${d} / ${t}`,
      failed: (f) => `${f} échec(s) — vérifiez votre connexion et réessayez.`,
      using: (mb) => `${mb} Mo utilisés`, noSupport: 'Ce navigateur ne gère pas le mode hors connexion.',
      ios: "Sur iPhone : touchez <b>Partager → Sur l'écran d'accueil</b> et ouvrez le topo depuis là. Safari peut effacer les données hors connexion des sites non ouverts depuis une semaine ; l'app sur l'écran d'accueil les conserve.",
      vhint: 'Pincer ou toucher deux fois pour zoomer',
    },
    en: {
      heroTitle: 'Climbing in Saffres',
      heroSub: "Terres d'Auxois, Burgundy · ~400 bolted routes · 16 sectors",
      heroNote: 'Unofficial English adaptation of the 6th-edition topo by Yannick Dupin.',
      sectors: 'Sectors', info: 'Info', sector: 'Sector', routes: 'routes', route: 'route',
      topoRoutes: 'Routes', locCap: 'Location on the cliff (red box)', locAlt: 'Where the sector is on the cliff',
      orig: 'Original book pages (French)', zoom: 'Tap to zoom', find: 'Find a route',
      searchPh: 'Route name, number or description…',
      offTitle: 'Offline use', checking: 'Checking…', dlAll: 'Download everything', dlFinish: 'Finish download', dlCheck: 'Re-check download',
      saved: (n, t) => `${n} of ${t} images saved on this device.`,
      allSaved: '✓ Everything is saved on this device — works with no signal.',
      downloading: (d, t) => `Downloading… ${d} / ${t}`,
      failed: (f) => `${f} failed — check your connection and tap again.`,
      using: (mb) => `Using ${mb} MB`, noSupport: 'This browser does not support offline mode.',
      ios: "On iPhone: tap <b>Share → Add to Home Screen</b> and open it from there. Safari may clear offline data for websites you haven't opened in a week; the home-screen app keeps it.",
      vhint: 'Pinch or double-tap to zoom',
    },
  };
  let lang = 'fr';
  try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch (e) { /* storage unavailable */ }
  const L = () => STR[lang];
  const isEn = () => lang === 'en';
  // Pick the French or English variant of a data field (English is the unsuffixed key).
  const pick = (o, key) => (isEn() ? o[key] : (o[key + '_fr'] ?? o[key]));

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('lang', l); } catch (e) { /* storage unavailable */ }
    applyLangChrome();
    route();
  }
  function applyLangChrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll('#langs button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    document.getElementById('searchlink').setAttribute('aria-label', L().find);
    document.getElementById('vhint').textContent = L().vhint;
  }
  document.querySelectorAll('#langs button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const img = (page, side) => `img/${page}${side}.webp`;
  const sectorById = (id) => T.sectors.find((s) => String(s.id) === String(id));
  const allRoutes = T.sectors.flatMap((s) => s.routes.map((r) => ({ s, n: r[0], name: r[1], gloss: r[2], grade: r[3], h: r[4], desc: r[5], page: r[6], descFr: r[7] })));
  const routeDesc = (r) => (isEn() ? r.desc : r.descFr);
  const plural = (n) => `${n} ${n === 1 ? L().route : L().routes}`;

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
      <div class="nm">${esc(r.name)}${isEn() && r.gloss ? ` <span class="gloss">— ${esc(r.gloss)}</span>` : ''}</div>
      <div class="gr"><span class="grade ${gradeClass(r.grade)}">${esc(r.grade)}</span><span class="ht">${esc(r.h)}</span></div>
      <div class="desc">${esc(routeDesc(r))}${withSector ? `<div class="sec">${L().sector} ${r.s.id} · ${esc(r.s.name)}</div>` : ''}</div>
    </li>`;
  }

  function figure(page, side, cap) {
    return `<div class="topo-img" data-zoom="${img(page, side)}"><img loading="lazy" src="${img(page, side)}" alt="${esc(cap || '')}"><span class="zoom">${L().zoom}</span></div>`;
  }

  // ---------- pages ----------
  function home() {
    titleEl.textContent = 'Saffres';
    back.style.visibility = 'hidden';
    const infoLinks = T.info.sections.map((s) => `<a href="#/info/${s.id}">${esc(pick(s, 'title'))}</a>`).join('');
    app.innerHTML = `
      <div class="hero">
        <h2>${L().heroTitle}</h2>
        <div class="muted">${L().heroSub}</div>
        <div class="muted small">${L().heroNote}</div>
      </div>
      ${offlineCard()}
      <h2>${L().sectors}</h2>
      <div class="sectors">${T.sectors.map((s) => `
        <a class="sector-link" href="#/s/${s.id}" style="--c:${s.color}">
          <span class="num">${s.id}</span>
          <span><div class="nm">${esc(s.name)}</div>
          <div class="meta">${isEn() && s.gloss ? esc(s.gloss) + ' · ' : ''}${plural(s.stats.routes)} · ${esc(s.stats.grades)}</div></span>
          <span class="go">›</span>
        </a>`).join('')}
      </div>
      <h2>${L().info}</h2>
      <div class="links">${infoLinks}</div>
      <footer class="credits">${pick(T.info, 'credits')}</footer>`;
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
        ${figure(t.page, 'L', `Topo ${t.routes}`)}
        <div class="topo-cap">${L().topoRoutes} ${esc(t.routes)}</div>
        <ul class="routes">${rs.map((r) => routeLi(r)).join('')}</ul>
      </section>`;
    }).join('');
    const warning = pick(s, 'warning');
    app.innerHTML = `
      <div class="sec-head" style="--c:${s.color}">
        <div class="muted small">${L().sector} ${s.id}</div>
        <h2>${esc(s.name)}</h2>
        ${isEn() && s.gloss ? `<div class="muted">${esc(s.gloss)}</div>` : ''}
      </div>
      <div class="chips">
        <span class="chip">${plural(s.stats.routes)}</span>
        <span class="chip">${esc(s.stats.grades)}</span>
        <span class="chip">${esc(pick(s.stats, 'aspect'))}</span>
        <span class="chip">${esc(pick(s.stats, 'height'))}</span>
      </div>
      ${warning ? `<div class="warn">${esc(warning)}</div>` : ''}
      <ul class="notes">${pick(s, 'notes').map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      ${figure(s.intro, 'R', L().locAlt)}
      <div class="topo-cap">${L().locCap}</div>
      ${topoBlocks}
      <details class="orig"><summary>${L().orig}</summary>
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
    titleEl.textContent = L().find;
    back.style.visibility = 'visible';
    const bands = ['3', '4', '5', '6', '7', '8'];
    app.innerHTML = `
      <div class="search">
        <input id="q" type="search" placeholder="${L().searchPh}" autocomplete="off" value="${esc(searchState.q)}">
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
        return r.n === term || norm(`${r.name} ${r.gloss} ${r.desc} ${r.descFr} ${r.s.name}`).includes(term);
      });
      document.getElementById('count').textContent = plural(res.length);
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
    const title = pick(sec, 'title');
    titleEl.textContent = title;
    back.style.visibility = 'visible';
    app.innerHTML = `<div class="prose"><h2>${esc(title)}</h2>${pick(sec, 'blocks').map(renderBlock).join('')}
      ${sec.pages && sec.pages.length ? `<details class="orig"><summary>${L().orig}</summary><div class="orig-grid">${sec.pages.flatMap((p) => [figure(p, 'L'), figure(p, 'R')]).join('')}</div></details>` : ''}
    </div>`;
    window.scrollTo(0, 0);
  }

  // ---------- offline ----------
  function offlineCard() {
    return `<div class="card offline" id="offline">
      <strong>${L().offTitle}</strong>
      <div id="ostatus" class="small muted">${L().checking}</div>
      <div class="bar-outer"><div class="bar-inner" id="obar"></div></div>
      <div class="row">
        <button class="btn" id="odl">${L().dlAll}</button>
        <span id="osize" class="small muted"></span>
      </div>
      <div id="oios" class="ios-hint muted" hidden>${L().ios}</div>
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
      st.textContent = L().noSupport; btn.disabled = true; return;
    }
    const total = T.images.length;
    const show = (n) => {
      bar.style.width = (100 * n / total) + '%';
      st.innerHTML = n === total ? `<span class="ok">${L().allSaved}</span>` : L().saved(n, total);
      btn.textContent = n === total ? L().dlCheck : (n ? L().dlFinish : L().dlAll);
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
          st.textContent = L().downloading(done, total);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      const n = await cachedCount();
      show(n);
      if (failed) st.innerHTML += ` <b>${L().failed(failed)}</b>`;
      btn.disabled = false;
    };
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      document.getElementById('osize').textContent = L().using((e.usage / 1e6).toFixed(0));
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
  applyLangChrome();
  route();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
