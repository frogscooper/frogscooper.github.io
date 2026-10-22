// GRCH live demo. Loaded only after "[ run grch ]" is clicked.
const SIZE = 2048;            // grch's SIZE
const CW = 20;                // grch's CORRIDOR_WIDTH
const DEFAULT_SEED = '184138956713986453'; // grch's SEED
const TIMEOUT_MS = 2000;
const INK = '#101010', PAPER = '250,250,248';

export function mount(box) {
  box.innerHTML = `
    <canvas class="grch-canvas" aria-label="GRCH dungeon, drag to rotate"></canvas>
    <div class="grch-bar">
      <label>seed <input class="grch-seed" inputmode="numeric" spellcheck="false" value="${DEFAULT_SEED}"></label>
      <button type="button" class="grch-roll">[ reroll ]</button>
      <label>depth <select class="grch-depth">${[4, 5, 6, 7, 8].map(d => `<option${d === 8 ? ' selected' : ''}>${d}</option>`).join('')}</select></label>
      <span class="grch-status" aria-live="polite">loading wasm</span>
    </div>`;
  const $ = s => box.querySelector(s);
  const canvas = $('.grch-canvas'), ctx = canvas.getContext('2d');
  const seedIn = $('.grch-seed'), depthIn = $('.grch-depth'), status = $('.grch-status');

  let worker, rooms = [], cors = [], yaw = 0.7, pitch = 0.55, dragging = null, visible = true;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- generation (in a worker, so a seed that never finishes can be killed) ----
  // One job at a time. A newer request kills a busy worker instead of queueing behind it.
  let job = 0, pending = null;
  function run(seed, depth) {
    if (pending) { clearTimeout(pending.timer); worker.terminate(); worker = null; pending.resolve('stale'); }
    worker ??= new Worker(new URL('worker.js', import.meta.url), { type: 'module' });
    const w = worker, id = ++job;
    return new Promise(resolve => {
      const timer = setTimeout(() => { pending = null; w.terminate(); if (worker === w) worker = null; resolve(null); }, TIMEOUT_MS);
      pending = { timer, resolve };
      w.onmessage = ({ data }) => { if (data.id === id) { clearTimeout(timer); pending = null; resolve(data); } };
      w.postMessage({ id, seed, depth, size: SIZE });
    });
  }

  async function generate(seed, depth, rerolls = 0) {
    status.textContent = 'generating';
    const r = await run(seed, depth);
    if (r === 'stale') return;
    if (!r) {
      if (rerolls > 0) {
        status.textContent = `seed ${seed} hit a routing loop, rolling again`;
        return generate(randomSeed(), depth, rerolls - 1);
      }
      status.textContent = `seed ${seed} did not finish routing in ${TIMEOUT_MS / 1000} s`;
      return;
    }
    seedIn.value = seed;
    const a = r.out, nr = a[0], nc = a[1];
    const box6 = i => [a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5]];
    rooms = []; cors = [];
    for (let k = 0; k < nr; k++) rooms.push(box6(2 + 6 * k));
    for (let k = 0; k < nc; k++) {
      const [x1, y1, z1, x2, y2, z2] = box6(2 + 6 * (nr + k));
      cors.push([x1 + CW, y1 + CW, z1 + CW, x2 - CW, y2 - CW, z2 - CW]); // back to the routed path
    }
    status.textContent = `${nr} rooms, ${nc} corridor segments, ${r.ms.toFixed(1)} ms`;
    draw();
  }

  function randomSeed() {
    const u = new BigUint64Array(1);
    crypto.getRandomValues(u);
    return u[0].toString();
  }

  // ---- drawing: orthographic projection, drag to rotate ----
  function project(x, y, z, s, cx, cy) {
    x -= SIZE / 2; y -= SIZE / 2; z -= SIZE / 2;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rx = x * cyw - z * syw, rz = x * syw + z * cyw;
    const ry = y * cp - rz * sp;
    return [cx + rx * s, cy - ry * s];
  }

  const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];

  function draw() {
    const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK; ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) / (SIZE * 1.5), cx = w / 2, cy = h / 2;

    ctx.lineWidth = 1;
    ctx.fillStyle = `rgba(${PAPER},0.05)`;
    ctx.strokeStyle = `rgba(${PAPER},0.16)`;
    for (const [x1, y1, z1, x2, y2, z2] of rooms) {
      const p = [[x1, y1, z1], [x2, y1, z1], [x2, y2, z1], [x1, y2, z1], [x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]]
        .map(v => project(v[0], v[1], v[2], s, cx, cy));
      for (const f of FACES) {
        ctx.beginPath();
        f.forEach((i, j) => (j ? ctx.lineTo : ctx.moveTo).call(ctx, p[i][0], p[i][1]));
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }

    ctx.strokeStyle = `rgb(${PAPER})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (const [x1, y1, z1, x2, y2, z2] of cors) {
      const a = project(x1, y1, z1, s, cx, cy), b = project(x2, y2, z2, s, cx, cy);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }

  function tick() {
    if (!still && !dragging && visible && document.visibilityState === 'visible') { yaw += 0.003; draw(); }
    requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown', e => { dragging = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    yaw += (e.clientX - dragging[0]) * 0.01;
    pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - dragging[1]) * 0.01));
    dragging = [e.clientX, e.clientY];
    draw();
  });
  const stop = () => { dragging = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  new ResizeObserver(draw).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  $('.grch-roll').addEventListener('click', () => generate(randomSeed(), +depthIn.value, 4));
  depthIn.addEventListener('change', () => generate(seedIn.value, +depthIn.value));
  seedIn.addEventListener('change', () => {
    const v = seedIn.value.trim();
    if (/^\d{1,20}$/.test(v) && BigInt(v) < 2n ** 64n) generate(v, +depthIn.value);
    else status.textContent = 'seed must be a whole number from 0 to 18446744073709551615';
  });

  generate(DEFAULT_SEED, 8);
  tick();
}
