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

  // Smooth value noise and its fractal sum, both 0..1.
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y); let u = x - xi, v = y - yi;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct = 4) {
    let s = 0, a = .5, n = 0;
    for (let o = 0; o < oct; o++) { s += a * vnoise(x, y); n += a; x = x * 2.03 + 31.7; y = y * 2.03 + 17.3; a *= .5; }
    return s / n;
  }

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
  const EBRU = ['battal', 'gel-git', 'taraklı', 'şal', 'bülbül yuvası'];
  // Weaving drafts: whether the warp thread is on top at end i, pick j, and the warp and weft colour orders.
  const pt = (i, n) => Math.abs((i % (2 * n)) - n);
  const DRAFTS = [
    ['goose-eye twill', (i, j) => (pt(i, 8) + pt(j, 8)) % 4 < 2, () => 4, () => 1],
    ['2/2 twill', (i, j) => (i + j) % 4 < 2, () => 4, () => 2],
    ['herringbone', (i, j) => (((i >> 3) % 2 ? i : 400 - i) + j) % 4 < 2, () => 5, () => 1],
    ['point twill', (i, j) => (pt(i, 6) + j) % 4 < 2, () => 3, () => 1],
    ['houndstooth', (i, j) => (i + j) % 4 < 2, i => (i >> 2) % 2 ? 5 : 1, j => (j >> 2) % 2 ? 5 : 1],
    ['five-end satin', (i, j) => (i * 2 + j) % 5 !== 0, () => 4, () => 2],
    ['basket weave', (i, j) => ((i >> 1) + (j >> 1)) % 2 === 0, () => 3, () => 1],
    ["bird's eye", (i, j) => (pt(i, 2) + pt(j, 2)) % 4 < 2 || (i + j) % 4 === 0, () => 5, () => 2],
    ['log cabin', (i, j) => (i + j) % 2 === 0, i => (i >> 3) % 2 ? (i % 2 ? 5 : 1) : (i % 2 ? 1 : 5), j => (j >> 3) % 2 ? (j % 2 ? 1 : 5) : (j % 2 ? 5 : 1)],
    ['broken twill', (i, j) => ((i >> 2) % 2 ? i + j : i - j + 400) % 4 < 2, () => 4, () => 3],
  ];
  const SLIME = [ // food sources, sensor angle, rotation angle, sensor offset (cells)
    { food: 7, sa: 45, ra: 45, so: 5 }, { food: 4, sa: 30, ra: 30, so: 6 }, { food: 2, sa: 45, ra: 22.5, so: 4 },
    { food: 6, sa: 60, ra: 45, so: 5 }, { food: 10, sa: 45, ra: 45, so: 6 }, { food: 5, sa: 22.5, ra: 45, so: 7 },
    { food: 8, sa: 35, ra: 35, so: 5 }, { food: 3, sa: 45, ra: 30, so: 6 }, { food: 0, sa: 45, ra: 45, so: 5 }, { food: 1, sa: 30, ra: 45, so: 4 },
  ];
  // L-systems for the herbarium: each project is a different plant.
  const PLANTS = [
    { name: 'fern', axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, n: 5, a: 23 },
    { name: 'yarrow', axiom: 'F', rules: { F: 'F[+F]F[-F]F' }, n: 4, a: 25.7 },
    { name: 'bramble', axiom: 'F', rules: { F: 'FF-[-F+F+F]+[+F-F-F]' }, n: 4, a: 22.5 },
    { name: 'sedge', axiom: 'X', rules: { X: 'F[+X][-X]FX', F: 'FF' }, n: 6, a: 25.7 },
    { name: 'meadow grass', axiom: 'X', rules: { X: 'F[+X]F[-X]+X', F: 'FF' }, n: 6, a: 20 },
    { name: 'willowherb', axiom: 'X', rules: { X: 'F[-X]F[+X]-X', F: 'FF' }, n: 6, a: 18 },
  ];
  const PAIRS = [[8, 13], [1, 3], [2, 5], [3, 5], [5, 8], [3, 7], [4, 9], [2, 3], [5, 7], [3, 4]];
  const SYM = [7, 5, 8, 9, 11, 12, 7, 5, 13, 10];
  const RAIN = [3, 2, 4, 1.5, 6, 2.5, 5, 1, 3.5, 2];

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

    // Contour lines of a survey sheet, by marching squares. The contours creep slowly uphill, as if
    // the lake were rising; every fifth one is an index contour.
    topo: { pal: ['#f4efe3', '#ddd0b3', '#b59466', '#7a5634', '#3e2a18'], raw: true, every: 60,
      cap: p => `sheet ${p + 1}, contour interval 10 m`,
      draw: (x, W, H, t, p, st) => {
        const k = W / (x.canvas.clientWidth || W), g = 8 * k, nx = Math.ceil(W / g) + 1, ny = Math.ceil(H / g) + 1;
        const sc = 1 / (260 * k), ox = p * 7.3 + t * .004, oy = p * 3.9;
        if (!st.hm || st.hm.length !== nx * ny) { st.hm = new Float32Array(nx * ny); st.tint = document.createElement('canvas'); st.tint.width = nx; st.tint.height = ny; }
        const hm = st.hm;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const X = i * g * sc + ox, Y = j * g * sc + oy;
          hm[j * nx + i] = fbm(X, Y, 5) * 1.5 - .25 + .12 * vnoise(X * .3 + 5, Y * .3);
        }
        const WL = .3; // the lake
        const tc = st.tint.getContext('2d'), img = tc.createImageData(nx, ny);
        for (let q = 0; q < nx * ny; q++) {
          const z = hm[q], f = Math.max(0, Math.min(1, (z - WL) * 1.3));
          const c = z < WL ? [218, 228, 224] : [244 - 20 * f, 239 - 27 * f, 227 - 44 * f];
          img.data.set([c[0], c[1], c[2], 255], q * 4);
        }
        tc.putImageData(img, 0, 0);
        x.imageSmoothingEnabled = true; x.drawImage(st.tint, 0, 0, nx * g, ny * g);
        // the survey grid
        x.strokeStyle = 'rgba(176, 69, 43, .22)'; x.lineWidth = k; x.beginPath();
        for (let gx = 160 * k - (ox / sc) % (160 * k); gx < W; gx += 160 * k) { x.moveTo(gx, 0); x.lineTo(gx, H); }
        for (let gy = 160 * k; gy < H; gy += 160 * k) { x.moveTo(0, gy); x.lineTo(W, gy); }
        x.stroke();
        const s = t * .03, base = Math.floor(s), f = s - base, LV = 26;
        const contour = (z, path) => {
          for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
            const a = hm[j * nx + i] - z, b = hm[j * nx + i + 1] - z, c = hm[(j + 1) * nx + i + 1] - z, d = hm[(j + 1) * nx + i] - z;
            const id = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
            if (id === 0 || id === 15) continue;
            const X = i * g, Y = j * g;
            const T = [X + g * a / (a - b), Y], R = [X + g, Y + g * b / (b - c)], B = [X + g * d / (d - c), Y + g], L = [X, Y + g * a / (a - d)];
            const seg = (P, Q) => { path.moveTo(P[0], P[1]); path.lineTo(Q[0], Q[1]); };
            switch (id) {
              case 1: case 14: seg(L, B); break;
              case 2: case 13: seg(B, R); break;
              case 3: case 12: seg(L, R); break;
              case 4: case 11: seg(T, R); break;
              case 6: case 9: seg(T, B); break;
              case 7: case 8: seg(T, L); break;
              case 5: seg(T, R); seg(L, B); break;
              case 10: seg(T, L); seg(B, R); break;
            }
          }
        };
        const thin = new Path2D(), index = new Path2D(), shore = new Path2D();
        contour(WL, shore);
        for (let l = 0; l <= LV; l++) {
          const z = WL + (l + f) / LV * 1.1;
          contour(z, ((l - base) % 5 + 5) % 5 === 0 ? index : thin);
        }
        x.lineJoin = 'round';
        x.strokeStyle = 'rgba(122, 86, 52, .55)'; x.lineWidth = .7 * k; x.stroke(thin);
        x.strokeStyle = '#6b4a2b'; x.lineWidth = 1.5 * k; x.stroke(index);
        x.strokeStyle = '#5c8590'; x.lineWidth = 1.2 * k; x.stroke(shore);
      } },

    // Turkish marbling (ebru): drops of ink floated as stones, then drawn through with a stylus and combs.
    marble: { pal: ['#f1e9d8', '#c99a4b', '#a2462e', '#33507f', '#1f2b44', '#7b8660'], heat: ['#f1e9d8', '#e3cfae', '#c99a4b', '#a2462e', '#33507f', '#1f2b44'],
      smooth: true, steps: true, px: 3, max: 400, every: 70, interlace: 4,
      cap: p => `${EBRU[p % 5]}${p > 4 ? ', second sheet' : ''}`,
      value: (u, v, t, p, i, j, ar, st) => {
        const m = p % 5;
        let x = u * ar, y = v;
        if (m === 4) { // bülbül yuvası: small spirals set out on a lattice
          const s = .2, cx = (Math.round(x / s - .5) + .5) * s, cy = (Math.round(y / s - .5) + .5) * s, dx = x - cx, dy = y - cy;
          const a = 6 * Math.exp(-(dx * dx + dy * dy) / .0036) * (1 + .1 * S(t * .3)), ca = C(a), sa = S(a);
          x = cx + dx * ca - dy * sa; y = cy + dx * sa + dy * ca;
        }
        if (m === 3) x += .03 * (Math.abs(fr(y * 30) - .5) * 2 - .5);                 // şal: a fine second comb
        if (m >= 2) y += .06 * (Math.abs(fr(x * 9 + .02 * S(t * .2)) - .5) * 2 - .5);  // taraklı: the comb
        if (m >= 1) x += .045 * S(y * 26 + t * .15);                                 // gel-git: the stylus
        x += .012 * S(y * 17 + t * .4) + .004 * S(y * 53); y += .012 * C(x * 15 - t * .3) + .004 * C(x * 49);
        // The stones: one jittered seed per lattice cell, so only the 3x3 cells around a point are searched.
        const sz = .16 - (p % 5) * .012, gx = x / sz + p * 17, gy = y / sz;
        const cx = Math.floor(gx), cy = Math.floor(gy);
        let d1 = 9, d2 = 9, col = 0;
        for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
          const X = cx + a, Y = cy + b, sx = X + .1 + .8 * hash(X, Y + p), sy = Y + .1 + .8 * hash(Y - p, X);
          const d = Math.hypot(gx - sx, gy - sy);
          if (d < d1) { d2 = d1; d1 = d; col = 1 + Math.floor(hash(X + .5, Y + 7.5) * 5); } else if (d < d2) d2 = d;
        }
        return d2 - d1 < .06 ? 0 : col / 5;
      } },

    // A loom: the cloth is woven at the fell line and wound upward; below it hang the bare warp ends.
    weave: { pal: ['#f1ebdf', '#e6dcc4', '#b99f73', '#a8432c', '#2c3c66', '#18203b'], raw: true, every: 80,
      cap: p => DRAFTS[p % 10][0],
      draw: (x, W, H, t, p) => {
        const P = ['#f1ebdf', '#e6dcc4', '#b99f73', '#a8432c', '#2c3c66', '#18203b'];
        const k = W / (x.canvas.clientWidth || W), g = 8 * k, cols = Math.ceil(W / g), rows = Math.ceil(H / g);
        const [, up, warp, weft] = DRAFTS[p % 10], fell = Math.round(rows * .78), roll = Math.floor(t * 6) + 4000;
        x.fillStyle = '#f1ebdf'; x.fillRect(0, 0, W, H);
        x.fillStyle = '#c7b898'; x.fillRect(0, 0, W, fell * g);
        // Each float is a rounded-off bar: warp floats run down, weft floats run across.
        const paths = P.map(() => new Path2D()), hi = new Path2D();
        for (let j = 0; j < fell; j++) {
          const jj = j - fell + roll;
          for (let i = 0; i < cols; i++) {
            const X = i * g, Y = j * g;
            if (up(i, jj)) { paths[warp(i)].rect(X + g * .13, Y - g * .04, g * .74, g * 1.08); hi.rect(X + g * .38, Y + g * .1, g * .14, g * .8); }
            else { paths[weft(jj)].rect(X - g * .04, Y + g * .13, g * 1.08, g * .74); hi.rect(X + g * .1, Y + g * .38, g * .8, g * .14); }
          }
        }
        // the bare warp below the fell, and the reed
        for (let i = 0; i < cols; i++) paths[warp(i)].rect(i * g + g * .3, fell * g, g * .4, H - fell * g);
        P.forEach((c, q) => { x.fillStyle = c; x.fill(paths[q]); });
        x.fillStyle = 'rgba(255, 255, 255, .13)'; x.fill(hi);
        x.fillStyle = '#5a4c34'; x.fillRect(0, fell * g + g * .2, W, g * .5);
      } },

    // Sunlight focused by ripples onto the tiles of a pool floor.
    caustic: { pal: ['#76aeac', '#a7d5d0', '#c8e9e4', '#eaf8f5', '#ffffff'], heat: ['#eaf6f3', '#c8e9e4', '#8cc7c1', '#3f9699', '#0f5a63'],
      smooth: true, px: 5, max: 260, every: 60, interlace: 3,
      cap: p => `${(1.2 + p * .15).toFixed(2)} m deep`,
      value: (u, v, t, p, i, j, ar) => {
        // The bright net is the edges of a Voronoi diagram whose seeds wander, seen through wavy water.
        const T = t * .5, sc = .17 - (p % 5) * .015, x = u * ar + .025 * S(v * 9 + T), y = v + .025 * C(u * ar * 8 - T * .8);
        const net = (s, ph) => {
          const gx = x / s, gy = y / s, cx = Math.floor(gx), cy = Math.floor(gy);
          let d1 = 9, d2 = 9;
          for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
            const X = cx + a, Y = cy + b, h = hash(X + ph, Y), sx = X + .5 + .38 * S(T * (.6 + h) + h * 9), sy = Y + .5 + .38 * C(T * (.5 + h) + h * 13);
            const d = Math.hypot(gx - sx, gy - sy);
            if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
          }
          return Math.exp(-(d2 - d1) * 11);
        };
        const light = Math.min(1, net(sc, 0) * .8 + net(sc * .55, 40) * .45);
        const tx = u * ar * 7 + .06 * S(v * 11 + T), ty = v * 7 + .06 * C(u * ar * 10 - T);
        const grout = Math.max(Math.abs(fr(tx) - .5), Math.abs(fr(ty) - .5)) > .465;
        return (grout ? .14 : .3) + light * .7;
      } },

    // Aurora curtains over a ridge, green at the hem turning violet higher up.
    aurora: { pal: ['#070b14', '#123a3a', '#1f7a5c', '#5fd6a0', '#d8fff0'], smooth: true, rgb: true, px: 4, max: 300, every: 50, interlace: 2,
      cap: p => `Kp ${3 + p % 6}`,
      value: (u, v, t, p, i, j, ar) => {
        const x = u * ar * 3, kp = 3 + p % 6;
        const ridge = .6 + .08 * fbm(x * .8 + p, 3.1, 4) - .03 * S(x * .5 + p);
        if (v > ridge) return [5, 7, 12];
        let r = 6 + 10 * v, g = 9 + 16 * v, b = 18 + 26 * v;
        if (hash(i * 1.37 + .1, j * 2.11) > .996 && v < ridge - .03) { const tw = .5 + .5 * S(t * 3 + i); r += 150 * tw; g += 155 * tw; b += 170 * tw; }
        // Two curtains. The hem snakes across the sky; folds make some stretches bright and others dim.
        for (let q = 0; q < 2; q++) {
          const hem = .44 - q * .1 - kp * .008 + .1 * S(x * (.7 + q * .3) + t * .05 + p * 1.7) + .04 * S(x * 1.9 - t * .07 + q * 3);
          const d = hem - v;
          const fold = Math.pow(.5 + .5 * S(x * (2.2 + kp * .15) + 2.6 * S(x * .7 + t * .09 + q * 2) + t * .1), 4);
          const rays = .88 + .12 * S(x * 190 + 10 * S(x * 2 + t * .2));
          const I = (d < 0 ? Math.exp(d * 70) : Math.exp(-d * 7)) * (.12 + .88 * fold) * rays * (q ? .6 : 1.15) * (.8 + kp * .07);
          const m = Math.max(0, Math.min(1, (d - .05) * 4.5));
          r += I * (50 + 140 * m); g += I * (235 - 185 * m); b += I * (150 + 60 * m);
        }
        return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
      } },

    // Physarum, Jeff Jones's agent model: agents follow and lay a trail that diffuses and decays.
    // Food sources keep feeding the trail, so the network forms between them.
    slime: { pal: ['#efecd9', '#ece2a8', '#e8c648', '#d09a14', '#8a5a08'], smooth: true, px: 3, max: 240, warm: 80,
      cap: p => { const s = SLIME[p % 10]; return s.food ? `${s.food} food source${s.food > 1 ? 's' : ''}, sensors at ${s.sa}°` : `no food, sensors at ${s.sa}°`; },
      paint: (D, GW, GH, t, p, st) => {
        const s = SLIME[p % 10], N = GW * GH;
        let c = st.cache;
        if (!c || c.N !== N) {
          const n = Math.round(N * .2), A = new Float32Array(n * 3);
          for (let k = 0; k < n; k++) { A[k * 3] = Math.random() * GW; A[k * 3 + 1] = Math.random() * GH; A[k * 3 + 2] = Math.random() * PI * 2; }
          const food = Array.from({ length: s.food }, (_, q) => [1 + Math.round((GW - 3) * (.08 + .84 * hash(p + 3, q))), 1 + Math.round((GH - 3) * (.08 + .84 * hash(p + 3, q + 20)))]);
          c = st.cache = { N, n, A, T: new Float32Array(N), B: new Float32Array(N), food };
        }
        const { A, T, B, n, food } = c, SA = s.sa * PI / 180, RA = s.ra * PI / 180, SO = s.so;
        const sense = (x, y, a) => { const i = (x + C(a) * SO) | 0, j = (y + S(a) * SO) | 0; return i < 0 || j < 0 || i >= GW || j >= GH ? -1 : T[j * GW + i]; };
        for (let k = 0; k < n * 3; k += 3) {
          let x = A[k], y = A[k + 1], a = A[k + 2];
          const F = sense(x, y, a), FL = sense(x, y, a + SA), FR = sense(x, y, a - SA);
          if (F > FL && F > FR) { /* keep going */ } else if (F < FL && F < FR) a += Math.random() < .5 ? RA : -RA;
          else if (FL > FR) a += RA; else if (FR > FL) a -= RA;
          const nx = x + C(a), ny = y + S(a);
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) a = Math.random() * PI * 2; else { x = nx; y = ny; }
          A[k] = x; A[k + 1] = y; A[k + 2] = a;
          T[(y | 0) * GW + (x | 0)] += 1;
        }
        for (const [fx, fy] of food) T[fy * GW + fx] += 3;
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
          let sum = 0, cnt = 0;
          for (let dj = -1; dj <= 1; dj++) { const jj = j + dj; if (jj < 0 || jj >= GH) continue; for (let di = -1; di <= 1; di++) { const ii = i + di; if (ii < 0 || ii >= GW) continue; sum += T[jj * GW + ii]; cnt++; } }
          B[j * GW + i] = sum / cnt * .9;
        }
        c.T = B; c.B = T;
        for (let q = 0; q < N; q++) D[q] = 1 - Math.exp(-B[q] * .22);
        for (const [fx, fy] of food) dot(D, GW, GH, fx, fy, 2.2, 1);
      } },

    // A pressed specimen: an L-system plant in sepia ink, taped to the sheet, swaying slightly.
    herb: { pal: ['#f2ecdd', '#d9ceb2', '#a99a70', '#6f6a3e', '#3a2e1c'], raw: true, every: 50,
      cap: p => { const pl = PLANTS[p % PLANTS.length]; return `specimen ${p + 1}, ${pl.name}`; },
      draw: (x, W, H, t, p, st) => {
        const pl = PLANTS[p % PLANTS.length], k = W / (x.canvas.clientWidth || W);
        if (!st.cache) {
          let s = pl.axiom;
          for (let g = 0; g < pl.n; g++) s = s.replace(/[A-Z]/g, ch => pl.rules[ch] || ch);
          st.cache = { s, box: null };
        }
        const { s } = st.cache, a0 = pl.a * PI / 180 * (1 + .04 * (hash(p, 8) - .5));
        // Walk the string; sway grows with depth, so the stem barely moves and the tips move most.
        const segs = [[], [], [], []], stack = [];
        let X = 0, Y = 0, A = -PI / 2, depth = 0, minX = 0, maxX = 0, minY = 0;
        const sw = st.still ? 0 : 1;
        for (let q = 0; q < s.length; q++) {
          const ch = s[q];
          if (ch === 'F') {
            const nx = X + C(A), ny = Y + S(A);
            segs[Math.min(3, depth >> 1)].push(X, Y, nx, ny);
            X = nx; Y = ny; if (X < minX) minX = X; if (X > maxX) maxX = X; if (Y < minY) minY = Y;
            A += sw * .0016 * S(t * .7 + depth * .8) * (1 + depth);
          } else if (ch === '+') A += a0; else if (ch === '-') A -= a0;
          else if (ch === '[') { stack.push(X, Y, A, depth); depth++; }
          else if (ch === ']') { depth = stack.pop(); A = stack.pop(); Y = stack.pop(); X = stack.pop(); }
        }
        if (!st.cache.box) st.cache.box = [minX, maxX, minY];
        const [bx0, bx1, by0] = st.cache.box;
        const sc = Math.min(W * .84 / (bx1 - bx0 || 1), H * .82 / -by0), ox = W / 2 - (bx0 + bx1) / 2 * sc, oy = H * .91;
        x.fillStyle = '#f2ecdd'; x.fillRect(0, 0, W, H);
        x.strokeStyle = 'rgba(58, 46, 28, .16)'; x.lineWidth = k; x.strokeRect(14 * k, 14 * k, W - 28 * k, H - 28 * k);
        x.lineCap = 'round';
        const cols = ['#3a2e1c', '#4f4226', '#625d33', '#77753f'], widths = [2.4, 1.5, 1, .7];
        for (let d = 0; d < 4; d++) {
          const L = segs[d]; if (!L.length) continue;
          x.beginPath();
          for (let q = 0; q < L.length; q += 4) { x.moveTo(ox + L[q] * sc, oy + L[q + 1] * sc); x.lineTo(ox + L[q + 2] * sc, oy + L[q + 3] * sc); }
          x.strokeStyle = cols[d]; x.lineWidth = widths[d] * k; x.stroke();
        }
        // paper tape over the stem
        const tape = (cx, cy, rot) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = 'rgba(232, 222, 196, .82)'; x.fillRect(-28 * k, -7 * k, 56 * k, 14 * k); x.restore(); };
        tape(ox, oy - 10 * k, -.08);
      } },

    // An orrery: two planets in resonance, with a chord drawn between them as they go round, which
    // over a full cycle traces a rose (8:13 is the Earth and Venus pentagram).
    orrery: { pal: ['#0e1a2e', '#22324d', '#5a6a7f', '#b89a5e', '#e9d6a5'], raw: true,
      cap: p => { const [a, b] = PAIRS[p % 10]; return `${a}:${b} resonance`; },
      draw: (x, W, H, t, p, st) => {
        const k = W / (x.canvas.clientWidth || W), cx = W / 2, cy = H / 2, R = Math.min(W, H) * .44;
        const [a, b] = PAIRS[p % 10], r2 = R * .84, r1 = r2 * Math.pow(a / b, 2 / 3);
        const cyc = Math.max(24, 2.4 * b), w = 2 * PI / cyc;
        if (!st.layer || st.layer.width !== W || st.layer.height !== H || st.lp !== p) {
          st.layer = document.createElement('canvas'); st.layer.width = W; st.layer.height = H;
          st.lp = p; st.t0 = t - cyc * (st.still ? 1 : .35); st.s = 0;
        }
        const pos = (s) => [cx + C(-PI / 2 + w * b * s) * r1, cy + S(-PI / 2 + w * b * s) * r1, cx + C(-PI / 2 + w * a * s) * r2, cy + S(-PI / 2 + w * a * s) * r2];
        let s = t - st.t0;
        if (s > cyc * 1.25) { st.t0 = t; st.s = 0; st.layer.getContext('2d').clearRect(0, 0, W, H); s = 0; }
        const L = st.layer.getContext('2d');
        L.strokeStyle = 'rgba(233, 214, 165, .2)'; L.lineWidth = .7 * k; L.beginPath();
        for (; st.s < Math.min(s, cyc); st.s += .03) { const P = pos(st.s); L.moveTo(P[0], P[1]); L.lineTo(P[2], P[3]); }
        L.stroke();
        x.fillStyle = '#0e1a2e'; x.fillRect(0, 0, W, H);
        const fade = s > cyc ? Math.max(0, 1 - (s - cyc) / (cyc * .25)) : 1;
        x.globalAlpha = fade; x.drawImage(st.layer, 0, 0); x.globalAlpha = 1;
        // the chart: a graduated ring, orbits, and a sun
        x.strokeStyle = 'rgba(201, 169, 106, .55)'; x.lineWidth = .8 * k;
        x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.moveTo(cx + R * 1.04, cy); x.arc(cx, cy, R * 1.04, 0, PI * 2); x.stroke();
        x.beginPath();
        for (let d = 0; d < 360; d += 5) { const q = d * PI / 180, l = d % 30 ? .015 : .04; x.moveTo(cx + C(q) * R, cy + S(q) * R); x.lineTo(cx + C(q) * R * (1 + l), cy + S(q) * R * (1 + l)); }
        x.stroke();
        x.fillStyle = 'rgba(201, 169, 106, .7)'; x.font = `${9 * k}px "JetBrains Mono", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let d = 0; d < 360; d += 30) { const q = (d - 90) * PI / 180; x.fillText(String(d), cx + C(q) * R * 1.1, cy + S(q) * R * 1.1); }
        x.strokeStyle = 'rgba(201, 169, 106, .3)'; x.setLineDash([2 * k, 4 * k]); x.beginPath();
        for (const r of [r1 * .55, r1, r2, (r1 + r2) / 2]) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, PI * 2); }
        x.stroke(); x.setLineDash([]);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, 26 * k); g.addColorStop(0, 'rgba(233, 214, 165, .9)'); g.addColorStop(.25, 'rgba(201, 169, 106, .5)'); g.addColorStop(1, 'rgba(201, 169, 106, 0)');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 26 * k, 0, PI * 2); x.fill();
        const P = pos(Math.min(s, cyc * 1.25)), inner = cx + C(-PI / 2 + t * 1.3) * r1 * .55, innerY = cy + S(-PI / 2 + t * 1.3) * r1 * .55;
        x.fillStyle = '#e9d6a5';
        for (const [px, py, r] of [[P[0], P[1], 4.5], [P[2], P[3], 5.5], [inner, innerY, 2.5]]) { x.beginPath(); x.arc(px, py, r * k, 0, PI * 2); x.fill(); }
        x.strokeStyle = 'rgba(233, 214, 165, .5)'; x.beginPath(); x.arc(P[2], P[3], 9 * k, 0, PI * 2); x.stroke();
      } },

    // Zellige: a quasicrystal, the sum of plane waves at n evenly spaced angles, glazed in tile colours.
    // Each level of the sum is a band of glaze; thin white grout runs between bands.
    zellige: { pal: ['#f5f2ea', '#cfe1d9', '#6fa597', '#2b6b66', '#123438', '#c9a24e'], heat: ['#f5f2ea', '#cfe1d9', '#6fa597', '#2b6b66', '#123438'],
      smooth: true, steps: true, px: 3, max: 420, every: 60, interlace: 3,
      cap: p => `${SYM[p % 10]}-fold symmetry`,
      value: (u, v, t, p, i, j, ar, st) => {
        const n = SYM[p % 10], K = 2 * PI / 64 * (st.cv.clientWidth / st.GW), X = (i - st.GW / 2) * K, Y = (j - st.GH * .45) * K;
        let s = 0;
        for (let q = 0; q < n; q++) { const a = PI * q / n; s += C(X * C(a) + Y * S(a) + t * .2); }
        const f = Math.max(0, Math.min(.999, (s / n * 1.6 + 1) / 2)) * 5, band = Math.floor(f);
        if (fr(f) < .12) return 0;
        return [4, 3, 2, 5, 1][band] / 5;
      } },

    // Rain on a pond at night: each drop sends out rings, flattened by the low angle of view.
    // The rings make a height field; the water is lit by its slope, and the moon's reflection is
    // bent sideways wherever a ring passes through it.
    rain: { pal: ['#0b1216', '#16232a', '#2c434d', '#6f8f9b', '#dce8ec'], smooth: true, px: 3, max: 380,
      cap: p => `${RAIN[p % 10]} drops a second`,
      paint: (D, GW, GH, t, p, st) => {
        const c = st.cache && st.cache.H.length === GW * GH ? st.cache : (st.cache = { drops: [], H: new Float32Array(GW * GH) });
        const { drops, H } = c, rate = RAIN[p % 10] * GW * GH / 7000;
        for (let k = 0; k < 3 && Math.random() < rate * .04 - k; k++) { const y = GH * Math.pow(Math.random(), .7); drops.push({ x: Math.random() * GW, y, t0: t, s: .3 + .7 * y / GH }); }
        H.fill(0);
        for (let q = drops.length - 1; q >= 0; q--) {
          const d = drops[q], age = (t - d.t0) / .02, life = 90;
          if (age > life) { drops.splice(q, 1); continue; }
          const R = age * 1.05 * d.s, amp = (1 - age / life) ** 2, sy = .4, w = 2.8 * d.s, ro = R + 3 * w, ri = Math.max(0, R - 3 * w);
          // Only the annulus around the ring: per row, the span between the inner and outer circles.
          for (let j = Math.max(0, Math.ceil(d.y - ro * sy)); j <= Math.min(GH - 1, Math.floor(d.y + ro * sy)); j++) {
            const dy = (j - d.y) / sy, xo = Math.sqrt(Math.max(0, ro * ro - dy * dy)), xi = Math.abs(dy) < ri ? Math.sqrt(ri * ri - dy * dy) : 0;
            for (const [a, b] of [[d.x - xo, d.x - xi], [d.x + xi, d.x + xo]])
              for (let i = Math.max(0, Math.ceil(a)); i <= Math.min(GW - 1, Math.floor(b)); i++) {
                const dr = (Math.hypot(i - d.x, dy) - R) / w;
                H[j * GW + i] += amp * C(dr * 2.2) * Math.exp(-dr * dr / 2.5);
              }
          }
        }
        const mx = GW * (.25 + .5 * hash(p, 5)), mw = GW * .06;
        for (let j = 1; j < GH - 1; j++) {
          const v = j / GH, sky = .1 + .22 * (1 - v) * (1 - v);
          for (let i = 1; i < GW - 1; i++) {
            const k = j * GW + i, gx = H[k + 1] - H[k - 1], gy = H[k + GW] - H[k - GW];
            const dx = (i - mx + gx * 40) / (mw * (.6 + v)), glow = Math.exp(-dx * dx);
            const shimmer = glow > .02 ? .4 + 1.1 * vnoise(i * .15 + gx * 4, j * .9 - t * 1.5) * (.6 + .4 * S(j * .23 + t)) : 0;
            D[k] = sky + .62 * glow * shimmer * (.35 + .65 * v) - gy * .8 + Math.abs(gx) * .15;
          }
        }
      } },
  };

  const key = document.documentElement.dataset.field, o = FIELDS[key];
  if (!o) return;
  // Options a field can set: px (CSS px per cell), max (most columns), every (ms per frame), warm (ticks
  // before the first frame), smooth (one canvas pixel per cell, scaled up soft; with steps, palette
  // levels are not blended; with rgb, value returns a colour), interlace (a smooth field redraws every
  // nth row per frame, for slow fields), heat (the palette for the contribution grid).
  window.FIELD = { key, pal: o.heat || o.pal, cap: o.cap };
  const CELL = 6, PX = o.px || 7, EVERY = o.every || 40; // backing pixels per cell; CSS px per cell
  const RGB = o.pal.map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));

  const live = [];
  function mount(cv) {
    const st = { cv, x: cv.getContext('2d'), t: Math.random() * 20, visible: false, last: 0, still: reduce };
    st.setP = (p) => {
      st.p = p; st.full = true; st.cache = st.seeds = st.poles = null;
      if (st.D) { st.D.fill(0); warm(st); }
      const cap = cv.parentElement.querySelector('.field-cap');
      if (cap && o.cap) cap.textContent = o.cap(p);
    };
    st.layout = () => {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (o.raw) { const k = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * k); cv.height = Math.round(h * k); }
      else {
        st.GW = Math.max(24, Math.min(o.max || 200, Math.round(w / PX))); st.GH = Math.max(4, Math.round(st.GW * h / w));
        if (o.smooth) { cv.width = st.GW; cv.height = st.GH; st.img = st.x.createImageData(st.GW, st.GH); cv.classList.add('smooth'); }
        else { cv.width = st.GW * CELL; cv.height = st.GH * CELL; }
        st.ar = st.GW / st.GH;
        st.full = true; st.D = new Float32Array(st.GW * st.GH); st.cache = st.seeds = null; warm(st);
      }
      render(st);
    };
    st.setP(+cv.dataset.p || 0);
    st.step = () => { tick(st); render(st); }; // one frame by hand, for checking a field in a paused tab
    cv._field = st;
    new IntersectionObserver(es => es.forEach(e => { st.visible = e.isIntersecting; }), { rootMargin: '80px' }).observe(cv);
    let rt, first = true; new ResizeObserver(() => { clearTimeout(rt); if (first) { first = false; st.layout(); } else rt = setTimeout(st.layout, 100); }).observe(cv);
    live.push(st);
  }
  function warm(st) { for (let k = 0; k < (o.warm || (o.decay ? 80 : 1)); k++) tick(st); }
  function tick(st) {
    st.t += .02 * EVERY / 40;
    if (o.paint && st.D) { if (o.decay) for (let i = 0; i < st.D.length; i++) st.D[i] *= o.decay; o.paint(st.D, st.GW, st.GH, st.t, st.p, st); }
  }
  function render(st) {
    const { x, cv } = st;
    if (o.raw) { o.draw(x, cv.width, cv.height, st.t, st.p, st); return; }
    if (!st.D) return;
    if (o.smooth) {
      const { GW, GH, ar } = st, d = st.img.data, L = RGB.length - 1;
      const step = st.full ? 1 : o.interlace || 1, off = (st.frame = (st.frame || 0) + 1) % step; st.full = false;
      for (let j = off; j < GH; j += step) for (let i = 0, n = j * GW * 4; i < GW; i++, n += 4) {
        const c = o.paint ? st.D[j * GW + i] : o.value(i / GW, j / GH, st.t, st.p, i, j, ar, st);
        if (o.rgb) { d[n] = c[0]; d[n + 1] = c[1]; d[n + 2] = c[2]; }
        else {
          const val = Math.max(0, Math.min(1, c || 0)) * L;
          if (o.steps) { const A = RGB[Math.round(val)]; d[n] = A[0]; d[n + 1] = A[1]; d[n + 2] = A[2]; }
          else { const a = Math.min(L - 1, val | 0), f = val - a, A = RGB[a], B = RGB[a + 1]; d[n] = A[0] + (B[0] - A[0]) * f; d[n + 1] = A[1] + (B[1] - A[1]) * f; d[n + 2] = A[2] + (B[2] - A[2]) * f; }
        }
        d[n + 3] = 255;
      }
      x.putImageData(st.img, 0, 0);
      return;
    }
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
  (function loop(now) {
    if (!document.hidden) for (const st of live) if (st.visible && (o.raw || st.D) && now - st.last >= EVERY) { st.last = now; tick(st); render(st); }
    requestAnimationFrame(loop);
  })(0);
})();
