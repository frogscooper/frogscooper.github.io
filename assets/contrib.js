// GitHub contribution heatmap. Fetches /assets/contrib.json and draws one pixel frog per day.
// Data is refreshed every few hours by .github/workflows/contrib.yml (scripts/contrib.py).
// Two renders from the same data: horizontal inside the page, vertical in the fixed left rail.
// No libraries.
const MON = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const fmt = d => `${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
const day = s => new Date(s + 'T00:00:00Z');
const f = v => +v.toFixed(2);

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
const RULES = { E: [1, 'var(--eye)'], O: [1, 'var(--ink)'], M: [2, 'var(--ink)'], S: [4, 'var(--dk)'] };
const S = 14, PX = Math.min(12 / SPRITE[0].length, 11 / SPRITE.length); // frog is ~12 of the 14 cell

function frogs() {
  const R = SPRITE.length, C = SPRITE[0].length, x0 = -C * PX / 2, y0 = -R * PX / 2;
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
      const x = f(x0 + c * PX), y = f(y0 + r * PX), x1 = f(x + PX), y1 = f(y + PX);
      rects += `<rect x="${x}" y="${y}" width="${f(PX)}" height="${f(PX)}" fill="${k}" stroke="${k}" stroke-width=".06"/>`;
      if (!fill(r - 1, c)) edge += `M${x} ${y}H${x1}`;
      if (!fill(r + 1, c)) edge += `M${x} ${y1}H${x1}`;
      if (!fill(r, c - 1)) edge += `M${x} ${y}V${y1}`;
      if (!fill(r, c + 1)) edge += `M${x1} ${y}V${y1}`;
    }
    const stroke = l ? 'var(--ink)' : 'var(--line)';
    return `<g id="cg-frog${l}" shape-rendering="crispEdges">${rects}<path d="${edge}" fill="none" stroke="${stroke}" stroke-width=".5" stroke-linecap="square"/></g>`;
  }).join('');
}

function pond(cols, vertical) {
  const LAB = 22, W = vertical ? LAB + 7 * S : cols.length * S, H = vertical ? cols.length * S : 7 * S + 16;
  let g = '';
  monthRow(cols).forEach((m, i) => {
    if (m) g += vertical ? `<text x="0" y="${i * S + S / 2 + 3}">${m}</text>` : `<text x="${i * S + 1}" y="10">${m}</text>`;
  });
  cols.forEach((c, i) => c.forEach((d, r) => {
    if (!d) return;
    const x = vertical ? LAB + r * S + S / 2 : i * S + S / 2, y = vertical ? i * S + S / 2 : 16 + r * S + S / 2;
    g += `<g transform="translate(${x} ${y})"><title>${tip(d)}</title><use href="#cg-frog${d[2]}"/></g>`;
  }));
  const fit = vertical ? ' preserveAspectRatio="xMidYMin meet"' : ` style="min-width:${W}px"`;
  return `<svg class="cg-pond" viewBox="0 0 ${W} ${H}"${fit} aria-hidden="true">${g}</svg>`;
}

async function main() {
  const el = document.querySelector('[data-contrib="pond"]'), rail = document.querySelector('[data-contrib="rail"]');
  if (!el && !rail) return;
  const data = await (await fetch('/assets/contrib.json')).json();
  const cols = weeks(data.days), from = fmt(day(data.from)), to = fmt(day(data.to));
  const best = data.days.reduce((a, b) => (b[1] > a[1] ? b : a));
  const label = `${data.total} GitHub contributions from ${from} to ${to}. Busiest day ${fmt(day(best[0]))} with ${best[1]}.`;
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
  document.querySelectorAll('.cg-total').forEach(n => (n.textContent = data.total));
  document.querySelectorAll('.cg-range').forEach(n => (n.textContent = `${from} to ${to}`));
}
main().catch(() => {});
