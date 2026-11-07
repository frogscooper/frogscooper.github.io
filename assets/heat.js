// Activity calendar in the profile's top-right tile: one cell per day for the last 13 weeks
// (columns are weeks, rows mon..sun), shaded by GitHub's own contribution level, from the same
// /assets/contrib.json as the 6-month contribution graph further down (scripts/contrib.py).
// Without JavaScript or data the tile keeps just its caption.
(async () => {
  const svg = document.querySelector('.heat-map');
  if (!svg) return;
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const DAY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const WEEKS = 13;
  let data;
  try { data = await (await fetch('/assets/contrib.json')).json(); } catch (e) { return; }
  if (!data || !data.days || !data.days.length) return;

  const byDate = new Map(data.days.map(([s, n, l]) => [s, [n, l]]));
  const iso = (d) => d.toISOString().slice(0, 10);
  // the grid runs from the monday WEEKS-1 weeks before the newest day's week, up to the newest day
  const last = new Date(data.days[data.days.length - 1][0] + 'T00:00:00Z');
  const start = new Date(last);
  start.setUTCDate(start.getUTCDate() - ((last.getUTCDay() + 6) % 7) - (WEEKS - 1) * 7);

  // geometry in SVG units; the SVG scales to the tile's width
  const LAB = 22, CELL = 16, GAP = 3, P = CELL + GAP, TOP = 14, W = LAB + WEEKS * P - GAP, H = TOP + 7 * P - GAP;
  const ns = 'http://www.w3.org/2000/svg', el = (tag, attrs, text) => {
    const n = document.createElementNS(ns, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  DAY.forEach((name, r) => { if (r % 2 === 0) svg.append(el('text', { x: 0, y: TOP + r * P + CELL - 4 }, name)); });

  let prevMonth = -1;
  for (let c = 0; c < WEEKS; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + c * 7 + r);
      if (d > last) break;
      // month name over the first week that starts in it; the first column only gets one if that
      // week is the month's first, so a stray label never crowds the next month's
      if (r === 0 && d.getUTCMonth() !== prevMonth) {
        if (c > 0 || d.getUTCDate() <= 7) svg.append(el('text', { x: LAB + c * P, y: 9 }, MON[d.getUTCMonth()]));
        prevMonth = d.getUTCMonth();
      }
      const [n, l] = byDate.get(iso(d)) || [0, 0];
      const cell = el('rect', { x: LAB + c * P, y: TOP + r * P, width: CELL, height: CELL, rx: 3, class: 'l' + Math.max(0, Math.min(4, l)) });
      cell.append(el('title', {}, `${n} contribution${n === 1 ? '' : 's'} on ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`));
      svg.append(cell);
    }
  }
})();
