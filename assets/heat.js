// Activity heatmap in the profile's top-right tile: GitHub contributions summed by weekday (rows,
// mon..sun) and month (columns, the last 12), from the same /assets/contrib.json as the
// contribution graph (scripts/contrib.py). Darker cells are quieter; the busiest cell is lightest.
// Without JavaScript or data the tile keeps just its caption.
(async () => {
  const svg = document.querySelector('.heat-map');
  if (!svg) return;
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const DAY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let data;
  try { data = await (await fetch('/assets/contrib.json')).json(); } catch (e) { return; }
  if (!data || !data.days || !data.days.length) return;

  // the 12 months ending with the month of the newest day
  const end = new Date(data.days[data.days.length - 1][0] + 'T00:00:00Z');
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    months.push(d.getUTCFullYear() * 12 + d.getUTCMonth());
  }
  const sum = DAY.map(() => months.map(() => 0));
  for (const [s, n] of data.days) {
    const d = new Date(s + 'T00:00:00Z'), col = months.indexOf(d.getUTCFullYear() * 12 + d.getUTCMonth());
    if (col >= 0) sum[(d.getUTCDay() + 6) % 7][col] += n;
  }
  const max = Math.max(1, ...sum.flat());
  const level = (n) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  // geometry in SVG units; the SVG scales to the tile's width
  const LAB = 22, CELL = 16, GAP = 2, P = CELL + GAP, TOP = 0, W = LAB + 12 * P - GAP, H = TOP + 7 * P + 12;
  const ns = 'http://www.w3.org/2000/svg', el = (tag, attrs, text) => {
    const n = document.createElementNS(ns, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  DAY.forEach((name, r) => {
    if (r % 2 === 0) svg.append(el('text', { x: 0, y: TOP + r * P + CELL - 4 }, name));
    months.forEach((m, c) => {
      const n = sum[r][c], mon = MON[m % 12], yr = Math.floor(m / 12);
      const cell = el('rect', { x: LAB + c * P, y: TOP + r * P, width: CELL, height: CELL, rx: 3, class: 'l' + level(n) });
      cell.append(el('title', {}, `${n} contribution${n === 1 ? '' : 's'} on ${name}days, ${mon} ${yr}`));
      svg.append(cell);
    });
  });
  months.forEach((m, c) => svg.append(el('text', { x: LAB + c * P + CELL / 2, y: H - 1, 'text-anchor': 'middle' }, MON[m % 12][0])));
})();
