// Behaviour shared by every design: the stage field that follows the project in view, the GRCH
// demo, the once terminal replay, the slime study tabs, and the contribution grid.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stage: on layouts with a pinned field, it switches to the variant of whichever project is in view.
  const stage = document.querySelector('.stage canvas.field');
  const marks = document.querySelectorAll('[data-stage-p]');
  if (stage && marks.length) {
    const home = +stage.dataset.p || 0;
    let cur = home;
    const set = (p) => { if (p !== cur && stage._field) { cur = p; stage._field.setP(p); } };
    const seen = new Map();
    const io = new IntersectionObserver((es) => {
      es.forEach(e => seen.set(e.target, e.isIntersecting));
      const hit = [...marks].find(m => seen.get(m));
      set(hit ? +hit.dataset.stageP : home);
    }, { rootMargin: '-40% 0px -40% 0px' });
    marks.forEach(m => io.observe(m));
  }

  // GRCH demo: nothing heavy loads until the button is clicked.
  (() => {
    const box = document.getElementById('grch-demo');
    const btn = box && box.querySelector('.grch-run');
    if (!btn || !window.WebAssembly || !window.Worker) return;
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'loading';
      try {
        const { mount } = await import('/assets/grch/demo.js');
        box.classList.add('live');
        const cap = document.querySelector('.grch-cap');
        if (cap) cap.textContent = 'rust to wasm, drag to rotate';
        mount(box);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'failed, retry';
      }
    });
  })();

  // once: replays a real recorded terminal session (typed commands plus real output, real timing).
  (() => {
    const box = document.getElementById('once-term');
    const code = box && box.querySelector('code');
    if (!code || still) return;
    const CAST = [[0.3,"$ "],[0.73,"p"],[0.76,"y"],[0.79,"t"],[0.82,"h"],[0.85,"o"],[0.88,"n"],[0.91," "],[0.94,"a"],[0.97,"g"],[1.0,"e"],[1.03,"n"],[1.06,"t"],[1.09,"."],[1.12,"p"],[1.16,"y"],[1.19," "],[1.22,"-"],[1.25,"-"],[1.28,"c"],[1.31,"r"],[1.34,"a"],[1.37,"s"],[1.4,"h"],[1.43,"-"],[1.46,"a"],[1.49,"f"],[1.52,"t"],[1.55,"e"],[1.58,"r"],[1.61," "],[1.64,"c"],[1.67,"h"],[1.7,"a"],[1.73,"r"],[1.76,"g"],[1.79,"e"],[1.82,"_"],[1.85,"c"],[1.88,"a"],[1.91,"r"],[1.95,"d"],[2.2,"\n"],[2.76,"-> charge_card(order='A12', cents=1000)\n  ** charging card for A12: $10.00\n  <- 'ch_1'\n"],[3.17,"!! worker killed (simulated timeout)\n"],[4.07,"$ "],[4.5,"p"],[4.53,"y"],[4.56,"t"],[4.59,"h"],[4.62,"o"],[4.66,"n"],[4.68," "],[4.71,"a"],[4.75,"g"],[4.78,"e"],[4.8,"n"],[4.83,"t"],[4.87,"."],[4.9,"p"],[4.93,"y"],[5.18,"\n"],[5.74,"-> charge_card(order='A12', cents=1000)\n  once: saved result, not run again\n  <- 'ch_1'\n"],[6.24,"-> send_receipt(order='A12', charge='ch_1')\n"],[6.25,"  ** emailing receipt for A12 (ch_1)\n  <- 'msg_1'\nagent: plan done\n"],[9.37,""]];
    const END = 9.37;
    const kind = (l) => l.startsWith('$ ') ? 'p' : l.startsWith('  ** ') ? 'fx'
      : l.startsWith('  once:') ? 'hit' : l.startsWith('!!') ? 'kill' : l.startsWith('  <- ') ? 'ret' : '';
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let shown = -1, base = 0, at = 0, raf = 0, visible = false;
    const draw = (n) => {
      if (n === shown) return;
      shown = n;
      let text = '';
      for (let i = 0; i < n; i++) text += CAST[i][1];
      const lines = text.split('\n');
      code.innerHTML = lines.map((l, i) => {
        const k = kind(l), body = esc(l) + (i === lines.length - 1 ? '<span class="cur"></span>' : '');
        return k ? '<span class="' + k + '">' + body + '</span>' : body;
      }).join('\n');
    };
    const tick = () => {
      const t = ((performance.now() - base) / 1000) % END;
      let n = 0;
      while (n < CAST.length && CAST[n][0] <= t) n++;
      draw(n);
      raf = requestAnimationFrame(tick);
    };
    const play = () => { if (raf || !visible || document.hidden) return; base = performance.now() - at; raf = requestAnimationFrame(tick); };
    const stop = () => { if (!raf) return; cancelAnimationFrame(raf); raf = 0; at = performance.now() - base; };
    box.style.minHeight = box.offsetHeight + 'px';
    draw(0);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : stop(); }).observe(box);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  })();

  // once: copy the install line.
  (() => {
    const btn = document.querySelector('.once-copy');
    if (!btn || !navigator.clipboard) return;
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); btn.textContent = 'copied'; }
      catch (e) { btn.textContent = 'copy failed'; }
      setTimeout(() => (btn.textContent = 'copy'), 1500);
    });
  })();

  // Slime studies: tabs swap which showcase page the iframe shows. Without JS the Pokémon study
  // still loads, since it is the iframe's own src.
  (() => {
    const tabs = document.querySelector('.slime-tabs');
    const frame = document.querySelector('#slime-demo iframe');
    if (!tabs || !frame) return;
    const STUDIES = {
      battle: {
        page: 'battle.html',
        title: 'Slime Battler: a slime mould making the decisions in a Pokémon battle',
        cap: 'recorded battle, slime regrown live',
        desc: 'Every decision in a Pokémon battle. Ten food sites ring the slime, one per move or switch, and the option it gathers on is played. One slime is fed by a PPO network; the other was evolved with CMA-ES to play on its own senses, and beats the network (71% against the strongest-move bot).',
      },
      pong: {
        page: 'index.html',
        title: 'Slime Pong: a trained policy steering a slime mould paddle with food',
        cap: 'trained policy, playing live',
        desc: 'Pong, where the paddle is a slime. A PPO agent can only choose where to put food, and the slime takes hundreds of steps to follow, so it has to learn to aim where the ball will be. It returns 76% of balls, six times as many as chasing the ball.',
      },
      bayarea: {
        page: 'bayarea.html',
        title: 'Slime Transit: a slime mould growing a rail network across the Bay Area',
        cap: 'seed 1, growing live, 2020 census and osm rail',
        desc: 'A rail network for the Bay Area. Food goes where 7.4 million residents live, water is a wall except at real bridges, and the slime grows between them. At about the length of today\'s rail (709 vs 762 km), it reaches all 30 population centres and joins every pair.',
      },
    };
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panel = document.getElementById('slime-demo');
    let fit = 0;
    const refit = () => { fit = 0; frame.style.height = ''; };
    const select = (btn) => {
      const s = STUDIES[btn.dataset.study];
      if (btn.getAttribute('aria-selected') === 'true') return;
      for (const b of buttons) { b.setAttribute('aria-selected', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; }
      panel.setAttribute('aria-labelledby', btn.id);
      frame.title = s.title;
      refit();
      frame.src = '/slime/' + s.page + '?embed';
      const url = '/slime/' + (s.page === 'index.html' ? '' : s.page);
      document.getElementById('slime-full').href = url;
      document.getElementById('slime-cap').textContent = s.cap;
      document.getElementById('slime-desc').textContent = s.desc;
      document.getElementById('slime-tm').hidden = btn.dataset.study !== 'battle';
    };
    tabs.hidden = false;
    tabs.addEventListener('click', (e) => { const btn = e.target.closest('[role="tab"]'); if (btn) select(btn); });
    tabs.addEventListener('keydown', (e) => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      const next = buttons[(j + buttons.length) % buttons.length];
      next.focus();
      select(next);
    });
    // The embedded page reports its height; only grow while a study is showing.
    addEventListener('message', (e) => {
      const h = e.data && e.data.slimeEmbedHeight;
      if (e.source !== frame.contentWindow || typeof h !== 'number' || h <= fit) return;
      fit = h;
      frame.style.height = h + 'px';
    });
    let w = innerWidth;
    addEventListener('resize', () => { if (innerWidth !== w) { w = innerWidth; refit(); } });
  })();

  // Contribution grid: the last 26 weeks of /assets/contrib.json (refreshed by contrib.yml),
  // one square per day, coloured from the design's own palette.
  (() => {
    const box = document.querySelector('.contrib');
    if (!box) return;
    const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const fmt = s => { const [y, m, d] = s.split('-'); return `${MON[+m - 1]} ${+d} ${y}`; };
    fetch('/assets/contrib.json').then(r => r.json()).then(data => {
      const days = data.days.slice(-26 * 7 - new Date(data.days[data.days.length - 1][0] + 'T00:00:00Z').getUTCDay() - 1);
      const pad = new Date(days[0][0] + 'T00:00:00Z').getUTCDay(), weeks = Math.ceil((days.length + pad) / 7);
      const pal = (window.FIELD && window.FIELD.pal) || ['#eee', '#ccc', '#999', '#666', '#333'];
      const top = pal.length - 1, total = days.reduce((a, d) => a + d[1], 0);
      const cell = 10, gap = 2, W = weeks * (cell + gap) - gap, H = 7 * (cell + gap) - gap;
      let rects = '';
      days.forEach((d, k) => {
        const i = k + pad, x = (i / 7 | 0) * (cell + gap), y = (i % 7) * (cell + gap);
        const lv = d[2], fill = lv ? pal[Math.max(1, Math.round(lv / 4 * top))] : pal[1];
        rects += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}"${lv ? '' : ' opacity=".35"'}><title>${d[1] || 'no'} contribution${d[1] === 1 ? '' : 's'} on ${fmt(d[0])}</title></rect>`;
      });
      box.querySelector('.contrib-grid').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} GitHub contributions in the last six months">${rects}</svg>`;
      box.querySelectorAll('.contrib-total').forEach(n => (n.textContent = total));
      const range = box.querySelector('.contrib-range');
      if (range) range.textContent = `${fmt(days[0][0])} to ${fmt(days[days.length - 1][0])}`;
    }).catch(() => {});
  })();
})();
