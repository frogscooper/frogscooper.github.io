// Language bar on the home profile card. Reads /assets/langs.json, written by scripts/langs.py
// as [[name, color, percent], ...]. The JSON keeps GitHub's colors, but the bar ignores them and
// shades by rank in frog greens (--lang1..6 in pond.css), darkest for the biggest. "other" is always
// the palest.
(async () => {
  const box = document.querySelector('.langs');
  if (!box) return;
  const rows = await (await fetch('/assets/langs.json', { cache: 'no-cache' })).json();
  const shade = (n, i) => `var(--lang${n === 'other' ? 6 : Math.min(i + 1, 5)})`;
  const pct = p => (p < 1 ? '<1' : Math.round(p)) + '%';
  box.querySelector('.lang-bar').innerHTML = rows
    .map(([n, , p], i) => `<i style="flex:${p};background:${shade(n, i)}" title="${n} ${pct(p)}"></i>`).join('');
  box.querySelector('.lang-key').innerHTML = rows.filter(r => r[0] !== 'other')
    .map(([n, , p], i) => `<span><i style="background:${shade(n, i)}"></i>${n} <em>${pct(p)}</em></span>`).join('');
  box.setAttribute('aria-label', 'Languages across my GitHub repos: ' + rows.map(([n, , p]) => `${n} ${pct(p)}`).join(', '));
})().catch(() => {});
