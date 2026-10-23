// GitHub contribution heatmap. Fetches /assets/contrib.json and draws ink lily pads.
// No libraries. Refresh the JSON by hand with scripts/contrib.py (or a daily Action later).
const MON = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const fmt = d => `${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
const day = s => new Date(s + 'T00:00:00Z');

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

function drawPads(box, cols) {
  // flat ink lily pads: circle with a wedge cut, size and opacity = activity level
  const S = 14, W = cols.length * S, H = 7 * S + 16, months = monthRow(cols);
  let g = '';
  months.forEach((m, i) => { if (m) g += `<text x="${i * S + 1}" y="10">${m}</text>`; });
  cols.forEach((c, i) => c.forEach((d, r) => {
    if (!d) return;
    const x = i * S + S / 2, y = 16 + r * S + S / 2, l = d[2];
    if (!l) {
      g += `<circle cx="${x}" cy="${y}" r="1.8" class="p0"><title>${tip(d)}</title></circle>`;
      return;
    }
    const rad = 2.2 + l * 1.1, a = ((i * 7 + r) * 137.5 % 360) * Math.PI / 180, n = 0.55;
    const p = t => `${(x + rad * Math.cos(t)).toFixed(2)} ${(y + rad * Math.sin(t)).toFixed(2)}`;
    g += `<path class="p${l}" d="M${x} ${y}L${p(a + n)}A${rad} ${rad} 0 1 1 ${p(a - n)}Z"><title>${tip(d)}</title></path>`;
  }));
  box.innerHTML = `<svg class="cg-pond" viewBox="0 0 ${W} ${H}" style="min-width:${W}px" aria-hidden="true">${g}</svg>`;
}

async function main() {
  const el = document.querySelector('[data-contrib="pond"]');
  if (!el) return;
  const data = await (await fetch('/assets/contrib.json')).json();
  const cols = weeks(data.days), from = fmt(day(data.from)), to = fmt(day(data.to));
  const best = data.days.reduce((a, b) => (b[1] > a[1] ? b : a));
  const label = `${data.total} GitHub contributions from ${from} to ${to}. Busiest day ${fmt(day(best[0]))} with ${best[1]}.`;
  const box = el.querySelector('.cg-box');
  drawPads(box, cols);
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', label);
  document.querySelectorAll('.cg-total').forEach(n => (n.textContent = data.total));
  document.querySelectorAll('.cg-range').forEach(n => (n.textContent = `${from} to ${to}`));
  box.scrollLeft = box.scrollWidth;
}
main().catch(() => {});
