// Generative fields for the site designs. Every <canvas class="field"> is drawn on a coarse grid
// and ordered-dithered (Bayer 4x4) into the palette of the field named by <html data-field>.
// data-p picks the variant: each project gets its own p, so each one gets its own image.
// Canvases only animate while on screen; with reduced motion each is drawn once.
(() => {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = Math.sin, C = Math.cos, PI = Math.PI;
  const fr = x => x - Math.floor(x);
  const hash = (p, k) => fr(S(p * 127.1 + k * 311.7) * 43758.5453);

  function dot(D, GW, GH, x, y, r, val) {
    for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++) for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) {
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
      if (Math.hypot(i - x, j - y) <= r) { const k = j * GW + i; D[k] = Math.max(D[k], val); }
    }
  }

  // p runs 0..9: 0 home, 1-6 the projects, 7 open source, 8 research, 9 contact.
  const MODES = [[3, 5], [2, 7], [4, 6], [1, 8], [5, 7], [3, 8], [2, 5], [6, 9], [1, 4], [4, 9]];
  const DIV = [137.508, 137.3, 137.6, 138.2, 136.9, 137.45, 139, 137, 137.55, 135.5];
  const RATIOS = [[3, 2], [5, 4], [3, 4], [5, 6], [2, 3], [4, 5], [7, 6], [1, 2], [5, 3], [7, 4]];
  const poles = p => {
    const n = 2 + p % 3;
    return Array.from({ length: n }, (_, k) => [.15 + .7 * hash(p + 1, k), .15 + .7 * hash(p + 1, k + 9), k % 2 ? -1 : 1]);
  };

  // value(u, v, t, p, i, j, ar, st) returns 0..1 per cell; paint(D, GW, GH, t, p, st) accumulates into D.
  // cap(p) is the caption under the image: the one number that makes this variant.
  const FIELDS = {
    moire: { pal: ['#f4f4f1', '#b9c2d6', '#3c4f86', '#121a33'],
      cap: p => `two gratings, Δθ = ${(.05 + .025 * p).toFixed(3)} rad`,
      value: (u, v, t, p, i, j) => { const b = .05 + .025 * p + .012 * S(t * .3); const ph = 1.3 * (i * (C(b) - 1) + j * S(b)) + t * .6; return (.5 + .5 * C(ph)) * (.72 + .28 * S(i * 1.3)); } },
    cyanotype: { pal: ['#173a6b', '#2d5288', '#6f8db5', '#c3d0e2', '#f4f2ea'],
      cap: p => `${4 + (p % 5) * 2} stems, exposed to light`,
      paint: (D, GW, GH, t, p) => {
        D.fill(0); const n = Math.round((4 + (p % 5) * 2) * Math.max(1, GW / GH / 1.4));
        for (let s = 0; s < n; s++) {
          const x0 = GW * (.08 + .84 * (n > 1 ? s / (n - 1) : .5)), top = GH * (.12 + .3 * Math.abs(S(s * 2.7 + p)));
          for (let y = GH - 1; y > top; y -= .5) {
            const k = 1 - y / GH, x = x0 + S(y * .07 + s * 2 + t * .5) * GH * .07 * k;
            dot(D, GW, GH, x, y, .7, 1);
            if (((y | 0) + s * 3) % 7 === 0 && y % 1 === 0) { const side = ((y | 0) / 7) % 2 ? 1 : -1; for (let q = 1; q < 5; q++) dot(D, GW, GH, x + side * q * .9, y - q * .5, 1.4 - q * .2, .85); }
          }
        }
      } },
    stars: { pal: ['#070b16', '#18213a', '#3f4f78', '#9aa8c9', '#eef2fb'], decay: .992,
      cap: p => `pole at ${Math.round(100 * (.15 + .7 * hash(p, 1)))}%, ${Math.round(100 * (.05 + .3 * hash(p, 2)))}%`,
      paint: (D, GW, GH, t, p, st) => {
        const R = Math.hypot(GW, GH);
        if (!st.cache) st.cache = Array.from({ length: Math.round(GW * GH / 34) + 100 }, () => ({ r: Math.random() * R, a: Math.random() * PI * 2, b: .25 + Math.random() * .75 }));
        const px = GW * (.15 + .7 * hash(p, 1)), py = GH * (.05 + .3 * hash(p, 2));
        for (const s of st.cache) { const a = s.a + t * .5; const x = px + C(a) * s.r, y = py + S(a) * s.r * .92; if (x >= 0 && x < GW && y >= 0 && y < GH) { const k = (y | 0) * GW + (x | 0); D[k] = Math.min(1, D[k] + s.b * .35); } }
      } },
    chladni: { pal: ['#0f0f10', '#3a3631', '#8c8273', '#d8cfbf', '#f6f1e7'],
      cap: p => { const [n, m] = MODES[p % 10]; return `mode (${n}, ${m})`; },
      value: (u, v, t, p, i, j, ar) => {
        const [n, m] = MODES[p % 10], [n2, m2] = MODES[(p + 1) % 10], w = .5 + .5 * S(t * .25);
        u = .5 + (u - .5) * Math.max(1, ar); // keep the plate square on wide canvases
        const f1 = C(n * PI * u) * C(m * PI * v) - C(m * PI * u) * C(n * PI * v), f2 = C(n2 * PI * u) * C(m2 * PI * v) - C(m2 * PI * u) * C(n2 * PI * v);
        const f = f1 * (1 - w * .35) + f2 * w * .35; return Math.exp(-Math.abs(f) * 9) * .97; } },
    phyllo: { pal: ['#f2eee2', '#d8d2a8', '#a7a85e', '#5d6b2e', '#28311a'],
      cap: p => `${DIV[p % 10]}° between seeds`,
      paint: (D, GW, GH, t, p) => {
        // A close-up of the seed head: the spiral fills the canvas and runs off its edges.
        D.fill(0); const cx = GW * (GW > GH * 1.3 ? .25 + .5 * hash(p, 3) : .5), cy = GH * .5;
        const c = 3.4, R = Math.hypot(Math.max(cx, GW - cx), GH * .5), N = Math.min(6000, Math.round((R / c) ** 2));
        const div = DIV[p % 10] * PI / 180;
        for (let k = 1; k < N; k++) { const r = c * Math.sqrt(k), a = k * div + t * .08; dot(D, GW, GH, cx + C(a) * r, cy + S(a) * r, .9 + 1.5 * k / N, .35 + .65 * k / N); }
      } },
    lissajous: { pal: ['#0f0b07', '#3a2410', '#8a5418', '#e09a3a', '#ffe2b0'], decay: .93,
      cap: p => RATIOS[p % 10].join(':'),
      paint: (D, GW, GH, t, p) => {
        const R = RATIOS[p % 10], n = 600 + GW * 4;
        for (let s = 0; s < n; s++) { const q = s / n * PI * 2; const x = GW * .5 + C(R[0] * q + t * .6) * GW * .4, y = GH * .5 + S(R[1] * q) * GH * .38; const k = (y | 0) * GW + (x | 0); if (k >= 0 && k < D.length) D[k] = Math.min(1, D[k] + .09); }
      } },
    voronoi: { pal: ['#1a1220', '#3d2340', '#7a4466', '#c88a9a', '#f4e2e2'],
      cap: p => `${9 + p * 4} panes`,
      value: (u, v, t, p, i, j, ar, st) => {
        const n = Math.min(60, Math.round((9 + p * 4) * Math.max(1, ar / 1.4)));
        if (!st.seeds || st.seeds.length !== n) st.seeds = Array.from({ length: n }, (_, k) => [Math.random(), Math.random(), .3 + .65 * ((k * 37) % 10) / 10]);
        let d1 = 9, d2 = 9, tone = 0;
        for (let k = 0; k < n; k++) { const s = st.seeds[k]; const sx = s[0] + .06 * S(t * .3 + k) / ar, sy = s[1] + .06 * C(t * .25 + k * 2); const d = Math.hypot((u - sx) * ar, v - sy); if (d < d1) { d2 = d1; d1 = d; tone = s[2]; } else if (d < d2) d2 = d; }
        return d2 - d1 < .025 ? 0 : tone * (1 - d1 * 1.1) + .08; } },
    fog: { pal: ['#f1e6dc', '#d9c3c4', '#a88fa6', '#6b5b7b', '#2c2640'],
      cap: p => `ridge ${p % 5 + 1} of 5, brought forward`,
      value: (u, v, t, p, i, j, ar) => { let val = .02 + v * .08; u *= Math.max(1, ar / 1.4);
        for (let k = 0; k < 5; k++) { const top = .32 + k * .12 + .06 * S(u * (3 + k) + k * 2 + t * .05 * (k + 1)) + .025 * S(u * (11 + k * 3) + k); if (v > top) val = .14 + k * .19 + (k === p % 5 ? .1 : 0) - .14 * Math.exp(-(v - top) * 18); }
        return val; } },
    filings: { pal: ['#efebe3', '#c9c3b8', '#8d867b', '#4a4640', '#1b1a18'],
      cap: p => `${2 + p % 3} poles`,
      value: (u, v, t, p, i, j, ar, st) => {
        st.poles ||= poles(p);
        let psi = 0; for (const [x, y, q] of st.poles) psi += q * Math.atan2(v - y - .02 * S(t * .3 + x * 9), (u - x) * ar);
        return Math.pow(.5 + .5 * C(psi * 9), 7) * .95 + .04 * S(i * 2.3 + j * 1.7); } },
    // Riso is drawn directly as two layers of overlapping halftone dots, not dithered.
    riso: { pal: ['#f3eee4', '#f6b3c6', '#f2648f', '#3a5bb0', '#1f2a55'], raw: true,
      cap: p => `print ${p + 1}, pink over blue`,
      draw: (x, W, H, t, p) => {
        x.globalCompositeOperation = 'source-over'; x.fillStyle = '#f3eee4'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'multiply';
        const cols = Math.max(28, Math.round(W / 22)), cs = W / cols, rows = Math.ceil(H / cs), ar = W / H;
        const sun = [.15 + .7 * hash(p, 4), .18 + .2 * hash(p, 5)];
        for (let layer = 0; layer < 2; layer++) {
          x.fillStyle = layer ? '#3a5bb0' : '#f2648f'; const off = layer ? cs * .5 : 0;
          for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
            const u = (i * cs + off) / W, v = (j * cs + off) / H, hill = .62 + .07 * S(u * 6 * Math.max(1, ar / 1.4) + p * 2 + t * .15) + .03 * S(u * 17 + p);
            const a = layer === 0 ? Math.max(Math.hypot((u - sun[0]) * ar, v - sun[1]) < .16 ? .95 : 0, (1 - v) * .28)
              : v > hill ? .55 + (v - hill) * 1.2 : v > hill - .12 ? .12 : .06;
            const r = cs * .55 * Math.sqrt(Math.min(1, a)); if (r > .4) { x.beginPath(); x.arc(i * cs + off, j * cs + off, r, 0, PI * 2); x.fill(); }
          }
        }
      } },
  };

  const key = document.documentElement.dataset.field, o = FIELDS[key];
  if (!o) return;
  window.FIELD = { key, pal: o.pal, cap: o.cap };
  const CELL = 6, PX = 7; // backing pixels per cell; CSS px per cell

  const live = [];
  function mount(cv) {
    const st = { cv, x: cv.getContext('2d'), t: Math.random() * 20, visible: false };
    st.setP = (p) => {
      st.p = p; st.cache = st.seeds = st.poles = null;
      if (st.D) { st.D.fill(0); warm(st); }
      const cap = cv.parentElement.querySelector('.field-cap');
      if (cap && o.cap) cap.textContent = o.cap(p);
    };
    st.layout = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (o.raw) { const k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * k); cv.height = Math.round(h * k); }
      else {
        st.GW = Math.max(24, Math.min(200, Math.round(w / PX))); st.GH = Math.max(4, Math.round(st.GW * h / w));
        cv.width = st.GW * CELL; cv.height = st.GH * CELL; st.ar = st.GW / st.GH;
        st.D = new Float32Array(st.GW * st.GH); st.cache = st.seeds = null; warm(st);
      }
      render(st);
    };
    st.setP(+cv.dataset.p || 0);
    cv._field = st;
    new IntersectionObserver(es => es.forEach(e => { st.visible = e.isIntersecting; }), { rootMargin: '80px' }).observe(cv);
    let rt, first = true; new ResizeObserver(() => { clearTimeout(rt); if (first) { first = false; st.layout(); } else rt = setTimeout(st.layout, 100); }).observe(cv);
    live.push(st);
  }
  function warm(st) { for (let k = 0; k < (o.decay ? 80 : 1); k++) tick(st); }
  function tick(st) {
    st.t += .02;
    if (o.paint && st.D) { if (o.decay) for (let i = 0; i < st.D.length; i++) st.D[i] *= o.decay; o.paint(st.D, st.GW, st.GH, st.t, st.p, st); }
  }
  function render(st) {
    const { x, cv } = st;
    if (o.raw) { o.draw(x, cv.width, cv.height, st.t, st.p); return; }
    if (!st.D) return;
    const { GW, GH, D, ar } = st, pal = o.pal, L = pal.length - 1;
    x.fillStyle = pal[0]; x.fillRect(0, 0, cv.width, cv.height);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      let val = o.paint ? D[j * GW + i] : o.value(i / GW, j / GH, st.t, st.p, i, j, ar, st);
      val = Math.max(0, Math.min(1, val || 0));
      const lv = Math.min(L, Math.floor(val * L + BAYER[(j & 3) * 4 + (i & 3)]));
      if (lv > 0) { x.fillStyle = pal[lv]; x.fillRect(i * CELL, j * CELL, CELL - 1, CELL - 1); }
    }
  }
  document.querySelectorAll('canvas.field').forEach(mount);
  window.FIELD.canvases = live;

  if (reduce) return;
  let last = 0;
  (function loop(now) {
    if (now - last > 40 && !document.hidden) { last = now; for (const st of live) if (st.visible && (o.raw || st.D)) { tick(st); render(st); } }
    requestAnimationFrame(loop);
  })(0);
})();
