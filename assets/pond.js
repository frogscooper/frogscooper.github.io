// Shared by every page: draws the pixel frog into each .avatar (the same frog as the backdrop
// switch and the favicon, assets/frog.svg) and keeps it alive: it blinks now and then, its pupils
// follow the cursor, and it hops when you poke it.
(() => {
  // 11x9 grid. w = eye white; the pupils and the closed lids are drawn separately below.
  const FROG = ['.ddd...ddd.', 'dwwwd.dwwwd', 'dwwwdgdwwwd', 'dgggggggggd', 'dgpgggggpgd', 'dgdgggggdgd', 'dggdddddggd', '.dgggggggd.', '..ddddddd..'];
  const INK = { d: '#24401a', g: '#74a542', w: '#ffffff', p: '#e39a86' };
  const px = (x, y, fill, cls = '') => `<rect${cls && ` class="${cls}"`} x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
  const body = FROG.map((r, y) => [...r].map((c, x) => INK[c] ? px(x, y, INK[c]) : '').join('')).join('');
  // Closed: the top row of each eye turns to skin, the bottom row to a dark lash line.
  const lids = [1, 2, 3, 7, 8, 9].map(x => px(x, 1, INK.g) + px(x, 2, INK.d)).join('');
  const svg = `<svg viewBox="0 0 11 9" shape-rendering="crispEdges">${body}` +
    `<g class="pupils">${px(2, 2, '#111111', 'pl')}${px(8, 2, '#111111', 'pr')}</g><g class="lids">${lids}</g></svg>`;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const frogs = [...document.querySelectorAll('.avatar')];
  frogs.forEach(el => { el.innerHTML = svg; });
  if (!frogs.length) return;

  // Blink at random intervals, sometimes twice in a row.
  const blink = el => { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 130); };
  if (!reduce) frogs.forEach(el => {
    const next = () => setTimeout(() => {
      if (!document.hidden) { blink(el); if (Math.random() < .25) setTimeout(() => blink(el), 260); }
      next();
    }, 2500 + Math.random() * 4000);
    next();
  });

  // Pupils look toward the cursor: one cell left/right, one cell up. Each eye is 3 wide and 2 tall.
  if (fine) {
    let raf = 0, mx = 0, my = 0;
    const look = () => {
      raf = 0;
      frogs.forEach(el => {
        const r = el.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * .3);
        const far = Math.hypot(dx, dy) > r.width * .6;
        const sx = far ? Math.sign(Math.round(dx / Math.max(1, Math.abs(dy) + Math.abs(dx)) * 1.6)) : 0;
        const sy = far && dy < -Math.abs(dx) * .5 ? -1 : 0;
        el.querySelector('.pl').setAttribute('x', 2 + sx);
        el.querySelector('.pr').setAttribute('x', 8 + sx);
        el.querySelectorAll('.pupils rect').forEach(p => p.setAttribute('y', 2 + sy));
      });
    };
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; raf ||= requestAnimationFrame(look); }, { passive: true });
  }

  // Poke it and it hops (and blinks).
  frogs.forEach(el => el.addEventListener('pointerdown', () => {
    blink(el);
    if (reduce) return;
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
  }));
})();
