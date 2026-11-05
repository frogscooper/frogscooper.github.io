// 25 Folio: warm uncoated paper behind the page: fine tooth, and a dotted grid like a notebook
// page that fades out toward the middle so the sheets sit on clean paper. Still, so it costs
// nothing after the first draw; redrawn only when the window size changes. Plain canvas 2D.
(() => {
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;height:100lvh;z-index:-1;display:block;pointer-events:none';
  document.body.prepend(c);
  const x = c.getContext('2d');
  if (!x) { c.remove(); return; }

  const draw = () => {
    const d = Math.min(devicePixelRatio || 1, 2), box = c.getBoundingClientRect();
    const W = box.width, H = box.height;
    if (c.width === Math.round(W * d) && c.height === Math.round(H * d)) return;
    c.width = Math.round(W * d); c.height = Math.round(H * d);
    x.setTransform(d, 0, 0, d, 0, 0);
    let seed = 1729;   // the same paper on every visit
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    x.fillStyle = '#efe6d8';
    x.fillRect(0, 0, W, H);
    for (let i = 0, n = Math.round(W * H / 900); i < n; i++) {        // paper tooth
      x.fillStyle = rnd() < .5 ? 'rgba(120, 86, 56, .07)' : 'rgba(255, 255, 255, .35)';
      x.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 1.5, 1);
    }
    // dotted grid, strongest at the edges and in the banner strip
    const G = 22, cx = W / 2, reach = Math.min(W / 2, 640);
    for (let y = G / 2; y < H; y += G) for (let gx = G / 2; gx < W; gx += G) {
      const edge = Math.min(1, Math.max(0, (Math.abs(gx - cx) - reach * .55) / (reach * .45)));
      const top = y < 210 ? 1 - y / 210 : 0;
      const a = .2 * Math.max(edge, top * .8);
      if (a < .01) continue;
      x.fillStyle = `rgba(122, 86, 56, ${a.toFixed(3)})`;
      x.fillRect(gx - .75, y - .75, 1.5, 1.5);
    }
  };
  let tm;
  addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(draw, 120); });
  draw();
})();
