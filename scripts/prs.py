# Refresh the "Open source" PR list in index.html by hand:
#   python3 scripts/prs.py index.html
# Reads GitHub's public search API (no token needed) and rewrites the rows between
# <!-- prs:start --> and <!-- prs:end -->. Only PRs to repos not owned by frogscooper.
import json, re, sys, html, datetime, urllib.parse, urllib.request

USER, N = 'frogscooper', 5

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': USER + '-site', 'Accept': 'application/vnd.github+json'})
    return json.load(urllib.request.urlopen(req, timeout=30))

q = f'is:pr author:{USER} -user:{USER}'
items = get('https://api.github.com/search/issues?sort=created&order=desc&per_page=%d&q=%s'
            % (N, urllib.parse.quote(q)))['items']
rows = []
for it in items:
    repo = it['repository_url'].split('/repos/')[1]
    state = 'merged' if it['pull_request'].get('merged_at') else it['state']  # open / merged / closed
    day = datetime.date.fromisoformat(it['created_at'][:10])
    rows.append(
        f'<li class="pr"><span class="pr-repo">{html.escape(repo)}</span>'
        f'<a class="pr-title" href="{html.escape(it["html_url"])}">{html.escape(it["title"])}</a>'
        f'<span class="pr-tag {state}">{state}</span>'
        f'<time class="pr-date" datetime="{day}">{day.strftime("%b %d %Y").lower()}</time></li>')

path = sys.argv[1]
s = open(path, encoding='utf-8').read()
block = '<!-- prs:start -->\n' + '\n'.join('                ' + r for r in rows) + '\n                <!-- prs:end -->'
s2, n = re.subn(r'<!-- prs:start -->.*?<!-- prs:end -->', lambda m: block, s, flags=re.S)
assert n == 1, 'markers not found'
if s2 != s:
    open(path, 'w', encoding='utf-8').write(s2)
print(len(rows), 'PRs', 'updated' if s2 != s else 'unchanged')
