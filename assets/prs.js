// Refresh the open source PR lists in the browser, so they are current on every load.
// Same query and markup as scripts/prs.py, which bakes the fallback rows every 4h.
// Replaces the rows between <!-- prs:start/end --> (home, latest 1) and <!-- prs-all:start/end -->
// (open-source page, all) only on a good, non-empty response that differs. Errors, rate
// limits (search allows 10/min without a token) and empty results leave the baked rows alone.
(() => {
  const USER = 'frogscooper', KEY = 'prs:v1', TTL = 5 * 60 * 1000;
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');  // python html.escape

  const info = (it) => {
    const day = it.created_at.slice(0, 10), [y, m, d] = day.split('-');
    return { repo: esc(it.repository_url.split('/repos/')[1]), url: esc(it.html_url), title: esc(it.title),
      state: it.pull_request && it.pull_request.merged_at ? 'merged' : it.state,  // open / merged / closed
      day, date: `${MON[+m - 1]} ${d} ${y}` };
  };
  const row = (it) => {  // home: repo, title, state tag, date
    const p = info(it);
    return `<li class="pr"><span class="pr-repo">${p.repo}</span><a class="pr-title" href="${p.url}">${p.title}</a>` +
      `<span class="pr-tag ${p.state}">${p.state}</span><time class="pr-date" datetime="${p.day}">${p.date}</time></li>`;
  };
  const rowAll = (it) => {  // open-source page: title, state icon, quiet meta line
    const p = info(it), state = p.state === 'open' && it.draft ? 'draft' : p.state;
    return `<li class="os-pr"><a href="${p.url}">${p.title}</a>` +
      `<span class="os-state ${state}" role="img" aria-label="${state[0].toUpperCase() + state.slice(1)}">` +
      `<svg aria-hidden="true" focusable="false"><use href="#oi-${state}"/></svg></span>` +
      `<span class="os-meta">${p.repo} #${it.number} &middot; <time datetime="${p.day}">${p.date}</time></span></li>`;
  };
  const block = (rows, indent) => { const pad = ' '.repeat(indent); return '\n' + rows.map((r) => pad + r).join('\n') + '\n' + pad; };

  // The nodes between <!-- name:start --> and <!-- name:end -->, or null if the markers are missing.
  const between = (name) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    let start = null, n;
    while ((n = w.nextNode())) {
      const t = n.data.trim();
      if (t === name + ':start') start = n;
      else if (t === name + ':end' && start && start.parentNode === n.parentNode) return [start, n];
    }
    return null;
  };
  const fill = (name, html) => {
    const m = between(name);
    if (!m) return;
    const [start, end] = m, range = document.createRange();
    range.setStartAfter(start); range.setEndBefore(end);
    const fresh = range.createContextualFragment(html);
    const a = document.createElement('div'), b = document.createElement('div');
    a.append(range.cloneContents()); b.append(fresh.cloneNode(true));
    if (a.innerHTML === b.innerHTML) return;  // already current, nothing to swap
    range.deleteContents();
    end.before(fresh);
  };

  const fetchAll = async () => {
    const q = encodeURIComponent(`is:pr author:${USER} -user:${USER}`);
    let items = [];
    for (let page = 1; page <= 10; page++) {  // search caps at 1000 results
      const r = await fetch(`https://api.github.com/search/issues?sort=created&order=desc&per_page=100&page=${page}&q=${q}`,
        { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) return null;  // 403/429 rate limit or any error: keep the baked rows
      const batch = (await r.json()).items || [];
      items = items.concat(batch);
      if (batch.length < 100) break;
    }
    return items.map((it) => ({ repository_url: it.repository_url, html_url: it.html_url, title: it.title,
      state: it.state, draft: !!it.draft, number: it.number, created_at: it.created_at,
      pull_request: { merged_at: it.pull_request && it.pull_request.merged_at } }));
  };

  const load = async () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.t < TTL && c.items.length) return c.items;
    } catch (e) {}
    const items = await fetchAll();
    if (items && items.length) try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), items })); } catch (e) {}
    return items;
  };

  load().then((items) => {
    if (!items || !items.length) return;
    fill('prs', block(items.slice(0, 1).map(row), 16));
    fill('prs-all', block(items.map(rowAll), 8));
  }).catch(() => {});
})();
