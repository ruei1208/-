// Renders content.js into the page, plus nav, tabs, reveal-on-scroll, the hero field animation and the image lightbox.
// Text edits belong in content.js; this file only handles layout.
(() => {
  const S = window.SITE;
  const $ = (q, el = document) => el.querySelector(q);
  const get = path => path.split('.').reduce((o, k) => o?.[k], S);
  const esc = s => String(s);
  const isTodo = s => typeof s === 'string' && s.startsWith('【待補】');
  // [1] / [5][6] -> superscript links to the reference list
  const cite = s => esc(s).replace(/\[(\d+)\]/g, (_, n) => `<a class="cite" href="#ref-${n}" data-ref="${n}">[${n}]</a>`);
  const txt = s => isTodo(s) ? `<span class="ph-inline">${s}</span>` : cite(s);
  const ph = label => `<div class="ph"><b>待補 PLACEHOLDER</b><span>${esc(label).replace('【待補】', '')}</span></div>`;
  const fig = f => !f.src
    ? `<figure>${ph(f.caption || '【待補】圖片')}</figure>`
    : `<figure><img src="${f.src}" alt="${esc(f.caption).replace(/<[^>]+>|"/g, '')}" loading="lazy" class="${f.dark ? 'dark' : ''}"><figcaption>${cite(f.caption)}</figcaption></figure>`;
  const table = (el, head, rows, cls = []) => {
    el.innerHTML = `<thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${cls[i] || ''}">${txt(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  };

  // ---------- simple bindings
  document.querySelectorAll('[data-bind]').forEach(el => { const v = get(el.dataset.bind); if (v != null) el.innerHTML = txt(v); });
  document.title = `${S.meta.title}｜${S.meta.group}`;

  // ---------- nav
  const SECTIONS = [['motivation', '研究動機'], ['system', '系統架構'], ['experiments', '實驗與分析'], ['results', '成果與限制'], ['team', '團隊'], ['references', '參考文獻']];
  const links = SECTIONS.map(([id, t]) => `<li><a class="nav-a" href="#${id}" data-sec="${id}">${t}</a></li>`).join('');
  $('#navlinks').innerHTML = links; $('#navlinksM').innerHTML = links;
  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  menuBtn.addEventListener('click', () => { const open = menu.classList.toggle('hidden') === false; menuBtn.setAttribute('aria-expanded', open); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.add('hidden'); menuBtn.setAttribute('aria-expanded', false); } });
  const nav = $('#nav'); const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24); addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) document.querySelectorAll('.nav-a').forEach(a => a.classList.toggle('active', a.dataset.sec === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  SECTIONS.forEach(([id]) => spy.observe(document.getElementById(id)));

  // ---------- hero
  $('#heroFacts').innerHTML = S.hero.facts.map(f => `<div class="fact"><dt>${f.v}</dt><dd>${f.k}</dd></div>`).join('');

  // ---------- motivation
  $('#impact').innerHTML = S.motivation.impact.map(p => `<p>${txt(p)}</p>`).join('');
  $('#motFig').outerHTML = `<div class="lg:col-span-2 reveal">${fig(S.motivation.figure)}</div>`;
  $('#motStats').innerHTML = S.motivation.stats.map(s => `<div class="card reveal"><div class="stat-v">${s.v}</div><p class="mt-2 text-sm text-sub">${cite(s.k)}</p></div>`).join('');
  $('#why').innerHTML = S.motivation.why.map((w, i, a) => `<div class="card reveal ${i === a.length - 1 ? 'me' : ''}"><p class="font-mono text-xs text-sub">0${i + 1}</p><h4 class="mt-2 text-lg font-bold">${w.t}</h4><p class="mt-2 text-sm leading-relaxed text-sub">${txt(w.d)}</p></div>`).join('');
  $('#sdgs').innerHTML = S.motivation.sdgs.map(g => `<div class="card"><span class="sdg-n">${g.n}</span><h4 class="mt-1 font-bold">${g.t}</h4><p class="mt-1 text-sm text-sub">${g.d}</p></div>`).join('');

  // ---------- system
  const flow = (items, cls) => items.map((t, i) => `${i ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<div class="node ${cls}">${t}</div>`).join('');
  $('#powerFlow').innerHTML = flow(S.system.power, 'hv');
  $('#signalFlow').innerHTML = flow(S.system.signal, 'sig');
  const ICON = {
    motor: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v5.5M12 14.5V20M4 12h5.5M14.5 12H20"/>',
    power: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    coil: '<path d="M3 12h2c0-3 3-3 3 0s3 3 3 0 3-3 3 0 3 3 3 0h2"/><path d="M3 18h18"/>',
    plates: '<path d="M6 4v16M10 4v16M14 4v16M18 4v16"/>',
    rain: '<path d="M12 3s-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z"/><path d="M4 21 20 5"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  };
  $('#parts').innerHTML = S.system.parts.map(p => `<article class="card reveal flex flex-col">
      <div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-lg border border-edge bg-alt text-voltl"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[p.icon] || ''}</svg></span>
      <div><h4 class="font-bold leading-tight">${p.t}</h4><p class="text-xs text-sub">${p.en}</p></div></div>
      <p class="mt-4 flex-1 text-sm leading-relaxed text-sub">${txt(p.d)}</p>
      <div class="mt-4">${p.img ? `<figure><img src="${p.img}" alt="${p.t}" loading="lazy" class="aspect-[4/3] object-cover"></figure>` : ph('【待補】' + p.t + ' 照片')}</div></article>`).join('');
  table($('#safetyTbl'), ['驗收項目', '預期結果', '結果'], S.system.safety.rows, ['', '', 'pass']);
  $('#safetyFigs').innerHTML = S.system.safety.figures.map(fig).join('');

  // ---------- experiments (tabs)
  const T = S.experiments.tabs;
  $('#tabBar').innerHTML = T.map((t, i) => `<button class="tab" role="tab" id="tab-${t.key}" aria-controls="panel-${t.key}" aria-selected="${i === 0}">${t.t}<small>${t.en}</small></button>`).join('');
  $('#tabPanels').innerHTML = T.map((t, i) => `<div class="tab-panel" role="tabpanel" id="panel-${t.key}" aria-labelledby="tab-${t.key}" ${i ? 'hidden' : ''}>
      <p class="max-w-3xl leading-relaxed text-sub">${txt(t.text)}</p>
      <div class="mt-8 grid gap-6 ${t.figures.length > 1 ? 'md:grid-cols-2' : ''}">${t.figures.map(fig).join('')}</div>
      ${t.table ? `<div class="table-wrap mt-8"><table class="tbl" id="tbl-${t.key}"></table></div>` : ''}
      ${t.after ? `<p class="mt-4 max-w-3xl text-sm leading-relaxed text-sub">${txt(t.after)}</p>` : ''}</div>`).join('');
  T.forEach(t => t.table && table($(`#tbl-${t.key}`), t.table.head, t.table.rows, ['num', 'num', 'num', 'num']));
  const tabs = [...document.querySelectorAll('.tab')];
  const select = btn => { tabs.forEach(b => { const on = b === btn; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; document.getElementById(b.getAttribute('aria-controls')).hidden = !on; }); };
  tabs.forEach((b, i) => { b.addEventListener('click', () => select(b)); b.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); } }); });
  select(tabs[0]);

  // ---------- results
  $('#resItems').innerHTML = S.results.items.map(r => `<article class="card reveal flex flex-col">
      <div class="flex items-start justify-between gap-3"><h4 class="font-bold">${r.t}</h4>${r.tag ? `<span class="chip">${r.tag}</span>` : ''}</div>
      <div class="stat-v mt-3">${r.v}</div>
      <p class="mt-3 text-sm leading-relaxed text-sub">${txt(r.d)}</p></article>`).join('');
  table($('#msTbl'), S.results.msTable.head, S.results.msTable.rows, ['', '', 'num', 'num']);
  $('#msFigs').innerHTML = S.results.msFigures.map(fig).join('');
  $('#limits').innerHTML = S.results.limits.map(l => `<li>${txt(l)}</li>`).join('');
  $('#future').innerHTML = S.results.future.map(l => `<li>${txt(l)}</li>`).join('');

  // ---------- team
  const avatar = (src, name) => src ? `<img class="avatar" src="${src}" alt="${name}">` : `<div class="avatar ph">照片<br>待補</div>`;
  const A = S.team.advisor;
  $('#advisor').innerHTML = `<div class="card me flex flex-col gap-5 sm:flex-row sm:items-center">${avatar(A.photo, A.name)}
      <div><p class="font-mono text-xs uppercase tracking-[0.16em] text-voltl">Advisor</p><h3 class="mt-1 text-2xl font-black">${A.name}<span class="ml-2 text-base font-medium text-sub">${A.title}</span></h3><p class="mt-1 text-sm text-sub">${txt(A.unit)}</p>${A.note ? `<p class="mt-2 text-sm text-sub">${txt(A.note)}</p>` : ''}</div></div>`;
  $('#members').innerHTML = S.team.members.map(m => `<article class="card reveal"><div class="flex items-center gap-4">${avatar(m.photo, m.name)}<div><h4 class="text-xl font-bold">${m.name}</h4><p class="text-xs text-sub">${m.role}</p></div></div><p class="mt-4 text-sm leading-relaxed text-sub">${txt(m.work)}</p></article>`).join('');

  // ---------- references
  const linkify = s => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/doi: (10\.[^\s<,]+?)(\.?)(?=\s|$|<)/g, 'doi: <a href="https://doi.org/$1" target="_blank" rel="noopener">$1</a>$2');
  $('#refs').innerHTML = S.references.map((r, i) => `<li id="ref-${i + 1}">${linkify(r)}</li>`).join('');
  document.addEventListener('click', e => { const a = e.target.closest('.cite'); if (!a) return; const li = document.getElementById('ref-' + a.dataset.ref); if (li) { li.classList.add('flash'); setTimeout(() => li.classList.remove('flash'), 1600); } });

  // ---------- reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; io.observe(el); });

  // ---------- lightbox
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('p', lb);
  document.addEventListener('click', e => { const img = e.target.closest('figure img'); if (!img) return; lbImg.src = img.src; lbCap.innerHTML = img.closest('figure').querySelector('figcaption')?.innerHTML || ''; lb.hidden = false; });
  const close = () => { lb.hidden = true; lbImg.src = ''; };
  lb.addEventListener('click', e => { if (e.target !== lbImg) close(); }); addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });

  // ---------- hero: field lines between two plates with drifting particles
  const cv = $('#field'), ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, P = [];
  const size = () => { const r = devicePixelRatio || 1; W = cv.clientWidth; H = cv.clientHeight; cv.width = W * r; cv.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    P = Array.from({ length: Math.round(W * H / 14000) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.2 + Math.random() * 0.6, s: 0.6 + Math.random() * 1.6 })); };
  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    const x0 = W * 0.52, x1 = W * 0.96, top = H * 0.16, bot = H * 0.86;
    for (let i = 0; i < 4; i++) { const x = x0 + (x1 - x0) * i / 3; ctx.fillStyle = 'rgba(201,209,219,0.10)'; ctx.fillRect(x - 2, top, 4, bot - top); }
    ctx.lineWidth = 1;
    for (let j = 0; j < 14; j++) { const y = top + (bot - top) * (j + 0.5) / 14; ctx.strokeStyle = 'rgba(59,130,246,0.10)'; ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 0.02; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const p of P) {
      if (!still) { p.x += p.v; const inGap = p.x > x0 && p.x < x1 && p.y > top && p.y < bot; if (inGap) p.y += Math.sin((p.x + p.y) * 0.02) * 0.15 + 0.25; if (p.x > W + 5 || p.y > H) { p.x = -5; p.y = Math.random() * H; } }
      const inGap = p.x > x0 && p.x < x1 && p.y > top && p.y < bot;
      ctx.fillStyle = inGap ? 'rgba(245,158,11,0.55)' : 'rgba(201,209,219,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill();
    }
    if (!still) requestAnimationFrame(draw);
  };
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
})();
