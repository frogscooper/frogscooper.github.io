// GitHub contribution heatmap. Fetches /assets/contrib.json and draws one pixel frog per day.
// Data is refreshed every few hours by .github/workflows/contrib.yml (scripts/contrib.py).
// Two renders from the same data: horizontal inside the page, vertical in the fixed left rail.
// No libraries.
const MON = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const fmt = d => `${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
const day = s => new Date(s + 'T00:00:00Z');
const f = v => +v.toFixed(2);
const MONTHS = 6; // how far back to show; the page text says "6 months" too

function weeks(days) {
  const pad = day(days[0][0]).getUTCDay(), cols = [];
  days.forEach((d, i) => { const k = i + pad; (cols[k / 7 | 0] ||= Array(7).fill(null))[k % 7] = d; });
  return cols;
}

function monthRow(cols) {
  let last = -1;
  return cols.map(c => {
    const d = c.find(Boolean), m = day(d[0]).getUTCMonth();
    if (m === last) return ''; last = m; return MON[m];
  });
}

const tip = d => `${d[1] || 'no'} contribution${d[1] === 1 ? '' : 's'} on ${fmt(day(d[0]))}`;

// X body, E eye white, O pupil, M mouth, S spot. Each appears from `min` level up; below that it
// falls back to plain body. Empty days (level 0) are just the outline.
const SPRITE = [
  '.XXXX.XXXX.',
  'XEOEXXXEOEX',
  'XEOEXXXEOEX',
  'XSXXXXXXXSX',
  'XXXSXXXSXXX',
  'XMXXXXXXXMX',
  'XXMMMMMMMXX',
  '.XXXXXXXXX.',
];
const RULES = { E: [1, 'var(--eye)'], O: [1, 'var(--cg-ink)'], M: [2, 'var(--cg-ink)'], S: [4, 'var(--dk)'] };
// Everything is drawn in sprite pixels (1 unit = 1 sprite pixel) and the SVG is sized to a whole
// number of CSS px per unit, so frogs stay crisp instead of getting uneven pixel rows.
// s = CSS px per sprite pixel, cx/cy = cell pitch in sprite pixels (the frog is 11x8).
const LAYOUT = {
  wide: { s: 1, cx: 13, cy: 12, lab: 0, top: 14 },
  tall: { s: 2, cx: 13, cy: 10, lab: 12, top: 0 },
};

function frogs() {
  const R = SPRITE.length, C = SPRITE[0].length;
  return [0, 1, 2, 3, 4].map(l => {
    const fill = (r, c) => {
      const ch = SPRITE[r]?.[c];
      if (!ch || ch === '.') return null;
      const u = RULES[ch];
      return u && l >= u[0] ? u[1] : `var(--f${l})`;
    };
    let rects = '', edge = '';
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const k = fill(r, c);
      if (!k) continue;
      rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="${k}"/>`;
      if (!fill(r - 1, c)) edge += `M${c} ${r}h1`;
      if (!fill(r + 1, c)) edge += `M${c} ${r + 1}h1`;
      if (!fill(r, c - 1)) edge += `M${c} ${r}v1`;
      if (!fill(r, c + 1)) edge += `M${c + 1} ${r}v1`;
    }
    const stroke = l ? 'var(--cg-ink)' : 'var(--line)';
    return `<g id="cg-frog${l}" shape-rendering="crispEdges">${rects}<path d="${edge}" fill="none" stroke="${stroke}" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linecap="square"/></g>`;
  }).join('');
}

function pond(cols, vertical) {
  const { s, cx, cy, lab, top } = LAYOUT[vertical ? 'tall' : 'wide'];
  const W = vertical ? lab + 7 * cx : cols.length * cx, H = vertical ? cols.length * cy : top + 7 * cy;
  let g = '';
  monthRow(cols).forEach((m, i) => {
    if (m) g += vertical ? `<text x="0" y="${i * cy + 6}">${m}</text>` : `<text x="${i * cx}" y="${top - 4}">${m}</text>`;
  });
  cols.forEach((c, i) => c.forEach((d, r) => {
    if (!d) return;
    const x = vertical ? lab + r * cx : i * cx, y = vertical ? i * cy : top + r * cy;
    g += `<g transform="translate(${x} ${y})"><title>${tip(d)}</title><use href="#cg-frog${d[2]}"/></g>`;
  }));
  const px = `width:${W * s}px;height:${H * s}px;max-width:none;font-size:${9 / s}px`;
  return `<svg class="cg-pond" viewBox="0 0 ${W} ${H}" width="${W * s}" height="${H * s}" style="${px}" aria-hidden="true">${g}</svg>`;
}

async function main() {
  const el = document.querySelector('[data-contrib="pond"]'), rail = document.querySelector('[data-contrib="rail"]');
  if (!el && !rail) return;
  const data = await (await fetch('/assets/contrib.json', { cache: 'no-cache' })).json();
  // the JSON holds a full year; the page only shows the last 6 months
  const cut = day(data.to);
  cut.setUTCMonth(cut.getUTCMonth() - MONTHS);
  const days = data.days.filter(d => day(d[0]) > cut), total = days.reduce((n, d) => n + d[1], 0);
  const cols = weeks(days), from = fmt(day(days[0][0])), to = fmt(day(data.to));
  const best = days.reduce((a, b) => (b[1] > a[1] ? b : a));
  const label = `${total} GitHub contributions from ${from} to ${to}. Busiest day ${fmt(day(best[0]))} with ${best[1]}.`;
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${frogs()}</defs></svg>`);
  const box = el?.querySelector('.cg-box'), tall = rail?.querySelector('.cg-rail-box');
  if (box) {
    box.innerHTML = pond(cols, false);
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', label);
    box.scrollLeft = box.scrollWidth;
  }
  if (tall) {
    tall.innerHTML = pond(cols, true);
    tall.setAttribute('role', 'img');
    tall.setAttribute('aria-label', label);
  }
  document.querySelectorAll('.cg-total').forEach(n => (n.textContent = total));
  document.querySelectorAll('.cg-range').forEach(n => (n.textContent = `${from} to ${to}`));
}
main().catch(() => {});
